// bildirim-gonder — Hatırlatma bildirimleri (Web Push). Yalnız zamanlanmış iş çağırır (x-admin-token kasadaki admin_token).
// Kural (CLAUDE.md §2): o gün hiç ders yapılmadıysa, günde en fazla 2 bildirim (okul sonrası + yatmadan önce), 20.30'dan sonra yok.
// Mesajlar suçlamaz, korkutmaz (§1-7): "Pi üzgün", "serini kaybedeceksin" gibi cümle yok; merak ve kısa bir davet.
// { "kur": true } → VAPID anahtarları yoksa üretip kasaya koyar, herkese açık anahtarı döndürür.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import * as webpush from "jsr:@negrel/webpush@0.5.0";

const ILETISIM = "https://ankka552.github.io/matematik-yolu/";
const SON_DAKIKA = 20 * 60 + 30;           // 20.30'dan sonra asla
const PENCERE = 60;                         // saatinden en fazla 60 dk sonra gönderilebilir (geciken iş eski bildirim atmasın)

type Mesaj = { t: string; b: string };
const OKUL: Mesaj[] = [
  { t: "Pi seni bekliyor 🚀", b: "Bugün 5 dakikalık bir maceraya ne dersin?" },
  { t: "Haritada sıradaki durak hazır ⭐", b: "Matematik Diyarı'nda yeni bir yıldız seni bekliyor." },
  { t: "Bugünün bilmecesi geldi 🧩", b: "Pi senin için kısa bir ders hazırladı." },
  { t: "Bir sandık sallanıyor 🎁", b: "Bir ders bitir, bakalım içinden ne çıkacak?" },
  { t: "Komşular seni soruyor 👋", b: "Pergo, Bilge ve Aşçı Dilim yeni ipuçlarıyla bekliyor." },
];
const AKSAM: Mesaj[] = [
  { t: "Yatmadan önce 3 dakika? 🌙", b: "Tek bir kısa ders yeter. Sonra iyi uykular!" },
  { t: "Günün son macerası ⭐", b: "Uyumadan önce kısa bir tekrar, öğrendiğini pekiştirir." },
  { t: "Pi iyi geceler demeden önce 🌙", b: "Kısa bir soru turu yapalım mı?" },
];
const seriMesaj = (seri: number, aksam: boolean): Mesaj => aksam
  ? { t: `🔥 Serin ${seri} gün oldu`, b: "Bugünü de eklemek için kısa bir ders yeter. İyi uykular!" }
  : { t: `🔥 ${seri} günlük serin seni bekliyor`, b: "Kısa bir dersle ateşi canlı tut!" };

const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
const dakika = (s: string) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ hata: "POST bekleniyor" }, 405);
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: yetki } = await sb.rpc("admin_token_dogru", { t: req.headers.get("x-admin-token") ?? "" });
  if (yetki !== true) return json({ hata: "yetkisiz" }, 401);
  const govde = await req.json().catch(() => ({})) as { kur?: boolean; dene?: string };

  // 1) VAPID anahtarları (kasada; yoksa bir kez üret)
  let ham = (await sb.rpc("bildirim_vapid_al")).data as string | null;
  if (!ham) {
    const k = await webpush.generateVapidKeys({ extractable: true });
    const ex = await webpush.exportVapidKeys(k);
    const pub = await webpush.exportApplicationServerKey(k);
    await sb.rpc("bildirim_vapid_kaydet", { p: { ...ex, pub } });
    ham = (await sb.rpc("bildirim_vapid_al")).data as string | null;
    if (!ham) return json({ hata: "anahtar kaydedilemedi" }, 500);
  }
  const ex = JSON.parse(ham);
  if (govde.kur) return json({ pub: ex.pub });
  const vapidKeys = await webpush.importVapidKeys({ publicKey: ex.publicKey, privateKey: ex.privateKey }, { extractable: false });
  const sunucu = await webpush.ApplicationServer.new({ contactInformation: ILETISIM, vapidKeys });

  // 2) Türkiye saati (UTC+3, yaz saati yok)
  const tr = new Date(Date.now() + 3 * 3600e3), gun = tr.toISOString().slice(0, 10), dk = tr.getUTCHours() * 60 + tr.getUTCMinutes();
  if (!govde.dene && (dk > SON_DAKIKA || dk < 15 * 60)) return json({ gonderilen: 0, neden: "saat dışı" });

  let q = sb.from("bildirim_abonelik").select("*").eq("acik", true);
  q = govde.dene ? q.eq("endpoint", govde.dene) : q.or(`son_ders.is.null,son_ders.lt.${gun}`);
  const { data: satirlar, error } = await q.limit(5000);
  if (error) return json({ hata: error.message }, 500);

  let gonderilen = 0, silinen = 0, hata = 0;
  for (const r of satirlar ?? []) {
    const s1 = dakika(r.saat1), s2 = Math.min(dakika(r.saat2), SON_DAKIKA);
    let tip: "okul" | "aksam" | null = null;
    if (govde.dene) tip = dk >= s2 - 30 ? "aksam" : "okul";
    else if (r.gonderildi2 !== gun && dk >= s2 && dk < s2 + PENCERE) tip = "aksam";
    else if (r.gonderildi1 !== gun && r.gonderildi2 !== gun && dk >= s1 && dk < s1 + PENCERE && dk < s2) tip = "okul";
    if (!tip) continue;
    const havuz = tip === "aksam" ? AKSAM : OKUL, sira = (Number(gun.replaceAll("-", "")) + r.endpoint.length) % (havuz.length + 1);
    const m = r.seri >= 2 && sira === havuz.length ? seriMesaj(r.seri, tip === "aksam") : havuz[sira % havuz.length];
    try {
      await sunucu.subscribe({ endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } })
        .pushTextMessage(JSON.stringify({ baslik: m.t, metin: m.b, tip }), { ttl: PENCERE * 60 } as webpush.PushMessageOptions);
      gonderilen++;
      if (!govde.dene) await sb.from("bildirim_abonelik").update(tip === "aksam" ? { gonderildi2: gun } : { gonderildi1: gun }).eq("endpoint", r.endpoint);
    } catch (e) {
      if (e instanceof webpush.PushMessageError && e.isGone()) { await sb.from("bildirim_abonelik").delete().eq("endpoint", r.endpoint); silinen++; }
      else hata++;
    }
  }
  return json({ gun, dk, aday: satirlar?.length ?? 0, gonderilen, silinen, hata });
});

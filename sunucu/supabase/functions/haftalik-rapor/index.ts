// =====================================================================
// haftalik-rapor — her pazar akşamı velilere gelişim raporu gönderir.
// Kanallar: e-posta (Resend) ve/veya WhatsApp (Meta WhatsApp Cloud API, onaylı şablon).
// Gizli değerler: RESEND_API_KEY, RAPOR_GONDEREN (örn. "Matematik Yolu <rapor@alanadin.com>"),
//                WA_TOKEN, WA_PHONE_ID, WA_TEMPLATE (örn. "haftalik_rapor", dil tr)
// Yalnızca zamanlanmış iş çağırır: x-admin-token başlığı kasadaki admin_token ile eşleşmeli.
// =====================================================================
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const GUN = 864e5;
type Durum = { sessions?: { at: number; n: number; acc: number; ms: number; xp: number }[]; streak?: number; skills?: Record<string, { pL: number; n: number; recent?: number[] }>; mis?: Record<string, { n: number; fixed: number }> };
const BECERI_AD: Record<string, string> = JSON.parse(Deno.env.get("BECERI_ADLARI") ?? "{}"); // isteğe bağlı: {"f_tur":"Kesir Türleri",...}

function ozet(ad: string, d: Durum) {
  const hafta = Date.now() - 7 * GUN, ses = (d.sessions ?? []).filter((s) => s.at >= hafta);
  const dk = Math.round(ses.reduce((a, s) => a + s.ms, 0) / 60000), soru = ses.reduce((a, s) => a + s.n, 0);
  const dogruluk = soru ? Math.round(100 * ses.reduce((a, s) => a + s.acc * s.n, 0) / soru) : 0;
  const gun = new Set(ses.map((s) => new Date(s.at).toISOString().slice(0, 10))).size;
  const etkin = (s: { pL: number; recent?: number[] }) => { const r = s.recent ?? []; return r.length < 5 ? s.pL : Math.min(s.pL, r.reduce((a, b) => a + b, 0) / r.length + 0.2); };
  const bec = Object.entries(d.skills ?? {}).filter(([, s]) => s.n > 0).map(([k, s]) => ({ k, m: etkin(s) }));
  const guclu = bec.filter((b) => b.m >= 0.7).sort((a, b) => b.m - a.m).slice(0, 3).map((b) => BECERI_AD[b.k] ?? b.k);
  const destek = bec.filter((b) => b.m < 0.5).sort((a, b) => a.m - b.m).slice(0, 3).map((b) => BECERI_AD[b.k] ?? b.k);
  const metin = [
    `📘 Matematik Yolu — ${ad} için haftalık rapor`,
    `⏱ ${gun} gün çalıştı, ${dk} dakika, ${soru} soru. ✅ Doğruluk %${dogruluk}. 🔥 Seri ${d.streak ?? 0} gün.`,
    guclu.length ? `💪 Güçlü: ${guclu.join(", ")}` : "",
    destek.length ? `🎯 Destek gereken: ${destek.join(", ")}` : "",
    gun === 0 ? "Bu hafta hiç çalışmadı. Günde 10 dakikalık kısa bir ders, alışkanlık için yeterli." : "Düzenli çalışmasını desteklediğiniz için teşekkürler!",
  ].filter(Boolean).join("\n");
  return { metin, gun, dk, soru, dogruluk };
}

Deno.serve(async (req) => {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: yetki } = await sb.rpc("admin_token_dogru", { t: req.headers.get("x-admin-token") ?? "" });
  if (yetki !== true) return new Response("yetkisiz", { status: 401 });
  const { data: veliler, error } = await sb.from("veliler").select("id, ad, telefon, eposta, rapor_kanali, ogrenciler(id, ad, ogrenci_durum(durum))").neq("rapor_kanali", "kapali");
  if (error) return new Response(error.message, { status: 500 });
  let gonderilen = 0;
  for (const v of veliler ?? []) {
    // Rıza kontrolü: en son kayıt onaylı olmalı
    const { data: riza } = await sb.from("rizalar").select("onay").eq("veli_id", v.id).order("zaman", { ascending: false }).limit(1);
    if (!riza?.[0]?.onay) continue;
    for (const o of (v as any).ogrenciler ?? []) {
      const d: Durum = o.ogrenci_durum?.durum ?? {};
      const r = ozet(o.ad, d);
      const kanallar = v.rapor_kanali === "ikisi" ? ["eposta", "whatsapp"] : [v.rapor_kanali];
      for (const k of kanallar) {
        let ok = false, hata = "";
        try {
          if (k === "eposta" && v.eposta && Deno.env.get("RESEND_API_KEY")) {
            const res = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
              body: JSON.stringify({ from: Deno.env.get("RAPOR_GONDEREN"), to: [v.eposta], subject: `Matematik Yolu – ${o.ad} haftalık rapor`, text: r.metin }) });
            ok = res.ok; if (!ok) hata = await res.text();
          }
          if (k === "whatsapp" && v.telefon && Deno.env.get("WA_TOKEN")) {
            // İşletmenin başlattığı WhatsApp mesajı Meta onaylı şablon gerektirir. Şablon gövdesi örn.:
            // "{{1}} bu hafta {{2}} gün, {{3}} dakika çalıştı. Doğruluk %{{4}}. Ayrıntılar uygulamada."
            const res = await fetch(`https://graph.facebook.com/v20.0/${Deno.env.get("WA_PHONE_ID")}/messages`, { method: "POST", headers: { Authorization: `Bearer ${Deno.env.get("WA_TOKEN")}`, "Content-Type": "application/json" },
              body: JSON.stringify({ messaging_product: "whatsapp", to: v.telefon, type: "template", template: { name: Deno.env.get("WA_TEMPLATE") ?? "haftalik_rapor", language: { code: "tr" },
                components: [{ type: "body", parameters: [o.ad, String(r.gun), String(r.dk), String(r.dogruluk)].map((t) => ({ type: "text", text: t })) }] } }) });
            ok = res.ok; if (!ok) hata = await res.text();
          }
        } catch (e) { hata = String(e); }
        await sb.from("rapor_kayitlari").insert({ ogrenci_id: o.id, kanal: k, basarili: ok, hata: hata.slice(0, 500) || null });
        if (ok) gonderilen++;
      }
    }
  }
  return Response.json({ gonderilen });
});

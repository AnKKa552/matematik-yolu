// veli-eposta — Haftalık veli raporunu e-postayla gönderir (06.11.2026).
// Uygulama (Veli alanı) çağırır: durum / kaydet / rapor / sil. Doğrulama sayfası (matematikyolu.com/eposta/): onayla / cikis.
// Zamanlanmış iş (x-admin-token): gonder — her pazar 18.00, son 8 günde yüklenmiş raporu gönderir, metni siler.
// Gönderim sağlayıcısı ortam değişkeniyle seçilir: EPOSTA_SAGLAYICI = brevo | resend, EPOSTA_ANAHTAR (Supabase Secrets),
// EPOSTA_GONDEREN (varsayılan rapor@matematikyolu.com). Anahtar yoksa fonksiyon «kurulu değil» der, uygulamada kart görünmez.
// Kurallar: onaylanmamış adrese rapor gitmez; o hafta çalışılmadıysa e-posta gitmez; her e-postada tek dokunuşla çıkış.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const SITE = "https://matematikyolu.com";
const SAGLAYICI = (Deno.env.get("EPOSTA_SAGLAYICI") ?? "").toLowerCase();
const ANAHTAR = Deno.env.get("EPOSTA_ANAHTAR") ?? "";
const GONDEREN = Deno.env.get("EPOSTA_GONDEREN") ?? "rapor@matematikyolu.com";
const KURULU = !!ANAHTAR && (SAGLAYICI === "brevo" || SAGLAYICI === "resend");
const RIZALAR = new Set(["rapor-eposta-v1"]);
const AG_GUNLUK = 10, ADRES_GUNLUK = 3, CIHAZ_GUNLUK = 3, RAPOR_EN_UZUN = 6000;

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info, x-admin-token", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const yanit = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const ozet = async (s: string) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
const belirtec = () => { const b = new Uint8Array(24); crypto.getRandomValues(b); return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
const SIR = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
async function imza(id: string) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(SIR), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode("cikis:" + id))).slice(0, 32);
}
const cikisAdresi = async (id: string) => `${SITE}/eposta/?cikis=${id}.${await imza(id)}`;
const maskele = (e: string) => { const [a, d] = e.split("@"); return (a.length <= 2 ? a[0] + "*" : a.slice(0, 2) + "***") + "@" + d; };
const gecerliEposta = (e: string) => e.length <= 254 && /^[^\s@<>()",;:]{1,64}@[a-z0-9.-]{1,253}\.[a-z]{2,24}$/.test(e);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const trGun = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10);

// ---------- Gönderim ----------
async function gonder(kime: string, konu: string, html: string, metin: string, cikis?: string) {
  if (!KURULU) throw new Error("kurulu değil");
  // Tek dokunuşla çıkış (RFC 8058): e-posta istemcisi doğrudan bu fonksiyona POST eder
  const tek = cikis ? `${Deno.env.get("SUPABASE_URL")}/functions/v1/veli-eposta?cikis=${cikis.split("cikis=")[1]}` : "";
  const basliklar: Record<string, string> = cikis ? { "List-Unsubscribe": `<${tek}>, <mailto:destek@matematikyolu.com?subject=rapor-cikis>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } : {};
  let r: Response;
  if (SAGLAYICI === "brevo") {
    r = await fetch("https://api.brevo.com/v3/smtp/email", { method: "POST", headers: { "api-key": ANAHTAR, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({ sender: { name: "Matematik Yolu", email: GONDEREN }, to: [{ email: kime }], replyTo: { email: "destek@matematikyolu.com" }, subject: konu, htmlContent: html, textContent: metin, headers: basliklar }) });
  } else {
    r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${ANAHTAR}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: `Matematik Yolu <${GONDEREN}>`, to: [kime], reply_to: "destek@matematikyolu.com", subject: konu, html, text: metin, headers: basliklar }) });
  }
  if (!r.ok) throw new Error(`gönderim ${r.status}: ${(await r.text()).slice(0, 200)}`);
}

const kabuk = (govde: string, alt: string) => `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:#F5F4FF;font-family:Arial,Helvetica,sans-serif;color:#1E1B4B">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<div style="font-size:20px;font-weight:bold;color:#5B4BFF;margin-bottom:14px">📘 Matematik Yolu</div>
<div style="background:#fff;border:2px solid #E3E1F3;border-radius:16px;padding:20px;font-size:16px;line-height:1.55">${govde}</div>
<div style="font-size:12px;color:#6B6893;margin-top:14px;line-height:1.5">${alt}</div>
</div></body></html>`;

function dogrulamaEpostasi(ad: string | null, adres: string) {
  const kimin = ad ? `<b>${esc(ad)}</b> için ` : "";
  const html = kabuk(`<p style="margin:0 0 12px">Merhaba,</p>
<p style="margin:0 0 12px">Matematik Yolu uygulamasının Veli alanında bu e-posta adresi, ${kimin}haftalık gelişim raporunun gönderileceği adres olarak yazıldı.</p>
<p style="margin:0 0 18px">Siz istediyseniz aşağıdaki düğmeyle onaylayın. Onaylamazsanız size hiçbir rapor gönderilmez ve adresiniz 7 gün içinde silinir.</p>
<p style="margin:0 0 6px"><a href="${adres}" style="display:inline-block;background:#5B4BFF;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:12px">Adresimi onayla</a></p>`,
    `Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz. Sorularınız için: destek@matematikyolu.com · <a href="${SITE}/gizlilik/" style="color:#5B4BFF">Gizlilik politikası</a>`);
  const metin = `Merhaba,\n\nMatematik Yolu uygulamasının Veli alanında bu adres, ${ad ? ad + " için " : ""}haftalık gelişim raporunun gönderileceği adres olarak yazıldı.\nSiz istediyseniz şu bağlantıyla onaylayın: ${adres}\n\nOnaylamazsanız size rapor gönderilmez ve adresiniz 7 gün içinde silinir.\nSorularınız için: destek@matematikyolu.com`;
  return { html, metin };
}

function raporEpostasi(rapor: string, cikis: string) {
  const satirlar = rapor.split("\n").map((s) => s.trim() === "" ? `<div style="height:8px"></div>` : `<div style="margin:0 0 6px">${esc(s)}</div>`).join("");
  const html = kabuk(`${satirlar}<p style="margin:18px 0 0"><a href="${SITE}/" style="display:inline-block;background:#FFC531;color:#1E1B4B;text-decoration:none;font-weight:bold;padding:11px 20px;border-radius:12px">Uygulamayı aç</a></p>`,
    `Bu e-postayı, Matematik Yolu Veli alanında haftalık raporu istediğiniz için alıyorsunuz. Çocuğunuzun o hafta çalışmadığı haftalarda e-posta gönderilmez.<br>
<a href="${cikis}" style="color:#5B4BFF">Raporları artık istemiyorum</a> · <a href="${SITE}/gizlilik/" style="color:#5B4BFF">Gizlilik politikası</a> · destek@matematikyolu.com`);
  const metin = `${rapor}\n\n—\nUygulama: ${SITE}/\nRaporları artık istemiyorsanız: ${cikis}\nSorularınız için: destek@matematikyolu.com`;
  return { html, metin };
}

// ---------- İstek ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return yanit({ hata: "POST bekleniyor" }, 405);
  let g: Record<string, unknown> = {};
  const tekCikis = new URL(req.url).searchParams.get("cikis");
  if (tekCikis) g = { is: "cikis", token: tekCikis };          // List-Unsubscribe-Post (gövde form biçiminde)
  else { try { g = await req.json(); } catch { return yanit({ hata: "istek" }, 400); } }
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, SIR);
  const is = String(g.is ?? "");
  const cihaz = String(g.cihaz ?? ""), gizli = String(g.gizli ?? "");
  const cihazGecerli = /^[A-Za-z0-9_-]{16,40}$/.test(cihaz) && /^[A-Za-z0-9_-]{16,64}$/.test(gizli);
  const satirAl = async () => (await sb.from("veli_eposta").select("*").eq("cihaz", cihaz).maybeSingle()).data as Record<string, any> | null;
  const yetkili = async (s: Record<string, any> | null) => !!s && s.gizli_ozet === await ozet(gizli);

  try {
    if (is === "durum") {
      if (!KURULU) return yanit({ kurulu: false });
      if (!cihazGecerli) return yanit({ kurulu: true, var: false });
      const s = await satirAl();
      if (!s || !(await yetkili(s))) return yanit({ kurulu: true, var: false });
      return yanit({ kurulu: true, var: true, eposta: maskele(s.eposta), onayli: !!s.onaylandi, son_gonderim: s.son_gonderim });
    }

    if (is === "kaydet") {
      if (!KURULU) return yanit({ hata: "kurulu_degil" });
      const eposta = String(g.eposta ?? "").trim().toLowerCase(), riza = String(g.riza ?? "");
      const ad = String(g.ad ?? "").replace(/[<>"&]/g, "").trim().slice(0, 30) || null;
      if (!cihazGecerli) return yanit({ hata: "cihaz" }, 400);
      if (!gecerliEposta(eposta)) return yanit({ hata: "eposta" });
      if (!RIZALAR.has(riza)) return yanit({ hata: "riza" }, 400);
      const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
      const ag = (await ozet(SIR.slice(0, 16) + ip)).slice(0, 24);
      if (((await sb.rpc("veli_eposta_say", { p_anahtar: "ag:" + ag })).data ?? 99) > AG_GUNLUK) return yanit({ hata: "cok" });
      if (((await sb.rpc("veli_eposta_say", { p_anahtar: "adres:" + (await ozet(eposta)).slice(0, 24) })).data ?? 99) > ADRES_GUNLUK) return yanit({ hata: "cok" });
      const s = await satirAl();
      if (s && !(await yetkili(s))) return yanit({ hata: "yetkisiz" }, 403);
      const gun = trGun(), n = s && s.dogrulama_gun === gun ? s.dogrulama_n : 0;
      if (n >= CIHAZ_GUNLUK) return yanit({ hata: "cok" });
      const tok = belirtec();
      const alanlar = { eposta, ad, riza, riza_at: new Date().toISOString(), onay_ozet: await ozet(tok), dogrulama_n: n + 1, dogrulama_gun: gun,
        onaylandi: s && s.eposta === eposta ? s.onaylandi : null };
      if (s) await sb.from("veli_eposta").update(alanlar).eq("id", s.id);
      else await sb.from("veli_eposta").insert({ cihaz, gizli_ozet: await ozet(gizli), ...alanlar });
      if (alanlar.onaylandi) return yanit({ ok: true, eposta: maskele(eposta), onayli: true });
      const e = dogrulamaEpostasi(ad, `${SITE}/eposta/?onay=${tok}`);
      await gonder(eposta, "Matematik Yolu: e-posta adresinizi onaylayın", e.html, e.metin);
      return yanit({ ok: true, eposta: maskele(eposta), onayli: false });
    }

    if (is === "onayla") {
      const tok = String(g.token ?? "");
      if (!/^[A-Za-z0-9_-]{20,64}$/.test(tok)) return yanit({ hata: "gecersiz" });
      const { data: s } = await sb.from("veli_eposta").select("id,eposta,olusturma").eq("onay_ozet", await ozet(tok)).maybeSingle();
      if (!s) return yanit({ hata: "gecersiz" });
      await sb.from("veli_eposta").update({ onaylandi: new Date().toISOString(), onay_ozet: null }).eq("id", s.id);
      return yanit({ ok: true, eposta: maskele(s.eposta) });
    }

    if (is === "rapor") {
      if (!cihazGecerli) return yanit({ hata: "cihaz" }, 400);
      const rapor = String(g.rapor ?? "").slice(0, RAPOR_EN_UZUN);
      if (rapor.length < 20) return yanit({ hata: "rapor" }, 400);
      const s = await satirAl();
      if (!s || !(await yetkili(s))) return yanit({ hata: "yok" });
      if (!s.onaylandi) return yanit({ hata: "onaysiz" });
      await sb.from("veli_eposta").update({ rapor, rapor_at: new Date().toISOString() }).eq("id", s.id);
      return yanit({ ok: true });
    }

    if (is === "sil") {          // uygulamadan (cihaz + gizli)
      if (!cihazGecerli) return yanit({ hata: "cihaz" }, 400);
      const s = await satirAl();
      if (s && (await yetkili(s))) await sb.from("veli_eposta").delete().eq("id", s.id);
      return yanit({ ok: true });
    }

    if (is === "cikis") {        // e-postadaki bağlantıdan (satır kimliği + imza)
      const [id, im] = String(g.token ?? "").split(".");
      if (!/^[0-9a-f-]{36}$/.test(id ?? "") || !im || im !== await imza(id)) return yanit({ hata: "gecersiz" });
      await sb.from("veli_eposta").delete().eq("id", id);
      return yanit({ ok: true });
    }

    if (is === "gonder") {       // zamanlanmış iş
      const { data: yetki } = await sb.rpc("admin_token_dogru", { t: req.headers.get("x-admin-token") ?? "" });
      if (yetki !== true) return yanit({ hata: "yetkisiz" }, 401);
      const simdi = Date.now();
      // Temizlik: 7 günde onaylanmayan adresler, eski sayaçlar
      await sb.from("veli_eposta").delete().is("onaylandi", null).lt("olusturma", new Date(simdi - 7 * 864e5).toISOString());
      await sb.from("veli_eposta_sayac").delete().lt("gun", new Date(simdi - 3 * 864e5).toISOString().slice(0, 10));
      if (!KURULU) return yanit({ gonderilen: 0, neden: "kurulu değil" });
      const { data: satirlar } = await sb.from("veli_eposta").select("id,eposta,ad,rapor,son_gonderim").not("onaylandi", "is", null).not("rapor", "is", null)
        .gt("rapor_at", new Date(simdi - 8 * 864e5).toISOString()).limit(2000);
      let gonderilen = 0, hata = 0;
      for (const s of satirlar ?? []) {
        if (s.son_gonderim && simdi - Date.parse(s.son_gonderim) < 5 * 864e5) continue;
        try {
          const cikis = await cikisAdresi(s.id), e = raporEpostasi(s.rapor, cikis);
          await gonder(s.eposta, `Haftalık matematik raporu${s.ad ? " · " + s.ad : ""}`, e.html, e.metin, cikis);
          await sb.from("veli_eposta").update({ son_gonderim: new Date().toISOString(), rapor: null }).eq("id", s.id);
          gonderilen++;
        } catch (_) { hata++; }
      }
      return yanit({ gonderilen, hata });
    }
    return yanit({ hata: "is" }, 400);
  } catch (e) {
    return yanit({ hata: "sunucu", ayrinti: String(e).slice(0, 120) }, 500);
  }
});

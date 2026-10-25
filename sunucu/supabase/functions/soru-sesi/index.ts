// soru-sesi — Pi, sorunun metnini kendi sesiyle (ElevenLabs, Damla) okur. Bir kez üretilen ses depoda saklanır;
// aynı soru tekrar gelince hiç kredi harcanmaz. Uygulama önce depoya bakar, yoksa bu fonksiyonu çağırır.
// Güvenlik: metin yalnızca uygulamanın üretebileceği kelimelerden oluşabilir (sozluk.ts) → Pi'ye keyfî cümle söyletilemez.
// Maliyet sınırı: cihaz başına günde CIHAZ_ADET yeni ses, tüm uygulama için günde TOPLAM_KARAKTER karakter.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { SOZLUK } from "./sozluk.ts";

const VOICE = "A2XgcJ6lQVEFeIaIUyrc", MODEL = "eleven_v4", AYAR = { stability: 0.5, similarity_boost: 0.8, use_speaker_boost: true };
const CIHAZ_ADET = +(Deno.env.get("SORU_SESI_CIHAZ_ADET") ?? 100);
const TOPLAM_KARAKTER = +(Deno.env.get("SORU_SESI_TOPLAM_KARAKTER") ?? 6000);
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const yanit = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const ozet = async (s: string) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, "0")).join("");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return yanit({ hata: "POST bekleniyor" }, 405);
  let metin = "";
  try { metin = String((await req.json()).metin ?? "").replace(/\s+/g, " ").trim(); } catch { return yanit({ hata: "geçersiz istek" }, 400); }
  // 1) Biçim ve sözlük denetimi
  if (metin.length < 3 || metin.length > 260) return yanit({ hata: "uzunluk" }, 400);
  if (!/^[ !"'(),.0-9:?A-Za-zÇÖÜçöüĞğİıŞşâîû-]+$/.test(metin)) return yanit({ hata: "karakter" }, 400);
  const kelimeler = metin.toLocaleLowerCase("tr-TR").match(/[a-zçğıöşüâîû]+/g) ?? [];
  const yabanci = kelimeler.filter((w) => !SOZLUK.has(w));
  if (yabanci.length) return yanit({ hata: "sozluk", kelime: yabanci.slice(0, 3) }, 422);
  const anahtar = (await ozet(metin)).slice(0, 32), yol = `soru/${anahtar}.mp3`;
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const depo = sb.storage.from("sesler"), url = depo.getPublicUrl(yol).data.publicUrl;
  // 2) Daha önce üretildiyse hemen dön (kredi yok)
  const var_ = await fetch(url, { method: "HEAD" });
  if (var_.ok) return yanit({ url, yeni: false });
  // 3) Kota
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "bilinmiyor";
  const cihaz = "ip:" + (await ozet("matematik-yolu|" + ip)).slice(0, 24);
  const { data: hak, error: hErr } = await sb.rpc("soru_sesi_hak", { p_anahtar: cihaz, p_karakter: metin.length, p_cihaz_adet: CIHAZ_ADET, p_toplam_karakter: TOPLAM_KARAKTER });
  if (hErr) return yanit({ hata: "kota okunamadı" }, 500);
  if (hak !== true) return yanit({ hata: "kota" }, 429);
  // 4) Üret ve sakla
  const KEY = Deno.env.get("ELEVENLABS_API_KEY") || (await sb.rpc("gizli_al", { ad: "elevenlabs_api_key" })).data;
  if (!KEY) return yanit({ hata: "anahtar yok" }, 500);
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_128`, { method: "POST", headers: { "xi-api-key": KEY, "Content-Type": "application/json", Accept: "audio/mpeg" }, body: JSON.stringify({ text: metin, model_id: MODEL, voice_settings: AYAR }) });
  if (!r.ok) return yanit({ hata: "ses üretilemedi", durum: r.status }, 502);
  const { error } = await depo.upload(yol, new Uint8Array(await r.arrayBuffer()), { contentType: "audio/mpeg", upsert: true, cacheControl: "31536000" });
  if (error) return yanit({ hata: "kaydedilemedi" }, 500);
  return yanit({ url, yeni: true });
});

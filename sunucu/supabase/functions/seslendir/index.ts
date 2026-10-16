// =====================================================================
// seslendir — Pi'nin seslerini ElevenLabs ile üretip Supabase Storage'a koyar.
// ElevenLabs anahtarı SUNUCUDA gizli kalır (Secrets), telefonda/kodda durmaz.
// ElevenLabs anahtarı: Secrets (ELEVENLABS_API_KEY) ya da kasa (vault: elevenlabs_api_key). Yönetici parolası veritabanı kasasında (vault: admin_token), admin_token_dogru() ile denetlenir.
// Çağrı: POST { kayitlar:[{key,text}], efektler:[{key,text,sure}] }  başlık: x-admin-token
// Her çağrıda en fazla 25 dosya üretir; kalan sayısını döner, tekrar çağrılır.
// =====================================================================
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const VOICE = Deno.env.get("PI_VOICE_ID") ?? "Hr3W7yWIljG9YBJn39oK";   // "Gamze – Cartoon Character"
const MODEL = Deno.env.get("PI_MODEL") ?? "eleven_multilingual_v2";
const AYAR = { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true };
const PARTI = 25;

type Kayit = { key: string; text: string; sure?: number };

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("POST bekleniyor", { status: 405 });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: yetki } = await sb.rpc("admin_token_dogru", { t: req.headers.get("x-admin-token") ?? "" });
  if (yetki !== true) return new Response("yetkisiz", { status: 401 });
  const KEY = Deno.env.get("ELEVENLABS_API_KEY") || (await sb.rpc("gizli_al", { ad: "elevenlabs_api_key" })).data;
  if (!KEY) return new Response("ElevenLabs anahtarı tanımlı değil", { status: 500 });
  const { kayitlar = [], efektler = [] } = await req.json() as { kayitlar?: Kayit[]; efektler?: Kayit[] };

  // Var olanları listele (tekrar üretip kredi harcamamak için)
  const varOlan = new Set<string>();
  for (let off = 0; ; off += 1000) {
    const { data, error } = await sb.storage.from("sesler").list("", { limit: 1000, offset: off });
    if (error) return new Response("depo okunamadı: " + error.message, { status: 500 });
    data.forEach((f) => varOlan.add(f.name.replace(/\.mp3$/, "")));
    if (data.length < 1000) break;
  }
  varOlan.delete("manifest.json");
  const isler = [...kayitlar.map((k) => ({ ...k, tur: "ses" })), ...efektler.map((k) => ({ ...k, tur: "efekt" }))].filter((k) => !varOlan.has(k.key));
  const yapilan: string[] = [], hatalar: string[] = [];
  for (const k of isler.slice(0, PARTI)) {
    const url = k.tur === "ses" ? `https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_64` : "https://api.elevenlabs.io/v1/sound-generation";
    const body = k.tur === "ses" ? { text: k.text, model_id: MODEL, voice_settings: AYAR } : { text: k.text, duration_seconds: k.sure ?? 1, prompt_influence: 0.45 };
    const r = await fetch(url, { method: "POST", headers: { "xi-api-key": KEY, "Content-Type": "application/json", Accept: "audio/mpeg" }, body: JSON.stringify(body) });
    if (!r.ok) { hatalar.push(`${k.key}: HTTP ${r.status} ${(await r.text()).slice(0, 120)}`); if ([401, 402, 403].includes(r.status)) break; continue; }
    const { error } = await sb.storage.from("sesler").upload(`${k.key}.mp3`, new Uint8Array(await r.arrayBuffer()), { contentType: "audio/mpeg", upsert: true, cacheControl: "31536000" });
    if (error) hatalar.push(`${k.key}: yükleme ${error.message}`); else { yapilan.push(k.key); varOlan.add(k.key); }
  }
  // Uygulamanın okuduğu liste
  const manifest = { voice_id: VOICE, model: MODEL, keys: [...varOlan].sort() };
  await sb.storage.from("sesler").upload("manifest.json", new Blob([JSON.stringify(manifest)], { type: "application/json" }), { upsert: true, contentType: "application/json", cacheControl: "60" });
  return Response.json({ uretilen: yapilan.length, kalan: Math.max(0, isler.length - yapilan.length - hatalar.length), toplam_hazir: manifest.keys.length, hatalar });
});

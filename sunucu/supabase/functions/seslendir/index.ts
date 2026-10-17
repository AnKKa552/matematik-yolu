// seslendir — Pi'nin seslerini ElevenLabs ile üretip Supabase Storage'a koyar.
// ElevenLabs anahtarı: Secrets (ELEVENLABS_API_KEY) ya da kasa (vault: elevenlabs_api_key). Yönetici parolası kasada (admin_token).
// Çağrı: POST { klasor?, kayitlar:[{key,text}], efektler:[{key,text,sure}], kopyalar:[{from,to}] }  başlık: x-admin-token
// klasor: ses sürümü klasörü (örn. "damla"). Boşsa kök (eski Gamze sesleri).
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const SURUM: Record<string, { voice: string; model: string; ayar: Record<string, unknown> }> = {
  "": { voice: "Hr3W7yWIljG9YBJn39oK", model: "eleven_multilingual_v2", ayar: { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true } },
  damla: { voice: "A2XgcJ6lQVEFeIaIUyrc", model: "eleven_v4", ayar: { stability: 0.5, similarity_boost: 0.8, use_speaker_boost: true } },
};
const PARTI = 15;
type Kayit = { key: string; text: string; sure?: number };

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("POST bekleniyor", { status: 405 });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: yetki } = await sb.rpc("admin_token_dogru", { t: req.headers.get("x-admin-token") ?? "" });
  if (yetki !== true) return new Response("yetkisiz", { status: 401 });
  const KEY = Deno.env.get("ELEVENLABS_API_KEY") || (await sb.rpc("gizli_al", { ad: "elevenlabs_api_key" })).data;
  if (!KEY) return new Response("ElevenLabs anahtarı tanımlı değil", { status: 500 });
  const { klasor = "", kayitlar = [], efektler = [], kopyalar = [] } = await req.json() as { klasor?: string; kayitlar?: Kayit[]; efektler?: Kayit[]; kopyalar?: { from: string; to: string }[] };
  if (!(klasor in SURUM)) return new Response("bilinmeyen klasör", { status: 400 });
  const S = SURUM[klasor], on = klasor ? klasor + "/" : "";
  const depo = sb.storage.from("sesler");

  const varOlan = new Set<string>();
  for (let off = 0; ; off += 1000) {
    const { data, error } = await depo.list(klasor, { limit: 1000, offset: off });
    if (error) return new Response("depo okunamadı: " + error.message, { status: 500 });
    data.filter((f) => f.name.endsWith(".mp3")).forEach((f) => varOlan.add(f.name.replace(/\.mp3$/, "")));
    if (data.length < 1000) break;
  }
  const hatalar: string[] = [], yapilan: string[] = [];
  // Kopyalar (örn. ses efektlerini yeni klasöre taşımak; kredi harcamaz)
  for (const k of kopyalar) {
    if (!/^[a-z0-9_]+$/.test(k.to) || varOlan.has(k.to)) continue;
    const { error } = await depo.copy(k.from, `${on}${k.to}.mp3`);
    if (error) hatalar.push(`kopya ${k.to}: ${error.message}`); else { varOlan.add(k.to); yapilan.push(k.to); }
  }
  const isler = [...kayitlar.map((k) => ({ ...k, tur: "ses" })), ...efektler.map((k) => ({ ...k, tur: "efekt" }))].filter((k) => !varOlan.has(k.key));
  for (const k of isler.slice(0, PARTI)) {
    // Depo yalnızca Latin harfli dosya adı kabul eder: geçersiz adda ElevenLabs'e hiç gidilmez (kredi yanmaz)
    if (!/^[a-z0-9_]+$/.test(k.key)) { hatalar.push(`${k.key}: geçersiz dosya adı, üretilmedi`); continue; }
    const url = k.tur === "ses" ? `https://api.elevenlabs.io/v1/text-to-speech/${S.voice}?output_format=mp3_44100_128` : "https://api.elevenlabs.io/v1/sound-generation";
    const body = k.tur === "ses" ? { text: k.text, model_id: S.model, voice_settings: S.ayar } : { text: k.text, duration_seconds: k.sure ?? 1, prompt_influence: 0.45 };
    const r = await fetch(url, { method: "POST", headers: { "xi-api-key": KEY, "Content-Type": "application/json", Accept: "audio/mpeg" }, body: JSON.stringify(body) });
    if (!r.ok) { hatalar.push(`${k.key}: HTTP ${r.status} ${(await r.text()).slice(0, 160)}`); if ([400, 401, 402, 403, 422].includes(r.status)) break; continue; }
    const { error } = await depo.upload(`${on}${k.key}.mp3`, new Uint8Array(await r.arrayBuffer()), { contentType: "audio/mpeg", upsert: true, cacheControl: "31536000" });
    if (error) hatalar.push(`${k.key}: yükleme ${error.message}`); else { yapilan.push(k.key); varOlan.add(k.key); }
  }
  const manifest = { voice_id: S.voice, model: S.model, keys: [...varOlan].sort() };
  await depo.upload(`${on}manifest.json`, new Blob([JSON.stringify(manifest)], { type: "application/json" }), { upsert: true, contentType: "application/json", cacheControl: "60" });
  return Response.json({ klasor, uretilen: yapilan.length, kalan: Math.max(0, isler.length - yapilan.length - hatalar.length), toplam_hazir: manifest.keys.length, hatalar });
});

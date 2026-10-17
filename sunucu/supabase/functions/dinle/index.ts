// dinle — geliştirici aracı: kısa bir ses kaydını ElevenLabs Speech-to-Text ile yazıya döker
// (telefondan gelen hata videolarında ne konuşulduğunu anlamak için). Yalnızca yönetici parolasıyla çalışır; anahtar kasada (vault) durur.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { decodeBase64 } from "jsr:@std/encoding@1/base64";
Deno.serve(async (req) => {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: yetki } = await sb.rpc("admin_token_dogru", { t: req.headers.get("x-admin-token") ?? "" });
  if (yetki !== true) return new Response("yok", { status: 404 });
  const KEY = Deno.env.get("ELEVENLABS_API_KEY") || (await sb.rpc("gizli_al", { ad: "elevenlabs_api_key" })).data;
  const { b64, url, ad = "kayit.mp3" } = await req.json();
  // url: yalnızca kendi ses depomuz (üretilen soru seslerini denetlemek için)
  let bayt: Uint8Array;
  if (url) { if (!String(url).startsWith(Deno.env.get("SUPABASE_URL") + "/storage/v1/object/public/sesler/")) return new Response("geçersiz", { status: 400 }); bayt = new Uint8Array(await (await fetch(url)).arrayBuffer()); } else bayt = decodeBase64(b64);
  const fd = new FormData();
  fd.append("model_id", "scribe_v1");
  fd.append("language_code", "tur");
  fd.append("file", new Blob([bayt], { type: "audio/mpeg" }), ad);
  const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": KEY }, body: fd });
  const j = await r.json().catch(() => ({}));
  return Response.json({ durum: r.status, metin: j.text ?? null, kelimeler: (j.words ?? []).filter((w: any) => w.type === "word").map((w: any) => [w.text, Math.round(w.start * 10) / 10]), hata: r.ok ? null : JSON.stringify(j).slice(0, 300) });
});

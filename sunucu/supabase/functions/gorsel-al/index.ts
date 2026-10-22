// gorsel-al — GELİŞTİRİCİ ARACI. Üretilmiş bir görseli (ör. Higgsfield) indirir, saydam kenarları kırpar,
// en fazla `boy` piksele küçültür ve herkese açık 'gorsel' deposuna PNG olarak koyar. Kontrol için küçük bir JPEG önizleme döner.
// POST { isler: [{ url, ad, beyaz? }], boy?, onizleme?, zemin? }  başlık: x-admin-token
// beyaz: true → düz beyaz arka planı kenarlardan başlayarak siler (kenar pikselleri yumuşatılır). 22.10.2026
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";
import { encodeBase64 } from "jsr:@std/encoding@1/base64";

function beyazSil(im: Image) {
  const w = im.width, h = im.height, b = im.bitmap, n = w * h;
  const luma = (i: number) => (b[i * 4] * 0.3 + b[i * 4 + 1] * 0.59 + b[i * 4 + 2] * 0.11);
  const doy = (i: number) => Math.max(b[i * 4], b[i * 4 + 1], b[i * 4 + 2]) - Math.min(b[i * 4], b[i * 4 + 1], b[i * 4 + 2]);
  const zemin = (i: number) => luma(i) >= 232 && doy(i) <= 28;
  const bg = new Uint8Array(n), kuyruk = new Int32Array(n); let bas = 0, son = 0;
  const ekle = (i: number) => { if (!bg[i] && zemin(i)) { bg[i] = 1; kuyruk[son++] = i; } };
  for (let x = 0; x < w; x++) { ekle(x); ekle((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { ekle(y * w); ekle(y * w + w - 1); }
  while (bas < son) { const i = kuyruk[bas++], x = i % w; if (x > 0) ekle(i - 1); if (x < w - 1) ekle(i + 1); if (i >= w) ekle(i - w); if (i < n - w) ekle(i + w); }
  for (let i = 0; i < n; i++) {
    if (bg[i]) { b[i * 4 + 3] = 0; continue; }
    const x = i % w; const komsu = (x > 0 && bg[i - 1]) || (x < w - 1 && bg[i + 1]) || (i >= w && bg[i - w]) || (i < n - w && bg[i + w]);
    if (komsu) { const l = luma(i); if (l > 200) b[i * 4 + 3] = Math.round(255 * Math.max(0.15, (255 - l) / 55)); }
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("POST bekleniyor", { status: 405 });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: yetki } = await sb.rpc("admin_token_dogru", { t: req.headers.get("x-admin-token") ?? "" });
  if (yetki !== true) return new Response("yetkisiz", { status: 401 });
  await sb.storage.createBucket("gorsel", { public: true }).catch(() => {});
  const { isler = [], boy = 360, onizleme = 56, zemin = 0xffffffff } = await req.json();
  const sonuc = [];
  for (const { url, ad, beyaz } of isler) {
    if (!/^[a-z0-9_]+$/.test(ad)) { sonuc.push({ ad, hata: "ad" }); continue; }
    try {
      const r = await fetch(url); if (!r.ok) { sonuc.push({ ad, hata: "indirme " + r.status }); continue; }
      let im = await Image.decode(new Uint8Array(await r.arrayBuffer()));
      if (beyaz) beyazSil(im);
      // saydam kenarları kırp
      let x0 = im.width, y0 = im.height, x1 = 0, y1 = 0;
      for (let y = 1; y <= im.height; y += 2) for (let x = 1; x <= im.width; x += 2) { if ((im.getPixelAt(x, y) & 0xff) > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
      if (x1 > x0 && y1 > y0) { const p = 8; x0 = Math.max(1, x0 - p); y0 = Math.max(1, y0 - p); x1 = Math.min(im.width, x1 + p); y1 = Math.min(im.height, y1 + p); im = im.crop(x0 - 1, y0 - 1, x1 - x0 + 1, y1 - y0 + 1); }
      const k = Math.min(1, boy / Math.max(im.width, im.height)); if (k < 1) im = im.resize(Math.round(im.width * k), Math.round(im.height * k));
      const png = await im.encode(1);
      const yol = `${ad}.png`;
      const up = await sb.storage.from("gorsel").upload(yol, png, { contentType: "image/png", upsert: true, cacheControl: "31536000" });
      const kucuk = im.clone(); const kk = onizleme / Math.max(kucuk.width, kucuk.height); kucuk.resize(Math.max(1, Math.round(kucuk.width * kk)), Math.max(1, Math.round(kucuk.height * kk)));
      const arka = new Image(kucuk.width, kucuk.height).fill(zemin).composite(kucuk, 0, 0);
      sonuc.push({ ad, w: im.width, h: im.height, bayt: png.length, hata: up.error?.message ?? null, url: sb.storage.from("gorsel").getPublicUrl(yol).data.publicUrl, onizleme: encodeBase64(await arka.encodeJPEG(70)) });
    } catch (e) { sonuc.push({ ad, hata: String(e).slice(0, 200) }); }
  }
  return Response.json(sonuc);
});

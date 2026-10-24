// Geliştirici aracı (24.10.2026): herkese açık bir ZIP'i (MEB yıllık plan) indirip içindeki xlsx'in sayfalarını satır satır düz metin olarak döndürür.
// Yalnız admin_token ile. Örnek gövde: { "url": "<zip>", "dosya": "<xlsx adı>", "sayfa": 0 }. Önce yalnız url → dosya adları; sonra dosya → sayfa adları.
import { unzipSync, strFromU8 } from "npm:fflate@0.8.2";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } });
const ent = (x: string) => x.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
Deno.serve(async (req) => {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: yetki } = await sb.rpc("admin_token_dogru", { t: req.headers.get("x-admin-token") ?? "" });
  if (yetki !== true) return json({ hata: "yetkisiz" }, 401);
  const { url, dosya, sayfa, bas = 0, uzunluk = 60000, ara } = await req.json();
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) return json({ hata: "indirilemedi " + r.status }, 500);
  const dosyalar = unzipSync(new Uint8Array(await r.arrayBuffer()));
  const adlar = Object.keys(dosyalar);
  if (!dosya) return json({ adlar });
  const x = unzipSync(dosyalar[dosya]);
  const ss = x["xl/sharedStrings.xml"] ? [...strFromU8(x["xl/sharedStrings.xml"]).matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m => ent([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(t => t[1]).join(""))) : [];
  const wb = strFromU8(x["xl/workbook.xml"]);
  const sayfalar = [...wb.matchAll(/<sheet [^>]*name="([^"]+)"[^>]*r:id="(rId\d+)"/g)].map(m => m[1]);
  if (sayfa === undefined) return json({ sayfalar });
  const rels = strFromU8(x["xl/_rels/workbook.xml.rels"]);
  const m = [...wb.matchAll(/<sheet [^>]*name="([^"]+)"[^>]*r:id="(rId\d+)"/g)][sayfa];
  const hedef = new RegExp('Id="' + m[2] + '"[^>]*Target="([^"]+)"').exec(rels) || new RegExp('Target="([^"]+)"[^>]*Id="' + m[2] + '"').exec(rels);
  const yol = "xl/" + hedef![1].replace(/^\/?xl\//, "");
  const xml = strFromU8(x[yol]);
  const satirlar = [...xml.matchAll(/<row [^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)].map(rw => rw[1] + ": " + [...rw[2].matchAll(/<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)].map(c => { const tip = /t="(\w+)"/.exec(c[1]); const v = c[2] ? (/<v>([\s\S]*?)<\/v>/.exec(c[2]) || /<t[^>]*>([\s\S]*?)<\/t>/.exec(c[2])) : null; if (!v) return ""; return tip && tip[1] === "s" ? ss[+v[1]] : ent(v[1]); }).filter(Boolean).join(" | ").replace(/\s+/g, " ")).filter(s => s.length > 4);
  let metin = satirlar.join("\n"); if (ara) metin = satirlar.filter(s => new RegExp(ara, "i").test(s)).join("\n");
  return json({ ad: m[1], uzun: metin.length, metin: metin.slice(bas, bas + uzunluk) });
});

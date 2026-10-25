# Adım adım sahne testi (25.10.2026): 35 konunun her adımında sahne geçerli SVG üretiyor mu, adım sayısı kartla aynı mı,
# sahnedeki "a + b = c" türü işlemler doğru mu? Ayrıca bütün sahnelerin bir pafta görüntüsü: test/shots/sahne_*.png
# Çalıştır: python3 test/test_sahne.py
import asyncio, pathlib, os
from playwright.async_api import async_playwright
OUT = str(pathlib.Path(__file__).resolve().parent / 'shots') + '/'
os.makedirs(OUT, exist_ok=True)
APP = (pathlib.Path(__file__).resolve().parent.parent / 'dist' / 'index.html').as_uri()
JS = r"""
() => {
  const S = window.MY_DERS_SAHNE, C = window.MY_CUR, hata = [], say = { sahne: 0, adim: 0, islem: 0 };
  const sayi = (t) => Number(String(t).replace(/\s/g, '').replace(',', '.'));
  const hesapla = (ifade) => { const js = ifade.replace(/(\d)\s(?=\d{3}\b)/g, '$1').replace(/,/g, '.').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
    if (!/^[\d.+\-*/() ]+$/.test(js)) return null; try { return Function('return (' + js + ')')(); } catch (e) { return null; } };
  for (const s of C.SKILLS) {
    const f = S[s.id]; if (!f) { hata.push('sahne yok: ' + s.id); continue; } say.sahne++;
    const n = s.cards.adim.length;
    for (let i = 0; i < n; i++) {
      say.adim++;
      let svg; try { svg = f(i); } catch (e) { hata.push(s.id + ' ' + i + ': ' + e.message); continue; }
      if (/undefined|NaN/.test(svg)) hata.push(s.id + ' ' + i + ': undefined/NaN');
      const d = new DOMParser().parseFromString(svg, 'image/svg+xml');
      if (d.querySelector('parsererror')) hata.push(s.id + ' ' + i + ': SVG bozuk');
      // metinlerdeki eşitlikler: "ifade = sonuç" (sonuç bir sayıysa) hesaplanır
      const metin = [...d.querySelectorAll('text')].map(t => t.textContent).join(' | ');
      for (const m of metin.matchAll(/([\d ,()+\-−×÷]+?)\s=\s([\d ,]+?)(?=\s*(?:[a-zA-ZçğıöşüÇĞİÖŞÜ²°%✓|·→]|$))/g)) {
        const sol = m[1].trim(), sag = m[2].trim(); if (!/[+\-−×÷]/.test(sol) || !/^[\d(]/.test(sol)) continue;
        const v = hesapla(sol); if (v === null) continue; say.islem++;
        if (Math.abs(v - sayi(sag)) > 1e-9) hata.push(`${s.id} ${i}: ${sol} = ${sag} (doğrusu ${v})`);
      }
    }
  }
  return { hata, say };
}
"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1100, 'height': 900})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(APP); await pg.wait_for_timeout(500)
        r = await pg.evaluate(JS)
        print('sahne:', r['say']['sahne'], 'adım:', r['say']['adim'], 'denetlenen işlem:', r['say']['islem'])
        for h in r['hata']: print('HATA:', h)
        # Pafta: her konunun bütün adımları yan yana (görsel kontrol için)
        await pg.evaluate("""() => { const S = window.MY_DERS_SAHNE, C = window.MY_CUR;
          document.body.innerHTML = '<div id=pafta style="padding:10px;background:var(--bg)">' + C.SKILLS.map(s => '<h3 style="margin:14px 0 4px;font:800 15px Nunito">' + s.id + ' — ' + s.title + '</h3><div style="display:flex;gap:6px;flex-wrap:wrap">' + s.cards.adim.map((_, i) => '<div class="visbox ders-sahne" style="width:205px;border:1px solid #ccc;border-radius:8px;padding:4px">' + S[s.id](i) + '</div>').join('') + '</div>').join('') + '</div>';
          document.querySelectorAll('.vis.ds *').forEach(e => e.style.animation = 'none'); }""")
        await pg.wait_for_timeout(300)
        h = await pg.evaluate("document.body.scrollHeight")
        parca = 2400; k = 0
        for y in range(0, h, parca):
            await pg.screenshot(path=OUT + f'sahne_{k}.png', clip={'x': 0, 'y': y, 'width': 1100, 'height': min(parca, h - y)}, full_page=True); k += 1
        print('pafta:', k, 'parça', '· sayfa hatası:', errs or 'yok')
        print('BİTTİ hata:', len(r['hata']) + len(errs))
        await b.close()
asyncio.run(main())

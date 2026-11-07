# Erişilebilirlik denetimi (07.11.2026): axe-core (WCAG 2.1 AA) ile ana ekranlar, açık ve koyu temada, hareket azaltılmış.
# Gereken: npm i --prefix test axe-core@4.10.2  (test/node_modules depoya girmez)
import asyncio, pathlib, sys
from playwright.async_api import async_playwright
R = pathlib.Path(__file__).resolve().parent
APP = (R.parent / 'dist' / 'index.html').as_uri()
AXE = R / 'node_modules' / 'axe-core' / 'axe.min.js'
if not AXE.exists():
    print('axe-core yok: npm i --prefix test axe-core@4.10.2'); sys.exit(1)
HATA = []

async def tara(pg, ad, tema):
    await pg.add_script_tag(path=str(AXE))
    r = await pg.evaluate("axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']},resultTypes:['violations']}).then(r=>r.violations.filter(v=>['serious','critical'].includes(v.impact)).map(v=>({id:v.id,ornek:v.nodes.slice(0,3).map(x=>x.target.join(' ')+' | '+((x.any[0]||x.all[0]||x.none[0]||{}).message||'').slice(0,140))})))")
    if r:
        for v in r: print(f'HATA: [{tema}] {ad}: {v["id"]} → {v["ornek"]}'); HATA.append(v['id'])
    else: print(f'✓ [{tema}] {ad}')

async def yanlis_cevapla(pg):
    q = await pg.evaluate("(()=>{const q=window.MY_APP.q;return {type:q.type,answer:String(q.answer),yanlis:(q.options||[]).findIndex(o=>!o.ok)}})()")
    if q['type'] == 'input':
        for ch in ('9' if q['answer'] != '9' else '8'): await pg.click(f'[data-act=key][data-v="{ch}"]')
    elif q['yanlis'] >= 0: await pg.click(f'[data-act=opt][data-v="{q["yanlis"]}"]')
    else: return False
    await pg.click('[data-act=check]'); await pg.wait_for_timeout(500); return True

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for tema in ('light', 'dark'):
            c = await b.new_context(viewport={'width': 390, 'height': 844}, color_scheme=tema, reduced_motion='reduce')
            pg = await c.new_page(); await pg.goto(APP); await pg.wait_for_timeout(800)
            await tara(pg, 'tanıtım', tema)
            await pg.click('[data-act=vt-basla] >> nth=0'); await pg.wait_for_timeout(300); await tara(pg, 'izin ekranı', tema)
            await pg.click('[data-act=pd-hayir]'); await pg.wait_for_timeout(300); await tara(pg, 'karşılama', tema)
            await pg.click('[data-act=onb-next]'); await pg.wait_for_timeout(300); await tara(pg, 'kayıt sorusu', tema)
            await pg.evaluate("(()=>{const A=window.MY_APP;A.st.profile={name:'Ela',motivation:'kesif',created:Date.now()};A.st.settings.voice=false;A.st.settings.sound=false;A.st.mistakes=[];window.MY_E.save(A.st);A.view='home';A.tab='yol';window.MY_APP_RENDER();})()"); await pg.wait_for_timeout(400)
            await tara(pg, 'harita', tema)
            for t, ad in (('kitap', 'kitap'), ('pratik', 'görevler'), ('lig', 'lig'), ('profil', 'ben/ayarlar')):
                await pg.evaluate(f"(()=>{{const A=window.MY_APP;A.tab='{t}';window.MY_APP_RENDER();}})()"); await pg.wait_for_timeout(250); await tara(pg, ad, tema)
            await pg.evaluate("(()=>{const A=window.MY_APP;A.tab='veli';window.MY_APP_RENDER();})()"); await pg.wait_for_timeout(200)
            await tara(pg, 'veli kapısı', tema)
            await pg.fill('#f-pin1', '4826'); await pg.fill('#f-pin2', '4826'); await pg.click('[data-act=veli-pin-kur]'); await pg.wait_for_timeout(400)
            await tara(pg, 'veli raporu', tema)
            await pg.evaluate("window.MY_APP_START('placement',null)"); await pg.wait_for_timeout(600)
            await tara(pg, 'soru', tema)
            if await yanlis_cevapla(pg): await tara(pg, 'yanlış cevap açıklaması', tema)
            await c.close()
            # Bilgisayar düzeni (≥1100 px): dikey menü + yan panel
            c = await b.new_context(viewport={'width': 1280, 'height': 860}, color_scheme=tema, reduced_motion='reduce')
            await c.add_init_script("try{localStorage.setItem('my_vitrin_gecti','1')}catch(e){}")
            pg = await c.new_page(); await pg.goto(APP); await pg.wait_for_timeout(800)
            await pg.evaluate("(()=>{const A=window.MY_APP;A.st.profile={name:'Ela',motivation:'kesif',created:Date.now()};A.st.izin={karar:'hayir'};A.st.settings.voice=false;A.st.settings.sound=false;window.MY_E.save(A.st);A.view='home';A.tab='yol';window.MY_APP_RENDER();})()"); await pg.wait_for_timeout(400)
            if not await pg.query_selector('#app.masa .yan'): print(f'HATA: [{tema}] bilgisayar düzeni açılmadı'); HATA.append('masa')
            await tara(pg, 'bilgisayar: harita', tema)
            await pg.evaluate("(()=>{const A=window.MY_APP;A.tab='pratik';window.MY_APP_RENDER();})()"); await pg.wait_for_timeout(250); await tara(pg, 'bilgisayar: görevler', tema)
            await c.close()
        await b.close()
    print('BİTTİ hata:', len(HATA))
asyncio.run(main())

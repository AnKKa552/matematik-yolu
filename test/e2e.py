import asyncio, json, random, os, pathlib
from playwright.async_api import async_playwright
OUT=str(pathlib.Path(__file__).resolve().parent / 'shots') + '/'
os.makedirs(OUT, exist_ok=True)
# Depodaki GÜNCEL derlemeyi aç (eskiden sabit bir yol vardı ve eski bir kopyayı test ediyordu)
APP=(pathlib.Path(__file__).resolve().parent.parent / 'dist' / 'index.html').as_uri()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page()
        errs=[]
        pg.on('pageerror', lambda e: errs.append('PAGEERR '+str(e)))
        pg.on('console', lambda m: errs.append('CONSOLE '+m.text) if m.type=='error' and 'fonts' not in m.text else None)
        await pg.goto(APP); await pg.wait_for_timeout(600)
        await pg.evaluate("window.MY_APP.st.settings.voice=false; window.MY_APP.st.settings.sound=false")
        await pg.screenshot(path=OUT+'01_welcome.png')
        await pg.click('[data-act=onb-next]')
        await pg.fill('#f-name','Ela Yılmaz')
        await pg.screenshot(path=OUT+'02_info.png'); await pg.click('[data-act=onb-next]')
        await pg.click('[data-act=motiv][data-v=yaris]'); await pg.screenshot(path=OUT+'03_motiv.png')
        await pg.click('[data-act=onb-finish]')
        # yerleştirme: 7 soru, rastgele cevap
        async def bitir():
            # Ders sonu artık birkaç adımlı: yıldız ekranı → sandık (dokunarak aç) → görevler
            for _ in range(6):
                await pg.evaluate("document.querySelectorAll('.sahne').forEach(e=>e.remove()); 0")
                if not await pg.query_selector('.end'): return
                k = 0
                while await pg.query_selector('[data-act=sandik-dokun]:not([disabled])') and k < 5:
                    if k == 0 and not os.path.exists(OUT+'10b_sandik.png'): await pg.screenshot(path=OUT+'10b_sandik.png')
                    await pg.click('[data-act=sandik-dokun]', force=True); await pg.wait_for_timeout(300); k += 1
                if k:
                    await pg.wait_for_timeout(1600)
                    if not os.path.exists(OUT+'10c_sandik_acik.png'): await pg.screenshot(path=OUT+'10c_sandik_acik.png')
                await pg.click('[data-act=end-ok]', force=True); await pg.wait_for_timeout(250)
        async def answer(correct_prob=0.6, shot=None):
            await pg.wait_for_function("!!document.querySelector('.qprompt') && !document.querySelector('.mid') && !document.querySelector('.sheet')", timeout=8000)
            q = await pg.evaluate("(()=>{const q=window.MY_APP.q;return {type:q.type,answer:q.answer,ok:(q.options||[]).findIndex(o=>o.ok),n:(q.options||[]).length}})()")
            good = random.random()<correct_prob
            if q['type']=='match':
                M = await pg.evaluate("window.MY_APP.mt")
                for i in range(len(M['L'])):
                    j = M['R'].index(M['L'][i]); await pg.click(f'[data-act=mt][data-v="L{i}"]'); await pg.click(f'[data-act=mt][data-v="R{j}"]'); await pg.wait_for_timeout(60)
                await pg.wait_for_timeout(700); await pg.click('[data-act=next]'); await pg.wait_for_timeout(120); return
            if q['type']=='kes':
                K = await pg.evaluate("(()=>{const q=window.MY_APP.q;return {model:q.model,hedef:q.hedef,parca:q.parca}})()")
                n, d = K['hedef']
                if K['model']=='line':
                    k = n if good else n+1
                    await pg.click(f'[data-act=kes-nokta][data-v="{k}"]', force=True)
                else:
                    P = K['parca'] or d
                    if not K['parca']:
                        for _ in range(d-1): await pg.click('[data-act=kes-parca][data-v="1"]')
                    b = n*P//d if good else P - n*P//d
                    if b == n*P//d: b = max(1, b-1) if b > 1 else b+1
                    for i in range(b): await pg.click(f'[data-act=kes-dilim][data-v="{i}"]')
            elif q['type']=='input':
                val = q['answer'].replace('.',',') if good else '9'
                if val==q['answer']: val='8'
                for ch in val: await pg.click(f'[data-act=key][data-v="{ch}"]')
            else:
                idx = q['ok'] if good else (q['ok']+1)%q['n']
                await pg.click(f'[data-act=opt][data-v="{idx}"]')
            if shot: await pg.screenshot(path=OUT+shot+'_q.png')
            await pg.click('[data-act=check]'); await pg.wait_for_timeout(250)
            # İkinci şans: ipucu kutusu çıktıysa bir kez daha dene (yarı yarıya doğru)
            if await pg.query_selector('.ikinci') and not await pg.query_selector('.sheet'):
                q2 = await pg.evaluate("(()=>{const q=window.MY_APP.q;return {type:q.type,answer:q.answer,ok:(q.options||[]).findIndex(o=>o.ok),n:(q.options||[]).length,el:window.MY_APP.elenen||[]}})()")
                good2 = random.random() < 0.5
                if q2['type']=='input':
                    v2 = q2['answer'].replace('.',',') if good2 else '7'
                    if v2 == q2['answer']: v2 = '6'
                    for ch in v2: await pg.click(f'[data-act=key][data-v="{ch}"]')
                elif q2['type']=='kes':
                    pass
                else:
                    cand = [i for i in range(q2['n']) if i not in q2['el'] and (i == q2['ok'] if good2 else i != q2['ok'])] or [q2['ok']]
                    await pg.click(f'[data-act=opt][data-v="{cand[0]}"]')
                await pg.click('[data-act=check]', force=True); await pg.wait_for_timeout(250)
            if shot: await pg.screenshot(path=OUT+shot+'_fb.png')
            await pg.click('[data-act=next]'); await pg.wait_for_timeout(120)
        for i in range(7):
            await answer(0.6, 'p%d'%i if i in (0,3) else None)
        await pg.wait_for_timeout(400); await pg.screenshot(path=OUT+'04_placement_end.png')
        await bitir(); await pg.wait_for_timeout(300)
        await pg.screenshot(path=OUT+'05_home.png', full_page=True)
        # okul takvimi kartı ve konu seçimi
        if await pg.query_selector('[data-act=okul]'):
            await pg.click('[data-act=okul]', force=True); await pg.wait_for_timeout(250); await pg.screenshot(path=OUT+'05b_okul_modal.png')
            await pg.click('[data-act=close-modal].btn', force=True); await pg.wait_for_timeout(150)
        # bir ders: 4. tema kesirler
        await pg.click('[data-act=theme][data-v=t4]'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=OUT+'06_home_t4.png')
        await pg.click('[data-act=node][data-v=f_tur]', force=True); await pg.wait_for_timeout(200); await pg.screenshot(path=OUT+'07_skill_modal.png')
        await pg.click('[data-act=start]'); await pg.wait_for_timeout(1200)
        await pg.screenshot(path=OUT+'08_card.png')
        await pg.click('[data-act=other-fmt]'); await pg.wait_for_timeout(200); await pg.screenshot(path=OUT+'09_card2.png')
        await pg.wait_for_selector('[data-act=card-ok]'); await pg.click('[data-act=card-ok]')
        n=0
        while await pg.evaluate("window.MY_APP.view")=='lesson' and n<30:
            await answer(0.6, 'l%d'%n if n<4 else None); n+=1
        await pg.wait_for_timeout(500); await pg.screenshot(path=OUT+'10_end.png')
        await bitir()
        # haftanın hazinesi: tam ekran efsane sandık sahnesi (dokun, dokun, aç)
        await pg.evaluate("(()=>{const A=window.MY_APP;A.view='home';A.tab='yol';const h=A.st.hazine;if(h){h.anahtar=3;h.acildi=0;}window.MY_APP_RENDER();})()")
        if await pg.query_selector('[data-act=hazine-ac]'):
            await pg.click('[data-act=hazine-ac]', force=True); await pg.wait_for_timeout(300); await pg.screenshot(path=OUT+'10d_hazine.png')
            for _ in range(3): await pg.click('.ss-tam [data-act=sandik-dokun]', force=True); await pg.wait_for_timeout(300)
            await pg.wait_for_timeout(1800); await pg.screenshot(path=OUT+'10e_hazine_acik.png')
            await pg.click('[data-act=sahne-kapat]', force=True); await pg.wait_for_timeout(200)
        # her tema için birer ders (hata kontrolü)
        for t in ['t1','t2','t3','t5','t6','t7']:
            await pg.click(f'[data-act=theme][data-v={t}]'); 
            first = await pg.evaluate(f"window.MY_CUR.SKILLS.find(s=>s.theme=='{t}').id")
            await pg.click(f'[data-act=node][data-v={first}]', force=True); await pg.click('[data-act=start]'); await pg.wait_for_timeout(1100)
            if await pg.evaluate("!!window.MY_APP.ses.showCard"): 
                if t=='t1': await pg.screenshot(path=OUT+'11_card_t1.png')
                await pg.wait_for_selector('[data-act=card-ok]'); await pg.click('[data-act=card-ok]')
            n=0
            while await pg.evaluate("window.MY_APP.view")=='lesson' and n<30:
                await answer(0.7, f'{t}_{n}' if n==0 else None); n+=1
            await bitir()
        for tab in ['pratik','lig','profil']:
            await pg.click(f'[data-act=tab][data-v={tab}]'); await pg.wait_for_timeout(200)
            await pg.screenshot(path=OUT+f'20_{tab}.png', full_page=True)
        # Veli alanı şifreli: önce kapı, şifre belirleme, sonra veli bilgileri
        await pg.click('[data-act=tab][data-v=veli]'); await pg.wait_for_timeout(200)
        assert await pg.query_selector('#f-pin1'), 'veli kapısı yok'
        assert not await pg.query_selector('pre.report'), 'rapor kapısız görünüyor'
        await pg.screenshot(path=OUT+'19a_veli_kapi.png')
        await pg.fill('#f-pin1','4826'); await pg.fill('#f-pin2','4826'); await pg.click('[data-act=veli-pin-kur]'); await pg.wait_for_timeout(200)
        assert await pg.query_selector('pre.report'), 'şifreden sonra rapor yok'
        await pg.click('[data-act=edit-profile]'); await pg.fill('#f-pname','Ayşe Yılmaz'); await pg.fill('#f-pphone','0532 111 22 33'); await pg.check('#f-kvkk'); await pg.click('[data-act=veli-kaydet]'); await pg.wait_for_timeout(200)
        assert (await pg.evaluate("window.MY_APP.st.profile.parentPhone"))=='0532 111 22 33'
        await pg.click('[data-act=tab][data-v=yol]'); await pg.click('[data-act=tab][data-v=veli]'); await pg.wait_for_timeout(150)
        assert await pg.query_selector('#f-pin'), 'sekmeden çıkınca kilitlenmedi'
        await pg.fill('#f-pin','1111'); await pg.click('[data-act=veli-pin-gir]'); await pg.wait_for_timeout(150)
        assert not await pg.query_selector('pre.report'), 'yanlış şifreyle açıldı'
        await pg.fill('#f-pin','4826'); await pg.click('[data-act=veli-pin-gir]'); await pg.wait_for_timeout(150)
        assert await pg.query_selector('pre.report'), 'doğru şifreyle açılmadı'
        await pg.screenshot(path=OUT+'20_veli.png', full_page=True)
        # hatalar modu + hızlı yarış
        await pg.click('[data-act=tab][data-v=pratik]'); await pg.click('[data-act=p-mistakes]'); await pg.wait_for_timeout(1200)
        n=0
        while await pg.evaluate("window.MY_APP.view")=='lesson' and n<20: await answer(0.8); n+=1
        await bitir()
        await pg.click('[data-act=tab][data-v=pratik]'); await pg.click('[data-act=p-speed]'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=OUT+'21_speed.png')
        await pg.evaluate("window.MY_APP.ses.left=1"); await pg.wait_for_timeout(1300)
        await pg.screenshot(path=OUT+'22_speed_end.png')
        # karanlık mod
        await pg.emulate_media(color_scheme='dark'); await bitir(); await pg.wait_for_timeout(200)
        await pg.click('[data-act=tab][data-v=yol]'); await pg.screenshot(path=OUT+'23_dark_home.png')
        st = await pg.evaluate("(()=>{const s=window.MY_APP.st;return {xp:s.xp,streak:s.streak,badges:s.badges,mis:Object.keys(s.mis).length,formats:s.formats,rescue:s.rescue}})()")
        print(json.dumps(st, ensure_ascii=False))
        # yatay taşma kontrolü
        ov = await pg.evaluate("document.documentElement.scrollWidth > window.innerWidth")
        print('yatay taşma:', ov)
        print('HATALAR:', errs if errs else 'yok')
        await b.close()
asyncio.run(main())

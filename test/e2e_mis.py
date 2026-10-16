import asyncio
from playwright.async_api import async_playwright
SP='/tmp/claude-0/-home-claude/5e629e57-189e-5125-a6bd-ef69c1a800d1/scratchpad/'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await (await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, is_mobile=True)).new_page()
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/app/dist/index.html')
        await pg.evaluate("""(()=>{const A=window.MY_APP;A.st.profile={name:'Kerem Can',parentName:'Veli',parentPhone:'05321112233',motivation:'yaris'};A.st.settings.voice=false;A.st.settings.sound=false;window.MY_E.save(A.st);})()""")
        await pg.reload(); await pg.wait_for_timeout(300)
        await pg.screenshot(path=SP+'m0_home.png')
        # a_cevre dersinde çevre yerine a+b yaz → yanılgı kutusu çıkmalı
        await pg.click('[data-act=theme][data-v=t3]'); await pg.click('[data-act=node][data-v=a_cevre]'); await pg.click('[data-act=start]')
        await pg.wait_for_selector('[data-act=card-ok]'); await pg.click('[data-act=card-ok]')
        # soruyu sabit üret
        await pg.evaluate("""(()=>{const A=window.MY_APP;A.q=window.MY_E.makeQ('a_cevre',1);while(A.q.prompt.includes('karenin'))A.q=window.MY_E.makeQ('a_cevre',1);document.querySelector('[data-act=hint]').click();})()""")
        q = await pg.evaluate("window.MY_APP.q.inputMis[0].v")
        for ch in str(q): await pg.click(f'[data-act=key][data-v="{ch}"]')
        await pg.screenshot(path=SP+'m1_q.png')
        await pg.click('[data-act=check]'); await pg.wait_for_timeout(300)
        await pg.screenshot(path=SP+'m2_fb.png')
        txt = await pg.inner_text('.sheet')
        print('Yanılgı kutusu:', 'çevre' in txt.lower() and 'karışmış' in txt)
        await pg.click('[data-act=explain-other]'); await pg.wait_for_timeout(200); await pg.screenshot(path=SP+'m3_explain.png')
        await pg.click('.modal [data-act=close-modal]')
        await pg.click('[data-act=next]'); await pg.wait_for_timeout(200)
        print('Telafi sorusu:', await pg.evaluate("window.MY_APP.q.rescue"), 'seviye', await pg.evaluate("window.MY_APP.q.level"))
        await pg.screenshot(path=SP+'m4_rescue.png')
        # kesir karşılaştırma görseli
        await pg.evaluate("""(()=>{const A=window.MY_APP;A.q=window.MY_E.makeQ('f_karsilastir',1);A.sel=null;A.fb=null;})()""")
        await pg.click('[data-act=hint]'); await pg.wait_for_timeout(100)
        await pg.evaluate("window.MY_APP.q=window.MY_E.makeQ('f_karsilastir',1)"); await pg.click('[data-act=opt][data-v="0"]'); await pg.screenshot(path=SP+'m5_cmp.png')
        for sk in ['g_aci','s_daire','e_esitlik','g_aci_iliski','e_oruntu','s_okuryazar']:
            for lv in [1,2,3]:
                await pg.evaluate(f"(()=>{{const A=window.MY_APP;A.q=window.MY_E.makeQ('{sk}',{lv});A.sel=null;A.fb=null;A.input='';}})()")
                await pg.click('[data-act=hint]'); await pg.wait_for_timeout(60)
                if lv==2: await pg.screenshot(path=SP+f'v_{sk}.png')
        await pg.click('[data-act=tab][data-v=yol]') if await pg.query_selector('[data-act=tab]') else None
        print('hatalar:', errs or 'yok')
        await b.close()
asyncio.run(main())

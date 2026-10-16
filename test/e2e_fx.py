import asyncio
from playwright.async_api import async_playwright
SP='/tmp/claude-0/-home-claude/5e629e57-189e-5125-a6bd-ef69c1a800d1/scratchpad/'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await (await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, is_mobile=True)).new_page()
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/app/dist/index.html')
        await pg.evaluate("""(()=>{const A=window.MY_APP;A.st.profile={name:'Defne',motivation:'yaris'};A.st.settings.voice=true;A.st.settings.sound=false;window.MY_E.save(A.st);})()""")
        await pg.reload(); await pg.wait_for_timeout(300)
        await pg.click('[data-act=theme][data-v=t2]'); await pg.click('[data-act=node][data-v=n_okuma]'); await pg.click('[data-act=start]'); await pg.wait_for_selector('[data-act=card-ok]'); await pg.click('[data-act=card-ok]')
        # gerçek akış: doğru cevapla, seri 1..8, telafi
        async def answer_right():
            await pg.wait_for_function("!!document.querySelector('.qprompt') && !document.querySelector('.mid') && !document.querySelector('.sheet')", timeout=8000)
            q = await pg.evaluate("(()=>{const q=window.MY_APP.q;return {type:q.type,answer:q.answer,ok:(q.options||[]).findIndex(o=>o.ok)}})()")
            if q['type']=='input':
                for ch in q['answer'].replace('.',','): await pg.click(f'[data-act=key][data-v="{ch}"]')
            else: await pg.click(f'[data-act=opt][data-v="{q["ok"]}"]')
            await pg.click('[data-act=check]')
        tiers=[]
        for i in range(1,9):
            await answer_right(); await pg.wait_for_timeout(380)
            if i in (1,2,3,5,8): await pg.screenshot(path=SP+f'fx_{i}.png')
            await pg.wait_for_timeout(1300)
            if i==2: await pg.screenshot(path=SP+'fx_after2.png')
            if await pg.evaluate("window.MY_APP.view")!='lesson': break
            await pg.click('[data-act=next]'); await pg.wait_for_timeout(100)
            # dersi uzat
            await pg.evaluate("window.MY_APP.ses.len=20")
        # telafi efekti
        await pg.evaluate("(()=>{const A=window.MY_APP;A.q.rescue=true;})()")
        await pg.evaluate("window.MY_FX.correct({rescue:true,xp:15,word:'Hatandan öğrendin!'})"); await pg.wait_for_timeout(700); await pg.screenshot(path=SP+'fx_rescue.png')
        print('fx katmanı kalmadı mı:', await pg.evaluate("(()=>new Promise(r=>setTimeout(()=>r(!document.querySelector('.fx-layer')),2200)))()"))
        print('hatalar:', errs or 'yok')
        await b.close()
asyncio.run(main())

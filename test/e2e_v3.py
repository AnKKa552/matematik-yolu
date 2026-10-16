import asyncio
from playwright.async_api import async_playwright
SP='/tmp/claude-0/-home-claude/5e629e57-189e-5125-a6bd-ef69c1a800d1/scratchpad/v3_'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await (await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, is_mobile=True)).new_page()
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/app/dist/index.html')
        await pg.evaluate("""(()=>{const A=window.MY_APP;A.st.profile={name:'Defne Kaya',motivation:'yaris'};A.st.settings.voice=false;A.st.settings.sound=false;window.MY_E.save(A.st);})()""")
        await pg.reload(); await pg.wait_for_timeout(300)
        # Kitap sekmesi
        await pg.click('[data-act=tab][data-v=kitap]'); await pg.wait_for_timeout(200); await pg.screenshot(path=SP+'kitap1.png', full_page=False)
        await pg.click('[data-act=book][data-v="2"]'); await pg.wait_for_timeout(200); await pg.screenshot(path=SP+'kitap2.png')
        await pg.click('[data-act=task][data-v=t4]'); await pg.wait_for_timeout(200); await pg.screenshot(path=SP+'task.png'); await pg.click('[data-act=task-done]')
        # Hazır mıyız
        await pg.click('[data-act=hazir][data-v=t4]'); await pg.wait_for_timeout(1100)
        print('hazir modu:', await pg.evaluate("window.MY_APP.ses.mode"), await pg.evaluate("window.MY_APP.view"))
        # Eşleştirme sorusunu zorla
        await pg.evaluate("""(()=>{const A=window.MY_APP;let q;do{q=window.MY_E.makeQ('f_ondalik',2)}while(q.type!=='match');A.q=q;A.fb=null;A.mt={L:window.MY_U.shuffle(q.pairs.map((_,i)=>i)),R:window.MY_U.shuffle(q.pairs.map((_,i)=>i)),sL:null,sR:null,done:[],mist:0,bad:null,just:null};})()""")
        await pg.click('[data-act=hint]') if await pg.query_selector('[data-act=hint]') else None
        await pg.evaluate("window.dispatchEvent(new Event('resize'))")
        # render tetikle
        await pg.evaluate("document.querySelector('[data-act=say-q]') && 0")
        await pg.evaluate("(()=>{const e=document.createElement('button');e.dataset.act='book';e.dataset.v='2';})()")
        await pg.evaluate("window.MY_APP_RENDER && window.MY_APP_RENDER()")
        await pg.screenshot(path=SP+'match0.png')
        M = await pg.evaluate("window.MY_APP.mt")
        # bir yanlış eşleşme, sonra hepsi doğru
        L, R = M['L'], M['R']
        wrongR = next(j for j in range(3) if R[j] != L[0])
        await pg.click(f'[data-act=mt][data-v="L0"]'); await pg.click(f'[data-act=mt][data-v="R{wrongR}"]'); await pg.wait_for_timeout(150); await pg.screenshot(path=SP+'match_bad.png'); await pg.wait_for_timeout(500)
        for i in range(3):
            j = R.index(L[i]); await pg.click(f'[data-act=mt][data-v="L{i}"]'); await pg.click(f'[data-act=mt][data-v="R{j}"]'); await pg.wait_for_timeout(120)
            if i==0: await pg.screenshot(path=SP+'match_ok.png')
        await pg.wait_for_timeout(700); await pg.screenshot(path=SP+'match_partial.png')
        print('kısmi:', await pg.evaluate("JSON.stringify(window.MY_APP.fb)"))
        await pg.click('[data-act=next]'); await pg.wait_for_timeout(200)
        # örüntü tablosu
        await pg.evaluate("""(()=>{const A=window.MY_APP;let q;do{q=window.MY_E.makeQ('f_denk',2)}while(!q.grid);A.q=q;A.fb=null;A.sel=null;A.mt=null;window.MY_APP_RENDER();})()""")
        await pg.click('[data-act=opt][data-v="0"]'); await pg.wait_for_timeout(150); await pg.screenshot(path=SP+'grid.png')
        await pg.click('[data-act=quit]'); await pg.click('[data-act=quit-yes]')
        # görevler, lig, profil
        for tab in ['pratik','lig','profil']:
            await pg.click(f'[data-act=tab][data-v={tab}]'); await pg.wait_for_timeout(200); await pg.screenshot(path=SP+tab+'.png')
        # tema sınavı (kitaptan)
        await pg.click('[data-act=tab][data-v=kitap]'); await pg.click('[data-act=book][data-v="1"]')
        await pg.click('[data-act=exam][data-v=t3]'); await pg.wait_for_timeout(1100)
        for k in range(12):
            if await pg.evaluate("window.MY_APP.view")!='lesson': break
            q = await pg.evaluate("(()=>{const q=window.MY_APP.q;return {type:q.type,answer:q.answer,ok:(q.options||[]).findIndex(o=>o.ok),n:(q.pairs||[]).length}})()")
            if q['type']=='match':
                M = await pg.evaluate("window.MY_APP.mt"); 
                for i in range(len(M['L'])): j=M['R'].index(M['L'][i]); await pg.click(f'[data-act=mt][data-v="L{i}"]'); await pg.click(f'[data-act=mt][data-v="R{j}"]'); await pg.wait_for_timeout(80)
                await pg.wait_for_timeout(700)
            else:
                if q['type']=='input':
                    for ch in q['answer'].replace('.',','): await pg.click(f'[data-act=key][data-v="{ch}"]')
                else: await pg.click(f'[data-act=opt][data-v="{q["ok"]}"]')
                await pg.click('[data-act=check]')
            await pg.wait_for_timeout(200)
            if k==2: await pg.screenshot(path=SP+'exam.png')
            await pg.click('[data-act=next]'); await pg.wait_for_timeout(150)
        await pg.wait_for_timeout(600); await pg.screenshot(path=SP+'exam_end.png')
        print('kupa:', await pg.evaluate("JSON.stringify(window.MY_APP.st.trophies)"), 'görev:', await pg.evaluate("JSON.stringify(window.MY_APP.st.quests.prog)"))
        print('hatalar:', errs or 'yok')
        await b.close()
asyncio.run(main())

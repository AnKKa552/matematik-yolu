import asyncio, re
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await (await b.new_context(viewport={'width':390,'height':844}, is_mobile=True)).new_page()
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        html = open('/home/claude/app/dist/index.html').read().replace('<script src="config.js"></script>', "<script>window.MY_CONFIG={supabaseUrl:'https://ornek.supabase.co',anonKey:'x'}</script>")
        open('/home/claude/app/dist/_cloudtest.html','w').write(html)
        await pg.goto('file:///home/claude/app/dist/_cloudtest.html')
        await pg.evaluate("(()=>{const A=window.MY_APP;A.st.profile={name:'Ali',motivation:'yaris'};window.MY_E.save(A.st);})()")
        await pg.reload(); await pg.wait_for_timeout(2500)
        print('bulut durumu:', await pg.evaluate("window.MY_CLOUD.durum"), '| ses adresi:', await pg.evaluate("window.MY_CLOUD.sesAdresi"))
        await pg.click('[data-act=tab][data-v=veli]'); await pg.wait_for_timeout(200)
        print('veli kartı:', (await pg.inner_text('.scroll'))[-160:].replace('\n',' '))
        await pg.click('[data-act=tab][data-v=yol]'); await pg.click('[data-act=node][data-v=g_temel]'); await pg.click('[data-act=start]'); await pg.wait_for_timeout(1200)
        print('ders açıldı:', await pg.evaluate("window.MY_APP.view"))
        print('hatalar:', errs or 'yok')
        await b.close()
asyncio.run(main())

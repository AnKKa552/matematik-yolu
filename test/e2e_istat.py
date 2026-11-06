# İsimsiz soru istatistiği: telefon cevapları kalıp kalıp toplar, yalnız toplamları gönderir; kimlik gitmez; kapatılabilir.
import asyncio, json, pathlib, re
from playwright.async_api import async_playwright
APP = (pathlib.Path(__file__).resolve().parent.parent / 'dist' / 'index.html').as_uri()
HATA = []
def ok(c, m):
    print(('✓ ' if c else 'HATA: ') + m)
    if not c: HATA.append(m)

GELEN = []; S = {'cevap': {'ok': True, 'alindi': 1}}
async def yol(route):
    GELEN.append(json.loads(route.request.post_data or '{}'))
    await route.fulfill(status=200 if S['cevap'] else 500, content_type='application/json', body=json.dumps(S['cevap'] or {}))

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); errs = []
        c = await b.new_context(viewport={'width': 390, 'height': 844})
        await c.add_init_script("try{localStorage.setItem('my_vitrin_gecti','1')}catch(e){}")
        pg = await c.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.route(re.compile(r'.*/rest/v1/rpc/istatistik_kaydet.*'), yol)
        await pg.route(re.compile(r'.*/rest/v1/rpc/(?!istatistik).*'), lambda r: r.fulfill(status=200, content_type='application/json', body='null'))
        await pg.goto(APP); await pg.wait_for_timeout(500)
        await pg.evaluate("""(()=>{const A=window.MY_APP;A.st.profile={name:'Zeynep Kaya',motivation:'kesif',created:Date.now()};A.st.settings.voice=false;A.st.settings.sound=false;window.MY_E.save(A.st);})()""")
        # Bir dersin cevaplarını motora doğrudan kaydet (2 doğru, 1 yanlış aynı kalıpta olmayabilir; sayıları toplamdan kontrol et)
        await pg.evaluate("""(()=>{const A=window.MY_APP,E=window.MY_E;window.MY_APP_START('lesson','f_denk');const s=A.ses;
          for(let i=0;i<3;i++){const q=E.makeQ('f_denk',2,true);E.record(A.st,s,q,i<2?{ok:true}:{ok:false,mis:'pay_payda_ters'},i===0?5000:45000,false,i<2?'ilk':'cozum');}
          A.view='home';A.ses=s;})()""")
        await pg.wait_for_timeout(1200)
        await pg.click('[data-act=quit]') if await pg.query_selector('[data-act=quit]') else None
        await pg.evaluate("""(()=>{const A=window.MY_APP;window.MY_APP_START('lesson','g_aci');A.modal=null;})()""")
        await pg.wait_for_timeout(1300)
        await pg.evaluate("document.dispatchEvent(new Event('visibilitychange'))")  # ön planda: gönderim yok
        yerel = await pg.evaluate("JSON.parse(localStorage.getItem('my_istat')||'{}')")
        sorular = list((yerel.get('soru') or {}).values())
        ok(sum(s['n'] for s in sorular) == 3, f'3 cevap toplandı ({len(sorular)} kalıp)')
        ok(sum(s['ilk'] for s in sorular) == 2 and sum(s['cozum'] for s in sorular) == 1, 'ilk deneme ve çözüm sayıları doğru')
        ok(sum(s['mis'].get('pay_payda_ters', 0) for s in sorular) == 1, 'yanılgı sayıldı')
        ok(sum(sum(s['kova']) for s in sorular) == 3 and sum(s['ms'] for s in sorular) == 95000, 'süre ve süre dağılımı')
        ok(sum(d['basla'] for d in (yerel.get('ders') or {}).values()) >= 2, 'ders başlatma sayıldı')
        # Arka plana geçince gönderilir
        await pg.evaluate("Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'hidden'});document.dispatchEvent(new Event('visibilitychange'))")
        await pg.wait_for_timeout(800)
        ok(len(GELEN) == 1, f'arka plana geçince bir kez gönderildi ({len(GELEN)})')
        govde = json.dumps(GELEN[0]) if GELEN else ''
        ok('Zeynep' not in govde and 'cihaz' not in govde and '"z"' not in govde and 'kesif' not in govde, 'ad, cihaz numarası, zaman gitmedi')
        anahtarlar = set()
        for s in (GELEN[0]['p']['soru'] if GELEN else []): anahtarlar |= set(s)
        ok(anahtarlar <= {'mod', 'beceri', 'sev', 'tur', 'kalip', 'metin', 'n', 'ilk', 'ipucu', 'cozum', 'ms', 'kova', 'mis'}, f'yalnız izinli alanlar {sorted(anahtarlar)}')
        ok(await pg.evaluate("Object.keys(JSON.parse(localStorage.getItem('my_istat')||'{}').soru||{}).length") == 0, 'gönderilince telefonda silindi')
        # Sunucu hata verirse geri konur
        S['cevap'] = None
        await pg.evaluate("""(()=>{const A=window.MY_APP,E=window.MY_E;const s=A.ses;const q=E.makeQ('f_denk',1,true);E.record(A.st,s,q,{ok:true},8000,false,'ilk');})()""")
        await pg.evaluate("document.dispatchEvent(new Event('visibilitychange'))"); await pg.wait_for_timeout(800)
        ok(await pg.evaluate("Object.values(JSON.parse(localStorage.getItem('my_istat')||'{}').soru||{}).reduce((a,s)=>a+s.n,0)") == 1, 'gönderilemeyen sayı telefonda bekliyor')
        S['cevap'] = {'ok': True, 'alindi': 1}
        # Kapatılınca toplanmaz ve bekleyen silinir
        await pg.evaluate("(()=>{const A=window.MY_APP;A.view='home';A.tab='profil';A.ses=null;window.MY_APP_RENDER();})()"); await pg.wait_for_timeout(300)
        kutu = await pg.query_selector('[data-act=set-istat]')
        if not kutu:
            await pg.evaluate("(()=>{const b=[...document.querySelectorAll('[data-act]')].find(x=>/ayar/i.test(x.dataset.act));if(b)b.click();})()"); await pg.wait_for_timeout(300)
            kutu = await pg.query_selector('[data-act=set-istat]')
        ok(kutu is not None and await kutu.is_checked(), 'Ayarlar\'da kutu var ve açık')
        if kutu: await kutu.click(); await pg.wait_for_timeout(200)
        ok(await pg.evaluate("window.MY_APP.st.settings.istat") is False, 'kapatıldı')
        ok(await pg.evaluate("Object.keys(JSON.parse(localStorage.getItem('my_istat')||'{}').soru||{}).length") == 0, 'kapatınca bekleyen silindi')
        n0 = len(GELEN)
        await pg.evaluate("""(()=>{const A=window.MY_APP,E=window.MY_E;window.MY_APP_START('lesson','f_denk');const s=A.ses;const q=E.makeQ('f_denk',1,true);E.record(A.st,s,q,{ok:true},8000,false,'ilk');})()""")
        await pg.evaluate("document.dispatchEvent(new Event('visibilitychange'))"); await pg.wait_for_timeout(800)
        ok(len(GELEN) == n0 and await pg.evaluate("Object.keys(JSON.parse(localStorage.getItem('my_istat')||'{}').soru||{}).length") == 0, 'kapalıyken hiçbir şey toplanmaz, gönderilmez')
        ok(not errs, f'Sayfa hatası yok {errs[:2]}')
        await b.close()
    print('BİTTİ hata:', len(HATA))
asyncio.run(main())

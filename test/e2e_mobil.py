# Mobil iyileştirmeler (07.11.2026): manzaralar ekrana yaklaşınca yüklenir, internetsiz kullanım için ses ön yüklemesi,
# yeni sürüm uyarısı (gerçek service worker ile, yerel sunucuda), zayıf telefon ölçümü (CPU 6 kat yavaş + yavaş 4G).
import asyncio, json, pathlib, re, shutil, tempfile, threading, http.server, functools, gzip, os
from playwright.async_api import async_playwright
DIST = pathlib.Path(__file__).resolve().parent.parent / 'dist'
HATA = []
def ok(c, m):
    print(('✓ ' if c else 'HATA: ') + m)
    if not c: HATA.append(m)

KOPYA = pathlib.Path(tempfile.mkdtemp()) / 'site'; shutil.copytree(DIST, KOPYA)
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def end_headers(self): self.send_header('Cache-Control', 'no-cache'); super().end_headers()
    def do_GET(self):
        p = self.translate_path(self.path.split('?')[0])
        if os.path.isdir(p): p = os.path.join(p, 'index.html')
        if p.endswith(('.html', '.js')) and os.path.exists(p):
            d = gzip.compress(open(p, 'rb').read()); self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8' if p.endswith('.html') else 'application/javascript')
            self.send_header('Content-Encoding', 'gzip'); self.send_header('Content-Length', str(len(d))); self.end_headers(); self.wfile.write(d); return
        return super().do_GET()
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(H, directory=str(KOPYA)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{srv.server_address[1]}/'

SES_ISTEK = []
async def ses_yolu(route):
    u = route.request.url
    if u.endswith('manifest.json'):
        keys = ['pi_bravo_1', 'kart_g_temel_gorsel', 'kart_g_temel_hikaye', 'mis_payda_buyuk', 'mis_cap_yaricap', 'mis_cap_yaricap_2', 'kart_eski_olmayan']
        return await route.fulfill(status=200, content_type='application/json', headers={'Access-Control-Allow-Origin': '*'}, body=json.dumps({'keys': keys}))
    if u.endswith('.mp3'):
        SES_ISTEK.append(u.rsplit('/', 1)[1])
        return await route.fulfill(status=200, content_type='audio/mpeg', headers={'Access-Control-Allow-Origin': '*'}, body=b'ID3' + b'\0' * 64)
    await route.abort()

async def kayitli(pg):
    await pg.evaluate("(()=>{const A=window.MY_APP;A.st.profile={name:'Ela',motivation:'kesif',created:Date.now()};A.st.izin={karar:'hayir'};A.st.settings.voice=false;A.st.settings.sound=false;window.MY_E.save(A.st);A.view='home';A.tab='yol';window.MY_APP_RENDER();})()")

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); errs = []
        c = await b.new_context(viewport={'width': 360, 'height': 740}, is_mobile=True, has_touch=True, service_workers='allow')
        await c.add_init_script("try{localStorage.setItem('my_vitrin_gecti','1')}catch(e){}")
        await c.route(re.compile(r'.*supabase\.co/storage/v1/object/public/sesler/.*'), ses_yolu)
        await c.route(re.compile(r'.*supabase\.co/(rest|functions)/.*'), lambda r: r.fulfill(status=200, content_type='application/json', body='null'))
        pg = await c.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(800); await kayitli(pg); await pg.wait_for_timeout(400)
        # 1) Manzaralar
        bekleyen = await pg.evaluate("document.querySelectorAll('.bolge[data-fon]').length")
        yuklu = await pg.evaluate("[...document.querySelectorAll('.bolge')].filter(e=>e.style.getPropertyValue('--fon')).length")
        ok(bekleyen >= 3 and yuklu >= 1, f'Açılışta yalnız yakındaki manzaralar yüklenir ({yuklu} yüklü, {bekleyen} bekliyor)')
        await pg.evaluate("document.getElementById('bolge-t7').scrollIntoView()"); await pg.wait_for_timeout(400)
        ok(await pg.evaluate("!!document.getElementById('bolge-t7').style.getPropertyValue('--fon')"), 'Son bölgeye kayınca manzarası yüklendi')
        await pg.evaluate("window.MY_APP_RENDER()"); await pg.wait_for_timeout(100)
        ok(await pg.evaluate("!!document.getElementById('bolge-t7').style.getPropertyValue('--fon')"), 'Yeniden çizince yüklenen manzara beklemeden gelir')
        # 2) İnternetsiz kullanım için ses ön yüklemesi
        await pg.evaluate("window.MY_CEVRIMDISI.hazirla()"); await pg.wait_for_timeout(2500)
        d = await pg.evaluate("window.MY_CEVRIMDISI.durum")
        ok('kart_g_temel_gorsel.mp3' in SES_ISTEK and 'mis_payda_buyuk.mp3' in SES_ISTEK and 'mis_cap_yaricap_2.mp3' in SES_ISTEK, f'Anlatım ve açıklama sesleri indirildi ({len(SES_ISTEK)})')
        ok('mis_cap_yaricap.mp3' not in SES_ISTEK and 'kart_eski_olmayan.mp3' not in SES_ISTEK, 'Eski sürüm ve kullanılmayan sesler indirilmez')
        ok(d['toplam'] == 4 and d['hazir'] == 4, f'Durum: {d}')
        n0 = len(SES_ISTEK); await pg.evaluate("window.MY_CEVRIMDISI.hazirla()"); await pg.wait_for_timeout(800)
        ok(len(SES_ISTEK) == n0, 'İkinci kez çağrılınca var olanlar yeniden indirilmez')
        await pg.evaluate("(()=>{const A=window.MY_APP;A.tab='profil';window.MY_APP_RENDER();})()"); await pg.wait_for_timeout(200)
        ok('4/4 indirildi' in await pg.inner_text('body'), 'Ayarlar\'da internetsiz kullanım durumu görünür')
        # Mobil veride / veri tasarrufunda indirmez
        c2 = await b.new_context(viewport={'width': 360, 'height': 740})
        await c2.add_init_script("try{localStorage.setItem('my_vitrin_gecti','1')}catch(e){}; Object.defineProperty(navigator,'connection',{value:{saveData:true,type:'cellular',effectiveType:'4g',addEventListener(){}}})")
        await c2.route(re.compile(r'.*supabase\.co/storage/v1/object/public/sesler/.*'), ses_yolu)
        p2 = await c2.new_page(); await p2.goto(URL); await p2.wait_for_timeout(800); n0 = len(SES_ISTEK)
        await p2.evaluate("window.MY_CEVRIMDISI.hazirla()"); await p2.wait_for_timeout(1000)
        ok(len(SES_ISTEK) == n0 and await p2.evaluate("window.MY_CEVRIMDISI.durum.bekle"), 'Mobil veri / veri tasarrufu açıkken indirmez, Wi-Fi bekler')
        await c2.close()
        # 3) Yeni sürüm uyarısı (gerçek service worker)
        await pg.evaluate("(()=>{const A=window.MY_APP;A.tab='yol';window.MY_APP_RENDER();})()")
        await pg.wait_for_function("navigator.serviceWorker.controller !== null", timeout=15000)
        ok(await pg.query_selector('.surum-serit') is None, 'İlk kurulumda uyarı yok')
        await pg.evaluate("window.MY_APP_START('lesson','g_temel')"); await pg.wait_for_timeout(1200)
        sw = KOPYA / 'sw.js'; sw.write_text(sw.read_text() + '\n// yeni sürüm denemesi\n')
        await pg.evaluate("navigator.serviceWorker.getRegistration().then(r=>r.update())")
        await pg.wait_for_function("window.MY_APP.yeniSurum === true", timeout=15000)
        ok(await pg.query_selector('.surum-serit') is None, 'Ders sırasında uyarı gösterilmez')
        await pg.evaluate("(()=>{const A=window.MY_APP;A.view='home';A.ses=null;A.tab='yol';window.MY_APP_RENDER();})()"); await pg.wait_for_timeout(200)
        ok(await pg.query_selector('.surum-serit') is not None, 'Ders dışında «Yeni sürüm hazır» şeridi çıkar')
        await pg.screenshot(path='/tmp/claude-0/shots/surum_serit.png')
        await pg.click('[data-act=surum-sonra]'); await pg.wait_for_timeout(150)
        ok(await pg.query_selector('.surum-serit') is None, '✕ ile kapanır')
        ok(not errs, f'Sayfa hatası yok {errs[:2]}')
        # 4) Zayıf telefon: CPU 6 kat yavaş + yavaş 4G
        c3 = await b.new_context(viewport={'width': 360, 'height': 740}, is_mobile=True, has_touch=True, service_workers='block')
        await c3.add_init_script("try{localStorage.setItem('my_vitrin_gecti','1')}catch(e){}")
        await c3.route(re.compile(r'.*supabase\.co/.*'), lambda r: r.abort())
        p3 = await c3.new_page(); cdp = await c3.new_cdp_session(p3)
        await cdp.send('Emulation.setCPUThrottlingRate', {'rate': 6}); await cdp.send('Network.enable')
        await cdp.send('Network.emulateNetworkConditions', {'offline': False, 'latency': 150, 'downloadThroughput': 1.6e6 / 8, 'uploadThroughput': 750e3 / 8})
        await p3.goto(URL, wait_until='commit')
        hazir = await p3.evaluate("new Promise(r=>{const t=()=>{const a=document.querySelector('#app');if(window.MY_APP&&a&&!a.querySelector('.acilis')&&a.children.length)r(Math.round(performance.now()));else setTimeout(t,30)};t()})")
        fcp = await p3.evaluate("Math.round((performance.getEntriesByType('paint').find(x=>x.name==='first-contentful-paint')||{}).startTime||0)")
        ok(fcp < 1500, f'Zayıf telefonda ilk görüntü {fcp} ms (< 1500)')
        ok(hazir < 4000, f'Zayıf telefonda uygulama {hazir} ms\'de hazır (< 4000)')
        await kayitli(p3); await p3.wait_for_timeout(500)
        kare = await p3.evaluate("""new Promise(res=>{const sc=document.scrollingElement;let n=0,t0=performance.now(),last=t0,mx=0;const f=(t)=>{mx=Math.max(mx,t-last);last=t;n++;sc.scrollTop+=25;if(t-t0<2500)requestAnimationFrame(f);else res({fps:Math.round(n/((t-t0)/1000)),mx:Math.round(mx)})};requestAnimationFrame(f)})""")
        ok(kare['fps'] >= 40, f'Zayıf telefonda harita kaydırma {kare["fps"]} kare/sn (en uzun kare {kare["mx"]} ms)')
        rnd = await p3.evaluate("(()=>{const a=performance.now();window.MY_APP_RENDER();return Math.round(performance.now()-a)})()")
        ok(rnd < 200, f'Harita yeniden çizimi {rnd} ms')
        await b.close()
    srv.shutdown()
    print('BİTTİ hata:', len(HATA))
asyncio.run(main())

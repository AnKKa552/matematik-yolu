# Aynı telefonda kardeşler (04.11.2026): her çocuğun ilerlemesi, pilot kaydı ve kuyruğu ayrı olmalı.
# Çalıştır: python3 test/e2e_profil.py
import asyncio, json, re, pathlib, os
from playwright.async_api import async_playwright
OUT = str(pathlib.Path(__file__).resolve().parent / 'shots') + '/'
os.makedirs(OUT, exist_ok=True)
APP = (pathlib.Path(__file__).resolve().parent.parent / 'dist' / 'index.html').as_uri()
KAT = {}; OLAY = []; HATA = []
def sunucu(fn, a):
    if fn == 'pilot_katil': KAT[a['p_cihaz']] = a.get('p_grup'); return {'ok': True}
    if fn == 'pilot_kaydet':
        if not re.fullmatch(r'[A-Za-z0-9_-]{22}', a.get('p_cihaz') or ''): return {'ok': False, 'hata': 'cihaz'}
        if a['p_cihaz'] not in KAT: return {'ok': False, 'hata': 'katilim_yok'}
        for o in a.get('p_olaylar') or []: OLAY.append(dict(o, cihaz=a['p_cihaz']))
        return {'ok': True, 'alindi': len(a.get('p_olaylar') or [])}
    if fn == 'pilot_ayril': KAT.pop(a.get('p_cihaz'), None); return {'ok': True}
    return None
def ok(c, m):
    print(('✓ ' if c else 'HATA: ') + m)
    if not c: HATA.append(m)
async def kayit(pg, ad):
    if await pg.query_selector('[data-act=pd-hayir]'): await pg.click('[data-act=pd-hayir]'); await pg.wait_for_timeout(200)
    await pg.click('[data-act=onb-next]'); await pg.click('[data-act=onb-next]'); await pg.fill('#f-name', ad); await pg.click('[data-act=onb-next]'); await pg.click('[data-act=onb-next]'); await pg.click('[data-act=onb-next]')
    await pg.click('[data-act=motiv][data-v=kesif]'); await pg.click('[data-act=onb-finish-skip]'); await pg.wait_for_timeout(300)
async def ben(pg):
    await pg.evaluate("(()=>{const a=window.MY_APP;a.view='home';a.tab='profil';window.MY_APP_RENDER();})()"); await pg.wait_for_timeout(150)
async def secici_adlar(pg):
    return await pg.evaluate("[...document.querySelectorAll('.sec-kart b')].map(b=>b.textContent)")
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); errs = []
        async def yol(route):
            fn = route.request.url.split('/rpc/')[-1]
            body = sunucu(fn, json.loads(route.request.post_data or '{}')) if fn.startswith('pilot_') else None
            await route.fulfill(status=200, content_type='application/json', body=json.dumps(body))
        async def sayfa():
            c = await b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
            await c.add_init_script("try{localStorage.setItem('my_vitrin_gecti','1')}catch(e){}")  # vitrin (tanıtım) testlerde atlanır
            g = await c.new_page(); g.on('pageerror', lambda e: errs.append(str(e)))
            await g.route(re.compile(r'.*/rest/v1/rpc/.*'), yol); await g.route(re.compile(r'.*cdn\.jsdelivr\.net.*'), lambda r: r.abort())
            return g
        pg = await sayfa(); await pg.goto(APP); await pg.wait_for_timeout(600)
        if await pg.query_selector('[data-act=pd-hayir]'): await pg.click('[data-act=pd-hayir]'); await pg.wait_for_timeout(200)
        await kayit(pg, 'Toprak')
        await pg.evaluate("(()=>{const a=window.MY_APP;a.st.xp=120;a.st.gems=77;a.st.veli={tuz:'x',pin:'y'};window.MY_APP_SAVE&&0;})()")
        await pg.evaluate("localStorage.setItem('matematik_yolu_v1', JSON.stringify(window.MY_APP.st))")
        await ben(pg)
        ok(await pg.query_selector('[data-act=oyuncu-ac]') is not None, 'Ben → Ayarlar\'da «Kardeş ekle» düğmesi var')
        await pg.click('[data-act=oyuncu-ac]'); await pg.wait_for_timeout(200)
        ok(await secici_adlar(pg) == ['Toprak'], 'Seçici açılır, tek oyuncu görünür')
        await pg.click('[data-act=oyuncu-ekle]'); await pg.wait_for_timeout(800)
        ok(await pg.query_selector('[data-act=onb-iptal]') is not None and await pg.query_selector('[data-act=pd-katil]') is not None, 'Kardeş için önce izin ekranı, geri dönme düğmesi var')
        await pg.click('[data-act=pd-hayir]'); await pg.wait_for_timeout(200)
        ok(await pg.query_selector('[data-act=onb-iptal]') is not None and await pg.query_selector('[data-act=onb-next]') is not None, 'Sonra kayıt başlar, geri dönme düğmesi var')
        await kayit(pg, 'Ömer')
        st = await pg.evaluate("({ad:window.MY_APP.st.profile.name, xp:window.MY_APP.st.xp, gems:window.MY_APP.st.gems, veli:!!window.MY_APP.st.veli})")
        ok(st['ad'] == 'Ömer' and st['xp'] == 0 and st['gems'] != 77, f'Kardeş sıfırdan başlar: {st}')
        ok(st['veli'], 'Veli şifresi kardeşe kopyalanır (veli tek)')
        await pg.evaluate("(()=>{const a=window.MY_APP;a.st.xp=30;})()"); await pg.evaluate("localStorage.setItem(Object.keys(localStorage).find(k=>k.startsWith('matematik_yolu_v1:')), JSON.stringify(window.MY_APP.st))")
        # Uygulamayı yeniden aç
        await pg.evaluate("sessionStorage.removeItem('my_yer')"); await pg.reload(); await pg.wait_for_timeout(700)
        _ad = await secici_adlar(pg); ok(sorted(_ad) == ['Toprak', 'Ömer'], f'Açılışta «Kim oynuyor?» iki oyuncuyu gösterir {_ad}')
        await pg.screenshot(path=OUT + 'profil_01_secici.png')
        await pg.click('.sec-kart:has-text("Toprak")'); await pg.wait_for_timeout(900)
        ok(await pg.evaluate("window.MY_APP.st.profile.name==='Toprak' && window.MY_APP.st.xp===120"), 'Toprak seçilince Toprak\'ın ilerlemesi gelir')
        await ben(pg); await pg.click('[data-act=oyuncu-ac]'); await pg.wait_for_timeout(200)
        await pg.click('.sec-kart:has-text("Ömer")'); await pg.wait_for_timeout(900)
        ok(await pg.evaluate("window.MY_APP.st.profile.name==='Ömer' && window.MY_APP.st.xp===30"), 'Ömer seçilince Ömer\'in ilerlemesi gelir')
        # Yarıda bırakılan kardeş ekleme
        await ben(pg); await pg.click('[data-act=oyuncu-ac]'); await pg.click('[data-act=oyuncu-ekle]'); await pg.wait_for_timeout(800)
        await pg.click('[data-act=onb-iptal]'); await pg.wait_for_timeout(300)
        ok(sorted(await secici_adlar(pg)) == ['Toprak', 'Ömer'] and await pg.evaluate("JSON.parse(localStorage.getItem('matematik_yolu_profiller')).liste.length") == 2, '«Oyunculara dön» boş kaydı siler')
        await pg.click('[data-act=oyuncu-ekle]'); await pg.wait_for_timeout(800)
        await pg.evaluate("sessionStorage.removeItem('my_yer')"); await pg.reload(); await pg.wait_for_timeout(700)
        ok(sorted(await secici_adlar(pg)) == ['Toprak', 'Ömer'] and await pg.evaluate("JSON.parse(localStorage.getItem('matematik_yolu_profiller')).liste.length") == 2, 'Ad girilmeden kapatılan kardeş kaydı açılışta temizlenir')
        # Bir oyuncuyu silmek diğerini etkilemez
        await pg.click('.sec-kart:has-text("Ömer")'); await pg.wait_for_timeout(900)
        await pg.evaluate("(()=>{const a=window.MY_APP;a.view='home';a.tab='veli';a.veliAcik=true;window.MY_APP_RENDER();})()"); await pg.wait_for_timeout(200)
        await pg.click('[data-act=reset]'); await pg.wait_for_timeout(150)
        ok('Ömer' in await pg.inner_text('.modal'), 'Silme penceresi yalnız o oyuncuyu adıyla anar')
        await pg.click('[data-act=reset-yes]'); await pg.wait_for_timeout(400)
        ok(await pg.evaluate("window.MY_APP.st.profile && window.MY_APP.st.profile.name==='Toprak' && window.MY_APP.st.xp===120"), 'Ömer silinince Toprak olduğu gibi kalır')
        ok(await pg.evaluate("JSON.parse(localStorage.getItem('matematik_yolu_profiller')).liste.length") == 1 and await pg.query_selector('.sec-kart') is None, 'Tek oyuncu kalınca seçici gelmez')
        # ---- Pilot: kardeşlerin kaydı ayrı ----
        d = await sayfa(); await d.goto(APP + '?pilot=EV1'); await d.wait_for_timeout(600)
        await d.fill('#f-pd-ad', 'Ali'); await d.check('#f-pd-onay'); await d.click('[data-act=pd-katil]'); await d.wait_for_timeout(600)
        await d.click('[data-act=onb-next]'); await d.click('[data-act=onb-next]')
        await d.click('[data-act=motiv][data-v=kesif]'); await d.click('[data-act=onb-finish-skip]'); await d.wait_for_timeout(300)
        c1 = await d.evaluate("window.MY_APP.st.pilot.cihaz")
        await d.evaluate("window.MY_APP_START('lesson','g_temel')"); await d.wait_for_timeout(1300)
        await d.click('[data-act=quit]'); await d.wait_for_timeout(150); await d.click('[data-act=quit-yes]'); await d.wait_for_timeout(2000)
        await ben(d); await d.click('[data-act=oyuncu-ac]'); await d.click('[data-act=oyuncu-ekle]'); await d.wait_for_timeout(900)
        ok(await d.query_selector('[data-act=pd-katil]') is not None, 'Pilot telefonunda kardeşe de veli karşılaması gelir')
        await d.fill('#f-pd-ad', 'Ayşe'); await d.check('#f-pd-onay'); await d.click('[data-act=pd-katil]'); await d.wait_for_timeout(600)
        await d.click('[data-act=onb-next]'); await d.click('[data-act=onb-next]')
        await d.click('[data-act=motiv][data-v=kesif]'); await d.click('[data-act=onb-finish-skip]'); await d.wait_for_timeout(300)
        c2 = await d.evaluate("window.MY_APP.st.pilot.cihaz")
        ok(c1 and c2 and c1 != c2 and len(KAT) == 2, 'Kardeşlerin pilot numaraları ayrı')
        await d.evaluate("window.MY_APP_START('lesson','n_okuma')"); await d.wait_for_timeout(1300)
        await d.click('[data-act=quit]'); await d.wait_for_timeout(150); await d.click('[data-act=quit-yes]'); await d.wait_for_timeout(2000)
        b1 = [o['veri'].get('beceri') for o in OLAY if o['tur'] == 'ders_birak' and o['cihaz'] == c1]
        b2 = [o['veri'].get('beceri') for o in OLAY if o['tur'] == 'ders_birak' and o['cihaz'] == c2]
        ok(b1 == ['g_temel'] and b2 == ['n_okuma'], f'Her çocuğun dersi kendi numarasıyla kaydedildi ({b1} / {b2})')
        # Rumuzla giriş: açılışta seçici, aynı rumuz aynı kayda, yeni rumuz yeni kayda
        await d.evaluate("sessionStorage.removeItem('my_yer')"); await d.reload(); await d.wait_for_timeout(800)
        ok(sorted(await secici_adlar(d)) == ['Ali', 'Ayşe'] and await d.query_selector('#f-sec-ad') is not None, 'Açılışta oyuncular ve rumuz kutusu')
        await d.screenshot(path=OUT + 'profil_02_rumuz.png')
        await d.fill('#f-sec-ad', '  ALİ '); await d.click('[data-act=sec-gir]'); await d.wait_for_timeout(900)
        ok(await d.evaluate("window.MY_APP.st.profile.name") == 'Ali' and await d.evaluate("JSON.parse(localStorage.getItem('matematik_yolu_profiller')).liste.length") == 2, 'Aynı rumuz (büyük harf, boşluk) aynı kayda girer')
        await ben(d); await d.click('[data-act=oyuncu-ac]'); await d.fill('#f-sec-ad', 'Deniz'); await d.click('[data-act=sec-gir]'); await d.wait_for_timeout(900)
        ok(await d.query_selector('#f-pd-ad') is not None and await d.input_value('#f-pd-ad') == 'Deniz', 'Yeni rumuz: veli karşılaması rumuzla dolu gelir')
        await d.check('#f-pd-onay'); await d.click('[data-act=pd-katil]'); await d.wait_for_timeout(600)
        await d.click('[data-act=onb-next]'); await d.click('[data-act=onb-next]')
        await d.click('[data-act=motiv][data-v=kesif]'); await d.click('[data-act=onb-finish-skip]'); await d.wait_for_timeout(300)
        ok(await d.evaluate("window.MY_APP.st.profile.name==='Deniz' && window.MY_APP.st.xp===0") and len(KAT) == 3, 'Yeni rumuz ayrı kayıt ve ayrı pilot numarası')
        # Davet ekranında var olan rumuzu yazmak o kayda döndürür (yeni boş kayıt kalmaz)
        await ben(d); await d.click('[data-act=oyuncu-ac]'); await d.click('[data-act=oyuncu-ekle]'); await d.wait_for_timeout(900)
        await d.fill('#f-pd-ad', 'ayşe'); await d.check('#f-pd-onay'); await d.click('[data-act=pd-katil]'); await d.wait_for_timeout(700)
        ok(await d.evaluate("window.MY_APP.st.profile.name") == 'Ayşe' and await d.evaluate("JSON.parse(localStorage.getItem('matematik_yolu_profiller')).liste.length") == 3 and len(KAT) == 3, 'Davette var olan rumuz o çocuğun kaydına döner')
        # Bağlantısız tek çocuklu telefonda seçici açılmaz (yukarıda), Ben başlığında değiştir düğmesi
        await ben(d); ok(await d.query_selector('.prof-top [data-act=oyuncu-ac], h2 [data-act=oyuncu-ac]') is not None, 'Ben başlığında oyuncu değiştir düğmesi')
        # Vitrin (tanıtım): ilk kez gelen ziyaretçiye görünür; başla deyince kayda geçer ve bir daha gelmez; pilot bağlantısında görünmez
        v = await (await b.new_context(viewport={'width': 390, 'height': 844})).new_page(); await v.goto(APP); await v.wait_for_timeout(700)
        ok(await v.query_selector('.vt') is not None, 'İlk ziyarette vitrin görünür')
        await v.click('[data-act=vt-basla] >> nth=0'); await v.wait_for_timeout(300)
        ok(await v.query_selector('[data-act=pd-katil]') is not None, 'Hemen başla → önce veliye tek izin ekranı')
        await v.click('[data-act=pd-hayir]'); await v.wait_for_timeout(200)
        ok(await v.query_selector('[data-act=onb-next]') is not None, 'İzin ekranından sonra kayıt')
        await v.reload(); await v.wait_for_timeout(700); ok(await v.query_selector('.vt') is None, 'Bir kez geçilen vitrin yeniden gelmez')
        v2 = await (await b.new_context(viewport={'width': 390, 'height': 844})).new_page(); await v2.goto(APP + '?pilot=VT1'); await v2.wait_for_timeout(700)
        ok(await v2.query_selector('.vt') is None and await v2.query_selector('[data-act=pd-katil]') is not None, 'Pilot bağlantısında vitrin yok, veli karşılaması gelir')
        ok(not errs, f'Sayfa hatası yok {errs[:3]}')
        await b.close()
    print('BİTTİ hata:', len(HATA))
asyncio.run(main())

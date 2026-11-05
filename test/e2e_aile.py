# Aile kodu ile bulut yedeği: iki telefonlu uçtan uca test (25.10.2026).
# 03.11.2026: oyuncu adı + resimli şifre ile giriş (sunucu/supabase/oyuncu_giris.sql kuralları) eklendi.
# Sunucu, sunucu/supabase/aile_yedek.sql'deki kuralların aynısını uygulayan sahte bir sunucuyla taklit edilir
# (test ortamında Supabase'e ağ yok). Çalıştır: python3 test/e2e_aile.py
import asyncio, json, hashlib, re, pathlib, os
from playwright.async_api import async_playwright
OUT = str(pathlib.Path(__file__).resolve().parent / 'shots') + '/'
os.makedirs(OUT, exist_ok=True)
APP = (pathlib.Path(__file__).resolve().parent.parent / 'dist' / 'index.html').as_uri()
DB = {}; GIDEN = []; HATA = []; OY = {}; OYCAGRI = []
def ozet(k): return hashlib.sha256(re.sub('[^A-Za-z0-9]', '', k or '').upper().encode()).hexdigest()
def gecerli(k): return bool(re.fullmatch('[A-Z2-9]{16}', re.sub('[^A-Za-z0-9]', '', k or '').upper()))
def sunucu(fn, a):
    if fn == 'aile_yedek_kaydet':
        if not gecerli(a['p_kod']): return {'ok': False, 'hata': 'kod'}
        GIDEN.append(a['p_durum']); oz = ozet(a['p_kod']); m = DB.get(oz)
        if m and not a.get('p_zorla') and m['surum'] > (a.get('p_onceki') or 0) and m['surum'] != a['p_surum']:
            return {'ok': False, 'cakisma': True, 'surum': m['surum']}
        DB[oz] = {'durum': a['p_durum'], 'surum': a['p_surum']}; return {'ok': True, 'surum': a['p_surum']}
    if fn == 'aile_yedek_getir':
        m = DB.get(ozet(a['p_kod'])) if gecerli(a['p_kod']) else None
        if not m: return {'ok': False, 'hata': 'yok'}
        return {'ok': True, 'surum': m['surum']} if a.get('p_ozet') else {'ok': True, 'surum': m['surum'], 'durum': m['durum']}
    if fn == 'aile_yedek_sil': return DB.pop(ozet(a['p_kod']), None) is not None if gecerli(a['p_kod']) else False
    if fn == 'oyuncu_olustur':
        OYCAGRI.append(dict(a))
        if not gecerli(a['p_kod']): return {'ok': False, 'hata': 'kod'}
        if not re.fullmatch(r'[a-z]{2,12}\|[a-z]{3,12}\|[1-9][0-9]', a['p_ad'] or '') or not re.fullmatch('[0-9a-f]{3}', a['p_resim'] or ''): return {'ok': False, 'hata': 'bicim'}
        koz = ozet(a['p_kod'])
        if koz not in DB: return {'ok': False, 'hata': 'yedek_yok'}
        m = OY.get(a['p_ad'])
        if m and m['koz'] != koz: return {'ok': False, 'hata': 'alinmis'}
        for k in [k for k, v in OY.items() if v['koz'] == koz]: OY.pop(k)
        OY[a['p_ad']] = {'resim': a['p_resim'], 'kod': re.sub('[^A-Za-z0-9]', '', a['p_kod']).upper(), 'koz': koz, 'yanlis': 0, 'kilit': False}
        return {'ok': True}
    if fn == 'oyuncu_giris':
        OYCAGRI.append(dict(a)); m = OY.get(a['p_ad'])
        if not m or m['koz'] not in DB: return {'ok': False, 'hata': 'yanlis'}
        if m['kilit']: return {'ok': False, 'hata': 'kilit', 'dakika': 15}
        if a['p_resim'] != m['resim']:
            m['yanlis'] += 1
            if m['yanlis'] >= 5: m['kilit'] = True; m['yanlis'] = 0; return {'ok': False, 'hata': 'kilit', 'dakika': 15}
            return {'ok': False, 'hata': 'yanlis'}
        m['yanlis'] = 0; return {'ok': True, 'kod': m['kod']}
    return None
def ok(c, m):
    print(('✓ ' if c else 'HATA: ') + m)
    if not c: HATA.append(m)
async def telefon(b):
    ctx = await b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    await ctx.add_init_script("try{localStorage.setItem('my_vitrin_gecti','1')}catch(e){}")  # vitrin (tanıtım) testlerde atlanır
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    async def yol(route):
        fn = route.request.url.split('/rpc/')[-1]
        if fn.startswith('aile_') or fn.startswith('oyuncu_'): await route.fulfill(status=200, content_type='application/json', body=json.dumps(sunucu(fn, json.loads(route.request.post_data or '{}'))))
        else: await route.fulfill(status=200, content_type='application/json', body='null')
    await pg.route(re.compile(r'.*/rest/v1/rpc/.*'), yol)
    await pg.route(re.compile(r'.*cdn\.jsdelivr\.net.*'), lambda r: r.abort())
    await pg.goto(APP); await pg.wait_for_timeout(500)
    await pg.evaluate("window.MY_APP.st.settings.voice=false; window.MY_APP.st.settings.sound=false")
    return ctx, pg, errs
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        # --- A telefonu: kayıt, biraz ilerleme, veli onayı, yedek ---
        ctxA, A, errA = await telefon(b)
        await A.click('[data-act=onb-next]'); await A.fill('#f-name', 'Deniz')
        await A.click('[data-act=onb-next]'); await A.click('[data-act=motiv][data-v=kesif]'); await A.click('[data-act=onb-finish-skip]')
        await A.wait_for_timeout(300)
        await A.evaluate("""(()=>{const a=window.MY_APP; a.st.xp=850; a.st.streak=4; a.st.skills.g_temel.n=12; a.st.skills.g_temel.pL=.8; a.st.skills.n_okuma.n=6;
          a.st.profile.parentPhone='05321112233'; a.st.profile.parentName='Ayşe Hanım'; a.st.profile.parentEmail='veli@ornek.com'; a.view='home'; a.tab='veli'; window.MY_APP_RENDER();})()""")
        await A.fill('#f-pin1', '4826'); await A.fill('#f-pin2', '4826'); await A.click('[data-act=veli-pin-kur]'); await A.wait_for_timeout(300)
        await A.click('[data-act=aile-ac]'); await A.wait_for_timeout(300)
        ok(await A.query_selector('.aile-kod') is None, 'Onay kutusu işaretlenmeden yedek açılmaz')
        await A.check('#f-aile-onay'); await A.click('[data-act=aile-ac]'); await A.wait_for_timeout(800)
        kod = await A.inner_text('.aile-kod')
        ok(bool(re.fullmatch(r'[A-Z2-9]{4}(-[A-Z2-9]{4}){3}', kod)) and not re.search('[ILO01]', kod), f'Aile kodu üretildi ve okunaklı: {kod}')
        await A.screenshot(path=OUT + 'aile_01_yedek_acik.png', full_page=True)
        ok(len(DB) == 1, 'Sunucuda yalnız kodun özetiyle bir yedek var')
        g = json.dumps(GIDEN[-1], ensure_ascii=False)
        ok('05321112233' not in g and 'Ayşe' not in g and 'veli@ornek.com' not in g and '"veli"' not in g and kod.replace('-', '') not in g, 'Veli adı, telefon, e-posta, veli şifresi ve kodun kendisi buluta gitmedi')
        ok('"Deniz"' in g and '"xp": 850' in g, 'Çocuğun adı ve ilerlemesi buluta gitti')
        # --- B telefonu: kodla geri yükleme ---
        ctxB, B, errB = await telefon(b)
        await B.click('[data-act=onb-kod]'); await B.click('[data-act=onb-kod-ac]'); await B.fill('#f-aile-kod', 'yanlis-kod-1234-abcd'); await B.click('[data-act=aile-bul]'); await B.wait_for_timeout(300)
        ok(await B.query_selector('[data-act=aile-yukle]') is None, 'Yanlış kodla yedek bulunmaz')
        await B.fill('#f-aile-kod', kod.lower().replace('-', ' ')); await B.click('[data-act=aile-bul]'); await B.wait_for_timeout(400)
        await B.screenshot(path=OUT + 'aile_02_bulundu.png')
        ozet_ = await B.inner_text('.aile-ozet')
        ok('Deniz' in ozet_ and '850' in ozet_ and '2 konu' in ozet_, f'Yüklemeden önce özet gösterilir: {ozet_!r}')
        await B.click('[data-act=aile-yukle]'); await B.wait_for_timeout(500)
        st = await B.evaluate("({ad: window.MY_APP.st.profile.name, xp: window.MY_APP.st.xp, n: window.MY_APP.st.skills.g_temel.n, tel: window.MY_APP.st.profile.parentPhone || null, kod: window.MY_APP.st.aile && window.MY_APP.st.aile.kod, view: window.MY_APP.view})")
        ok(st['ad'] == 'Deniz' and st['xp'] == 850 and st['n'] == 12 and st['view'] == 'home', 'B telefonuna ilerleme geldi, doğrudan haritaya geçti')
        ok(st['tel'] is None, 'Velinin telefonu yeni telefona taşınmadı (buluta hiç gitmemişti)')
        ok(st['kod'] == kod.replace('-', ''), 'B telefonu aynı aile koduyla eşitlemeye devam eder')
        await B.screenshot(path=OUT + 'aile_03_b_harita.png')
        # --- B ilerler, A uygulamaya dönünce yeni ilerlemeyi alır ---
        await B.evaluate("(()=>{const a=window.MY_APP; a.st.xp=990; a.st.skills.n_okuma.n=14;})()")
        await B.evaluate("window.MY_APP.st.aile.kirli=true"); await B.evaluate("document.dispatchEvent(new Event('visibilitychange'))")
        # kaydı tetikle: B'de uygulama içi bir kayıt (sekme değiştir → save çağıran bir eylem yerine doğrudan gizlenme olayı)
        await B.evaluate("Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true}); document.dispatchEvent(new Event('visibilitychange'))")
        await B.wait_for_timeout(800)
        ok(list(DB.values())[0]['durum']['xp'] == 990, 'B telefonundaki yeni ilerleme buluta gitti')
        await A.evaluate("Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true}); document.dispatchEvent(new Event('visibilitychange'))")
        await A.wait_for_timeout(900)
        ok(await A.evaluate("window.MY_APP.st.xp") == 990, 'A telefonu uygulamaya dönünce diğer telefondaki ilerlemeyi aldı')
        ok(await A.evaluate("window.MY_APP.st.profile.parentPhone") == '05321112233', 'A telefonundaki veli bilgileri korunur')
        # --- Oyuncu adı + resimli şifre: veli A'da oluşturur, çocuk C telefonunda kendi başına girer ---
        await A.evaluate("Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true}); window.MY_APP.view='home'; window.MY_APP.tab='veli'; window.MY_APP_RENDER()")
        if await A.query_selector('#f-pin'): await A.fill('#f-pin', '4826'); await A.click('[data-act=veli-pin-gir]'); await A.wait_for_timeout(300)
        await A.click('[data-act=oy-kur-basla]'); await A.wait_for_timeout(200)
        await A.fill('#f-oy-ad', ''); await A.click('[data-act=oy-ad-tamam]'); await A.wait_for_timeout(150)
        ok('adını yazın' in (await A.inner_text('.oy-kur')), 'Ad boşken oyuncu adı oluşmaz')
        await A.fill('#f-oy-ad', 'deniz su'); await A.click('[data-act=oy-ad-tamam]'); await A.wait_for_timeout(150)
        oyA = await A.evaluate("({ad: window.MY_APP.oy.ad, hayvan: window.MY_APP.oy.hayvan, sayi: window.MY_APP.oy.sayi})")
        ok(oyA['ad'] == 'Deniz' and 10 <= int(oyA['sayi']) <= 99, f'Oyuncu adı ad·hayvan·sayı: {oyA}')
        for i in (3, 8, 13): await A.click(f'.oy-izgara [data-v="{i}"]'); await A.wait_for_timeout(60)
        ok('aynı sırayla' in (await A.inner_text('.oy-kur')), 'Resimler ikinci kez istenir')
        for i in (3, 13, 8): await A.click(f'.oy-izgara [data-v="{i}"]'); await A.wait_for_timeout(60)
        ok('aynı değildi' in (await A.inner_text('.oy-kur')) and not OY, 'Tekrar farklı seçilince kaydedilmez, baştan istenir')
        for i in (3, 8, 13, 3, 8, 13): await A.click(f'.oy-izgara [data-v="{i}"]'); await A.wait_for_timeout(60)
        await A.wait_for_timeout(500)
        await A.screenshot(path=OUT + 'aile_04_oyuncu_hazir.png', full_page=True)
        anahtar = f"deniz|{oyA['hayvan']}|{oyA['sayi']}"
        ok(list(OY.keys()) == [anahtar] and OY[anahtar]['resim'] == '38d', f'Sunucuda oyuncu adı oluştu ({anahtar}, resimler 38d)')
        ok(await A.evaluate("JSON.stringify(window.MY_APP.st).indexOf('38d') < 0 && !!window.MY_APP.st.oyuncu"), 'Resimli şifre telefonda saklanmaz, oyuncu adı saklanır')
        await A.click('[data-act=oy-bitti]'); await A.wait_for_timeout(200)
        ok(await A.query_selector('.aile-kart .oy-adkart') is not None and await A.query_selector('[data-act=oy-kur-basla][data-v=degis]') is not None, 'Veli kartında oyuncu adı ve "resimli şifreyi değiştir" görünür')
        # Başka aile aynı adı alamaz → uygulama yeni sayı dener
        DB['baska'] = {'durum': {}, 'surum': 1}; OY['deniz|panda|50'] = {'resim': 'fff', 'kod': 'X', 'koz': 'baska', 'yanlis': 0, 'kilit': False}
        # C telefonu: sıfırdan, oyuncu adıyla
        ctxC, C, errC = await telefon(b)
        await C.click('[data-act=onb-kod]'); await C.wait_for_timeout(200)
        await C.screenshot(path=OUT + 'aile_05_oyuncu_giris.png', full_page=True)
        async def gir(pg, ad, hayvan, sayi, resim):
            await pg.fill('#f-oy-ad', ad); await pg.click(f'[data-act=oy-hayvan][data-v="{hayvan}"]'); await pg.fill('#f-oy-sayi', str(sayi))
            for i in resim: await pg.click(f'.oy-izgara [data-v="{i}"]'); await pg.wait_for_timeout(40)
            await pg.click('[data-act=oy-giris]'); await pg.wait_for_timeout(500)
        await gir(C, 'DENİZ', oyA['hayvan'], oyA['sayi'], (3, 13, 8))
        ok(await C.query_selector('[data-act=aile-yukle]') is None and 'eşleşmedi' in (await C.inner_text('.oy-giris')), 'Yanlış resim sırasıyla giriş olmaz, çocuğa nazik uyarı')
        ok(await C.input_value('#f-oy-ad') == 'DENİZ' and await C.input_value('#f-oy-sayi') == str(oyA['sayi']), 'Yanlıştan sonra ad ve sayı silinmez, yalnız resimler')
        await gir(C, 'DENİZ', oyA['hayvan'], oyA['sayi'], (3, 8, 13))
        ok(OYCAGRI[-1]['p_ad'] == anahtar, 'Büyük harf ve İ ile yazılan ad aynı oyuncu adına gider')
        ozC = await C.inner_text('.aile-ozet') if await C.query_selector('.aile-ozet') else ''
        ok('Deniz' in ozC, f'Doğru resimlerle yedeğin özeti gelir: {ozC!r}')
        await C.click('[data-act=aile-yukle]'); await C.wait_for_timeout(500)
        stC = await C.evaluate("({xp: window.MY_APP.st.xp, kod: window.MY_APP.st.aile && window.MY_APP.st.aile.kod, oy: window.MY_APP.st.oyuncu, view: window.MY_APP.view})")
        ok(stC['xp'] == 990 and stC['kod'] == kod.replace('-', '') and stC['view'] == 'home' and stC['oy'] and stC['oy']['sayi'] == int(oyA['sayi']), 'C telefonuna ilerleme geldi, eşitleme aile koduyla sürer')
        # Kaba kuvvet: 5 yanlışta kilit (D telefonu, Ben sekmesinden; zaten kayıtlı çocuk)
        ctxD, D, errD = await telefon(b)
        await D.click('[data-act=onb-next]'); await D.fill('#f-name', 'Ali'); await D.click('[data-act=onb-next]'); await D.click('[data-act=motiv][data-v=kesif]'); await D.click('[data-act=onb-finish-skip]'); await D.wait_for_timeout(300)
        await D.evaluate("window.MY_APP.view='home'; window.MY_APP.tab='profil'; window.MY_APP_RENDER()")
        await D.click('[data-act=oy-ac]'); await D.wait_for_timeout(200)
        for n in range(5): await gir(D, 'Deniz', oyA['hayvan'], oyA['sayi'], (0, 0, n + 1))
        ok('dakika sonra' in (await D.inner_text('.oy-modal')), '5 yanlış denemeden sonra 15 dakika bekleme')
        await gir(D, 'Deniz', oyA['hayvan'], oyA['sayi'], (3, 8, 13))
        ok(await D.query_selector('[data-act=aile-yukle]') is None, 'Kilitliyken doğru resimle bile girilemez')
        await D.screenshot(path=OUT + 'aile_06_kilit.png')
        await D.click('.oy-modal [data-act=close-modal]'); await D.wait_for_timeout(150)
        ok(await D.evaluate("window.MY_APP.st.profile.name") == 'Ali' and await D.query_selector('.oy-modal') is None, 'Pencere kapanınca D telefonundaki kayıt olduğu gibi kalır')
        # Yedek uyarısı: yedeği kapalı, 2 ders yapmış çocuğa haritada çıkar; ✕ ile gizlenir
        await D.evaluate("(()=>{const a=window.MY_APP; a.st.sessions=[{},{}]; a.tab='yol'; window.MY_APP_RENDER();})()"); await D.wait_for_timeout(200)
        ok(await D.query_selector('.yedek-uyari') is not None, 'Yedeği kapalı çocuğa haritada "ilerlemen korunsun" uyarısı')
        await D.click('[data-act=yedek-uyari-kapat]'); await D.wait_for_timeout(150)
        ok(await D.query_selector('.yedek-uyari') is None, 'Uyarı kapatılınca gizlenir')
        ok(await C.query_selector('.yedek-uyari') is None, 'Yedeği açık telefonda uyarı yok')
        ok(not errC and not errD, f'C/D sayfa hatası yok {errC + errD}')
        DB.pop('baska', None)
        # --- Çakışma: ikisi de ayrı ayrı ilerler; XP'si fazla olan kazanır ---
        await A.evaluate("(()=>{const a=window.MY_APP; a.st.xp=1000; a.st.aile.kirli=true;})()")
        await B.evaluate("(()=>{const a=window.MY_APP; a.st.xp=1200; a.st.aile.kirli=true;})()")
        await B.evaluate("document.dispatchEvent(new Event('visibilitychange'))"); await B.wait_for_timeout(700)
        await A.evaluate("Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true}); document.dispatchEvent(new Event('visibilitychange'))"); await A.wait_for_timeout(900)
        ok(list(DB.values())[0]['durum']['xp'] == 1200 and await A.evaluate("window.MY_APP.st.xp") == 1200, 'Çakışmada daha ileri olan (1200 XP) tutuldu, geride olan üstüne yazamadı')
        # --- Yedeği silme ---
        await A.evaluate("Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true}); window.MY_APP.view='home'; window.MY_APP.tab='veli'; window.MY_APP_RENDER()")
        if await A.query_selector('#f-pin'): await A.fill('#f-pin', '4826'); await A.click('[data-act=veli-pin-gir]'); await A.wait_for_timeout(300)
        await A.click('[data-act=aile-sil]'); await A.wait_for_timeout(200); await A.click('[data-act=aile-sil-evet]'); await A.wait_for_timeout(500)
        ok(len(DB) == 0 and await A.evaluate("!window.MY_APP.st.aile") and await A.evaluate("window.MY_APP.st.xp") == 1200, 'Yedek silindi, telefondaki ilerleme duruyor')
        ok(not errA and not errB, f'Sayfa hatası yok {errA + errB}')
        await b.close()
    print('BİTTİ', 'hata:', len(HATA))
asyncio.run(main())

# Aile kodu ile bulut yedeği: iki telefonlu uçtan uca test (25.10.2026).
# Sunucu, sunucu/supabase/aile_yedek.sql'deki kuralların aynısını uygulayan sahte bir sunucuyla taklit edilir
# (test ortamında Supabase'e ağ yok). Çalıştır: python3 test/e2e_aile.py
import asyncio, json, hashlib, re, pathlib, os
from playwright.async_api import async_playwright
OUT = str(pathlib.Path(__file__).resolve().parent / 'shots') + '/'
os.makedirs(OUT, exist_ok=True)
APP = (pathlib.Path(__file__).resolve().parent.parent / 'dist' / 'index.html').as_uri()
DB = {}; GIDEN = []; HATA = []
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
    return None
def ok(c, m):
    print(('✓ ' if c else 'HATA: ') + m)
    if not c: HATA.append(m)
async def telefon(b):
    ctx = await b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    async def yol(route):
        fn = route.request.url.split('/rpc/')[-1]
        if fn.startswith('aile_'): await route.fulfill(status=200, content_type='application/json', body=json.dumps(sunucu(fn, json.loads(route.request.post_data or '{}'))))
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
        await B.click('[data-act=onb-kod]'); await B.fill('#f-aile-kod', 'yanlis-kod-1234-abcd'); await B.click('[data-act=aile-bul]'); await B.wait_for_timeout(300)
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

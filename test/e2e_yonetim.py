# Yönetim sayfası (09.11.2026): giriş, yanlış şifre, kilit mesajı, panel, zararlı metin (XSS) kaçışı, çerçeve koruması,
# şifre değiştirme, çıkış. Sahte sunucu; gerçek sunucu kuralları sunucu/supabase/yonetici.sql'de ve veritabanında denendi.
import asyncio, json, pathlib, re
from playwright.async_api import async_playwright
R = pathlib.Path(__file__).resolve().parent
SAYFA = (R.parent / 'dist' / 'yonetim' / 'index.html')
HATA = []
def ok(c, m):
    print(('✓ ' if c else 'HATA: ') + m)
    if not c: HATA.append(m)

KOTU = '<img src=x onerror="window.SALDIRI=1">'
OZET = {'ok': True, 'ad': 'onur', 'bas': '2026-10-11', 'bugun': '2026-11-09',
  'kullanici': {'bugun': 3, 'hafta': 5, 'ay': 9, 'yeni_donem': 4, 'ilk_kayit': '2026-11-09'},
  'gunluk': [{'gun': '2026-11-08', 'acan': 2, 'yeni': 1, 'kayitli': 2, 'donen': 1, 'ders': 4, 'biten': 3, 'cevap': 20}, {'gun': '2026-11-09', 'acan': 3, 'yeni': 0, 'kayitli': 3, 'donen': 3, 'ders': 6, 'biten': 5, 'cevap': 41}],
  'donus': {'d1': 2, 'd2_7': 1}, 'toplam': {'cevap': 61, 'ilk': 40, 'ipucu': 12, 'cozum': 9, 'ort_sn': 21.5},
  'zor': [{'beceri': 'g_temel', 'kalip': 'abcd1234', 'metin': KOTU, 'tur': 'mc', 'n': 3, 'ilk': 0, 'ipucu': 1, 'cozum': 2, 'ort_sn': 40.2}],
  'uzun': [], 'ipucu': [], 'beceri': [{'beceri': 'g_temel', 'n': 3, 'ilk_yuzde': 0, 'ipucu_yuzde': 33, 'ort_sn': 40.2}],
  'yanilgi': [{'mis': 'isin_dogru', 'n': 2}, {'mis': KOTU, 'n': 1}], 'birakma': [{'mod': 'lesson', 'beceri': 'g_temel', 'basla': 2, 'bitti': 1, 'birak': 1}],
  'birak_soru': {'3': 1}, 'hizmet': {'yedek': 5, 'yedek_7g': 4, 'oyuncu': 1, 'pilot': 1, 'bildirim': 3, 'eposta': 0},
  'girisler': [{'zaman': '2026-11-09T10:00:00Z', 'olay': 'giris', 'ad': 'onur'}]}
GELEN = []
async def yol(route):
    fn = route.request.url.rsplit('/', 1)[-1]; g = json.loads(route.request.post_data or '{}'); GELEN.append((fn, g))
    if fn == 'yonetici_giris':
        c = {'ok': True, 'belirtec': 'b' * 64, 'ad': 'onur'} if g.get('p_sifre') == 'DogruSifre2026' else {'ok': False, 'hata': 'kilitli', 'dakika': 30} if g.get('p_sifre') == 'kilit' else {'ok': False, 'hata': 'yanlis'}
    elif fn == 'yonetici_ozet': c = OZET if g.get('p_belirtec') == 'b' * 64 else {'ok': False, 'hata': 'oturum'}
    elif fn == 'yonetici_sifre_degistir': c = {'ok': True} if g.get('p_eski') == 'DogruSifre2026' else {'ok': False, 'hata': 'yanlis'}
    elif fn == 'yonetici_kur': c = {'ok': False, 'hata': 'kod'}
    else: c = {'ok': True}
    await route.fulfill(status=200, content_type='application/json', body=json.dumps(c))

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); c = await b.new_context(viewport={'width': 1280, 'height': 900}); errs = []
        pg = await c.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.route(re.compile(r'.*/rest/v1/rpc/.*'), yol)
        await pg.goto(SAYFA.as_uri()); await pg.wait_for_timeout(400)
        ok(await pg.query_selector('#ad') is not None and await pg.query_selector('#sf') is not None, 'giriş formu görünüyor')
        csp = await pg.evaluate("document.querySelector('meta[http-equiv=Content-Security-Policy]')?.content||''")
        ok("default-src 'none'" in csp and 'connect-src https://yrhegvpzmjqrwdgrjfer.supabase.co' in csp, 'içerik güvenlik politikası var')
        ok(await pg.evaluate("document.querySelector('meta[name=robots]').content.includes('noindex')"), 'arama motorlarına kapalı')
        await pg.fill('#ad', 'onur'); await pg.fill('#sf', 'yanlis'); await pg.click('#gir'); await pg.wait_for_timeout(300)
        ok('yanlış' in (await pg.inner_text('#h')), 'yanlış şifre mesajı')
        ok(await pg.input_value('#sf') == '', 'yanlış şifreden sonra şifre kutusu temizlendi')
        await pg.fill('#sf', 'kilit'); await pg.click('#gir'); await pg.wait_for_timeout(300)
        ok('30 dakika' in (await pg.inner_text('#h')), 'kilit mesajı süreyle')
        await pg.fill('#sf', 'DogruSifre2026'); await pg.click('#gir'); await pg.wait_for_timeout(600)
        govde = await pg.inner_text('main')
        ok('bu hafta açan telefon' in govde and 'Nokta, Doğru, Işın' in govde and 'Işın ile doğruyu karıştırma' in govde, 'panel açıldı, konu ve yanılgı adları okunur')
        ok(await pg.evaluate("window.SALDIRI") is None and await pg.query_selector('main img[src=x]') is None and KOTU in govde, 'zararlı metin çalışmadı, yazı olarak göründü')
        ok(await pg.evaluate("sessionStorage.getItem('my_yonetim_oturum')") == 'b' * 64 and await pg.evaluate("localStorage.length") == 0, 'oturum yalnız bu sekmede (sessionStorage), kalıcı depoda yok')
        await pg.select_option('#gun', '7'); await pg.wait_for_timeout(400)
        ok(GELEN[-1] == ('yonetici_ozet', {'p_belirtec': 'b' * 64, 'p_gun': 7}), 'dönem seçimi sunucuya gidiyor')
        await pg.click('#sd'); await pg.fill('#e', 'yanlis'); await pg.fill('#y1', 'YeniSifre2027x'); await pg.fill('#y2', 'YeniSifre2027x'); await pg.click('#fs button[type=submit]'); await pg.wait_for_timeout(300)
        ok('yanlış' in (await pg.inner_text('#hs')), 'şifre değiştirmede eski şifre yanlış')
        await pg.fill('#e', 'DogruSifre2026'); await pg.click('#fs button[type=submit]'); await pg.wait_for_timeout(300)
        ok(await pg.query_selector('#ad') is not None and await pg.evaluate("sessionStorage.getItem('my_yonetim_oturum')") is None, 'şifre değişince oturum kapandı')
        await pg.fill('#ad', 'onur'); await pg.fill('#sf', 'DogruSifre2026'); await pg.click('#gir'); await pg.wait_for_timeout(500)
        await pg.click('#cik'); await pg.wait_for_timeout(300)
        ok(await pg.query_selector('#ad') is not None and GELEN[-1][0] == 'yonetici_cikis', 'çıkış sunucuya bildirildi')
        # Süresi geçmiş oturum
        await pg.evaluate("sessionStorage.setItem('my_yonetim_oturum','eski')"); await pg.reload(); await pg.wait_for_timeout(500)
        ok('kapandı' in (await pg.inner_text('#h')), 'geçersiz oturumda giriş ekranına döner')
        # Kurulum formu
        await pg.click('details summary'); await pg.fill('#kk', 'X'); await pg.fill('#kad', 'onur'); await pg.fill('#ks1', 'abc'); await pg.fill('#ks2', 'abd'); await pg.click('#fk button'); await pg.wait_for_timeout(200)
        ok('aynı değil' in (await pg.inner_text('#hk')), 'kurulumda şifre tekrarı denetleniyor')
        # Başka sitenin çerçevesinde açılınca içerik gösterilmez
        cerceve = R / 'cerceve_deneme.html'; cerceve.write_text(f'<iframe src="{SAYFA.as_uri()}" width=800 height=600></iframe>')
        p2 = await c.new_page(); await p2.goto(cerceve.as_uri()); await p2.wait_for_timeout(800)
        icerik = ''
        for f in p2.frames[1:]:
            try: icerik += await f.evaluate("document.getElementById('m') ? document.getElementById('m').innerHTML : ''")
            except Exception: pass
        ok('Yönetim girişi' not in icerik, 'çerçeve içinde form çizilmedi')
        cerceve.unlink()
        ok(not errs, f'sayfa hatası yok {errs[:2]}')
        await b.close()
    print('BİTTİ hata:', len(HATA))
asyncio.run(main())

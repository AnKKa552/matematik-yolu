# Haftalık rapor e-postası: Veli alanındaki kart, doğrulama, rapor yükleme, durdurma (sahte sunucuyla).
import asyncio, json, pathlib, re
from playwright.async_api import async_playwright
APP = (pathlib.Path(__file__).resolve().parent.parent / 'dist' / 'index.html').as_uri()
SAYFA = (pathlib.Path(__file__).resolve().parent.parent / 'dist' / 'eposta' / 'index.html').as_uri()
HATA = []
def ok(c, m):
    print(('✓ ' if c else 'HATA: ') + m)
    if not c: HATA.append(m)

S = {'kurulu': False, 'satir': None, 'gonderilen': [], 'cagri': [], 'token': 'onaybelirteci_1234567890abc'}
def sunucu(g):
    S['cagri'].append(g.get('is'))
    is_ = g.get('is')
    if is_ == 'durum':
        if not S['kurulu']: return {'kurulu': False}
        r = S['satir']
        if not r or r['cihaz'] != g.get('cihaz') or r['gizli'] != g.get('gizli'): return {'kurulu': True, 'var': False}
        return {'kurulu': True, 'var': True, 'eposta': 've***@ornek.com', 'onayli': r['onayli']}
    if is_ == 'kaydet':
        if not S['kurulu']: return {'hata': 'kurulu_degil'}
        if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[a-z]{2,}', g.get('eposta', '')): return {'hata': 'eposta'}
        if g.get('riza') != 'rapor-eposta-v1': return {'hata': 'riza'}
        S['satir'] = {'cihaz': g['cihaz'], 'gizli': g['gizli'], 'eposta': g['eposta'], 'ad': g.get('ad'), 'onayli': False, 'rapor': None}
        S['gonderilen'].append(('dogrulama', g['eposta']))
        return {'ok': True, 'eposta': 've***@ornek.com', 'onayli': False}
    if is_ == 'onayla':
        if S['satir'] and g.get('token') == S['token']: S['satir']['onayli'] = True; return {'ok': True, 'eposta': 've***@ornek.com'}
        return {'hata': 'gecersiz'}
    if is_ == 'rapor':
        r = S['satir']
        if not r or r['gizli'] != g.get('gizli'): return {'hata': 'yok'}
        if not r['onayli']: return {'hata': 'onaysiz'}
        r['rapor'] = g.get('rapor'); return {'ok': True}
    if is_ == 'sil':
        if S['satir'] and S['satir']['gizli'] == g.get('gizli'): S['satir'] = None
        return {'ok': True}
    if is_ == 'cikis':
        S['satir'] = None; return {'ok': True}
    return {'hata': 'is'}

async def yol(route):
    g = json.loads(route.request.post_data or '{}')
    await route.fulfill(status=200, content_type='application/json', headers={'Access-Control-Allow-Origin': '*'}, body=json.dumps(sunucu(g)))

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); errs = []
        c = await b.new_context(viewport={'width': 390, 'height': 844})
        await c.add_init_script("try{localStorage.setItem('my_vitrin_gecti','1')}catch(e){}")
        pg = await c.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.route(re.compile(r'.*/functions/v1/veli-eposta.*'), yol)
        await pg.route(re.compile(r'.*/rest/v1/rpc/.*'), lambda r: r.fulfill(status=200, content_type='application/json', body='null'))
        await pg.goto(APP); await pg.wait_for_timeout(500)
        await pg.evaluate("""(()=>{const A=window.MY_APP;A.st.profile={name:'Ela',motivation:'kesif',created:Date.now()};A.st.settings.voice=false;A.st.settings.sound=false;window.MY_E.save(A.st);A.view='home';A.tab='veli';window.MY_APP_RENDER();})()""")
        await pg.fill('#f-pin1', '4826'); await pg.fill('#f-pin2', '4826'); await pg.click('[data-act=veli-pin-kur]'); await pg.wait_for_timeout(600)
        ok(await pg.query_selector('.eposta-kart') is None, 'Gönderim servisi kurulu değilken kart görünmez')
        # Servis kuruldu
        S['kurulu'] = True
        await pg.evaluate("(()=>{const A=window.MY_APP;A._epostaBakildi=false;A.tab='profil';window.MY_APP_RENDER();A.tab='veli';A.veliAcik=true;window.MY_APP_RENDER();})()"); await pg.wait_for_timeout(600)
        ok(await pg.query_selector('.eposta-kart') is not None, 'Servis kuruluyken kart görünür')
        await pg.screenshot(path='/tmp/claude-0/shots/eposta_kart.png', full_page=False)
        await pg.fill('#f-eposta', 'veli@ornek.com'); await pg.click('[data-act=eposta-kaydet]'); await pg.wait_for_timeout(300)
        ok(S['satir'] is None, 'Onay kutusu işaretlenmeden kayıt olmaz')
        await pg.fill('#f-eposta', 'veli-ornek'); await pg.check('#f-eposta-onay'); await pg.click('[data-act=eposta-kaydet]'); await pg.wait_for_timeout(300)
        ok(S['satir'] is None, 'Geçersiz adresle kayıt olmaz')
        await pg.fill('#f-eposta', 'Veli@Ornek.com'); await pg.check('#f-eposta-onay'); await pg.click('[data-act=eposta-kaydet]'); await pg.wait_for_timeout(600)
        ok(S['satir'] and S['satir']['eposta'] == 'veli@ornek.com' and S['satir']['ad'] == 'Ela', 'Kayıt: adres küçük harfe çevrildi, ad gitti')
        ok(('dogrulama', 'veli@ornek.com') in S['gonderilen'], 'Doğrulama e-postası istendi')
        ok('Onay e-postası gönderildi' in await pg.inner_text('.eposta-kart'), 'Kart «onay bekliyor» durumunda')
        # Onaylanmadan rapor yüklenmez
        await pg.evaluate("window.MY_APP_START('lesson','g_temel')"); await pg.wait_for_timeout(1200)
        n0 = S['cagri'].count('rapor')
        # Onay sayfası
        o = await c.new_page(); await o.route(re.compile(r'.*/functions/v1/veli-eposta.*'), yol)
        await o.goto(SAYFA + '?onay=' + S['token']); await o.wait_for_timeout(500)
        ok(not S['satir']['onayli'], 'Bağlantıyı açmak tek başına onaylamaz (tarayıcı taraması)')
        await o.click('#d'); await o.wait_for_timeout(500)
        ok(S['satir']['onayli'] and 'Onaylandı' in await o.inner_text('body'), 'Düğmeyle onaylandı')
        await o.goto(SAYFA + '?onay=yanlisbelirtec_000000000000'); await o.wait_for_timeout(300); await o.click('#d'); await o.wait_for_timeout(400)
        ok('geçerli değil' in await o.inner_text('body'), 'Yanlış belirteç reddedilir')
        # Uygulamada «Onayladım»
        await pg.evaluate("(()=>{const A=window.MY_APP;A.view='home';A.tab='veli';A.veliAcik=true;window.MY_APP_RENDER();})()"); await pg.wait_for_timeout(300)
        await pg.click('[data-act=eposta-yenile]'); await pg.wait_for_timeout(2300)
        ok('e-postası açık' in await pg.inner_text('.eposta-kart'), 'Uygulama onayı gördü')
        # Ders sonunda rapor yüklenir
        await pg.evaluate("""(()=>{const A=window.MY_APP;A.st.sessions.push({at:Date.now(),ms:300000,xp:60,n:8,acc:.75,mode:'lesson'});A.st.eposta.yuklendi=0;window.MY_E.save(A.st);})()""")
        await pg.reload(); await pg.wait_for_timeout(500)  # açılışta yüklenir (ders sonunda da aynı işlev çağrılır)
        await pg.wait_for_timeout(3200)
        r = (S['satir'] or {}).get('rapor') or ''
        ok('Haftalık Gelişim Raporu' in r and 'Ela' in r, f'Onaylı adreste rapor yüklendi ({len(r)} karakter)')
        ok(n0 == 0, 'Onaylanmadan önce rapor yüklenmedi')
        # Yedeğe girmez
        ok(await pg.evaluate("(()=>{const A=window.MY_APP;return !!A.st.eposta})()"), 'Telefonda e-posta kimliği var')
        # Durdur
        await pg.evaluate("(()=>{const A=window.MY_APP;A.view='home';A.tab='veli';A.veliAcik=true;window.MY_APP_RENDER();})()"); await pg.wait_for_timeout(300)
        await pg.click('[data-act=eposta-sil]'); await pg.wait_for_timeout(500)
        ok(S['satir'] is None and await pg.query_selector('#f-eposta') is not None, 'Raporları durdur: sunucudan silindi, form geri geldi')
        # Çıkış sayfası
        S['satir'] = {'cihaz': 'x', 'gizli': 'y', 'eposta': 'a@b.co', 'onayli': True, 'rapor': None}
        await o.goto(SAYFA + '?cikis=11111111-1111-1111-1111-111111111111.abc'); await o.wait_for_timeout(400)
        ok(S['satir'] is not None, 'Çıkış bağlantısını açmak tek başına silmez')
        await o.click('#d'); await o.wait_for_timeout(400)
        ok(S['satir'] is None and 'durduruldu' in await o.inner_text('body'), 'Çıkış düğmesiyle silindi')
        ok(not errs, f'Sayfa hatası yok {errs[:2]}')
        await b.close()
    print('BİTTİ hata:', len(HATA))
asyncio.run(main())

# Pilot çalışma: isimsiz kullanım kaydı uçtan uca testi (03.11.2026).
# Sunucu, sunucu/supabase/pilot.sql ve pilot_silme.sql'deki kuralları uygulayan sahte bir sunucuyla taklit edilir.
# Çalıştır: python3 test/e2e_pilot.py
import asyncio, json, re, pathlib, os
from playwright.async_api import async_playwright
OUT = str(pathlib.Path(__file__).resolve().parent / 'shots') + '/'
os.makedirs(OUT, exist_ok=True)
APP = (pathlib.Path(__file__).resolve().parent.parent / 'dist' / 'index.html').as_uri()
KAT = {}; OLAY = []; HAM = []; HATA = []
TURLER = {'acilis', 'ders_basla', 'cevap', 'ders_bitti', 'ders_birak', 'kart', 'test'}
def sunucu(fn, a):
    if fn == 'pilot_katil':
        if not re.fullmatch(r'[A-Za-z0-9_-]{22}', a.get('p_cihaz') or ''): return {'ok': False, 'hata': 'cihaz'}
        if not re.fullmatch(r'pilot-v[0-9]{1,3}', a.get('p_riza') or ''): return {'ok': False, 'hata': 'riza'}
        g = re.sub('[^A-Za-z0-9-]', '', a.get('p_grup') or '').upper() or None
        KAT[a['p_cihaz']] = {'grup': g, 'riza': a['p_riza']}; return {'ok': True}
    if fn == 'pilot_kaydet':
        HAM.append(json.dumps(a, ensure_ascii=False))
        if not re.fullmatch(r'[A-Za-z0-9_-]{22}', a.get('p_cihaz') or ''): return {'ok': False, 'hata': 'cihaz'}
        if a['p_cihaz'] not in KAT: return {'ok': False, 'hata': 'katilim_yok'}
        L = a.get('p_olaylar') or []
        if len(L) > 100: return {'ok': False, 'hata': 'bicim'}
        n = 0
        for o in L:
            if o.get('tur') in TURLER and len(json.dumps(o.get('veri') or {})) <= 1024: OLAY.append(dict(o, cihaz=a['p_cihaz'])); n += 1
        return {'ok': True, 'alindi': n}
    if fn == 'pilot_ayril':
        c = a.get('p_cihaz'); KAT.pop(c, None)
        OLAY[:] = [o for o in OLAY if o['cihaz'] != c]; return {'ok': True}
    return None
def ok(c, m):
    print(('✓ ' if c else 'HATA: ') + m)
    if not c: HATA.append(m)
async def cevapla(pg):
    if await pg.evaluate("!!window.MY_APP.fb"):
        await pg.click('[data-act=next]', force=True); await pg.wait_for_timeout(200); return
    q = await pg.evaluate("(()=>{const q=window.MY_APP.q;return {type:q.type,answer:q.answer,ok:(q.options||[]).findIndex(o=>o.ok)}})()")
    if q['type'] == 'match':
        M = await pg.evaluate("window.MY_APP.mt")
        for i in range(len(M['L'])):
            j = M['R'].index(M['L'][i]); await pg.click(f'[data-act=mt][data-v="L{i}"]'); await pg.click(f'[data-act=mt][data-v="R{j}"]'); await pg.wait_for_timeout(60)
        await pg.wait_for_timeout(700); await pg.click('[data-act=next]'); await pg.wait_for_timeout(120); return
    if q['type'] in ('kes', 'olc', 'graf', 'tablo', 'kur'):
        await pg.evaluate("""(()=>{const A=window.MY_APP,q=A.q; if(q.type==='olc') A.olc.aci=q.hedef; else if(q.type==='graf') A.graf=q.degerler.map(v=>v/q.adim);
          else if(q.type==='kes'){ if(q.model==='line') A.kes.konum=q.hedef[0]; else { const P=q.parca||q.hedef[1], b=q.hedef[0]*P/q.hedef[1]; A.kes.parca=P; A.kes.on=Array.from({length:P},(_,i)=>i<b); } } window.MY_APP_RENDER();})()""")
    elif q['type'] == 'input':
        for ch in q['answer'].replace('.', ','): await pg.click(f'[data-act=key][data-v="{ch}"]')
    else:
        await pg.click(f'[data-act=opt][data-v="{q["ok"]}"]')
    await pg.click('[data-act=check]', force=True)
    try: await pg.wait_for_selector('[data-act=next]', timeout=3000); await pg.click('[data-act=next]', force=True)
    except Exception: pass
    await pg.wait_for_timeout(150)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        async def yol(route):
            fn = route.request.url.split('/rpc/')[-1]
            body = sunucu(fn, json.loads(route.request.post_data or '{}')) if fn.startswith('pilot_') else None
            await route.fulfill(status=200, content_type='application/json', body=json.dumps(body))
        await pg.route(re.compile(r'.*/rest/v1/rpc/.*'), yol)
        await pg.route(re.compile(r'.*cdn\.jsdelivr\.net.*'), lambda r: r.abort())
        await pg.goto(APP); await pg.wait_for_timeout(600)
        await pg.evaluate("window.MY_APP.st.settings.voice=false; window.MY_APP.st.settings.sound=false")
        await pg.click('[data-act=onb-next]'); await pg.fill('#f-name', 'Deniz')
        await pg.click('[data-act=onb-next]'); await pg.click('[data-act=motiv][data-v=kesif]'); await pg.click('[data-act=onb-finish-skip]')
        await pg.wait_for_timeout(300)
        await pg.evaluate("(()=>{const a=window.MY_APP; a.st.profile.parentPhone='05321112233'; a.st.profile.parentName='Ayşe Hanım'; a.view='home'; a.tab='veli'; window.MY_APP_RENDER();})()")
        await pg.fill('#f-pin1', '4826'); await pg.fill('#f-pin2', '4826'); await pg.click('[data-act=veli-pin-kur]'); await pg.wait_for_timeout(300)
        ok(await pg.query_selector('[data-act=pilot-katil]') is not None, 'Veli alanında pilot kartı görünür')
        ok(not HAM or all('"p_olaylar": []' in h for h in HAM), 'Katılmadan önce hiçbir olay gönderilmez')
        await pg.click('[data-act=pilot-katil]'); await pg.wait_for_timeout(300)
        ok(not KAT, 'Onay kutusu işaretlenmeden katılım olmaz')
        await pg.fill('#f-pilot-grup', '5a'); await pg.check('#f-pilot-onay'); await pg.click('[data-act=pilot-katil]'); await pg.wait_for_timeout(600)
        st = await pg.evaluate("window.MY_APP.st.pilot")
        ok(st and st['acik'] and re.fullmatch(r'[A-Za-z0-9_-]{22}', st['cihaz'] or '') and st['grup'] == '5A', f'Katılım açıldı, rastgele cihaz numarası ve grup: {st and st.get("grup")}')
        ok(list(KAT.values()) == [{'grup': '5A', 'riza': 'pilot-v1'}], 'Sunucuda katılım ve onay sürümü kayıtlı')
        await pg.screenshot(path=OUT + 'pilot_01_katildi.png', full_page=True)
        # Başlangıç testi: 10 soru, ipucu ve ikinci şans yok
        await pg.click('[data-act=olcme][data-v=on]'); await pg.wait_for_timeout(1300)
        ok(await pg.evaluate("window.MY_APP.ses.mode") == 'olcme' and await pg.query_selector('[data-act=hint]') is None, 'Başlangıç testinde ipucu düğmesi yok')
        q = await pg.evaluate("(()=>{const q=window.MY_APP.q;return {type:q.type,ok:(q.options||[]).findIndex(o=>o.ok),n:(q.options||[]).length,answer:q.answer}})()")
        if q['type'] == 'input':
            for ch in ('8' if q['answer'] != '8' else '7'): await pg.click(f'[data-act=key][data-v="{ch}"]')
        elif q['n'] > 1: await pg.click(f'[data-act=opt][data-v="{(q["ok"] + 1) % q["n"]}"]')
        if q['type'] in ('input', 'mc', 'cmp', 'tf') or q['n'] > 1:
            await pg.click('[data-act=check]', force=True); await pg.wait_for_timeout(300)
            ok(await pg.query_selector('.ikinci') is None and await pg.query_selector('[data-act=next]') is not None, 'Testte yanlışta ikinci şans yok, doğrudan devam')
        n = 0
        while await pg.evaluate("window.MY_APP.view") == 'lesson' and n < 25: await cevapla(pg); n += 1
        await pg.wait_for_timeout(2200)
        o = await pg.evaluate("window.MY_APP.st.olcme")
        ok(o and o['on']['n'] == 10 and o['on']['dogru'] <= 9 and len(o['on']['beceri']) == 10, f'Başlangıç testi sonucu kaydedildi: {o and o["on"]["dogru"]}/10')
        ok(await pg.evaluate("!window.MY_APP.dersSandik"), 'Testten sonra sandık yok')
        tst = [x for x in OLAY if x['tur'] == 'test']
        ok(tst and tst[-1]['veri']['form'] == 'on' and tst[-1]['veri']['n'] == 10 and len(tst[-1]['veri']['beceri']) == 10, 'Test sonucu pilot kaydına gitti')
        await pg.evaluate("(()=>{const a=window.MY_APP; a.view='home'; a.tab='veli'; window.MY_APP_RENDER();})()"); await pg.wait_for_timeout(200)
        if await pg.query_selector('#f-pin'): await pg.fill('#f-pin', '4826'); await pg.click('[data-act=veli-pin-gir]'); await pg.wait_for_timeout(300)
        ok(await pg.query_selector('[data-act=olcme]') is None and 'gün sonra açılır' in await pg.inner_text('.olcme-kutu'), 'Bitiş testi hemen açılmaz')
        await pg.evaluate("(()=>{const a=window.MY_APP; a.st.olcme.on.at -= 15*86400000; window.MY_APP_RENDER();})()")
        ok(await pg.query_selector('[data-act=olcme][data-v=son]') is not None, '14 gün sonra bitiş testi açılır')
        await pg.screenshot(path=OUT + 'pilot_03_testler.png', full_page=True)
        # Seviye belirleme dersi: 7 soru
        await pg.evaluate("window.MY_APP_START('placement', null)"); await pg.wait_for_timeout(400)
        n = 0
        while await pg.evaluate("window.MY_APP.view") == 'lesson' and n < 20: await cevapla(pg); n += 1
        await pg.wait_for_timeout(2200)
        turler = [o['tur'] for o in OLAY]
        ok('acilis' in turler and 'ders_basla' in turler and 'ders_bitti' in turler, f'Açılış, ders başı ve ders sonu kaydedildi ({len(OLAY)} olay)')
        cev = [o for o in OLAY if o['tur'] == 'cevap']
        ok(len(cev) >= 7, f'Her cevap kaydedildi ({len(cev)})')
        ok(all(set(c['veri']) <= {'mod', 'beceri', 'sev', 'tur', 'hata', 'asama', 'ok', 'kanit', 'mis', 'ms', 'telafi', 'kalip'} for c in cev), 'Cevap kaydında yalnız izin verilen alanlar var')
        ok(all(re.fullmatch('[0-9a-f]{8}', c['veri']['kalip']) and isinstance(c['veri']['ok'], bool) for c in cev), 'Soru metni değil, yalnız kalıp özeti gider')
        bit = [o for o in OLAY if o['tur'] == 'ders_bitti'][-1]['veri']
        ok(bit['mod'] == 'placement' and bit['n'] >= 7, f'Ders sonu özeti: {bit}')
        tum = ''.join(HAM)
        ok('Deniz' not in tum and '05321112233' not in tum and 'Ayşe' not in tum and '4826' not in tum, 'Ad, veli adı, telefon ve veli şifresi hiçbir kayıtta yok')
        # Ders yarıda bırakılınca
        await pg.evaluate("(()=>{const a=window.MY_APP; a.view='home'; a.tab='yol'; window.MY_APP_START('lesson','g_temel');})()"); await pg.wait_for_timeout(1300)
        if await pg.query_selector('[data-act=card-ok]'): await pg.click('[data-act=card-ok]'); await pg.wait_for_timeout(200)
        await cevapla(pg)
        await pg.click('[data-act=quit]'); await pg.wait_for_timeout(150); await pg.click('[data-act=quit-yes]'); await pg.wait_for_timeout(2000)
        bir = [o for o in OLAY if o['tur'] == 'ders_birak']
        ok(bir and bir[-1]['veri']['mod'] == 'lesson' and bir[-1]['veri']['beceri'] == 'g_temel' and bir[-1]['veri']['n'] >= 1, f'Yarıda bırakılan ders ve kaçıncı soruda bırakıldığı kaydedildi: {bir and bir[-1]["veri"]}')
        ok(any(o['tur'] == 'kart' for o in OLAY), 'Anlatım kartı gösterimi kaydedildi')
        # İnternet yokken olaylar bekler, gelince gider
        await pg.route(re.compile(r'.*/rest/v1/rpc/pilot_kaydet.*'), lambda r: r.abort())
        once = len(OLAY)
        await pg.evaluate("window.MY_APP_START('lesson','g_temel')"); await pg.wait_for_timeout(1300)
        if await pg.query_selector('[data-act=card-ok]'): await pg.click('[data-act=card-ok]'); await pg.wait_for_timeout(200)
        await pg.click('[data-act=quit]'); await pg.wait_for_timeout(150); await pg.click('[data-act=quit-yes]'); await pg.wait_for_timeout(2000)
        bekleyen = await pg.evaluate("JSON.parse(localStorage.getItem('my_pilot_kuyruk')||'[]').length")
        ok(len(OLAY) == once and bekleyen >= 2, f'İnternet yokken olaylar telefonda bekler ({bekleyen})')
        await pg.unroute(re.compile(r'.*/rest/v1/rpc/pilot_kaydet.*'))
        await pg.evaluate("Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true}); document.dispatchEvent(new Event('visibilitychange'))"); await pg.wait_for_timeout(800)
        ok(len(OLAY) >= once + 2 and await pg.evaluate("JSON.parse(localStorage.getItem('my_pilot_kuyruk')||'[]').length") == 0, 'İnternet gelince bekleyen olaylar gönderildi')
        await pg.evaluate("Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true})")
        # Ayrıl
        await pg.evaluate("(()=>{const a=window.MY_APP; a.view='home'; a.tab='veli'; window.MY_APP_RENDER();})()"); await pg.wait_for_timeout(200)
        if await pg.query_selector('#f-pin'): await pg.fill('#f-pin', '4826'); await pg.click('[data-act=veli-pin-gir]'); await pg.wait_for_timeout(300)
        await pg.screenshot(path=OUT + 'pilot_02_katilimda.png', full_page=True)
        await pg.click('[data-act=pilot-ayril]'); await pg.wait_for_timeout(150); await pg.click('[data-act=pilot-ayril-evet]'); await pg.wait_for_timeout(600)
        ok(not KAT and not OLAY, 'Pilottan ayrılınca sunucudaki bütün kayıtlar silindi')
        ok(await pg.evaluate("!window.MY_APP.st.pilot.acik") and await pg.query_selector('[data-act=pilot-katil]') is not None, 'Telefonda kayıt durdu, kart yeniden katılım sunar')
        HAM.clear()
        await pg.evaluate("window.MY_APP_START('placement', null)"); await pg.wait_for_timeout(400); await cevapla(pg); await pg.wait_for_timeout(1500)
        ok(not OLAY and not [h for h in HAM if '"p_olaylar": []' not in h], 'Ayrıldıktan sonra hiçbir olay gönderilmez')
        # ---- Davet bağlantısı (04.11.2026): …/?pilot=5a ile ilk açılış ----
        async def yeni_sayfa():
            c = await b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
            g = await c.new_page(); g.on('pageerror', lambda e: errs.append(str(e)))
            await g.route(re.compile(r'.*/rest/v1/rpc/.*'), yol); await g.route(re.compile(r'.*cdn\.jsdelivr\.net.*'), lambda r: r.abort())
            return g
        KAT.clear(); OLAY.clear()
        d = await yeni_sayfa(); await d.goto(APP + '?pilot=5a'); await d.wait_for_timeout(600)
        ok(await d.query_selector('[data-act=pd-katil]') is not None and await d.query_selector('#f-name') is None, 'Davet bağlantısıyla ilk ekran veli karşılaması (kayıttan önce)')
        ok('pilot=' not in d.url, 'Bağlantıdaki pilot kodu adres çubuğundan kaldırılır')
        await d.reload(); await d.wait_for_timeout(600)
        ok(await d.query_selector('[data-act=pd-katil]') is not None, 'Karar verilmeden kapatılıp açılınca karşılama yine gelir')
        await d.click('[data-act=pd-katil]'); await d.wait_for_timeout(300)
        ok(not KAT, 'Onay kutusu işaretlenmeden katılım olmaz')
        await d.check('#f-pd-onay'); await d.click('[data-act=pd-katil]'); await d.wait_for_timeout(700)
        ok(list(KAT.values()) == [{'grup': '5A', 'riza': 'pilot-v1'}], 'Katılım bağlantıdaki grupla kaydedildi')
        ok(await d.query_selector('#f-name') is None and await d.query_selector('[data-act=onb-next]') is not None, 'Katılınca normal karşılama ve kayıt başlar')
        await d.evaluate("window.MY_APP.st.settings.voice=false; window.MY_APP.st.settings.sound=false")
        await d.click('[data-act=onb-next]'); await d.fill('#f-name', 'Ela'); await d.click('[data-act=onb-next]'); await d.click('[data-act=motiv][data-v=yaris]')
        btn = await d.query_selector('[data-act=onb-finish][data-v=olcme]')
        ok(btn is not None and 'test' in (await btn.inner_text()).lower(), 'Kaydın sonunda seviye belirleme yerine kısa test önerilir')
        await btn.click(); await d.wait_for_timeout(1300)
        ok(await d.evaluate("window.MY_APP.view==='lesson' && window.MY_APP.ses.mode==='olcme' && window.MY_APP.ses.form==='on'"), 'Kısa test (başlangıç formu) başladı')
        n = 0
        while await d.evaluate("window.MY_APP.view") == 'lesson' and n < 25: await cevapla(d); n += 1
        await d.wait_for_timeout(2000)
        ok(any(o['tur'] == 'test' and o['veri']['form'] == 'on' for o in OLAY), 'Test sonucu sunucuya gitti')
        await d.evaluate("(()=>{const a=window.MY_APP;a.view='home';a.tab='yol';window.MY_APP_RENDER();})()"); await d.wait_for_timeout(300)
        ok(await d.query_selector('[data-act=olcme]') is None, 'Test bitince haritada test kartı kalmaz')
        await d.evaluate("(()=>{const a=window.MY_APP;a.st.olcme.on.at-=15*86400000;window.MY_APP_RENDER();})()"); await d.wait_for_timeout(200)
        ok(await d.query_selector('[data-act=olcme][data-v=son]') is not None, '14 gün sonra haritada bitiş testi kartı çıkar')
        await d.screenshot(path=OUT + 'pilot_04_bitis_karti.png')
        # Katılmadan devam
        h = await yeni_sayfa(); await h.goto(APP + '?pilot=6b'); await h.wait_for_timeout(600); once = len(KAT)
        await h.click('[data-act=pd-hayir]'); await h.wait_for_timeout(300)
        ok(await h.query_selector('#f-name') is None and await h.query_selector('[data-act=onb-next]') is not None and len(KAT) == once, 'Katılmadan devam: kayıt yok, normal karşılama')
        await h.reload(); await h.wait_for_timeout(600)
        ok(await h.query_selector('[data-act=pd-katil]') is None, 'Katılmayan aileye ekran bir daha gelmez')
        # Zaten kullanan çocuk bağlantıyı açarsa
        e = await yeni_sayfa(); await e.goto(APP); await e.wait_for_timeout(500)
        await e.click('[data-act=onb-next]'); await e.fill('#f-name', 'Can'); await e.click('[data-act=onb-next]'); await e.click('[data-act=motiv][data-v=kesif]'); await e.click('[data-act=onb-finish-skip]'); await e.wait_for_timeout(300)
        await e.goto(APP + '?pilot=5a'); await e.wait_for_timeout(600)
        ok(await e.query_selector('[data-act=pd-katil]') is not None, 'Kayıtlı çocukta da bağlantı karşılamayı açar')
        await e.check('#f-pd-onay'); await e.click('[data-act=pd-katil]'); await e.wait_for_timeout(700)
        ok(await e.query_selector('[data-act=pd-test]') is not None, 'Kayıtlı çocuğa katılınca test önerisi gelir')
        await e.click('[data-act=close-modal]'); await e.wait_for_timeout(300)
        ok(await e.query_selector('[data-act=olcme][data-v=on]') is not None, '"Sonra" denirse test haritada bekler')
        ok(await e.evaluate("window.MY_APP.st.profile.name") == 'Can', 'Kayıtlı çocuğun ilerlemesi korunur')
        # Bağlantısız normal kullanıcı ekranı hiç görmez
        z = await yeni_sayfa(); await z.goto(APP); await z.wait_for_timeout(500)
        ok(await z.query_selector('[data-act=pd-katil]') is None, 'Bağlantısız açılışta karşılama yok')
        ok(not errs, f'Sayfa hatası yok {errs[:3]}')
        await b.close()
    print('BİTTİ hata:', len(HATA))
asyncio.run(main())

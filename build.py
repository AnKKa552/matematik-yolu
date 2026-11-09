import pathlib
R = pathlib.Path(__file__).parent; S = R/'src'; D = R/'dist'; D.mkdir(exist_ok=True)
tpl = (S/'index.template.html').read_text()
css = (S/'fontlar.css').read_text().replace('%FONT%', 'font/') + (S/'style.css').read_text()  # yazi tipleri yerel (05.11.2026)
js = '\n'.join((S/f).read_text() for f in ['core.js','voice.js','generators.js','curriculum.js','engine.js','fx.js','cloud.js','app.js'])
base = tpl.replace('/*CSS*/', css).replace('/*JS*/', js.replace('</script>', '<\\/script>'))
import re
frag = base.replace('<!--PWA-->','').replace('<!--SW-->','')
frag = re.sub(r'<!doctype html>\s*<html[^>]*>\s*<head>\s*', '', frag)
frag = re.sub(r'<meta charset[^>]*>\s*<meta name="viewport"[^>]*>\s*', '', frag)
frag = frag.replace('</head>\n<body>\n','').replace('</body>\n</html>\n','')
(D/'artifact.html').write_text(frag)
pwa = '<link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="img/simge2_192.png" type="image/png"><link rel="apple-touch-icon" href="img/simge2_192.png">'
sw = "<script>if('serviceWorker' in navigator){addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}</script>"
(D/'index.html').write_text(base.replace('<!--PWA-->', pwa + '<script src="config.js"></script>').replace('<!--SW-->', sw))
cfg = D/'config.js'
if not cfg.exists() and (S/'config.js').exists(): cfg.write_text((S/'config.js').read_text())
if not cfg.exists(): cfg.write_text("// Supabase bağlantısı. Boş bırakılırsa uygulama çevrimdışı çalışır.\n// Değerler: Supabase paneli → Project Settings → API (anon key herkese açık olabilir, service role ASLA buraya yazılmaz)\nwindow.MY_CONFIG = { supabaseUrl: '', anonKey: '' };\n")
print('ok', len(base)//1024, 'KB')
# Öğretmen soru inceleme paneli (davet bağlantısıyla: ogretmen.html?kod=…)
import datetime, subprocess
try: surum = subprocess.run(['git', 'rev-parse', '--short', 'HEAD'], cwd=R, capture_output=True, text=True).stdout.strip()
except Exception: surum = ''
surum = datetime.date.today().isoformat() + (' ' + surum if surum else '')
ojs = '\n'.join((S/f).read_text() for f in ['core.js', 'generators.js', 'curriculum.js', 'ogretmen.js']).replace('/*SURUM*/', surum)
(D/'ogretmen.html').write_text((S/'ogretmen.html').read_text().replace('/*CSS*/', css).replace('/*PANELCSS*/', (S/'ogretmen.css').read_text()).replace('/*JS*/', ojs.replace('</script>', '<\\/script>')))

# PWA dosyaları (src/pwa) → dist
import shutil
for f in (S/'pwa').glob('*'):
    if f.is_file(): shutil.copy(f, D/f.name)
# Uygulama her değiştiğinde sw.js de değişsin: tarayıcı yeni sürümü fark eder, uygulama «Yeni sürüm hazır» der (07.11.2026)
import hashlib
_h = hashlib.sha256((D/'index.html').read_bytes()).hexdigest()[:10]
(D/'sw.js').write_text((S/'pwa'/'sw.js').read_text() + f"\n// uygulama sürümü: {_h}\n")
# Görseller (src/pwa/img) → dist/img ve docs/img
if (S/'pwa'/'img').exists(): shutil.copytree(S/'pwa'/'img', D/'img', dirs_exist_ok=True)
if (S/'pwa'/'font').exists(): shutil.copytree(S/'pwa'/'font', D/'font', dirs_exist_ok=True)
# Yayın kopyası: GitHub Pages docs/ klasöründen yayınlar
P = R/'docs'; P.mkdir(exist_ok=True); (P/'.nojekyll').touch(); (P/'CNAME').write_text('matematikyolu.com\n')  # kendi alan adı (05.11.2026)
for f in ['index.html', 'ogretmen.html', 'config.js', 'sw.js', 'manifest.webmanifest']:
    if (D/f).exists(): shutil.copy(D/f, P/f)
if (D/'img').exists(): shutil.copytree(D/'img', P/'img', dirs_exist_ok=True)
if (D/'font').exists(): shutil.copytree(D/'font', P/'font', dirs_exist_ok=True)
# Gizlilik politikası: matematikyolu.com/gizlilik/ (Play mağazası için zorunlu)
for K in (D, P):
    for ad in ('gizlilik', 'kosullar', 'eposta', 'hakkimizda', 'cocuklar', 'veri-sil', 'ogretmenler'): (K/ad).mkdir(exist_ok=True); shutil.copy(S/(ad + '.html'), K/ad/'index.html')
# Yönetim sayfası (09.11.2026): matematikyolu.com/yonetim/ — yönetici adı + şifre (sunucu/supabase/yonetici.sql)
import json as _json
_m = _json.loads((R/'data'/'mufredat.json').read_text())
_adlar = _json.dumps({'beceri': {b['id']: b['ad'] for b in _m['beceriler']}, 'mis': {k: v['ad'] for k, v in _m['yanilgilar'].items()}}, ensure_ascii=False).replace('</', '<\\/')
for K in (D, P):
    (K/'yonetim').mkdir(exist_ok=True); (K/'yonetim'/'index.html').write_text((S/'yonetim.html').read_text().replace('/*ADLAR*/{}', _adlar))
# Play (TWA) doğrulaması (09.11.2026): matematikyolu.com/.well-known/assetlinks.json
# Yükleme anahtarının parmak izi; Play App Signing anahtarı Play Console'dan alınınca listeye eklenmeli.
(P/'.well-known').mkdir(exist_ok=True); shutil.copy(S/'assetlinks.json', P/'.well-known'/'assetlinks.json')
print('docs/ güncellendi')

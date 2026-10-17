import pathlib
R = pathlib.Path(__file__).parent; S = R/'src'; D = R/'dist'; D.mkdir(exist_ok=True)
tpl = (S/'index.template.html').read_text()
css = (S/'style.css').read_text()
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

# PWA dosyaları (src/pwa) → dist
import shutil
for f in (S/'pwa').glob('*'):
    if f.is_file(): shutil.copy(f, D/f.name)
# Görseller (src/pwa/img) → dist/img ve docs/img
if (S/'pwa'/'img').exists(): shutil.copytree(S/'pwa'/'img', D/'img', dirs_exist_ok=True)
# Yayın kopyası: GitHub Pages docs/ klasöründen yayınlar
P = R/'docs'; P.mkdir(exist_ok=True); (P/'.nojekyll').touch()
for f in ['index.html', 'config.js', 'sw.js', 'manifest.webmanifest']:
    if (D/f).exists(): shutil.copy(D/f, P/f)
if (D/'img').exists(): shutil.copytree(D/'img', P/'img', dirs_exist_ok=True)
print('docs/ güncellendi')

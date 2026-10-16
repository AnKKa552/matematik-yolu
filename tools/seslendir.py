#!/usr/bin/env python3
"""Pi'nin tüm seslerini ElevenLabs ile üretir → dist/audio/*.mp3 + manifest.json
Telefonda (Termux) çalışır, ek paket gerekmez.

  export ELEVENLABS_API_KEY="anahtarın"        # ElevenLabs > Profile > API Keys
  node tools/ses_listesi.js                      # metin listesini güncelle
  python3 tools/seslendir.py --dene              # sadece say: kaç kayıt, kaç karakter
  python3 tools/seslendir.py --grup pi           # önce Pi repliklerini üret (kısa, ucuz)
  python3 tools/seslendir.py                     # hepsini üret (var olanları atlar)

Uygulama, dist/audio/manifest.json içinde adı geçen sesleri çalar; olmayanlar için cihaz sesi kullanılır.
"""
import json, os, sys, time, urllib.request, urllib.error, pathlib
R = pathlib.Path(__file__).resolve().parent.parent
LISTE = json.loads((R / 'data' / 'seslendirme.json').read_text(encoding='utf-8'))
OUT = R / 'dist' / 'audio'; OUT.mkdir(parents=True, exist_ok=True)
VOICE = os.environ.get('PI_VOICE_ID', LISTE['ses']['voice_id'])
MODEL = os.environ.get('PI_MODEL', 'eleven_multilingual_v2')
AYAR = {"stability": 0.45, "similarity_boost": 0.8, "style": 0.35, "use_speaker_boost": True}
args = sys.argv[1:]
grup = args[args.index('--grup') + 1] if '--grup' in args else None
kayitlar = [k for k in LISTE['kayitlar'] if not grup or k['grup'] == grup] if grup != 'efekt' else []
eksik = [k for k in kayitlar if not (OUT / f"{k['key']}.mp3").exists()]
print(f"{len(kayitlar)} kayıt, {len(eksik)} eksik, eksiklerin toplamı {sum(len(k['text']) for k in eksik)} karakter. Ses: {VOICE}, model: {MODEL}")
if '--dene' in args: sys.exit(0)
KEY = os.environ.get('ELEVENLABS_API_KEY')
if not KEY:
    import getpass
    KEY = getpass.getpass('ElevenLabs API anahtarını yapıştır (ekranda görünmez): ').strip()
if not KEY: sys.exit('Anahtar girilmedi.')
for i, k in enumerate(eksik, 1):
    body = json.dumps({"text": k['text'], "model_id": MODEL, "voice_settings": AYAR}).encode()
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format=mp3_44100_64", data=body,
                                 headers={"xi-api-key": KEY, "Content-Type": "application/json", "Accept": "audio/mpeg"})
    for deneme in range(3):
        try:
            with urllib.request.urlopen(req, timeout=120) as r: (OUT / f"{k['key']}.mp3").write_bytes(r.read())
            print(f"[{i}/{len(eksik)}] ✓ {k['key']}"); break
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors='ignore')[:200]; print(f"[{i}/{len(eksik)}] ✗ {k['key']} HTTP {e.code}: {msg}")
            if e.code in (401, 402, 403): sys.exit('Anahtar/kota sorunu, durduruldu.')
            time.sleep(3 * (deneme + 1))
        except Exception as e:
            print(f"  tekrar deneniyor: {e}"); time.sleep(3 * (deneme + 1))
# --- Ses efektleri (ElevenLabs Sound Effects) ---
if '--grup' not in args or grup == 'efekt':
    EF = json.loads((R / 'data' / 'efektler.json').read_text(encoding='utf-8'))['efektler']
    for e in EF:
        hedef = OUT / f"{e['key']}.mp3"
        if hedef.exists(): continue
        body = json.dumps({"text": e['text'], "duration_seconds": e['sure'], "prompt_influence": 0.45}).encode()
        req = urllib.request.Request("https://api.elevenlabs.io/v1/sound-generation", data=body, headers={"xi-api-key": KEY, "Content-Type": "application/json", "Accept": "audio/mpeg"})
        try:
            with urllib.request.urlopen(req, timeout=120) as r: hedef.write_bytes(r.read())
            print(f"✓ efekt {e['key']}")
        except urllib.error.HTTPError as ex: print(f"✗ efekt {e['key']} HTTP {ex.code}: {ex.read().decode(errors='ignore')[:150]}")
keys = sorted(p.stem for p in OUT.glob('*.mp3'))
(OUT / 'manifest.json').write_text(json.dumps({"voice_id": VOICE, "model": MODEL, "keys": keys}, ensure_ascii=False), encoding='utf-8')
print(f"manifest.json yazıldı: {len(keys)} ses dosyası.")

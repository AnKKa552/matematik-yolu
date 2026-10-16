#!/usr/bin/env python3
"""Sunucudaki 'seslendir' fonksiyonunu çağırarak Pi'nin tüm seslerini Supabase'de üretir.
ElevenLabs anahtarı telefonda değil, Supabase'in gizli değerlerinde durur.
  python3 tools/sunucuda_seslendir.py
Sorar: proje adresi (https://xxxx.supabase.co) ve ADMIN_TOKEN (kendin belirlediğin parola).
"""
import json, pathlib, getpass, urllib.request, urllib.error, time
R = pathlib.Path(__file__).resolve().parent.parent
kayit = json.loads((R/'data'/'seslendirme.json').read_text(encoding='utf-8'))['kayitlar']
efekt = json.loads((R/'data'/'efektler.json').read_text(encoding='utf-8'))['efektler']
url = input('Supabase proje adresi (https://....supabase.co): ').strip().rstrip('/')
tok = getpass.getpass('ADMIN_TOKEN: ').strip()
govde = json.dumps({"kayitlar": [{"key": k["key"], "text": k["text"]} for k in kayit], "efektler": efekt}).encode()
while True:
    req = urllib.request.Request(f"{url}/functions/v1/seslendir", data=govde, headers={"x-admin-token": tok, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=400) as r: s = json.loads(r.read())
    except urllib.error.HTTPError as e:
        print('Hata:', e.code, e.read().decode(errors='ignore')[:300]); break
    print(f"üretilen {s['uretilen']} · kalan {s['kalan']} · hazır {s['toplam_hazir']}", *s.get('hatalar', [])[:3], sep='\n  ')
    if s['kalan'] == 0 or s['uretilen'] == 0: break
    time.sleep(1)
print('Bitti. Uygulama sesleri sunucudan çalacak.')

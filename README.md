# Matematik Yolu — 5. sınıf matematik (prototip)

Duolingo mantığıyla, öğrenciye göre uyarlanan, hatasından öğreten matematik uygulaması.
Ayrıntılı tasarım ve kurallar: **CLAUDE.md**.

## Telefonda (Termux) çalıştırma
```bash
pkg update && pkg install python nodejs git
cd matematik-yolu
python3 build.py              # dist/ klasörünü üretir
cd dist && python3 -m http.server 8080
```
Telefonda Chrome'da `http://localhost:8080` aç → menü → **Ana ekrana ekle**. Uygulama tam ekran açılır ve internet olmadan da çalışır.

## Testler
```bash
node test/test_generators.js  # 35 beceri × 3 seviye × 600 = 63 000 soru doğrulanır (hata 0 olmalı)
node test/sim_engine.js       # farklı öğrenci tipleriyle uyarlanabilir motor simülasyonu
python3 test/e2e.py           # (bilgisayarda, Playwright gerekir) telefon boyutunda uçtan uca test
```

## Ücretsiz yayınlama (GitHub Pages)
```bash
git init && git add . && git commit -m "Matematik Yolu prototip"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADIN/matematik-yolu.git
git push -u origin main
```
GitHub'da depo → Settings → Pages → Source: `main` dalı, klasör `/dist` değilse `dist` içeriğini `docs/` klasörüne kopyalayıp `/docs` seç.
Adres: `https://KULLANICI_ADIN.github.io/matematik-yolu/`

## Klasörler
- `src/` kaynak kod (core, generators, curriculum, engine, app, style)
- `data/mufredat.json` 7 tema, 35 beceri, 67 kavram yanılgısı, 140 anlatım kartı
- `dist/` yayına hazır uygulama (`index.html` + `manifest.webmanifest` + `sw.js` + `icon.svg`)

## Pi'nin sesini üretme (ElevenLabs)
En kolayı: `bash tools/sesleri_uret.sh` (anahtarı gizli sorar, kaydetmez). Elle:
```bash
export ELEVENLABS_API_KEY="anahtarın"     # ElevenLabs > Profil > API Keys
node tools/ses_listesi.js                   # 239 metin → data/seslendirme.json
python3 tools/seslendir.py --dene           # kaç karakter tutacağını gör
python3 tools/seslendir.py --grup pi        # önce kısa Pi replikleri
python3 tools/seslendir.py                  # hepsi (var olanları atlar)
```
Sesler `dist/audio/` içine yazılır; uygulama bunları otomatik bulur. Ses dosyası olmayan yerlerde telefonun kendi Türkçe sesi kullanılır.

## Yayın
`python3 build.py` çalışınca `docs/` klasörü de güncellenir. GitHub Pages bu klasörü yayınlar; `main` dalına gönderilen her değişiklik siteye birkaç dakikada yansır.
Sunucu (Supabase) kurulumu: `sunucu/SUNUCU_KURULUM.md`. Gizli anahtarlar bu depoda yoktur; sunucu kasasında (Vault) durur.

#!/data/data/com.termux/files/usr/bin/bash
# Pi'nin tüm seslerini tek komutla üretir. Anahtar sorulur, hiçbir dosyaya kaydedilmez.
set -e
cd "$(dirname "$0")/.."
node tools/ses_listesi.js
python3 tools/seslendir.py --dene
read -s -p "ElevenLabs API anahtarı: " ELEVENLABS_API_KEY; echo
export ELEVENLABS_API_KEY
python3 tools/seslendir.py --grup pi
python3 tools/seslendir.py
echo "Bitti. dist/audio içinde sesler hazır. Uygulamayı yeniden aç."

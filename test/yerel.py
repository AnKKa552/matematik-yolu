# Testler için yerel sunucu (17.11.2026).
# Neden: file:// sayfası yenilenince Chromium bazen localStorage'ı tamamen boş getiriyordu (yenileme yeni bir
# süreçte açılınca file:// kaynağının depolaması taşınmıyor). Kayıt silinmiş görünüyor, e2e_profil ve e2e_pilot
# yaklaşık her iki çalıştırmada bir takılıyordu. Gerçek kullanıcı https ile açar; testler de http ile açmalı.
# Kullanım: from yerel import adres; APP = adres()  · bağlamda service_workers='block' (çevrimdışı katman araya girmesin)
import functools, http.server, pathlib, threading

class _Sessiz(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

def adres(klasor=None):
    kok = pathlib.Path(klasor) if klasor else pathlib.Path(__file__).resolve().parent.parent / 'dist'
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(_Sessiz, directory=str(kok)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return f'http://127.0.0.1:{srv.server_address[1]}/index.html'

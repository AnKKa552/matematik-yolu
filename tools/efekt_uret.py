"""Doğru cevap efektleri (07.11.2026): yapay zekâyla üretilen eski efektler (sfx_ok/fire/unstop/legend/grow) proje sahibine
«hata yapmışız gibi patlayan» bir ses gibi geldi. Bunlar kodla, müzik kuralına göre üretilir: yalnız majör akor notaları,
yumuşak çan tınısı (ani vuruş/gürültü/bas yok), kısa yankı. Çıktı: src/pwa/img/efekt/<ad>.mp3 (uygulamayla birlikte gelir).
Çalıştır: python3 tools/efekt_uret.py  (numpy + ffmpeg)"""
import numpy as np, subprocess, pathlib, tempfile, wave
SR = 44100
OUT = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'pwa' / 'img' / 'efekt'
N = lambda ad: {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}[ad[0]] + (1 if '#' in ad else 0) + 12 * (int(ad[-1]) + 1)
hz = lambda ad: 440 * 2 ** ((N(ad) - 69) / 12)

def can(f, sure, guc=1.0):
    """Yumuşak çan: temel + birkaç kısmî ton, 6 ms açılış, üstel sönüm (yüksek kısmîler daha çabuk söner)."""
    t = np.arange(int(SR * sure)) / SR
    s = np.zeros_like(t)
    for kat, gen, son in ((1, 1.0, 2.2), (2, .28, 3.5), (3, .12, 5.0), (4.07, .05, 7.0)):
        if f * kat < 9000: s += gen * np.sin(2 * np.pi * f * kat * t) * np.exp(-son * t / sure * 2.2)
    acilis = np.minimum(1, t / .006)
    return s * acilis * guc

def ekle(buf, parca, bas):
    i = int(bas * SR); buf[i:i + len(parca)] += parca[:max(0, len(buf) - i)]

def isilti(buf, bas, sure, yog=10, seed=1):
    """Hafif pırıltı: çok kısa, yüksek ama sessiz çan noktacıkları (majör pentatonik)."""
    r = np.random.default_rng(seed)
    notalar = [hz(n) for n in ('C7', 'D7', 'E7', 'G7', 'A7')]
    for k in range(int(yog * sure)):
        ekle(buf, can(r.choice(notalar), .18, .07), bas + r.uniform(0, sure))

def yanki(s):
    o = s.copy()
    for gec, kaz in ((.083, .28), (.131, .18), (.197, .11)):
        d = int(gec * SR); o[d:] += kaz * s[:-d]
    return o

def yaz(ad, s):
    s = yanki(s); s = s / (np.abs(s).max() + 1e-9) * 0.70  # tepe ~ -3 dB, yüksek ses yok
    n = int(.02 * SR); s[-n:] *= np.linspace(1, 0, n)
    with tempfile.NamedTemporaryFile(suffix='.wav') as f:
        w = wave.open(f.name, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((s * 32767).astype('<i2').tobytes()); w.close()
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f.name, '-b:a', '96k', str(OUT / f'{ad}.mp3')], check=True)

def uret():
    OUT.mkdir(parents=True, exist_ok=True)
    # Doğru: iki notalı yükselen çan (sol → üst do), en tanıdık "doğru" duygusu
    b = np.zeros(int(SR * .9)); ekle(b, can(hz('G5'), .5, .8), 0); ekle(b, can(hz('C6'), .75, 1), .09); isilti(b, .1, .35, 8, 2); yaz('ok', b)
    # 3'lü seri: hızlı yükselen arpej
    b = np.zeros(int(SR * 1.2))
    for i, n in enumerate(('C6', 'E6', 'G6', 'C7')): ekle(b, can(hz(n), .7, .75 + .08 * i), i * .07)
    isilti(b, .2, .6, 12, 3); yaz('fire', b)
    # 5'li seri: iki oktav arpej + tutulan majör akor
    b = np.zeros(int(SR * 1.7))
    for i, n in enumerate(('C5', 'E5', 'G5', 'C6', 'E6', 'G6')): ekle(b, can(hz(n), .8, .7), i * .065)
    for n in ('C6', 'E6', 'G6', 'C7'): ekle(b, can(hz(n), 1.2, .55), .42)
    isilti(b, .4, 1.0, 14, 4); yaz('unstop', b)
    # 8'li seri: daha uzun, iki akor (Fa → Do) + pırıltı
    b = np.zeros(int(SR * 2.4))
    for i, n in enumerate(('C5', 'E5', 'G5', 'C6', 'E6', 'G6', 'C7')): ekle(b, can(hz(n), .8, .65), i * .06)
    for n in ('F5', 'A5', 'C6', 'F6'): ekle(b, can(hz(n), .9, .5), .5)
    for n in ('C6', 'E6', 'G6', 'C7'): ekle(b, can(hz(n), 1.5, .6), .85)
    isilti(b, .5, 1.5, 16, 5); yaz('legend', b)
    # Telafi doğru: sakin, sıcak, yükselen arp (La majör)
    b = np.zeros(int(SR * 1.5))
    for i, n in enumerate(('A4', 'C#5', 'E5', 'A5', 'C#6')): ekle(b, can(hz(n), .9, .7), i * .11)
    isilti(b, .5, .6, 6, 6); yaz('grow', b)

if __name__ == '__main__': uret(); print('efektler:', sorted(p.name for p in OUT.glob('*.mp3')))

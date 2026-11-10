# Aturan gaya Basic style 2

Diambil dari analisis frame dan audio video referensi, lalu dibuktikan di "Taman Iblis". Yang membuat gaya ini hidup adalah tempo dan gag-nya, bukan kerumitan gambarnya.

## Tampilan
- Garis tinta tebal hampir hitam, plus halo gelap di sekeliling karakter supaya menonjol dari latar.
- Kepala bundar putih tanpa hidung, dengan bayangan sabit. Wajah sangat sederhana dan ekspresif (`face`: `angry`, `blank`, `worried`, `shock`, `smug`, `happy`, `think`, `down`).
- Karakter lebih terang daripada dunianya. Latar diberi grade malam biru lewat `BG_GRADE`, karakter hanya kena grade tipis lewat `VIDEO.grade`, dan bulan dilukis ulang setelah grade supaya tetap paling terang.
- Palet: malam biru gelap, pasir zaitun tua, aksen merah. Adegan hangat (tenda, bengkel) dan bidang polos (poster, latar gelap) dipakai sebagai selingan.
- Foreground gelap out-of-focus (`fgFrame`) di shot luar ruangan memberi kedalaman.

## Kamera dan tempo
- Kamera tidak pernah diam: setiap shot punya gerak pelan lewat `camAt`, dan layer memakai parallax lewat `layer(c, cam, depth, ...)`.
- Shot sekitar 2–6 detik, dan di dalamnya harus ada kejadian baru setiap 1–2 detik: gag muncul, prop masuk, ekspresi berubah.
- Hantaman selalu memakai guncangan (`VIDEO.shakes`). Yang besar ditambah kilatan (`VIDEO.flashes`).
- Karakter tetap bernapas dan berkedip (`blinkAt`), dan kilau berjalan 12 fps (`twinkle`) meski timeline 60 fps, supaya terasa animasi tangan.

## Caption (otomatis oleh engine)
- Huruf besar Rubik tebal, putih, stroke hitam. Kata muncul tepat saat diucapkan, pop 1,3× lalu turun dalam 0,1 detik, dan baris re-center setiap kata baru.
- Kata terkumpul sampai frasa selesai, lalu berganti.
- Merah (`*kata*`) untuk tekanan. Frasa punchline bisa diperbesar lewat `VIDEO.bigWords`, misalnya `{ b3: 108 }` untuk satu kata "SALAH."

## Transisi
| Tipe | Kapan dipakai |
|---|---|
| `whip` + `dir` | Pindah topik, paling sering |
| `cut` | Pergantian langsung atau punchline |
| `flash` | Kilatan untuk pengungkapan |
| `punch` | Zoom masuk mendadak ke detail |
| `whiteline` | Pembuka bagian besar; shot tujuan menggambar garis putihnya sendiri |
| `open` | Hanya untuk shot pertama |

Urutan akhir: ledakan paling besar, api kotak-kotak memakan layar (`bigBoom`), lalu tombol SUBSCRIBE mendarat (`pill`).

## Bahasa gag
Humor datang dari memperlakukan sejarah seperti game:
- `killFeed` setelah kematian konyol, `progressBar` untuk pekerjaan lambat, teks mengambang seperti "LANGKAH TERAKHIR!!!".
- `stamp` untuk keputusan (DITOLAK, GRATIS!), `bubble` dengan emotikon (`:D`, `?`), `thoughtDots` saat bingung, `redArrow` untuk menunjuk.
- Figur transparan `ghostWalk` mewakili "kamu".
- Kekerasan selalu tanpa darah: ledakan, asap, sepatu bot tersisa, helm jatuh.

## Struktur narasi
Pembuka "bayangkan kamu...", solusi naif, gagal konyol. Lalu masalah dibagi dua, jawaban dibongkar satu per satu dengan twist musuh yang balas, dan ditutup lelucon yang mengantar ledakan akhir. Struktur ini panduan saat membaca brief. Isi tetap mengikuti script user.

## Suara
- Setiap kejadian di layar punya suara. Efek kecil tetap terdengar di bawah narasi.
- Bed padat: ambience lokasi, gemuruh jauh, dan musik yang mengecil otomatis saat ada narasi.
- Dinamika dramatis: dunia teredam setelah ledakan (`shellshock`), hening total sebelum punchline (`bed_gain`).

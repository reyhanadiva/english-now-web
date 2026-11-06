# Ringkasan perubahan website English Now (30 Okt – 6 Nov 2026)

Untuk tim IT. Pembanding: versi **sebelum** 30 Okt (commit terakhir sebelumnya: `6d90654`, 22 Okt 2026).
Semua perubahan ada di branch `main`; bandingkan dengan `git diff 6d90654 HEAD`. Total sekitar 43 file berubah.
Daftar commit lengkap: `git log 6d90654..HEAD --oneline`.

## 1. Section di halaman utama

| Area | Perubahan | File utama |
|---|---|---|
| Level | Level CEFR (Dewasa) kini berbentuk **tangga naik** A1 → C2, bukan sekadar kiri ke kanan; jalur level Anak (Cambridge) juga terus menanjak. Ada slot grafik (`GraphicSlot`) untuk ilustrasi nanti. | `components/level-section.tsx`, `components/graphic-slot.tsx` |
| Business Class | Harga **tidak ditampilkan di depan**. Urutan: ajakan ngobrol, daftar penawaran (konsultasi gratis, free trial tim, diskon), baru tombol "Lihat estimasi biaya". Angka diskon masih `XX%` (penanda slot). | `components/program-section.tsx`, `lib/content.ts` (`BUSINESS_OFFER`) |
| Logo institusi | Orbit logo lama diganti tampilan yang lebih jelas (dinding/orbit logo yang bergerak pelan dan menghadap lurus). `logo-orbit.tsx` dihapus, diganti `logo-wall.tsx`. | `components/logo-wall.tsx` |
| Testimoni | Format seragam: kutipan singkat, cerita lengkap (situasi, bagian program yang membantu, hasil), nama, peran, instansi, program; ada filter; chip dihapus. Data contoh baru ditandai `sample`. | `components/testimonial-section.tsx`, `lib/content.ts` |
| Asisten (chat) | Peluncur lebih mencolok: cincin berdenyut, lencana "1", ikon bergoyang, ajakan kecil bergantian sampai pernah dibuka. | `components/guide-chat.tsx` |
| Galeri | Jarak bawah dirapatkan. | `components/gallery-section.tsx` |

## 2. Toggle audiens dan hero

- Toggle kini **dua pilihan**: Anak & Remaja, Dewasa & Bisnis. Hero "Corporate" (gedung perkantoran potong) **dipindah menjadi hero Dewasa & Bisnis**; lukisan senja lama untuk Dewasa tidak lagi tampil.
- Link lama `?for=corporate` dan nilai tersimpan `corporate` di localStorage tetap berfungsi (dianggap `adult`).
- Copy hero Dewasa & Bisnis: judul "Satu bahasa, lebih banyak peluang."; sub "Business class dari kebutuhan kerja nyata tim Anda, plus kelas privat dan persiapan IELTS." Copy Corporate lama (`heroCorporate`) dihapus.
- Swipe antar audiens di HP kini hanya dua posisi. Pill toggle memakai kaca gelap saat hero Dewasa & Bisnis aktif.
- Hero Dewasa & Bisnis (`components/hero/corporate-scene.tsx`, nama file belum diganti): gedung 2 menara dengan 6 ruangan bisnis yang hidup bergantian, lift kaca, lobi, langit dengan awan/pesawat/burung, kereta layang di belakang skyline, bendera English Now di atap menara kanan. Seluruh aset di `public/images/corp/` dan `public/images/hero-corp-*.webp`.
  - Animasi hanya `transform` dan `opacity`; berhenti saat di luar layar dan saat `prefers-reduced-motion`. Setiap elemen animasi wajib punya class berawalan `en-m-` (lihat aturan CSS di `app/globals.css`).
  - Tata letak memakai kontainer berukuran gambar (1672×941) dengan satuan persen/`cqw`, jadi pas di berbagai ukuran layar.

## 3. Section Artikel (baru) dan halaman artikel (baru)

- **Section Artikel** di halaman utama, tampilannya beda untuk Anak dan Dewasa (`components/article-section.tsx`):
  - Anak: panggung biru dengan kartu foto tegak yang berputar (coverflow, otomatis tiap 5 detik, panah, titik, klik kartu samping untuk memajukan, geser di HP), awan melintas, pesawat, burung, layang-layang. Maksimal **5 artikel terbaru** (`KIDS_MAX`), Dewasa maksimal 4 (`ADULT_MAX`), diurutkan berdasarkan `date`. Artikel Anak belum punya `date`, jadi sementara mengikuti urutan data.
  - Dewasa: satu artikel utama besar (foto bergerak pelan, sorot kursor, tombol "Baca artikel →") plus kartu-kartu kecil.
  - Satu tag (kategori) per kartu. Tidak ada gelembung kursor; kartu memakai kursor pointer.
- **Halaman artikel** `/artikel/[slug]` (`app/artikel/[slug]/page.tsx`, `components/article/article-view.tsx`):
  - Model konten berbasis blok (`lib/articles.ts`): judul, paragraf, daftar, gambar, galeri, kutipan, callout, embed, akordeon, kosakata, kuis, template, tabel, CTA, pemisah. Markup inline: `**tebal**`, `*miring*`, `[teks](url)`, `{{istilah|arti}}`.
  - Hero foto penuh yang sama di semua ukuran layar; header transparan di atas hero lalu solid setelah scroll; sisa menit baca, bilah progres, ukuran teks (A A A), tombol kembali ke atas, ajakan kelas gratis melayang, daftar isi (desktop: rel samping; HP Dewasa: tombol mengambang kecil), drop cap untuk Dewasa.
  - Bacaan terkait: kategori sama didahulukan.
  - Mode cetak (CSS `@media print`): tanpa header/tombol/CTA/kuis/embed, akordeon terbuka. Tidak ada tombol cetak di antarmuka.
  - Artikel **tidak** masuk navbar. Tidak ada kolom komentar. Tombol WhatsApp/bagikan dihapus.
- **SEO**: metadata + Open Graph + canonical, JSON-LD `Article` dan `BreadcrumbList`, `app/sitemap.ts`, `app/robots.ts`. Artikel `sample: true` otomatis `noindex` dan tidak masuk sitemap.
- `lib/site.ts`: `SITE_URL` dari `NEXT_PUBLIC_SITE_URL` (fallback `https://englishnow.co.id` hanya asumsi, **perlu dikonfirmasi**).
- Standar foto sampul (satu foto dipakai di hero lebar, kartu Anak tegak, kartu Dewasa lebar): unggah landscape 16:9, minimal 1600×900, di bawah ~300 KB, subjek di tengah; kolom opsional `coverFocus` (mis. `"50% 30%"`) mengatur titik fokus pemotongan di semua tampilan. Dokumentasi ada di komentar `lib/articles.ts` dan `lib/content.ts`.
- Penulis: `author.name` adalah nama akun (mis. "Tim English Now"); `author.role` opsional, kosongkan untuk akun tim.
- Keterangan foto sampul (`coverCaption`) opsional; hanya tampil jika diisi.

## 4. Catatan teknis

- File dihapus: `components/logo-orbit.tsx` (diganti `logo-wall.tsx`). Hero jendela pesawat (`flight-scene.tsx`) sempat ada, kemudian digantikan hero gedung perkantoran dan tidak ada di versi akhir.
- Keyframe baru di `app/globals.css` untuk artikel: `en-art-drift`, `en-card-bob`, `en-kite`, `en-tail`, `en-kb`; untuk hero: `en-s-*`, `en-s-wave2`. Ada keyframe lama dari hero sebelumnya yang kemungkinan sudah tidak dipakai (contoh `en-drift`, `en-fly`, `en-sweep`); boleh dibersihkan setelah dicek.
- Catatan Next.js: versi ini punya perubahan API (mis. `params` di route dinamis berupa Promise). Lihat `AGENTS.md` dan `node_modules/next/dist/docs/`.
- Pengujian lokal: `npm run build && npm start` untuk melihat animasi apa adanya (mode dev bisa memakai CSS yang basi).

## 5. Placeholder yang masih harus diganti sebelum rilis

- `REGISTER_URL` (kosong), diskon `XX%` di `BUSINESS_OFFER`, angka statistik `XXX+`/`XX`, logo institusi contoh, foto pengajar.
- Semua testimoni dan artikel bertanda `sample: true` (testimoni berawalan "CONTOH TESTIMONI").
- Link artikel selain dua yang sudah punya halaman masih `#artikel`.
- Domain final untuk `NEXT_PUBLIC_SITE_URL`.
- Artikel Anak perlu field `date` agar urutan "5 terbaru" benar.

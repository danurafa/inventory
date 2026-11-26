# Dokumentasi Tabel, Pagination, dan Alamat PO

Dibuat: 2026-11-24 · Diperbarui: 2026-11-25 · Commit terakhir: `60598d0` · Remote: `origin/main`

Dokumen ini merangkum pekerjaan UI yang paling sering diubah belakangan ini:
kartu mobile, pagination, scroll horizontal tabel, dan alamat customer di PO.

---

## 1. Aturan emas (jangan dilanggar)

| Aturan | Detail |
|---|---|
| Breakpoint mobile | `max-width: 767px` |
| Desktop | **Tetap tabel** untuk semua halaman, kartu hanya di mobile |
| Logika data | Perubahan UI tidak boleh mengubah payload Worker / struktur data |
| Cache | Setiap edit `app.js` / `styles.css` wajib ganti `?v=` di `index.html` |
| Refresh | User wajib **hard refresh** setelah cache di-bump |
| Git | Commit + push **hanya kalau user meminta** |

Peran user:

- `admin`, `superadmin`, `staff`, `viewer` → badge Cloud Sync tetap muncul di mobile.
- `viewer` → **tidak ada** tombol Edit/Ubah Alamat/Atur, hanya bisa lihat.

---

## 2. Pagination

### 2.1 Ukuran halaman

**10 baris per halaman** untuk semua tabel. Konstanta yang dipakai:

| Tabel | Konstanta / mekanisme |
|---|---|
| Riwayat Surat Jalan | `SJ_HISTORY_PER_PAGE = 10` |
| Barang Keluar | `KELUAR_HISTORY_PER_PAGE = 10` |
| Master, PO, Masuk, Sampel, Retur, User | `GENERIC_TABLE_PAGE_SIZE = 10` (wrapper generik) |

Info halaman contoh: `Menampilkan 1–10 dari 87 Transaksi` · `Halaman 3 dari 9`.

### 2.2 Dua mekanisme berbeda

**A. Pagination native (SJ & Barang Keluar)**

- Data di-`slice()` sebelum dirender, jadi hanya 10 grup yang ada di DOM.
- Baris pengisi (filler) ditambahkan supaya tinggi tabel desktop stabil.
- Filler SJ memakai placeholder **dua baris** (ID + baris kecil), filler Keluar juga sudah
  disamakan strukturalnya dengan baris asli.
- Filler disembunyikan di mobile (kartu tidak butuh).

**B. Pagination generik (Master, PO, Masuk, Sampel, Retur, User)**

- Berada di block IIFE paling bawah `assets/app.js` (cari `GENERIC_TABLE_PAGE_SIZE`).
- Renderer asli di-wrap: setelah render, `applyGenericTablePagination()` menyembunyikan
  baris di luar halaman lewat `style.display`.
- Bar pagination **cuma dibuat kalau ada lebih dari 10 baris**. Kalau 1 halaman, bar
  disembunyikan dan baris tidak disentuh.
- `syncGenericFillerRows()` menambah baris kosong sampai 10. Tinggi baris kosong
  diukur dari baris asli pertama (`getBoundingClientRect().height`) supaya tidak lebih pendek.
- Pencarian mengubah signature → otomatis balik ke halaman 1.
- Pindah halaman menjaga `window.scrollY`.

### 2.3 Jebakan yang sudah diperbaiki

⚠️ **Baris detail PO.** Awalnya pagination generik menaruh `display:none !important`
inline pada baris detail yang tertutup. `togglePoDetails()` hanya membuang class `hidden`,
jadi baris tetap tak terlihat sampai polling cloud 7 detik berikutnya.

Fix: `togglePoDetails()` sekarang menghapus inline `display` saat membuka dan
memasangnya lagi saat menutup. **Jangan dihapus.**

---

## 3. Kartu mobile

### 3.1 Riwayat Surat Jalan

Susunan akhir (label di atas nilai):

1. `No. Surat Jalan` (kiri) + `Tanggal` (kanan) — garis pemisah disambung
2. `Nama Barang` (kiri, rata kiri) + `Customer` (kanan)
3. `Alamat` — full width, clamp 2 baris, **wajib ada**
4. `No. PO` (kiri) + `User` (kanan)
5. `Total Qty` — baris penuh, center di 50% kartu
6. Aksi: Detail / Cetak SJ / Excel SJ (rata lebar kartu)

### 3.2 Barang Keluar

1. `ID Transaksi / No. SJ` + `Tanggal`
2. `Nama Barang` + `Customer`
3. `No. PO` + `User`
4. `Total Qty`
5. Aksi rata

**Tidak ada alamat** di kartu Barang Keluar (sesuai keputusan user). Desktop tetap
memakai header `Jumlah Jenis Barang` dengan nilai `N barang`.

Pada **form input Barang Keluar**, teks `Stok: N` di sebelah kiri Qty Keluar
berkedip hijau halus saat stok tersedia (`> 0`) dan abu-abu diam saat stok habis.
CSS-nya ditaruh paling akhir di `styles.css` karena blok mobile `#tab-keluar`
mematikan `animation` pada seluruh `.app-card *`.

### 3.3 Stabilitas scroll

Kartu SJ/Keluar memakai: blur/filter/animasi/transisi dimatikan, background opak,
`contain:paint`, `translateZ(0)`, `backface-visibility:hidden`. Ini mencegah blink
saat scroll melewati header sticky.

---

## 4. Alamat customer di PO

### 4.1 Penyimpanan

- Alamat disimpan **per detail barang PO**, field: `po.alamat`.
- Form PO: textarea `#po-alamat`, label **Alamat Customer (untuk Surat Jalan)**.
- Di panel **Detail PO**, alamat ditampilkan di baris paling atas dengan label
  **Alamat Customer:**.

### 4.2 Tombol Ubah Alamat

- Tombol `po-edit-alamat` muncul di panel Detail PO untuk role selain viewer.
- Klik → editor textarea + tombol **Simpan Alamat** / **Batal**.
- Klik lagi pada tombol yang sudah berubah jadi **Tutup Editor** → editor ditutup.
- Saat simpan, alamat di-update ke **semua detail barang** dalam grup
  `CUSTOMER | NO_PO_CUSTOMER` lewat loop `sendOperation('po.update', { id, record: { alamat } })`.
- **Worker tidak diubah**, jadi tidak perlu deploy ulang. Catatan: loop ini bukan
  transaksi atomik — kalau salah satu gagal, sebagian baris bisa ter-update.

### 4.3 Toast dibedakan

| Aksi | Judul | Ikon | Pesan |
|---|---|---|---|
| Simpan PO baru | PO Tersimpan | `check-circle-2` | `PO Customer berhasil disimpan ke Cloud.` |
| Edit detail PO | Perubahan Tersimpan | `pencil` | `Detail PO <id> berhasil diperbarui.` |
| Simpan alamat | Alamat PO Diperbarui | `map-pin` | `Alamat customer berhasil diperbarui untuk N barang PO.` |

Toast lain (misal login `toast-welcome`, durasi 8000 ms) tidak diubah.

### 4.4 Alamat di Riwayat SJ

`collectSuratJalanData()` memakai `resolvePoAlamat(head, rows)` dengan urutan:

1. PO dari `head.poRef` yang punya alamat
2. PO dari `poRef` semua barang SJ
3. `head.alamat` dari transaksi keluar
4. PO lain dalam grup `CUSTOMER | NO_PO_CUSTOMER` yang sama
5. Kosong → tampil `-`

Fallback ini penting untuk data lama yang alamatnya cuma tersimpan di salah satu
detail PO. Sumber yang sama dipakai **Cetak SJ** dan **Excel SJ**, jadi keduanya
ikut berubah. Kalau SJ lama memang tidak punya alamat di PO mana pun, tetap `-`
dan harus diisi lewat **Ubah Alamat** di PO Customer.

Baris filter Riwayat SJ (Cari / Dari / Sampai / Customer / Reset) sekarang punya
jarak bawah 24px (20px di mobile) dari tabel, gap 14px 16px antar input, dan tombol
Reset disamakan tinggi 34px supaya nggak mepet / desak tabel. Teks **Reset**
juga tepat di tengah tombol (flex center).

### 4.5 Tombol Tambah Barang di UI 4 mobile

- Ukuran tombol `addPoItemRow()` **disamakan dengan UI 1–3** (font/padding bawaan,
  ±150×38px); tidak ada lagi override font 11px khusus UI 4.
- Baris `Daftar Barang dalam PO *` + tombol boleh `flex-wrap`; label `min-width:0`
  dan tombol `white-space:nowrap`, jadi tidak bertumpuk pada layar sempit.
- Di dalam baris barang, UI 3/4 kini memakai susunan dua kolom yang sama dengan
  UI 1/2 pada ≤767px (baris 1: Barang | Qty PO, baris 2: Qty Siap | Warna,
  baris 3: Hapus). Layout saja; warna, font, dan handler tidak berubah.

---

## 5. Scroll horizontal tabel

- Semua `.fluid-table-container` di tab bertabel diberi `max-height:none !important`
  → **tidak ada scroll vertikal internal**, pagination yang menggantikan peran scroll.
- Scroll horizontal tetap ada untuk kolom lebar.
- Container dipromosikan ke layer sendiri: `transform:translateZ(0)`,
  `backface-visibility:hidden`, `contain:paint`, `overscroll-behavior-x:contain`.
- `backdrop-filter` / `filter` / transisi pada card + isi tabel dimatikan supaya
  tidak repaint tiap frame (terutama di tema glass).
- **UI 3 (`theme-soft`)**: tombol **Reset** di form (termasuk filter SJ) memakai clay
  `#c49a94` / `#332624` dan tombol **Print** memakai sage `#9cb7a3` / `#2c392f`.
  Keduanya mengikuti palet UI 3; `Batal` tetap merah dan efek tekan V208 tetap aktif.
- **UI 4 (`theme-neon`)**: kanvas `#inventory-main-content` ikut di-flat
  (`background:#07090d`, `background-image:none`, `background-attachment:scroll`) dan
  pseudo-orb `::before/::after` dimatikan seperti UI 3. Ini menghilangkan repaint
  gradient besar + blur tiap scroll. Tema lain, palet cyan, grid Data Explorer, dan
  handler tidak berubah.

### 5.1 Pemberitahuan batal edit

- Tombol **Reset** di 6 form (Master, PO, Masuk, Keluar, Sampel, Retur) memakai
  `requestFormReset(key)`, bukan `resetXxxForm()` langsung.
- Saat mode edit aktif (`<mode>-edit-mode = 'true'`), label tombol otomatis jadi
  **Batal** (merah solid di semua 4 UI) lewat `syncResetButtons()`. Klik **Batal** memunculkan
  dialog `showConfirm('Batalkan Edit?', ...)` dengan tombol **Ya, Batalkan Edit**;
  baru setelah dikonfirmasi form di-reset dan muncul toast:
  `Edit <Form> dibatalkan. Perubahan yang belum disimpan dibuang.`
- Di luar mode edit, tombol tetap **Reset**, reset langsung tanpa dialog/toast.
- `syncResetButtons()` dipanggil dari `beginTransactionEdit()` dan dari tiap reset
  function, jadi label kembali ke **Reset** setelah simpan/batal.

### 5.2 Keterangan Sampel

- Field opsional `#sampel-keterangan` (textarea) dipisah dari `Nama Sampel`.
- Tersimpan sebagai properti `keterangan` pada tiap record sampel. Worker **tidak
  perlu diubah**: `sampel.create` memakai `{ ...p.record, id }` dan `sampel.update`
  memakai `{ ...oldRow, ...incoming }`, jadi field baru ikut tersimpan otomatis.
- Tampil di kolom **Keterangan** tabel, ikut dicari di `search-sampel` dan global
  search, ikut di dialog detail sebelum simpan, serta di laporan cetak sampel.
- Record lama tanpa `keterangan` aman → ditampilkan sebagai `-`.
- **UI 4 (Black Cyan / `theme-neon`)**: form **Sampel** mengikuti tata letak UI 3 —
  grid 4 kolom, `align-items:end`, `gap:12px 14px`, wrapper `.grid` (Lebar/Ukuran,
  Berat/Tebal) cukup `span 2` (bukan baris penuh seperti aturan generik UI 4),
  tombol min-width 120px. Responsif: 2 kolom ≤999px, 1 kolom ≤640px.
  Warna tetap palet Black Cyan; tema lain tidak terpengaruh.
- **UI 3 & UI 4 — form Barang Masuk**: Kategori sekarang **teks biasa** (bukan pill lagi
  sejak `308e017`), tetap ada tooltip `title` berisi teks lengkap. Warna **read-only** dari
  Master lewat `#info-masuk-warna`, bukan input yang bisa ditimpa. Di desktop (≥1000px) form
  pakai grid 3 kolom: baris 1 `ID / Tanggal / Barang`, baris 2 `Info (Kategori|Warna|Satuan) /
  Jumlah Masuk / Divisi`, baris 3 tombol penuh. Selector UI 4 sengaja dipanjangkan lewat
  `#masuk-form-card` untuk mengalahkan aturan generik `form[id^="form-"] > .grid` yang memaksa
  panel Info jadi `grid-column:1/-1`.
- **Dropdown custom**: UI 2 memakai kaca gelap + tipografi 12.5px/600. Panel opsi
  "Pilih Barang" di Barang Masuk mengikuti lebar trigger agar tidak melebar ke kanan.
- **Toast biasa** (di luar `toast-welcome`) memakai animasi bounce halus tapi jelas
  enter/exit + icon pop + teks bertahap + glow progress; otomatis mati saat `prefers-reduced-motion`.
  Badge ikon memakai akrilik transparan (blur + highlight kaca), warna status tetap
  memakai `--toast-tone`.
- Placeholder seluruh input/textarea dibuat lebih redup agar tidak mendominasi form,
  tapi teksnya masih terbaca di 4 tema.
- Sidebar UI 2: menu aktif memakai tampilan hover state (kaca tipis, bukan gradient biru)
  dan hover-nya diberi bayangan lembut.
- Sidebar: tombol yang baru aktif pop halus (animasi `sidebarActivePop`, mati saat reduced motion).
- UI 1 & UI 2: baris Tambah Barang (PO) rapi — Barang|Qty PO, Qty Siap|Warna, Hapus badge di tengah baris 3.
- UI 1 & UI 2: semua tombol di area konten jadi badge pill akrilik (warna per status, hover pop).
  Reset (form + Riwayat SJ)=amber, Print=emerald, Sebelumnya/Berikutnya=sky, Batal tetap merah.
  Tombol utama/sidebar/header/modal tetap solid. UI 3/4 tidak berubah.
- UI 1 & UI 2: Barang Keluar cuma 1 tombol Detail (mobile badge disembunyikan di desktop).
- Jam header: JetBrains Mono 700 + tabular-nums, tanggal tetap Inter.
- Logo header: `assets/Logo/LOGO CV-NO TEXT.png` di badge putih (object-fit contain).
- **Grafik garis Dashboard** (Inflow/Outflow): garis digambar dari kiri ke kanan,
  area fade-in, titik pop bertahap; mati otomatis kalau `prefers-reduced-motion`.
  SVG cuma digambar ulang kalau data/rentang/tema berubah (signature guard), jadi tidak
  berkedip tiap Cloud Sync 7 detik.

### 5.3 Guard pindah menu saat form belum disimpan

- `window.switchTab()` memeriksa dua kondisi sebelum memindah tab:
  1. `isEditingTransactionForm()` — flag `<menu>-edit-mode = 'true'`.
  2. `hasUnsavedFormInput()` — user sudah mengubah isian form lewat event
     `input`/`change`, walau belum klik tombol Edit.
- Form yang dipantau: Master, PO, Masuk, Keluar, Sampel, Retur, dan User.
- Nilai default / pengisian otomatis dari JS tidak memicu guard karena deteksi
  memakai event user, bukan perbandingan nilai.
- Dialog memakai `showConfirm(..., { confirmLabel:'Ya, Lanjutkan' })`:
  - Mode edit → judul **Mode Edit Aktif**.
  - Baru ngetik → judul **Form Belum Disimpan**.
- Flag perubahan dibersihkan oleh `clearUnsavedFormFlag()` saat form di-reset,
  disimpan, atau masuk mode edit. **Batal** pada dialog membuat user tetap di menu
  saat ini; **Ya, Lanjutkan** memindah tab tanpa mereset isian form.
- Berlaku di desktop dan drawer mobile karena keduanya memanggil `switchTab()`.

---

## 6. File & cache

File yang diubah pada pekerjaan ini:

```
assets/app.js
assets/styles.css
index.html
```

Cache-buster **saat ini** (di `index.html`):
HEAD `68d6321`
Commit aplikasi terakhir; commit `docs:` (termasuk commit sinkron) tidak dihitung guard.

```
assets/styles.css?v=po-alamat-badge-20261126
assets/app.js?v=po-alamat-badge-20261126
```

Commit terkait (terbaru di atas):

```
68d6321  feat: badge alamat customer di detail riwayat PO
0ad146d  feat: indikator loading tombol login
ee9250e  fix: guard HEAD lewati baris hash doc
5fcfbf7  fix: guard sinkron abaikan commit docs sendiri
5b587ac  docs: sinkronkan handover ke HEAD 6b793b6 + guard sinkron doc
6b793b6  fix: Total Qty kartu SJ mobile di-center di atas tombol aksi
feefc40  fix: susun ulang layout kartu Riwayat SJ mobile
a7687b3  fix: hapus override SJ yang paksa Total Qty tumpang tindih
de87631  fix: cegah tumpang tindih Warna dan Total Qty kartu SJ mobile
7cf7521  fix: cegah tumpang tindih Total Qty dengan Warna di kartu SJ mobile
f38591e  fix: overlap label Total Qty di kartu Riwayat SJ + fokus edit Keluar
3c033df  fix: fokus langsung ke form saat edit Barang Keluar
45b0995  fix: bentuk tombol Detail kartu Barang Keluar UI3 disamakan
8cc6434  fix: label badge cloud sync mobile jadi Connecting
52e7aea  fix: label badge cloud sync mobile jadi Online
b04e33c  fix: badge cloud sync mobile ringkas
d3b9836  fix: fokus ke form saat edit Master Barang
cd247ad  fix: selaraskan selector CSS header dengan data-action
48e1acc  fix: badge role/sync mobile via specificity override
ac8597d  fix: badge role/sync mobile aman untuk semua UI
74d09d7  fix: rapikan badge role/sync header mobile
3f2b015  fix: typo sidebar + retry rate limit login
24ac130  fix: typo userBanner di sidebar toggle mobile
7677f78  refactor: fase 3 prep CSP via event delegation
a91e007  chore: hapus CSP report-only meta yang tidak didukung browser
a796108  fix: normalisasi audit SJ setelah print/excel
30c22bc  chore: fase 3 hardening CSP report-only dan SRI CDN
22aedcc  fix: fase 2 worker hardening + guard SJ viewer
d0af67e  fix: hardening fase 1 audit + perbaiki blank page PO render
26919ee  docs: sinkronkan handover ke HEAD e3a0559 dan cache-buster aktif
e3a0559  UI 1 scroll ringan (attachment scroll + orb off)
4302fb3  grafik flex smooth + font UI3 mobile proporsional, overlay tema penuh
535f4de  Pencarian Umum rata kiri + hover tanpa pop (UI 1/2)
d18bc95  parity layout mobile UI 2/3/4, tombol PO UI 4, gradient UI 2 satu sumber
662a4f7  efek tekan semua tema, Simpan akrilik, Detail ungu, hapus duplikat UI3/4
60598d0  badge akrilik UI 1/2, logo CV, perbaikan duplicate Detail Keluar
b25c652  logo tanpa teks, placeholder redup, hover sidebar UI 2, jam mono, toast akrilik
5e9770d  animasi grafik garis dashboard dengan guard anti-render ulang
6106ea4  guard pindah menu saat form ada perubahan belum disimpan
308e017  rapikan dropdown, form, placeholder, animasi toast; Warna Masuk read-only
c29afd5  status koneksi login UI 3 ikut terang (HTTPS/checking)
0e8c786  status HTTP + Inventory Gudang diperjelas di UI 3
1814b36  dropdown Edit terisi + mitigasi delay 7 detik
b618017  warna di popup, Batal merah semua UI
0651f22  warna barang di form/tabel/cetak/Excel SJ
e5f888c  ubah alamat PO, toast beda, fallback alamat riwayat SJ
54ad232  reset filter, kartu mobile SJ, jarak tombol reset
a17aee2  kartu mobile SJ + keluar, pagination, garis pemisah
4e65916  pagination 10 baris, tinggi filler, scroll horizontal
```

Jangan pernah menyunting salinan lama:

```
D:\PROJECT INVENTORY\assets\app.js
D:\PROJECT INVENTORY\index.html
```

Path kerja yang benar: `D:\PROJECT INVENTORY\inventory`.

---

## 7. Checklist testing

1. Hard refresh setelah perubahan cache.
2. Desktop: semua tabel tetap berbentuk tabel, pagination muncul hanya saat >10 baris.
3. Mobile (≤767px): SJ & Barang Keluar jadi kartu, alamat SJ tetap ada, Keluar tanpa alamat.
4. Buka PO dengan banyak barang → klik **Detail** → harus langsung muncul (tanpa delay 7 detik).
5. Klik **Ubah Alamat**, isi, simpan → alamat di panel Detail berubah, toast bertuliskan
   **Alamat PO Diperbarui**.
6. Buka Riwayat SJ dari transaksi terkait → alamat ikut muncul.
7. Cetak SJ / Excel SJ → alamat di header ikut terbarui.
8. Login sebagai `viewer` → tombol Edit / Ubah Alamat / Atur tidak muncul, data tetap terbaca.
9. Geser tabel ke samping → tidak tersendat, halaman tidak ikut bergeser.
10. Klik Edit di Master/PO/Masuk/Keluar/Sampel/Retur → dropdown terisi langsung, tombol
    Reset berubah jadi **Batal** ber-background merah, custom dropdown (Kategori/Lebar/Ukuran)
    menampilkan nilai lama.
11. Cek pop-up konfirmasi simpan → baris **Warna** ikut tampil.
12. Login di UI 3 → status koneksi (HTTPS/checking/HTTP/offline) dan "Inventory Gudang" jelas terbaca.
13. Isi form lalu pindah menu tanpa simpan → muncul konfirmasi "Form Belum Disimpan" / "Mode Edit Aktif";
    **Batal** tetap di menu, **Ya, Lanjutkan** berpindah.
14. Barang Masuk → Warna tampil read-only dari Master, Kategori teks biasa (bukan pill).

---

## 8. Kendala lingkungan

- Tidak ada runtime `node`/`python`; verifikasi memakai `git diff --check` + Chrome headless.
- Worker di-deploy manual oleh user via Wrangler dengan nama `inventory-backend-test`.
- Frontend otomatis via GitHub Pages (HTTPS). Karena itu status koneksi di login UI 3
  memakai state `secure` ("Koneksi HTTPS aktif"), sudah ikut dibuat kontras.
- Worker sudah diperbarui dengan whitelist `warna` (commit `0651f22` / `afed647`).
- Perubahan `308e017`–`60598d0` hanya frontend (`app.js`, `styles.css`, `index.html`, aset logo) — Worker tidak diubah.
- `boot.js` belum diganti (`APP_VERSION = "2026.11.23-inventory-v100-surat-jalan"`); cache-buster
  memakai `?v=` di `index.html`, jadi perubahan tetap terlihat setelah hard refresh.

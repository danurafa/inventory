# Dokumentasi Tabel, Pagination, dan Alamat PO

Dibuat: 2026-11-24 · Commit terakhir: `e5f888c` · Remote: `origin/main`

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

---

## 5. Scroll horizontal tabel

- Semua `.fluid-table-container` di tab bertabel diberi `max-height:none !important`
  → **tidak ada scroll vertikal internal**, pagination yang menggantikan peran scroll.
- Scroll horizontal tetap ada untuk kolom lebar.
- Container dipromosikan ke layer sendiri: `transform:translateZ(0)`,
  `backface-visibility:hidden`, `contain:paint`, `overscroll-behavior-x:contain`.
- `backdrop-filter` / `filter` / transisi pada card + isi tabel dimatikan supaya
  tidak repaint tiap frame (terutama di tema glass).

---

## 6. File & cache

File yang diubah pada pekerjaan ini:

```
assets/app.js
assets/styles.css
index.html
```

Cache-buster **saat ini** (di `index.html`):

```
assets/styles.css?v=excel-sj-fast-20261124
assets/app.js?v=excel-sj-fast-20261124
```

Commit terkait:

```
54ad232  reset filter, kartu mobile SJ, jarak tombol reset
a17aee2  kartu mobile SJ + keluar, pagination, garis pemisah
4e65916  pagination 10 baris, tinggi filler, scroll horizontal
e5f888c  ubah alamat PO, toast beda, fallback alamat riwayat SJ
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

---

## 8. Kendala lingkungan

- Tidak ada runtime JS/Python di mesin pengembangan (`node`, `python`, dll.).
  Verifikasi memakai review manual + `git diff --check`.
- Worker di-deploy manual oleh user via Wrangler dengan nama `inventory-backend-test`.
- Karena fitur alamat memakai `po.update` yang sudah ada, **tidak ada perubahan Worker**
  pada pekerjaan ini.

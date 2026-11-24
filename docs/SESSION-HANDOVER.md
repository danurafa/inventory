# Catatan Serah Terima Sesi — Inventory Surat Jalan

Dokumen ini dibuat supaya sesi baru di PC 2 bisa langsung lanjut tanpa membaca
percakapan lama. Dibuat: 2026-11-23. Diperbarui: 2026-11-24 (HEAD `e5f888c`).

Untuk detail pekerjaan UI terbaru (kartu mobile, pagination 10 baris, alamat PO,
toast, scroll horizontal), baca juga `docs/TABEL-PAGINATION-ALAMAT.md`.

---

## 1. Ringkasan singkat

Aplikasi inventory ini adalah **satu `index.html` + `assets/app.js` yang responsif**.
Tidak ada aplikasi mobile terpisah — yang dimaksud "UI 3" adalah **tema Soft Neutral**,
bukan versi aplikasi. Semua fitur di bawah berlaku juga di browser mobile (HP/tablet)
yang membuka URL yang sama.

Fitur yang sudah selesai:

- Toast sambutan login di tengah layar (class `toast-welcome`), toast lain tidak diubah.
- Shimmer kartu sambutan 2×, animasi soft drop + icon pop, aman untuk `prefers-reduced-motion`.
- Blok stok tipis: double-flash + jeda, **SATU overlay penuh per baris** (`::after inset:0`, `::before` dimatikan), durasi 1,5 s.
- Surat Jalan (SJ): nomor SJ di form/tabel, cetak mirip template Excel, download template `.xlsx`, riwayat per transaksi.
- Alamat customer ditaruh di **form PO Customer** (`po-alamat`), bukan di form SJ. Cell `G7` berisi alamat + `No. PO: ...`.
- Tombol **Cetak SJ** = langsung print browser; **Excel SJ** = download template.
- Menu **Riwayat Surat Jalan**: filter tanggal/customer, **10 baris/halaman** + navigasi, aksi Cetak SJ & Excel SJ, tombol **Detail (n)**.
- Semua tabel (Master, PO, Masuk, Keluar, SJ, Sampel, Retur, User) sekarang pagination 10 baris;
  bar pagination hanya muncul kalau datanya lebih dari 10.
- PO Customer: panel Detail menampilkan **Alamat Customer** + tombol **Ubah Alamat**
  (update alamat ke seluruh barang dalam satu PO). Toast dibedakan untuk simpan/edit/alamat.
- Semua tombol aksi tabel berbentuk **badge pill**, bukan efek hover, tidak bertumpuk.
- Placeholder pencarian **statis** (marquee sudah di-revert sesuai pilihan user).
- Label footer detail: **Subtotal Qty** (Barang Keluar dan Riwayat SJ).
- Anti–double-click Lucide + cache render `setTableHtml()` (WeakMap) supaya ikon tidak berkedip.
- Audit aksi SJ tersimpan di **Worker/Firestore** (lintas device); `localStorage` hanya cache/fallback.

---

## 2. Aturan password SJ (penting)

| Sumber aksi | Cetak SJ | Excel SJ |
|---|---|---|
| **Barang Keluar** | Kali pertama **bebas**; ke-2 dst wajib password | Kali pertama **bebas**; ke-2 dst wajib password |
| **Riwayat Surat Jalan** | **Selalu** wajib password sejak pertama | **Selalu** wajib password sejak pertama |

Catatan:

- Yang diminta adalah **password akun yang sedang login di device itu**, bukan password akun yang dulu mencetak.
- Password diverifikasi lewat `POST /api/login` ke Worker, lalu token disimpan ulang.
- **Riwayat tidak bergantung counter** — aman walau Worker mati atau cache kosong.
- Kalau dialog password muncul tetapi Worker offline → verifikasi gagal → **aksi dibatalkan** (fail-closed).
- Barang Keluar + Worker mati + cache kosong → counter terbaca 0 → aksi tetap jalan, tapi sekarang
  muncul toast peringatan: **"Riwayat cetak SJ belum tersinkron ke server…"**.

Dialog verifikasi memakai modal internal `#sj-password-modal` (bukan `prompt()`native).
Alasan: Safari mobile memblokir `prompt()` yang dipanggil setelah `await` (di luar user gesture),
sehingga dulu cetak Riwayat lolos tanpa password di Safari.

Guard tambahan: `dariRiwayat = source === 'riwayat' || Boolean(button?.closest?.('#tab-sj'))`
— berlaku untuk Cetak SJ dan Excel SJ, jadi tombol lama pun tetap dianggap Riwayat.

---

## 3. Audit SJ — Worker / Firestore

### Worker
- Source: `assets/worker/worker.js` (sudah ter-track di git).
- URL: `https://inventory-backend-test.danurafa.workers.dev`
- Endpoint:
  - `GET /api/sj/audit?tid=<id>` — baca counter. Boleh untuk semua role yang login, termasuk viewer.
  - `POST /api/sj/audit` — tulis counter, idempotent pakai `eventId`.
- Auth: `authenticate(request, env)` via Bearer token (`WORKER_TOKEN_KEY = 'gudang_pro_worker_token'`).
- Firestore path:
  `artifacts/gudang-pro-cloud-system/private/sj_audit/records/<sha256(tid)>`
- Field counter: `keluarPrint`, `keluarExcel`, `riwayatPrint`, `riwayatExcel`, `count`, `updatedAt`, `tid`.
- Retry 5× dengan precondition `updateTime`; simpan 50 event terakhir.
- Secret (jangan pernah hardcode): `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_PROJECT_ID`, `SETUP_SECRET`.

Status pengecekan terakhir:
```
GET /api/sj/audit?tid=test     → 401 (route ADA)
GET /api/sj/audit-xyz?tid=test → 404 (fallback normal)
```
Jadi endpoint sudah terpasang di Worker live. Deploy ulang hanya untuk memastikan versi terbaru.

### Frontend (`assets/app.js`)
Fungsi penting:

- `normalizeSjAudit()`, `mergeSjAudit()` (gabung dengan `Math.max`)
- `readSjPrintedMap()`, `writeSjPrintedMap()`, `cacheSjAudit()`
- `getSjPrintRecordInfo(tid)` → `{ record, synced }` — `synced:false` kalau Worker 404/offline/401
- `getSjPrintRecord(tid)` → wrapper yang mengembalikan `record` saja
- `markSjAction(tid, source, action)` → `return synced` (hasil POST ke Worker)
- `verifySjPassword(password)`, `requireSjPassword(message)`
- `runSjAction(key, button, task)` → kunci anti–double-click

Cache lokal:
- `SJ_PRINTED_KEY = 'gudang_sj_printed_map'` → `{ <tid>: { keluarPrint, keluarExcel, riwayatPrint, riwayatExcel, count, updatedAt, tid } }`
- Urutan: tulis cache dulu → POST ke Worker → hasil digabung balik.
- Reset manual: `localStorage.removeItem('gudang_sj_printed_map')`.
- Cache **tidak menyimpan password**, hanya jumlah aksi + waktu.

Alur baca: cache lokal → GET Worker → `Math.max` → simpan balik.
Kalau GET/POST gagal → tetap jalan pakai cache + toast peringatan (bukan strict block).

---

## 4. Detail teknis Surat Jalan

- Input nomor SJ: `keluar-no-sj`; properti data: `noSj`.
- Default: `SJ-YYMM-####` dari `OT-YYMM-####`.
- Payload ikut dikirim di `keluar.batchCreate` dan `keluar.update`.
- Overlay nomor SJ lokal: `SJ_MAP_KEY = 'gudang_keluar_sj_map'`;
  helper `readSjMap()`, `rememberKeluarNoSj()`, `generateKeluarNoSj()`, `getKeluarNoSj()`.
- Helper cetak: `normalizePrintDate()`, `formatPrintDate()`, `escapePrintHtml()`,
  `renderPrintDocument()`, `doPrintSuratJalan()`.
- Kop cetak hardcoded: **CV. TRIASTINDO JAYA**. CSS cetak ditulis di dalam
  `printWindow.document.write()` (tidak menyentuh stylesheet utama).
- Excel: baca template asli `assets/templates/surat-jalan.xlsx` via `JSZip`,
  fallback `xlsx-js-style`, fallback terakhir CSV dengan BOM. Kalau download otomatis
  diblokir Safari mobile, muncul tautan manual `#sj-manual-download` di pojok kanan bawah
  selama 60 detik. Saat klik muncul dulu chip `#sj-excel-progress` ("Menyiapkan Excel SJ…"),
  lalu JSZip + template di-prefetch **bersamaan** dengan audit/password supaya tidak berurutan.
  `getSjTemplateBuffer()` **tidak lagi** membuka file picker otomatis
  (dulu menggantung di Safari setelah `await`).
- Mapping template: `D6`, `G6`, `D7`, `G7`, `B10:H19` — 10 slot item.
  Lebih dari 10 item → toast peringatan. Template `G7:H8` merged + `wrapText="1"`, tanpa logo gambar.
- Riwayat: `collectSjHistoryGroups()` → grup per `transactionId`; dipakai `renderSjHistory()`.
- `toggleSjDetails(token, button, count)` memakai state `_expandedSjGroupKeys`;
  state dibersihkan saat pindah halaman/ganti filter supaya tinggi tabel stabil.
- Header Aksi Riwayat `min-width:280px`; Barang Keluar `min-width:190px`.

### Palet badge (UI 1/2)
- Abu: Detail / Tutup / Reset / pagination
- Orange: Cetak SJ / Atur
- Sky: Edit / Excel SJ
- Rose: Hapus / ✕
- Amber: Reset Password

Catatan UI 3 (Soft Neutral): ada override CSS lama yang mengubah badge sky → sage dan
rose → merah kecoklatan di layar ≤767px. Fungsi tetap aman; yang berbeda cuma warna.
Belum ada keputusan final apakah mau dipaksa seragam dengan UI 1/2.

---

## 5. File & posisi git

Repo: `D:\PROJECT INVENTORY\inventory`
Remote: `https://github.com/danurafa/inventory.git` (branch `main`)

File yang tersimpan di git:
```
assets/app.js
assets/boot.js
assets/styles.css
assets/templates/surat-jalan.xlsx
assets/worker/worker.js
index.html
docs/SESSION-HANDOVER.md
docs/TABEL-PAGINATION-ALAMAT.md
```

Cache-buster saat ini:
- `index.html` → `assets/app.js?v=excel-sj-fast-20261124`
- `index.html` → `assets/styles.css?v=excel-sj-fast-20261124`
- `assets/boot.js` → `APP_VERSION = "2026.11.23-inventory-v100-surat-jalan"`

Commit penting:
- `2efabc3` — perbaikan print (endpoint audit + dialog password awal)
- `b4ba100` — peringatan audit SJ belum tersinkron
- `54ad232` — reset filter SJ & kartu mobile
- `a17aee2` — kartu mobile SJ/Keluar, pagination, garis pemisah
- `4e65916` — pagination 10 baris, tinggi filler, scroll horizontal ringan
- `e5f888c` — Ubah Alamat PO, toast berbeda, fallback alamat Riwayat SJ

**Jangan pernah menyentuh** salinan lama:
- `D:\PROJECT INVENTORY\assets\app.js`
- `D:\PROJECT INVENTORY\index.html`

---

## 6. Cara "mengembalikan ingatan" di PC 2

1. Clone / pull repo:
   ```bash
   git clone https://github.com/danurafa/inventory.git
   cd inventory
   # atau kalau sudah ada:
   git pull origin main
   ```
2. Buka folder itu di OpenCode, lalu **pesan pertama** di sesi baru:
   ```
   Baca docs/SESSION-HANDOVER.md di repo ini dan lanjutkan dari situ.
   Jelaskan kembali ringkasannya sebelum mengubah apa pun.
   ```
3. Sesi baru belum punya riwayat percakapan, tetapi dengan file itu saya bisa
   langsung memahami konteks, aturan, dan posisi pekerjaan.

Catatan: sesi OpenCode **tidak tersinkron otomatis** antar PC. Yang ikut pindah
cuma file repo + riwayat git. `localStorage` dan sesi login browser juga kosong
di PC 2 — itu wajar, login ulang saja.

---

## 7. Cara tes lintas device (setelah Worker aktif)

1. PC 1 → Barang Keluar → **Cetak SJ** SJ tertentu (pertama: bebas).
2. PC 2 → buka SJ yang sama → **Cetak SJ** → harus muncul dialog **Verifikasi Password**.
3. Riwayat SJ di device mana pun → **Cetak SJ / Excel SJ** → langsung minta password.
4. Matikan internet / blokir Worker → Cetak dari Barang Keluar → tetap jalan,
   tapi muncul toast **"Riwayat cetak SJ belum tersinkron…"**.
5. Safari mobile: cek dialog password internal muncul (bukan `prompt()` native).

Kalau ada yang aneh, kirim: device + browser, sumber tombol (Barang Keluar/Riwayat),
dan isi Console especially response `/api/sj/audit`.

---

## 8. Kendala lingkungan

- Tidak ada runtime JS/Python di mesin pengembangan (`node`, `bun`, `deno`, `qjs`, `python` tidak tersedia).
  Verifikasi memakai `git diff --check` + review manual.
- Deploy Worker dilakukan manual oleh user (`npx wrangler deploy worker.js --name inventory-backend-test`).
  Nama Worker harus tetap `inventory-backend-test` karena tidak ada `wrangler.toml` di repo.
- Popup cetak di Safari iOS kadang diblokir bila dipanggil setelah `await`;
  kalau terjadi, rencana cadangan: pakai `window.print()` di halaman yang sama.

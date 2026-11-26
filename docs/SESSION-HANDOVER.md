# Catatan Serah Terima Sesi — Inventory Surat Jalan

Dokumen ini dibuat supaya sesi baru di PC 2 bisa langsung lanjut tanpa membaca
percakapan lama. Dibuat: 2026-11-23. Diperbarui: 2026-11-26 (HEAD `0ad146d`, cache disinkronkan ke index.html).

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
- Tombol **MASUK SISTEM** ada indikator loading: label jadi `MEMERIKSA…` + spinner, tombol di-disable sampai `/api/data` selesai; label asli dipulihkan di `finally` (sukses maupun gagal).
- Shimmer kartu sambutan 2×, animasi soft drop + icon pop, aman untuk `prefers-reduced-motion`.
- Blok stok tipis: double-flash + jeda, **SATU overlay penuh per baris** (`::after inset:0`, `::before` dimatikan), durasi 1,5 s.
- Surat Jalan (SJ): nomor SJ di form/tabel, cetak mirip template Excel, download template `.xlsx`, riwayat per transaksi.
- Alamat customer ditaruh di **form PO Customer** (`po-alamat`), bukan di form SJ. Cell `G7` berisi alamat + `No. PO: ...`.
- Tombol **Cetak SJ** = langsung print browser; **Excel SJ** = download template.
- Ukuran kertas **Cetak SJ**: custom `@page{size:9.5in 11in;margin:10mm}` (lebar 9.5 inci × panjang 11 inci), bukan A4 portrait. Print tabel lain tetap A4 landscape.
- Di header Cetak SJ, **No. PO** berada di baris tersendiri tepat di bawah **Tanggal** (kolom kiri); blok kanan cukup `Kepada Yth` + alamat.
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
- Form Sampel punya field **Keterangan** opsional (`sampel-keterangan`), tampil sebagai kolom
  tabel dan ikut laporan cetak. Worker tidak diubah (create/update memakai spread record).
  Di UI 4 form Sampel mengikuti tata letak UI 3 (grid 4 kolom, `.grid` span 2, tombol 120px).
- Kategori di panel info Barang Masuk sekarang **teks biasa** (bukan pill lagi sejak `308e017`),
  tetap punya tooltip `title` berisi teks lengkap dari `updateMasukItemInfo()`.
- Form Barang Masuk UI 3 & UI 4 desktop: baris `Info / Jumlah Masuk / Divisi` dalam grid 3 kolom.
- Tombol **Batal** saat mode edit memakai dialog konfirmasi `showConfirm` sebelum form di-reset.
  Label tombol Reset → **Batal** langsung muncul di semua form (Master, PO, Masuk, Keluar, Sampel, Retur)
  lewat `syncResetButtons()`; tombol Batal memakai background **merah solid** di semua 4 UI.
- **Warna Barang** (input teks bebas, otomatis uppercase) tersedia di Master Barang, PO Customer
  (per baris), Barang Keluar (per kartu), dan Retur. Di **Barang Masuk warna sekarang read-only**
  dari Master (`#info-masuk-warna`), bukan input yang bisa ditimpa manual (perubahan commit `308e017`).
  Kolom **Warna** tampil di tabel Master/PO/Masuk/Keluar/Retur/SJ (summary + detail), ikut filter
  pencarian, serta ikut **Cetak SJ** dan **Excel SJ**. Worker menyimpan `warna` lewat whitelist
  `master.create` / `master.update`; `syncLocalChanges()` juga mengirim `warna` saat update Master.
- Template Excel SJ `assets/templates/surat-jalan.xlsx` sudah dipakai: header **Warna**, data
  kolom **B–I** (No, ID Barang, Nama Barang, Warna, Jenis Barang, Lebar, Ukuran, Qty), alamat
  di-merge `H7:I8`. Mapping JS: `D6`, `H6`, `D7`, `H7`, `B10:I19` (10 slot).
- Pop-up konfirmasi simpan (`#detail-save-modal`) menampilkan Warna di semua form.
- Mitigasi delay sinkronisasi 7 detik: `refreshFromWorkerIfChanged()` (poll `/api/data` tiap
  7000 ms) ditunda saat user sedang mengedit form transaksi (`isEditingTransactionForm()`),
  dropdown Barang/PO/Retur di-refresh saat fokus dan saat klik Edit, dan Warna di kartu Keluar
  diisi langsung saat kartu dibuat (tidak menunggu poll).
- Status koneksi di modal login UI 3 (Soft Neutral) dibuat kontras untuk semua state:
  `secure` (hijau), `checking` (biru), `insecure`/`offline` (merah), termasuk teks
  "Inventory Gudang". GitHub Pages memakai HTTPS → state yang tampil biasanya `secure`.
- **Guard pindah menu** (`switchTab`): kalau form sedang mode edit **atau** sudah ada perubahan
  belum disimpan, muncul konfirmasi dulu — "Mode Edit Aktif" / "Form Belum Disimpan", tombol
  **Ya, Lanjutkan**. Flag perubahan dilacak via event `input`/`change` dan dibersihkan
  `clearUnsavedFormFlag()` saat reset/simpan/edit.
- Toast biasa (kecuali `toast-welcome`) memakai animasi **bounce halus tapi jelas**: drop + ikon
  pop + teks bertahap + progress glow; otomatis dimatikan kalau `prefers-reduced-motion`. Badge ikon toast
  memakai tampilan **akrilik transparan** (blur + highlight kaca), warna status tetap
  mengikuti `--toast-tone` (hijau/merah/kuning/biru).
- **Animasi grafik garis Dashboard**: polyline Inflow/Outflow "digambar" dari kiri ke kanan
  (`pathLength="1"` + `stroke-dashoffset`), area fade-in, titik muncul bertahap; ikut mati
  saat `prefers-reduced-motion`. Hanya CSS di `styles.css`, print CSS di `app.js` tidak diubah.
  Animasi **hanya jalan sekali per perubahan data**: `drawMovementTrend()` punya signature
  (rentang + tema + nilai baris) supaya Cloud Sync 7 detik tidak menggambar ulang SVG identik.
- Dropdown custom UI 2 (Crystal) jadi kaca gelap, tipografi dirapikan. Khusus "Pilih Barang"
  di Barang Masuk, panel dropdown mengikuti lebar trigger (tidak melebar ke kanan).
- **Sidebar UI 2**: tombol aktif (`.active` / `.theme-accent-bg` / `[aria-current]`) sekarang
  memakai **hover state** — background kaca tipis `rgba(255,255,255,.12)`, border lembut,
  highlight inset — bukan gradient biru solid. Warna teks tetap terang. UI 1/3/4 tidak berubah.
  Hover/normal juga diberi **drop shadow lembut** `0 6px 18px rgba(8,24,48,.28)`.
- **UI 1 & UI 2 — baris Tambah Barang (PO)**: disusun 3 baris rapi —
  baris 1 **Pilih Barang | Qty PO**, baris 2 **Qty Siap | Warna Barang**,
  baris 3 **badge Hapus** (`✕`, rose) di tengah. UI 3/4 tidak berubah.
- **UI 1 & UI 2 — semua tombol di area konten** (tabel/form/dashboard) memakai badge pill
  akrilik dengan gradient tipis sesuai warna status (sky/rose/orange/emerald/amber/abu),
  border lembut, highlight inset + bayangan, dan **pop halus `scale 1.03` saat hover**.
  Alpha `.34/.16`, border `.58`, glow `.24` (sama di UI 1 & UI 2). Reset → amber,
  Print → emerald, Sebelumnya/Berikutnya → sky, Batal saat edit tetap merah solid.
  Tombol utama `.theme-accent-bg` (MASUK SISTEM/Ya, Lanjutkan) sengaja tetap solid
  supaya hierarki aksi terjaga — kecuali **Simpan di UI 1 & UI 2** yang sudah jadi
  akrilik (lihat bullet berikutnya). **Sidebar, header, dan modal tidak terpengaruh.**
  UI 3/UI 4 tidak berubah.
- **Semua UI (1–4)** — efek tombol ditekan lebih jelas: `scale .95`, turun 2px,
  filter sedikit gelap, border terang, dan shadow inset. UI 1/2 badge memakai
  gradient pekat sesuai `--btn-badge-tone`; UI 3/4 mempertahankan palet asli.
  Tombol utama gelap mengikuti aksen tema; sidebar `scale .975` + highlight inset.
  Mati otomatis untuk `prefers-reduced-motion`.
- **UI 1 (Classic) & UI 2 (Crystal) — tombol Simpan**: submit button di form
  (`#inventory-main-content form button[type="submit"].theme-accent-bg`) memakai
  **badge akrilik biru** — gradient sky/blue tembus, blur 14px, border
  `rgba(125,211,252,.62)`, teks putih, highlight inset + glow. Hover/active ikut
  akrilik (active makin gelap + shadow tekan). Login (`MASUK SISTEM`), modal
  (`Ya, Simpan` / `Ya, Lanjutkan`), sidebar, dan UI 3/4 tetap solid.
- **Semua UI (1–4) — tombol Detail/Tutup** di Barang Keluar, PO Customer, dan Riwayat SJ:
  **badge akrilik ungu** (violet `rgb(167,139,250)`) — sengaja pakai warna baru supaya
  tidak sama dengan abu / sky / rose / orange / emerald / amber / biru Simpan. Gradient
  ungu tembus + blur 14px + border `rgba(196,181,253,.70)` + highlight inset. Saat state
  dibuka teks jadi **Tutup** dengan warna sama. Hover makin terang, ditekan makin gelap +
  shadow inset (efek V208 tetap jalan). Hanya tombol toggle detail yang kena. Saat panel terbuka (`aria-expanded="true"`),
  teks jadi **Tutup** dan warnanya berubah jadi **badge akrilik merah** (`rgb(251,113,133)`)
  supaya tidak bingung dengan tombol **Detail** ungu. Hover/active merah juga.
- **Mobile (≤767px) — PO Customer (sub detail)**: kolom input **Atur Siap** dan **Aksi**
  sudah dikoreksi selectors-nya (sebelum ini one-column off: menarget `nth-child(8)/(9)`,
  padahal input ada di `9` dan tombol Edit/Hapus di `10`). Kolom 9 dibuat 150px, kolom 10
  132px; input 64px + tombol `Atur`/`Edit`/`Hapus` 46px dengan `margin:1px` → tidak saling
  menimpa saat tabel di-scroll horizontal. Tidak ada perubahan di `app.js`.
- **Semua UI (1–4) — Barang Keluar**: tombol **Detail** cuma satu. Aturan badge/akrilik
  yang memaksa `display:inline-flex` membuat `.keluar-detail-mobile` ikut muncul di
  desktop (terutama UI 3/UI 4); sekarang disembunyikan lagi di desktop (≥768px) untuk
  semua tema. Di mobile kolom ke-9 tetap hidden, jadi yang tampil cuma tombol Detail
  di kartu. Tombol dengan atribut `hidden` juga dipaksa `display:none`.
- **UI 4 (Black Cyan) — scroll lebih ringan**: kanvas `#inventory-main-content` di-flat
  (`#07090d`, `background-image:none`, `background-attachment:scroll`) dan dua orb
  dekoratif `::before/::after` dimatikan, mengikuti perlakuan UI 3. `backdrop-filter`
  sudah `none` di ke-4 tema, jadi bukan penyebab berat. Palet cyan, grid Data Explorer,
  pagination, dan semua handler tidak berubah; hanya CSS.
- **UI 3 (Soft Sage) — tombol Reset & Print**: form `Reset` (termasuk `resetSjFilter()`)
  sekarang pakai clay `#c49a94` di atas `#332624` (border `#6b4f49`), sedangkan `Print`
  pakai sage `#9cb7a3` di atas `#2c392f` (border `#5f7b69`). Hover masing-masing makin
  terang, efek tekan V208 tetap jalan. `Batal` saat mode edit tetap merah; sidebar,
  modal print, dan UI lain tidak berubah.
- **UI 4 (Black Cyan) — tombol Tambah Barang (PO) mobile**: ukuran tombol
  disamakan dengan UI 1–3 (font/padding bawaan, ±150×38px). Yang diatur hanya
  baris label + tombol: boleh `wrap`, label boleh menyempit, teks tombol `nowrap`
  — jadi tidak bertumpuk di layar ≤767px tanpa mengubah ukuran tombol.
- **Mobile layout parity UI 2/3/4 = UI 1 (≤767px, layout saja)**: padding main
  dua tingkat (14px 11px di 641–767px, 16px 12px di ≤640px), gap `.grid` 12px,
  padding `.app-card` 14px, form CRUD jadi satu kolom dengan jarak 16px, dan baris
  PO memakai susunan 2 kolom seperti UI 1. Warna, font, radius, dan handler tetap
  milik masing-masing tema.
- **UI 2 (Crystal) desktop — gradient disatukan**: sempat dicoba memasang gradient
  sendiri di `#inventory-main-content` (meniru resep V214 UI 4), tapi hasilnya area
  content jadi beda warna dengan strip header/nav dan sidebar. Percobaan itu
  dibatalkan: sekarang gradient hanya ada di `body` (5 radial + 1 linear, seperti
  aslinya) dan main transparan, jadi header + sidebar + content memakai gradient
  yang sama persis. Tidak ada aturan CSS baru untuk UI 2 di desktop; mobile juga
  tidak disentuh.
- **Pencarian Umum — hasil rata kiri (UI 1 & UI 2)**: rule badge akrilik
  memasang `justify-content:center` pada semua `button` di area konten, sehingga
  baris hasil pencarian tampil di tengah. Sekarang `.dashboard-search-result`
  dipaksa `space-between`: judul + keterangan di kiri, badge kategori di kanan
  (sama seperti UI 3/4). Desktop dan mobile; warna/border/efek tekan tidak berubah.
- **Pencarian Umum — hover tidak lagi "timbul" (UI 1 & UI 2)**: hover badge
  akrilik memperbesar baris (`scale 1.03`), memutihkan teks, dan menebalkan border.
  Untuk baris hasil pencarian, hover sekarang `scale:1` dengan highlight tipis
  (UI 1 latar `rgba(37,99,235,.14)` + border `rgba(96,165,250,.40)`; UI 2 latar
  `rgba(255,255,255,.06)` + border `rgba(255,255,255,.38)`), jadi tidak ada pop.
  Efek tekan (`:active`) tetap.
- **Preview tema mobile Chrome (≤600px)**: panel Tampilan Aplikasi turun jadi 1 kolom
  (±354px) tapi `.appearance-preview` tetap `height:112px`, jadi rasionya 3.1:1
  (gepeng) sementara desktop 2.07:1 — preview kelihatan kecil. Sekarang preview
  mobile memakai `height:auto;aspect-ratio:16/9;min-height:150px` (≈354×199 di
  viewport 500), jadi proporsional. Desktop 601–767px dan ≥768px tidak berubah.
- **Popup tema: overlay penuh + scroll terkunci (≤767px)**: rule mobile
  `[role="dialog"]{max-width:calc(100vw - 20px);max-height:88dvh}` ikut kena
  `#appearance-panel` (punya `role="dialog"`), jadi overlay mengecil jadi 480×708
  dari viewport 500×805 — sisa 20px kanan + 97px bawah tidak terdim dan bisa
  discroll. Selector diubah ke `[role="dialog"]:not(.appearance-overlay)` dan
  overlay diberi `max-width/max-height:none`. Scroll halaman juga dikunci lewat
  `body:has(#appearance-panel:not(.hidden))` → `#inventory-main-content` +
  `#inventory-sidebar` (`overflow:hidden`), karena `body.style.overflow` saja
  tidak mematikan scroller utama. Dialog tetap scroll internal
  (`overscroll-behavior:contain`).
- **Grafik Tren Inflow/Outflow — lebih fleksibel (V223)**: tinggi chart
  (`.movement-trend-chart`) pindah dari rasio kaku `aspect-ratio:1100/190` ke
  `height:clamp(170px,17vw,245px)` (desktop) / `clamp(155px,44vw,215px)` (≤767px),
  jadi tinggi mengikuti layar/kartu (penyempitan widget tetap real). Di JS,
  `drawMovementTrend()` ganti `polyline`/`points` → `path` dengan kurva halus
  (Catmull-Rom → cubic bezier) supaya garis tidak kaku, dan viewBox/padding diukur
  dari `host.getBoundingClientRect()` + CSS (T=10, B=26, L=52 desktop / 46-28 mobile)
  agar teks sumbu tetap 1:1. `labelStep` dikurangi (<520px), tombol range 30/90/365
  sendiri, gradient area & titik tetap bertahan. Hasil terlihat di headless:
  chart 628x215 (1280) / 435x215 (500), `path` dengan segmen `C`, grad)},
  animasi `movementLineDraw`/`movementAreaFade` tetap jalan di sisi tujuannya.
- **Animasi active state sidebar**: tombol yang baru aktif pop halus (`scale 1.035`, fade,
  `translate -1px`) via `sidebarActivePop` 0.42s. Memakai `scale`/`translate` individual supaya
  tidak bentrok dengan `transform:none !important` di UI 2/4; mati saat `prefers-reduced-motion`.
- **UI 1 & UI 2 — tombol Hapus tabel**: jadi badge pill rose dengan ikon `✕`, tinggi 24px,
  min-width 62px, dan **dipusatkan** di cell aksi. UI 3/UI 4 tidak berubah.
- Placeholder input form diganti kalimat instruksi singkat (mis. "Ketik ID barang (SKU)...",
  "Isi warna barang..."), bukan contoh nilai lama. Warna placeholder sengaja dibuat lebih
  redup (`rgba(148,163,184,.38)`) di semua tema, tapi tetap terbaca.
- Jam header memakai **JetBrains Mono** 700 + `tabular-nums` (font ditambahkan di `<link>`
  Google Fonts `index.html`); tanggal tetap Inter. Fallback `ui-monospace, SFMono-Regular, Menlo`.
- Logo header "G" diganti **file gambar asli** `assets/Logo/LOGO CV-NO TEXT.png` (762×652,
  transparan, tanpa tulisan perusahaan) di dalam badge putih tema-netral; `object-fit:contain`
  + animasi masuk halus. Versi dengan teks (`LOGO CV.png`) tetap disimpan untuk cetak/kebutuhan lain.
  Kedua file sudah ter-track di git sejak commit `b25c652`.

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
Warna dialog ini sekarang mengikuti tema aktif (Classic, Crystal, Soft Neutral, Black Cyan),
termasuk input, pesan error, dan kedua tombol — disamakan dengan `#confirm-modal`.

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
GET /health                    → {"ok":true,"service":"inventory-backend"}
```
Jadi endpoint sudah terpasang di Worker live. Deploy ulang hanya untuk memastikan versi terbaru.

Worker sudah di-deploy ulang dengan dukungan field `warna` di Master (commit `0651f22` +
`afed647`). Kalau koneksi cloud gagal saat simpan, toast **"belum dikonfirmasi Worker"**
muncul; cek Console (`[Worker Sync] Gagal`) atau Network `/api/operations`.

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
- Mapping template (setelah Warna Barang): `D6`, `H6`, `D7`, `H7`, `B10:I19` — 10 slot item,
  kolom data **B–I** (No, ID, Nama, **Warna**, Jenis, Lebar, Ukuran, Qty).
  Template `H7:I8` merged + `wrapText="1"`, tanpa logo gambar. Fallback Excel bawaan juga
  memakai 9 kolom termasuk Warna.
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

**V207 sudah dibatalkan.** Warna badge aksi tabel kembali memakai warna asli
markup (sky/rose/orange/white). Variabel `--tbl-act-*` dan override tema V207
sudah dihapus dari `assets/styles.css` karena berasal dari salah tafsir
"Warna Barang".

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
scripts/check_doc_sync.ps1
scripts/install_doc_sync_hook.ps1
```

Cache-buster saat ini:
- `index.html` → `assets/app.js?v=login-loading-20261126`
- `index.html` → `assets/styles.css?v=login-loading-20261126`
- Gambar logo → `assets/Logo/LOGO CV-NO TEXT.png?v=keluar-detail-fix-20261125` (versi lama,
  tapi file tidak berubah sejak commit `b25c652`, jadi aman; bisa di-bump kalau mau konsisten)
- `assets/boot.js` → `APP_VERSION = "2026.11.23-inventory-v100-surat-jalan"`
- Marker HEAD di docs = commit aplikasi terakhir yang sudah dicatat; commit `docs:` (termasuk commit sinkron ini) tidak dihitung guard.

Commit penting (terbaru di atas):
- `0ad146d` — feat: indikator loading tombol login
- `ee9250e` — fix: guard HEAD lewati baris hash doc
- `5fcfbf7` — fix: guard sinkron abaikan commit docs sendiri
- `5b587ac` — docs: sinkronkan handover ke HEAD 6b793b6 + guard sinkron doc
- `6b793b6` — fix: Total Qty kartu SJ mobile di-center di atas tombol aksi
- `feefc40` — fix: susun ulang layout kartu Riwayat SJ mobile
- `a7687b3` — fix: hapus override SJ yang paksa Total Qty tumpang tindih
- `de87631` — fix: cegah tumpang tindih Warna dan Total Qty kartu SJ mobile
- `7cf7521` — fix: cegah tumpang tindih Total Qty dengan Warna di kartu SJ mobile
- `f38591e` — fix: overlap label Total Qty di kartu Riwayat SJ + fokus edit Keluar
- `3c033df` — fix: fokus langsung ke form saat edit Barang Keluar
- `45b0995` — fix: bentuk tombol Detail kartu Barang Keluar UI3 disamakan
- `8cc6434` — fix: label badge cloud sync mobile jadi Connecting
- `52e7aea` — fix: label badge cloud sync mobile jadi Online
- `b04e33c` — fix: badge cloud sync mobile ringkas
- `d3b9836` — fix: fokus ke form saat edit Master Barang
- `cd247ad` — fix: selaraskan selector CSS header dengan data-action
- `48e1acc` — fix: badge role/sync mobile via specificity override
- `ac8597d` — fix: badge role/sync mobile aman untuk semua UI
- `74d09d7` — fix: rapikan badge role/sync header mobile
- `3f2b015` — fix: typo sidebar + retry rate limit login
- `24ac130` — fix: typo userBanner di sidebar toggle mobile
- `7677f78` — refactor: fase 3 prep CSP via event delegation
- `a91e007` — chore: hapus CSP report-only meta yang tidak didukung browser
- `a796108` — fix: normalisasi audit SJ setelah print/excel
- `30c22bc` — chore: fase 3 hardening CSP report-only dan SRI CDN
- `22aedcc` — fix: fase 2 worker hardening + guard SJ viewer
- `d0af67e` — fix: hardening fase 1 audit + perbaiki blank page PO render
- `26919ee` — docs: sinkronkan handover ke HEAD e3a0559 dan cache-buster aktif
- `e3a0559` — UI 1 scroll ringan (`background-attachment:scroll` + orb dimatikan)
- `4302fb3` — grafik flex/smooth, preview tema mobile proporsional, overlay tema penuh
- `7fed984` — docs: catat commit `535f4de` & `d18bc95`
- `535f4de` — Pencarian Umum rata kiri + hover tanpa pop (UI 1/2)
- `d18bc95` — parity layout mobile UI 2/3/4, tombol PO UI 4, gradient UI 2 satu sumber
- `662a4f7` — efek tekan semua tema, Simpan akrilik, Detail ungu, hapus duplikat UI3/4
- `60598d0` — badge akrilik berwarna UI 1/2, logo CV, perbaikan duplicate Detail Keluar
- `b25c652` — logo tanpa teks, placeholder redup, hover sidebar UI 2, jam mono, toast akrilik
- `5e9770d` — animasi grafik garis dashboard dengan guard anti-render ulang
- `6106ea4` — guard pindah menu saat form memiliki perubahan belum disimpan
- `308e017` — rapikan dropdown, form, placeholder, animasi toast; Warna Masuk jadi read-only
- `c29afd5` — status koneksi login UI 3 ikut terang (HTTPS/checking)
- `0e8c786` — status HTTP + teks "Inventory Gudang" diperjelas di UI 3
- `1814b36` — dropdown terisi saat klik Edit + mitigasi delay sinkron 7 detik
- `b618017` — Warna di popup, tombol Batal merah semua UI, sinkron Batal Master/PO
- `afed647` — kirim `warna` saat update Master ke Worker
- `efb010e` — revert V207 badge aksi per tema
- `0651f22` — Warna Barang di form/tabel/cetak/Excel SJ
- `dfc02ba` — keterangan sampel + konfirmasi batal edit
- `3a77a6f` — download Excel SJ: progress, prefetch paralel, tautan manual Safari
- `e5f888c` — Ubah Alamat PO, toast berbeda, fallback alamat Riwayat SJ
- `4e65916`, `a17aee2`, `54ad232` — pagination 10 baris & kartu mobile SJ/Keluar

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

- Tidak ada runtime `node`, `bun`, `deno`, `python` di mesin pengembangan. Alternatif yang dipakai:
  `git diff --check` + syntax check `assets/app.js` lewat **Chrome headless**
  (`chrome.exe --headless=new --allow-file-access-from-files --dump-dom`, lalu `new Function(src)`).
- Deploy Worker dilakukan manual oleh user (`npx wrangler deploy worker.js --name inventory-backend-test`).
  Nama Worker harus tetap `inventory-backend-test` karena tidak ada `wrangler.toml` di repo.
- Frontend di-deploy otomatis lewat **GitHub Pages** (`https://danurafa.github.io/inventory/`).
  Setiap perubahan `app.js`/`styles.css` wajib mengganti `?v=` di `index.html` + **hard refresh**.
  Halaman GitHub Pages memakai HTTPS, jadi status login yang muncul adalah `secure`, bukan `insecure`.
- Popup cetak di Safari iOS kadang diblokir bila dipanggil setelah `await`;
  kalau terjadi, rencana cadangan: pakai `window.print()` di halaman yang sama.

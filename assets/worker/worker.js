/**
 * Inventory Backend - Cloudflare Workers
 * Firebase Firestore REST + Firebase Admin service account.
 *
 * Required bindings:
 * FIREBASE_SERVICE_ACCOUNT = Secret
 * FIREBASE_PROJECT_ID = inventorytestcv
 * SETUP_SECRET = Secret
 *
 * Jangan aktifkan di produksi sebelum integrasi INDEX dan pengujian selesai.
 */

const DATA_PATH = "artifacts/gudang-pro-cloud-system/public/data/shared_inventory_main/main";
const USER_COLLECTION = "artifacts/gudang-pro-cloud-system/private/auth_users/users";
const SESSION_COLLECTION = "artifacts/gudang-pro-cloud-system/private/auth_sessions/sessions";
const MIGRATION_MARKER_PATH = "artifacts/gudang-pro-cloud-system/private/auth_migrations/legacy_users/state";
const SJ_AUDIT_COLLECTION = "artifacts/gudang-pro-cloud-system/private/sj_audit/records";
const SJ_AUDIT_FIELDS = ["keluarPrint", "keluarExcel", "riwayatPrint", "riwayatExcel"];

const SESSION_TTL_SECONDS = 60 * 60 * 2;
const PBKDF2_ITERATIONS = 100000;
const LEGACY_PBKDF2_ITERATIONS = 10000;
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const LOGIN_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;
const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 10;

const encoder = new TextEncoder();
let cachedGoogleToken = null;

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders
    }
  });
}

function b64url(bytes) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromB64url(value) {
  const s = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = s + "=".repeat((4 - s.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

function randomToken(bytes = 32) {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return b64url(value);
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(value)
  );

  return [...new Uint8Array(digest)]
    .map(x => x.toString(16).padStart(2, "0"))
    .join("");
}

function pemToArrayBuffer(pem) {
  const clean = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");

  return fromB64url(
    clean.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
  ).buffer;
}

function encodeFirestore(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "string") return { stringValue: value };

  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(encodeFirestore)
      }
    };
  }

  if (typeof value === "object") {
    const fields = {};

    for (const [key, val] of Object.entries(value)) {
      fields[key] = encodeFirestore(val);
    }

    return { mapValue: { fields } };
  }

  return { nullValue: null };
}

function decodeFirestore(value) {
  if (!value) return null;
  if ("nullValue" in value) return null;
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("timestampValue" in value) return value.timestampValue;

  if ("arrayValue" in value) {
    return (value.arrayValue.values || []).map(decodeFirestore);
  }

  if ("mapValue" in value) {
    return decodeFields(value.mapValue.fields || {});
  }

  return null;
}

function decodeFields(fields) {
  const result = {};

  for (const [key, value] of Object.entries(fields || {})) {
    result[key] = decodeFirestore(value);
  }

  return result;
}

async function googleAccessToken(env) {
  if (
    cachedGoogleToken &&
    cachedGoogleToken.expiresAt > Date.now() + 60000
  ) {
    return cachedGoogleToken.token;
  }

  const account = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);

  if (!account.client_email || !account.private_key) {
    throw new Error("Service Account JSON tidak lengkap.");
  }

  const now = Math.floor(Date.now() / 1000);

  const header = b64url(
    encoder.encode(
      JSON.stringify({ alg: "RS256", typ: "JWT" })
    )
  );

  const claims = b64url(
    encoder.encode(
      JSON.stringify({
        iss: account.client_email,
        scope: "https://www.googleapis.com/auth/datastore",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600
      })
    )
  );

  const unsigned = `${header}.${claims}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(account.private_key),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    encoder.encode(unsigned)
  );

  const assertion =
    `${unsigned}.${b64url(new Uint8Array(signature))}`;

  const response = await fetch(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type:
          "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion
      })
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      `Google OAuth gagal: ${
        result.error_description || result.error || response.status
      }`
    );
  }

  cachedGoogleToken = {
    token: result.access_token,
    expiresAt:
      Date.now() + (result.expires_in || 3600) * 1000
  };

  return cachedGoogleToken.token;
}

async function fsRequest(env, path, options = {}) {
  const token = await googleAccessToken(env);

  const url =
    `https://firestore.googleapis.com/v1/projects/` +
    `${encodeURIComponent(env.FIREBASE_PROJECT_ID)}` +
    `/databases/(default)/documents/${path}`;

  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      authorization: `Bearer ${token}`,
      ...(options.body
        ? { "content-type": "application/json" }
        : {}),
      ...(options.headers || {})
    },
    body: options.body
      ? JSON.stringify(options.body)
      : undefined
  });

  if (response.status === 404) return null;

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = Object.assign(
      new Error(
        body.error?.message ||
        `Firestore request gagal (${response.status})`
      ),
      {
        status: response.status,
        firestoreStatus: body.error?.status || ""
      }
    );

    throw error;
  }

  return body;
}
/** @returns {Promise<any|null>} */
async function getDoc(env, path) {
  const doc = await fsRequest(env, path);
  return doc ? decodeFields(doc.fields || {}) : null;
}

async function getRawDoc(env, path) {
  return await fsRequest(env, path);
}

async function patchDocWithPrecondition(
  env,
  path,
  data,
  updateTime
) {
  const fields = {};

  for (const [key, value] of Object.entries(data)) {
    fields[key] = encodeFirestore(value);
  }

  const query =
    `?currentDocument.updateTime=${encodeURIComponent(updateTime)}`;

  return fsRequest(env, path + query, {
    method: "PATCH",
    body: { fields }
  });
}

function cleanString(value, max = 160) {
  return typeof value === "string"
    ? value.trim().slice(0, max)
    : "";
}

function validQty(value) {
  const n = Number(value);

  return Number.isSafeInteger(n) && n > 0
    ? n
    : 0;
}

function ensureArray(data, key) {
  if (!Array.isArray(data[key])) {
    data[key] = [];
  }
}

function findById(list, id) {
  return list.find(
    row =>
      String(row?.id || "").toUpperCase() ===
      String(id || "").toUpperCase()
  );
}

function itemById(data, id) {
  return data.items.find(
    row =>
      String(row?.id || "").toUpperCase() ===
      String(id || "").toUpperCase()
  );
}

function validateRowId(id) {
  return (
    typeof id === "string" &&
    /^[A-Z0-9._-]{2,64}$/.test(id)
  );
}

function roleAllowed(user, roles) {
  return !!user && roles.includes(user.role);
}

function applyInventoryOperation(data, actor, type, payload) {
  type = ({
    "item.create": "master.create",
    "item.update": "master.update",
    "item.delete": "master.delete"
  })[type] || type;

  const role = actor.role;

  if (!roleAllowed(actor, ["superadmin", "admin", "staff"])) {
    throw new Error("Viewer hanya memiliki akses baca.");
  }

  [
    "items",
    "masuk",
    "keluar",
    "po",
    "sampel",
    "retur"
  ].forEach(k => ensureArray(data, k));

  const p =
    payload && typeof payload === "object"
      ? payload
      : {};

  const id = cleanString(p.id, 64).toUpperCase();

  if (!validateRowId(id)) {
    throw new Error("ID transaksi/barang tidak valid.");
  }

  if (type === "master.create") {
    if (role === "staff") {
      throw new Error("Staff tidak boleh menambah Master Barang.");
    }

    if (itemById(data, id)) {
      throw new Error("ID Barang sudah digunakan.");
    }

    const row =
      p.item && typeof p.item === "object"
        ? p.item
        : p;

    const stok = Number(row.stok ?? 0);
    const min = Number(row.min ?? 0);
    const berat = Number(row.berat ?? 0);

    if (
      ![stok, min, berat].every(Number.isFinite) ||
      stok < 0 ||
      min < 0 ||
      berat < 0
    ) {
      throw new Error(
        "Nilai stok, minimum, atau berat tidak valid."
      );
    }

    data.items.unshift({
      id,
      nama: cleanString(row.nama, 120).toUpperCase(),
      warna: cleanString(row.warna, 80).toUpperCase(),
      jenis: cleanString(row.jenis, 80),
      lebar: cleanString(row.lebar, 40),
      ukuran: cleanString(row.ukuran, 40),
      berat,
      satuan: cleanString(row.satuan, 30),
      min,
      stok
    });

    if (!data.items[0].nama) {
      throw new Error("Nama barang wajib diisi.");
    }

    return;
  }

  if (type === "master.update") {
    if (role === "staff") {
      throw new Error("Staff tidak boleh mengubah Master Barang.");
    }

    const item = itemById(data, id);

    if (!item) {
      throw new Error("Barang tidak ditemukan.");
    }

    const patch =
      p.item && typeof p.item === "object"
        ? p.item
        : p;

    if (
      Object.prototype.hasOwnProperty.call(patch, "stok")
    ) {
      throw new Error(
        "Stok tidak boleh diedit langsung dari Master Barang. " +
        "Gunakan transaksi atau penyesuaian stok khusus."
      );
    }

    for (const key of [
      "nama",
      "warna",
      "jenis",
      "lebar",
      "ukuran",
      "satuan"
    ]) {
      if (patch[key] !== undefined) {
        item[key] = cleanString(
          patch[key],
          key === "nama" ? 120 : 80
        ).toUpperCase();
      }
    }

    for (const key of ["berat", "min"]) {
      if (patch[key] !== undefined) {
        const n = Number(patch[key]);

        if (!Number.isFinite(n) || n < 0) {
          throw new Error(`Nilai ${key} tidak valid.`);
        }

        item[key] = n;
      }
    }

    return;
  }

  if (type === "master.delete") {
    if (role === "staff") {
      throw new Error("Staff tidak boleh menghapus Master Barang.");
    }

    if (
      ["masuk", "keluar", "retur"].some(k =>
        data[k].some(
          r => String(r.barangId || "").toUpperCase() === id
        )
      )
    ) {
      throw new Error(
        "Barang masih memiliki riwayat transaksi; arsipkan, jangan hapus."
      );
    }

    if (
      data.po.some(
        r => String(r.barangId || "").toUpperCase() === id
      )
    ) {
      throw new Error("Barang masih terhubung dengan PO.");
    }

    const before = data.items.length;

    data.items = data.items.filter(
      r => String(r.id).toUpperCase() !== id
    );

    if (data.items.length === before) {
      throw new Error("Barang tidak ditemukan.");
    }

    return;
  }

  // Buat beberapa detail barang dalam satu nomor PO secara atomik.
  if (type === "po.batchCreate") {
    if (role === "viewer") throw new Error("Viewer hanya memiliki akses baca.");
    const noPoCustomer = cleanString(p.noPoCustomer, 100).toUpperCase();
    const tanggal = cleanString(p.tanggal, 20);
    const customer = cleanString(p.customer, 120).toUpperCase();
    const alamat = cleanString(p.alamat, 300);
    const rows = Array.isArray(p.items) ? p.items : [];
    if (!noPoCustomer || !tanggal || !customer || rows.length < 1)
      throw new Error("Nomor PO, tanggal, customer, dan minimal satu barang wajib diisi.");
    const seenIds = new Set();
    const seenItems = new Set();
    const prepared = rows.map((r, index) => {
      const rowId = cleanString(r.id, 64).toUpperCase();
      const barangId = cleanString(r.barangId, 64).toUpperCase();
      const qty = validQty(r.qty);
      const siapKirim = Number(r.siapKirim ?? 0);
      const warna = cleanString(r.warna ?? itemById(data, barangId)?.warna ?? "", 80).toUpperCase();
      if (!validateRowId(rowId) || findById(data.po, rowId) || seenIds.has(rowId))
        throw new Error(`ID detail PO baris ${index + 1} tidak valid atau sudah digunakan.`);
      if (!qty) throw new Error(`Qty PO baris ${index + 1} harus bilangan bulat lebih dari nol.`);
      if (!Number.isSafeInteger(siapKirim) || siapKirim < 0 || siapKirim > qty)
        throw new Error(`Qty siap dikirim baris ${index + 1} harus 0 sampai Qty PO.`);
      if (seenItems.has(barangId)) throw new Error("Barang yang sama tidak boleh dimasukkan dua kali dalam satu PO.");
      const item = itemById(data, barangId);
      if (!item) throw new Error(`Barang ${barangId} tidak ditemukan di Master Barang.`);
      if (siapKirim > Number(item.stok||0)) throw new Error(`Qty siap dikirim ${barangId} melebihi stok tersedia (${Number(item.stok||0)}).`);
      seenIds.add(rowId); seenItems.add(barangId);
      return { id:rowId, noPoCustomer, tanggal, customer, alamat, barangId, nama:item.nama, warna, jenis:item.jenis, lebar:item.lebar||"", ukuran:item.ukuran||"", satuan:item.satuan, qty, siapKirim, terkirim:0, status:"OPEN" };
    });
    data.po.unshift(...prepared);
    return;
  }

  // Atur kuota siap kirim tanpa mengubah stok maupun Qty PO.
  if (type === "po.ready.update") {
    const po = findById(data.po, id);
    if (!po) throw new Error("Detail PO tidak ditemukan.");
    const siapKirim = Number(p.siapKirim);
    const sisa = Math.max(0, Number(po.qty||0) - Number(po.terkirim||0));
    const item = itemById(data, po.barangId);
    if (!Number.isSafeInteger(siapKirim) || siapKirim < 0 || siapKirim > sisa)
      throw new Error(`Qty siap dikirim harus 0 sampai sisa PO (${sisa}).`);
    if (!item || siapKirim > Number(item.stok||0))
      throw new Error(`Qty siap dikirim tidak boleh melebihi stok tersedia (${Number(item?.stok||0)}).`);
    po.siapKirim = siapKirim;
    return;
  }

  // Satu surat jalan dapat memuat beberapa detail barang dari satu PO.
  // Seluruh stok dan saldo Qty Siap Dikirim diperbarui atomik dalam satu operasi.
  if (type === "keluar.batchCreate") {
    const transactionId = id;
    const tanggal = cleanString(p.tanggal, 20);
    const tujuan = cleanString(p.tujuan, 120).toUpperCase();
    const noSj = cleanString(p.noSj, 120);
    const rows = Array.isArray(p.items) ? p.items : [];
    if (!tanggal || !tujuan || rows.length < 1 || rows.length > 30)
      throw new Error("Tanggal, tujuan, dan minimal satu detail barang wajib diisi (maksimal 30 barang)." );
    if (data.keluar.some(r => String(r.transactionId||r.groupId||r.id).toUpperCase() === transactionId))
      throw new Error("ID transaksi/surat jalan sudah digunakan.");
    const seenIds = new Set();
    const seenPo = new Set();
    const prepared = [];
    const stockTotals = new Map();
    let groupKey = null;
    for (let index = 0; index < rows.length; index++) {
      const r = rows[index] || {};
      const detailId = cleanString(r.id, 64).toUpperCase();
      const poRef = cleanString(r.poRef, 64).toUpperCase();
      const barangId = cleanString(r.barangId, 64).toUpperCase();
      const qty = validQty(r.qty);
      const warna = cleanString(r.warna ?? itemById(data, barangId)?.warna ?? "", 80).toUpperCase();
      if (!validateRowId(detailId) || findById(data.keluar, detailId) || seenIds.has(detailId))
        throw new Error(`ID detail Barang Keluar baris ${index+1} tidak valid atau sudah digunakan.`);
      if (!qty) throw new Error(`Qty Barang Keluar baris ${index+1} harus bilangan bulat lebih dari nol.`);
      if (seenPo.has(poRef)) throw new Error("Barang yang sama dari detail PO yang sama tidak boleh diulang dalam satu transaksi.");
      const po = findById(data.po, poRef);
      if (!po) throw new Error(`Detail PO baris ${index+1} tidak ditemukan.`);
      if (String(po.barangId||"").toUpperCase() !== barangId)
        throw new Error(`Barang baris ${index+1} tidak sesuai dengan detail PO.`);
      const item = itemById(data, barangId);
      if (!item) throw new Error(`Barang ${barangId} tidak ditemukan di Master Barang.`);
      const thisGroup = `${String(po.customer||"").toUpperCase()}|${String(po.noPoCustomer||po.id).toUpperCase()}`;
      if (groupKey === null) groupKey = thisGroup;
      if (groupKey !== thisGroup) throw new Error("Semua detail dalam satu surat jalan harus berasal dari nomor PO dan customer yang sama.");
      const remain = Math.max(0, Number(po.qty||0) - Number(po.terkirim||0));
      const ready = Math.max(0, Math.min(remain, Number(po.siapKirim === undefined ? item.stok : po.siapKirim || 0), Number(item.stok||0)));
      if (qty > remain) throw new Error(`${item.nama}: Qty keluar ${qty} melebihi sisa PO ${remain}.`);
      if (qty > ready) throw new Error(`${item.nama}: Qty keluar ${qty} melebihi Qty Siap Dikirim ${ready}.`);
      seenIds.add(detailId); seenPo.add(poRef);
      stockTotals.set(barangId, (stockTotals.get(barangId)||0) + qty);
      prepared.push({ row:{ id:detailId, transactionId, groupId:transactionId, noSj, tanggal, poRef, barangId, nama:item.nama, warna, jenis:item.jenis, lebar:item.lebar||"", ukuran:item.ukuran||"", satuan:item.satuan, qty, tujuan, user:cleanString(p.user,80) }, readyBefore:ready });
    }
    for (const [barangId, totalQty] of stockTotals) {
      const item = itemById(data, barangId);
      if (!item || Number(item.stok||0) < totalQty)
        throw new Error(`Stok ${barangId} tidak mencukupi untuk total pengiriman ${totalQty}.`);
    }
    // Semua validasi selesai; baru mutasikan data.
    for (const entry of prepared) {
      const row = entry.row;
      const item = itemById(data, row.barangId);
      const po = findById(data.po, row.poRef);
      item.stok = Number(item.stok||0) - row.qty;
      po.terkirim = Number(po.terkirim||0) + row.qty;
      // Kurangi saldo kesiapan yang benar-benar divalidasi sebelum stok dipotong.
      po.siapKirim = Math.max(0, entry.readyBefore - row.qty);
      po.status = po.terkirim >= Number(po.qty||0) ? "CLOSED" : (po.terkirim > 0 ? "PARTIAL" : "OPEN");
    }
    data.keluar.unshift(...prepared.map(entry => entry.row));
    return;
  }

  const configs = {
    "masuk.create": { key: "masuk", direction: 1 },
    "masuk.delete": { key: "masuk", direction: -1 },
    "keluar.create": { key: "keluar", direction: -1 },
    "keluar.delete": { key: "keluar", direction: 1 },
    "retur.create": { key: "retur", direction: 1 },
    "retur.delete": { key: "retur", direction: -1 },
    "sampel.create": { key: "sampel", direction: 0 },
    "sampel.delete": { key: "sampel", direction: 0 },
    "po.create": { key: "po", direction: 0 },
    "po.delete": { key: "po", direction: 0 },
    "masuk.update": { key: "masuk", direction: 1 },
    "keluar.update": { key: "keluar", direction: -1 },
    "retur.update": { key: "retur", direction: 1 },
    "sampel.update": { key: "sampel", direction: 0 },
    "po.update": { key: "po", direction: 0 }
  };

  const cfg = configs[type];

  if (!cfg) {
    throw new Error("Jenis operasi tidak didukung.");
  }

  const list = data[cfg.key];

  // UPDATE: seluruh koreksi transaksi dilakukan atomik di Worker.
  if (type.endsWith(".update")) {
    const index = list.findIndex(r => String(r?.id || "").toUpperCase() === id);
    if (index < 0) throw new Error("Data yang akan diedit tidak ditemukan.");
    const oldRow = list[index];
    const incoming = p.record && typeof p.record === "object" ? p.record : {};
    const nextRow = { ...oldRow, ...incoming, id };
    const setPoStatus = po => {
      const sent = Number(po.terkirim || 0);
      po.status = sent >= Number(po.qty || 0) ? "CLOSED" : (sent > 0 ? "PARTIAL" : "OPEN");
    };
    const getItem = barangId => {
      const item = itemById(data, barangId);
      if (!item) throw new Error("Barang transaksi tidak ditemukan.");
      return item;
    };
    const getPo = poRef => {
      if (!poRef) return null;
      const po = findById(data.po, poRef);
      if (!po) throw new Error("PO referensi tidak ditemukan.");
      return po;
    };

    if (cfg.key === "po") {
      const qty = validQty(nextRow.qty);
      if (!qty) throw new Error("Qty PO harus bilangan bulat lebih dari nol.");
      if (!itemById(data, nextRow.barangId)) throw new Error("Barang PO tidak ditemukan.");
      const delivered = Number(oldRow.terkirim || 0);
      if (qty < delivered) throw new Error("Qty PO tidak boleh lebih kecil dari jumlah yang sudah terkirim.");
      if (String(nextRow.barangId) !== String(oldRow.barangId) && delivered > 0)
        throw new Error("Barang PO tidak boleh diganti karena sudah memiliki pengiriman.");
      nextRow.qty = qty;
      nextRow.terkirim = delivered;
      if (nextRow.siapKirim !== undefined && Number(nextRow.siapKirim) > qty - delivered)
        throw new Error("Qty siap dikirim tidak boleh melebihi sisa PO.");
      const poItem = itemById(data, nextRow.barangId);
      if (nextRow.siapKirim !== undefined && Number(nextRow.siapKirim) > Number(poItem?.stok||0))
        throw new Error(`Qty siap dikirim tidak boleh melebihi stok tersedia (${Number(poItem?.stok||0)}).`);
      setPoStatus(nextRow);
    } else if (cfg.key === "masuk") {
      const oldQty = validQty(oldRow.qty), newQty = validQty(nextRow.qty);
      if (!oldQty || !newQty) throw new Error("Qty harus bilangan bulat lebih dari nol.");
      const oldItem = getItem(oldRow.barangId), newItem = getItem(nextRow.barangId);
      if (oldItem === newItem) {
        const stock = Number(oldItem.stok || 0) + newQty - oldQty;
        if (stock < 0) throw new Error("Koreksi menyebabkan stok negatif.");
        oldItem.stok = stock;
      } else {
        const oldStock = Number(oldItem.stok || 0) - oldQty;
        if (oldStock < 0) throw new Error("Stok barang lama tidak cukup untuk mengoreksi transaksi.");
        oldItem.stok = oldStock;
        newItem.stok = Number(newItem.stok || 0) + newQty;
      }
      Object.assign(nextRow, { nama:newItem.nama, jenis:newItem.jenis, lebar:newItem.lebar||"", ukuran:newItem.ukuran||"", satuan:newItem.satuan, qty:newQty });
    } else if (cfg.key === "keluar") {
      const oldQty = validQty(oldRow.qty), newQty = validQty(nextRow.qty);
      if (!oldQty || !newQty) throw new Error("Qty harus bilangan bulat lebih dari nol.");
      const linkedReturns = data.retur.filter(r => String(r.keluarRef || "") === id);
      const returnedQty = linkedReturns.reduce((sum,r) => sum + (Number(r.qty)||0), 0);
      if (newQty < returnedQty) throw new Error(`Qty keluar tidak boleh lebih kecil dari total retur (${returnedQty}).`);
      if (linkedReturns.length && (String(nextRow.barangId) !== String(oldRow.barangId) || String(nextRow.poRef||"") !== String(oldRow.poRef||"")))
        throw new Error("Barang/PO tidak dapat diganti karena transaksi ini sudah memiliki retur.");
      const oldItem = getItem(oldRow.barangId), newItem = getItem(nextRow.barangId);
      const oldPo = getPo(oldRow.poRef), newPo = getPo(nextRow.poRef);
      oldItem.stok = Number(oldItem.stok||0) + oldQty;
      if (oldPo) {
        oldPo.terkirim = Math.max(0, Number(oldPo.terkirim||0) - oldQty);
        const oldRemainAfterReverse = Math.max(0, Number(oldPo.qty||0) - Number(oldPo.terkirim||0));
        const oldReadyBefore = oldPo.siapKirim === undefined
          ? Math.min(oldRemainAfterReverse, Number(oldItem.stok||0))
          : Number(oldPo.siapKirim||0) + oldQty;
        oldPo.siapKirim = Math.max(0, Math.min(oldRemainAfterReverse, Number(oldItem.stok||0), oldReadyBefore));
        setPoStatus(oldPo);
      }
      if (Number(newItem.stok||0) < newQty) throw new Error("Stok barang tidak mencukupi untuk perubahan transaksi keluar.");
      if (newPo && String(newPo.barangId) !== String(nextRow.barangId)) throw new Error("Barang tidak sesuai dengan PO.");
      if (newPo && Number(newPo.terkirim||0) + newQty > Number(newPo.qty||0)) throw new Error("Qty keluar melebihi sisa PO.");
      if (newPo) {
        const newRemain = Math.max(0, Number(newPo.qty||0) - Number(newPo.terkirim||0));
        const ready = Math.max(0, Math.min(newRemain, Number(newPo.siapKirim === undefined ? newItem.stok : newPo.siapKirim||0), Number(newItem.stok||0)));
        if (newQty > ready) throw new Error(`Qty keluar melebihi Qty Siap Dikirim (${ready}).`);
        newPo.siapKirim = ready - newQty;
      }
      newItem.stok = Number(newItem.stok||0) - newQty;
      if (newPo) { newPo.terkirim = Number(newPo.terkirim||0) + newQty; setPoStatus(newPo); }
      Object.assign(nextRow, { nama:newItem.nama, jenis:newItem.jenis, lebar:newItem.lebar||"", ukuran:newItem.ukuran||"", satuan:newItem.satuan, qty:newQty });
    } else if (cfg.key === "retur") {
      const oldQty = validQty(oldRow.qty), newQty = validQty(nextRow.qty);
      if (!oldQty || !newQty) throw new Error("Qty retur harus bilangan bulat lebih dari nol.");
      const oldOut = findById(data.keluar, oldRow.keluarRef), newOut = findById(data.keluar, nextRow.keluarRef);
      if (!newOut) throw new Error("Referensi Barang Keluar tidak ditemukan.");
      const otherReturned = data.retur.filter((r,idx) => idx !== index && String(r.keluarRef||"") === String(nextRow.keluarRef||"")).reduce((sum,r)=>sum+(Number(r.qty)||0),0);
      if (otherReturned + newQty > Number(newOut.qty||0)) throw new Error("Total retur melebihi Qty Barang Keluar.");
      if (String(newOut.barangId) !== String(nextRow.barangId)) throw new Error("Barang retur tidak sesuai dengan transaksi keluar asal.");
      const oldItem = getItem(oldRow.barangId), newItem = getItem(nextRow.barangId);
      const oldPo = getPo(oldRow.poRef || oldOut?.poRef), newPo = getPo(newOut.poRef);
      oldItem.stok = Number(oldItem.stok||0) - oldQty;
      if (oldItem.stok < 0) throw new Error("Stok tidak cukup untuk membalik retur lama.");
      if (oldPo) { oldPo.terkirim = Number(oldPo.terkirim||0) + oldQty; setPoStatus(oldPo); }
      newItem.stok = Number(newItem.stok||0) + newQty;
      if (newPo) { newPo.terkirim = Math.max(0, Number(newPo.terkirim||0) - newQty); setPoStatus(newPo); }
      Object.assign(nextRow, { nama:newItem.nama, jenis:newItem.jenis, lebar:newItem.lebar||"", ukuran:newItem.ukuran||"", satuan:newItem.satuan, qty:newQty, poRef:newOut.poRef||"" });
    } else if (cfg.key === "sampel") {
      if (!String(nextRow.nama||"").trim()) throw new Error("Nama sampel wajib diisi.");
    }
    list[index] = nextRow;
    return;
  }

  if (type.endsWith(".create")) {
    if (findById(list, id)) {
      throw new Error("ID sudah digunakan.");
    }

    const row =
      p.record && typeof p.record === "object"
        ? { ...p.record, id }
        : { ...p, id };

    if (
      cfg.key === "masuk" ||
      cfg.key === "keluar" ||
      cfg.key === "retur"
    ) {
      const qty = validQty(row.qty);

      if (!qty) {
        throw new Error(
          "Qty harus bilangan bulat lebih dari nol."
        );
      }

      const item = itemById(data, row.barangId);

      if (!item) {
        throw new Error("Barang tidak ditemukan.");
      }

      if (
        cfg.direction < 0 &&
        Number(item.stok || 0) < qty
      ) {
        throw new Error("Stok tidak mencukupi.");
      }

      item.stok =
        Number(item.stok || 0) + cfg.direction * qty;

      row.nama = row.nama || item.nama;
      row.jenis = row.jenis || item.jenis;
      row.lebar = row.lebar || item.lebar || "";
      row.ukuran = row.ukuran || item.ukuran || "";
      row.satuan = row.satuan || item.satuan;

      if (cfg.key === "keluar" && row.poRef) {
        const po = findById(data.po, row.poRef);

        if (!po) {
          throw new Error("PO referensi tidak ditemukan.");
        }

        if (
          String(po.barangId).toUpperCase() !==
          String(row.barangId).toUpperCase()
        ) {
          throw new Error("Barang tidak sesuai dengan PO.");
        }

        const next = Number(po.terkirim || 0) + qty;

        if (next > Number(po.qty || 0)) {
          throw new Error("Qty keluar melebihi sisa PO.");
        }
        const ready = Math.max(0, Math.min(Number(po.qty||0) - Number(po.terkirim||0), Number(po.siapKirim === undefined ? item.stok : po.siapKirim||0), Number(item.stok||0)));
        if (qty > ready) throw new Error(`Qty keluar melebihi Qty Siap Dikirim (${ready}).`);
        po.siapKirim = ready - qty;

        po.terkirim = next;
        po.status =
          next >= Number(po.qty)
            ? "CLOSED"
            : "PARTIAL";
      }

      if (cfg.key === "retur") {
        const outbound = findById(data.keluar, row.keluarRef);
        if (!outbound) throw new Error("Referensi Barang Keluar untuk retur tidak ditemukan.");
        if (String(outbound.barangId) !== String(row.barangId)) throw new Error("Barang retur tidak sesuai dengan transaksi keluar asal.");
        const already = data.retur.filter(r => String(r.keluarRef || "") === String(row.keluarRef || "")).reduce((sum,r) => sum + (Number(r.qty)||0), 0);
        if (already + qty > Number(outbound.qty || 0)) throw new Error("Total retur melebihi Qty Barang Keluar.");
        const po = findById(data.po, row.poRef || outbound.poRef);
        if (po) {
          po.terkirim = Math.max(0, Number(po.terkirim || 0) - qty);
          po.status = po.terkirim >= Number(po.qty || 0) ? "CLOSED" : (po.terkirim > 0 ? "PARTIAL" : "OPEN");
          row.poRef = po.id;
        }
      }
    }

    if (cfg.key === "po") {
      const qty = validQty(row.qty);

      if (!qty) {
        throw new Error("Qty PO harus lebih dari nol.");
      }

      if (!itemById(data, row.barangId)) {
        throw new Error("Barang PO tidak ditemukan.");
      }

      row.qty = qty;
      row.siapKirim = Number.isSafeInteger(Number(row.siapKirim)) && Number(row.siapKirim) >= 0 ? Math.min(Number(row.siapKirim), qty) : 0;
      row.terkirim = 0;
      row.status = "OPEN";
    }

    if (cfg.key === "sampel" && !row.nama) {
      throw new Error("Nama sampel wajib diisi.");
    }

    list.unshift(row);
    return;
  }

  const index = list.findIndex(
    r => String(r?.id || "").toUpperCase() === id
  );

  if (index < 0) {
    throw new Error("Data yang akan dihapus tidak ditemukan.");
  }

  const row = list[index];

  if (
    cfg.direction !== 0 &&
    ["masuk", "keluar", "retur"].includes(cfg.key)
  ) {
    const qty = validQty(row.qty);
    const item = itemById(data, row.barangId);

    if (!item) {
      throw new Error(
        "Master barang terkait tidak ditemukan; transaksi tidak dihapus."
      );
    }

    if (
      cfg.direction < 0 &&
      Number(item.stok || 0) < qty
    ) {
      throw new Error(
        "Stok tidak cukup untuk membalik transaksi."
      );
    }

    item.stok =
      Number(item.stok || 0) + cfg.direction * qty;

    if (cfg.key === "keluar" && row.poRef) {
      const po = findById(data.po, row.poRef);

      if (po) {
        po.terkirim = Math.max(
          0,
          Number(po.terkirim || 0) - qty
        );
        const remainingAfterDelete = Math.max(0, Number(po.qty||0) - Number(po.terkirim||0));
        const readyAfterDelete = po.siapKirim === undefined
          ? remainingAfterDelete
          : Number(po.siapKirim||0) + qty;
        po.siapKirim = Math.max(0, Math.min(remainingAfterDelete, Number(item.stok||0), readyAfterDelete));

        po.status =
          po.terkirim > 0
            ? "PARTIAL"
            : "OPEN";
      }
    }

    if (cfg.key === "retur") {
      const outbound = findById(data.keluar, row.keluarRef);
      const po = findById(data.po, row.poRef || outbound?.poRef);
      if (po) {
        po.terkirim = Number(po.terkirim || 0) + qty;
        po.status = po.terkirim >= Number(po.qty || 0) ? "CLOSED" : (po.terkirim > 0 ? "PARTIAL" : "OPEN");
      }
    }
  }

  if (
    cfg.key === "po" &&
    data.keluar.some(k => k.poRef === id)
  ) {
    throw new Error(
      "PO masih memiliki transaksi Barang Keluar."
    );
  }

  list.splice(index, 1);
}
async function putDoc(env, path, data, createOnly = false) {
  const query = createOnly
    ? "?currentDocument.exists=false"
    : "";

  const fields = {};

  for (const [key, value] of Object.entries(data)) {
    fields[key] = encodeFirestore(value);
  }

  return fsRequest(env, path + query, {
    method: "PATCH",
    body: { fields }
  });
}

async function deleteDoc(env, path) {
  const token = await googleAccessToken(env);

  const url =
    `https://firestore.googleapis.com/v1/projects/` +
    `${encodeURIComponent(env.FIREBASE_PROJECT_ID)}` +
    `/databases/(default)/documents/${path}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  if (response.status === 404) return;

  if (!response.ok) {
    throw new Error(
      `Gagal menghapus dokumen (${response.status}).`
    );
  }
}

function validUsername(value) {
  return (
    typeof value === "string" &&
    /^[a-z0-9._-]{3,32}$/.test(value)
  );
}

async function hashPassword(
  password,
  salt = randomToken(16),
  options = {}
) {
  const allowLegacyLength = options.allowLegacyLength === true;
  const iterations = Number(options.iterations) > 0 ? Math.floor(options.iterations) : PBKDF2_ITERATIONS;
  const minimumLength = allowLegacyLength ? 1 : 10;

  if (
    typeof password !== "string" ||
    password.length < minimumLength ||
    password.length > 128
  ) {
    throw new Error(
      allowLegacyLength
        ? "Password akun lama tidak valid."
        : "Password harus 10–128 karakter."
    );
  }

  const material = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: fromB64url(salt),
      iterations,
      hash: "SHA-256"
    },
    material,
    256
  );

  return {
    salt,
    passwordHash: b64url(new Uint8Array(bits)),
    iterations
  };
}

async function verifyPassword(password, record) {
  if (
    typeof password !== "string" ||
    password.length < 1 ||
    password.length > 128
  ) {
    return false;
  }

  const iterations = Number(record?.iterations) > 0 ? Math.floor(record.iterations) : LEGACY_PBKDF2_ITERATIONS;
  const result = await hashPassword(
    password,
    record.salt,
    {
      allowLegacyLength: record.migratedFromLegacy === true,
      iterations
    }
  );

  const a = encoder.encode(result.passwordHash);
  const b = encoder.encode(String(record.passwordHash || ""));

  if (a.length !== b.length) return false;

  let diff = 0;

  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }

  return diff === 0;
}

function bearer(request) {
  const value =
    request.headers.get("authorization") || "";

  return value.startsWith("Bearer ")
    ? value.slice(7).trim()
    : "";
}

async function createSession(env, user) {
  const token = randomToken(32);
  const id = await sha256Hex(token);
  const now = Math.floor(Date.now() / 1000);

  await putDoc(
    env,
    `${SESSION_COLLECTION}/${id}`,
    {
      username: user.username,
      sessionVersion: Number(user.sessionVersion || 0),
      createdAt: now,
      expiresAt: now + SESSION_TTL_SECONDS
    }
  );

  return token;
}

async function authenticate(request, env) {
  const token = bearer(request);

  if (!token) return null;

  const id = await sha256Hex(token);

  const session = await getDoc(
    env,
    `${SESSION_COLLECTION}/${id}`
  );

  if (
    !session ||
    session.expiresAt < Math.floor(Date.now() / 1000)
  ) {
    return null;
  }

  const user = await getDoc(
    env,
    `${USER_COLLECTION}/${session.username}`
  );

  if (!user || user.disabled) return null;
  if (Number(session.sessionVersion || 0) !== Number(user.sessionVersion || 0)) return null;

  return {
    ...user,
    username: session.username,
    sessionId: id
  };
}

function normalizeUiPreference(value) {
  return value === "crystal" ? "crystal" : "classic";
}

function publicUser(user) {
  return {
    username: user.username,
    name: user.name,
    role: user.role,
    status: user.disabled ? "DISABLED" : "ACTIVE",
    uiPreference: normalizeUiPreference(user.uiPreference)
  };
}

// Histori cetak/Excel Surat Jalan lintas perangkat.
function normalizeSjAuditCounts(value) {
  const src = value && typeof value === "object" ? value : {};
  const result = {};

  for (const field of SJ_AUDIT_FIELDS) {
    const n = Number(src[field]);
    result[field] = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }

  const total = Number(src.count);
  const updated = Number(src.updatedAt);

  result.count = Number.isFinite(total) && total > 0 ? Math.floor(total) : 0;
  result.updatedAt = Number.isFinite(updated) ? updated : 0;

  return result;
}

function maxSjAuditCounts(a, b) {
  const result = normalizeSjAuditCounts(a);
  const other = normalizeSjAuditCounts(b);

  for (const field of SJ_AUDIT_FIELDS) {
    result[field] = Math.max(result[field], other[field]);
  }

  result.count = Math.max(result.count, other.count);
  result.updatedAt = Math.max(result.updatedAt, other.updatedAt);

  return result;
}

async function sjAuditDocPath(tid) {
  return `${SJ_AUDIT_COLLECTION}/${await sha256Hex(String(tid))}`;
}

function publicSjAudit(doc) {
  return { ...normalizeSjAuditCounts(doc), tid: doc?.tid || "" };
}

async function bodyJson(request) {
  const contentLength = Number(
    request.headers.get("content-length") || 0
  );

  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_BODY_BYTES
  ) {
    throw new Error("Ukuran request terlalu besar.");
  }

  const raw = await request.text();

  if (encoder.encode(raw).length > MAX_BODY_BYTES) {
    throw new Error("Ukuran request terlalu besar.");
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Body harus berupa JSON valid.");
  }
}

function timingSafeEqualString(a, b) {
  const aa = encoder.encode(String(a || ""));
  const bb = encoder.encode(String(b || ""));
  if (aa.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}

function clientIp(request) {
  return cleanString(
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    "unknown",
    80
  );
}

async function checkLoginRateLimit(request, env, username) {
  const now = Math.floor(Date.now() / 1000);
  const ip = clientIp(request);
  const key = await sha256Hex(`login:${ip}:${String(username || "").toLowerCase()}`);
  const path = `artifacts/gudang-pro-cloud-system/private/rate_limits/login/${key}`;
  try {
    const raw = await getRawDoc(env, path);
    const current = raw ? decodeFields(raw.fields || {}) : null;
    const windowStart = Number(current?.windowStart || 0);
    const count = Number(current?.count || 0);
    const active = windowStart > 0 && (now - windowStart) < LOGIN_RATE_LIMIT_WINDOW_SECONDS;
    const nextCount = active ? count + 1 : 1;
    const nextWindowStart = active ? windowStart : now;
    const record = { ip, username: String(username || "").toLowerCase(), count: nextCount, windowStart: nextWindowStart, expiresAt: nextWindowStart + LOGIN_RATE_LIMIT_WINDOW_SECONDS };
    if (raw) await patchDocWithPrecondition(env, path, record, raw.updateTime);
    else await putDoc(env, path, record, true);
    const limited = nextCount > LOGIN_RATE_LIMIT_MAX_ATTEMPTS;
    const retryAfter = Math.max(1, nextWindowStart + LOGIN_RATE_LIMIT_WINDOW_SECONDS - now);
    return { limited, retryAfter, unavailable: false };
  } catch (e) {
    console.error("Rate limit store error:", e);
    return { limited: false, retryAfter: LOGIN_RATE_LIMIT_WINDOW_SECONDS, unavailable: true };
  }
}

function corsHeaders(request, env) {
  const origin = request.headers.get("origin") || "";
  const allowed = String(env.ALLOWED_ORIGIN || "https://danurafa.github.io").trim();
  const allowList = allowed.split(",").map(s => s.trim()).filter(Boolean);
  const allowOrigin = allowList.includes(origin) ? origin : (allowList[0] || "https://danurafa.github.io");

  return {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
    "access-control-allow-headers": "Content-Type,Authorization,X-Setup-Secret",
    "access-control-max-age": "86400",
    "vary": "Origin"
  };
}

async function handleSetupMigration(request, env, cors) {
  if (!timingSafeEqualString(request.headers.get("x-setup-secret") || "", env.SETUP_SECRET || "")) {
    return json(
      { error: "Setup secret tidak valid." },
      401,
      cors
    );
  }

  const superadmin = await getDoc(
    env,
    `${USER_COLLECTION}/superadmin`
  );

  if (
    !superadmin ||
    superadmin.role !== "superadmin"
  ) {
    return json(
      {
        error:
          "Buat Super Admin terlebih dahulu sebelum migrasi akun lama."
      },
      409,
      cors
    );
  }

  const marker = await getDoc(
    env,
    MIGRATION_MARKER_PATH
  );

  if (marker) {
    return json(
      {
        error: "Migrasi akun lama sudah pernah diselesaikan.",
        migrated: marker.migrated || 0,
        skipped: marker.skipped || 0
      },
      409,
      cors
    );
  }

  const legacyData = await getDoc(env, DATA_PATH);

  if (
    !legacyData ||
    !Array.isArray(legacyData.users)
  ) {
    return json(
      {
        error:
          "Daftar akun lama tidak ditemukan di dokumen inventory."
      },
      404,
      cors
    );
  }

  let migrated = 0;
  let skipped = 0;
  const problems = [];

  for (const legacy of legacyData.users) {
    const username = String(
      legacy?.username || ""
    ).trim().toLowerCase();

    const role = String(
      legacy?.role || ""
    ).trim().toLowerCase();

    const password =
      typeof legacy?.pass === "string"
        ? legacy.pass
        : typeof legacy?.password === "string"
          ? legacy.password
          : "";

    if (
      !validUsername(username) ||
      !["admin", "staff", "viewer"].includes(role) ||
      !password ||
      password.length > 128
    ) {
      problems.push(username || "akun tanpa username");
      continue;
    }

    const existing = await getDoc(
      env,
      `${USER_COLLECTION}/${username}`
    );

    if (existing) {
      skipped++;
      continue;
    }

    const credentials = await hashPassword(
      password,
      randomToken(16),
      true
    );

    const record = {
      ...credentials,
      name: String(
        legacy.name || username
      ).trim().slice(0, 80),
      role,
      disabled: false,
      uiPreference: "classic",
      migratedFromLegacy: true,
      createdAt: Math.floor(Date.now() / 1000)
    };

    await putDoc(
      env,
      `${USER_COLLECTION}/${username}`,
      record,
      true
    );

    migrated++;
  }

  if (problems.length) {
    return json(
      {
        error:
          "Sebagian akun lama tidak dapat dimigrasikan. " +
          "Data lama tetap dipertahankan.",
        migrated,
        skipped,
        invalidUsernames: problems
      },
      422,
      cors
    );
  }

  await putDoc(
    env,
    MIGRATION_MARKER_PATH,
    {
      completedAt: Math.floor(Date.now() / 1000),
      migrated,
      skipped,
      source: DATA_PATH
    },
    true
  );

  return json(
    {
      ok: true,
      migrated,
      skipped,
      note:
        "Akun lama disalin. Data users lama tidak dihapus."
    },
    200,
    cors
  );
}
export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: cors
      });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    // Health tidak membutuhkan koneksi Firebase.
    if (path === "/health" && request.method === "GET") {
      return json(
        {
          ok: true,
          service: "inventory-backend"
        },
        200,
        cors
      );
    }

    try {
      if (
        !env.FIREBASE_SERVICE_ACCOUNT ||
        !env.FIREBASE_PROJECT_ID ||
        !env.SETUP_SECRET
      ) {
        return json(
          {
            error:
              "Konfigurasi Worker belum lengkap. Periksa FIREBASE_SERVICE_ACCOUNT, FIREBASE_PROJECT_ID, dan SETUP_SECRET."
          },
          503,
          cors
        );
      }

      if (
        path === "/api/setup/status" &&
        request.method === "GET"
      ) {
        const exists = !!(
          await getDoc(
            env,
            `${USER_COLLECTION}/superadmin`
          )
        );

        return json(
          { setupRequired: !exists },
          200,
          cors
        );
      }

      if (
        path === "/api/setup/superadmin" &&
        request.method === "POST"
      ) {
        if (!timingSafeEqualString(request.headers.get("x-setup-secret") || "", env.SETUP_SECRET || "")) {
          return json(
            { error: "Setup secret tidak valid." },
            401,
            cors
          );
        }

        const body = await bodyJson(request);

        if (
          body.username &&
          body.username !== "superadmin"
        ) {
          return json(
            {
              error:
                "Username Super Admin harus superadmin."
            },
            400,
            cors
          );
        }

        const name = String(
          body.name || "Super Administrator"
        ).trim().slice(0, 80);

        const credentials = await hashPassword(
          body.password
        );

        try {
          await putDoc(
            env,
            `${USER_COLLECTION}/superadmin`,
            {
              ...credentials,
              name,
              role: "superadmin",
              disabled: false,
              uiPreference: "classic",
              sessionVersion: 0,
              createdAt: Math.floor(Date.now() / 1000)
            },
            true
          );
        } catch (error) {
          if (
            error.status === 409 ||
            /already exists|ALREADY_EXISTS/i.test(
              error.message
            )
          ) {
            return json(
              {
                error:
                  "Super Admin sudah pernah dibuat. Setup hanya dapat dilakukan satu kali."
              },
              409,
              cors
            );
          }

          throw error;
        }

        return json(
          {
            ok: true,
            user: {
              username: "superadmin",
              name,
              role: "superadmin"
            }
          },
          201,
          cors
        );
      }

      if (
        path === "/api/setup/migrate-legacy-users" &&
        request.method === "POST"
      ) {
        return await handleSetupMigration(
          request,
          env,
          cors
        );
      }

      // LOGIN
      if (
        path === "/api/login" &&
        request.method === "POST"
      ) {
        const body = await bodyJson(request);

        const username = String(
          body.username || ""
        ).trim().toLowerCase();

        if (!validUsername(username)) {
          return json(
            { error: "Username atau password salah." },
            401,
            cors
          );
        }

        const rate = await checkLoginRateLimit(request, env, username);
        if (rate.unavailable) {
          return json(
            { error: "Layanan verifikasi login sedang gangguan sementara. Coba lagi sebentar." },
            503,
            { ...cors, "retry-after": String(rate.retryAfter) }
          );
        }
        if (rate.limited) {
          return json(
            { error: `Terlalu banyak percobaan login. Coba lagi dalam ${Math.ceil(rate.retryAfter / 60)} menit.` },
            429,
            { ...cors, "retry-after": String(rate.retryAfter) }
          );
        }

        const user = await getDoc(
          env,
          `${USER_COLLECTION}/${username}`
        );

        const okPassword = !!(
          user &&
          !user.disabled &&
          await verifyPassword(
            String(body.password || ""),
            user
          )
        );

        if (!okPassword) {
          return json(
            { error: "Username atau password salah." },
            401,
            cors
          );
        }

        // Upgrade hash lama ke iterasi baru secara transparan saat login sukses.
        const needsRehash = Number(user.iterations || 0) < PBKDF2_ITERATIONS;
        if (needsRehash) {
          try {
            const creds = await hashPassword(String(body.password || ""));
            const rawUser = await getRawDoc(env, `${USER_COLLECTION}/${username}`);
            if (rawUser) {
              const latest = decodeFields(rawUser.fields || {});
              await patchDocWithPrecondition(env, `${USER_COLLECTION}/${username}`, {
                ...latest,
                salt: creds.salt,
                passwordHash: creds.passwordHash,
                iterations: creds.iterations,
                migratedFromLegacy: false
              }, rawUser.updateTime);
              Object.assign(user, creds, { migratedFromLegacy: false });
            }
          } catch (e) {
            console.error("Password rehash failed:", e);
          }
        }

        const token = await createSession(
          env,
          { ...user, username }
        );

        return json(
          {
            ok: true,
            token,
            user: publicUser({
              ...user,
              username
            })
          },
          200,
          cors
        );
      }

      // LOGOUT
      if (
        path === "/api/logout" &&
        request.method === "POST"
      ) {
        const user = await authenticate(request, env);

        if (user) {
          await deleteDoc(
            env,
            `${SESSION_COLLECTION}/${user.sessionId}`
          );
        }

        return json({ ok: true }, 200, cors);
      }

      // VERIFY PASSWORD - no new token issued; used for sensitive UI re-auth.
      if (
        path === "/api/auth/verify-password" &&
        request.method === "POST"
      ) {
        const user = await authenticate(request, env);
        if (!user) {
          return json({ error: "Sesi tidak valid atau sudah berakhir." }, 401, cors);
        }
        const body = await bodyJson(request);
        const password = String(body.password || "");
        const ok = await verifyPassword(password, user);
        if (!ok) {
          return json({ ok: false, error: "Password salah." }, 401, cors);
        }
        return json({ ok: true }, 200, cors);
      }

      // ADMIN: revoke all sessions by bumping sessionVersion for all users.
      if (
        path === "/api/admin/revoke-all-sessions" &&
        request.method === "POST"
      ) {
        const actor = await authenticate(request, env);
        if (!roleAllowed(actor, ["superadmin"])) {
          return json({ error: "Hanya Super Admin yang dapat revoke semua sesi." }, actor ? 403 : 401, cors);
        }
        if (!timingSafeEqualString(request.headers.get("x-setup-secret") || "", env.SETUP_SECRET || "")) {
          return json({ error: "Setup secret tidak valid." }, 401, cors);
        }
        const token = await googleAccessToken(env);
        const baseUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(env.FIREBASE_PROJECT_ID)}/databases/(default)/documents/${USER_COLLECTION}`;
        let bumped = 0;
        let pageToken = "";
        while (true) {
          const listUrl = new URL(baseUrl);
          listUrl.searchParams.set("pageSize", "200");
          if (pageToken) listUrl.searchParams.set("pageToken", pageToken);
          const resp = await fetch(listUrl.toString(), { headers: { authorization: `Bearer ${token}` } });
          const result = await resp.json();
          if (!resp.ok) throw new Error(result.error?.message || "Gagal membaca user.");
          for (const doc of (result.documents || [])) {
            const username = doc.name.split("/").pop();
            const user = decodeFields(doc.fields || {});
            await patchDocWithPrecondition(env, `${USER_COLLECTION}/${username}`, {
              ...user,
              sessionVersion: Number(user.sessionVersion || 0) + 1
            }, doc.updateTime);
            bumped++;
          }
          pageToken = String(result.nextPageToken || "");
          if (!pageToken) break;
        }
        return json({ ok: true, bumped }, 200, cors);
      }

      // CURRENT USER
      if (
        path === "/api/me" &&
        request.method === "GET"
      ) {
        const user = await authenticate(request, env);

        if (!user) {
          return json(
            {
              error:
                "Sesi tidak valid atau sudah berakhir."
            },
            401,
            cors
          );
        }

        return json(
          { user: publicUser(user) },
          200,
          cors
        );
      }

      // SAVE UI PREFERENCE - CURRENT USER ONLY
      if (
        path === "/api/me/ui-preference" &&
        request.method === "PUT"
      ) {
        const user = await authenticate(request, env);

        if (!user) {
          return json(
            { error: "Sesi tidak valid atau sudah berakhir." },
            401,
            cors
          );
        }

        const body = await bodyJson(request);
        const uiPreference = body?.uiPreference;

        if (!["classic", "crystal"].includes(uiPreference)) {
          return json(
            { error: "Pilihan UI tidak valid. Gunakan classic atau crystal." },
            400,
            cors
          );
        }

        const userPath = `${USER_COLLECTION}/${user.username}`;
        const rawUser = await getRawDoc(env, userPath);

        if (!rawUser) {
          return json(
            { error: "Akun pengguna tidak ditemukan." },
            404,
            cors
          );
        }

        const latestUser = decodeFields(rawUser.fields || {});
        latestUser.uiPreference = uiPreference;

        try {
          await patchDocWithPrecondition(
            env,
            userPath,
            latestUser,
            rawUser.updateTime
          );
        } catch (writeError) {
          if (writeError.status === 409 || writeError.status === 412) {
            return json(
              { error: "Profil akun berubah bersamaan. Silakan coba simpan lagi." },
              409,
              cors
            );
          }
          throw writeError;
        }

        return json(
          { ok: true, user: publicUser({ ...latestUser, username: user.username }) },
          200,
          cors
        );
      }

      // READ SURAT JALAN AUDIT (bisa dibaca semua akun yang login, termasuk viewer)
      if (
        path === "/api/sj/audit" &&
        request.method === "GET"
      ) {
        const user = await authenticate(request, env);

        if (!user) {
          return json(
            { error: "Sesi tidak valid atau sudah berakhir." },
            401,
            cors
          );
        }

        const tid = cleanString(url.searchParams.get("tid"), 200);

        if (!tid) {
          return json({ error: "tid wajib diisi." }, 400, cors);
        }

        const doc = await getDoc(env, await sjAuditDocPath(tid));

        return json(
          { audit: doc ? publicSjAudit(doc) : null },
          200,
          cors
        );
      }

      // WRITE SURAT JALAN AUDIT - increment counter per aksi, idempotent via eventId.
      if (
        path === "/api/sj/audit" &&
        request.method === "POST"
      ) {
        const actor = await authenticate(request, env);

        if (!actor) {
          return json(
            { error: "Sesi tidak valid atau sudah berakhir." },
            401,
            cors
          );
        }
        if (!roleAllowed(actor, ["superadmin", "admin", "staff"])) {
          return json({ error: "Viewer hanya memiliki akses baca." }, 403, cors);
        }

        const body = await bodyJson(request);
        const tid = cleanString(body.tid, 200);

        if (!tid) {
          return json({ error: "tid wajib diisi." }, 400, cors);
        }

        if (
          !["keluar", "riwayat"].includes(body.source) ||
          !["print", "excel"].includes(body.action)
        ) {
          return json(
            { error: "source/action tidak valid." },
            400,
            cors
          );
        }

        const source = body.source;
        const action = body.action;
        const field = `${source}${action === "excel" ? "Excel" : "Print"}`;
        const eventId = cleanString(body.eventId, 100);
        if (!/^[A-Za-z0-9._:-]{12,100}$/.test(eventId)) {
          return json({ error: "eventId wajib unik dan valid." }, 400, cors);
        }

        // Validasi tid agar audit hanya untuk transaksi keluar/surat jalan yang nyata.
        const inv = await getDoc(env, DATA_PATH);
        const keluarRows = Array.isArray(inv?.keluar) ? inv.keluar : [];
        const tidExists = keluarRows.some(r => String(r.transactionId || r.groupId || r.id || "").toUpperCase() === tid.toUpperCase());
        if (!tidExists) {
          return json({ error: "Transaksi Surat Jalan tidak ditemukan." }, 404, cors);
        }

        const now = Math.floor(Date.now() / 1000);
        const docPath = await sjAuditDocPath(tid);

        for (let attempt = 0; attempt < 5; attempt++) {
          const raw = await getRawDoc(env, docPath);
          const current = raw ? decodeFields(raw.fields || {}) : null;
          const events = current && Array.isArray(current.events)
            ? current.events
            : [];

          if (events.some(e => e && e.eventId === eventId)) {
            return json(
              { ok: true, audit: publicSjAudit(current) },
              200,
              cors
            );
          }

          const counts = normalizeSjAuditCounts(current || {});
          counts[field] = Number(counts[field] || 0) + 1;
          counts.count = Number(counts.count || 0) + 1;
          counts.updatedAt = now;

          const next = {
            tid,
            ...counts,
            events: [
              ...events,
              { eventId, source, action, username: actor.username, at: now }
            ].slice(-200)
          };

          try {
            if (raw) {
              await patchDocWithPrecondition(
                env,
                docPath,
                next,
                raw.updateTime
              );
            } else {
              await putDoc(env, docPath, next, true);
            }
          } catch (writeError) {
            if (writeError.status === 409 || writeError.status === 412) {
              continue;
            }
            throw writeError;
          }

          return json(
            { ok: true, audit: publicSjAudit(next) },
            200,
            cors
          );
        }

        return json(
          {
            error:
              "Histori SJ sedang berubah bersamaan. Silakan coba lagi."
          },
          409,
          cors
        );
      }

      // READ INVENTORY
      if (
        path === "/api/data" &&
        request.method === "GET"
      ) {
        const user = await authenticate(request, env);

        if (!user) {
          return json(
            { error: "Silakan login kembali." },
            401,
            cors
          );
        }

        const data = await getDoc(env, DATA_PATH);

        if (!data) {
          return json(
            {
              error:
                "Dokumen inventory belum ditemukan. Migrasi data harus dilakukan secara terkontrol."
            },
            404,
            cors
          );
        }

        delete data.users;
        delete data.currentUser;
        delete data._processedOperationIds;

        return json(
          {
            data,
            user: publicUser(user)
          },
          200,
          cors
        );
      }

      // INVENTORY OPERATIONS
      if (
        path === "/api/operations" &&
        request.method === "POST"
      ) {
        const actor = await authenticate(request, env);

        if (!actor) {
          return json(
            { error: "Silakan login kembali." },
            401,
            cors
          );
        }

        if (
          !roleAllowed(
            actor,
            ["superadmin", "admin", "staff"]
          )
        ) {
          return json(
            {
              error:
                "Viewer hanya memiliki akses baca."
            },
            403,
            cors
          );
        }

        const body = await bodyJson(request);

        const operationId = cleanString(
          body.operationId,
          100
        );

        if (
          !/^[A-Za-z0-9._:-]{12,100}$/.test(
            operationId
          )
        ) {
          return json(
            {
              error:
                "operationId wajib unik dan valid (12–100 karakter)."
            },
            400,
            cors
          );
        }

        const type = cleanString(body.type, 40);

        const payload =
          body.payload &&
          typeof body.payload === "object"
            ? body.payload
            : {};

        // Optimistic concurrency.
        // Baca versi terbaru, validasi, lalu tulis hanya jika
        // updateTime belum berubah.
        for (let attempt = 0; attempt < 5; attempt++) {
          const raw = await getRawDoc(env, DATA_PATH);

          if (!raw) {
            return json(
              {
                error:
                  "Dokumen inventory belum ditemukan."
              },
              404,
              cors
            );
          }

          const current = decodeFields(
            raw.fields || {}
          );

          const processed = Array.isArray(
            current._processedOperationIds
          )
            ? current._processedOperationIds
            : [];

          if (processed.includes(operationId)) {
            delete current._processedOperationIds;
            delete current.users;
            delete current.currentUser;

            return json(
              {
                ok: true,
                duplicate: true,
                operationId,
                data: current
              },
              200,
              cors
            );
          }

          try {
            applyInventoryOperation(
              current,
              actor,
              type,
              payload
            );
          } catch (validationError) {
            return json(
              {
                error:
                  validationError.message ||
                  "Operasi tidak valid."
              },
              400,
              cors
            );
          }

          current._processedOperationIds = [
            ...processed.filter(id => id !== operationId),
            operationId
          ].slice(-2000);

          // Pertahankan akun lama untuk sementara.
          const latestUsers = decodeFields(
            raw.fields || {}
          ).users;

          current.users = Array.isArray(latestUsers)
            ? latestUsers
            : [];

          current.currentUser = null;

          try {
            await patchDocWithPrecondition(
              env,
              DATA_PATH,
              current,
              raw.updateTime
            );

            delete current._processedOperationIds;
            delete current.users;
            delete current.currentUser;

            return json(
              {
                ok: true,
                operationId,
                savedAt: Math.floor(Date.now() / 1000),
                data: current
              },
              200,
              cors
            );
          } catch (writeError) {
            if (
              writeError.status === 409 ||
              writeError.status === 412 ||
              /FAILED_PRECONDITION|ABORTED/i.test(
                writeError.message
              )
            ) {
              continue;
            }

            throw writeError;
          }
        }

        return json(
          {
            error:
              "Data terus berubah dari perangkat lain. Muat ulang data lalu coba lagi."
          },
          409,
          cors
        );
      }

      // FULL SNAPSHOT - ADMIN ONLY
      if (
        path === "/api/data" &&
        request.method === "PUT"
      ) {
        const user = await authenticate(request, env);

        if (
          !roleAllowed(user, ["superadmin", "admin"])
        ) {
          return json(
            {
              error:
                "Penyimpanan snapshot penuh hanya diizinkan untuk Admin atau Super Admin."
            },
            user ? 403 : 401,
            cors
          );
        }

        const body = await bodyJson(request);

        if (
          !body.data ||
          typeof body.data !== "object" ||
          !Array.isArray(body.data.items)
        ) {
          return json(
            {
              error:
                "Struktur data inventory tidak valid."
            },
            400,
            cors
          );
        }

        const raw = await getRawDoc(env, DATA_PATH);

        if (!raw) {
          return json(
            {
              error:
                "Dokumen inventory belum ada. Jangan membuat data default otomatis."
            },
            404,
            cors
          );
        }

        const current = decodeFields(
          raw.fields || {}
        );

        const safeData = {
          ...body.data,
          users: Array.isArray(current.users)
            ? current.users
            : [],
          currentUser: null,
          _processedOperationIds:
            Array.isArray(current._processedOperationIds)
              ? current._processedOperationIds
              : []
        };

        try {
          await patchDocWithPrecondition(
            env,
            DATA_PATH,
            safeData,
            raw.updateTime
          );
        } catch (error) {
          if (error.status === 409 || error.status === 412) {
            return json(
              {
                error:
                  "Data berubah saat proses snapshot. Muat ulang sebelum mencoba lagi."
              },
              409,
              cors
            );
          }

          throw error;
        }

        return json(
          {
            ok: true,
            savedAt: Math.floor(Date.now() / 1000)
          },
          200,
          cors
        );
      }

      // RESTORE - ADMIN ONLY
      if (
        path === "/api/data/restore" &&
        request.method === "POST"
      ) {
        const user = await authenticate(request, env);

        if (
          !roleAllowed(user, ["superadmin", "admin"])
        ) {
          return json(
            {
              error:
                "Restore hanya diizinkan untuk Admin atau Super Admin."
            },
            user ? 403 : 401,
            cors
          );
        }

        const body = await bodyJson(request);
        const restored = body.data;

        const required = [
          "items",
          "masuk",
          "keluar",
          "po",
          "sampel",
          "retur"
        ];

        if (
          !restored ||
          typeof restored !== "object" ||
          required.some(
            key => !Array.isArray(restored[key])
          )
        ) {
          return json(
            {
              error:
                "Struktur backup tidak valid atau tidak lengkap."
            },
            400,
            cors
          );
        }

        const raw = await getRawDoc(env, DATA_PATH);

        if (!raw) {
          return json(
            {
              error:
                "Dokumen inventory belum ada. Restore dibatalkan."
            },
            404,
            cors
          );
        }

        const current = decodeFields(
          raw.fields || {}
        );

        const safeRestore = {
          ...restored,
          users: Array.isArray(current.users)
            ? current.users
            : [],
          currentUser: null,
          _processedOperationIds:
            Array.isArray(current._processedOperationIds)
              ? current._processedOperationIds
              : []
        };

        try {
          await patchDocWithPrecondition(
            env,
            DATA_PATH,
            safeRestore,
            raw.updateTime
          );
        } catch (error) {
          if (error.status === 409 || error.status === 412) {
            return json(
              {
                error:
                  "Data berubah selama Restore. Proses dibatalkan; muat ulang sebelum mencoba lagi."
              },
              409,
              cors
            );
          }

          throw error;
        }

        return json(
          {
            ok: true,
            restoredAt: Math.floor(Date.now() / 1000)
          },
          200,
          cors
        );
      }

      // LIST USERS
      if (
        path === "/api/users" &&
        request.method === "GET"
      ) {
        const actor = await authenticate(request, env);

        if (
          !roleAllowed(actor, ["superadmin", "admin"])
        ) {
          return json(
            {
              error:
                "Tidak memiliki izin melihat manajemen akun."
            },
            actor ? 403 : 401,
            cors
          );
        }

        const token = await googleAccessToken(env);

        const listUrl =
          `https://firestore.googleapis.com/v1/projects/` +
          `${encodeURIComponent(env.FIREBASE_PROJECT_ID)}` +
          `/databases/(default)/documents/${USER_COLLECTION}`;

        const response = await fetch(listUrl, {
          headers: {
            authorization: `Bearer ${token}`
          }
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error?.message ||
            "Gagal membaca daftar akun."
          );
        }

        let users = (result.documents || []).map(doc => ({
          ...decodeFields(doc.fields || {}),
          username: doc.name.split("/").pop()
        }));

        if (actor.role === "admin") {
          users = users.filter(
            u => ["staff", "viewer"].includes(u.role)
          );
        }

        return json(
          {
            users: users.map(publicUser)
          },
          200,
          cors
        );
      }

      // CREATE USER
      if (
        path === "/api/users" &&
        request.method === "POST"
      ) {
        const actor = await authenticate(request, env);

        if (
          !roleAllowed(actor, ["superadmin", "admin"])
        ) {
          return json(
            {
              error:
                "Tidak memiliki izin membuat akun."
            },
            actor ? 403 : 401,
            cors
          );
        }

        const body = await bodyJson(request);

        const username = String(
          body.username || ""
        ).trim().toLowerCase();

        const role = String(
          body.role || ""
        ).toLowerCase();

        if (!validUsername(username)) {
          return json(
            {
              error:
                "Username 3–32 karakter: huruf kecil, angka, titik, garis bawah, atau strip."
            },
            400,
            cors
          );
        }

        if (!["admin", "staff", "viewer"].includes(role)) {
          return json(
            { error: "Role tidak valid." },
            400,
            cors
          );
        }

        if (
          actor.role === "admin" &&
          role !== "staff" &&
          role !== "viewer"
        ) {
          return json(
            {
              error:
                "Admin biasa hanya boleh membuat Staff dan Viewer."
            },
            403,
            cors
          );
        }

        if (username === "superadmin") {
          return json(
            {
              error:
                "Username superadmin dicadangkan."
            },
            409,
            cors
          );
        }

        const credentials = await hashPassword(
          body.password
        );

        const record = {
          ...credentials,
          name: String(
            body.name || username
          ).trim().slice(0, 80),
          role,
          disabled: false,
          uiPreference: "classic",
          sessionVersion: 0,
          createdAt: Math.floor(Date.now() / 1000)
        };

        try {
          await putDoc(
            env,
            `${USER_COLLECTION}/${username}`,
            record,
            true
          );
        } catch (error) {
          if (error.status === 409) {
            return json(
              { error: "Username sudah digunakan." },
              409,
              cors
            );
          }

          throw error;
        }

        return json(
          {
            ok: true,
            user: publicUser({
              ...record,
              username
            })
          },
          201,
          cors
        );
      }

      // UPDATE USER
      if (
        path.startsWith("/api/users/") &&
        request.method === "PUT"
      ) {
        const actor = await authenticate(request, env);

        if (
          !roleAllowed(actor, ["superadmin", "admin"])
        ) {
          return json(
            {
              error:
                "Tidak memiliki izin mengubah akun."
            },
            actor ? 403 : 401,
            cors
          );
        }

        const username = decodeURIComponent(
          path.slice("/api/users/".length)
        ).toLowerCase();

        if (
          !validUsername(username) ||
          username === "superadmin"
        ) {
          return json(
            {
              error:
                "Akun Super Admin tidak dapat diubah melalui endpoint ini."
            },
            403,
            cors
          );
        }

        const target = await getDoc(
          env,
          `${USER_COLLECTION}/${username}`
        );

        if (!target) {
          return json(
            { error: "Akun tidak ditemukan." },
            404,
            cors
          );
        }

        if (
          actor.role === "admin" &&
          !["staff", "viewer"].includes(target.role)
        ) {
          return json(
            {
              error:
                "Admin biasa hanya boleh mengubah Staff dan Viewer."
            },
            403,
            cors
          );
        }

        const body = await bodyJson(request);

        const nextRole =
          body.role !== undefined
            ? String(body.role).toLowerCase()
            : target.role;

        if (
          !["admin", "staff", "viewer"].includes(nextRole)
        ) {
          return json(
            { error: "Role tidak valid." },
            400,
            cors
          );
        }

        if (
          actor.role === "admin" &&
          nextRole !== "staff" &&
          nextRole !== "viewer"
        ) {
          return json(
            {
              error:
                "Admin biasa hanya boleh mengatur Staff dan Viewer."
            },
            403,
            cors
          );
        }

        const updated = {
          ...target,
          name:
            body.name !== undefined
              ? String(body.name).trim().slice(0, 80)
              : target.name,
          role: nextRole,
          disabled:
            body.disabled !== undefined
              ? Boolean(body.disabled)
              : Boolean(target.disabled)
        };

        const passwordChanged = body.password !== undefined;
        const disabledChanged = body.disabled !== undefined && Boolean(body.disabled) !== Boolean(target.disabled);
        if (passwordChanged) {
          const credentials = await hashPassword(
            body.password
          );

          updated.salt = credentials.salt;
          updated.passwordHash = credentials.passwordHash;
          updated.iterations = credentials.iterations;
          updated.migratedFromLegacy = false;
        }
        if (passwordChanged || (disabledChanged && updated.disabled)) {
          updated.sessionVersion = Number(target.sessionVersion || 0) + 1;
        }

        await putDoc(
          env,
          `${USER_COLLECTION}/${username}`,
          updated
        );

        return json(
          {
            ok: true,
            user: publicUser({
              ...updated,
              username
            })
          },
          200,
          cors
        );
      }

      // DELETE USER
      if (
        path.startsWith("/api/users/") &&
        request.method === "DELETE"
      ) {
        const actor = await authenticate(request, env);

        if (
          !roleAllowed(actor, ["superadmin", "admin"])
        ) {
          return json(
            {
              error:
                "Tidak memiliki izin menghapus akun."
            },
            actor ? 403 : 401,
            cors
          );
        }

        const username = decodeURIComponent(
          path.slice("/api/users/".length)
        ).toLowerCase();

        if (
          !validUsername(username) ||
          username === "superadmin" ||
          username === actor.username
        ) {
          return json(
            {
              error:
                "Akun ini tidak boleh dihapus."
            },
            403,
            cors
          );
        }

        const target = await getDoc(
          env,
          `${USER_COLLECTION}/${username}`
        );

        if (!target) {
          return json(
            { error: "Akun tidak ditemukan." },
            404,
            cors
          );
        }

        if (
          actor.role === "admin" &&
          !["staff", "viewer"].includes(target.role)
        ) {
          return json(
            {
              error:
                "Admin biasa hanya boleh menghapus Staff dan Viewer."
            },
            403,
            cors
          );
        }

        await deleteDoc(
          env,
          `${USER_COLLECTION}/${username}`
        );

        return json(
          { ok: true },
          200,
          cors
        );
      }

      return json(
        { error: "Endpoint tidak ditemukan." },
        404,
        cors
      );

    } catch (error) {
      console.error(
        "Inventory Worker error:",
        error
      );

      return json(
        {
          error: "Kesalahan server."
        },
        500,
        cors
      );
    }
  }
};
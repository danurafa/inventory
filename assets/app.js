

        // Normalisasi KHUSUS TAMPILAN: jika nama lama sudah diawali ID barang,
        // hilangkan awalan ID tersebut agar tidak tampil dua kali. Data database tidak diubah.
        window.displayItemName = function(barangId, nama) {
            const id = String(barangId ?? '').trim();
            let text = String(nama ?? '').trim();
            if (!text) return '-';
            if (!id) return text;
            const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const prefix = new RegExp('^' + escapedId + '\\s*[-–—:]\\s*', 'i');
            // Hapus awalan ID berulang, misalnya: ID - ID - NAMA.
            while (prefix.test(text)) text = text.replace(prefix, '').trim();
            return text || '-';
        };

        const DEFAULT_DATA = {
            theme: 'sunset',
            currentUser: null,
            users: [],
            items: [
                { id: 'EJ-003-02', nama: 'MARCELLO RED BORDER', jenis: 'ELASTIS HURUF', lebar: '35 mm', ukuran: 'SIZE L', berat: 120, satuan: 'YARD', min: 100, stok: 2300 },
                { id: 'MARIO', nama: 'MARIO', jenis: 'ELASTIS POLOS', lebar: '30 mm', ukuran: 'SIZE M', berat: 100, satuan: 'YARD', min: 150, stok: 1250 },
                { id: 'EJ-002-001', nama: 'MANGO SPORT', jenis: 'ELASTIS HURUF', lebar: '35 mm', ukuran: 'SIZE XXL', berat: 140, satuan: 'YARD', min: 100, stok: 800 },
                { id: 'FX-0005', nama: 'POLYPROPYLENE', jenis: 'FASTRACK', lebar: '25 mm', ukuran: 'ALL SIZE', berat: 85, satuan: 'METER', min: 120, stok: 620 },
                { id: 'EJ0050', nama: 'ELASTIS TALI SEPATU', jenis: 'FASTRACK', lebar: '10 mm', ukuran: 'STANDARD', berat: 50, satuan: 'PCS', min: 200, stok: 95 },
                { id: 'FX-001', nama: '025 FE', jenis: 'FASTRACK', lebar: '20 mm', ukuran: 'STANDARD', berat: 90, satuan: 'ROLL', min: 100, stok: 90 }
            ],
            masuk: [
                { id: 'IN-2611-0002', tanggal: '2026-11-11', barangId: 'EJ-003-02', nama: 'MARCELLO RED BORDER', jenis: 'ELASTIS HURUF', lebar: '35 mm', ukuran: 'SIZE L', satuan: 'YARD', qty: 1000, supplier: 'PT. SINAR TEXTILE', user: 'Administrator' },
                { id: 'IN-2611-0001', tanggal: '2026-11-10', barangId: 'MARIO', nama: 'MARIO', jenis: 'ELASTIS POLOS', lebar: '30 mm', ukuran: 'SIZE M', satuan: 'YARD', qty: 500, supplier: 'PRODUKSI LOOM A', user: 'Administrator' }
            ],
            keluar: [
                { id: 'OT-2611-0001', tanggal: '2026-11-11', barangId: 'EJ-002-001', nama: 'MANGO SPORT', jenis: 'ELASTIS HURUF', lebar: '35 mm', ukuran: 'SIZE XXL', satuan: 'YARD', qty: 300, tujuan: 'PT. MAJU JAYA', poRef: 'POC-2611-0001', user: 'Administrator' }
            ],
            po: [
                { id: 'POC-2611-0001', noPoCustomer: 'PO/2026/XI/001', tanggal: '2026-11-12', customer: 'PT. MAJU JAYA', barangId: 'EJ-003-02', nama: 'MARCELLO RED BORDER', jenis: 'ELASTIS HURUF', lebar: '35 mm', ukuran: 'SIZE L', satuan: 'YARD', qty: 500, terkirim: 0, status: 'OPEN' },
                { id: 'POC-2611-0002', noPoCustomer: 'PO/2026/XI/002', tanggal: '2026-11-12', customer: 'PT. PANCA TIRTA SEJAHTERA', barangId: 'EJ0050', nama: 'ELASTIS TALI SEPATU', jenis: 'FASTRACK', lebar: '10 mm', ukuran: 'STANDARD', satuan: 'PCS', qty: 100, terkirim: 40, status: 'PARTIAL' }
            ],
            sampel: [
                { id: 'SMP-2611-0001', tanggal: '2026-11-11', customer: 'PT. MAJU JAYA', nama: 'SAMPEL ELASTIS POLOS CUSTOM', kategori: 'ELASTIS POLOS', lebar: '25 mm', ukuran: 'SIZE M', berat: 45, tebal: '1.0 mm' }
            ],
            retur: [
                { id: 'RTR-2011-0001', tanggal: '2026-11-11', barangId: 'FX-001', nama: '025 FE', jenis: 'FASTRACK', lebar: '20 mm', ukuran: 'STANDARD', satuan: 'ROLL', qty: 25, keterangan: 'KELEBIHAN KIRIM PO LAMA', user: 'Administrator' }
            ]
        };

        const LOCAL_KEY = 'gudang_pro_local_state';
        let localSaved = null;
        try { localSaved = localStorage.getItem(LOCAL_KEY); } catch (e) { console.warn('Local storage tidak tersedia:', e); }
        try {
            window.gudangAppDb = localSaved ? JSON.parse(localSaved) : JSON.parse(JSON.stringify(DEFAULT_DATA));
        } catch (e) {
            console.error('Data lokal rusak, menggunakan data awal:', e);
            window.gudangAppDb = JSON.parse(JSON.stringify(DEFAULT_DATA));
        }

        // Pertahankan appId bawaan lingkungan agar semua perangkat memakai lokasi dokumen yang sama.
        const appId = (typeof __app_id !== 'undefined' && __app_id) ? __app_id : 'gudang-pro-cloud-system';
        const fallbackFirebaseConfig = {
            apiKey: 'AIzaSyCBWc__mP1LzKpEdXfh4K5G9Gu7luQrG3o',
            authDomain: 'inventorytestcv.firebaseapp.com',
            projectId: 'inventorytestcv',
            storageBucket: 'inventorytestcv.firebasestorage.app',
            messagingSenderId: '909180357097',
            appId: '1:909180357097:web:03df07f528c10a30a32378'
        };
        let firebaseConfig = fallbackFirebaseConfig;
        try {
            if (typeof __firebase_config !== 'undefined' && __firebase_config) {
                firebaseConfig = typeof __firebase_config === 'string' ? JSON.parse(__firebase_config) : __firebase_config;
            }
        } catch (e) { console.error('Konfigurasi Firebase tidak valid:', e); }


        const WORKER_BASE_URL = 'https://inventory-backend-test.danurafa.workers.dev';
        const WORKER_TOKEN_KEY = 'gudang_pro_worker_token';
        let workerToken = localStorage.getItem(WORKER_TOKEN_KEY) || '';
        let cloudReady = false;
        let isSyncingFromCloud = false;
        let lastSyncedData = null;
        let syncQueue = Promise.resolve();
        let lastCloudError = null;

        function updateCloudStatusBadge(state, detail = '') {
            const badge = document.getElementById('cloud-sync-status');
            if (!badge) return;
            const styles = {
                active: ['bg-emerald-500/20 text-emerald-400 border-emerald-500/30', '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Cloud Sync Active'],
                saving: ['bg-sky-500/20 text-sky-400 border-sky-500/30', '<span class="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span> Menyimpan ke Cloud...'],
                connecting: ['bg-amber-500/20 text-amber-400 border-amber-500/30', '<span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span> Menghubungkan Cloud...'],
                offline: ['bg-amber-500/20 text-amber-400 border-amber-500/30', '<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Offline'],
                error: ['bg-red-500/20 text-red-400 border-red-500/30', '<span class="w-1.5 h-1.5 rounded-full bg-red-400"></span> Cloud Sync Error']
            };
            const selected = styles[state] || styles.connecting;
            badge.className = `inline-flex items-center gap-1 text-[10px] ${selected[0]} px-2 py-0.5 rounded-full border font-bold`;
            badge.innerHTML = selected[1];
            badge.title = detail || (lastCloudError ? lastCloudError.message : '');

            // V184: cerminkan status yang sama ke badge mobile (semua role).
            const mobileBadge = document.getElementById('cloud-sync-status-mobile');
            if (mobileBadge) {
                mobileBadge.className = `cloud-sync-status-mobile inline-flex items-center gap-1 text-[10px] ${selected[0]} px-2 py-0.5 rounded-full border font-bold`;
                mobileBadge.innerHTML = selected[1];
                mobileBadge.title = badge.title;
            }
        }

        function saveLocalDB() {
            try { localStorage.setItem(LOCAL_KEY, JSON.stringify(window.gudangAppDb)); }
            catch (e) { console.error('Gagal menyimpan data lokal:', e); }
        }

        function cloneData(v) { return JSON.parse(JSON.stringify(v ?? {})); }
        function publicData(data) {
            const d = cloneData(data || {});
            delete d.users; delete d.currentUser; delete d._processedOperationIds;
            ['items','masuk','keluar','po','sampel','retur'].forEach(k => { if (!Array.isArray(d[k])) d[k] = []; });
            return d;
        }
        async function workerRequest(path, options = {}) {
            const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
            if (workerToken) headers.Authorization = `Bearer ${workerToken}`;
            const response = await fetch(`${WORKER_BASE_URL}${path}`, { ...options, headers });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.error || `Worker error (${response.status})`);
            return body;
        }
        const INVENTORY_THEME_KEY = 'gudang_inventory_theme_mode';
        const INVENTORY_UI_PREFERENCE_KEY = 'gudang_inventory_ui_preference';

        function localSoftUiPreferenceKey(user) {
            const accountId = user?.id || user?.username;
            return accountId
                ? `${INVENTORY_UI_PREFERENCE_KEY}:soft:${encodeURIComponent(String(accountId))}`
                : `${INVENTORY_UI_PREFERENCE_KEY}:soft`;
        }
        function localNeonUiPreferenceKey(user) {
            const accountId = user?.id || user?.username;
            return accountId
                ? `${INVENTORY_UI_PREFERENCE_KEY}:neon:${encodeURIComponent(String(accountId))}`
                : `${INVENTORY_UI_PREFERENCE_KEY}:neon`;
        }

        // Preferensi desain UI disimpan pada akun Worker.
        function normalizeAccountUiPreference(value) {
            return ['classic', 'crystal', 'soft', 'neon'].includes(value) ? value : 'classic';
        }

        function accountPreferenceFromMode(mode) {
            return mode === 'light' ? 'crystal' : 'classic';
        }

        function applyAccountUiPreference(user) {
            if (!user) return;
            const localSoftPreference = localStorage.getItem(localSoftUiPreferenceKey(user)) === 'soft';
            const localNeonPreference = localStorage.getItem(localNeonUiPreferenceKey(user)) === 'neon';
            const preference = localSoftPreference ? 'soft' : localNeonPreference ? 'neon' : normalizeAccountUiPreference(user.uiPreference);
            user.uiPreference = preference;
            const mode = ['classic','neon'].includes(preference) ? 'dark' : 'light';
            localStorage.setItem(INVENTORY_THEME_KEY, mode);
            window.applyTheme?.('glass', mode, preference);
            window.activeUserSession = user;
            if (window.gudangAppDb) window.gudangAppDb.currentUser = user;
            localStorage.setItem('gudang_pro_session', JSON.stringify(user));
        }

        async function saveAccountUiPreference(preference) {
            if (!workerToken || !window.gudangAppDb?.currentUser) return;
            const uiPreference = normalizeAccountUiPreference(preference);
            if (uiPreference === 'soft' || uiPreference === 'neon') return;
            try {
                const result = await workerRequest('/api/me/ui-preference', {
                    method: 'PUT',
                    body: JSON.stringify({ uiPreference })
                });
                if (result.user) {
                    result.user.uiPreference = uiPreference;
                    window.gudangAppDb.currentUser = result.user;
                    window.activeUserSession = result.user;
                    localStorage.setItem('gudang_pro_session', JSON.stringify(result.user));
                }
            } catch (error) {
                console.error('[UI Preference] Gagal menyimpan preferensi:', error);
                showToast(`Tampilan berubah di perangkat ini, tetapi gagal disimpan ke akun: ${error.message}`, 'error');
            }
        }

        function applyWorkerData(data) {
            if (!data || !Array.isArray(data.items)) throw new Error('Data dari Worker tidak valid.');
            const theme = window.gudangAppDb?.theme || data.theme || 'sunset';
            const session = window.gudangAppDb?.currentUser || window.activeUserSession || null;
            window.gudangAppDb = { ...publicData(data), theme, users: window.gudangAppDb?.users || [], currentUser: session };
            lastSyncedData = publicData(data);
            saveLocalDB();
            if (typeof window.refreshAllViews === 'function') window.refreshAllViews();
        }
        function makeOpId() {
            return `web-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
        }
        async function sendOperation(type, payload) {
            const result = await workerRequest('/api/operations', {
                method: 'POST',
                body: JSON.stringify({ operationId: makeOpId(), type, payload })
            });
            if (result.data) {
                lastSyncedData = publicData(result.data);
                const theme = window.gudangAppDb?.theme || 'sunset';
                const session = window.gudangAppDb?.currentUser || null;
                window.gudangAppDb = { ...cloneData(lastSyncedData), theme, users: window.gudangAppDb?.users || [], currentUser: session };
                saveLocalDB();
            }
        }
        function same(a,b) { return JSON.stringify(a) === JSON.stringify(b); }
        async function syncLocalChanges() {
            if (!workerToken || !cloudReady || isSyncingFromCloud || !lastSyncedData) return;
            const desired = publicData(window.gudangAppDb);
            const maps = arr => new Map((arr || []).map(x => [String(x.id), x]));
            let bm = maps(lastSyncedData.items), dm = maps(desired.items);
            // New PO and master records must exist before outbound transactions refer to them.
            for (const [id,item] of dm) if (!bm.has(id)) await sendOperation('master.create', { id, item });
            let bp = maps(lastSyncedData.po), dp = maps(desired.po);
            for (const [id,row] of dp) if (!bp.has(id)) await sendOperation('po.create', { id, record: row });

            // Remove transaction records first; Worker reverses their stock/PO effects atomically.
            for (const key of ['masuk','keluar','retur','sampel']) {
                const before = maps(lastSyncedData[key]), after = maps(desired[key]);
                for (const [id] of before) if (!after.has(id)) await sendOperation(`${key}.delete`, { id });
            }
            // PO can be deleted only after outbound references have been removed.
            bp = maps(lastSyncedData.po); dp = maps(desired.po);
            for (const [id] of bp) if (!dp.has(id)) await sendOperation('po.delete', { id });

            // Add transactions after required master/PO records exist.
            for (const key of ['masuk','keluar','retur','sampel']) {
                const before = maps(lastSyncedData[key]), after = maps(desired[key]);
                for (const [id,row] of after) if (!before.has(id)) await sendOperation(`${key}.create`, { id, record: row });
            }
            // Update master metadata only. Never send stock in master.update.
            bm = maps(lastSyncedData.items); dm = maps(desired.items);
            for (const [id,item] of dm) {
                const old = bm.get(id); if (!old) continue;
                const patch = {};
                ['nama','jenis','lebar','ukuran','berat','satuan','min'].forEach(k => {
                    if (!same(item[k], old[k])) patch[k] = item[k];
                });
                if (Object.keys(patch).length) await sendOperation('master.update', { id, item: patch });
            }
            // Delete master rows last; backend refuses deletion while history/PO references remain.
            bm = maps(lastSyncedData.items); dm = maps(desired.items);
            for (const [id] of bm) if (!dm.has(id)) await sendOperation('master.delete', { id });

            const serverData = await workerRequest('/api/data', { method: 'GET' });
            applyWorkerData(serverData.data);
            lastCloudError = null;
            updateCloudStatusBadge('active');
        }

        window.saveCloudDB = async function() {
            saveLocalDB();
            if (isSyncingFromCloud) return true;
            if (!workerToken || !cloudReady) {
                updateCloudStatusBadge('offline', 'Login diperlukan untuk sinkronisasi.');
                return false;
            }

            // Setiap pemanggilan menunggu antrean sebelumnya. Nilai true hanya
            // dikembalikan setelah Worker mengonfirmasi seluruh operasi.
            const currentTask = syncQueue.then(async () => {
                updateCloudStatusBadge('saving');
                await syncLocalChanges();
                return true;
            });

            syncQueue = currentTask.catch(async error => {
                lastCloudError = error;
                console.error('[Worker Sync] Gagal:', error);
                updateCloudStatusBadge('error', error.message);
                try {
                    const fresh = await workerRequest('/api/data', { method: 'GET' });
                    applyWorkerData(fresh.data);
                } catch (_) {}
                showToast(`Gagal menyimpan ke cloud: ${error.message}`, 'error');
                return false;
            });

            return await syncQueue;
        };

        async function loadUsersFromWorker() {
            const role = window.gudangAppDb?.currentUser?.role;
            if (!['admin','superadmin'].includes(role)) {
                window.gudangAppDb.users = [];
                return;
            }
            try {
                const result = await workerRequest('/api/users', { method: 'GET' });
                window.gudangAppDb.users = Array.isArray(result.users) ? result.users : [];
            } catch (e) {
                console.warn('Daftar pengguna tidak dapat dimuat:', e.message);
                window.gudangAppDb.users = [];
            }
        }
        async function initCloud() {
            updateCloudStatusBadge('connecting');
            try {
                await workerRequest('/health', { method: 'GET' }).catch(async () => {
                    // Health may be public but Worker still validates its environment.
                    return await fetch(`${WORKER_BASE_URL}/health`).then(async r => {
                        const b = await r.json().catch(() => ({}));
                        if (!r.ok) throw new Error(b.error || 'Worker tidak dapat dihubungi.');
                        return b;
                    });
                });
                const setupStatus = await fetch(`${WORKER_BASE_URL}/api/setup/status`).then(async r => {
                    const b = await r.json().catch(() => ({}));
                    if (!r.ok) throw new Error(b.error || 'Tidak dapat memeriksa status setup.');
                    return b;
                });
                if (setupStatus.setupRequired) {
                    const setupSecret = prompt('Setup pertama kali: masukkan SETUP_SECRET Cloudflare (nilai rahasia yang sudah kamu simpan di Worker).');
                    if (!setupSecret) { updateCloudStatusBadge('connecting', 'Setup Super Admin belum dilakukan.'); window.showLoginModal?.(); return; }
                    const superPassword = prompt('Buat password Super Admin (minimal 10 karakter). Jangan bagikan password ini.');
                    if (!superPassword || superPassword.length < 10) { showToast('Password Super Admin minimal 10 karakter.', 'error'); return; }
                    const setupResponse = await fetch(`${WORKER_BASE_URL}/api/setup/superadmin`, {
                        method:'POST',
                        headers:{'Content-Type':'application/json','X-Setup-Secret':setupSecret},
                        body:JSON.stringify({username:'superadmin',name:'Super Administrator',password:superPassword})
                    });
                    const setupBody = await setupResponse.json().catch(()=>({}));
                    if (!setupResponse.ok) throw new Error(setupBody.error || 'Pembuatan Super Admin gagal.');
                    try {
                        const migrationResponse = await fetch(`${WORKER_BASE_URL}/api/setup/migrate-legacy-users`, {
                            method:'POST', headers:{'Content-Type':'application/json','X-Setup-Secret':setupSecret}, body:'{}'
                        });
                        if (!migrationResponse.ok) {
                            const mb = await migrationResponse.json().catch(()=>({}));
                            if (migrationResponse.status !== 409) console.warn('Migrasi akun lama belum selesai:', mb.error || migrationResponse.status);
                        }
                    } catch (migrationError) { console.warn('Migrasi akun lama:', migrationError); }
                    showToast('Super Admin berhasil dibuat. Silakan login.');
                    window.showLoginModal?.();
                    return;
                }
                if (workerToken) {
                    const me = await workerRequest('/api/me', { method: 'GET' });
                    window.activeUserSession = me.user;
                    window.gudangAppDb.currentUser = me.user;
                    localStorage.setItem('gudang_pro_session', JSON.stringify(me.user));
                    applyAccountUiPreference(me.user);
                    const result = await workerRequest('/api/data', { method: 'GET' });
                    applyWorkerData(result.data);
                    const masukIdField = document.getElementById('masuk-id');
                    if (masukIdField) masukIdField.value = generateMasukSequentialId();
                    const keluarIdField = document.getElementById('keluar-id');
                    if (keluarIdField) keluarIdField.value = generateKeluarSequentialId();
                    await loadUsersFromWorker();
                    window.refreshAllViews?.();
                    cloudReady = true;
                    updateCloudStatusBadge('active');
                    window.hideLoginModal?.();
                    startAutoLogoutTimer();
                } else {
                    cloudReady = false;
                    updateCloudStatusBadge('connecting', 'Silakan login untuk mengaktifkan sinkronisasi.');
                    window.showLoginModal?.();
                }
            } catch (error) {
                workerToken = '';
                localStorage.removeItem(WORKER_TOKEN_KEY);
                localStorage.removeItem('gudang_pro_session');
                window.activeUserSession = null;
                window.gudangAppDb.currentUser = null;
                cloudReady = false;
                lastCloudError = error;
                console.error('[Worker Init]', error);
                updateCloudStatusBadge('error', error.message);
                window.showLoginModal?.();
                showToast(`Koneksi backend gagal: ${error.message}`, 'error');
            }
        }
        window.addEventListener('online', () => { if (workerToken) initCloud(); });
        window.addEventListener('offline', () => updateCloudStatusBadge('offline'));
        window.refreshWorkerUsers = loadUsersFromWorker;

        // Worker REST API tidak memakai Firestore onSnapshot; polling ringan menjaga perangkat lain tetap segar.
        let workerPollBusy = false;
        function hasUnsavedLocalChanges() {
            if (!lastSyncedData) return false;
            const local = publicData(window.gudangAppDb);
            return !same(local.items, lastSyncedData.items) ||
                !same(local.masuk, lastSyncedData.masuk) ||
                !same(local.keluar, lastSyncedData.keluar) ||
                !same(local.po, lastSyncedData.po) ||
                !same(local.sampel, lastSyncedData.sampel) ||
                !same(local.retur, lastSyncedData.retur);
        }
        // Jangan render ulang tabel PO saat pengguna sedang mengedit Qty Siap.
        // Polling berjalan setiap 7 detik; applyWorkerData() memanggil refreshAllViews(),
        // lalu renderPoTable() mengganti tbody.innerHTML dan menghilangkan fokus input.
        function isEditingPoReadyInput() {
            const active = document.activeElement;
            return !!active && active.matches('#po-table-body input[id^="ready-"]');
        }
        let workerRefreshPendingWhileEditing = false;

        async function refreshFromWorkerIfChanged() {
            if (!workerToken || !cloudReady || workerPollBusy || document.hidden) return;
            workerPollBusy = true;
            try {
                const result = await workerRequest('/api/data', { method:'GET' });
                const incoming = publicData(result.data);
                if (!same(incoming, lastSyncedData)) {
                    // Tunda penerapan data cloud selama input Qty Siap sedang aktif.
                    // Data tidak dibuang; polling berikutnya akan mengambil versi terbaru.
                    if (isEditingPoReadyInput()) {
                        workerRefreshPendingWhileEditing = true;
                    } else if (!hasUnsavedLocalChanges()) {
                        workerRefreshPendingWhileEditing = false;
                        applyWorkerData(incoming);
                        updateCloudStatusBadge('active');
                    }
                }
            } catch (error) {
                console.warn('[Worker Poll]', error.message);
                if (!navigator.onLine) updateCloudStatusBadge('offline');
            } finally { workerPollBusy = false; }
        }
        setInterval(refreshFromWorkerIfChanged, 7000);
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) refreshFromWorkerIfChanged();
        });
        // Setelah pengguna meninggalkan kolom Qty Siap, sinkronisasi cloud boleh dilanjutkan.
        // Jika fokus berpindah ke tombol Atur, biarkan updatePoReady yang menyelesaikan simpan.
        document.addEventListener('focusout', (event) => {
            if (!event.target?.matches?.('#po-table-body input[id^="ready-"]')) return;
            const next = event.relatedTarget;
            if (next && next.closest?.('#po-table-body button')) return;
            if (workerRefreshPendingWhileEditing) {
                setTimeout(() => {
                    if (!isEditingPoReadyInput()) refreshFromWorkerIfChanged();
                }, 150);
            }
        }, true);

        // Backup: Admin dan Staff boleh mengunduh; Restore hanya Admin/Super Admin.
        function isAdminForBackup() {
            return ['admin','superadmin','staff'].includes(window.gudangAppDb?.currentUser?.role);
        }
        function isAdminForRestore() {
            return ['admin','superadmin'].includes(window.gudangAppDb?.currentUser?.role);
        }
        function makeBackupPayload(data) {
            const cleanData = publicData(data);
            cleanData.currentUser = null;
            cleanData.users = []; // kredensial akun tidak pernah ikut file backup
            return { backupType:'GUDANG_PRO_INVENTORY_BACKUP', backupVersion:2, createdAt:new Date().toISOString(), appId:'gudang-pro-cloud-system', projectId:'inventorytestcv', data:cleanData };
        }
        function triggerJsonDownload(payload, fileName) {
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a'); link.href = url; link.download = fileName;
            document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500);
        }
        window.downloadInventoryBackup = function() {
            if (!isAdminForBackup()) { showToast('Akses backup tidak diizinkan.', 'error'); return; }
            const payload = makeBackupPayload(window.gudangAppDb);
            triggerJsonDownload(payload, `BACKUP_INVENTORY_${new Date().toISOString().replace(/[:.]/g,'-').slice(0,19)}.json`);
            showToast('Backup inventory berhasil diunduh (tanpa kredensial akun).');
        };
        window.previewRestoreFile = async function(input) {
            const info = document.getElementById('restore-file-info'), button = document.getElementById('restore-json-btn');
            if (button) button.disabled = true;
            if (!isAdminForRestore()) { showToast('Hanya Admin/Super Admin yang dapat restore.', 'error'); if(input) input.value=''; return; }
            const file = input?.files?.[0]; if (!file) return;
            try {
                const parsed = JSON.parse(await file.text());
                const data = parsed?.backupType === 'GUDANG_PRO_INVENTORY_BACKUP' ? parsed.data : parsed;
                const required = ['items','masuk','keluar','po','sampel','retur'];
                const missing = required.filter(k => !Array.isArray(data?.[k]));
                if (missing.length) throw new Error('Bagian backup tidak ditemukan: '+missing.join(', '));
                window._pendingInventoryRestore = { data: publicData(data), fileName:file.name };
                if (info) { info.textContent = `File valid: ${file.name} | Barang ${data.items.length}, Masuk ${data.masuk.length}, Keluar ${data.keluar.length}, PO ${data.po.length}`; info.classList.remove('hidden'); }
                if (button) button.disabled = false;
            } catch(e) { window._pendingInventoryRestore=null; showToast('Backup tidak valid: '+e.message,'error'); if(input) input.value=''; }
        };
        window.restoreInventoryBackup = async function() {
            if (!isAdminForRestore()) { showToast('Hanya Admin/Super Admin yang dapat restore.','error'); return; }
            const pending = window._pendingInventoryRestore;
            if (!pending?.data) { showToast('Pilih file backup valid.','error'); return; }
            if (prompt('Restore akan mengganti data inventory cloud. Ketik RESTORE untuk melanjutkan:') !== 'RESTORE') return;
            try {
                triggerJsonDownload(makeBackupPayload(window.gudangAppDb), `PRE_RESTORE_BACKUP_${new Date().toISOString().replace(/[:.]/g,'-')}.json`);
                const result = await workerRequest('/api/data/restore', { method:'POST', body:JSON.stringify({data:pending.data}) });
                applyWorkerData(result.data || (await workerRequest('/api/data',{method:'GET'})).data);
                window._pendingInventoryRestore = null;
                const fi=document.getElementById('restore-json-file'); if(fi) fi.value='';
                const restoreInfo = document.getElementById('restore-file-info'); if (restoreInfo) { restoreInfo.classList.add('hidden'); restoreInfo.textContent=''; }
                showToast('Restore berhasil dikirim ke cloud.');
            } catch(e) { showToast('Restore gagal: '+e.message,'error'); }
        };
        initCloud();


        window.populateItemDropdowns = function() {
            const dropdowns = ['masuk-barang', 'keluar-barang', 'po-barang', 'retur-barang'];
            dropdowns.forEach(id => {
                const sel = document.getElementById(id);
                if (!sel) return;
                const currentVal = sel.value;
                sel.innerHTML = '<option value="">-- Pilih Barang --</option>' + 
                    window.gudangAppDb.items.map(i => `<option value="${i.id}">${i.id} - ${i.nama} (${i.jenis})</option>`).join('');
                if (currentVal) sel.value = currentVal;
            });
        };

        window.getPoReadyQty = function(po) {
            if (!po) return 0;
            const remain = Math.max(0, Number(po.qty||0) - Number(po.terkirim||0));
            if (po.siapKirim !== undefined) return Math.max(0, Math.min(remain, Number(po.siapKirim||0)));
            const item = (window.gudangAppDb.items||[]).find(x=>x.id===po.barangId);
            return Math.max(0, Math.min(remain, Number(item?.stok||0)));
        };

        window.populatePoDropdowns = function() {
            const groupSel=document.getElementById('keluar-po-group'); if(!groupSel) return;
            const current=groupSel.value; const groups=new Map();
            (window.gudangAppDb.po||[]).filter(p=>Number(p.qty||0)>Number(p.terkirim||0)).forEach(p=>{const key=`${String(p.customer||'').toUpperCase()}|${String(p.noPoCustomer||p.id).toUpperCase()}`; if(!groups.has(key)) groups.set(key,{key,label:`${p.noPoCustomer||p.id} — ${p.customer||''}`});});
            groupSel.innerHTML='<option value="">-- Pilih Nomor PO --</option>'+[...groups.values()].map(g=>`<option value="${g.key}">${g.label}</option>`).join('');
            if(current && groups.has(current)) groupSel.value=current;
            populatePoItemOptions();
        };
        window.populatePoItemOptions = function() {
            const groupKey = document.getElementById('keluar-po-group')?.value || '';
            const host = document.getElementById('keluar-items-container');
            const info = document.getElementById('keluar-po-ready-info');
            if (!host) return;

            // PENTING: jangan mengganti seluruh isi host setiap refresh.
            // Elemen input yang sama dipakai kembali agar fokus/kursor tidak terlepas
            // ketika Cloud Sync atau refresh tampilan memanggil fungsi ini.
            const rows = (window.gudangAppDb.po || []).filter(p =>
                `${String(p.customer||'').toUpperCase()}|${String(p.noPoCustomer||p.id).toUpperCase()}` === groupKey
            );

            // Isi Customer/Tujuan otomatis saat pengguna memilih kelompok PO.
            // Dataset mencegah nilai tujuan tertimpa saat refresh Cloud berulang.
            const groupSelect = document.getElementById('keluar-po-group');
            const tujuanInput = document.getElementById('keluar-tujuan');
            const previousCustomerGroup = groupSelect?.dataset.customerGroup || '';
            if (groupSelect && groupKey !== previousCustomerGroup) {
                if (groupKey && rows.length && tujuanInput) {
                    tujuanInput.value = String(rows[0].customer || '').trim().toUpperCase();
                } else if (!groupKey && tujuanInput && document.getElementById('keluar-edit-mode')?.value !== 'true') {
                    tujuanInput.value = '';
                }
                groupSelect.dataset.customerGroup = groupKey;
            }

            if (!groupKey || !rows.length) {
                host.replaceChildren();
                if (info) info.textContent = 'Pilih nomor PO untuk menampilkan barang.';
                updateKeluarBatchTotal();
                return;
            }

            const isEdit = document.getElementById('keluar-edit-mode')?.value === 'true';
            const legacyPoSelect = document.getElementById('keluar-po-ref');
            const legacyItemSelect = document.getElementById('keluar-barang');
            if (legacyPoSelect) {
                const current = legacyPoSelect.value;
                legacyPoSelect.innerHTML = '<option value="">-</option>' + rows.map(po => `<option value="${po.id}">${po.nama||po.barangId}</option>`).join('');
                if (rows.some(po => String(po.id) === String(current))) legacyPoSelect.value = current;
            }
            if (legacyItemSelect) {
                const current = legacyItemSelect.value;
                legacyItemSelect.innerHTML = '<option value="">-</option>' + rows.map(po => `<option value="${po.barangId}">${po.barangId}</option>`).join('');
                if (rows.some(po => String(po.barangId) === String(current))) legacyItemSelect.value = current;
            }

            const existingCards = new Map(
                [...host.querySelectorAll('[data-keluar-row]')].map(card => [
                    `${card.dataset.poRef}|${card.dataset.barangId}`, card
                ])
            );
            const keepKeys = new Set();
            const editingRow = isEdit
                ? (window.gudangAppDb.keluar||[]).find(x => x.id === document.getElementById('keluar-id')?.value)
                : null;

            rows.forEach((po, index) => {
                const key = `${po.id}|${po.barangId}`;
                keepKeys.add(key);
                const item = (window.gudangAppDb.items || []).find(x => String(x.id) === String(po.barangId));
                const remainBase = Math.max(0, Number(po.qty||0) - Number(po.terkirim||0));
                const oldQtyForThisPo = editingRow && String(editingRow.poRef) === String(po.id)
                    ? Number(editingRow.qty||0) : 0;
                const ready = getPoReadyQty(po) + oldQtyForThisPo;
                const remain = remainBase + oldQtyForThisPo;
                const stock = Math.max(0, Number(item?.stok||0) +
                    ((editingRow && String(editingRow.barangId) === String(po.barangId)) ? Number(editingRow.qty||0) : 0));
                const max = Math.max(0, Math.min(ready, remain, stock));

                let card = existingCards.get(key);
                if (!card) {
                    card = document.createElement('div');
                    card.className = 'rounded-lg border border-white/10 bg-black/10 p-2 space-y-1';
                    card.dataset.keluarRow = '1';
                    card.dataset.poRef = po.id;
                    card.dataset.barangId = po.barangId;

                    const top = document.createElement('div');
                    top.className = 'flex items-start justify-between gap-2';
                    const name = document.createElement('div');
                    name.className = 'min-w-0';
                    const title = document.createElement('div');
                    title.className = 'text-xs font-semibold text-gray-100';
                    title.dataset.keluarTitle = '1';
                    const meta = document.createElement('div');
                    meta.className = 'text-[10px] text-gray-400';
                    meta.dataset.keluarMeta = '1';
                    name.append(title, meta);

                    const inputWrap = document.createElement('div');
                    inputWrap.className = 'w-24 shrink-0';
                    const inputLabel = document.createElement('label');
                    inputLabel.className = 'block text-[10px] text-gray-400 mb-1';
                    inputLabel.textContent = 'Qty Keluar';
                    const input = document.createElement('input');
                    input.type = 'number';
                    input.min = '0';
                    input.step = '1';
                    input.className = 'w-full bg-dark-700 border border-white/15 rounded-lg px-2 py-2 text-xs font-mono';
                    input.autocomplete = 'off';
                    input.dataset.keluarQty = '1';
                    input.value = '0';
                    input.addEventListener('input', updateKeluarBatchTotal);
                    inputWrap.append(inputLabel, input);
                    top.append(name, inputWrap);
                    card.append(top);
                    const note = document.createElement('div');
                    note.className = 'text-[10px] text-amber-300';
                    note.dataset.keluarNote = '1';
                    card.append(note);
                }

                // Perbarui teks dan batas tanpa mengganti node input.
                const title = card.querySelector('[data-keluar-title]');
                const meta = card.querySelector('[data-keluar-meta]');
                const input = card.querySelector('[data-keluar-qty]');
                const note = card.querySelector('[data-keluar-note]');
                if (title) title.textContent = `${window.displayItemName(po.barangId, po.nama || item?.nama || po.barangId)} (${po.barangId})`;
                if (meta) meta.textContent = `PO: ${Number(po.qty||0).toLocaleString('id-ID')} · Terkirim: ${Number(po.terkirim||0).toLocaleString('id-ID')} · Siap: ${ready.toLocaleString('id-ID')} · Stok: ${stock.toLocaleString('id-ID')}`;
                if (input) {
                    input.max = String(max);
                    input.disabled = max <= 0;
                    // Jangan menimpa input.value saat refresh. Nilai yang sedang diketik
                    // harus tetap hidup pada elemen input yang sama.
                }
                if (note) {
                    if (max <= 0) {
                        note.textContent = remain <= 0
                            ? 'PO untuk barang ini sudah terpenuhi.'
                            : 'Belum ada stok/kesiapan untuk dikirim.';
                        note.classList.remove('hidden');
                    } else {
                        note.textContent = '';
                        note.classList.add('hidden');
                    }
                }

                // Pindahkan hanya jika urutan benar-benar berubah. Menghindari detach
                // pada input aktif yang dapat menyebabkan browser kehilangan fokus.
                const currentAtIndex = host.children[index];
                if (currentAtIndex !== card) host.insertBefore(card, currentAtIndex || null);
            });

            // Hapus hanya baris yang memang sudah tidak termasuk PO terpilih.
            [...host.querySelectorAll('[data-keluar-row]')].forEach(card => {
                const key = `${card.dataset.poRef}|${card.dataset.barangId}`;
                if (!keepKeys.has(key)) card.remove();
            });

            if (info) info.textContent = isEdit
                ? 'Mode edit: ubah Qty pada satu detail transaksi ini.'
                : 'Isi Qty pada satu atau beberapa barang. Setiap baris memiliki batas kesiapan, sisa PO, dan stok sendiri.';
            updateKeluarBatchTotal();
        };

        window.updateKeluarBatchTotal = function() {
            const total = [...document.querySelectorAll('#keluar-items-container [data-keluar-qty]')]
                .reduce((sum, el) => sum + (Number(el.value)||0), 0);
            const label = document.getElementById('keluar-total-qty');
            if (label) label.textContent = total.toLocaleString('id-ID');
        };


        let refreshAllViewsFrame = null;
        window.refreshAllViews = function() {
            if (refreshAllViewsFrame !== null) return;
            refreshAllViewsFrame = requestAnimationFrame(() => {
                refreshAllViewsFrame = null;
                const activeTab = ['dashboard','master','po','masuk','keluar','sampel','retur','users','backup']
                    .find(tab => {
                        const section = document.getElementById(`tab-${tab}`);
                        return section && !section.classList.contains('hidden');
                    }) || 'dashboard';

                if (['po','masuk','keluar','retur'].includes(activeTab)) {
                    populateItemDropdowns();
                }
                if (activeTab === 'keluar') populatePoDropdowns();

                const renderers = {
                    dashboard: renderDashboard,
                    master: renderMasterTable,
                    masuk: renderMasukTable,
                    keluar: renderKeluarTable,
                    po: renderPoTable,
                    sampel: renderSampelTable,
                    retur: renderReturTable,
                    users: renderUserTable
                };
                renderers[activeTab]?.();

                const backupCounts = { items: 'backup-count-items', masuk: 'backup-count-masuk', keluar: 'backup-count-keluar', po: 'backup-count-po' };
                Object.entries(backupCounts).forEach(([key, id]) => { const el = document.getElementById(id); if (el) el.textContent = Array.isArray(window.gudangAppDb[key]) ? window.gudangAppDb[key].length : 0; });
                renderCurrentUserBanner();
                applyRoleRestrictions();
                lucide.createIcons();
            });
        };

        window.resetData = async function() {
            if (!['admin','superadmin'].includes(window.gudangAppDb.currentUser?.role)) {
                showToast('Hanya Admin/Super Admin yang dapat mereset data!', 'error'); return;
            }
            showConfirm('Reset Data Gudang', 'Reset akan mengganti seluruh data inventory cloud ke kondisi awal. Lanjutkan hanya jika sudah memiliki backup.', async () => {
                try {
                    triggerJsonDownload(makeBackupPayload(window.gudangAppDb), `PRE_RESET_BACKUP_${new Date().toISOString().replace(/[:.]/g,'-')}.json`);
                    const resetData = publicData(DEFAULT_DATA);
                    const result = await workerRequest('/api/data/restore', { method:'POST', body:JSON.stringify({data:resetData}) });
                    applyWorkerData(result.data || (await workerRequest('/api/data',{method:'GET'})).data);
                    showToast('Data inventory berhasil direset.');
                } catch (error) { showToast('Reset gagal: '+error.message, 'error'); }
            });
        };
    

// ===== split block =====


        window.activeUserSession = JSON.parse(localStorage.getItem('gudang_pro_session')) || null;

        window.checkAuth = function() {
            if (!localStorage.getItem('gudang_pro_worker_token')) {
                window.showLoginModal();
            } else if (window.gudangAppDb?.currentUser || window.activeUserSession) {
                document.body.classList.add('inventory-authenticated');
            }
        };

        window.showLoginModal = function() {
            document.body.classList.remove('inventory-authenticated');
            const modal = document.getElementById('login-modal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        };

        window.hideLoginModal = function() {
            const modal = document.getElementById('login-modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
            // Fungsi ini hanya dipanggil setelah autentikasi berhasil.
            // Jangan bergantung pada urutan inisialisasi currentUser atau mode tema.
            document.body.classList.add('inventory-authenticated');
        };

        window.handleLoginSubmit = async function(e) {
            e.preventDefault();
            const username = document.getElementById('login-username').value.trim().toLowerCase();
            const password = document.getElementById('login-password').value;
            try {
                const response = await fetch('https://inventory-backend-test.danurafa.workers.dev/api/login', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const result = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(result.error || 'Username atau password salah.');
                workerToken = result.token;
                localStorage.setItem('gudang_pro_worker_token', workerToken);
                window.activeUserSession = result.user;
                window.gudangAppDb.currentUser = result.user;
                localStorage.setItem('gudang_pro_session', JSON.stringify(result.user));
                applyAccountUiPreference(result.user);
                const dataResult = await workerRequest('/api/data', { method: 'GET' });
                applyWorkerData(dataResult.data);
                cloudReady = true;
                await loadUsersFromWorker();
                window.refreshAllViews?.();
                hideLoginModal();
                startAutoLogoutTimer();
                document.getElementById('login-password').value = '';
                showToast(`Login berhasil sebagai ${result.user.name} (${result.user.role.toUpperCase()}).`);
                updateCloudStatusBadge('active');
            } catch (error) {
                showToast(error.message || 'Login gagal.', 'error');
            }
        };

        // AUTO LOGOUT: 30 menit tidak aktif, peringatan pada menit ke-25.
        const AUTO_LOGOUT_IDLE_MS = 30 * 60 * 1000;
        const AUTO_LOGOUT_WARNING_MS = 5 * 60 * 1000;
        let autoLogoutLastActivity = Date.now();
        let autoLogoutTicker = null;
        let autoLogoutHasWarned = false;
        let autoLogoutInProgress = false;

        function hideAutoLogoutWarning() {
            const modal = document.getElementById('auto-logout-modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        }

        function showAutoLogoutWarning() {
            const modal = document.getElementById('auto-logout-modal');
            if (!modal) return;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            if (window.lucide?.createIcons) window.lucide.createIcons();
        }

        function updateAutoLogoutCountdown(remainingMs) {
            const el = document.getElementById('auto-logout-countdown');
            if (!el) return;
            const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
            const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
            const seconds = String(totalSeconds % 60).padStart(2, '0');
            el.textContent = `${minutes}:${seconds}`;
        }

        function resetAutoLogoutActivity() {
            if (!workerToken || !window.gudangAppDb?.currentUser || autoLogoutInProgress) return;
            autoLogoutLastActivity = Date.now();
            autoLogoutHasWarned = false;
            hideAutoLogoutWarning();
        }

        function startAutoLogoutTimer() {
            stopAutoLogoutTimer();
            if (!workerToken || !window.gudangAppDb?.currentUser) return;
            autoLogoutLastActivity = Date.now();
            autoLogoutHasWarned = false;
            autoLogoutInProgress = false;
            hideAutoLogoutWarning();
            autoLogoutTicker = window.setInterval(() => {
                if (!workerToken || !window.gudangAppDb?.currentUser || autoLogoutInProgress) return;
                const idleMs = Date.now() - autoLogoutLastActivity;
                const warningAtMs = AUTO_LOGOUT_IDLE_MS - AUTO_LOGOUT_WARNING_MS;

                if (idleMs >= AUTO_LOGOUT_IDLE_MS) {
                    performLogout('auto');
                    return;
                }
                if (idleMs >= warningAtMs) {
                    autoLogoutHasWarned = true;
                    updateAutoLogoutCountdown(AUTO_LOGOUT_IDLE_MS - idleMs);
                    showAutoLogoutWarning();
                } else if (autoLogoutHasWarned) {
                    autoLogoutHasWarned = false;
                    hideAutoLogoutWarning();
                }
            }, 1000);
        }

        function stopAutoLogoutTimer() {
            if (autoLogoutTicker) {
                window.clearInterval(autoLogoutTicker);
                autoLogoutTicker = null;
            }
            autoLogoutHasWarned = false;
            hideAutoLogoutWarning();
        }

        window.keepSessionAlive = function() {
            resetAutoLogoutActivity();
            showToast('Sesi diperpanjang. Anda tetap login.', 'success');
        };

        window.autoLogoutNow = function() {
            performLogout('auto');
        };

        async function performLogout(reason = 'manual') {
            if (autoLogoutInProgress) return;
            autoLogoutInProgress = true;
            document.body.classList.remove('inventory-authenticated');
            stopAutoLogoutTimer();
            try { if (workerToken) await workerRequest('/api/logout', { method: 'POST' }); } catch (_) {}
            workerToken = '';
            localStorage.removeItem('gudang_pro_worker_token');
            localStorage.removeItem('gudang_pro_session');
            window.activeUserSession = null;
            window.gudangAppDb.currentUser = null;
            cloudReady = false;
            const userInp = document.getElementById('login-username');
            const passInp = document.getElementById('login-password');
            if (userInp) userInp.value = '';
            if (passInp) passInp.value = '';
            window.showLoginModal();
            updateCloudStatusBadge('connecting', 'Login diperlukan.');
            showToast(
                reason === 'auto'
                    ? 'Sesi berakhir otomatis karena tidak ada aktivitas selama 30 menit.'
                    : 'Berhasil logout.',
                'warning'
            );
            autoLogoutInProgress = false;
        }

        window.logoutUser = function() {
            showConfirm('Logout Sistem', 'Apakah Anda yakin ingin keluar dari sesi saat ini?', async () => {
                await performLogout('manual');
            });
            const cancelBtn = document.getElementById('confirm-cancel-btn');
            if (cancelBtn) {
                cancelBtn.onclick = () => {
                    const modal = document.getElementById('confirm-modal');
                    if (modal) {
                        modal.classList.add('hidden');
                        modal.classList.remove('flex');
                    }
                    if (localStorage.getItem('gudang_pro_worker_token') && window.gudangAppDb?.currentUser) {
                        document.body.classList.add('inventory-authenticated');
                    }
                };
            }
        };

        // Aktivitas pengguna memperbarui hitung mundur. Gerakan mouse dibatasi agar timer tidak terlalu sering ditulis.
        let autoLogoutLastPointerUpdate = 0;
        ['click', 'keydown', 'touchstart', 'scroll', 'mousemove'].forEach(eventName => {
            window.addEventListener(eventName, event => {
                if (eventName === 'mousemove') {
                    const now = Date.now();
                    if (now - autoLogoutLastPointerUpdate < 1000) return;
                    autoLogoutLastPointerUpdate = now;
                }
                const loginModal = document.getElementById('login-modal');
                if (loginModal && !loginModal.classList.contains('hidden')) return;
                const warningModal = document.getElementById('auto-logout-modal');
                if (warningModal && event.target && warningModal.contains(event.target)) return;
                resetAutoLogoutActivity();
            }, { passive: true });
        });
        window.addEventListener('focus', () => {
            if (workerToken && window.gudangAppDb?.currentUser && !autoLogoutInProgress) {
                if (Date.now() - autoLogoutLastActivity >= AUTO_LOGOUT_IDLE_MS) {
                    performLogout('auto');
                } else {
                    resetAutoLogoutActivity();
                }
            }
        });


        // Sapaan header otomatis mengikuti waktu lokal dan nama pengguna yang login.
        window.updateHeaderGreeting = function() {
            const title = document.getElementById('inventory-greeting-title');
            if (!title) return;
            const hour = new Date().getHours();
            let greeting = 'Selamat Datang';
            if (hour >= 4 && hour < 11) greeting = 'Selamat Pagi';
            else if (hour >= 11 && hour < 15) greeting = 'Selamat Siang';
            else if (hour >= 15 && hour < 18) greeting = 'Selamat Sore';
            else greeting = 'Selamat Malam';

            const user = window.gudangAppDb?.currentUser || window.activeUserSession || null;
            const name = user?.name || user?.username || '';
            const greetingText = document.getElementById('inventory-greeting-text');
            if (greetingText) greetingText.textContent = name ? `${greeting}, ${name}!` : `${greeting}!`;
            const mobileGreeting = document.getElementById('v156-mobile-greeting-text');
            if (mobileGreeting) mobileGreeting.textContent = name ? `${greeting}, ${name}!` : `${greeting}!`;
            else title.textContent = name ? `${greeting}, ${name}!` : `${greeting}!`;
        };

        // Ikon cuaca aktual Bandung dari Open-Meteo (tanpa API key).
        // Data diperbarui berkala; bila koneksi gagal, sapaan tetap berjalan normal.
        window.updateInventoryWeather = async function() {
            const iconEl = document.getElementById('inventory-weather-icon');
            const tempEl = document.getElementById('inventory-weather-temp');
            const descEl = document.getElementById('inventory-weather-desc');
            if (!iconEl) return;

            const weatherMap = {
                0: ['☀️', 'Cerah'], 1: ['🌤️', 'Cerah berawan'], 2: ['⛅', 'Berawan sebagian'],
                3: ['☁️', 'Mendung'], 45: ['🌫️', 'Berkabut'], 48: ['🌫️', 'Kabut tebal'],
                51: ['🌦️', 'Gerimis ringan'], 53: ['🌦️', 'Gerimis'], 55: ['🌧️', 'Gerimis lebat'],
                56: ['🌧️', 'Gerimis beku'], 57: ['🌧️', 'Gerimis beku lebat'],
                61: ['🌦️', 'Hujan ringan'], 63: ['🌧️', 'Hujan sedang'], 65: ['🌧️', 'Hujan lebat'],
                66: ['🌧️', 'Hujan beku'], 67: ['🌧️', 'Hujan beku lebat'],
                71: ['🌨️', 'Salju ringan'], 73: ['🌨️', 'Salju'], 75: ['❄️', 'Salju lebat'],
                77: ['🌨️', 'Butiran salju'], 80: ['🌦️', 'Hujan lokal'], 81: ['🌧️', 'Hujan lokal sedang'],
                82: ['🌧️', 'Hujan lokal lebat'], 85: ['🌨️', 'Hujan salju lokal'], 86: ['🌨️', 'Hujan salju lebat'],
                izzle: ['⛈️', 'Badai petir'], 95: ['⛈️', 'Badai petir'], 96: ['⛈️', 'Petir dan hujan es'],
                99: ['⛈️', 'Badai petir kuat']
            };

            try {
                const url = 'https://api.open-meteo.com/v1/forecast?latitude=-6.9175&longitude=107.6191&current=temperature_2m,weather_code,is_day&timezone=Asia%2FBangkok';
                const response = await fetch(url, { cache: 'no-store' });
                if (!response.ok) throw new Error('Weather request failed');
                const data = await response.json();
                const current = data.current || {};
                const code = Number(current.weather_code);
                let weather = weatherMap[code] || ['🌤️', 'Cuaca Bandung'];
                if (code === 0 && Number(current.is_day) === 0) weather = ['🌙', 'Cerah malam'];
                iconEl.textContent = weather[0];
                iconEl.title = `Cuaca Bandung: ${weather[1]}`;
                iconEl.setAttribute('aria-label', `Cuaca Bandung: ${weather[1]}`);
                if (descEl) descEl.textContent = weather[1];
                if (tempEl && Number.isFinite(Number(current.temperature_2m))) {
                    tempEl.textContent = `${Math.round(Number(current.temperature_2m))}°C`;
                    tempEl.title = `Suhu saat ini di Bandung: ${current.temperature_2m}°C`;
                }
            } catch (error) {
                iconEl.textContent = '🌤️';
                iconEl.title = 'Cuaca Bandung belum dapat dimuat';
                iconEl.setAttribute('aria-label', 'Cuaca Bandung belum dapat dimuat');
                if (descEl) descEl.textContent = 'Cuaca tidak tersedia';
                if (tempEl) tempEl.textContent = '';
            }
        };

        window.renderCurrentUserBanner = function() {
            const banner = document.getElementById('current-user-banner');
            const user = window.gudangAppDb?.currentUser;
            if (!banner || !user) return;
            window.updateHeaderGreeting?.();
            const role = user.role;
            const renderKey = JSON.stringify([user.id || user.username || '', user.name || '', role || '']);
            if (banner.dataset.renderedUserKey === renderKey && banner.querySelector('button[onclick="logoutUser()"]')) return;
            const badgeClass = role === 'admin' ? 'role-badge-admin' : (role === 'staff' ? 'role-badge-staff' : 'role-badge-viewer');
            const mobileRoleBadge = document.getElementById('v167-mobile-role-badge');
            if (mobileRoleBadge) {
                const roleNames = { superadmin: 'SUPER ADMIN', admin: 'ADMIN', staff: 'STAFF', viewer: 'VIEWER' };
                mobileRoleBadge.textContent = roleNames[String(role || '').toLowerCase()] || String(role || 'USER').toUpperCase();
                mobileRoleBadge.dataset.role = String(role || '').toLowerCase();
            }
            
            banner.innerHTML = `
                <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center font-bold text-xs">
                        <i data-lucide="user" class="w-3.5 h-3.5"></i>
                    </div>
                    <div class="text-left leading-tight hidden sm:block">
                        <div class="font-bold text-xs text-gray-200">${window.gudangAppDb.currentUser.name}</div>
                        <span class="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${badgeClass}">${role}</span>
                    </div>
                </div>
                <button onclick="logoutUser()" class="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-colors ml-1" title="Logout">
                    <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
                </button>
            `;
            banner.dataset.renderedUserKey = renderKey;
            lucide.createIcons();
        };

        window.applyRoleRestrictions = function() {
            if (!window.gudangAppDb.currentUser) return;
            const role = window.gudangAppDb.currentUser.role;

            const navUsersWrapper = document.getElementById('nav-users-wrapper');
            if (navUsersWrapper) {
                navUsersWrapper.style.display = ['admin','superadmin'].includes(role) ? 'block' : 'none';
            }
            const navBackupWrapper = document.getElementById('nav-backup-wrapper');
            if (navBackupWrapper) navBackupWrapper.style.display = ['admin','superadmin','staff'].includes(role) ? 'block' : 'none';
            if (!['admin','superadmin','staff'].includes(role) && document.getElementById('tab-backup')?.classList.contains('hidden') === false) switchTab('dashboard');
            if (!['admin','superadmin'].includes(role) && document.getElementById('tab-users').classList.contains('hidden') === false) {
                switchTab('dashboard');
            }

            const resetBtnWrapper = document.getElementById('reset-btn-wrapper');
            if (resetBtnWrapper) {
                resetBtnWrapper.style.display = ['admin','superadmin'].includes(role) ? 'block' : 'none';
            }

            const formCards = ['master-form-card', 'masuk-form-card', 'keluar-form-card', 'po-form-card', 'sampel-form-card', 'retur-form-card', 'user-form-card'];
            formCards.forEach(id => {
                const el = document.getElementById(id);
                if (!el) return;
                if (role === 'viewer' || (role === 'staff' && id === 'master-form-card')) {
                    el.style.opacity = '0.4';
                    el.style.pointerEvents = 'none';
                } else {
                    el.style.opacity = '1';
                    el.style.pointerEvents = 'auto';
                }
            });

            const actionThs = ['master-th-aksi', 'masuk-th-aksi', 'keluar-th-aksi', 'po-th-aksi', 'sampel-th-aksi', 'retur-th-aksi'];
            actionThs.forEach(id => {
                const th = document.getElementById(id);
                if (th) th.style.display = role === 'viewer' ? 'none' : '';
            });
        };

        // Visual-only module entrance and dashboard KPI animation.
        // Uses requestAnimationFrame only while a module is opened; no polling/timers.
        function animateInventoryKpi(el) {
            if (!el) return;
            const finalText = (el.textContent || '0').trim();
            const target = Number(finalText.replace(/[^\d-]/g, '')) || 0;
            const start = performance.now();
            const duration = 680;
            function frame(now) {
                const progress = Math.min(1, (now - start) / duration);
                const eased = 1 - Math.pow(1 - progress, 3);
                el.textContent = Math.round(target * eased).toLocaleString('id-ID');
                if (progress < 1) requestAnimationFrame(frame);
                else el.textContent = finalText;
            }
            el.textContent = '0';
            requestAnimationFrame(frame);
        }

        function animateDashboardOnOpen() {
            ['stat-sku','stat-stok','stat-masuk','stat-keluar','stat-po','stat-retur']
                .forEach(id => animateInventoryKpi(document.getElementById(id)));

            // Grafik tidak dianimasikan ulang saat dashboard dibuka.
            // Ini mencegah efek berkedip ketika data dashboard diperbarui.
        }

        const inventoryTableRenderTimers = {};
        window.queueTableRender = function(tabId) {
            if (inventoryTableRenderTimers[tabId]) {
                clearTimeout(inventoryTableRenderTimers[tabId]);
            }
            inventoryTableRenderTimers[tabId] = setTimeout(() => {
                inventoryTableRenderTimers[tabId] = null;
                const renderers = {
                    master: window.renderMasterTable,
                    po: window.renderPoTable,
                    masuk: window.renderMasukTable,
                    keluar: window.renderKeluarTable,
                    sampel: window.renderSampelTable,
                    retur: window.renderReturTable
                };
                renderers[tabId]?.();
            }, 120);
        };

        window.switchTab = function(tabId) {
            const tabs = ['dashboard', 'master', 'po', 'masuk', 'keluar', 'sampel', 'retur', 'users', 'backup'];
            tabs.forEach(t => {
                const sec = document.getElementById(`tab-${t}`);
                const btn = document.getElementById(`nav-${t}`);
                if (sec) sec.classList.add('hidden');
                if (btn) {
                    btn.className = "sidebar-btn w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left group text-gray-400 hover:bg-white/5 hover:text-gray-200";
                }
            });

            const activeSec = document.getElementById(`tab-${tabId}`);
            const activeBtn = document.getElementById(`nav-${tabId}`);
            if (activeSec) {
                activeSec.classList.remove('hidden', 'module-enter');
                void activeSec.offsetWidth;
                activeSec.classList.add('module-enter');
            }
            if (activeBtn) {
                activeBtn.className = "sidebar-btn w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left group theme-accent-bg text-white shadow-lg shadow-orange-500/20";
            }
            if (tabId === 'dashboard') animateDashboardOnOpen();
            if (['po','masuk','keluar','retur'].includes(tabId)) {
                populateItemDropdowns();
            }
            if (tabId === 'keluar') populatePoDropdowns();
            const renderers = {
                dashboard: window.renderDashboard,
                master: window.renderMasterTable,
                po: window.renderPoTable,
                masuk: window.renderMasukTable,
                keluar: window.renderKeluarTable,
                sampel: window.renderSampelTable,
                retur: window.renderReturTable,
                users: window.renderUserTable
            };
            renderers[tabId]?.();
            lucide.createIcons();
        };

        window.openAppearancePanel = function() {
            const panel = document.getElementById('appearance-panel');
            if (!panel) return;
            panel.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            if (window.lucide?.createIcons) lucide.createIcons();
            const closeBtn = panel.querySelector('.appearance-close');
            if (closeBtn) closeBtn.focus();
        };
        window.closeAppearancePanel = function() {
            const panel = document.getElementById('appearance-panel');
            if (!panel) return;
            panel.classList.add('hidden');
            document.body.style.overflow = '';
            const trigger = document.getElementById('open-appearance-btn');
            if (trigger) trigger.focus();
        };
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') window.closeAppearancePanel();
        });

        window.changeTheme = function(themeName) {
            const preference = normalizeAccountUiPreference(themeName);
            window.selectAccountUiTheme(preference);
        };

        window.selectAccountUiTheme = async function(preference) {
            const selected = normalizeAccountUiPreference(preference);
            const mode = ['classic','neon'].includes(selected) ? 'dark' : 'light';
            localStorage.setItem(INVENTORY_UI_PREFERENCE_KEY, selected);
            localStorage.setItem(INVENTORY_THEME_KEY, mode);
            if (selected === 'soft' || selected === 'neon') {
                localStorage.setItem('gudang_inventory_sidebar_collapsed', 'false');
                document.getElementById('inventory-app-layout')?.classList.remove('sidebar-collapsed');
            }
            window.applyTheme('glass', mode, selected);

            if (window.gudangAppDb?.currentUser) {
                const currentUser = window.gudangAppDb.currentUser;
                if (selected === 'soft' || selected === 'neon') {
                    localStorage.setItem(localSoftUiPreferenceKey(currentUser), 'soft');
                    if (selected === 'neon') {
                        localStorage.setItem(localNeonUiPreferenceKey(currentUser), 'neon');
                        localStorage.removeItem(localSoftUiPreferenceKey(currentUser));
                    } else {
                        localStorage.removeItem(localNeonUiPreferenceKey(currentUser));
                    }
                } else {
                    localStorage.removeItem(localSoftUiPreferenceKey(currentUser));
                    localStorage.removeItem(localNeonUiPreferenceKey(currentUser));
                }
                currentUser.uiPreference = selected;
                window.activeUserSession = currentUser;
                localStorage.setItem('gudang_pro_session', JSON.stringify(currentUser));
                await saveAccountUiPreference(selected);
            }
            window.closeAppearancePanel();
            const themeName = selected === 'soft' ? 'Soft Neutral UI 3' : selected === 'neon' ? 'Black Cyan UI 4' : selected === 'crystal' ? 'Liquid Glass UI 2' : 'Classic Glass';
            showToast(`${themeName} diaktifkan.`);
        };

        // Kompatibilitas tombol mode lama; pilihan desain menentukan mode warnanya.
        window.toggleThemeMode = function() {
            const next = document.body.classList.contains('theme-crystal') ? 'classic' : 'crystal';
            window.selectAccountUiTheme(next);
        };

        window.applyTheme = function(themeName = 'glass', mode = null, preference = null) {
            const savedPreference = preference || localStorage.getItem(INVENTORY_UI_PREFERENCE_KEY) || accountPreferenceFromMode(mode || localStorage.getItem(INVENTORY_THEME_KEY) || 'dark');
            const selected = normalizeAccountUiPreference(savedPreference);
            const safeMode = ['classic','neon'].includes(selected) ? 'dark' : 'light';
            localStorage.setItem(INVENTORY_UI_PREFERENCE_KEY, selected);
            localStorage.setItem(INVENTORY_THEME_KEY, safeMode);
            // Pertahankan status autentikasi saat class tema diperbarui.
            // Tanpa ini, pergantian UI menghapus inventory-authenticated
            // sehingga header baru muncul kembali setelah halaman di-reload.
            const isAuthenticated = document.body.classList.contains('inventory-authenticated');
            const themeClass = selected === 'soft' ? 'theme-light theme-soft' : selected === 'neon' ? 'theme-dark theme-neon' : safeMode === 'light' ? 'theme-light theme-crystal' : 'theme-dark theme-classic';
            document.body.className = `min-h-screen flex flex-col antialiased theme-glass ${themeClass}`;
            if (isAuthenticated) document.body.classList.add('inventory-authenticated');

            const classicBtn = document.getElementById('theme-classic-btn');
            const crystalBtn = document.getElementById('theme-crystal-btn');
            const softBtn = document.getElementById('theme-soft-btn');
            const neonBtn = document.getElementById('theme-neon-btn');
            if (classicBtn) {
                classicBtn.classList.toggle('active', selected === 'classic');
                classicBtn.setAttribute('aria-pressed', String(selected === 'classic'));
            }
            if (crystalBtn) {
                crystalBtn.classList.toggle('active', selected === 'crystal');
                crystalBtn.setAttribute('aria-pressed', String(selected === 'crystal'));
            }
            if (softBtn) {
                softBtn.classList.toggle('active', selected === 'soft');
                softBtn.setAttribute('aria-pressed', String(selected === 'soft'));
            }
            if (neonBtn) {
                neonBtn.classList.toggle('active', selected === 'neon');
                neonBtn.setAttribute('aria-pressed', String(selected === 'neon'));
            }
            const classicCard = document.getElementById('theme-classic-card');
            const crystalCard = document.getElementById('theme-crystal-card');
            const softCard = document.getElementById('theme-soft-card');
            const neonCard = document.getElementById('theme-neon-card');
            if (classicCard) classicCard.classList.toggle('active', selected === 'classic');
            if (crystalCard) crystalCard.classList.toggle('active', selected === 'crystal');
            if (softCard) softCard.classList.toggle('active', selected === 'soft');
            if (neonCard) neonCard.classList.toggle('active', selected === 'neon');
            const themeNames = {
                classic: 'Classic Glass',
                crystal: 'Liquid Glass',
                soft: 'Soft Neutral UI 3',
                neon: 'Black Cyan UI 4'
            };
            const appearanceLabel = document.getElementById('appearance-current-label');
            if (appearanceLabel) appearanceLabel.textContent = `${themeNames[selected]} aktif`;
            const legacyLabel = document.getElementById('theme-mode-label');
            if (legacyLabel) legacyLabel.textContent = themeNames[selected];
            const legacyToggle = document.getElementById('theme-mode-toggle');
            if (legacyToggle) legacyToggle.setAttribute('aria-label', `${themeNames[selected]} aktif`);
        };

        window.updateClock = function() {
            const clockEl = document.getElementById('live-clock');
            if (!clockEl || document.hidden) return;
            // Gunakan zona waktu Jakarta secara eksplisit agar label WIB selalu akurat.
            const now = new Date();
            if (!window.__inventoryClockFormatters) {
                window.__inventoryClockFormatters = {
                    date: new Intl.DateTimeFormat('id-ID', {
                        timeZone: 'Asia/Jakarta', weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
                    }),
                    time: new Intl.DateTimeFormat('en-US', {
                        timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
                    })
                };
            }
            const dateStr = window.__inventoryClockFormatters.date.format(now);
            const timeStr = window.__inventoryClockFormatters.time.format(now);
            let timeEl = clockEl.querySelector('[data-clock-time]');
            let dateEl = clockEl.querySelector('[data-clock-date]');
            if (!timeEl || !dateEl) {
                clockEl.innerHTML = '<i data-lucide="clock-3" class="w-4 h-4" aria-hidden="true"></i><span class="clock-copy"><span data-clock-time></span><span data-clock-date></span></span>';
                timeEl = clockEl.querySelector('[data-clock-time]');
                dateEl = clockEl.querySelector('[data-clock-date]');
                if (window.lucide?.createIcons) lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
            }
            timeEl.textContent = timeStr;
            dateEl.textContent = `${dateStr}  •  WIB`;
            clockEl.setAttribute('aria-label', `Waktu sekarang ${dateStr}, ${timeStr} WIB`);
        };
        setInterval(updateClock, 1000);
        window.updateHeaderGreeting?.();
        window.updateInventoryWeather?.();
        setInterval(() => window.updateHeaderGreeting?.(), 60000);
        setInterval(() => window.updateInventoryWeather?.(), 10 * 60 * 1000);

        window.showToast = function(msg, type = 'success') {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const config = {
                success: { icon: 'check-circle-2', title: 'Berhasil', tone: 'success' },
                error:   { icon: 'x-circle', title: 'Terjadi Kesalahan', tone: 'error' },
                warning: { icon: 'alert-triangle', title: 'Perhatian', tone: 'warning' },
                info:    { icon: 'info', title: 'Informasi', tone: 'info' }
            };
            const item = config[type] || config.success;
            const messageText = String(msg ?? '');
            const activeToasts = () => Array.from(container.children).filter(toast =>
                toast.classList.contains('inventory-toast') && !toast.classList.contains('toast-leaving')
            );
            const removeToast = toast => {
                const closeButton = toast.querySelector('.inventory-toast-close');
                if (closeButton) closeButton.click();
                toast.remove();
            };
            const toastKey = JSON.stringify([item.tone, messageText]);
            const duplicate = activeToasts().find(toast => toast.dataset.toastKey === toastKey);
            if (duplicate) removeToast(duplicate);
            while (activeToasts().length >= 3) removeToast(activeToasts()[0]);

            const toast = document.createElement('div');
            toast.className = 'inventory-toast toast-' + item.tone;
            toast.dataset.toastKey = toastKey;
            toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
            toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

            const iconWrap = document.createElement('span');
            iconWrap.className = 'inventory-toast-icon';
            const icon = document.createElement('i');
            icon.setAttribute('data-lucide', item.icon);
            iconWrap.appendChild(icon);

            // Gunakan blok terpisah dan inline layout agar tidak tertimpa utility CSS lama.
            const copy = document.createElement('div');
            copy.className = 'inventory-toast-copy';
            copy.style.cssText = 'display:block!important;min-width:0!important;width:100%!important;flex:1 1 auto!important;white-space:normal!important;';

            const heading = document.createElement('div');
            heading.className = 'inventory-toast-title';
            heading.textContent = item.title;
            heading.style.cssText = 'display:block!important;width:100%!important;margin:0 0 4px 0!important;line-height:1.2!important;font-size:12px!important;font-weight:750!important;';

            const message = document.createElement('div');
            message.className = 'inventory-toast-message';
            message.textContent = messageText;
            message.style.cssText = 'display:block!important;width:100%!important;margin:0!important;line-height:1.4!important;font-size:11px!important;white-space:normal!important;overflow-wrap:anywhere!important;';

            copy.appendChild(heading);
            copy.appendChild(message);

            const close = document.createElement('button');
            close.type = 'button';
            close.className = 'inventory-toast-close';
            close.setAttribute('aria-label', 'Tutup notifikasi');
            const closeIcon = document.createElement('i');
            closeIcon.setAttribute('data-lucide', 'x');
            close.appendChild(closeIcon);

            const progress = document.createElement('span');
            progress.className = 'inventory-toast-progress';
            toast.appendChild(iconWrap);
            toast.appendChild(copy);
            toast.appendChild(close);
            toast.appendChild(progress);
            container.appendChild(toast);

            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons({ attrs: { 'stroke-width': 2 } });
            }

            let dismissed = false;
            let timer = null;
            const dismiss = () => {
                if (dismissed) return;
                dismissed = true;
                toast.classList.add('toast-leaving');
                window.setTimeout(() => toast.remove(), 260);
            };
            close.addEventListener('click', () => {
                if (timer) window.clearTimeout(timer);
                dismiss();
            });

            const duration = { success: 3600, error: 7000, warning: 5200, info: 4500 }[item.tone];
            progress.style.setProperty('--toast-duration', duration + 'ms');
            timer = window.setTimeout(dismiss, duration);
        };

        window.showConfirm = function(title, message, onConfirm, options = {}) {
            const modal = document.getElementById('confirm-modal');
            const detailsBox = document.getElementById('confirm-details');
            const warningBox = document.getElementById('confirm-warning');
            const okBtn = document.getElementById('confirm-ok-btn');
            const cancelBtn = document.getElementById('confirm-cancel-btn');

            document.getElementById('confirm-title').textContent = title;
            document.getElementById('confirm-message').textContent = message;
            okBtn.textContent = options.confirmLabel || 'Ya, Lanjutkan';

            // Rincian dibuat memakai textContent agar nilai data tidak dieksekusi sebagai HTML.
            detailsBox.replaceChildren();
            const record = options.record && typeof options.record === 'object' ? options.record : null;
            const labels = {
                id:'ID / Nomor', tanggal:'Tanggal', nama:'Nama Barang', barangId:'ID Barang',
                jenis:'Jenis', satuan:'Satuan', qty:'Jumlah', stok:'Stok', min:'Stok Minimum',
                customer:'Customer', supplier:'Supplier', noPoCustomer:'No. PO Customer',
                poRef:'Referensi PO', terkirim:'Qty Terkirim', siapKirim:'Siap Kirim',
                status:'Status', kategori:'Kategori', lebar:'Lebar', ukuran:'Ukuran',
                berat:'Berat', tebal:'Tebal', username:'Username', role:'Hak Akses',
                user:'User', keterangan:'Keterangan', noSj:'No. Surat Jalan'
            };
            const preferred = ['id','tanggal','nama','barangId','jenis','satuan','qty','customer','supplier','noPoCustomer','poRef','status','kategori','username','role'];
            const entries = record ? preferred.filter(key => record[key] !== undefined && record[key] !== null && String(record[key]).trim() !== '').map(key => [key, record[key]]) : [];
            if (record) {
                Object.entries(record).forEach(([key,value]) => {
                    if (entries.length >= 8 || preferred.includes(key) || value === undefined || value === null || typeof value === 'object' || String(value).trim() === '') return;
                    if (/password|token|secret|uid|createdAt|updatedAt/i.test(key)) return;
                    entries.push([key,value]);
                });
            }
            if (entries.length) {
                entries.slice(0,8).forEach(([key,value]) => {
                    const row = document.createElement('div');
                    row.className = 'flex items-start justify-between gap-3 text-[11px]';
                    const label = document.createElement('span');
                    label.className = 'text-gray-400 shrink-0';
                    label.textContent = labels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
                    const val = document.createElement('span');
                    val.className = 'text-gray-100 font-semibold text-right break-all';
                    val.textContent = String(value);
                    row.append(label,val);
                    detailsBox.appendChild(row);
                });
                detailsBox.classList.remove('hidden');
            } else {
                detailsBox.classList.add('hidden');
            }

            if (options.warning) {
                warningBox.textContent = options.warning;
                warningBox.classList.remove('hidden');
            } else {
                warningBox.textContent = '';
                warningBox.classList.add('hidden');
            }

            modal.classList.remove('hidden');
            modal.classList.add('flex');
            const cleanup = () => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                okBtn.onclick = null;
                cancelBtn.onclick = null;
            };
            okBtn.onclick = () => { cleanup(); if (typeof onConfirm === 'function') onConfirm(); };
            cancelBtn.onclick = cleanup;
        };

        window.generateId = function(prefix) {
            const now = new Date();
            const yy = String(now.getFullYear()).slice(-2);
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const rand = Math.floor(1000 + Math.random() * 9000);
            return `${prefix}-${yy}${mm}-${rand}`;
        };

        // ID transaksi selalu mengambil nomor terbesar yang sudah tersimpan
        // pada periode bulan/tahun berjalan, bukan menghitung jumlah baris.
        window.generateMasukSequentialId = function() {
            const now = new Date();
            const yy = String(now.getFullYear()).slice(-2);
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const prefix = `IN-${yy}${mm}-`;
            const rows = Array.isArray(window.gudangAppDb?.masuk) ? window.gudangAppDb.masuk : [];
            const usedIds = new Set();
            let maxNumber = 0;
            rows.forEach(row => {
                [row?.id, row?.transactionId, row?.groupId].forEach(raw => {
                    const value = String(raw || '').trim().toUpperCase();
                    if (!value.startsWith(prefix)) return;
                    usedIds.add(value);
                    const match = value.match(/^IN-\d{4}-(\d+)(?:-D\d+)?$/);
                    if (match) maxNumber = Math.max(maxNumber, Number(match[1]));
                });
            });
            let nextNumber = maxNumber + 1;
            let candidate = `${prefix}${String(nextNumber).padStart(4, '0')}`;
            while (usedIds.has(candidate)) {
                nextNumber++;
                candidate = `${prefix}${String(nextNumber).padStart(4, '0')}`;
            }
            return candidate;
        };

        window.generateKeluarSequentialId = function() {
            const now = new Date();
            const yy = String(now.getFullYear()).slice(-2);
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const prefix = `OT-${yy}${mm}-`;
            const rows = Array.isArray(window.gudangAppDb?.keluar) ? window.gudangAppDb.keluar : [];
            const usedIds = new Set();
            let maxNumber = 0;
            rows.forEach(row => {
                [row?.id, row?.transactionId, row?.groupId].forEach(raw => {
                    const value = String(raw || '').trim().toUpperCase();
                    if (!value.startsWith(prefix)) return;
                    usedIds.add(value);
                    // ID detail multi-barang berbentuk OT-YYMM-0001-D01.
                    // Ambil nomor induk agar semua detail dihitung sebagai satu transaksi.
                    const match = value.match(/^OT-\d{4}-(\d+)(?:-D\d+)?$/);
                    if (match) maxNumber = Math.max(maxNumber, Number(match[1]));
                });
            });
            let nextNumber = maxNumber + 1;
            let candidate = `${prefix}${String(nextNumber).padStart(4, '0')}`;
            while (usedIds.has(candidate)) {
                nextNumber++;
                candidate = `${prefix}${String(nextNumber).padStart(4, '0')}`;
            }
            return candidate;
        };

        window.generatePoSequentialId = function() {
            const count = (window.gudangAppDb.po ? window.gudangAppDb.po.length : 0) + 1;
            const now = new Date();
            const yy = String(now.getFullYear()).slice(-2);
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const used = new Set((window.gudangAppDb.po||[]).map(r=>String(r.id||'').toUpperCase()));
            let next=count; let candidate=`POC-${yy}${mm}-${String(next).padStart(4,'0')}`;
            while (used.has(candidate) || Array.from({length:20},(_,i)=>`${candidate}-${String(i+2).padStart(2,'0')}`).some(x=>used.has(x))) {
                next++; candidate=`POC-${yy}${mm}-${String(next).padStart(4,'0')}`;
            }
            return candidate;
        };

        window.generateSampelSequentialId = function() {
            const count = (window.gudangAppDb.sampel ? window.gudangAppDb.sampel.length : 0) + 1;
            const now = new Date();
            const yy = String(now.getFullYear()).slice(-2);
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            return `SMP-${yy}${mm}-${String(count).padStart(4, '0')}`;
        };

        // Master CRUD
        window.saveMasterItem = async function(e) {
            e.preventDefault();
            const role = window.gudangAppDb.currentUser?.role;
            if (!['admin','superadmin'].includes(role)) {
                showToast('Hanya Admin dan Super Admin yang dapat mengelola Master Barang.', 'error');
                return;
            }
            const id = document.getElementById('master-id').value.trim().toUpperCase();
            const nama = document.getElementById('master-nama').value.trim().toUpperCase();
            const jenis = document.getElementById('master-jenis').value;
            const lebar = document.getElementById('master-lebar').value;
            const ukuran = document.getElementById('master-ukuran').value;
            const beratRaw = document.getElementById('master-berat').value.trim();
            // Berat menerima angka bulat atau desimal dengan TITIK, contoh 45 atau 45.5.
            if (!/^\d+(?:\.\d+)?$/.test(beratRaw)) {
                showToast('Berat harus berupa angka. Gunakan titik (.) untuk desimal, contoh 45.5.', 'error');
                document.getElementById('master-berat').focus();
                return;
            }
            const berat = Number(beratRaw);
            const satuan = document.getElementById('master-satuan').value;
            const min = Number(document.getElementById('master-min').value) || 0;
            const stok = Number(document.getElementById('master-stok').value) || 0;
            const isEdit = document.getElementById('master-edit-mode').value === 'true';
            if (!id || !nama || !jenis || !satuan || berat < 0 || min < 0 || stok < 0) {
                showToast('Lengkapi Master Barang dan pastikan nilai angka tidak negatif.', 'error'); return;
            }
            const existing = window.gudangAppDb.items.find(x => String(x.id).toUpperCase() === id);
            if ((!isEdit && existing) || (isEdit && !existing)) {
                showToast(existing ? `ID Barang ${id} sudah digunakan.` : `Barang ${id} tidak ditemukan.`, 'error'); return;
            }
            if (isEdit) {
                Object.assign(existing, { nama, jenis, lebar, ukuran, berat, satuan, min });
                // Stok tidak boleh diedit melalui Master Barang.
            } else {
                window.gudangAppDb.items.unshift({ id, nama, jenis, lebar, ukuran, berat, satuan, min, stok });
            }
            const saved = await saveCloudDB();
            if (saved) {
                resetMasterForm();
                showToast(isEdit ? `Barang ${id} berhasil diperbarui.` : `Barang ${id} berhasil ditambahkan.`);
            } else {
                showToast(`Perubahan Master Barang ${id} belum dikonfirmasi Worker. Jangan kirim ulang sebelum memeriksa daftar.`, 'error');
            }
        };

        window.editMasterItem = function(id) {
            if (window.gudangAppDb.currentUser?.role === 'viewer') return;
            const item = window.gudangAppDb.items.find(x => x.id === id);
            if (!item) return;

            document.getElementById('master-edit-mode').value = 'true';
            document.getElementById('master-id').value = item.id;
            document.getElementById('master-id').disabled = true;
            document.getElementById('master-nama').value = item.nama;
            document.getElementById('master-jenis').value = item.jenis || '';
            document.getElementById('master-lebar').value = item.lebar || '';
            document.getElementById('master-ukuran').value = item.ukuran || '';
            document.getElementById('master-berat').value = item.berat || 0;
            document.getElementById('master-satuan').value = item.satuan || 'PCS';
            document.getElementById('master-min').value = item.min || 50;
            document.getElementById('master-stok').value = item.stok || 0;
            document.getElementById('master-form-title').innerHTML = `<i data-lucide="edit" class="w-4 h-4 text-orange-400"></i> EDIT MASTER BARANG (${id})`;
            lucide.createIcons();
        };

        window.deleteMasterItem = function(id) {
            if (!['admin','superadmin'].includes(window.gudangAppDb.currentUser?.role)) {
                showToast('Hanya Admin dan Super Admin yang dapat menghapus Master Barang.', 'error'); return;
            }
            const record = window.gudangAppDb.items.find(x => x.id === id);
            if (!record) { showToast('Data barang tidak ditemukan.', 'error'); return; }
            showConfirm('Konfirmasi Hapus Master Barang', `Anda akan menghapus data Master Barang dengan ID ${id}.`, async () => {
                window.gudangAppDb.items = window.gudangAppDb.items.filter(x => x.id !== id);
                const saved = await saveCloudDB();
                if (saved) showToast(`Barang ${id} berhasil dihapus dan dikonfirmasi Worker.`, 'warning');
                else showToast(`Penghapusan ${id} belum dikonfirmasi Worker. Periksa kembali data.`, 'error');
            }, { record, confirmLabel:'Ya, Hapus Barang', warning:'Data Master Barang akan dihapus dari daftar inventory. Pastikan tidak ada transaksi yang masih membutuhkan data ini.' });
        };

        window.resetMasterForm = function() {
            document.getElementById('form-master').reset();
            document.getElementById('master-edit-mode').value = 'false';
            document.getElementById('master-id').disabled = false;
            document.getElementById('master-id').value = '';
            document.getElementById('master-form-title').innerHTML = `<i data-lucide="package-plus" class="w-4 h-4 text-orange-400"></i> TAMBAH MASTER BARANG`;
            lucide.createIcons();
        };

        window.renderMasterTable = function() {
            const q = document.getElementById('search-master')?.value.toLowerCase() || '';
            const tbody = document.getElementById('master-table-body');
            const badgeTotal = document.getElementById('master-total-badge');
            const isViewer = ['viewer','staff'].includes(window.gudangAppDb.currentUser?.role);

            const filtered = window.gudangAppDb.items.filter(i => 
                i.id.toLowerCase().includes(q) || i.nama.toLowerCase().includes(q) || i.jenis.toLowerCase().includes(q)
            );

            if (badgeTotal) badgeTotal.textContent = `${filtered.length} Item terdaftar`;

            const renderedMasterRows = filtered.map((i, index) => {
                const isLow = i.stok < i.min;
                const isCritical = isLow && i.stok < (i.min * 0.5);
                const blinkClass = isLow
                    ? (isCritical
                        ? 'blink-low-stock-red text-rose-400 font-bold'
                        : 'blink-low-stock-orange text-amber-400 font-bold')
                    : '';
                return `
                    <tr class="hover:bg-white/5">
                        <td class="py-3 px-2 text-center opacity-70 font-mono">${index + 1}</td>
                        <td class="py-3 px-3 font-mono font-semibold theme-accent-text">${i.transactionId || i.groupId || i.id}</td>
                        <td class="py-3 px-3 font-medium">${window.displayItemName(i.id, i.nama)}</td>
                        <td class="py-3 px-3 opacity-80">${i.jenis}</td>
                        <td class="py-3 px-2 opacity-80">${i.lebar || '-'}</td>
                        <td class="py-3 px-2 opacity-80">${i.ukuran || '-'}</td>
                        <td class="py-3 px-2 opacity-80 font-mono">${i.berat || 0} gr</td>
                        <td class="py-3 px-2 opacity-80">${i.satuan}</td>
                        <td class="py-3 px-3 text-right font-mono ${blinkClass}">${i.stok.toLocaleString('id-ID')}</td>
                        <td class="py-3 px-3 text-right font-mono opacity-70">${i.min.toLocaleString('id-ID')}</td>
                        ${!isViewer ? `
                            <td class="py-3 px-3 text-center flex items-center justify-center gap-1.5">
                                <button onclick="editMasterItem('${i.id}')" class="px-2 py-1 rounded bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 font-semibold inline-flex items-center gap-1">Edit</button>
                                <button onclick="deleteMasterItem('${i.id}')" class="px-2 py-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 font-semibold inline-flex items-center gap-1">Hapus</button>
                            </td>
                        ` : ''}
                    </tr>
                `;
            }).join('') || `<tr><td colspan="${isViewer ? 10 : 11}" class="py-6 text-center opacity-50">Tidak ada data master barang.</td></tr>`;
            if (tbody.innerHTML !== renderedMasterRows) tbody.innerHTML = renderedMasterRows;
            lucide.createIcons();
        };

        // Mode edit transaksi: hanya mengisi form; perubahan stok selalu dihitung Worker.
        function beginTransactionEdit(formId, modeId, values) {
            const form = document.getElementById(formId);
            if (!form) return;
            Object.entries(values).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el) el.value = value ?? '';
            });
            document.getElementById(modeId).value = 'true';
            form.scrollIntoView({ behavior: 'smooth', block: 'center' });
            showToast('Mode edit aktif. Periksa data lalu simpan perubahan.', 'info');
        }
        window.editPoItem = function(id) {
            if (window.gudangAppDb.currentUser?.role === 'viewer') return;
            const r = window.gudangAppDb.po.find(x => String(x.id) === String(id)); if (!r) return;
            document.getElementById('form-po').reset();
            document.getElementById('po-items-container').innerHTML = '';
            document.getElementById('po-id').value = r.id;
            document.getElementById('po-no-customer').value = r.noPoCustomer || '';
            document.getElementById('po-tanggal').value = r.tanggal || '';
            document.getElementById('po-customer').value = r.customer || '';
            addPoItemRow({ barangId:r.barangId, qty:r.qty, siapKirim:r.siapKirim ?? Math.max(0, Number(r.qty||0)-Number(r.terkirim||0)) });
            document.getElementById('po-edit-mode').value = 'true';
            document.getElementById('po-form-title').innerHTML = '<i data-lucide="pencil" class="w-4 h-4 text-orange-400"></i> EDIT DETAIL PO';
            document.getElementById('form-po').scrollIntoView({behavior:'smooth',block:'center'});
            lucide.createIcons();
            showToast('Mode edit detail PO aktif.', 'info');
        };
        window.editMasukItem = function(id) {
            if (window.gudangAppDb.currentUser?.role === 'viewer') return;
            const r = window.gudangAppDb.masuk.find(x => String(x.id) === String(id)); if (!r) return;
            beginTransactionEdit('form-masuk','masuk-edit-mode', {'masuk-id':r.id,'masuk-tanggal':r.tanggal,'masuk-barang':r.barangId,'masuk-qty':r.qty,'masuk-supplier':r.supplier});
            window.updateMasukItemInfo?.();
        };
        window.editKeluarItem = function(id) {
            if (window.gudangAppDb.currentUser?.role === 'viewer') return;
            const r = window.gudangAppDb.keluar.find(x => String(x.id) === String(id)); if (!r) return;
            const po=window.gudangAppDb.po.find(p=>p.id===r.poRef);
            if(po){const groupKey=`${String(po.customer||'').toUpperCase()}|${String(po.noPoCustomer||po.id).toUpperCase()}`;document.getElementById('keluar-po-group').value=groupKey;}
            beginTransactionEdit('form-keluar','keluar-edit-mode', {'keluar-id':r.id,'keluar-tanggal':r.tanggal,'keluar-po-ref':r.poRef,'keluar-barang':r.barangId,'keluar-qty':r.qty,'keluar-tujuan':r.tujuan});
            // Tandai grup agar auto-fill tidak mengganti tujuan historis saat edit.
            const groupSelect = document.getElementById('keluar-po-group');
            if (groupSelect) groupSelect.dataset.customerGroup = groupSelect.value;
            populatePoItemOptions();
            document.getElementById('keluar-tujuan').value = r.tujuan || po?.customer || '';
            document.querySelectorAll('#keluar-items-container [data-keluar-row]').forEach(card => {
                const input = card.querySelector('[data-keluar-qty]');
                if (input) input.value = card.dataset.poRef === r.poRef ? String(r.qty) : '0';
            });
            updateKeluarBatchTotal(); updateKeluarFromPo();
        };
        window.editSampelItem = function(id) {
            if (window.gudangAppDb.currentUser?.role === 'viewer') return;
            const r = (window.gudangAppDb.sampel||[]).find(x => String(x.id) === String(id)); if (!r) return;
            beginTransactionEdit('form-sampel','sampel-edit-mode', {'sampel-id':r.id,'sampel-tanggal':r.tanggal,'sampel-customer':r.customer,'sampel-nama':r.nama,'sampel-kategori':r.kategori,'sampel-lebar':r.lebar,'sampel-ukuran':r.ukuran,'sampel-berat':r.berat,'sampel-tebal':r.tebal});
        };
        window.editReturItem = function(id) {
            if (window.gudangAppDb.currentUser?.role === 'viewer') return;
            const r = (window.gudangAppDb.retur||[]).find(x => String(x.id) === String(id)); if (!r) return;
            beginTransactionEdit('form-retur','retur-edit-mode', {'retur-id':r.id,'retur-tanggal':r.tanggal,'retur-barang':r.barangId,'retur-keluar-ref':r.keluarRef,'retur-qty':r.qty,'retur-keterangan':r.keterangan});
            window.updateReturReferenceOptions?.();
            document.getElementById('retur-keluar-ref').value = r.keluarRef || '';
        };

        // Barang Masuk CRUD
        window.updateMasukItemInfo = function() {
            const barangId = document.getElementById('masuk-barang')?.value;
            const item = window.gudangAppDb.items.find(x => x.id === barangId);
            document.getElementById('info-masuk-jenis').textContent = item ? item.jenis : '-';
            document.getElementById('info-masuk-satuan').textContent = item ? item.satuan : '-';
        };

        window.saveMasukItem = async function(e) {
            e.preventDefault();
            if (window.gudangAppDb.currentUser?.role === 'viewer') return;

            const isEdit = document.getElementById('masuk-edit-mode').value === 'true';
            const id = isEdit
                ? document.getElementById('masuk-id').value.trim().toUpperCase()
                : generateMasukSequentialId();
            document.getElementById('masuk-id').value = id;
            const tanggal = document.getElementById('masuk-tanggal').value;
            const barangId = document.getElementById('masuk-barang').value;
            const qty = parseInt(document.getElementById('masuk-qty').value) || 0;
            const supplier = document.getElementById('masuk-supplier').value.trim().toUpperCase();
            const username = window.gudangAppDb.currentUser?.name || 'Administrator';

            const item = window.gudangAppDb.items.find(x => x.id === barangId);
            if (!id || !tanggal || !barangId || !supplier || !Number.isInteger(qty) || qty <= 0) {
                showToast('Lengkapi data Barang Masuk dan pastikan Qty lebih dari nol.', 'error');
                return;
            }
            if (!item) {
                showToast('Barang tidak ditemukan di Master Barang.', 'error');
                return;
            }
            if (document.getElementById('masuk-edit-mode').value === 'true') {
                try {
                    await sendOperation('masuk.update', { id, record: { tanggal, barangId, nama:item.nama, jenis:item.jenis, lebar:item.lebar||'', ukuran:item.ukuran||'', satuan:item.satuan, qty, supplier } });
                    window.refreshAllViews?.(); resetMasukForm(); showToast('Barang Masuk berhasil diperbarui. Stok dikoreksi otomatis oleh Worker.');
                } catch (error) { showToast(`Edit Barang Masuk gagal: ${error.message}`, 'error'); }
                return;
            }
            if (window.gudangAppDb.masuk.some(x => String(x.id).toUpperCase() === id)) {
                showToast('ID transaksi Barang Masuk sudah digunakan.', 'error');
                return;
            }

            // Mutasi lokal hanya sebagai draft optimistis. Worker menjadi sumber kebenaran.
            item.stok = Number(item.stok || 0) + qty;
            window.gudangAppDb.masuk.unshift({
                id, tanggal, barangId, nama: item.nama, jenis: item.jenis,
                lebar: item.lebar || '', ukuran: item.ukuran || '', satuan: item.satuan, qty, supplier, user: username
            });

            const saved = await saveCloudDB();
            if (saved) {
                resetMasukForm();
                showToast('Transaksi masuk berhasil disimpan dan dikonfirmasi Worker!');
            } else {
                showToast('Transaksi masuk belum terkonfirmasi tersimpan di cloud. Periksa riwayat dan stok sebelum mencoba ulang.', 'error');
            }
        };

        window.deleteMasukItem = function(id) {
            if (window.gudangAppDb.currentUser?.role === 'viewer') return;
            const record = window.gudangAppDb.masuk.find(x => x.id === id);
            if (!record) { showToast('Transaksi Barang Masuk tidak ditemukan.', 'error'); return; }
            showConfirm('Konfirmasi Hapus Barang Masuk', `Anda akan menghapus transaksi Barang Masuk ${id}.`, async () => {
                const m = window.gudangAppDb.masuk.find(x => x.id === id);
                if (!m) return;
                window.gudangAppDb.masuk = window.gudangAppDb.masuk.filter(x => x.id !== id);
                const saved = await saveCloudDB();
                if (saved) showToast('Barang Masuk dihapus dan stok dikoreksi oleh Worker.', 'warning');
                else showToast('Penghapusan Barang Masuk belum dikonfirmasi Worker. Periksa kembali data.', 'error');
            }, { record, confirmLabel:'Ya, Hapus Transaksi', warning:'Menghapus transaksi Barang Masuk dapat memengaruhi perhitungan stok. Perubahan stok akan diproses oleh Worker.' });
        };

        window.resetMasukForm = function() {
            document.getElementById('form-masuk').reset();
            document.getElementById('masuk-edit-mode').value = 'false';
            document.getElementById('masuk-id').value = generateMasukSequentialId();
            document.getElementById('masuk-tanggal').valueAsDate = new Date();
            document.getElementById('info-masuk-jenis').textContent = '-';
            document.getElementById('info-masuk-satuan').textContent = '-';
        };

        window.renderMasukTable = function() {
            const q = document.getElementById('search-masuk')?.value.toLowerCase() || '';
            const tbody = document.getElementById('masuk-table-body');
            const badgeTotal = document.getElementById('masuk-total-badge');
            const isViewer = window.gudangAppDb.currentUser?.role === 'viewer';

            const filtered = window.gudangAppDb.masuk.filter(i => 
                i.id.toLowerCase().includes(q) || i.nama.toLowerCase().includes(q) || i.supplier.toLowerCase().includes(q)
            );
            if (badgeTotal) badgeTotal.textContent = `${new Set(filtered.map(i => String(i.transactionId||i.groupId||i.id))).size} Surat Jalan · ${filtered.length} Detail Barang`;

            const renderedMasukRows = filtered.map((i, index) => `
                <tr class="hover:bg-white/5">
                    <td class="py-3 px-2 text-center opacity-70 font-mono">${index + 1}</td>
                    <td class="py-3 px-3 font-mono font-semibold theme-accent-text">${i.id}</td>
                    <td class="py-3 px-3 opacity-80">${i.tanggal}</td>
                    <td class="py-3 px-3 font-mono opacity-80">${i.barangId}</td>
                    <td class="py-3 px-3 font-medium">${window.displayItemName(i.id, i.nama)}</td>
                    <td class="py-3 px-3 opacity-80">${i.jenis}</td>
                    <td class="py-3 px-2 opacity-80">${i.lebar || '-'}</td>
                    <td class="py-3 px-2 opacity-80">${i.ukuran || '-'}</td>
                    <td class="py-3 px-2 opacity-80">${i.satuan}</td>
                    <td class="py-3 px-3 text-right font-mono font-bold text-emerald-400">+${i.qty.toLocaleString('id-ID')}</td>
                    <td class="py-3 px-3 font-medium">${i.supplier}</td>
                    ${!isViewer ? `
                        <td class="py-3 px-3 text-center">
                            <button onclick="editMasukItem('${i.id}')" class="px-2 py-1 rounded bg-sky-500/20 text-sky-300 text-xs font-semibold mr-1">Edit</button>
                            <button onclick="deleteMasukItem('${i.id}')" class="px-2 py-1 rounded bg-rose-500/20 text-rose-400 text-xs font-semibold">Hapus</button>
                        </td>
                    ` : ''}
                </tr>
            `).join('') || `<tr><td colspan="${isViewer ? 11 : 12}" class="py-6 text-center opacity-50">Tidak ada riwayat.</td></tr>`;
            if (tbody.innerHTML !== renderedMasukRows) tbody.innerHTML = renderedMasukRows;
            lucide.createIcons();
        };

        // Barang Keluar CRUD
        window.updateKeluarFromPo = function() {
            const poId = document.getElementById('keluar-po-ref')?.value;
            const po = (window.gudangAppDb.po || []).find(x => x.id === poId);
            if (!po) return;
            const item = (window.gudangAppDb.items || []).find(x => x.id === po.barangId);
            const old = document.getElementById('keluar-edit-mode')?.value === 'true'
                ? window.gudangAppDb.keluar.find(x => x.id === document.getElementById('keluar-id')?.value) : null;
            const ready = getPoReadyQty(po) + ((old && old.poRef === po.id) ? Number(old.qty||0) : 0);
            const stock = Number(item?.stok||0) + ((old && old.barangId === po.barangId) ? Number(old.qty||0) : 0);
            const max = Math.max(0, Math.min(ready, stock, Number(po.qty||0)-Number(po.terkirim||0)+((old && old.poRef===po.id)?Number(old.qty||0):0)));
            const itemSelect = document.getElementById('keluar-barang');
            if (itemSelect) itemSelect.value = po.barangId;
            const qtyInput = document.getElementById('keluar-qty');
            if (qtyInput) qtyInput.max = String(max);
            const info = document.getElementById('keluar-po-ready-info');
            if (info) info.textContent = `Detail edit ${po.nama||po.barangId} · Maksimal: ${max}`;
        };

        window.saveKeluarItem = async function(e) {
            e.preventDefault();
            if (window.gudangAppDb.currentUser?.role === 'viewer') return;
            const isEdit = document.getElementById('keluar-edit-mode').value === 'true';
            const baseId = isEdit
                ? document.getElementById('keluar-id').value.trim().toUpperCase()
                : generateKeluarSequentialId();
            document.getElementById('keluar-id').value = baseId;
            const tanggal = document.getElementById('keluar-tanggal').value;
            const tujuan = document.getElementById('keluar-tujuan').value.trim().toUpperCase();
            const username = window.gudangAppDb.currentUser?.name || 'Administrator';
            const cards = [...document.querySelectorAll('#keluar-items-container [data-keluar-row]')];
            const selected = cards.map(card => ({
                poRef: card.dataset.poRef,
                barangId: card.dataset.barangId,
                qty: Number(card.querySelector('[data-keluar-qty]')?.value || 0)
            })).filter(row => row.qty > 0);
            if (!baseId || !tanggal || !tujuan) { showToast('Lengkapi ID transaksi, tanggal, dan tujuan.', 'error'); return; }
            if (!selected.length) { showToast('Isi Qty minimal satu barang yang akan dikirim.', 'error'); return; }
            if (selected.some(r => !Number.isSafeInteger(r.qty) || r.qty <= 0)) { showToast('Qty setiap barang harus bilangan bulat lebih dari nol.', 'error'); return; }

            // Validasi UI sebelum Worker; Worker tetap melakukan validasi final secara atomik.
            for (const row of selected) {
                const po = (window.gudangAppDb.po||[]).find(p => p.id === row.poRef);
                const item = (window.gudangAppDb.items||[]).find(i => i.id === row.barangId);
                if (!po || !item || String(po.barangId) !== String(row.barangId)) { showToast('Referensi PO/barang tidak valid.', 'error'); return; }
                let ready = getPoReadyQty(po), stock = Number(item.stok||0), remain = Math.max(0, Number(po.qty||0)-Number(po.terkirim||0));
                if (isEdit) {
                    const old = window.gudangAppDb.keluar.find(x => x.id === baseId);
                    if (old && old.poRef === po.id) { ready += Number(old.qty||0); remain += Number(old.qty||0); }
                    if (old && old.barangId === item.id) stock += Number(old.qty||0);
                }
                const max = Math.max(0, Math.min(ready, stock, remain));
                if (row.qty > max) { showToast(`${item.nama}: Qty ${row.qty} melebihi batas maksimal ${max}.`, 'error'); return; }
            }

            if (isEdit) {
                if (selected.length !== 1) { showToast('Mode edit hanya boleh mengubah satu detail transaksi. Gunakan transaksi baru untuk multi-barang.', 'error'); return; }
                const row = selected[0];
                const item = window.gudangAppDb.items.find(x => x.id === row.barangId);
                try {
                    await sendOperation('keluar.update', { id: baseId, record: { tanggal, poRef: row.poRef, barangId: row.barangId, nama:item.nama, jenis:item.jenis, lebar:item.lebar||'', ukuran:item.ukuran||'', satuan:item.satuan, qty:row.qty, tujuan } });
                    window.refreshAllViews?.(); resetKeluarForm(); showToast('Detail Barang Keluar berhasil diperbarui. Stok dan realisasi PO dikoreksi Worker.');
                } catch (error) { showToast(`Edit Barang Keluar gagal: ${error.message}`, 'error'); }
                return;
            }

            const duplicateGroup = (window.gudangAppDb.keluar||[]).some(x => String(x.transactionId||x.groupId||x.id).toUpperCase() === baseId);
            if (duplicateGroup) { showToast('ID transaksi/surat jalan sudah digunakan.', 'error'); return; }
            const poGroups = new Set(selected.map(r => {
                const po = window.gudangAppDb.po.find(p => p.id === r.poRef);
                return `${String(po?.customer||'').toUpperCase()}|${String(po?.noPoCustomer||po?.id||'').toUpperCase()}`;
            }));
            if (poGroups.size !== 1) { showToast('Semua barang dalam satu transaksi harus berasal dari nomor PO dan customer yang sama.', 'error'); return; }
            const details = selected.map((row, index) => {
                const item = window.gudangAppDb.items.find(x => x.id === row.barangId);
                const detailId = selected.length === 1 ? baseId : `${baseId}-D${String(index+1).padStart(2,'0')}`;
                return { id:detailId, poRef:row.poRef, barangId:row.barangId, qty:row.qty, nama:item.nama, jenis:item.jenis, lebar:item.lebar||'', ukuran:item.ukuran||'', satuan:item.satuan };
            });
            try {
                await sendOperation('keluar.batchCreate', { id:baseId, tanggal, tujuan, user:username, transactionId:baseId, items:details });
                window.refreshAllViews?.();
                resetKeluarForm();
                showToast(`Transaksi ${baseId} berhasil disimpan: ${details.length} jenis barang. Stok dan Qty Siap Dikirim sudah diperbarui.`);
            } catch (error) {
                showToast(`Transaksi Barang Keluar gagal: ${error.message}`, 'error');
            }
        };

        window.deleteKeluarItem = function(id) {
            if (window.gudangAppDb.currentUser?.role === 'viewer') return;
            const record = window.gudangAppDb.keluar.find(x => x.id === id);
            if (!record) { showToast('Transaksi Barang Keluar tidak ditemukan.', 'error'); return; }
            showConfirm('Konfirmasi Hapus Barang Keluar', `Anda akan menghapus transaksi Barang Keluar ${id}.`, async () => {
                const k = window.gudangAppDb.keluar.find(x => x.id === id);
                if (k) {
                    const item = window.gudangAppDb.items.find(x => x.id === k.barangId);
                    if (item) item.stok += k.qty;
                    if (k.poRef) {
                        const po = window.gudangAppDb.po.find(x => x.id === k.poRef);
                        if (po) {
                            po.terkirim = Math.max(0, (po.terkirim || 0) - k.qty);
                            po.status = po.terkirim > 0 ? 'PARTIAL' : 'OPEN';
                        }
                    }
                    window.gudangAppDb.keluar = window.gudangAppDb.keluar.filter(x => x.id !== id);
                    const saved = await saveCloudDB();
                    if (saved) showToast('Transaksi Barang Keluar berhasil dihapus dan stok/PO dikoreksi Worker.', 'warning');
                    else showToast('Penghapusan belum dikonfirmasi Worker. Periksa kembali data.', 'error');
                }
            }, { record, confirmLabel:'Ya, Hapus Transaksi', warning:'Menghapus Barang Keluar dapat memengaruhi stok dan riwayat pengiriman. Pastikan transaksi yang dipilih sudah benar.' });
        };

        window.resetKeluarForm = function() {
            document.getElementById('form-keluar').reset();
            document.getElementById('keluar-edit-mode').value = 'false';
            document.getElementById('keluar-id').value = generateKeluarSequentialId();
            document.getElementById('keluar-tanggal').valueAsDate = new Date();
            const host = document.getElementById('keluar-items-container'); if (host) host.replaceChildren();
            const groupSelect = document.getElementById('keluar-po-group');
            if (groupSelect) groupSelect.dataset.customerGroup = '';
            const tujuanInput = document.getElementById('keluar-tujuan'); if (tujuanInput) tujuanInput.value = '';
            const info = document.getElementById('keluar-po-ready-info'); if (info) info.textContent = 'Pilih nomor PO untuk menampilkan seluruh barang dan batas siap kirim.';
            updateKeluarBatchTotal();
        };

        window._expandedKeluarGroupKeys = window._expandedKeluarGroupKeys || new Set();
        window.renderKeluarTable = function() {
            const q = document.getElementById('search-keluar')?.value.toLowerCase().trim() || '';
            const tbody = document.getElementById('keluar-table-body');
            const badgeTotal = document.getElementById('keluar-total-badge');
            const isViewer = window.gudangAppDb.currentUser?.role === 'viewer';
            if (!tbody) return;

            // Simpan status detail yang sedang terbuka sebelum tabel dirender ulang.
            tbody.querySelectorAll('tr[data-keluar-group-key]').forEach(row => {
                const key = row.dataset.keluarGroupKey;
                if (!key) return;
                if (row.classList.contains('hidden')) window._expandedKeluarGroupKeys.delete(key);
                else window._expandedKeluarGroupKeys.add(key);
            });

            const allGroups = new Map();
            (window.gudangAppDb.keluar || []).forEach(item => {
                const transactionId = String(item.transactionId || item.groupId || item.id);
                if (!allGroups.has(transactionId)) allGroups.set(transactionId, []);
                allGroups.get(transactionId).push(item);
            });

            const groups = [...allGroups.entries()].map(([transactionId, rows]) => ({
                transactionId,
                rows: rows.slice().sort((a,b) => String(a.id).localeCompare(String(b.id), 'id')),
                head: rows[0]
            })).filter(group => {
                if (!q) return true;
                return [group.transactionId, group.head.tanggal, group.head.tujuan,
                    ...group.rows.flatMap(r => [r.id, r.barangId, r.nama, r.jenis, r.poRef])]
                    .some(value => String(value || '').toLowerCase().includes(q));
            }).sort((a,b) => String(b.head.tanggal||'').localeCompare(String(a.head.tanggal||'')) ||
                              String(b.transactionId).localeCompare(String(a.transactionId)));

            const totalDetails = groups.reduce((sum, group) => sum + group.rows.length, 0);
            if (badgeTotal) badgeTotal.textContent = `${groups.length} Transaksi / Surat Jalan • ${totalDetails} detail barang`;

            const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
                '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
            }[ch]));

            const renderedKeluarRows = groups.map((group, index) => {
                const token = encodeURIComponent(group.transactionId).replace(/'/g, '%27');
                const expanded = window._expandedKeluarGroupKeys.has(token);
                const totalQty = group.rows.reduce((sum, row) => sum + Number(row.qty || 0), 0);
                const poRefs = [...new Set(group.rows.map(row => {
                    const po = (window.gudangAppDb.po || []).find(p => String(p.id) === String(row.poRef));
                    return po?.noPoCustomer || row.poRef || '-';
                }))];
                const detailRows = group.rows.map((row, detailIndex) => `
                    <tr class="border-t border-white/5 hover:bg-white/5">
                        <td class="p-2 text-center">${detailIndex + 1}</td>
                        <td class="p-2 font-mono">${esc(row.id)}</td>
                        <td class="p-2 font-mono">${esc(row.barangId)}</td>
                        <td class="p-2 font-medium">${esc(window.displayItemName(row.barangId, row.nama))}</td>
                        <td class="p-2">${esc(row.jenis || '-')}</td>
                        <td class="p-2">${esc(row.lebar || '-')}</td>
                        <td class="p-2">${esc(row.ukuran || '-')}</td>
                        <td class="p-2">${esc(row.satuan || '-')}</td>
                        <td class="p-2 text-right font-mono font-bold text-rose-400">-${Number(row.qty || 0).toLocaleString('id-ID')}</td>
                        <td class="p-2 font-mono">${esc((window.gudangAppDb.po || []).find(p => String(p.id) === String(row.poRef))?.noPoCustomer || row.poRef || '-')}</td>
                        <td class="p-2 text-center">${!isViewer ? `
                            <button onclick="editKeluarItem('${esc(row.id)}')" class="px-2 py-1 rounded bg-sky-500/20 text-sky-300 text-xs font-semibold mr-1">Edit</button>
                            <button onclick="deleteKeluarItem('${esc(row.id)}')" class="px-2 py-1 rounded bg-rose-500/20 text-rose-400 text-xs font-semibold">Hapus</button>
                        ` : '-'}</td>
                    </tr>
                `).join('');

                return `
                    <tr class="hover:bg-white/5 border-b border-white/5">
                        <td class="py-3 px-2 text-center opacity-70 font-mono">${index + 1}</td>
                        <td class="py-3 px-3 font-mono font-semibold theme-accent-text">${esc(group.transactionId)}</td>
                        <td class="py-3 px-3 opacity-80">${esc(group.head.tanggal || '-')}</td>
                        <td class="py-3 px-3 text-center">${group.rows.length} barang</td>
                        <td class="py-3 px-3 text-right font-mono font-bold text-rose-400">-${totalQty.toLocaleString('id-ID')}</td>
                        <td class="py-3 px-3 font-medium">${esc(group.head.tujuan || '-')}</td>
                        <td class="py-3 px-3 font-mono opacity-80">${esc(poRefs.join(', '))}</td>
                        <td class="py-3 px-3 text-center"><button onclick="toggleKeluarDetails('${token}')" class="px-3 py-1 rounded bg-indigo-500/20 text-indigo-300 text-xs font-semibold">${expanded ? 'Tutup' : 'Detail'} (${group.rows.length})</button></td>
                        <td class="py-3 px-3 text-center">${isViewer ? '-' : '<span class="text-[10px] text-gray-400">Aksi per barang</span>'}</td>
                    </tr>
                    <tr id="keluar-detail-${token}" data-keluar-group-key="${token}" class="${expanded ? '' : 'hidden'}">
                        <td colspan="9" class="p-2 bg-black/10">
                            <div class="rounded-xl border border-white/10 overflow-x-auto">
                                <table class="w-full text-xs min-w-[900px]">
                                    <thead class="bg-white/5 text-gray-400"><tr>
                                        <th class="p-2 text-center">No</th><th class="p-2 text-left">ID Detail</th><th class="p-2 text-left">ID Barang</th><th class="p-2 text-left">Nama Barang</th><th class="p-2 text-left">Kategori</th><th class="p-2 text-left">Lebar</th><th class="p-2 text-left">Ukuran</th><th class="p-2 text-left">Satuan</th><th class="p-2 text-right">Qty Keluar</th><th class="p-2 text-left">No PO Ref</th><th class="p-2 text-center">Aksi</th>
                                    </tr></thead>
                                    <tbody>${detailRows}</tbody>
                                    <tfoot class="bg-white/5 border-t border-white/10"><tr><td colspan="8" class="p-2 text-right font-semibold">Total Qty Surat Jalan</td><td class="p-2 text-right font-mono font-bold text-emerald-300">${totalQty.toLocaleString('id-ID')}</td><td colspan="2"></td></tr></tfoot>
                                </table>
                            </div>
                        </td>
                    </tr>`;
            }).join('') || `<tr><td colspan="9" class="py-6 text-center opacity-50">Tidak ada riwayat.</td></tr>`;
            if (tbody.innerHTML !== renderedKeluarRows) tbody.innerHTML = renderedKeluarRows;
            lucide.createIcons();
        };

        window.toggleKeluarDetails = function(token) {
            const row = document.getElementById(`keluar-detail-${token}`);
            if (!row) return;
            const willOpen = row.classList.contains('hidden');
            row.classList.toggle('hidden', !willOpen);
            if (willOpen) window._expandedKeluarGroupKeys.add(token);
            else window._expandedKeluarGroupKeys.delete(token);
        };

        // PO CRUD
        window.addPoItemRow = function(values = {}) {
            const host = document.getElementById('po-items-container');
            if (!host) return;
            const n = host.querySelectorAll('[data-po-item-row]').length + 1;
            const itemOptions = (window.gudangAppDb.items || []).map(i => `<option value="${i.id}">${i.id} - ${i.nama} (${i.jenis||'-'})</option>`).join('');
            const row = document.createElement('div');
            row.className = 'grid grid-cols-1 sm:grid-cols-12 gap-2 p-2 rounded-xl border border-white/10 bg-white/5';
            row.setAttribute('data-po-item-row','1');
            row.innerHTML = `
                <div class="sm:col-span-5"><label class="text-[10px] text-gray-400">Barang</label><select ${n===1?'id="po-barang"':''} data-po-field="barangId" required class="w-full bg-dark-700 border border-white/15 rounded-lg px-2 py-2 text-xs"><option value="">-- Pilih Barang --</option>${itemOptions}</select></div>
                <div class="sm:col-span-3"><label class="text-[10px] text-gray-400">Qty PO</label><input ${n===1?'id="po-qty"':''} data-po-field="qty" type="number" min="1" step="1" value="${values.qty ?? 1}" required class="w-full bg-dark-700 border border-white/15 rounded-lg px-2 py-2 text-xs"></div>
                <div class="sm:col-span-3"><label class="text-[10px] text-gray-400">Qty Siap Dikirim</label><input ${n===1?'id="po-siap"':''} data-po-field="siapKirim" type="number" min="0" step="1" value="${values.siapKirim ?? 0}" required class="w-full bg-dark-700 border border-white/15 rounded-lg px-2 py-2 text-xs"></div>
                <div class="sm:col-span-1 flex items-end"><button type="button" onclick="this.closest('[data-po-item-row]').remove(); refreshPoItemRowIds()" class="w-full py-2 rounded-lg bg-rose-500/15 text-rose-300 text-xs" title="Hapus baris">✕</button></div>`;
            host.appendChild(row);
            const select = row.querySelector('[data-po-field="barangId"]'); if (values.barangId) select.value = values.barangId;
            refreshPoItemRowIds();
        };
        window.refreshPoItemRowIds = function() {
            const rows = [...document.querySelectorAll('#po-items-container [data-po-item-row]')];
            rows.forEach((row,i) => {
                row.querySelector('[data-po-field="barangId"]').id = i===0 ? 'po-barang' : `po-barang-${i+1}`;
                row.querySelector('[data-po-field="qty"]').id = i===0 ? 'po-qty' : `po-qty-${i+1}`;
                row.querySelector('[data-po-field="siapKirim"]').id = i===0 ? 'po-siap' : `po-siap-${i+1}`;
            });
        };
        function readPoItemRows() {
            return [...document.querySelectorAll('#po-items-container [data-po-item-row]')].map(row => ({
                barangId: row.querySelector('[data-po-field="barangId"]')?.value || '',
                qty: Number(row.querySelector('[data-po-field="qty"]')?.value || 0),
                siapKirim: Number(row.querySelector('[data-po-field="siapKirim"]')?.value || 0)
            }));
        }
        window.savePoItem = async function(e) {
            e.preventDefault();
            if (window.gudangAppDb.currentUser?.role === 'viewer') { showToast('Viewer hanya dapat melihat data.','error'); return; }
            const id = document.getElementById('po-id').value.trim().toUpperCase();
            const noPoCustomer = document.getElementById('po-no-customer').value.trim().toUpperCase();
            const tanggal = document.getElementById('po-tanggal').value;
            const customer = document.getElementById('po-customer').value.trim().toUpperCase();
            const rows = readPoItemRows();
            if (!id || !noPoCustomer || !tanggal || !customer || !rows.length || rows.some(r => !r.barangId || !Number.isSafeInteger(r.qty) || r.qty<=0 || !Number.isSafeInteger(r.siapKirim) || r.siapKirim<0 || r.siapKirim>r.qty)) {
                showToast('Lengkapi data PO. Qty siap harus 0 sampai Qty PO.','error'); return;
            }
            if (new Set(rows.map(r=>r.barangId)).size !== rows.length) { showToast('Barang yang sama tidak boleh dimasukkan dua kali dalam satu PO.','error'); return; }
            const isEdit = document.getElementById('po-edit-mode').value === 'true';
            try {
                if (isEdit) {
                    if (rows.length !== 1) throw new Error('Mode edit hanya untuk satu detail PO.');
                    const item = window.gudangAppDb.items.find(x=>x.id===rows[0].barangId);
                    if (!item) throw new Error('Barang tidak ditemukan.');
                    await sendOperation('po.update',{id,record:{noPoCustomer,tanggal,customer,barangId:rows[0].barangId,nama:item.nama,jenis:item.jenis,lebar:item.lebar||'',ukuran:item.ukuran||'',satuan:item.satuan,qty:rows[0].qty,siapKirim:rows[0].siapKirim}});
                } else {
                    const items = rows.map((r,i)=>({id:i===0?id:`${id}-${String(i+1).padStart(2,'0')}`, ...r}));
                    await sendOperation('po.batchCreate',{id,noPoCustomer,tanggal,customer,items});
                }
                window.refreshAllViews?.();
                resetPoForm();
                showToast(isEdit?'Detail PO berhasil diperbarui.':'PO multi-barang berhasil disimpan ke Cloud.');
            } catch(error) { showToast(`Simpan PO gagal: ${error.message}`,'error'); }
        };

        window.deletePoItem = function(id) {
            if (window.gudangAppDb.currentUser?.role === 'viewer') return;
            const record = window.gudangAppDb.po.find(x => x.id === id);
            if (!record) { showToast('Data PO tidak ditemukan.', 'error'); return; }
            showConfirm('Konfirmasi Hapus PO Customer', `Anda akan menghapus detail PO ${id}.`, async () => {
                window.gudangAppDb.po = window.gudangAppDb.po.filter(x => x.id !== id);
                const saved = await saveCloudDB();
                if (saved) showToast('PO berhasil dihapus dan dikonfirmasi Worker.', 'warning');
                else showToast('Penghapusan PO belum dikonfirmasi Worker. Periksa kembali data.', 'error');
            }, { record, confirmLabel:'Ya, Hapus PO', warning:'Pastikan PO ini memang boleh dihapus. Penghapusan detail PO tidak dapat dibatalkan dari popup ini.' });
        };

        window.resetPoForm = function() {
            document.getElementById('form-po').reset();
            document.getElementById('po-edit-mode').value = 'false';
            document.getElementById('po-id').value = generatePoSequentialId();
            document.getElementById('po-tanggal').valueAsDate = new Date();
            document.getElementById('po-items-container').innerHTML = '';
            addPoItemRow();
            document.getElementById('po-form-title').innerHTML = '<i data-lucide="file-plus" class="w-4 h-4 text-orange-400"></i> INPUT PO CUSTOMER';
            lucide.createIcons();
        };

        // Simpan status buka/tutup detail PO berdasarkan identitas grup, bukan nomor baris.
        // Dengan demikian Detail tetap terbuka saat tabel dirender ulang oleh Cloud Sync,
        // pencarian, atau setelah Qty Siap Dikirim diperbarui.
        window._expandedPoGroupKeys = window._expandedPoGroupKeys || new Set();
        window.renderPoTable = function() {
            const q = document.getElementById('search-po')?.value.toLowerCase() || '';
            const tbody = document.getElementById('po-table-body');
            const badgeTotal = document.getElementById('po-total-badge');
            if (!tbody) return;
            const expandedKeys = window._expandedPoGroupKeys;
            tbody.querySelectorAll('tr[data-po-group-key]').forEach(row => {
                const key = row.dataset.poGroupKey;
                if (!key) return;
                if (row.classList.contains('hidden')) expandedKeys.delete(key);
                else expandedKeys.add(key);
            });
            const isViewer = window.gudangAppDb.currentUser?.role === 'viewer';
            const groups = new Map();
            (window.gudangAppDb.po||[]).forEach(r => {
                const key = `${String(r.customer||'').toUpperCase()}|${String(r.noPoCustomer||r.id).toUpperCase()}`;
                if (!groups.has(key)) groups.set(key,[]);
                groups.get(key).push(r);
            });
            const allGroups = [...groups.entries()].map(([key,rows])=>({key,rows,head:rows[0]}));
            const filtered = allGroups.filter(g => [g.head.noPoCustomer,g.head.customer,...g.rows.map(r=>r.id),...g.rows.map(r=>r.nama)].some(v=>String(v||'').toLowerCase().includes(q)));
            if (badgeTotal) badgeTotal.textContent = `${filtered.length} PO • ${filtered.reduce((n,g)=>n+g.rows.length,0)} detail barang`;
            const renderedPoRows = filtered.map((g,index)=>{
                const groupToken = encodeURIComponent(g.key).replace(/'/g, '%27');
                const detailExpanded = expandedKeys.has(groupToken);
                const totalQty=g.rows.reduce((s,r)=>s+Number(r.qty||0),0);
                const totalSent=g.rows.reduce((s,r)=>s+Number(r.terkirim||0),0);
                const allClosed=g.rows.every(r=>Number(r.terkirim||0)>=Number(r.qty||0));
                const status=allClosed?'CLOSED':(totalSent>0?'PARTIAL':'OPEN');
                const details=g.rows.map(r=>{
                    const sent=Number(r.terkirim||0), remain=Math.max(0,Number(r.qty||0)-sent);
                    const ready=getPoReadyQty(r);
                    const lineStatus=sent>=Number(r.qty||0)?'CLOSED':(sent>0?'PARTIAL':'OPEN');
                    return `<tr class="bg-black/10 border-t border-white/5"><td class="py-2 px-3 font-mono">${r.id}</td><td class="py-2 px-3">${r.barangId} — ${window.displayItemName(r.barangId, r.nama)}</td><td class="py-2 px-3 text-right">${Number(r.qty||0).toLocaleString('id-ID')}</td><td class="py-2 px-3 text-right text-emerald-300">${ready.toLocaleString('id-ID')}</td><td class="py-2 px-3 text-right">${sent.toLocaleString('id-ID')}</td><td class="py-2 px-3 text-right text-amber-300">${remain.toLocaleString('id-ID')}</td><td class="py-2 px-3 text-center">${lineStatus}</td><td class="py-2 px-3 text-right">${isViewer?ready.toLocaleString('id-ID'):`<input type="number" min="0" max="${Math.min(remain,Number((window.gudangAppDb.items||[]).find(x=>x.id===r.barangId)?.stok||0))}" step="1" value="${ready}" id="ready-${r.id}" class="w-20 bg-dark-700 border border-white/15 rounded px-2 py-1 text-right"><button onclick="updatePoReady('${r.id}')" class="ml-1 px-2 py-1 rounded bg-emerald-500/15 text-emerald-300">Atur</button>`}</td><td class="py-2 px-3 text-center">${!isViewer?`<button onclick="editPoItem('${r.id}')" class="px-2 py-1 rounded bg-sky-500/20 text-sky-300 mr-1">Edit</button><button onclick="deletePoItem('${r.id}')" class="px-2 py-1 rounded bg-rose-500/20 text-rose-300">Hapus</button>`:'-'}</td></tr>`;
                }).join('');
                return `<tr class="hover:bg-white/5"><td class="py-3 px-2 text-center">${index+1}</td><td class="py-3 px-3 font-mono font-semibold">${g.head.noPoCustomer||g.head.id}</td><td class="py-3 px-3">${g.head.tanggal||'-'}</td><td class="py-3 px-3">${g.head.customer||'-'}</td><td class="py-3 px-3 text-center">${g.rows.length}</td><td class="py-3 px-3 text-right font-mono">${totalQty.toLocaleString('id-ID')}</td><td class="py-3 px-3 text-right font-mono text-emerald-300">${totalSent.toLocaleString('id-ID')}</td><td class="py-3 px-3 text-center"><span class="px-2 py-1 rounded text-[10px] font-bold ${status==='CLOSED'?'bg-emerald-500/20 text-emerald-300':'bg-sky-500/20 text-sky-300'}">${status}</span></td><td class="py-3 px-3 text-center"><button onclick="togglePoDetails('${groupToken}')" class="px-3 py-1 rounded bg-indigo-500/20 text-indigo-300 text-xs">Detail (${g.rows.length})</button></td></tr><tr id="po-detail-${groupToken}" data-po-group-key="${groupToken}" class="${detailExpanded?'':'hidden'}"><td colspan="9" class="p-2"><div class="rounded-xl border border-white/10 overflow-x-auto"><table class="w-full text-xs"><thead class="bg-white/5 text-gray-400"><tr><th class="p-2 text-left">ID Detail</th><th class="p-2 text-left">Barang</th><th class="p-2 text-right">Qty PO</th><th class="p-2 text-right">Siap</th><th class="p-2 text-right">Terkirim</th><th class="p-2 text-right">Sisa</th><th class="p-2 text-center">Status</th><th class="p-2 text-right">Atur Siap</th><th class="p-2 text-center">Aksi</th></tr></thead><tbody>${details}</tbody></table></div></td></tr>`;
            }).join('') || `<tr><td colspan="9" class="py-6 text-center opacity-50">Tidak ada PO.</td></tr>`;
            // Polling cloud dapat merender ulang semua tampilan meski isi PO tidak berubah.
            // Jangan menyentuh tbody jika markup identik agar detail terbuka tidak berkedip.
            if (tbody.innerHTML !== renderedPoRows) tbody.innerHTML = renderedPoRows;
            lucide.createIcons();
        };
        window.togglePoDetails = function(groupToken) {
            const row = document.getElementById(`po-detail-${groupToken}`);
            if (!row) return;
            const willOpen = row.classList.contains('hidden');
            row.classList.toggle('hidden', !willOpen);
            if (willOpen) window._expandedPoGroupKeys.add(groupToken);
            else window._expandedPoGroupKeys.delete(groupToken);
        };
        window.updatePoReady = async function(id) {
            const input=document.getElementById(`ready-${id}`); if(!input) return;
            const siapKirim=Number(input.value);
            try { await sendOperation('po.ready.update',{id,siapKirim}); refreshAllViews(); showToast('Qty Siap Dikirim berhasil diperbarui.'); }
            catch(e){ showToast(`Gagal mengatur Qty Siap: ${e.message}`,'error'); }
        };

        // Sampel CRUD
        window.saveSampelItem = async function(e) {
            e.preventDefault();
            if (window.gudangAppDb.currentUser?.role === 'viewer') return;

            const id = document.getElementById('sampel-id').value.trim().toUpperCase();
            const tanggal = document.getElementById('sampel-tanggal').value;
            const customer = document.getElementById('sampel-customer').value.trim().toUpperCase();
            const nama = document.getElementById('sampel-nama').value.trim().toUpperCase();
            const kategori = document.getElementById('sampel-kategori').value;
            const lebar = document.getElementById('sampel-lebar').value;
            const ukuran = document.getElementById('sampel-ukuran').value;
            const berat = parseFloat(document.getElementById('sampel-berat').value) || 0;
            const tebal = document.getElementById('sampel-tebal').value.trim();

            if (!window.gudangAppDb.sampel) window.gudangAppDb.sampel = [];
            if (document.getElementById('sampel-edit-mode').value === 'true') {
                try {
                    await sendOperation('sampel.update', { id, record: { tanggal, customer, nama, kategori, lebar, ukuran, berat, tebal } });
                    window.refreshAllViews?.(); resetSampelForm(); showToast('Data sampel berhasil diperbarui.');
                } catch (error) { showToast(`Edit sampel gagal: ${error.message}`, 'error'); }
                return;
            }
            if ((window.gudangAppDb.sampel || []).some(x => String(x.id).toUpperCase() === id)) {
                showToast('ID Sampel sudah digunakan.', 'error');
                return;
            }
            window.gudangAppDb.sampel.unshift({ id, tanggal, customer, nama, kategori, lebar, ukuran, berat, tebal });
            const saved = await saveCloudDB();
            if (saved) {
                resetSampelForm();
                showToast('Data sampel berhasil disimpan dan dikonfirmasi Worker!');
            } else {
                showToast('Data sampel belum terkonfirmasi tersimpan di Cloud. Periksa riwayat sebelum mencoba ulang.', 'error');
            }
        };

        window.deleteSampelItem = function(id) {
            if (window.gudangAppDb.currentUser?.role === 'viewer') return;
            const record = window.gudangAppDb.sampel.find(x => x.id === id);
            if (!record) { showToast('Data sampel tidak ditemukan.', 'error'); return; }
            showConfirm('Konfirmasi Hapus Data Sampel', `Anda akan menghapus data sampel ${id}.`, async () => {
                window.gudangAppDb.sampel = window.gudangAppDb.sampel.filter(x => x.id !== id);
                const saved = await saveCloudDB();
                if (saved) showToast('Sampel berhasil dihapus dan dikonfirmasi Worker.', 'warning');
                else showToast('Penghapusan Sampel belum dikonfirmasi Worker. Periksa kembali data.', 'error');
            }, { record, confirmLabel:'Ya, Hapus Sampel', warning:'Data sampel akan dihapus dari riwayat dan tidak dapat dipulihkan melalui tombol Batal.' });
        };

        window.resetSampelForm = function() {
            document.getElementById('form-sampel').reset();
            document.getElementById('sampel-edit-mode').value = 'false';
            document.getElementById('sampel-id').value = generateSampelSequentialId();
            document.getElementById('sampel-tanggal').valueAsDate = new Date();
        };

        window.renderSampelTable = function() {
            const q = document.getElementById('search-sampel')?.value.toLowerCase() || '';
            const tbody = document.getElementById('sampel-table-body');
            const badgeTotal = document.getElementById('sampel-total-badge');
            const isViewer = window.gudangAppDb.currentUser?.role === 'viewer';

            const filtered = (window.gudangAppDb.sampel || []).filter(i => 
                i.id.toLowerCase().includes(q) || (i.customer && i.customer.toLowerCase().includes(q)) || i.nama.toLowerCase().includes(q)
            );
            if (badgeTotal) badgeTotal.textContent = `${filtered.length} Sampel`;

            const renderedSampelRows = filtered.map((i, index) => `
                <tr class="hover:bg-white/5">
                    <td class="py-3 px-2 text-center opacity-70 font-mono">${index + 1}</td>
                    <td class="py-3 px-3 font-mono font-semibold theme-accent-text">${i.id}</td>
                    <td class="py-3 px-3 opacity-80">${i.tanggal || '-'}</td>
                    <td class="py-3 px-3 font-medium">${i.customer || '-'}</td>
                    <td class="py-3 px-3 font-medium">${window.displayItemName(i.id, i.nama)}</td>
                    <td class="py-3 px-3 opacity-80">${i.kategori}</td>
                    <td class="py-3 px-2 opacity-80">${i.lebar || '-'}</td>
                    <td class="py-3 px-2 opacity-80">${i.ukuran || '-'}</td>
                    <td class="py-3 px-3 text-right opacity-80 font-mono">${i.berat || 0} gr</td>
                    <td class="py-3 px-3 text-center opacity-80 font-mono">${i.tebal || '-'}</td>
                    ${!isViewer ? `
                        <td class="py-3 px-3 text-center">
                            <button onclick="editSampelItem('${i.id}')" class="px-2 py-1 rounded bg-sky-500/20 text-sky-300 text-xs font-semibold mr-1">Edit</button>
                            <button onclick="deleteSampelItem('${i.id}')" class="px-2 py-1 rounded bg-rose-500/20 text-rose-400 text-xs font-semibold">Hapus</button>
                        </td>
                    ` : ''}
                </tr>
            `).join('') || `<tr><td colspan="${isViewer ? 10 : 11}" class="py-6 text-center opacity-50">Tidak ada data sampel.</td></tr>`;
            if (tbody.innerHTML !== renderedSampelRows) tbody.innerHTML = renderedSampelRows;
            lucide.createIcons();
        };

        // Retur CRUD
        window.getReturAlreadyQty = function(keluarRef) {
            return (window.gudangAppDb.retur || [])
                .filter(r => String(r.keluarRef || '') === String(keluarRef))
                .reduce((sum, r) => sum + (Number(r.qty) || 0), 0);
        };

        window.updateReturReferenceOptions = function() {
            const barangId = document.getElementById('retur-barang')?.value || '';
            const select = document.getElementById('retur-keluar-ref');
            const info = document.getElementById('retur-reference-info');
            if (!select) return;
            const previous = select.value;
            const rows = (window.gudangAppDb.keluar || []).filter(k => {
                if (String(k.barangId) !== String(barangId)) return false;
                let returned = window.getReturAlreadyQty(k.id);
                if (document.getElementById('retur-edit-mode')?.value === 'true') {
                    const editing = (window.gudangAppDb.retur || []).find(r => String(r.id) === String(document.getElementById('retur-id')?.value));
                    if (editing && String(editing.keluarRef) === String(k.id)) returned -= Number(editing.qty) || 0;
                }
                return (Number(k.qty) || 0) - returned > 0;
            });
            select.innerHTML = '<option value="">-- Pilih transaksi keluar asal --</option>' +
                rows.map(k => {
                    const remaining = Math.max(0, (Number(k.qty) || 0) - window.getReturAlreadyQty(k.id));
                    const po = (window.gudangAppDb.po || []).find(p => String(p.id) === String(k.poRef));
                    const label = `${k.id} | ${k.tanggal || '-'} | Qty ${k.qty} | Sisa dapat diretur ${remaining}` +
                        (po ? ` | PO ${po.noPoCustomer || po.id}` : ' | Tanpa PO');
                    return `<option value="${String(k.id).replace(/"/g, '&quot;')}">${label}</option>`;
                }).join('');
            if (rows.some(k => String(k.id) === previous)) select.value = previous;
            if (info) {
                if (!barangId) info.textContent = 'Pilih barang terlebih dahulu untuk melihat transaksi keluar yang bisa diretur.';
                else if (!rows.length) info.textContent = 'Tidak ada transaksi keluar untuk barang ini yang masih memiliki sisa retur.';
                else info.textContent = 'Pilih transaksi asal. PO dan customer akan ditentukan dari transaksi tersebut.';
            }
        };
        window.updateReturReferenceInfo = function() {
            const ref = document.getElementById('retur-keluar-ref')?.value || '';
            const info = document.getElementById('retur-reference-info');
            const qtyInput = document.getElementById('retur-qty');
            const row = (window.gudangAppDb.keluar || []).find(k => String(k.id) === String(ref));
            if (!row) {
                if (info) info.textContent = 'Pilih transaksi keluar asal.';
                return;
            }
            let returned = window.getReturAlreadyQty(ref);
            if (document.getElementById('retur-edit-mode')?.value === 'true') {
                const editing = (window.gudangAppDb.retur || []).find(r => String(r.id) === String(document.getElementById('retur-id')?.value));
                if (editing && String(editing.keluarRef) === String(ref)) returned -= Number(editing.qty) || 0;
            }
            const remaining = Math.max(0, (Number(row.qty) || 0) - returned);
            const po = (window.gudangAppDb.po || []).find(p => String(p.id) === String(row.poRef));
            if (qtyInput) qtyInput.max = String(remaining);
            if (info) info.textContent = `Customer: ${row.tujuan || '-'} | PO: ${po ? (po.noPoCustomer || po.id) : 'Tanpa PO'} | Maksimal retur: ${remaining}`;
        };

        document.getElementById('retur-barang')?.addEventListener('change', () => {
            window.updateReturReferenceOptions();
        });

        window.saveReturItem = async function(e) {
            e.preventDefault();
            if (window.gudangAppDb.currentUser?.role === 'viewer') return;

            const id = document.getElementById('retur-id').value.trim().toUpperCase();
            const tanggal = document.getElementById('retur-tanggal').value;
            const barangId = document.getElementById('retur-barang').value;
            const keluarRef = document.getElementById('retur-keluar-ref').value;
            const qty = parseInt(document.getElementById('retur-qty').value, 10) || 0;
            const keterangan = document.getElementById('retur-keterangan').value.trim().toUpperCase();
            const username = window.gudangAppDb.currentUser?.name || 'Administrator';
            const item = window.gudangAppDb.items.find(x => String(x.id) === String(barangId));
            const keluar = (window.gudangAppDb.keluar || []).find(x => String(x.id) === String(keluarRef));

            if (!item || !keluar) return showToast('Pilih barang dan referensi transaksi keluar yang valid.', 'error');
            let returned = window.getReturAlreadyQty(keluarRef);
            if (document.getElementById('retur-edit-mode').value === 'true') {
                const editing = (window.gudangAppDb.retur || []).find(r => String(r.id) === id);
                if (editing && String(editing.keluarRef) === String(keluarRef)) returned -= Number(editing.qty) || 0;
            }
            const remaining = Math.max(0, (Number(keluar.qty) || 0) - returned);
            if (qty < 1 || qty > remaining) return showToast(`Qty retur maksimal ${remaining}.`, 'error');
            if (String(keluar.barangId) !== String(barangId)) return showToast('Barang tidak sesuai dengan transaksi keluar asal.', 'error');

            const po = (window.gudangAppDb.po || []).find(p => String(p.id) === String(keluar.poRef));
            if (document.getElementById('retur-edit-mode').value !== 'true' &&
                (window.gudangAppDb.retur || []).some(r => String(r.id).toUpperCase() === id)) {
                showToast('ID Retur sudah digunakan.', 'error');
                return;
            }
            if (document.getElementById('retur-edit-mode').value === 'true') {
                try {
                    await sendOperation('retur.update', { id, record: { tanggal, barangId, qty, keterangan, keluarRef, poRef: keluar.poRef || '', nama:item.nama, jenis:item.jenis, lebar:item.lebar||'', ukuran:item.ukuran||'', satuan:item.satuan } });
                    window.refreshAllViews?.(); resetReturForm(); showToast('Retur berhasil diperbarui. Stok dan realisasi PO dikoreksi Worker.');
                } catch (error) { showToast(`Edit retur gagal: ${error.message}`, 'error'); }
                return;
            }
            item.stok += qty;
            window.gudangAppDb.retur.unshift({
                id, tanggal, barangId, nama: item.nama, jenis: item.jenis,
                lebar: item.lebar || '', ukuran: item.ukuran || '', satuan: item.satuan,
                qty, keterangan, user: username, keluarRef, poRef: keluar.poRef || ''
            });
            if (po) {
                po.terkirim = Math.max(0, Number(po.terkirim || 0) - qty);
                po.status = po.terkirim >= Number(po.qty || 0) ? 'CLOSED' : (po.terkirim > 0 ? 'PARTIAL' : 'OPEN');
            }
            try {
                const saved = await saveCloudDB();
                if (saved) {
                    resetReturForm();
                    showToast('Retur berhasil disimpan dan dikonfirmasi Worker. Stok dan realisasi PO diperbarui.');
                } else {
                    showToast('Retur belum terkonfirmasi tersimpan di Cloud. Periksa riwayat sebelum mencoba ulang.', 'error');
                }
            } catch (error) {
                showToast(`Retur gagal disimpan: ${error.message}`, 'error');
            }
        };

        window.deleteReturItem = function(id) {
            if (window.gudangAppDb.currentUser?.role === 'viewer') return;
            const record = window.gudangAppDb.retur.find(x => x.id === id);
            if (!record) { showToast('Data retur tidak ditemukan.', 'error'); return; }
            showConfirm('Konfirmasi Hapus Retur', `Anda akan menghapus transaksi retur ${id}.`, async () => {
                try {
                    const r = window.gudangAppDb.retur.find(x => x.id === id);
                    if (!r) return;
                    const item = window.gudangAppDb.items.find(x => String(x.id) === String(r.barangId));
                    if (item) item.stok = Math.max(0, Number(item.stok || 0) - Number(r.qty || 0));
                    const po = r.poRef ? window.gudangAppDb.po.find(x => String(x.id) === String(r.poRef)) : null;
                    if (po) {
                        po.terkirim = Math.min(Number(po.qty || 0), Number(po.terkirim || 0) + Number(r.qty || 0));
                        po.status = po.terkirim >= Number(po.qty || 0) ? 'CLOSED' : (po.terkirim > 0 ? 'PARTIAL' : 'OPEN');
                    }
                    window.gudangAppDb.retur = window.gudangAppDb.retur.filter(x => x.id !== id);
                    const saved = await saveCloudDB();
                    if (saved) showToast('Retur dihapus; stok dan realisasi PO dipulihkan oleh Worker.', 'warning');
                    else showToast('Penghapusan Retur belum dikonfirmasi Worker. Periksa kembali data.', 'error');
                } catch (error) {
                    showToast(`Retur gagal dihapus: ${error.message}`, 'error');
                }
            }, { record, confirmLabel:'Ya, Hapus Retur', warning:'PERHATIAN: penghapusan retur akan mengurangi kembali stok dan mengoreksi realisasi PO. Pastikan dampaknya sudah diperiksa.' });
        };

        window.resetReturForm = function() {
            document.getElementById('form-retur').reset();
            document.getElementById('retur-edit-mode').value = 'false';
            document.getElementById('retur-id').value = generateId('RTR');
            document.getElementById('retur-tanggal').valueAsDate = new Date();
            window.updateReturReferenceOptions?.();
            document.getElementById('retur-qty').max = '';
            document.getElementById('retur-reference-info').textContent = 'Pilih barang terlebih dahulu untuk melihat transaksi keluar yang bisa diretur.';
        };

        window.renderReturTable = function() {
            const q = document.getElementById('search-retur')?.value.toLowerCase() || '';
            const tbody = document.getElementById('retur-table-body');
            const badgeTotal = document.getElementById('retur-total-badge');
            const isViewer = window.gudangAppDb.currentUser?.role === 'viewer';

            const filtered = window.gudangAppDb.retur.filter(i => 
                i.id.toLowerCase().includes(q) || i.nama.toLowerCase().includes(q) || i.keterangan.toLowerCase().includes(q)
            );
            if (badgeTotal) badgeTotal.textContent = `${filtered.length} Transaksi`;

            const renderedReturRows = filtered.map((i, index) => `
                <tr class="hover:bg-white/5">
                    <td class="py-3 px-2 text-center opacity-70 font-mono">${index + 1}</td>
                    <td class="py-3 px-3 font-mono font-semibold theme-accent-text">${i.id}</td>
                    <td class="py-3 px-3 opacity-80">${i.tanggal}</td>
                    <td class="py-3 px-3 font-mono opacity-80">${i.barangId}</td>
                    <td class="py-3 px-3 font-medium">${window.displayItemName(i.id, i.nama)}</td>
                    <td class="py-3 px-3 opacity-80">${i.jenis}</td>
                    <td class="py-3 px-2 opacity-80">${i.lebar || '-'}</td>
                    <td class="py-3 px-2 opacity-80">${i.ukuran || '-'}</td>
                    <td class="py-3 px-2 opacity-80">${i.satuan}</td>
                    <td class="py-3 px-3 text-right font-mono font-bold text-amber-400">${i.qty.toLocaleString('id-ID')}</td>
                    <td class="py-3 px-3 font-medium">${i.keterangan}</td>
                    ${!isViewer ? `
                        <td class="py-3 px-3 text-center">
                            <button onclick="editReturItem('${i.id}')" class="px-2 py-1 rounded bg-sky-500/20 text-sky-300 text-xs font-semibold mr-1">Edit</button>
                            <button onclick="deleteReturItem('${i.id}')" class="px-2 py-1 rounded bg-rose-500/20 text-rose-400 text-xs font-semibold">Hapus</button>
                        </td>
                    ` : ''}
                </tr>
            `).join('') || `<tr><td colspan="${isViewer ? 11 : 12}" class="py-6 text-center opacity-50">Tidak ada riwayat.</td></tr>`;
            if (tbody.innerHTML !== renderedReturRows) tbody.innerHTML = renderedReturRows;
            lucide.createIcons();
        };

        // Users Management CRUD
        window.saveNewUser = async function(e) {
            e.preventDefault();
            const actorRole = window.gudangAppDb.currentUser?.role;
            if (!['admin','superadmin'].includes(actorRole)) return;
            const username = document.getElementById('new-user-username').value.trim().toLowerCase();
            const name = document.getElementById('new-user-name').value.trim();
            const password = document.getElementById('new-user-pass').value;
            const role = document.getElementById('new-user-role').value;
            if (actorRole === 'admin' && !['staff','viewer'].includes(role)) {
                showToast('Admin hanya dapat membuat akun Staff atau Viewer.', 'error'); return;
            }
            try {
                await workerRequest('/api/users', { method:'POST', body:JSON.stringify({username,name,password,role}) });
                await loadUsersFromWorker();
                window.refreshAllViews?.();
                document.getElementById('form-user').reset();
                showToast(`User ${username} berhasil ditambahkan.`);
            } catch (error) { showToast(error.message, 'error'); }
        };

        // Reset password akun melalui Worker. Password lama tidak dapat dilihat karena disimpan sebagai hash.
        window.resetUserPassword = async function(username) {
            const actorRole = window.gudangAppDb.currentUser?.role;
            const target = (window.gudangAppDb.users || []).find(u => u.username === username);
            if (!['admin','superadmin'].includes(actorRole) || !target) return;
            if (username === 'superadmin') {
                showToast('Password Super Admin tidak dapat direset melalui menu ini.', 'error');
                return;
            }
            if (actorRole === 'admin' && !['staff','viewer'].includes(target.role)) {
                showToast('Admin hanya dapat mereset password Staff atau Viewer.', 'error');
                return;
            }
            const newPassword = prompt(`Masukkan password baru untuk akun ${username} (minimal 10 karakter):`);
            if (newPassword === null) return;
            if (newPassword.length < 10 || newPassword.length > 128) {
                showToast('Password harus terdiri dari 10–128 karakter.', 'error');
                return;
            }
            const confirmPassword = prompt('Ulangi password baru untuk konfirmasi:');
            if (confirmPassword === null) return;
            if (newPassword !== confirmPassword) {
                showToast('Konfirmasi password tidak sama.', 'error');
                return;
            }
            try {
                await workerRequest(`/api/users/${encodeURIComponent(username)}`, {
                    method: 'PUT',
                    body: JSON.stringify({ password: newPassword })
                });
                await loadUsersFromWorker();
                window.refreshAllViews?.();
                showToast(`Password akun ${username} berhasil direset.`);
            } catch (error) {
                showToast(`Reset password gagal: ${error.message}`, 'error');
            }
        };

        window.deleteUser = function(username) {
            const actorRole = window.gudangAppDb.currentUser?.role;
            if (!['admin','superadmin'].includes(actorRole)) return;
            const record = window.gudangAppDb.users.find(x => x.username === username) || { username, role:'-' };
            showConfirm('Konfirmasi Hapus User', `Anda akan menghapus akun pengguna ${username}.`, async () => {
                try {
                    await workerRequest(`/api/users/${encodeURIComponent(username)}`, { method:'DELETE' });
                    await loadUsersFromWorker();
                    window.refreshAllViews?.();
                    showToast(`User ${username} dihapus.`, 'warning');
                } catch (error) { showToast(error.message, 'error'); }
            }, { record, confirmLabel:'Ya, Hapus User', warning:'Akun pengguna akan dihapus dari sistem. Pengguna tersebut tidak dapat masuk kembali menggunakan akun ini.' });
        };

        window.renderUserTable = function() {
            const tbody = document.getElementById('user-table-body');
            const badgeTotal = document.getElementById('user-total-badge');
            if (!tbody) return;

            if (badgeTotal) badgeTotal.textContent = `${window.gudangAppDb.users.length} User`;
            const renderedUserRows = window.gudangAppDb.users.map((u, index) => {
                const isCurrent = window.gudangAppDb.currentUser?.username === u.username;
                const badgeClass = ['admin','superadmin'].includes(u.role) ? 'role-badge-admin' : (u.role === 'staff' ? 'role-badge-staff' : 'role-badge-viewer');
                return `
                    <tr class="hover:bg-white/5">
                        <td class="py-3 px-2 text-center opacity-70 font-mono">${index + 1}</td>
                        <td class="py-3 px-3 font-mono font-semibold theme-accent-text">${u.username} ${isCurrent ? '<span class="text-[9px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded ml-1">Aktif</span>' : ''}</td>
                        <td class="py-3 px-3 font-medium">${u.name}</td>
                        <td class="py-3 px-3 font-mono text-gray-300 bg-white/5 px-2 py-1 rounded">Tersimpan aman di backend</td>
                        <td class="py-3 px-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${badgeClass}">${u.role}</span></td>
                        <td class="py-3 px-3 text-emerald-400 font-semibold">● Aktif</td>
                        <td class="py-3 px-3 text-center">
                            ${(window.gudangAppDb.currentUser?.role === 'superadmin' || (window.gudangAppDb.currentUser?.role === 'admin' && ['staff','viewer'].includes(u.role))) && u.username !== 'superadmin' ? `
                                <div class="flex items-center justify-center gap-2">
                                    <button onclick="resetUserPassword('${u.username}')" class="px-2 py-1 rounded bg-amber-500/20 text-amber-300 text-xs font-semibold">Reset Password</button>
                                    ${u.username !== window.gudangAppDb.currentUser?.username ? `<button onclick="deleteUser('${u.username}')" class="px-2 py-1 rounded bg-rose-500/20 text-rose-400 text-xs font-semibold">Hapus</button>` : ''}
                                </div>
                            ` : ''}
                        </td>
                    </tr>
                `;
            }).join('');
            if (tbody.innerHTML !== renderedUserRows) tbody.innerHTML = renderedUserRows;
            lucide.createIcons();
        };


        // Combined Inflow / Outflow trend. Uses transaction quantities grouped by date.
        let movementTrendRange = 7;
        function parseMovementDate(value) {
            if (!value) return null;
            if (value instanceof Date && !isNaN(value)) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
            const raw = String(value).trim();
            let m = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
            if (m) return new Date(+m[1], +m[2]-1, +m[3]);
            m = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
            if (m) { let y=+m[3]; if(y<100)y+=2000; return new Date(y,+m[2]-1,+m[1]); }
            const parsed = new Date(raw);
            return isNaN(parsed) ? null : new Date(parsed.getFullYear(),parsed.getMonth(),parsed.getDate());
        }
        function drawMovementTrend() {
            const host = document.getElementById('movement-trend-chart');
            if (!host || !window.gudangAppDb) return;
            const now = new Date(); now.setHours(0,0,0,0);
            const days = movementTrendRange;
            const start = new Date(now); start.setDate(start.getDate()-days+1);
            const masuk = (window.gudangAppDb.masuk || []);
            const keluar = (window.gudangAppDb.keluar || []);
            const rows = [];
            const keyOf = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            const map = new Map();
            const add = (list,type) => list.forEach(r=>{
                const d=parseMovementDate(r.tanggal); if(!d || d<start || d>now) return;
                const key=keyOf(d); if(!map.has(key))map.set(key,{date:d,in:0,out:0});
                map.get(key)[type]+=Number(r.qty)||0;
            });
            add(masuk,'in'); add(keluar,'out');
            const bucketMode = days<=7 ? 'day' : (days<=90 ? 'week' : 'month');
            if(bucketMode==='day'){
                for(let d=new Date(start);d<=now;d.setDate(d.getDate()+1)){const v=map.get(keyOf(d))||{in:0,out:0};rows.push({label:d.toLocaleDateString('id-ID',{day:'2-digit',month:'short'}),in:v.in,out:v.out});}
            } else if(bucketMode==='week'){
                const buckets=new Map();
                for(const v of map.values()){const d=new Date(v.date);const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);const k=keyOf(d);if(!buckets.has(k))buckets.set(k,{date:d,in:0,out:0});buckets.get(k).in+=v.in;buckets.get(k).out+=v.out;}
                for(let d=new Date(start);d<=now;d.setDate(d.getDate()+7)){const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);const k=keyOf(d);const v=buckets.get(k)||{in:0,out:0};const label=d.toLocaleDateString('id-ID',{day:'2-digit',month:'short'});if(!rows.length||rows[rows.length-1].label!==label)rows.push({label,in:v.in,out:v.out});}
            } else {
                const buckets=new Map();
                for(const v of map.values()){const k=`${v.date.getFullYear()}-${v.date.getMonth()}`;if(!buckets.has(k))buckets.set(k,{date:v.date,in:0,out:0});buckets.get(k).in+=v.in;buckets.get(k).out+=v.out;}
                for(let i=11;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);const k=`${d.getFullYear()}-${d.getMonth()}`;const v=buckets.get(k)||{in:0,out:0};rows.push({label:d.toLocaleDateString('id-ID',{month:'short'}),in:v.in,out:v.out});}
            }
            const totalIn=rows.reduce((a,r)=>a+r.in,0), totalOut=rows.reduce((a,r)=>a+r.out,0);
            const fmt=n=>Math.round(n).toLocaleString('id-ID');
            document.getElementById('movement-total-in').textContent=fmt(totalIn);
            document.getElementById('movement-total-out').textContent=fmt(totalOut);
            document.getElementById('movement-total-net').textContent=(totalIn-totalOut>0?'+':'')+fmt(totalIn-totalOut);
            // V89: reserve a little more room on the right so the final date label is never clipped.
            const softTheme = document.body.classList.contains('theme-soft');
            const softMobile = softTheme && window.matchMedia('(max-width: 700px)').matches;
            const W=760,H=softTheme?(softMobile?190:160):112,L=softTheme?54:42,R=28,T=softTheme?12:7,B=softMobile?34:(softTheme?30:22),plotW=W-L-R,plotH=H-T-B;
            const max=Math.max(1,...rows.flatMap(r=>[r.in,r.out]));
            const y=v=>T+plotH-(v/max)*plotH;
            const x=i=>L+(rows.length<=1?plotW/2:i*plotW/(rows.length-1));
            const points=key=>rows.map((r,i)=>`${x(i).toFixed(1)},${y(r[key]).toFixed(1)}`).join(' ');
            const grid=[0,.25,.5,.75,1].map(f=>{const yy=T+plotH-f*plotH;return `<line x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}" class="movement-grid-line"/><text x="${L-8}" y="${yy+3}" text-anchor="end" class="movement-axis-value">${fmt(max*f)}</text>`;}).join('');
            const labelStep=Math.max(1,Math.ceil(rows.length/7));
            const labels=rows.map((r,i)=>{
                if(i%labelStep!==0 && i!==rows.length-1) return '';
                const anchor=i===rows.length-1?'end':(i===0?'start':'middle');
                return `<text x="${x(i)}" y="${H-8}" text-anchor="${anchor}" class="movement-axis-date">${r.label}</text>`;
            }).join('');
            const pointsWithTips=rows.map((r,i)=>`
                <circle cx="${x(i)}" cy="${y(r.in)}" r="3" fill="#56a9ed">
                  <title>${r.label} • Inflow: ${fmt(r.in)}</title>
                </circle>
                <circle cx="${x(i)}" cy="${y(r.out)}" r="3" fill="#e5a15d">
                  <title>${r.label} • Outflow: ${fmt(r.out)}</title>
                </circle>
                <circle cx="${x(i)}" cy="${Math.min(y(r.in),y(r.out))}" r="9" fill="transparent" pointer-events="all">
                  <title>${r.label}\nInflow: ${fmt(r.in)}\nOutflow: ${fmt(r.out)}</title>
                </circle>`).join('');
            const areaPath=key=>`M ${x(0)} ${T+plotH} L ${rows.map((r,i)=>`${x(i).toFixed(1)} ${y(r[key]).toFixed(1)}`).join(' L ')} L ${x(rows.length-1)} ${T+plotH} Z`;
            host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Tren inflow ${fmt(totalIn)} dan outflow ${fmt(totalOut)}" preserveAspectRatio="${softTheme?'xMidYMid meet':'none'}"><defs><linearGradient id="movementInFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#2eb5f4" stop-opacity=".34"/><stop offset="100%" stop-color="#2eb5f4" stop-opacity=".015"/></linearGradient><linearGradient id="movementOutFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#f05d91" stop-opacity=".28"/><stop offset="100%" stop-color="#f05d91" stop-opacity=".012"/></linearGradient></defs><g>${grid}</g><path d="${areaPath('in')}" fill="url(#movementInFill)"/><path d="${areaPath('out')}" fill="url(#movementOutFill)"/><polyline points="${points('in')}" fill="none" stroke="#2eb5f4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><polyline points="${points('out')}" fill="none" stroke="#f05d91" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${pointsWithTips}${labels}</svg>`;
            document.querySelectorAll('.movement-range-btn').forEach(btn=>btn.classList.toggle('is-active',Number(btn.dataset.range)===movementTrendRange));
        }

        let movementActiveSlide = 0;
        function drawMovementTopSku() {
            const db = window.gudangAppDb || {};
            const items = db.items || [];
            const start = new Date(); start.setHours(0,0,0,0);
            start.setDate(start.getDate() - movementTrendRange + 1);
            const now = new Date(); now.setHours(23,59,59,999);
            const fmt = n => Math.round(n).toLocaleString('id-ID');
            const render = (records, hostId, colorClass, emptyText) => {
                const totals = new Map();
                records.forEach(r => {
                    const d = parseMovementDate(r.tanggal);
                    if (!d || d < start || d > now) return;
                    const id = String(r.barangId ?? '');
                    if (!id) return;
                    totals.set(id, (totals.get(id) || 0) + (Number(r.qty) || 0));
                });
                const top = [...totals.entries()].sort((a,b) => b[1]-a[1]).slice(0,5);
                const host = document.getElementById(hostId);
                if (!host) return;
                if (!top.length) { host.innerHTML = `<div class="movement-chart-empty">${emptyText}</div>`; return; }
                const max = Math.max(...top.map(x=>x[1]),1);
                host.innerHTML = top.map(([id,qty]) => {
                    const item = items.find(x => String(x.id) === id);
                    const name = item?.id || item?.kode || id;
                    const pct = Math.max(2, qty/max*100);
                    return `<div class="movement-topsku-row" title="${String(item?.nama || name).replace(/["&<>]/g,c=>({'"':'&quot;','&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}: ${fmt(qty)} unit"><span class="movement-topsku-name">${String(name).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</span><div class="movement-topsku-track"><div class="movement-topsku-fill ${colorClass}" style="width:${pct}%"></div></div><strong class="movement-topsku-value">${fmt(qty)}</strong></div>`;
                }).join('');
            };
            render(db.masuk || [], 'movement-top-in', 'in', 'Belum ada data masuk pada periode ini.');
            render(db.keluar || [], 'movement-top-out', 'out', 'Belum ada data keluar pada periode ini.');
        }
        function setMovementSlide(index) {
            movementActiveSlide = (index + 2) % 2;
            document.querySelectorAll('[data-movement-slide]').forEach(el => {
                const active = Number(el.dataset.movementSlide) === movementActiveSlide;
                el.hidden = !active;
                el.classList.toggle('is-active', active);
            });
            document.querySelectorAll('.movement-slide-dot').forEach(el => el.classList.toggle('is-active', Number(el.dataset.slideTo) === movementActiveSlide));
            const count = document.getElementById('movement-slide-count');
            const subtitle = document.getElementById('movement-slide-subtitle');
            if (count) count.textContent = `${movementActiveSlide+1} / 2`;
            if (subtitle) subtitle.textContent = movementActiveSlide === 0
                ? 'Pergerakan barang berdasarkan transaksi masuk dan keluar'
                : 'Top SKU berdasarkan total kuantitas transaksi masuk dan keluar';
            if (movementActiveSlide === 1) drawMovementTopSku();
        }
        document.querySelectorAll('.movement-slide-dot').forEach(btn => btn.addEventListener('click',()=>setMovementSlide(Number(btn.dataset.slideTo)||0)));
        document.getElementById('movement-slide-prev')?.addEventListener('click',()=>setMovementSlide(movementActiveSlide-1));
        document.getElementById('movement-slide-next')?.addEventListener('click',()=>setMovementSlide(movementActiveSlide+1));

        document.querySelectorAll('.movement-range-btn').forEach(btn=>btn.addEventListener('click',()=>{movementTrendRange=Number(btn.dataset.range)||7;drawMovementTrend();if(movementActiveSlide===1)drawMovementTopSku();}));


        let lastLowStockRenderSignature = null;

        // Dashboard search spans the modules while reusing each module's own table filter.
        window.runDashboardSearch = function() {
            const input = document.getElementById('dashboard-global-search');
            const resultsBox = document.getElementById('dashboard-search-results');
            const clearButton = document.getElementById('dashboard-search-clear');
            if (!input || !resultsBox) return;

            const query = input.value.trim().toLocaleLowerCase('id-ID');
            clearButton?.toggleAttribute('hidden', !query);
            resultsBox.replaceChildren();
            resultsBox.hidden = !query;
            if (!query) return;

            const db = window.gudangAppDb || {};
            const contains = values => values.some(value => String(value ?? '').toLocaleLowerCase('id-ID').includes(query));
            const records = [];
            const addRecord = (module, filterId, category, title, description, searchable) => {
                if (contains(searchable)) records.push({ module, filterId, category, title, description });
            };

            (db.items || []).forEach(item => addRecord(
                'master', 'search-master', 'Master Barang',
                `${item.id || '-'} · ${window.displayItemName(item.id, item.nama)}`,
                `${item.jenis || 'Tanpa kategori'} · Stok ${Number(item.stok || 0).toLocaleString('id-ID')} ${item.satuan || ''}`,
                [item.id, item.nama, item.jenis]
            ));
            (db.masuk || []).forEach(row => addRecord(
                'masuk', 'search-masuk', 'Barang Masuk',
                `${row.id || row.transactionId || '-'} · ${row.nama || row.barangId || 'Barang'}`,
                `${row.tanggal || '-'} · ${row.supplier || 'Sumber tidak dicantumkan'} · +${Number(row.qty || 0).toLocaleString('id-ID')} ${row.satuan || ''}`,
                [row.id, row.nama, row.supplier]
            ));

            const keluarGroups = new Map();
            (db.keluar || []).forEach(row => {
                const transactionId = String(row.transactionId || row.groupId || row.id || '-');
                if (!keluarGroups.has(transactionId)) keluarGroups.set(transactionId, []);
                keluarGroups.get(transactionId).push(row);
            });
            keluarGroups.forEach((rows, transactionId) => rows.forEach(row => addRecord(
                'keluar', 'search-keluar', 'Barang Keluar',
                `${transactionId} · ${row.nama || row.barangId || 'Barang'}`,
                `${row.tanggal || '-'} · ${row.tujuan || 'Tujuan tidak dicantumkan'} · -${Number(row.qty || 0).toLocaleString('id-ID')} ${row.satuan || ''}`,
                [transactionId, row.id, row.tanggal, row.tujuan, row.barangId, row.nama, row.jenis, row.lebar, row.ukuran, row.poRef]
            )));

            const poGroups = new Map();
            (db.po || []).forEach(row => {
                const key = `${String(row.customer || '').toLocaleLowerCase('id-ID')}|${String(row.noPoCustomer || row.id || '').toLocaleLowerCase('id-ID')}`;
                if (!poGroups.has(key)) poGroups.set(key, []);
                poGroups.get(key).push(row);
            });
            poGroups.forEach(rows => rows.forEach(row => addRecord(
                'po', 'search-po', 'PO Customer',
                `${row.noPoCustomer || row.id || '-'} · ${row.customer || 'Customer'}`,
                `${row.tanggal || '-'} · ${row.nama || row.barangId || 'Detail barang'} · Qty ${Number(row.qty || 0).toLocaleString('id-ID')}`,
                [row.noPoCustomer, row.customer, row.id, row.nama]
            )));

            (db.sampel || []).forEach(row => addRecord(
                'sampel', 'search-sampel', 'Sampel',
                `${row.id || '-'} · ${row.nama || row.customer || 'Sampel'}`,
                `${row.tanggal || '-'} · ${row.customer || row.jenis || 'Sampel'} · Qty ${Number(row.qty || 0).toLocaleString('id-ID')}`,
                [row.id, row.customer, row.nama]
            ));
            (db.retur || []).forEach(row => addRecord(
                'retur', 'search-retur', 'Retur Barang',
                `${row.id || '-'} · ${row.nama || row.barangId || 'Barang'}`,
                `${row.tanggal || '-'} · ${row.keterangan || 'Tanpa keterangan'} · Qty ${Number(row.qty || 0).toLocaleString('id-ID')}`,
                [row.id, row.nama, row.keterangan]
            ));

            const resultHeading = document.createElement('div');
            resultHeading.className = 'dashboard-search-count';
            resultHeading.textContent = records.length
                ? `${records.length.toLocaleString('id-ID')} hasil ditemukan · pilih hasil untuk membuka tabel`
                : 'Tidak ada data yang cocok.';
            resultsBox.append(resultHeading);

            records.slice(0, 12).forEach(record => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'dashboard-search-result';
                button.addEventListener('click', () => {
                    const moduleSearch = document.getElementById(record.filterId);
                    if (moduleSearch) moduleSearch.value = input.value.trim();
                    window.switchTab(record.module);
                    document.getElementById(record.filterId)?.focus({ preventScroll:true });
                });

                const copy = document.createElement('span');
                copy.className = 'dashboard-search-result-copy';
                const title = document.createElement('strong');
                title.textContent = record.title;
                const description = document.createElement('small');
                description.textContent = record.description;
                copy.append(title, description);

                const category = document.createElement('span');
                category.className = 'dashboard-search-result-category';
                category.textContent = record.category;
                button.append(copy, category);
                resultsBox.append(button);
            });

            if (records.length > 12) {
                const more = document.createElement('div');
                more.className = 'dashboard-search-more';
                more.textContent = `Menampilkan 12 dari ${records.length.toLocaleString('id-ID')} hasil.`;
                resultsBox.append(more);
            }
        };

        window.clearDashboardSearch = function() {
            const input = document.getElementById('dashboard-global-search');
            if (!input) return;
            input.value = '';
            input.focus();
            window.runDashboardSearch();
        };

        // Render Dashboard & Charts
        window.renderDashboard = function() {
            const totalSku = window.gudangAppDb.items.length;
            const totalStok = window.gudangAppDb.items.reduce((acc, cur) => acc + cur.stok, 0);
            const totalMasuk = window.gudangAppDb.masuk.reduce((acc, cur) => acc + cur.qty, 0);
            const totalKeluar = window.gudangAppDb.keluar.reduce((acc, cur) => acc + cur.qty, 0);
            const totalPo = window.gudangAppDb.po.filter(p => p.status !== 'CLOSED').length;
            const totalRetur = window.gudangAppDb.retur.reduce((acc, cur) => acc + cur.qty, 0);

            document.getElementById('stat-sku').textContent = totalSku.toLocaleString('id-ID');
            document.getElementById('stat-stok').textContent = totalStok.toLocaleString('id-ID');
            document.getElementById('stat-masuk').textContent = totalMasuk.toLocaleString('id-ID');
            document.getElementById('stat-keluar').textContent = totalKeluar.toLocaleString('id-ID');
            document.getElementById('stat-po').textContent = totalPo.toLocaleString('id-ID');
            document.getElementById('stat-retur').textContent = totalRetur.toLocaleString('id-ID');

            // Top SKU sudah ditampilkan pada slider Analisis Grafik Inventory.

            // Low stock alert
            const lowList = document.getElementById('low-stock-list');
            const lowItems = window.gudangAppDb.items.filter(i => i.stok < i.min);
            const lowStockSignature = JSON.stringify(lowItems.map(i => [
                i.id, window.displayItemName(i.id, i.nama), i.jenis, i.lebar || '-', i.stok, i.min
            ]));
            if (lowStockSignature !== lastLowStockRenderSignature) {
                lowList.innerHTML = lowItems.map(i => {
                    const isBelow50 = i.stok < (i.min * 0.5);
                    const blinkClass = isBelow50 ? 'blink-low-stock-red' : 'blink-low-stock-orange';
                    const textClass = isBelow50 ? 'text-rose-400' : 'text-amber-400';
                    return `
                        <div class="p-3 rounded-xl border flex items-center justify-between text-xs ${blinkClass}">
                            <div class="flex items-center gap-3">
                                <i data-lucide="alert-triangle" class="w-4 h-4 ${textClass}"></i>
                                <div>
                                    <span class="font-bold text-gray-100">${i.id} - ${window.displayItemName(i.id, i.nama)}</span>
                                    <span class="text-[10px] text-gray-400 block">Kategori: ${i.jenis} | Lebar: ${i.lebar || '-'}</span>
                                </div>
                            </div>
                            <div class="text-right font-mono">
                                <span class="${textClass} font-bold">Stok: ${i.stok}</span>
                                <span class="text-[10px] text-gray-400 block">Min: ${i.min}</span>
                            </div>
                        </div>
                    `;
                }).join('') || '<div class="text-xs text-emerald-400 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center font-semibold">Semua stok barang dalam kondisi aman (&gt;= Minimum).</div>';
                lastLowStockRenderSignature = lowStockSignature;
            }

            // Recent activity log
            const recentBody = document.getElementById('recent-activity-body');
            const allLogs = [
                ...window.gudangAppDb.masuk.map(m => ({ time: m.tanggal, type: 'MASUK', id: m.id, name: m.nama, qty: `+${m.qty} ${m.satuan}`, partner: m.supplier, user: m.user || 'Administrator' })),
                ...window.gudangAppDb.keluar.map(k => ({ time: k.tanggal, type: 'KELUAR', id: k.id, name: k.nama, qty: `-${k.qty} ${k.satuan}`, partner: k.tujuan, user: k.user || 'Administrator' })),
                ...window.gudangAppDb.retur.map(r => ({ time: r.tanggal, type: 'RETUR', id: r.id, name: r.nama, qty: `${r.qty} ${r.satuan}`, partner: r.keterangan, user: r.user || 'Administrator' }))
            ].sort((a,b) => new Date(b.time) - new Date(a.time)).slice(0, 20);

            recentBody.innerHTML = allLogs.map(l => {
                const badgeColor = l.type === 'MASUK' ? 'bg-emerald-500/20 text-emerald-300' : (l.type === 'KELUAR' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300');
                return `
                    <tr class="hover:bg-white/5">
                        <td class="py-3 px-3 opacity-80 font-mono">${l.time}</td>
                        <td class="py-3 px-3"><span class="px-2 py-0.5 rounded font-bold text-[10px] ${badgeColor}">${l.type}</span></td>
                        <td class="py-3 px-3 font-mono theme-accent-text">${l.id}</td>
                        <td class="py-3 px-3 font-medium">${l.name}</td>
                        <td class="py-3 px-3 text-right font-mono font-bold">${l.qty}</td>
                        <td class="py-3 px-3 opacity-80">${l.partner}</td>
                        <td class="py-3 px-3 font-semibold text-orange-400">${l.user}</td>
                    </tr>
                `;
            }).join('') || '<tr><td colspan="7" class="py-6 text-center opacity-50">Belum ada aktivitas transaksi.</td></tr>';
            drawMovementTrend();
            if (movementActiveSlide === 1) drawMovementTopSku();
            lucide.createIcons();
        };

        window.exportCSVData = function() {
            let csvContent = "data:text/csv;charset=utf-8,ID,Nama,Jenis,Lebar,Ukuran,Berat,Satuan,Stok,Min\n";
            window.gudangAppDb.items.forEach(i => {
                csvContent += `"${i.id}","${window.displayItemName(i.id, i.nama)}","${i.jenis}","${i.lebar || ''}","${i.ukuran || ''}",${i.berat || 0},"${i.satuan}",${i.stok},${i.min}\n`;
            });
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "master_inventory_gudang.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('Data berhasil diexport ke CSV!');
        };

        // PRINT LAPORAN: kolom dibuat khusus per modul agar data internal tidak ikut tercetak.
        const PRINT_REPORTS = {
            master: {
                title: 'LAPORAN MASTER DATA BARANG', dateFilter: false,
                fields: [
                    ['id','ID Barang'], ['nama','Nama Barang'], ['jenis','Jenis Barang'],
                    ['lebar','Lebar'], ['ukuran','Ukuran'], ['berat','Berat (gr)'],
                    ['satuan','Satuan'], ['stok','Stok'], ['min','Stok Minimum']
                ]
            },
            masuk: {
                title: 'LAPORAN BARANG MASUK', dateFilter: true, dateKey: 'tanggal',
                fields: [
                    ['id','ID Transaksi'], ['tanggal','Tanggal'], ['barangId','ID Barang'],
                    ['nama','Nama Barang'], ['jenis','Kategori'], ['lebar','Lebar'],
                    ['ukuran','Ukuran'], ['satuan','Satuan'], ['qty','Qty Masuk'], ['supplier','Divisi / Sumber']
                ]
            },
            keluar: {
                title: 'LAPORAN BARANG KELUAR', dateFilter: true, dateKey: 'tanggal',
                fields: [
                    ['transactionId','ID Transaksi / SJ'], ['tanggal','Tanggal'], ['id','ID Detail'],
                    ['barangId','ID Barang'], ['nama','Nama Barang'], ['jenis','Kategori'],
                    ['lebar','Lebar'], ['ukuran','Ukuran'], ['satuan','Satuan'],
                    ['qty','Qty Keluar'], ['tujuan','Customer / Tujuan'], ['poNumber','No. PO']
                ],
                prepare: rows => rows.map(r => ({ ...r,
                    transactionId: r.transactionId || r.groupId || r.id,
                    poNumber: (window.gudangAppDb.po || []).find(p => String(p.id) === String(r.poRef))?.noPoCustomer || r.poRef || '-'
                }))
            },
            po: {
                title: 'LAPORAN PURCHASE ORDER CUSTOMER', dateFilter: true, dateKey: 'tanggal',
                fields: [
                    ['noPoCustomer','No. PO Customer'], ['tanggal','Tanggal PO'], ['customer','Customer'],
                    ['id','ID Detail PO'], ['barangId','ID Barang'], ['nama','Nama Barang'],
                    ['jenis','Kategori'], ['lebar','Lebar'], ['ukuran','Ukuran'], ['satuan','Satuan'],
                    ['qty','Qty PO'], ['terkirim','Qty Terkirim'], ['sisa','Sisa PO'], ['status','Status']
                ],
                prepare: rows => rows.map(r => {
                    const terkirim = Number(r.terkirim || 0);
                    const qty = Number(r.qty || 0);
                    return { ...r, noPoCustomer: r.noPoCustomer || r.id, sisa: Math.max(0, qty - terkirim),
                        status: terkirim >= qty ? 'CLOSED' : (terkirim > 0 ? 'PARTIAL' : 'OPEN') };
                })
            },
            sampel: {
                title: 'LAPORAN DATA SAMPEL', dateFilter: true, dateKey: 'tanggal',
                fields: [
                    ['id','ID Sampel'], ['tanggal','Tanggal'], ['customer','Customer'], ['nama','Nama Sampel / Barang'],
                    ['kategori','Kategori'], ['lebar','Lebar'], ['ukuran','Ukuran'], ['berat','Berat (gr)'], ['tebal','Tebal']
                ]
            },
            retur: {
                title: 'LAPORAN RETUR BARANG', dateFilter: true, dateKey: 'tanggal',
                fields: [
                    ['id','ID Retur'], ['tanggal','Tanggal'], ['barangId','ID Barang'], ['nama','Nama Barang'],
                    ['jenis','Kategori'], ['lebar','Lebar'], ['ukuran','Ukuran'], ['satuan','Satuan'],
                    ['qty','Qty Retur'], ['keterangan','Alasan Retur']
                ]
            }
        };

        window.printMasterTable = function() { openPrintOptions('master', window.gudangAppDb.items || []); };
        window.printMasukTable = function() { openPrintOptions('masuk', window.gudangAppDb.masuk || []); };
        window.printKeluarTable = function() { openPrintOptions('keluar', window.gudangAppDb.keluar || []); };
        window.printPoTable = function() { openPrintOptions('po', window.gudangAppDb.po || []); };
        window.printSampelTable = function() { openPrintOptions('sampel', window.gudangAppDb.sampel || []); };
        window.printReturTable = function() { openPrintOptions('retur', window.gudangAppDb.retur || []); };

        function openPrintOptions(reportKey, sourceRows) {
            const config = PRINT_REPORTS[reportKey];
            if (!config) return;
            document.getElementById('inventory-print-options')?.remove();
            const overlay = document.createElement('div');
            overlay.id = 'inventory-print-options';
            overlay.classList.add(document.body.classList.contains('theme-light') ? 'print-theme-light' : 'print-theme-dark');
            overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:16px;';
            overlay.innerHTML = `
                <div style="width:min(440px,100%);background:#172033;color:#f8fafc;border:1px solid rgba(255,255,255,.15);border-radius:16px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.45);font-family:Arial,sans-serif">
                    <div style="font-size:17px;font-weight:700;margin-bottom:6px">${config.title}</div>
                    <div style="font-size:12px;color:#cbd5e1;margin-bottom:18px">Pilih data yang ingin dicetak.</div>
                    <label style="display:flex;gap:9px;align-items:center;padding:10px;border:1px solid rgba(255,255,255,.15);border-radius:10px;margin-bottom:9px;cursor:pointer">
                        <input type="radio" name="print-mode" value="all" checked> <span>Semua Data</span>
                    </label>
                    ${config.dateFilter ? `
                    <label style="display:flex;gap:9px;align-items:center;padding:10px;border:1px solid rgba(255,255,255,.15);border-radius:10px;cursor:pointer">
                        <input type="radio" name="print-mode" value="range"> <span>Filter Rentang Tanggal</span>
                    </label>
                    <div id="print-date-fields" style="display:none;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px">
                        <label style="font-size:11px;color:#cbd5e1">Tanggal Awal<input id="print-date-start" class="print-date-input" type="date" style="display:block;width:100%;margin-top:5px"></label>
                        <label style="font-size:11px;color:#cbd5e1">Tanggal Akhir<input id="print-date-end" class="print-date-input" type="date" style="display:block;width:100%;margin-top:5px"></label>
                    </div>` : '<div style="font-size:11px;color:#94a3b8;margin:10px 2px 0">Master Barang tidak menggunakan filter tanggal.</div>'}
                    <div style="display:flex;justify-content:flex-end;gap:9px;margin-top:22px">
                        <button type="button" id="print-cancel" style="padding:9px 15px;border-radius:8px;background:#334155;color:white;border:0;cursor:pointer">Batal</button>
                        <button type="button" id="print-continue" style="padding:9px 15px;border-radius:8px;background:#ea580c;color:white;border:0;font-weight:700;cursor:pointer">Lanjut Cetak</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            const dateFields = overlay.querySelector('#print-date-fields');
            overlay.querySelectorAll('input[name="print-mode"]').forEach(radio => radio.addEventListener('change', () => {
                if (dateFields) dateFields.style.display = radio.value === 'range' && radio.checked ? 'grid' : 'none';
            }));
            overlay.querySelector('#print-cancel').onclick = () => overlay.remove();
            overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
            overlay.querySelector('#print-continue').onclick = () => {
                const mode = overlay.querySelector('input[name="print-mode"]:checked')?.value || 'all';
                let rows = sourceRows.slice();
                let periodLabel = 'Semua Data';
                if (mode === 'range' && config.dateFilter) {
                    const start = overlay.querySelector('#print-date-start').value;
                    const end = overlay.querySelector('#print-date-end').value;
                    if (!start || !end) { showToast('Tanggal awal dan tanggal akhir wajib diisi.', 'error'); return; }
                    if (start > end) { showToast('Tanggal awal tidak boleh melewati tanggal akhir.', 'error'); return; }
                    rows = rows.filter(row => {
                        const date = normalizePrintDate(row[config.dateKey]);
                        return date && date >= start && date <= end;
                    });
                    periodLabel = `${formatPrintDate(start)} s.d. ${formatPrintDate(end)}`;
                    if (!rows.length) { showToast('Tidak ada transaksi pada rentang tanggal tersebut.', 'error'); return; }
                }
                overlay.remove();
                if (typeof config.prepare === 'function') rows = config.prepare(rows);
                renderPrintDocument(config, rows, periodLabel);
            };
        }

        function normalizePrintDate(value) {
            if (!value) return '';
            const raw = String(value).trim();
            if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
            const dmy = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
            if (dmy) return `${dmy[3]}-${String(dmy[2]).padStart(2,'0')}-${String(dmy[1]).padStart(2,'0')}`;
            return '';
        }
        function formatPrintDate(iso) {
            const [y,m,d] = iso.split('-');
            return `${d}-${m}-${y}`;
        }
        function escapePrintHtml(value) {
            return String(value ?? '-').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
        }
        function renderPrintDocument(config, rows, periodLabel) {
            const printWindow = window.open('', '_blank');
            if (!printWindow) { showToast('Popup cetak diblokir browser. Izinkan popup lalu coba lagi.', 'error'); return; }
            const nowStr = new Date().toLocaleString('id-ID');
            const headers = config.fields;
            const bodyRows = rows.map((row, index) => `<tr><td class="no">${index + 1}</td>${headers.map(([key]) => `<td>${escapePrintHtml(key === 'nama' && row.barangId ? window.displayItemName(row.barangId, row.nama) : row[key])}</td>`).join('')}</tr>`).join('');
            printWindow.document.open();
            printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapePrintHtml(config.title)}</title>
                <style>
                    @page{size:A4 landscape;margin:12mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111;margin:0}
                    h2{font-size:18px;margin:0 0 7px;text-align:center} .meta{text-align:center;font-size:10px;color:#444;margin:0 0 14px}
                    table{width:100%;border-collapse:collapse;font-size:9px}thead{display:table-header-group}tr{break-inside:avoid;page-break-inside:avoid}
                    th,td{border:1px solid #777;padding:5px 6px;text-align:left;vertical-align:top;overflow-wrap:anywhere}
                    th{background:#e5e7eb;font-weight:700;text-transform:uppercase}.no{text-align:center;width:28px}
                    @media screen{body{padding:18px}table{font-size:11px}}
                
        /* ==========================================================
           MASTER BARANG — LIGHT MODE FONT CONTRAST FIX
           Dark blue typography for labels, headings and table content
           ========================================================== */
        body.theme-glass.theme-light #tab-master {
            color: #24415f !important;
        }

        body.theme-glass.theme-light #tab-master label {
            color: #365574 !important;
            font-weight: 600 !important;
        }

        body.theme-glass.theme-light #tab-master h3,
        body.theme-glass.theme-light #tab-master h4,
        body.theme-glass.theme-light #tab-master .font-bold,
        body.theme-glass.theme-light #tab-master .font-semibold {
            color: #1d3b5a !important;
        }

        body.theme-glass.theme-light #tab-master p,
        body.theme-glass.theme-light #tab-master small,
        body.theme-glass.theme-light #tab-master .text-gray-300,
        body.theme-glass.theme-light #tab-master .text-gray-400,
        body.theme-glass.theme-light #tab-master .text-gray-500 {
            color: #526d8a !important;
        }

        body.theme-glass.theme-light #tab-master table {
            color: #24415f !important;
        }

        body.theme-glass.theme-light #tab-master thead th {
            color: #1e4268 !important;
        }

        body.theme-glass.theme-light #tab-master tbody td {
            color: #294967 !important;
        }

        body.theme-glass.theme-light #tab-master tbody td .text-rose-400 {
            color: #d12f50 !important;
        }

        body.theme-glass.theme-light #tab-master tbody td .text-amber-400 {
            color: #bd650d !important;
        }

        body.theme-glass.theme-light #tab-master input:not([type="checkbox"]):not([type="radio"]),
        body.theme-glass.theme-light #tab-master select,
        body.theme-glass.theme-light #tab-master textarea {
            color: #1e3b59 !important;
            -webkit-text-fill-color: #1e3b59 !important;
        }

        body.theme-glass.theme-light #tab-master input::placeholder,
        body.theme-glass.theme-light #tab-master textarea::placeholder {
            color: #647d99 !important;
            -webkit-text-fill-color: #647d99 !important;
            opacity: 1 !important;
        }

        body.theme-glass.theme-light #tab-master button:not(.theme-accent-bg) {
            color: #244766 !important;
        }

        body.theme-glass.theme-light #tab-master #form-master button[type="submit"] {
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
        }


        /* MASTER FORM LABELS — LIGHT MODE CONTRAST PATCH */
        body.theme-glass.theme-light #tab-master #master-form-card #form-master label,
        body.theme-glass.theme-light #tab-master #master-form-card label {
            color: #315574 !important;
            -webkit-text-fill-color: #315574 !important;
            opacity: 1 !important;
            font-weight: 600 !important;
        }


        /* GLOBAL LIGHT MODE LABEL CONTRAST — ALL MODULES */
        body.theme-glass.theme-light [id^="tab-"] label,
        body.theme-glass.theme-light [id^="tab-"] .form-label {
            color: #315574 !important;
            -webkit-text-fill-color: #315574 !important;
            opacity: 1 !important;
            font-weight: 600 !important;
        }


        /* ==========================================================
           GLOBAL LIGHT MODE TYPOGRAPHY AUDIT FIX
           Tidak ada teks putih/pucat di seluruh aplikasi saat Light Mode.
           Warna tombol/status tetap terbaca dengan tinta biru gelap.
           ========================================================== */

        body.theme-glass.theme-light,
        body.theme-glass.theme-light * {
            -webkit-text-fill-color: currentColor;
        }

        body.theme-glass.theme-light .text-white,
        body.theme-glass.theme-light .text-gray-50,
        body.theme-glass.theme-light .text-gray-100,
        body.theme-glass.theme-light .text-gray-200,
        body.theme-glass.theme-light .text-gray-300,
        body.theme-glass.theme-light .text-slate-50,
        body.theme-glass.theme-light .text-slate-100,
        body.theme-glass.theme-light .text-slate-200,
        body.theme-glass.theme-light .text-slate-300,
        body.theme-glass.theme-light .text-zinc-50,
        body.theme-glass.theme-light .text-zinc-100,
        body.theme-glass.theme-light .text-zinc-200,
        body.theme-glass.theme-light .text-neutral-50,
        body.theme-glass.theme-light .text-neutral-100,
        body.theme-glass.theme-light .text-stone-50,
        body.theme-glass.theme-light .text-stone-100 {
            color: #24415f !important;
            -webkit-text-fill-color: #24415f !important;
        }

        /* Utility colors in muted text positions */
        body.theme-glass.theme-light .text-gray-400,
        body.theme-glass.theme-light .text-gray-500,
        body.theme-glass.theme-light .text-slate-400,
        body.theme-glass.theme-light .text-slate-500 {
            color: #526d8a !important;
            -webkit-text-fill-color: #526d8a !important;
        }

        /* Inputs, labels and native controls in every module */
        body.theme-glass.theme-light label,
        body.theme-glass.theme-light input,
        body.theme-glass.theme-light select,
        body.theme-glass.theme-light textarea,
        body.theme-glass.theme-light option,
        body.theme-glass.theme-light button,
        body.theme-glass.theme-light th,
        body.theme-glass.theme-light td,
        body.theme-glass.theme-light p,
        body.theme-glass.theme-light h1,
        body.theme-glass.theme-light h2,
        body.theme-glass.theme-light h3,
        body.theme-glass.theme-light h4,
        body.theme-glass.theme-light h5,
        body.theme-glass.theme-light h6,
        body.theme-glass.theme-light span,
        body.theme-glass.theme-light a {
            -webkit-text-fill-color: currentColor;
        }

        body.theme-glass.theme-light label {
            color: #315574 !important;
        }

        body.theme-glass.theme-light input,
        body.theme-glass.theme-light select,
        body.theme-glass.theme-light textarea {
            color: #1e3b59 !important;
        }

        body.theme-glass.theme-light input::placeholder,
        body.theme-glass.theme-light textarea::placeholder {
            color: #647d99 !important;
            -webkit-text-fill-color: #647d99 !important;
            opacity: 1 !important;
        }

        /* White text on colored buttons/status badges becomes dark ink too */
        body.theme-glass.theme-light button.text-white,
        body.theme-glass.theme-light a.text-white,
        body.theme-glass.theme-light .theme-accent-bg,
        body.theme-glass.theme-light .theme-accent-bg * {
            color: #173451 !important;
            -webkit-text-fill-color: #173451 !important;
        }

        /* Keep icon glyphs inheriting their parent text color */
        body.theme-glass.theme-light [data-lucide],
        body.theme-glass.theme-light svg {
            color: inherit;
        }


        /* Override inline white text as well (including print dialog controls) */
        body.theme-glass.theme-light [style*="color:white"],
        body.theme-glass.theme-light [style*="color: white"],
        body.theme-glass.theme-light [style*="color:#fff"],
        body.theme-glass.theme-light [style*="color: #fff"],
        body.theme-glass.theme-light [style*="color:#ffffff"],
        body.theme-glass.theme-light [style*="color: #ffffff"] {
            color: #24415f !important;
            -webkit-text-fill-color: #24415f !important;
        }


        /* FINAL LABEL FIX — RETUR AND ALL MODULES IN LIGHT MODE */
        body.theme-light label,
        body.theme-glass.theme-light label,
        body.theme-light [id^="tab-"] label,
        body.theme-glass.theme-light [id^="tab-"] label,
        body.theme-light #tab-retur label,
        body.theme-glass.theme-light #tab-retur label {
            color: #244766 !important;
            -webkit-text-fill-color: #244766 !important;
            opacity: 1 !important;
            text-shadow: none !important;
        }



        /* V21: GLOBAL SOFT SHADOW REFINEMENT — all inventory modules.
           Remove heavy black cast shadows that create dark horizontal bands.
           Keep gentle cool-blue elevation and subtle top highlights. */
        body.theme-glass #inventory-main-content .app-card,
        body.theme-glass #inventory-main-content .dashboard-glow-card,
        body.theme-glass #inventory-main-content [id^="tab-"] .rounded-xl.border,
        body.theme-glass #inventory-main-content [id^="tab-"] .rounded-2xl.border,
        body.theme-glass #inventory-main-content [id^="tab-"] .bg-dark-800,
        body.theme-glass #inventory-main-content [id^="tab-"] .bg-dark-900,
        body.theme-glass #inventory-main-content [id^="tab-"] .bg-gray-800,
        body.theme-glass #inventory-main-content [id^="tab-"] .bg-gray-900 {
            box-shadow: 0 5px 18px rgba(35, 75, 120, .075),
                        inset 0 1px 0 rgba(255, 255, 255, .10) !important;
        }

        /* Classic Glass: restrained navy-blue shadow, never a dense black band. */
        body.theme-glass.theme-classic #inventory-main-content .app-card,
        body.theme-glass.theme-classic #inventory-main-content .dashboard-glow-card,
        body.theme-glass.theme-classic #inventory-main-content [id^="tab-"] .rounded-xl.border,
        body.theme-glass.theme-classic #inventory-main-content [id^="tab-"] .rounded-2xl.border {
            box-shadow: 0 6px 20px rgba(0, 12, 28, .16),
                        inset 0 1px 0 rgba(190, 220, 255, .075) !important;
        }
        body.theme-glass.theme-classic #inventory-main-content .app-card:hover,
        body.theme-glass.theme-classic #inventory-main-content .dashboard-glow-card:hover {
            box-shadow: 0 9px 24px rgba(0, 15, 35, .19),
                        0 0 0 1px rgba(96, 165, 250, .08) !important;
        }

        /* Premium Crystal: soft blue-grey ambient shadow. */
        body.theme-glass.theme-crystal #inventory-main-content .app-card,
        body.theme-glass.theme-crystal #inventory-main-content .dashboard-glow-card,
        body.theme-glass.theme-crystal #inventory-main-content [id^="tab-"] .rounded-xl.border,
        body.theme-glass.theme-crystal #inventory-main-content [id^="tab-"] .rounded-2xl.border {
            box-shadow: 0 6px 20px rgba(64, 103, 148, .085),
                        inset 0 1px 0 rgba(255, 255, 255, .72) !important;
        }
        body.theme-glass.theme-crystal #inventory-main-content .app-card:hover,
        body.theme-glass.theme-crystal #inventory-main-content .dashboard-glow-card:hover {
            box-shadow: 0 10px 25px rgba(64, 103, 148, .12),
                        inset 0 1px 0 rgba(255, 255, 255, .78) !important;
        }

        /* Avoid clipping or dark overlay-like effects on module card tops. */
        body.theme-glass #inventory-main-content .app-card::before,
        body.theme-glass #inventory-main-content .dashboard-glow-card::before {
            box-shadow: none !important;
        }


        /* ==========================================================
           V36 — NORMAL SPACING REFINEMENT
           Adjust only layout rhythm and outer gutters.
           Scroll ownership and component functionality remain intact.
           ========================================================== */

        #inventory-main-content {
            padding: 22px 32px !important;
        }

        /* Standard module sections: reduce excessive vertical gaps
           while retaining the original card padding and dimensions. */
        #inventory-main-content > section[id^="tab-"]:not(#tab-dashboard)
        > :not([hidden]) ~ :not([hidden]) {
            margin-top: 20px !important;
        }

        #inventory-main-content > #tab-dashboard
        > :not([hidden]) ~ :not([hidden]) {
            margin-top: 24px !important;
        }

        /* Bring form/list columns slightly closer without changing
           their 12-column proportions or responsive breakpoints. */
        #inventory-main-content .grid.gap-6 {
            gap: 20px !important;
        }

        #inventory-main-content .grid.gap-5 {
            gap: 18px !important;
        }

        #inventory-main-content .premium-dashboard {
            --dashboard-section-gap: 24px;
        }

        #inventory-main-content .premium-dashboard > :not([hidden]) ~ :not([hidden]) {
            margin-top: 24px !important;
        }

        @media (max-width: 1023px) {
            #inventory-main-content {
                padding: 20px 22px !important;
            }
        }

        @media (max-width: 767px) {
            #inventory-main-content {
                padding: 16px 14px !important;
            }

            #inventory-main-content > section[id^="tab-"]:not(#tab-dashboard)
            > :not([hidden]) ~ :not([hidden]),
            #inventory-main-content > #tab-dashboard
            > :not([hidden]) ~ :not([hidden]),
            #inventory-main-content .premium-dashboard > :not([hidden]) ~ :not([hidden]) {
                margin-top: 18px !important;
            }

            #inventory-main-content .grid.gap-6,
            #inventory-main-content .grid.gap-5 {
                gap: 14px !important;
            }
        }


        /* ==========================================================
           V37 — CONTENT-DRIVEN MODULE HEIGHT
           Root cause: Crystal uses a column flex layout. The previous
           #inventory-main-content flex:1 1 0% could stretch the module
           area vertically, leaving a large empty tail on every module.
           Keep width responsive, but let height follow active content.
           ========================================================== */

        #inventory-app-layout,
        body.theme-crystal #inventory-app-layout {
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            align-items: stretch !important;
        }

        #inventory-main-content,
        body.theme-crystal #inventory-main-content {
            flex: 0 0 auto !important;
            align-self: stretch !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            width: 100% !important;
            overflow-x: clip !important;
            overflow-y: visible !important;
        }

        /* Every module panel follows its own content height.
           Hidden tabs remain hidden; active tabs do not fill the viewport. */
        #inventory-main-content > section[id^="tab-"] {
            flex: 0 0 auto !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            align-self: stretch !important;
        }

        #inventory-main-content > section[id^="tab-"][hidden] {
            display: none !important;
        }

        #inventory-main-content > section[id^="tab-"]:not([hidden]) {
            display: block;
        }

        /* Prevent generic utility classes from forcing module-height
           expansion, without changing grid columns or card dimensions. */
        #inventory-main-content > section[id^="tab-"] .h-full,
        #inventory-main-content > section[id^="tab-"] .min-h-screen,
        #inventory-main-content > section[id^="tab-"] .min-h-full {
            min-height: 0 !important;
            height: auto !important;
        }

        @media (max-width: 767px) {
            #inventory-main-content,
            body.theme-crystal #inventory-main-content {
                flex: 0 0 auto !important;
                width: 100% !important;
            }
        }


        /* ==========================================================
           V40 — LIGHT GLASS CONTRAST + DEEPER BACKDROP
           Visual-only refinement for every module. Preserve semantic
           status colors, controls, events, data, and app behavior.
           ========================================================== */

        body.theme-glass.theme-light {
            --theme-bg: #9eafc4;
            --theme-card: rgba(222, 234, 248, .40);
            --theme-card-border: rgba(42, 72, 108, .34);
            --theme-text: #142b45;
            --theme-text-muted: #405873;
            background:
                radial-gradient(ellipse at 9% 7%, rgba(76, 132, 204, .25), transparent 39%),
                radial-gradient(ellipse at 91% 19%, rgba(39, 145, 190, .19), transparent 36%),
                radial-gradient(ellipse at 58% 100%, rgba(54, 88, 130, .18), transparent 43%),
                linear-gradient(135deg, #9eafc4 0%, #b1c1d4 48%, #9aadc3 100%) !important;
            background-attachment: fixed !important;
            color: #142b45 !important;
        }

        /* Main shell: darker translucent glass, not an opaque pale sheet. */
        body.theme-glass.theme-light #inventory-main-content,
        body.theme-glass.theme-light #inventory-app-layout {
            background: transparent !important;
            color: #142b45 !important;
        }

        body.theme-glass.theme-light aside,
        body.theme-glass.theme-light header,
        body.theme-glass.theme-light nav,
        body.theme-glass.theme-light .glass-surface {
            background: linear-gradient(135deg,
                rgba(128, 153, 184, .62),
                rgba(157, 179, 205, .54)) !important;
            border-color: rgba(42, 72, 108, .30) !important;
            color: #142b45 !important;
            backdrop-filter: blur(28px) saturate(150%);
            -webkit-backdrop-filter: blur(28px) saturate(150%);
        }

        /* All module cards and panels use a clearer crystal edge. */
        body.theme-glass.theme-light .app-card,
        body.theme-glass.theme-light .dashboard-glow-card,
        body.theme-glass.theme-light [id^="tab-"] .bg-dark-800,
        body.theme-glass.theme-light [id^="tab-"] .bg-dark-900,
        body.theme-glass.theme-light [id^="tab-"] .bg-dark-700,
        body.theme-glass.theme-light [id^="tab-"] .bg-gray-800,
        body.theme-glass.theme-light [id^="tab-"] .bg-gray-900,
        body.theme-glass.theme-light [id^="tab-"] .rounded-xl.border,
        body.theme-glass.theme-light [id^="tab-"] .rounded-2xl.border,
        body.theme-glass.theme-light [id^="tab-"] [class*="bg-white/"] {
            background: linear-gradient(135deg,
                rgba(226, 237, 249, .53),
                rgba(188, 208, 232, .38)) !important;
            border-color: rgba(42, 72, 108, .31) !important;
            box-shadow:
                0 16px 38px rgba(28, 48, 73, .16),
                inset 0 1px 0 rgba(255, 255, 255, .68),
                inset 0 0 24px rgba(73, 126, 190, .055) !important;
            backdrop-filter: blur(24px) saturate(150%);
            -webkit-backdrop-filter: blur(24px) saturate(150%);
        }

        /* Strong readable ink for neutral text utilities in every module. */
        body.theme-glass.theme-light [id^="tab-"],
        body.theme-glass.theme-light [id^="tab-"] p,
        body.theme-glass.theme-light [id^="tab-"] span,
        body.theme-glass.theme-light [id^="tab-"] div,
        body.theme-glass.theme-light [id^="tab-"] small,
        body.theme-glass.theme-light [id^="tab-"] label,
        body.theme-glass.theme-light [id^="tab-"] th,
        body.theme-glass.theme-light [id^="tab-"] td {
            text-shadow: none;
        }

        body.theme-glass.theme-light [id^="tab-"] .text-white,
        body.theme-glass.theme-light [id^="tab-"] .text-gray-50,
        body.theme-glass.theme-light [id^="tab-"] .text-gray-100,
        body.theme-glass.theme-light [id^="tab-"] .text-gray-200,
        body.theme-glass.theme-light [id^="tab-"] .text-gray-300,
        body.theme-glass.theme-light [id^="tab-"] .text-slate-50,
        body.theme-glass.theme-light [id^="tab-"] .text-slate-100,
        body.theme-glass.theme-light [id^="tab-"] .text-slate-200,
        body.theme-glass.theme-light [id^="tab-"] .text-slate-300 {
            color: #172f4b !important;
        }

        body.theme-glass.theme-light [id^="tab-"] .text-gray-400,
        body.theme-glass.theme-light [id^="tab-"] .text-gray-500,
        body.theme-glass.theme-light [id^="tab-"] .text-slate-400,
        body.theme-glass.theme-light [id^="tab-"] .text-slate-500,
        body.theme-glass.theme-light [id^="tab-"] .text-zinc-400,
        body.theme-glass.theme-light [id^="tab-"] .text-zinc-500,
        body.theme-glass.theme-light [id^="tab-"] .text-neutral-400,
        body.theme-glass.theme-light [id^="tab-"] .text-neutral-500 {
            color: #405873 !important;
        }

        body.theme-glass.theme-light [id^="tab-"] h1,
        body.theme-glass.theme-light [id^="tab-"] h2,
        body.theme-glass.theme-light [id^="tab-"] h3,
        body.theme-glass.theme-light [id^="tab-"] h4,
        body.theme-glass.theme-light [id^="tab-"] .font-semibold,
        body.theme-glass.theme-light [id^="tab-"] .font-bold {
            color: #122b47;
        }

        body.theme-glass.theme-light [id^="tab-"] label,
        body.theme-glass.theme-light [id^="tab-"] .form-label {
            color: #203b5a !important;
            font-weight: 600 !important;
        }

        /* Table text: dark body ink and distinct, darker glass header. */
        body.theme-glass.theme-light [id^="tab-"] table,
        body.theme-glass.theme-light [id^="tab-"] tbody,
        body.theme-glass.theme-light [id^="tab-"] tbody tr,
        body.theme-glass.theme-light [id^="tab-"] tbody td {
            color: #193552 !important;
        }

        body.theme-glass.theme-light [id^="tab-"] thead,
        body.theme-glass.theme-light [id^="tab-"] thead tr,
        body.theme-glass.theme-light [id^="tab-"] thead th {
            background: rgba(105, 137, 174, .62) !important;
            color: #102944 !important;
            border-color: rgba(37, 66, 101, .34) !important;
            font-weight: 700 !important;
        }

        body.theme-glass.theme-light [id^="tab-"] thead th * {
            color: #102944 !important;
        }

        body.theme-glass.theme-light [id^="tab-"] tbody tr {
            background: rgba(225, 237, 249, .20) !important;
        }

        body.theme-glass.theme-light [id^="tab-"] tbody tr:hover {
            background: rgba(81, 128, 181, .17) !important;
        }

        /* Inputs, dropdowns, and placeholders across all modules. */
        body.theme-glass.theme-light input:not([type="checkbox"]):not([type="radio"]),
        body.theme-glass.theme-light select,
        body.theme-glass.theme-light textarea,
        body.theme-glass.theme-light [id^="tab-"] input:not([type="checkbox"]):not([type="radio"]),
        body.theme-glass.theme-light [id^="tab-"] select,
        body.theme-glass.theme-light [id^="tab-"] textarea {
            background: rgba(225, 237, 249, .66) !important;
            color: #142d49 !important;
            -webkit-text-fill-color: #142d49 !important;
            border-color: rgba(42, 76, 116, .38) !important;
        }

        body.theme-glass.theme-light input::placeholder,
        body.theme-glass.theme-light textarea::placeholder {
            color: #526984 !important;
            -webkit-text-fill-color: #526984 !important;
            opacity: 1 !important;
        }

        body.theme-glass.theme-light select,
        body.theme-glass.theme-light select option,
        body.theme-glass.theme-light select optgroup {
            color-scheme: light !important;
            background-color: #dce8f5 !important;
            color: #142d49 !important;
        }

        /* Header and sidebar labels, including collapsed navigation icons. */
        body.theme-glass.theme-light > header,
        body.theme-glass.theme-light #inventory-sidebar {
            color: #142d49 !important;
        }

        body.theme-glass.theme-light > header h1,
        body.theme-glass.theme-light > header .font-bold,
        body.theme-glass.theme-light > header .font-semibold,
        body.theme-glass.theme-light #inventory-sidebar nav button,
        body.theme-glass.theme-light #inventory-sidebar nav button span {
            color: #183653 !important;
        }

        body.theme-glass.theme-light > header .text-gray-400,
        body.theme-glass.theme-light > header .text-gray-500,
        body.theme-glass.theme-light #inventory-sidebar .text-gray-400,
        body.theme-glass.theme-light #inventory-sidebar .text-gray-500 {
            color: #405873 !important;
        }

        body.theme-glass.theme-light #inventory-sidebar nav button.theme-accent-bg,
        body.theme-glass.theme-light #inventory-sidebar nav button.theme-accent-bg span {
            color: #ffffff !important;
        }

        /* Preserve semantic feedback colors (success, warning, danger, info). */
        body.theme-glass.theme-light .text-red-500,
        body.theme-glass.theme-light .text-red-600,
        body.theme-glass.theme-light .text-rose-500,
        body.theme-glass.theme-light .text-rose-600,
        body.theme-glass.theme-light .text-green-500,
        body.theme-glass.theme-light .text-green-600,
        body.theme-glass.theme-light .text-emerald-500,
        body.theme-glass.theme-light .text-emerald-600,
        body.theme-glass.theme-light .text-amber-500,
        body.theme-glass.theme-light .text-orange-500,
        body.theme-glass.theme-light .text-blue-600,
        body.theme-glass.theme-light .text-sky-600 {
            /* Keep the original semantic utility color. */
            color: inherit;
        }

        body.theme-glass.theme-light [id$="-modal"] > div,
        body.theme-glass.theme-light [role="dialog"],
        body.theme-glass.theme-light .modal-content {
            color: #172f4b !important;
            background: linear-gradient(135deg,
                rgba(220, 233, 247, .88),
                rgba(174, 196, 221, .82)) !important;
            border-color: rgba(42, 72, 108, .34) !important;
            backdrop-filter: blur(26px) saturate(150%);
            -webkit-backdrop-filter: blur(26px) saturate(150%);
        }



/* V45 FIX — V37 had later rules forcing main overflow-y:visible.
   This final override restores scrolling only inside main.
   Sidebar declarations and its current appearance are untouched. */
html,
body.theme-glass {
    height: 100% !important;
    min-height: 0 !important;
    max-height: 100% !important;
    overflow: hidden !important;
}
body.theme-glass {
    position: fixed !important;
    inset: 0 !important;
    width: 100% !important;
    display: flex !important;
    flex-direction: column !important;
}
body.theme-glass #inventory-top-header {
    flex: 0 0 4rem !important;
    height: 4rem !important;
    min-height: 4rem !important;
    max-height: 4rem !important;
}
body.theme-glass #inventory-app-layout {
    display: flex !important;
    flex: 1 1 0% !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    overflow: hidden !important;
    align-items: stretch !important;
}
body.theme-glass #inventory-sidebar {
    flex-shrink: 0 !important;
    min-height: 0 !important;
    max-height: 100% !important;
    overflow: hidden !important;
}
body.theme-glass #inventory-sidebar nav {
    overflow: hidden !important;
}
body.theme-glass #inventory-main-content {
    display: block !important;
    flex: 1 1 0% !important;
    width: auto !important;
    height: 100% !important;
    min-width: 0 !important;
    min-height: 0 !important;
    max-height: 100% !important;
    overflow-x: hidden !important;
    overflow-y: auto !important;
    overscroll-behavior-y: contain !important;
    -webkit-overflow-scrolling: touch !important;
}
@media (max-width: 900px) {
    body.theme-glass #inventory-app-layout {
        flex: 1 1 0% !important;
        height: auto !important;
        min-height: 0 !important;
        overflow: hidden !important;
    }
    body.theme-glass #inventory-main-content {
        flex: 1 1 0% !important;
        height: 100% !important;
        min-height: 0 !important;
        max-height: 100% !important;
        overflow-y: auto !important;
    }
}



/* V46 — stable viewport frame; main content owns the vertical scroll.
   Keep the existing sidebar styling/behavior from V43/V45 unchanged. */
html,
body.theme-glass {
    width: 100% !important;
    height: 100% !important;
    min-height: 0 !important;
    max-height: 100% !important;
    overflow: hidden !important;
}
body.theme-glass {
    position: relative !important;
    display: block !important;
}
body.theme-glass #inventory-top-header {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    height: 4rem !important;
    min-height: 4rem !important;
    max-height: 4rem !important;
    z-index: 100 !important;
}
body.theme-glass #inventory-app-layout {
    position: fixed !important;
    top: 4rem !important;
    right: 0 !important;
    bottom: 0 !important;
    left: 0 !important;
    display: flex !important;
    width: 100% !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    overflow: hidden !important;
    align-items: stretch !important;
}
body.theme-glass #inventory-main-content {
    position: relative !important;
    display: block !important;
    flex: 1 1 0% !important;
    width: 0 !important;
    height: 100% !important;
    min-width: 0 !important;
    min-height: 0 !important;
    max-height: 100% !important;
    overflow-x: hidden !important;
    overflow-y: auto !important;
    overscroll-behavior: contain !important;
    -webkit-overflow-scrolling: touch !important;
    scrollbar-gutter: stable;
}
@media (max-width: 900px) {
    body.theme-glass #inventory-app-layout {
        top: 4rem !important;
        bottom: 0 !important;
        height: auto !important;
    }
    body.theme-glass #inventory-main-content {
        width: 0 !important;
        min-height: 0 !important;
        height: 100% !important;
        overflow-y: auto !important;
    }
}


/* V68: mobile sidebar toggle stays outside the off-canvas drawer */
@media (max-width: 900px) {
  #sidebar-toggle.sidebar-mobile-floating-toggle {
    display: inline-flex !important;
    position: fixed !important;
    top: 5rem !important;
    left: 0 !important;
    right: auto !important;
    z-index: 1600 !important;
    width: 42px !important;
    min-width: 42px !important;
    height: 46px !important;
    min-height: 46px !important;
    padding: 0 !important;
    border-radius: 0 12px 12px 0 !important;
    background: rgba(18, 56, 91, .96) !important;
    color: #eaf5ff !important;
    border: 1px solid rgba(125, 184, 240, .55) !important;
    box-shadow: 0 5px 20px rgba(0,0,0,.32) !important;
    visibility: visible !important;
    opacity: 1 !important;
    pointer-events: auto !important;
    transform: none !important;
  }
  #sidebar-toggle.sidebar-mobile-floating-toggle .sidebar-toggle-svg {
    width: 19px !important; height: 19px !important;
  }
}

/* V69 — Mobile sidebar toggle sits directly beside the Logout button. */
@media screen and (max-width: 900px) {
    #inventory-top-header #current-user-banner #sidebar-toggle.sidebar-mobile-floating-toggle {
        display: inline-flex !important;
        position: static !important;
        inset: auto !important;
        flex: 0 0 34px !important;
        width: 34px !important;
        min-width: 34px !important;
        height: 34px !important;
        min-height: 34px !important;
        margin: 0 3px 0 0 !important;
        padding: 7px !important;
        border-radius: .65rem !important;
        transform: none !important;
        z-index: auto !important;
    }
    #inventory-top-header #current-user-banner #sidebar-toggle .sidebar-toggle-svg {
        width: 18px !important;
        height: 18px !important;
    }
}


/* V70 — Mobile drawer uses icon-only navigation; hamburger remains beside Logout. */
@media screen and (max-width: 900px) {
    #inventory-app-layout.mobile-sidebar-open #inventory-sidebar {
        width: 5rem !important;
        flex-basis: 5rem !important;
        max-width: 5rem !important;
    }
    #inventory-app-layout.mobile-sidebar-open #inventory-sidebar nav {
        padding-left: .65rem !important;
        padding-right: .65rem !important;
    }
    #inventory-app-layout.mobile-sidebar-open #inventory-sidebar nav > div:first-child {
        display: none !important;
    }
    #inventory-app-layout.mobile-sidebar-open #inventory-sidebar .sidebar-btn {
        width: 100% !important;
        min-height: 44px !important;
        justify-content: center !important;
        gap: 0 !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
    }
    #inventory-app-layout.mobile-sidebar-open #inventory-sidebar .sidebar-btn > span {
        display: none !important;
    }
    #inventory-app-layout.mobile-sidebar-open #inventory-sidebar .sidebar-btn > i {
        display: inline-flex !important;
        width: 1.2rem !important;
        height: 1.2rem !important;
        margin: 0 !important;
        flex: 0 0 1.2rem !important;
    }
    #inventory-app-layout.mobile-sidebar-open #inventory-sidebar nav > div[id$="-wrapper"] {
        padding-top: .35rem !important;
    }
    #inventory-top-header #current-user-banner #sidebar-toggle .sidebar-toggle-svg {
        width: 19px !important;
        height: 19px !important;
        stroke-width: 2.2 !important;
    }
}


/* V76 — Animation performance refinement.
   Keep the Glass Blue look and interaction feedback, but avoid repeatedly
   repainting large shadows/text-shadows during infinite animations. */
@keyframes borderBlinkRed {
  0%, 100% { opacity: 1; }
  50% { opacity: .32; }
}
@keyframes borderBlinkOrange {
  0%, 100% { opacity: 1; }
  50% { opacity: .32; }
}
@keyframes inventoryButtonTextPulse {
  0%, 100% { color: #dc2626; }
  50% { color: #f87171; }
}
@keyframes inventoryButtonTextPulseCyan {
  0%, 100% { color: #22d3ee; }
  50% { color: #67e8f9; }
}
@keyframes inventoryLightButtonRedStrong {
  0%, 100% { color: #dc2626; -webkit-text-fill-color: #dc2626; }
  50% { color: #ff1744; -webkit-text-fill-color: #ff1744; }
}
@keyframes inventoryLightHoverPulseV59 {
  0%, 100% { color: #c90024 !important; -webkit-text-fill-color: #c90024 !important; }
  50% { color: #ff1744 !important; -webkit-text-fill-color: #ff1744 !important; }
}

/* Keep entrance motion subtle; disable motion on request at OS level. */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
</style>
<style id="v83-movement-chart-wide-compact">
/* V83: chart follows the available content width without creating a tall card.
   Existing tables and their responsive wrappers are intentionally untouched. */
#tab-dashboard #movement-trend-card {
  display:block; width:100%; max-width:100%; min-width:0; box-sizing:border-box;
  overflow:hidden;
}
#tab-dashboard #movement-trend-card > * { min-width:0; }
#tab-dashboard #movement-trend-card .movement-trend-chart {
  display:block; width:100%; max-width:100%; height:190px; min-height:190px;
  aspect-ratio:auto; overflow:hidden; box-sizing:border-box;
}
#tab-dashboard #movement-trend-card .movement-trend-chart svg {
  display:block; width:100%; height:100%; max-width:100%; max-height:none;
  overflow:hidden;
}
#tab-dashboard #movement-trend-card .grid.grid-cols-3 {
  width:100%; min-width:0;
}
#tab-dashboard #movement-trend-card .movement-summary {
  min-width:0; overflow:hidden;
}
@media (max-width:640px) {
  #tab-dashboard #movement-trend-card { padding:14px !important; }
  #tab-dashboard #movement-trend-card .movement-trend-chart { height:165px; min-height:165px; }
  #tab-dashboard #movement-trend-card .movement-summary { min-height:56px; padding:7px 8px; }
  #tab-dashboard #movement-trend-card .movement-summary strong {
    font-size:clamp(11px,3.5vw,14px); overflow-wrap:anywhere;
  }
}
@media (max-width:360px) {
  #tab-dashboard #movement-trend-card .movement-trend-chart { height:150px; min-height:150px; }
  #tab-dashboard #movement-trend-card .movement-summary span { font-size:7px; }
}
</style>
</head><body><h2>${escapePrintHtml(config.title)}</h2>
                <p class="meta">Periode: ${escapePrintHtml(periodLabel)} &nbsp; | &nbsp; Total: ${rows.length} data &nbsp; | &nbsp; Dicetak: ${escapePrintHtml(nowStr)}</p>
                <table><thead><tr><th class="no">No</th>${headers.map(([,label])=>`<th>${escapePrintHtml(label)}</th>`).join('')}</tr></thead><tbody>${bodyRows}</tbody></table>
                
<style id="v86-movement-chart-shorter-wide">
/* V86: keep the original wide chart presentation while reducing its vertical footprint.
   Compact summary cards from V84/V85 remain unchanged. Tables and other modules are untouched. */
#tab-dashboard #movement-trend-card .movement-trend-chart {
  display:block; width:100%; max-width:100%; min-width:0; min-height:0; height:auto;
  aspect-ratio:760 / 145; overflow:hidden; box-sizing:border-box;
}
#tab-dashboard #movement-trend-card .movement-trend-chart svg {
  display:block; width:100%; height:100%; max-width:100%; max-height:none; overflow:hidden;
}
@media (max-width:640px) {
  #tab-dashboard #movement-trend-card .movement-trend-chart { aspect-ratio:760 / 155; }
}
</style>

<style id="v88-movement-axis-typography">
/* V88: scale chart axis numbers and dates to a restrained, readable size. */
#tab-dashboard #movement-trend-card .movement-axis-value {
  font-size:8px !important; font-weight:600;
}
#tab-dashboard #movement-trend-card .movement-axis-date {
  font-size:9px !important; font-weight:600;
}
@media (max-width:640px) {
  #tab-dashboard #movement-trend-card .movement-axis-value { font-size:13px !important; }
  #tab-dashboard #movement-trend-card .movement-axis-date { font-size:13px !important; }
}
</style>


<style id="v89-movement-chart-polish">
/* V89: keep the final date label inside the plot and refine line weight. */
#tab-dashboard #movement-trend-card .movement-trend-chart svg { overflow:visible; }
#tab-dashboard #movement-trend-card .movement-axis-date { dominant-baseline:auto; }
#tab-dashboard #movement-trend-card .movement-trend-chart circle { cursor:crosshair; }
</style>
\n

<style id="v90-chart-axis-font-compact">
/* V90: slightly smaller axis labels while preserving readability and chart proportions. */
#tab-dashboard #movement-trend-card .movement-axis-value {
  font-size:6px !important; font-weight:600;
}
#tab-dashboard #movement-trend-card .movement-axis-date {
  font-size:7px !important; font-weight:600;
}
@media (max-width:640px) {
  #tab-dashboard #movement-trend-card .movement-axis-value { font-size:10px !important; }
  #tab-dashboard #movement-trend-card .movement-axis-date { font-size:10px !important; }
}
</style>


<style id="v91-dark-chart-axis-readable">
/* V91: ensure chart axis labels remain light and readable in dark mode. */
body.theme-glass.theme-dark #tab-dashboard #movement-trend-card .movement-axis-value,
body.theme-glass.theme-dark #tab-dashboard #movement-trend-card .movement-axis-date {
  fill: #E6EDF5 !important;
  color: #E6EDF5 !important;
  opacity: 1 !important;
}
</style>




<style id="v120-admin-header-layout">
/* V120: tampilkan identitas pengguna lengkap seperti referensi, termasuk pada mobile. */
#inventory-top-header #current-user-banner {
  display:inline-flex !important; align-items:center !important; gap:10px !important;
}
#inventory-top-header #current-user-banner > div {
  display:flex !important; align-items:center !important; gap:9px !important;
}
#inventory-top-header #current-user-banner > div > div:first-child {
  display:flex !important; flex:0 0 30px !important;
}
#inventory-top-header #current-user-banner > div > div:last-child,
#inventory-top-header #current-user-banner > div > div.hidden,
#inventory-top-header #current-user-banner > div .font-bold {
  display:block !important; visibility:visible !important;
}
#inventory-top-header #current-user-banner .role-badge-admin,
#inventory-top-header #current-user-banner .role-badge-staff,
#inventory-top-header #current-user-banner .role-badge-viewer {
  display:inline-block !important; width:max-content !important; margin-top:3px !important;
}
@media (max-width:767px) {
  #inventory-top-header { display:flex !important; flex-wrap:nowrap !important; }
  #inventory-top-header #header-brand-group { min-width:0 !important; flex:0 1 auto !important; }
  #inventory-top-header > div:last-child { min-width:0 !important; flex:0 0 auto !important; gap:6px !important; }
  #inventory-top-header #live-clock { flex:0 1 auto !important; min-width:0 !important; }
  #inventory-top-header #current-user-banner { flex:0 0 auto !important; padding:5px 7px !important; gap:7px !important; }
  #inventory-top-header #current-user-banner > div { display:flex !important; gap:7px !important; }
  #inventory-top-header #current-user-banner > div > div:first-child { display:flex !important; }
  #inventory-top-header #current-user-banner > div > div:last-child { display:block !important; min-width:0 !important; }
  #inventory-top-header #current-user-banner > div .font-bold { display:block !important; font-size:11px !important; white-space:nowrap !important; }
  #inventory-top-header #current-user-banner .role-badge-admin,
  #inventory-top-header #current-user-banner .role-badge-staff,
  #inventory-top-header #current-user-banner .role-badge-viewer { font-size:9px !important; padding:1px 6px !important; }
  #inventory-top-header #current-user-banner > button { display:inline-flex !important; flex:0 0 30px !important; }
}
@media (max-width:420px) {
  #inventory-top-header #current-user-banner { gap:4px !important; padding:4px !important; }
  #inventory-top-header #current-user-banner > div { gap:4px !important; }
  #inventory-top-header #current-user-banner > div > div:first-child { display:none !important; }
  #inventory-top-header #current-user-banner > div .font-bold { font-size:10px !important; }
  #inventory-top-header #live-clock { font-size:7px !important; }
}
</style>


<style id="v121-compact-premium-clock">
/* V121: Compact Premium clock, aligned with Glass Blue and the V120 user badge. */
#inventory-top-header #live-clock {
  display:flex !important; align-items:center !important; justify-content:center !important;
  gap:8px !important; flex:0 1 auto !important; min-width:0 !important;
  padding:7px 12px !important; border-radius:14px !important;
  color:#dcecff !important; background:linear-gradient(115deg,rgba(59,130,246,.16),rgba(34,211,238,.10)) !important;
  border:1px solid rgba(125,185,255,.30) !important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 4px 16px rgba(15,80,150,.12) !important;
  font-family:ui-monospace,SFMono-Regular,Menlo,monospace !important;
  font-size:12px !important; font-weight:700 !important; letter-spacing:.025em !important;
  line-height:1.25 !important; white-space:nowrap !important;
  font-variant-numeric:tabular-nums !important;
}
#inventory-top-header #live-clock svg { width:15px !important; height:15px !important; flex:0 0 auto !important; color:#60baff !important; }
body.theme-crystal #inventory-top-header #live-clock {
  color:#315b87 !important; background:linear-gradient(115deg,rgba(219,237,255,.88),rgba(224,249,255,.78)) !important;
  border-color:rgba(87,145,205,.30) !important; box-shadow:inset 0 1px 0 rgba(255,255,255,.8),0 4px 14px rgba(52,105,160,.10) !important;
}
body.theme-crystal #inventory-top-header #live-clock svg { color:#278bd2 !important; }
@media (max-width:767px) {
  #inventory-top-header #live-clock { display:flex !important; gap:5px !important; padding:6px 8px !important; font-size:10px !important; letter-spacing:0 !important; }
  #inventory-top-header #live-clock svg { width:13px !important; height:13px !important; }
}
@media (max-width:380px) {
  #inventory-top-header #live-clock { padding:5px 6px !important; font-size:9px !important; gap:4px !important; }
}
</style>



<style id="v123-vertical-premium-clock-final">
/* V123: susunan vertikal tegas — jam di atas, tanggal + WIB di bawah. */
#inventory-top-header #live-clock {
  display:flex !important; flex-direction:row !important; align-items:center !important;
  justify-content:flex-start !important; gap:8px !important;
  padding:6px 10px !important; min-width:0 !important; flex:0 1 auto !important;
  border-radius:12px !important; white-space:normal !important;
  font-variant-numeric:tabular-nums !important; line-height:1.15 !important;
}
#inventory-top-header #live-clock > svg,
#inventory-top-header #live-clock > i {
  display:block !important; width:16px !important; height:16px !important;
  flex:0 0 16px !important; align-self:center !important;
}
#inventory-top-header #live-clock .clock-copy {
  display:flex !important; flex-direction:column !important;
  align-items:flex-start !important; justify-content:center !important;
  gap:3px !important; min-width:0 !important;
}
#inventory-top-header #live-clock [data-clock-time] {
  display:block !important; font-family:ui-monospace,SFMono-Regular,Menlo,monospace !important;
  font-size:13px !important; font-weight:800 !important; letter-spacing:.025em !important;
  line-height:1.1 !important; white-space:nowrap !important;
}
#inventory-top-header #live-clock [data-clock-date] {
  display:block !important; font-family:Inter,system-ui,sans-serif !important;
  font-size:9px !important; font-weight:600 !important; letter-spacing:0 !important;
  line-height:1.15 !important; white-space:nowrap !important; opacity:.82 !important;
}
@media (max-width:767px) {
  #inventory-top-header #live-clock { display:flex !important; gap:6px !important; padding:5px 7px !important; }
  #inventory-top-header #live-clock > svg, #inventory-top-header #live-clock > i { width:14px !important; height:14px !important; flex-basis:14px !important; }
  #inventory-top-header #live-clock [data-clock-time] { font-size:11px !important; }
  #inventory-top-header #live-clock [data-clock-date] { font-size:8px !important; }
}
@media (max-width:380px) {
  #inventory-top-header #live-clock { gap:5px !important; padding:4px 6px !important; }
  #inventory-top-header #live-clock [data-clock-time] { font-size:10px !important; }
  #inventory-top-header #live-clock [data-clock-date] { font-size:7px !important; }
}
</style>


<style id="v171-dashboard-chart-axis-contrast">
/* V171: override the legacy Light Mode fills (#526d88 / #355574)
   only for the Dashboard movement chart axis labels. */
html body #tab-dashboard #movement-trend-card .movement-trend-chart svg text.movement-axis-value,
html body #tab-dashboard #movement-trend-card .movement-trend-chart svg text.movement-axis-date {
  fill: #F4F8FF !important;
  color: #F4F8FF !important;
  opacity: 1 !important;
  font-weight: 750 !important;
}
</style>



<style id="v178-admin-badge-popup-isolation">
/* V178 — cegah badge/identitas Admin dari header menembus popup Simpan dan Ganti UI.
   Berlaku pada kedua UI dan semua tema; tidak mengubah autentikasi, role, atau proses simpan. */
html body:has(#detail-save-modal:not(.hidden)) #inventory-top-header,
html body:has(#appearance-panel:not(.hidden)) #inventory-top-header,
html body:has(#confirm-modal:not(.hidden)) #inventory-top-header,
html body:has(#auto-logout-modal:not(.hidden)) #inventory-top-header,
html body:has(#inventory-print-options:not(.hidden)) #inventory-top-header {
  visibility: hidden !important;
  pointer-events: none !important;
}

/* Pastikan overlay popup berada di atas header, termasuk badge Admin. */
html body:has(#detail-save-modal:not(.hidden)) #detail-save-modal,
html body:has(#appearance-panel:not(.hidden)) #appearance-panel,
html body:has(#confirm-modal:not(.hidden)) #confirm-modal,
html body:has(#auto-logout-modal:not(.hidden)) #auto-logout-modal {
  z-index: 2000 !important;
}

/* Jaga agar badge role hanya tampil di area identitas pengguna saat popup tertutup. */
html body:has(#detail-save-modal:not(.hidden)) #current-user-banner .role-badge-admin,
html body:has(#appearance-panel:not(.hidden)) #current-user-banner .role-badge-admin,
html body:has(#confirm-modal:not(.hidden)) #current-user-banner .role-badge-admin,
html body:has(#auto-logout-modal:not(.hidden)) #current-user-banner .role-badge-admin {
  display: none !important;
}
</style>



<style id="v179-hide-user-chip-during-appearance">
/* V179 — sembunyikan seluruh identitas header, termasuk greeting/badge mobile,
   saat dialog Tampilan Aplikasi terbuka. */
html body:has(#appearance-panel:not(.hidden)) #inventory-top-header,
html body:has(#appearance-panel:not(.hidden)) #inventory-top-header #current-user-banner,
html body:has(#appearance-panel:not(.hidden)) #inventory-top-header #v156-mobile-greeting,
html body:has(#appearance-panel:not(.hidden)) #inventory-top-header #v167-mobile-role-badge {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}
</style>

</body>
<style id="v100-liquid-glass-toast">
/* V100 — Premium Liquid Glass Toast: scoped only to the notification component */
#toast-container {
    top: max(1.1rem, env(safe-area-inset-top)) !important;
    left: 50% !important;
    width: min( min(440px, calc(100vw - 28px)), 440px) !important;
    align-items: stretch !important;
    gap: 10px !important;
    pointer-events: none !important;
}
#toast-container .inventory-toast {
    --toast-tone: 96,165,250;
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 68px;
    box-sizing: border-box;
    overflow: hidden;
    padding: 13px 14px;
    border: 1px solid rgba(219,234,254,.34);
    border-radius: 18px;
    color: #f8fbff !important;
    background:
      linear-gradient(118deg, rgba(255,255,255,.19), rgba(255,255,255,.055) 48%, rgba(var(--toast-tone),.13)),
      rgba(12,25,43,.86);
    -webkit-backdrop-filter: blur(24px) saturate(175%);
    backdrop-filter: blur(24px) saturate(175%);
    box-shadow: 0 18px 48px rgba(2,8,23,.30), inset 0 1px 0 rgba(255,255,255,.28), 0 0 24px rgba(var(--toast-tone),.10);
    text-shadow: none;
    pointer-events: auto;
    isolation: isolate;
    animation: inventoryToastEnter .46s cubic-bezier(.18,.89,.32,1.22) both;
}
#toast-container .inventory-toast::before {
    content: "";
    position: absolute;
    inset: 0 0 auto;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.85), transparent);
    opacity: .85;
    pointer-events: none;
}
#toast-container .inventory-toast::after {
    content: "";
    position: absolute;
    width: 115px;
    height: 115px;
    top: -78px;
    left: -42px;
    border-radius: 50%;
    background: rgba(var(--toast-tone),.20);
    filter: blur(28px);
    pointer-events: none;
    z-index: -1;
}
#toast-container .toast-success { --toast-tone: 52,211,153; }
#toast-container .toast-error { --toast-tone: 251,113,133; }
#toast-container .toast-warning { --toast-tone: 251,191,36; }
#toast-container .toast-info { --toast-tone: 96,165,250; }
#toast-container .inventory-toast-icon {
    display: grid;
    place-items: center;
    flex: 0 0 38px;
    width: 38px;
    height: 38px;
    border: 1px solid rgba(var(--toast-tone),.46);
    border-radius: 13px;
    color: rgb(var(--toast-tone)) !important;
    background: rgba(var(--toast-tone),.15);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.18), 0 0 18px rgba(var(--toast-tone),.12);
}
#toast-container .inventory-toast-copy {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
    color: #f8fbff !important;
    line-height: 1.35;
}
#toast-container .inventory-toast-copy strong {
    color: #fff !important;
    font-size: 12px;
    font-weight: 750;
    letter-spacing: .015em;
}
#toast-container .inventory-toast-copy > span {
    color: rgba(235,244,255,.82) !important;
    font-size: 11px;
    font-weight: 500;
    overflow-wrap: anywhere;
}
#toast-container .inventory-toast-close {
    display: grid;
    place-items: center;
    flex: 0 0 28px;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 1px solid rgba(255,255,255,.14);
    border-radius: 9px;
    color: rgba(255,255,255,.78) !important;
    background: rgba(255,255,255,.075);
    cursor: pointer;
    transition: background .18s ease, transform .18s ease;
}
#toast-container .inventory-toast-close:hover {
    background: rgba(255,255,255,.17);
    transform: scale(1.06);
}
#toast-container .inventory-toast-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    transform-origin: left center;
    background: rgba(var(--toast-tone),.95);
    box-shadow: 0 0 10px rgba(var(--toast-tone),.55);
    animation: inventoryToastProgress var(--toast-duration, 3600ms) linear forwards;
}
#toast-container .inventory-toast.toast-leaving {
    animation: inventoryToastExit .24s ease-in forwards !important;
}
body.theme-glass.theme-light #toast-container .inventory-toast {
    color: #173451 !important;
    background:
      linear-gradient(120deg, rgba(255,255,255,.72), rgba(235,245,255,.42) 52%, rgba(var(--toast-tone),.10)),
      rgba(210,226,244,.88);
    border-color: rgba(53,88,128,.28);
    box-shadow: 0 16px 42px rgba(28,51,79,.20), inset 0 1px 0 rgba(255,255,255,.88), 0 0 22px rgba(var(--toast-tone),.10);
}
body.theme-glass.theme-light #toast-container .inventory-toast-copy,
body.theme-glass.theme-light #toast-container .inventory-toast-copy strong {
    color: #173451 !important;
    -webkit-text-fill-color: #173451 !important;
}
body.theme-glass.theme-light #toast-container .inventory-toast-copy > span {
    color: #49627f !important;
    -webkit-text-fill-color: #49627f !important;
}
body.theme-glass.theme-light #toast-container .inventory-toast-close {
    color: #36516e !important;
    border-color: rgba(53,88,128,.20);
    background: rgba(255,255,255,.35);
}
@keyframes inventoryToastEnter {
    0% { opacity: 0; transform: translate3d(0,-18px,0) scale(.94); filter: blur(5px); }
    72% { opacity: 1; transform: translate3d(0,2px,0) scale(1.012); filter: blur(0); }
    100% { opacity: 1; transform: translate3d(0,0,0) scale(1); filter: blur(0); }
}
@keyframes inventoryToastExit {
    to { opacity: 0; transform: translate3d(0,-10px,0) scale(.97); filter: blur(3px); }
}
@keyframes inventoryToastProgress {
    from { transform: scaleX(1); }
    to { transform: scaleX(0); }
}
@media (max-width: 480px) {
    #toast-container { width: calc(100vw - 24px) !important; }
    #toast-container .inventory-toast { min-height: 64px; padding: 11px 12px; border-radius: 16px; }
}
@media (prefers-reduced-motion: reduce) {
    #toast-container .inventory-toast,
    #toast-container .inventory-toast.toast-leaving,
    #toast-container .inventory-toast-progress { animation: none !important; }
}
</style>


<style id="v101-toast-layout-fix">
/* V101: harden toast text stacking against global utility/component styles */
#toast-container .inventory-toast {
    display: grid !important;
    grid-template-columns: 38px minmax(0,1fr) 28px !important;
    align-items: center !important;
    column-gap: 12px !important;
}
#toast-container .inventory-toast-icon { grid-column: 1; grid-row: 1; }
#toast-container .inventory-toast-copy {
    grid-column: 2;
    grid-row: 1;
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-start !important;
    justify-content: center !important;
    gap: 4px !important;
    min-width: 0 !important;
    width: 100% !important;
    white-space: normal !important;
}
#toast-container .inventory-toast-copy strong {
    display: block !important;
    width: 100% !important;
    margin: 0 !important;
    line-height: 1.2 !important;
}
#toast-container .inventory-toast-copy > span {
    display: block !important;
    width: 100% !important;
    margin: 0 !important;
    line-height: 1.35 !important;
    white-space: normal !important;
}
#toast-container .inventory-toast-close {
    grid-column: 3;
    grid-row: 1;
    justify-self: end;
}
@media (max-width: 480px) {
    #toast-container .inventory-toast {
        grid-template-columns: 34px minmax(0,1fr) 26px !important;
        column-gap: 10px !important;
    }
    #toast-container .inventory-toast-icon { width: 34px; height: 34px; }
}
</style>


<style id="v122-compact-premium-clock-final">
/* V122: match konsep A — waktu menonjol, tanggal dan WIB pada baris kedua. */
#inventory-top-header #live-clock {
  display:flex !important; align-items:center !important; justify-content:center !important;
  gap:9px !important; flex:0 0 auto !important; min-width:0 !important;
  padding:7px 12px !important; border-radius:14px !important;
  color:#e7f2ff !important;
  background:linear-gradient(120deg,rgba(59,130,246,.17),rgba(34,211,238,.10)) !important;
  border:1px solid rgba(125,185,255,.32) !important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.09),0 4px 16px rgba(15,80,150,.12) !important;
  font-family:ui-monospace,SFMono-Regular,Menlo,monospace !important;
  font-size:12px !important; font-weight:700 !important; letter-spacing:0 !important;
  line-height:1.2 !important; white-space:nowrap !important; font-variant-numeric:tabular-nums !important;
}
#inventory-top-header #live-clock > svg { width:17px !important; height:17px !important; flex:0 0 auto !important; color:#60baff !important; }
#inventory-top-header #live-clock .clock-copy { display:flex !important; flex-direction:column !important; align-items:flex-start !important; gap:3px !important; min-width:0 !important; }
#inventory-top-header #live-clock [data-clock-time] { display:block !important; font-size:13px !important; font-weight:800 !important; letter-spacing:.035em !important; line-height:1.1 !important; }
#inventory-top-header #live-clock [data-clock-date] { display:block !important; font-family:Inter,system-ui,sans-serif !important; font-size:9px !important; font-weight:600 !important; letter-spacing:.015em !important; opacity:.82 !important; line-height:1.15 !important; }
body.theme-crystal #inventory-top-header #live-clock { color:#315b87 !important; background:linear-gradient(120deg,rgba(219,237,255,.9),rgba(224,249,255,.82)) !important; border-color:rgba(87,145,205,.32) !important; }
body.theme-crystal #inventory-top-header #live-clock > svg { color:#278bd2 !important; }
@media (max-width:767px) {
  #inventory-top-header #live-clock { display:flex !important; gap:6px !important; padding:6px 8px !important; }
  #inventory-top-header #live-clock > svg { width:15px !important; height:15px !important; }
  #inventory-top-header #live-clock [data-clock-time] { font-size:11px !important; }
  #inventory-top-header #live-clock [data-clock-date] { font-size:8px !important; }
}
@media (max-width:380px) {
  #inventory-top-header #live-clock { gap:5px !important; padding:5px 6px !important; }
  #inventory-top-header #live-clock [data-clock-time] { font-size:10px !important; }
  #inventory-top-header #live-clock [data-clock-date] { font-size:7px !important; }
}
</style>

</html>`);
            printWindow.onload = () => { printWindow.focus(); printWindow.print(); };
            printWindow.document.close();
            printWindow.focus();
        }


        // KONFIRMASI DETAIL SEBELUM MENYIMPAN: berlaku untuk seluruh form utama.
        // Fungsi simpan asli tetap dipakai agar validasi, Worker, dan sinkronisasi tidak berubah.
        (function installDetailSaveConfirmation() {
            const definitions = {
                saveMasterItem: {
                    form: 'form-master', title: 'KONFIRMASI MASTER BARANG',
                    fields: [['master-id','ID Barang'],['master-nama','Nama Barang'],['master-jenis','Jenis Barang'],['master-lebar','Lebar'],['master-ukuran','Ukuran'],['master-berat','Berat'],['master-satuan','Satuan'],['master-min','Stok Minimum'],['master-stok','Stok Saat Ini']]
                },
                savePoItem: {
                    form: 'form-po', title: 'KONFIRMASI PO CUSTOMER',
                    fields: [['po-id','ID Detail PO (utama)'],['po-no-customer','Nomor PO Customer'],['po-tanggal','Tanggal PO'],['po-customer','Customer']]
                },
                saveMasukItem: {
                    form: 'form-masuk', title: 'KONFIRMASI BARANG MASUK',
                    fields: [['masuk-id','ID Transaksi'],['masuk-tanggal','Tanggal'],['masuk-barang','ID Barang'],['masuk-qty','Jumlah Masuk (Qty)'],['masuk-supplier','Divisi']]
                },
                saveKeluarItem: {
                    form: 'form-keluar', title: 'KONFIRMASI BARANG KELUAR',
                    fields: [['keluar-id','ID Transaksi / Surat Jalan'],['keluar-tanggal','Tanggal'],['keluar-po-group','Nomor PO Customer'],['keluar-tujuan','Tujuan / Customer']]
                },
                saveSampelItem: {
                    form: 'form-sampel', title: 'KONFIRMASI DATA SAMPEL',
                    fields: [['sampel-id','ID Sampel'],['sampel-tanggal','Tanggal'],['sampel-customer','Customer'],['sampel-nama','Nama Sampel'],['sampel-kategori','Kategori'],['sampel-lebar','Lebar'],['sampel-ukuran','Ukuran'],['sampel-berat','Berat'],['sampel-tebal','Tebal']]
                },
                saveReturItem: {
                    form: 'form-retur', title: 'KONFIRMASI RETUR',
                    fields: [['retur-id','ID Retur'],['retur-tanggal','Tanggal'],['retur-barang','ID Barang'],['retur-keluar-ref','Transaksi Keluar Asal'],['retur-qty','Jumlah Retur (Qty)'],['retur-keterangan','Keterangan']]
                }
            };

            const modal = document.getElementById('detail-save-modal');
            const content = document.getElementById('detail-save-content');
            const subtitle = document.getElementById('detail-save-subtitle');
            const backBtn = document.getElementById('detail-save-back');
            const yesBtn = document.getElementById('detail-save-yes');
            let pendingAction = null;

            function fieldValue(id) {
                const el = document.getElementById(id);
                if (!el) return '-';
                if (el.tagName === 'SELECT') {
                    const value = String(el.value ?? '').trim();
                    const opt = el.options[el.selectedIndex];
                    const text = opt ? opt.textContent.trim() : '';
                    if (!value) return '-';

                    // Nilai internal group adalah customer|nomor PO.
                    // Popup bagian atas hanya menampilkan nomor PO; customer tampil
                    // pada baris Tujuan/Customer, jadi jangan gunakan label option
                    // yang menggabungkan keduanya.
                    if (id === 'keluar-po-group') {
                        const poNumber = value.includes('|') ? value.split('|').pop().trim() : value;
                        return poNumber || text || '-';
                    }

                    // ID barang ditampilkan sendiri; nama barang ada pada baris detail terpisah.
                    const item = (window.gudangAppDb?.items || []).find(x => String(x.id) === value);
                    if (item) return value;

                    // Dropdown lain cukup gunakan label yang terlihat oleh pengguna.
                    return text || value;
                }
                const raw = String(el.value ?? '').trim();
                if (!raw) return '-';

                // Normalisasi nomor PO lama jika tersimpan sebagai customer|nomor.
                if (id === 'po-no-customer') {
                    let poNumber = raw.includes('|') ? raw.split('|').pop().trim() : raw;
                    const customer = String(document.getElementById('po-customer')?.value || '').trim().toUpperCase();
                    const parts = poNumber.split(/[—–]/).map(part => part.trim()).filter(Boolean);
                    const uniqueParts = [...new Set(parts.filter(part => part.toUpperCase() !== customer))];
                    return uniqueParts[0] || poNumber || raw;
                }
                return raw;
            }

            function addDetailRow(label, value, parent = content) {
                const row = document.createElement('div');
                row.className = 'grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-3 py-2 border-b border-white/10 text-xs';
                const name = document.createElement('div');
                name.className = 'text-gray-400';
                name.textContent = label;
                const val = document.createElement('div');
                val.className = 'text-gray-100 font-semibold text-right break-words';
                val.textContent = value;
                row.append(name, val);
                parent.appendChild(row);
            }

            function makeNoticeCard(title, pillText = '') {
                const card = document.createElement('section');
                card.className = 'mb-3 rounded-xl border border-white/20 bg-white/[0.04] p-3';
                const head = document.createElement('div');
                head.className = 'mb-2 flex items-center justify-between gap-2 border-b border-white/15 pb-2';
                const label = document.createElement('span');
                label.className = 'text-xs font-bold text-emerald-300';
                label.textContent = title;
                head.appendChild(label);
                if (pillText) {
                    const pill = document.createElement('span');
                    pill.className = 'rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-bold text-emerald-300';
                    pill.textContent = pillText;
                    head.appendChild(pill);
                }
                card.appendChild(head);
                return card;
            }

            function addSelectedItemDetails(formName) {
                const db = window.gudangAppDb || {};
                const items = db.items || [];

                // PO CUSTOMER: setiap barang ditampilkan dalam kartu seragam seperti Barang Keluar.
                if (formName === 'savePoItem') {
                    const rows = readPoItemRows();
                    const heading = document.createElement('div');
                    heading.className = 'mb-2 rounded-lg border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-xs font-bold text-sky-200';
                    heading.textContent = 'RINCIAN BARANG DALAM PO';
                    content.appendChild(heading);
                    rows.forEach((r, i) => {
                        const item = items.find(x => String(x.id) === String(r.barangId));
                        const card = makeNoticeCard(`BARANG ${i + 1}`, `${Number(r.qty || 0).toLocaleString('id-ID')} ${item?.satuan || ''}`.trim());
                        addDetailRow('ID Barang', r.barangId || '-', card);
                        addDetailRow('Nama Barang', window.displayItemName(r.barangId, item?.nama || r.nama || r.barangId), card);
                        addDetailRow('Qty PO', `${Number(r.qty || 0).toLocaleString('id-ID')} ${item?.satuan || ''}`.trim(), card);
                        addDetailRow('Qty Siap Dikirim', `${Number(r.siapKirim || 0).toLocaleString('id-ID')} ${item?.satuan || ''}`.trim(), card);
                        content.appendChild(card);
                    });
                    const total = document.createElement('div');
                    total.className = 'mt-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3';
                    addDetailRow('Total Jenis Barang', String(rows.length), total);
                    addDetailRow('Total Qty PO', rows.reduce((n, r) => n + Number(r.qty || 0), 0).toLocaleString('id-ID'), total);
                    addDetailRow('Total Qty Siap Dikirim', rows.reduce((n, r) => n + Number(r.siapKirim || 0), 0).toLocaleString('id-ID'), total);
                    content.appendChild(total);
                    return;
                }

                // BARANG KELUAR: pertahankan format kartu acuan yang sudah disetujui.
                if (formName === 'saveKeluarItem') {
                    const selected = [...document.querySelectorAll('#keluar-items-container [data-keluar-row]')]
                        .map(card => ({poRef:card.dataset.poRef,barangId:card.dataset.barangId,qty:Number(card.querySelector('[data-keluar-qty]')?.value||0)}))
                        .filter(x => x.qty > 0);
                    const heading = document.createElement('div');
                    heading.className = 'mb-2 rounded-lg border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-xs font-bold text-sky-200';
                    heading.textContent = 'RINCIAN BARANG YANG AKAN DISIMPAN';
                    content.appendChild(heading);
                    selected.forEach((r, i) => {
                        const po = (db.po || []).find(x => String(x.id) === String(r.poRef));
                        const item = items.find(x => String(x.id) === String(r.barangId));
                        const card = makeNoticeCard(`BARANG ${i + 1}`, `${r.qty.toLocaleString('id-ID')} ${item?.satuan || ''}`.trim());
                        addDetailRow('ID Barang', r.barangId, card);
                        addDetailRow('Nama Barang', window.displayItemName(r.barangId, item?.nama || r.nama || r.barangId), card);
                        addDetailRow('Qty Keluar', `${r.qty.toLocaleString('id-ID')} ${item?.satuan || ''}`.trim(), card);
                        if (po) addDetailRow('Qty PO / Terkirim / Siap', `${Number(po.qty || 0).toLocaleString('id-ID')} / ${Number(po.terkirim || 0).toLocaleString('id-ID')} / ${getPoReadyQty(po).toLocaleString('id-ID')}`, card);
                        content.appendChild(card);
                    });
                    const totalCard = document.createElement('div');
                    totalCard.className = 'mt-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3';
                    addDetailRow('Total Jenis Barang', String(selected.length), totalCard);
                    addDetailRow('Total Qty Keluar', selected.reduce((sum, x) => sum + x.qty, 0).toLocaleString('id-ID'), totalCard);
                    content.appendChild(totalCard);
                    return;
                }

                // MASTER BARANG: satu kartu ringkas untuk seluruh spesifikasi barang.
                if (formName === 'saveMasterItem') {
                    const id = document.getElementById('master-id')?.value || '-';
                    const card = makeNoticeCard('DETAIL MASTER BARANG', id);
                    [['Nama Barang','master-nama'],['Jenis Barang','master-jenis'],['Lebar Barang','master-lebar'],['Ukuran Barang','master-ukuran'],['Berat','master-berat'],['Satuan','master-satuan'],['Stok Minimum','master-min'],['Stok Saat Ini','master-stok']]
                        .forEach(([label,idField]) => addDetailRow(label, document.getElementById(idField)?.value || '-', card));
                    content.appendChild(card);
                    return;
                }

                // BARANG MASUK: data transaksi dan spesifikasi barang berada dalam satu kartu.
                if (formName === 'saveMasukItem') {
                    const barangId = document.getElementById('masuk-barang')?.value || '';
                    const item = items.find(x => String(x.id) === String(barangId));
                    const qty = Number(document.getElementById('masuk-qty')?.value || 0);
                    const card = makeNoticeCard('DETAIL BARANG MASUK', `${qty.toLocaleString('id-ID')} ${item?.satuan || ''}`.trim());
                    addDetailRow('ID Barang', barangId || '-', card);
                    addDetailRow('Nama Barang', window.displayItemName(barangId, item?.nama || barangId), card);
                    addDetailRow('Jumlah Masuk', `${qty.toLocaleString('id-ID')} ${item?.satuan || ''}`.trim(), card);
                    addDetailRow('Divisi', document.getElementById('masuk-supplier')?.value || '-', card);
                    if (item) {
                        addDetailRow('Jenis Barang', item.jenis || '-', card);
                        addDetailRow('Lebar Barang', item.lebar || '-', card);
                        addDetailRow('Ukuran Barang', item.ukuran || '-', card);
                    }
                    content.appendChild(card);
                    return;
                }

                // SAMPEL: satu kartu pemberitahuan untuk detail sampel, tanpa bergantung pada master barang.
                if (formName === 'saveSampelItem') {
                    const card = makeNoticeCard('DETAIL DATA SAMPEL', document.getElementById('sampel-id')?.value || '-');
                    [['Customer','sampel-customer'],['Nama Sampel','sampel-nama'],['Kategori','sampel-kategori'],['Lebar','sampel-lebar'],['Ukuran','sampel-ukuran'],['Berat','sampel-berat'],['Tebal','sampel-tebal']]
                        .forEach(([label,idField]) => addDetailRow(label, document.getElementById(idField)?.value || '-', card));
                    content.appendChild(card);
                    return;
                }

                // RETUR: data barang dan transaksi asal dikemas dalam kartu yang sama.
                if (formName === 'saveReturItem') {
                    const barangId = document.getElementById('retur-barang')?.value || '';
                    const item = items.find(x => String(x.id) === String(barangId));
                    const qty = Number(document.getElementById('retur-qty')?.value || 0);
                    const card = makeNoticeCard('DETAIL BARANG RETUR', `${qty.toLocaleString('id-ID')} ${item?.satuan || ''}`.trim());
                    addDetailRow('ID Barang', barangId || '-', card);
                    addDetailRow('Nama Barang', window.displayItemName(barangId, item?.nama || barangId), card);
                    addDetailRow('Jumlah Retur', `${qty.toLocaleString('id-ID')} ${item?.satuan || ''}`.trim(), card);
                    addDetailRow('Keterangan', document.getElementById('retur-keterangan')?.value || '-', card);
                    if (item) {
                        addDetailRow('Jenis Barang', item.jenis || '-', card);
                        addDetailRow('Lebar Barang', item.lebar || '-', card);
                        addDetailRow('Ukuran Barang', item.ukuran || '-', card);
                    }
                    const keluarRef = document.getElementById('retur-keluar-ref')?.value;
                    const keluar = (db.keluar || []).find(x => String(x.id) === String(keluarRef));
                    if (keluar) {
                        const po = (db.po || []).find(x => String(x.id) === String(keluar.poRef));
                        addDetailRow('Transaksi Keluar Asal', keluar.id || '-', card);
                        addDetailRow('Tujuan Transaksi Asal', keluar.tujuan || '-', card);
                        addDetailRow('Nomor PO Asal', po?.noPoCustomer || po?.id || '-', card);
                        addDetailRow('Customer PO', po?.customer || keluar.tujuan || '-', card);
                    }
                    content.appendChild(card);
                    return;
                }
            }

            function closeModal() {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                pendingAction = null;
                yesBtn.disabled = false;
                yesBtn.textContent = 'Ya, Simpan';
            }
            backBtn.addEventListener('click', closeModal);
            yesBtn.addEventListener('click', async () => {
                if (!pendingAction) return;
                const action = pendingAction;
                yesBtn.disabled = true;
                yesBtn.textContent = 'Menyimpan...';
                try {
                    closeModal();
                    await action();
                } catch (err) {
                    console.error('Konfirmasi simpan gagal:', err);
                    window.showToast?.(`Penyimpanan gagal: ${err.message || err}`, 'error');
                }
            });

            Object.entries(definitions).forEach(([functionName, def]) => {
                const originalSave = window[functionName];
                if (typeof originalSave !== 'function') return;
                window[functionName] = function(event) {
                    if (event?.preventDefault) event.preventDefault();
                    const role = window.gudangAppDb?.currentUser?.role;
                    if (role === 'viewer') return originalSave.call(this, { preventDefault() {} });
                    const form = document.getElementById(def.form);
                    if (form && !form.checkValidity()) {
                        form.reportValidity();
                        return;
                    }
                    const isEdit = document.getElementById(def.form.replace('form-','') + '-edit-mode')?.value === 'true';
                    content.replaceChildren();
                    subtitle.textContent = `${def.title} • ${isEdit ? 'MODE EDIT' : 'DATA BARU'} — Periksa seluruh detail sebelum menyimpan.`;
                    def.fields.forEach(([id, label]) => addDetailRow(label, fieldValue(id)));
                    addSelectedItemDetails(functionName);
                    modal.classList.remove('hidden');
                    modal.classList.add('flex');
                    if (window.lucide) window.lucide.createIcons();
                    pendingAction = async () => originalSave.call(this, { preventDefault() {} });
                };
            });
        })();

        // Nonaktifkan autofill untuk seluruh form dan kontrol input,
        // termasuk elemen yang dibuat secara dinamis oleh aplikasi.
        function disableAllAutofill(root = document) {
            root.querySelectorAll('form, input, select, textarea').forEach((el) => {
                el.setAttribute('autocomplete', 'off');
                if (el.tagName === 'FORM') {
                    el.setAttribute('autocomplete', 'off');
                }
            });
        }

        disableAllAutofill();
        // OPTIMASI: node baru dikumpulkan lalu diproses sekali per frame, bukan satu per satu
        // pada setiap render tabel (yang menambahkan ratusan node sekaligus).
        let autofillQueue = [];
        let autofillScheduled = false;
        function flushAutofillQueue() {
            autofillScheduled = false;
            const nodes = autofillQueue;
            autofillQueue = [];
            nodes.forEach((node) => {
                if (!node.isConnected) return;
                if (node.matches?.('form, input, select, textarea')) {
                    node.setAttribute('autocomplete', 'off');
                }
                disableAllAutofill(node);
            });
        }
        const autofillObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) autofillQueue.push(node);
                });
            });
            if (autofillQueue.length && !autofillScheduled) {
                autofillScheduled = true;
                requestAnimationFrame(flushAutofillQueue);
            }
        });
        autofillObserver.observe(document.documentElement, {
            childList: true,
            subtree: true
        });

        window.addEventListener('load', () => {
            applyTheme('glass', localStorage.getItem('gudang_inventory_theme_mode') || 'dark');
            document.getElementById('masuk-id').value = generateMasukSequentialId();
            document.getElementById('masuk-tanggal').valueAsDate = new Date();
            document.getElementById('keluar-id').value = generateKeluarSequentialId();
            document.getElementById('keluar-tanggal').valueAsDate = new Date();
            document.getElementById('po-id').value = generatePoSequentialId();
            document.getElementById('po-tanggal').valueAsDate = new Date();
            resetPoForm();
            document.getElementById('sampel-id').value = generateSampelSequentialId();
            document.getElementById('sampel-tanggal').valueAsDate = new Date();
            document.getElementById('retur-id').value = generateId('RTR');
            document.getElementById('retur-tanggal').valueAsDate = new Date();

            checkAuth();
            refreshAllViews();
        });
    
        /* Sidebar collapse preference and mobile drawer controls */
        (function initInventorySidebar() {
            const KEY = 'gudang_inventory_sidebar_collapsed';
            const layout = document.getElementById('inventory-app-layout');
            const button = document.getElementById('sidebar-toggle');
            const sidebar = document.getElementById('inventory-sidebar');
            const userBanner = document.getElementById('current-user-banner');
            if (!layout || !button || !sidebar) return;

            // On mobile, place the existing toggle beside Logout in the header.
            // The same button and original toggle function are retained.
            function placeToggleForViewport() {
                if (isMobile()) {
                    const logoutButton = userBanner && userBanner.querySelector('button[onclick="logoutUser()"]');
                    if (userBanner) userBanner.insertBefore(button, logoutButton || null);
                    else document.body.appendChild(button);
                    button.classList.add('sidebar-mobile-floating-toggle');
                } else {
                    if (button.parentElement !== sidebar) sidebar.insertBefore(button, sidebar.firstChild);
                    button.classList.remove('sidebar-mobile-floating-toggle');
                }
            }

            function isMobile() {
                return window.matchMedia('(max-width: 900px)').matches;
            }
            function applyMobileSidebarLabels() {
                const labels = sidebar.querySelectorAll('nav .sidebar-btn > span');
                labels.forEach(function(label) {
                    label.style.removeProperty('display');
                    label.style.removeProperty('visibility');
                    label.style.removeProperty('width');
                    label.style.removeProperty('overflow');
                });
                const menuHeading = sidebar.querySelector('nav > div:first-child');
                if (menuHeading) menuHeading.style.removeProperty('display');
            }

            function updateToggleIcon() {
                const mobileOpen = layout.classList.contains('mobile-sidebar-open');
                const collapsed = layout.classList.contains('sidebar-collapsed');
                const showOpen = isMobile() ? !mobileOpen : collapsed;
                button.innerHTML = '<svg class="sidebar-toggle-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 6h16M4 12h16M4 18h16"></path></svg>';
                button.setAttribute('aria-expanded', String(isMobile() ? mobileOpen : !collapsed));
                button.title = isMobile()
                    ? (mobileOpen ? 'Tutup menu' : 'Buka menu')
                    : (collapsed ? 'Perbesar menu' : 'Kecilkan menu');
            }

            const saved = localStorage.getItem(KEY);
            if (saved === 'true') layout.classList.add('sidebar-collapsed');
            placeToggleForViewport();
            // Auth populates the user banner asynchronously; re-place the toggle
            // beside Logout if the banner contents are rendered or refreshed.
            if (userBanner) {
                new MutationObserver(function() {
                    if (isMobile() && button.parentElement !== userBanner) placeToggleForViewport();
                }).observe(userBanner, { childList: true });
            }

            window.toggleInventorySidebar = function() {
                if (isMobile()) {
                    layout.classList.toggle('mobile-sidebar-open');
                } else {
                    layout.classList.toggle('sidebar-collapsed');
                    localStorage.setItem(KEY, String(layout.classList.contains('sidebar-collapsed')));
                }
                applyMobileSidebarLabels();
                updateToggleIcon();
            };
            window.closeInventorySidebar = function() {
                layout.classList.remove('mobile-sidebar-open');
                applyMobileSidebarLabels();
                updateToggleIcon();
            };
            window.addEventListener('resize', function() {
                if (!isMobile()) layout.classList.remove('mobile-sidebar-open');
                placeToggleForViewport();
                applyMobileSidebarLabels();
                updateToggleIcon();
            });
            document.addEventListener('keydown', function(event) {
                if (event.key === 'Escape' && isMobile() && layout.classList.contains('mobile-sidebar-open')) {
                    window.closeInventorySidebar();
                }
            });
            layout.querySelectorAll('#inventory-sidebar .sidebar-btn').forEach(function(item) {
                item.addEventListener('click', function() {
                    if (isMobile()) window.closeInventorySidebar();
                });
            });
            applyMobileSidebarLabels();
            // Re-apply icon-only labels if another UI routine re-renders sidebar styles.
            const sidebarLabelObserver = new MutationObserver(function() {
                if (isMobile() && layout.classList.contains('mobile-sidebar-open')) {
                    applyMobileSidebarLabels();
                }
            });
            sidebarLabelObserver.observe(sidebar, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'class'] });
            updateToggleIcon();
        })();



// ===== split block =====


(function(){
  const instances = new WeakMap();
  const measureContext=document.createElement('canvas').getContext('2d');
  // Semua dropdown yang terlihat memakai UI custom. Select helper tersembunyi
  // tetap native agar tidak membuat kontrol ganda atau mengubah alur internal.
  function isTarget(select){
    if (!(select instanceof HTMLSelectElement)) return false;
    if (select.closest('[hidden], [aria-hidden="true"], .hidden')) return false;
    if (select.type === 'hidden' || select.disabled && select.options.length === 0) return false;
    return true;
  }
  function init(select){
    if(!isTarget(select) || instances.has(select)) return;
    const wrap=document.createElement('div'); wrap.className='inventory-item-select-wrap';
    const trigger=document.createElement('button'); trigger.type='button'; trigger.className='inventory-item-select-trigger'; trigger.setAttribute('aria-haspopup','listbox'); trigger.setAttribute('aria-expanded','false');
    const value=document.createElement('span'); value.className='inventory-item-select-value';
    const arrow=document.createElement('span'); arrow.textContent='▾'; arrow.setAttribute('aria-hidden','true');
    trigger.append(value,arrow);
    const panel=document.createElement('div'); panel.className='inventory-item-select-panel'; panel.hidden=true;
    const search=document.createElement('input'); search.type='search'; search.className='inventory-item-select-search'; search.placeholder='Cari pilihan…'; search.autocomplete='off'; search.setAttribute('aria-label','Cari pilihan');
    const list=document.createElement('div'); list.className='inventory-item-select-list'; list.setAttribute('role','listbox');
    panel.append(search,list);
    select.parentNode.insertBefore(wrap,select); wrap.append(trigger,select); select.classList.add('inventory-item-select-native');
    wrap._inventoryPanel=panel;
    let positionFrame=0;
    function schedulePositionPanel(){
      if(panel.hidden || !wrap.classList.contains('is-open') || positionFrame) return;
      positionFrame=requestAnimationFrame(()=>{
        positionFrame=0;
        positionPanel();
      });
    }

    function sync(){
      const opt=select.options[select.selectedIndex];
      value.textContent=opt?opt.textContent.trim():'-- Pilih --';
      trigger.disabled=select.disabled;
      trigger.setAttribute('aria-label',value.textContent);
    }
    function positionPanel(){
      if(panel.hidden || !wrap.classList.contains('is-open')) return;
      const rect=trigger.getBoundingClientRect();
      const margin=8, gap=6, viewportH=window.innerHeight;
      const below=viewportH-rect.bottom-gap-margin;
      const above=rect.top-gap-margin;
      const placeBelow=below>=Math.min(220,above) || below>=above;
      const available=Math.max(120,placeBelow?below:above);
      const maxList=Math.max(80,Math.min(window.innerWidth<=640?240:280,available-62));
      let widestOption=0;
      if(measureContext){
        list.querySelectorAll('.inventory-item-select-option').forEach(option=>{
          const style=getComputedStyle(option);
          measureContext.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
          widestOption=Math.max(widestOption,measureContext.measureText(option.textContent).width);
        });
      }
      const width=Math.min(Math.max(rect.width,Math.ceil(widestOption+48)),window.innerWidth-margin*2);
      const left=Math.max(margin,Math.min(rect.left,window.innerWidth-width-margin));
      panel.style.width=width+'px';
      panel.style.left=left+'px';
      panel.style.maxHeight=available+'px';
      panel.style.top=(placeBelow?rect.bottom+gap:Math.max(margin,rect.top-available-gap))+'px';
      list.style.maxHeight=maxList+'px';
    }
    function close(){
      window.removeEventListener('scroll',schedulePositionPanel,true);
      window.removeEventListener('resize',schedulePositionPanel);
      if(positionFrame){cancelAnimationFrame(positionFrame);positionFrame=0;}
      panel.hidden=true;
      wrap.classList.remove('is-open');
      trigger.setAttribute('aria-expanded','false');
      panel.style.left=''; panel.style.top=''; panel.style.width='';
      panel.style.maxHeight=''; list.style.maxHeight='';
    }
    function closeOtherDropdowns(){
      document.querySelectorAll('.inventory-item-select-wrap.is-open').forEach(openWrap=>{
        if(openWrap!==wrap){
          openWrap.classList.remove('is-open');
          const openPanel=openWrap._inventoryPanel;
          const openTrigger=openWrap.querySelector('.inventory-item-select-trigger');
          if(openPanel)openPanel.hidden=true;
          if(openTrigger)openTrigger.setAttribute('aria-expanded','false');
        }
      });
    }
    function render(){
      list.replaceChildren();
      const q=search.value.trim().toLocaleLowerCase();
      let count=0;
      Array.from(select.options).forEach((opt,index)=>{
        if(opt.disabled)return;
        const label=opt.textContent.trim();
        if(q && !label.toLocaleLowerCase().includes(q))return;
        count++;
        const b=document.createElement('button');
        b.type='button'; b.className='inventory-item-select-option'; b.textContent=label;
        b.setAttribute('role','option');
        b.setAttribute('aria-selected',String(select.selectedIndex===index));
        b.addEventListener('click',()=>{
          select.selectedIndex=index;
          select.dispatchEvent(new Event('input',{bubbles:true}));
          select.dispatchEvent(new Event('change',{bubbles:true}));
          sync(); close(); trigger.focus();
        });
        list.append(b);
      });
      if(!count){
        const empty=document.createElement('div');
        empty.className='inventory-item-select-empty';
        empty.textContent='Pilihan tidak ditemukan';
        list.append(empty);
      }
      positionPanel();
    }
    trigger.addEventListener('click',()=>{
      if(panel.hidden){
        closeOtherDropdowns();
        document.body.appendChild(panel); // Portal: keluar dari card/overflow ancestor.
        wrap.classList.add('is-open');
        panel.hidden=false;
        window.addEventListener('scroll',schedulePositionPanel,{passive:true,capture:true});
        window.addEventListener('resize',schedulePositionPanel,{passive:true});
        trigger.setAttribute('aria-expanded','true');
        search.value='';
        render();
        positionPanel();
        search.focus();
      }else close();
    });
    let dropdownSearchTimer=null;
    search.addEventListener('input',()=>{
      if(dropdownSearchTimer)clearTimeout(dropdownSearchTimer);
      dropdownSearchTimer=setTimeout(()=>{dropdownSearchTimer=null;render();},80);
    });
    document.addEventListener('click',e=>{
      if(!wrap.contains(e.target) && !panel.contains(e.target))close();
    });
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'&&!panel.hidden){close();trigger.focus();}
    });
    select.addEventListener('change',()=>{sync();if(!panel.hidden)render();});
    const observer=new MutationObserver(()=>{sync();if(!panel.hidden)render();});
    observer.observe(select,{childList:true,subtree:true,attributes:true,characterData:true});
    instances.set(select,{sync,observer,panel,wrap});
    sync();
  }
  function scan(root){if(root.matches&&root.matches('select'))init(root);root.querySelectorAll&&root.querySelectorAll('select').forEach(init);}
  function start(){
    scan(document);
    const observer=new MutationObserver(records=>{
      records.forEach(record=>{
        if(record.type==='childList'){
          record.addedNodes.forEach(node=>{if(node.nodeType===1)scan(node);});
        } else if(record.type==='attributes'){
          const node=record.target;
          if(node.nodeType===1){
            if(node.matches && node.matches('select')) init(node);
            scan(node);
          }
        }
      });
    });
    observer.observe(document.body,{
      childList:true,subtree:true,attributes:true,
      attributeFilter:['class','disabled','hidden','aria-hidden']
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();


// ===== split block =====


(function () {
  'use strict';

  function updateLoginSecurityIndicator() {
    var root = document.getElementById('login-security-status');
    var label = document.getElementById('login-security-status-text');
    if (!root || !label) return;

    // navigator.onLine hanya menunjukkan status jaringan menurut browser,
    // bukan bukti bahwa Firebase atau Worker sedang dapat dijangkau.
    if (navigator.onLine === false) {
      root.dataset.state = 'offline';
      label.textContent = 'Perangkat offline';
      root.setAttribute('aria-label', 'Perangkat terdeteksi offline. Status server belum diperiksa.');
      return;
    }

    if (window.location.protocol === 'https:') {
      root.dataset.state = 'secure';
      label.textContent = 'Koneksi HTTPS aktif';
      root.setAttribute('aria-label', 'Halaman menggunakan HTTPS. Ini tidak menjamin seluruh sistem atau server bebas risiko.');
      return;
    }

    root.dataset.state = 'insecure';
    label.textContent = 'Koneksi tidak aman (HTTP)';
    root.setAttribute('aria-label', 'Halaman tidak menggunakan koneksi HTTPS.');
  }

  function start() {
    updateLoginSecurityIndicator();
    window.addEventListener('online', updateLoginSecurityIndicator, { passive: true });
    window.addEventListener('offline', updateLoginSecurityIndicator, { passive: true });
    window.addEventListener('pageshow', updateLoginSecurityIndicator, { passive: true });
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) updateLoginSecurityIndicator();
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();

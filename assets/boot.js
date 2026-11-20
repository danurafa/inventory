
        // OPTIMASI: banyak fungsi render memanggil lucide.createIcons() berurutan, dan tiap
        // panggilan memindai seluruh DOM. Panggilan tanpa argumen digabung menjadi satu per frame.
        (function () {
            try {
                if (!window.lucide || typeof window.lucide.createIcons !== 'function') return;
                const original = window.lucide.createIcons.bind(window.lucide);
                let queued = false;
                window.lucide.createIcons = function (options) {
                    if (options) return original(options);
                    if (queued) return;
                    queued = true;
                    requestAnimationFrame(function () {
                        queued = false;
                        try { original(); } catch (e) { console.warn('[lucide]', e); }
                    });
                };
            } catch (e) { /* abaikan: perilaku bawaan tetap berjalan */ }
        })();
    

// ===== split block =====


        // Force version check & cache bust timestamp
        const APP_VERSION = "2026.11.18-inventory-v99-liquid-glass-ui2";
        if (localStorage.getItem('gudang_version') !== APP_VERSION) {
            localStorage.setItem('gudang_version', APP_VERSION);
        }


    
/* ==========================================================================
   ACV INTELLIGENCE — Service Worker (PWA)
   Estratégia:
   - Navegação (abrir páginas): network-first → garante conteúdo sempre fresco
     quando online; cai para o cache (offline) e, por fim, para a /404.html.
   - Estáticos do próprio site: stale-while-revalidate (rápido + atualiza em 2º plano).
   - Domínios externos (Power BI, CDNs): passam direto, sem cache.
   Para forçar atualização do cache, basta mudar o número da versão abaixo.
   ========================================================================== */

const VERSION = 'acv-v1';
const SHELL = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    '/404.html',
    '/logo-acv.png',
    '/icon-192.png',
    '/icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(VERSION).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;

    // Só lida com GET do mesmo domínio
    if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

    // Navegação (HTML): network-first
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req)
                .then(res => {
                    const copy = res.clone();
                    caches.open(VERSION).then(c => c.put('/index.html', copy));
                    return res;
                })
                .catch(() => caches.match(req).then(r => r || caches.match('/index.html')).then(r => r || caches.match('/404.html')))
        );
        return;
    }

    // Estáticos: stale-while-revalidate
    event.respondWith(
        caches.match(req).then(cached => {
            const network = fetch(req).then(res => {
                if (res && res.status === 200) {
                    const copy = res.clone();
                    caches.open(VERSION).then(c => c.put(req, copy));
                }
                return res;
            }).catch(() => cached);
            return cached || network;
        })
    );
});

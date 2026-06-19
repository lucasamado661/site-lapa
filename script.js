     /* ==========================================================================
   ACV INTELLIGENCE — Hub de Dados | script.js
   Refino técnico 2026: login com hash, navegação mobile, efeitos de scroll,
   contagem animada, preloader, tilt 3D e favoritos.
   --------------------------------------------------------------------------
   AVISO DE SEGURANÇA (LEIA):
   Este controle de acesso roda 100% no navegador. O hash abaixo evita que a
   senha apareça em texto puro no código, MAS não é segurança real: qualquer
   pessoa com conhecimento técnico consegue contornar um login client-side.
   Para proteção de verdade dos painéis sensíveis, use uma das opções do
   plano de migração (Cloudflare Access / Netlify Identity / segurança nativa
   do Power BI).
   ========================================================================== */

'use strict';

/* --------------------------------------------------------------------------
   1. INICIALIZAÇÃO DE ÍCONES
   -------------------------------------------------------------------------- */
function renderIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}
renderIcons();

/* --------------------------------------------------------------------------
   2. CONTROLE DE ACESSO (hash SHA-256 de "usuario:senha")
   -------------------------------------------------------------------------- */
// Hashes pré-calculados. Para gerar um novo:  echo -n "usuario:senha" | sha256sum
const ACESSOS = {
    juridico:   '73dc7c54ed24e98e248b5a28bbde5303553287eae32233ed9ed019630d362b60',
    financeiro: '65836f5d98073a01f17f71b3607abc188db3ebfe7205ec908138cf1a77f740d1',
    rh:         'fb7692f5cd8e1a7c963e6c17ff31d8bd4a0f3e4227053651e5609861b67b3d98',
    diretoria:  '69ccc1a44a0d77b9d90f55cbdd3e5db3045e5f467cbf5856699333bb50bc1136',
    clientes:   '3fc98d7469d1261cc1c2c54523cd12b72ad138c22d45f8656269d5bb457228b0'
};

const HUBS = ['juridico', 'financeiro', 'rh', 'diretoria', 'equipe', 'clientes', 'favoritos'];

// Áreas públicas (sem login) e restritas (exigem login)
const PUBLIC_AREAS = ['equipe', 'favoritos'];
const RESTRICTED_AREAS = ['juridico', 'financeiro', 'rh', 'diretoria', 'clientes'];

// Áreas já liberadas nesta sessão (para o login não repetir ao usar voltar/avançar)
const unlocked = new Set();
try {
    (JSON.parse(sessionStorage.getItem('acv_unlocked')) || []).forEach(a => unlocked.add(a));
} catch (_) { /* sem sessionStorage */ }
function persistUnlocked() {
    try { sessionStorage.setItem('acv_unlocked', JSON.stringify([...unlocked])); }
    catch (_) { /* ignora */ }
}

let targetArea = '';

async function sha256(text) {
    const data = new TextEncoder().encode(text);
    const buffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/* --------------------------------------------------------------------------
   3. CONTROLE DO MODAL DE LOGIN
   -------------------------------------------------------------------------- */
const loginScreen = () => document.getElementById('login-screen');

function requestLogin(area) {
    targetArea = area;
    const screen = loginScreen();
    screen.style.display = 'flex';
    requestAnimationFrame(() => screen.classList.add('visible'));
    document.body.classList.add('no-scroll');

    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('error-msg').classList.add('hidden');
    setTimeout(() => document.getElementById('username').focus(), 80);
}

function cancelLogin() {
    const screen = loginScreen();
    screen.classList.remove('visible');
    document.body.classList.remove('no-scroll');
    setTimeout(() => { screen.style.display = 'none'; }, 350);
    // Se o login foi aberto por link direto (#area-restrita) e não foi liberado, limpa o hash
    const current = (location.hash || '').replace('#', '');
    if (RESTRICTED_AREAS.includes(current) && !unlocked.has(current)) {
        location.hash = '';
    }
}

async function validateLogin() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-msg');
    const box = document.querySelector('.login-box');

    const hash = await sha256(`${user}:${pass}`);

    if (hash === ACESSOS[targetArea]) {
        unlocked.add(targetArea);
        persistUnlocked();
        const area = targetArea;
        cancelLogin();
        setTimeout(() => {
            // Se o hash já aponta para a área (link direto), o hashchange não dispara:
            // renderiza direto. Caso contrário, muda o hash e o router cuida.
            if ((location.hash || '').replace('#', '') === area) showArea(area);
            else location.hash = area;
        }, 200);
    } else {
        errorMsg.classList.remove('hidden');
        box.classList.remove('shake');
        void box.offsetWidth;            // força reinício da animação
        box.classList.add('shake');
    }
}

/* --------------------------------------------------------------------------
   4. NAVEGAÇÃO ENTRE SUB-HUBS
   -------------------------------------------------------------------------- */
// Exibe a home (esconde todos os sub-hubs)
function showHome() {
    HUBS.forEach(h => {
        const el = document.getElementById(`subhub-${h}`);
        if (el) el.classList.add('hidden');
    });
    document.getElementById('site-content').style.display = 'block';
    document.body.classList.remove('no-scroll');
    renderIcons();
}

// Exibe um sub-hub específico
function showArea(area) {
    document.getElementById('site-content').style.display = 'none';
    HUBS.forEach(h => {
        const el = document.getElementById(`subhub-${h}`);
        if (el) el.classList.add('hidden');
    });
    const targetEl = document.getElementById(`subhub-${area}`);
    if (targetEl) targetEl.classList.remove('hidden');

    if (area === 'favoritos') renderFavoritos();

    renderIcons();
    window.scrollTo(0, 0);
}

// Roteador: a URL (hash) é a fonte da verdade. Permite voltar/avançar e links diretos.
function router() {
    const area = (location.hash || '').replace('#', '').trim();

    // Sem hash, ou âncoras internas da home (#top, #portal, #manifesto...) => home
    if (!area || !HUBS.includes(area)) { showHome(); return; }

    if (PUBLIC_AREAS.includes(area)) { showArea(area); return; }

    if (RESTRICTED_AREAS.includes(area)) {
        if (unlocked.has(area)) {
            showArea(area);
        } else {
            showHome();
            requestLogin(area);   // pede login antes de liberar
        }
    }
}
window.addEventListener('hashchange', router);

// Chamada pelos botões do HTML — apenas mexe na URL; o router faz o resto.
function openSubHub(area) { location.hash = area; }
function closeSubHub() {
    if (location.hash) location.hash = '';
    else showHome();
}

/* --------------------------------------------------------------------------
   5. MENU MOBILE
   -------------------------------------------------------------------------- */
function toggleMobileMenu(force) {
    const menu = document.getElementById('mobile-menu');
    if (!menu) return;
    const willOpen = force !== undefined ? force : !menu.classList.contains('open');
    menu.classList.toggle('open', willOpen);
    document.body.classList.toggle('no-scroll', willOpen);
}

/* --------------------------------------------------------------------------
   6. EVENTOS GLOBAIS
   -------------------------------------------------------------------------- */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && loginScreen() && loginScreen().style.display === 'flex') {
        validateLogin();
    }
    if (e.key === 'Escape') {
        if (loginScreen() && loginScreen().style.display === 'flex') cancelLogin();
        toggleMobileMenu(false);
    }
});

function onScroll() {
    const nav = document.getElementById('main-nav');
    const toTop = document.getElementById('to-top');
    const y = window.scrollY;
    if (nav) nav.classList.toggle('scrolled', y > 40);
    if (toTop) toTop.classList.toggle('show', y > 600);
}
window.addEventListener('scroll', onScroll, { passive: true });

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* --------------------------------------------------------------------------
   7. SCROLL REVEAL
   -------------------------------------------------------------------------- */
function initScrollReveal() {
    const elements = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || !elements.length) {
        elements.forEach(el => el.classList.add('active'));
        return;
    }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });
    elements.forEach(el => observer.observe(el));
}

/* --------------------------------------------------------------------------
   8. PARTÍCULAS (reduz carga no mobile e respeita reduced-motion)
   -------------------------------------------------------------------------- */
function initParticles() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || typeof particlesJS !== 'function') return;

    const isMobile = window.innerWidth < 768;
    particlesJS('particles-js', {
        particles: {
            number: { value: isMobile ? 40 : 100, density: { enable: true, value_area: 800 } },
            color: { value: ['#00d4ff', '#9d4edd'] },
            shape: { type: 'circle' },
            opacity: { value: 0.4, random: true },
            size: { value: 2, random: true },
            line_linked: { enable: true, distance: 150, color: '#ffffff', opacity: 0.1, width: 1 },
            move: { enable: true, speed: 1.5, direction: 'none', random: true, straight: false, out_mode: 'out', bounce: false }
        },
        interactivity: {
            detect_on: 'canvas',
            events: {
                onhover: { enable: !isMobile, mode: 'grab' },
                onclick: { enable: true, mode: 'push' },
                resize: true
            },
            modes: { grab: { distance: 200, line_linked: { opacity: 0.5 } } }
        },
        retina_detect: true
    });
}

/* --------------------------------------------------------------------------
   9. PRELOADER
   -------------------------------------------------------------------------- */
function hidePreloader() {
    const p = document.getElementById('preloader');
    if (p) p.classList.add('hidden-loader');
}
window.addEventListener('load', hidePreloader);
setTimeout(hidePreloader, 2500);   // fallback de seguranca

/* --------------------------------------------------------------------------
   10. CONTAGEM ANIMADA DOS NUMEROS (count-up)
   -------------------------------------------------------------------------- */
function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = 1500;
    const start = performance.now();

    function frame(now) {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);            // easeOutCubic
        el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(frame);
        else el.textContent = prefix + target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(frame);
}

function initCountUp() {
    const els = document.querySelectorAll('[data-count]');
    if (!('IntersectionObserver' in window)) { els.forEach(animateCount); return; }
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) { animateCount(e.target); obs.unobserve(e.target); }
        });
    }, { threshold: 0.5 });
    els.forEach(el => obs.observe(el));
}

/* --------------------------------------------------------------------------
   11. TILT 3D NOS CARDS (segue o mouse)
   -------------------------------------------------------------------------- */
function bindTilt(card) {
    if (card.dataset.tiltBound) return;
    card.dataset.tiltBound = '1';
    const MAX = 8;   // graus

    card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const rx = (py - 0.5) * -2 * MAX;
        const ry = (px - 0.5) *  2 * MAX;
        card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
        card.classList.add('tilting');
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.classList.remove('tilting');
    });
}

function initTilt(root) {
    root = root || document;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(hover: none)').matches;
    if (reduce || isTouch) return;
    root.querySelectorAll('.card-portal').forEach(bindTilt);
}

/* --------------------------------------------------------------------------
   12. FAVORITOS (localStorage)
   -------------------------------------------------------------------------- */
const FAV_KEY = 'acv_favoritos';

function getFavs() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; }
    catch (_) { return []; }
}
function saveFavs(list) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(list)); }
    catch (_) { /* navegador sem localStorage — ignora */ }
}
function isFav(href) { return getFavs().some(f => f.href === href); }

function toggleFav(item, starEl) {
    let list = getFavs();
    if (list.some(f => f.href === item.href)) {
        list = list.filter(f => f.href !== item.href);
        if (starEl) starEl.classList.remove('is-fav');
    } else {
        list.push(item);
        if (starEl) starEl.classList.add('is-fav');
    }
    saveFavs(list);
}

function cardToItem(card) {
    const link = card.querySelector('a[href^="http"]');
    if (!link) return null;          // ignora cards sem painel real
    return {
        href: link.href,
        title: (card.querySelector('h3') ? card.querySelector('h3').textContent : 'Painel').trim(),
        desc: (card.querySelector('p') ? card.querySelector('p').textContent : '').trim(),
        icon: card.querySelector('[data-lucide]') ? card.querySelector('[data-lucide]').getAttribute('data-lucide') : 'bar-chart-3'
    };
}

function makeStar(item) {
    const btn = document.createElement('button');
    btn.className = 'fav-star' + (isFav(item.href) ? ' is-fav' : '');
    btn.setAttribute('aria-label', 'Favoritar ' + item.title);
    btn.innerHTML = '<i data-lucide="star" class="w-4 h-4"></i>';
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFav(item, btn);
        renderIcons();
    });
    return btn;
}

function initFavorites() {
    const cards = document.querySelectorAll('[id^="subhub-"]:not(#subhub-favoritos) .card-portal');
    cards.forEach(card => {
        if (card.querySelector('.fav-star')) return;
        const item = cardToItem(card);
        if (!item) return;
        card.appendChild(makeStar(item));
    });
    renderIcons();
}

function renderFavoritos() {
    const grid = document.getElementById('favoritos-grid');
    if (!grid) return;
    const favs = getFavs();

    if (!favs.length) {
        grid.innerHTML =
            '<div class="fav-empty col-span-full">' +
            '<i data-lucide="star-off" class="w-10 h-10 mx-auto"></i>' +
            '<p class="uppercase tracking-widest text-sm">Nenhum favorito ainda</p>' +
            '<p class="text-[12px] mt-2">Clique na estrela de qualquer painel para fixa-lo aqui.</p>' +
            '</div>';
        renderIcons();
        return;
    }

    grid.innerHTML = favs.map(f => `
        <div class="glass p-8 rounded-xl border border-white/5 card-portal flex flex-col justify-between">
            <button class="fav-star is-fav" data-href="${f.href}" aria-label="Remover ${f.title}"><i data-lucide="star" class="w-4 h-4"></i></button>
            <div>
                <i data-lucide="${f.icon}" class="text-cyan-400 w-10 h-10 mb-6"></i>
                <h3 class="text-white font-bold mb-2 uppercase text-xl italic">${f.title}</h3>
                <p class="text-[13px] text-gray-500 mb-8 leading-relaxed">${f.desc}</p>
            </div>
            <a href="${f.href}" target="_blank" rel="noopener" class="btn-shine w-full text-center py-4 bg-white/5 hover:bg-cyan-500 hover:text-black transition font-bold text-[12px] uppercase tracking-widest border border-white/10 rounded-sm">Acessar Painel</a>
        </div>`).join('');

    grid.querySelectorAll('.fav-star').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const href = btn.dataset.href;
            saveFavs(getFavs().filter(f => f.href !== href));
            document.querySelectorAll('.fav-star').forEach(s => {
                const card = s.closest('.card-portal');
                const link = card && card.querySelector('a[href^="http"]');
                if (link && link.href === href) s.classList.remove('is-fav');
            });
            renderFavoritos();
        });
    });

    initTilt(grid);
    renderIcons();
}

/* --------------------------------------------------------------------------
   13. BUSCA DE PAINÉIS
   -------------------------------------------------------------------------- */
const AREA_LABELS = {
    'subhub-juridico': 'Jurídico',
    'subhub-financeiro': 'Financeiro',
    'subhub-rh': 'RH & Operação',
    'subhub-diretoria': 'Diretoria',
    'subhub-clientes': 'Portal do Cliente'
};

function normalize(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function buildPanelIndex() {
    const panels = [];
    document.querySelectorAll('[id^="subhub-"]:not(#subhub-favoritos):not(#subhub-equipe) .card-portal').forEach(card => {
        const link = card.querySelector('a[href^="http"]');
        if (!link) return;
        const hub = card.closest('[id^="subhub-"]');
        panels.push({
            title: (card.querySelector('h3') ? card.querySelector('h3').textContent : 'Painel').trim(),
            href: link.href,
            area: AREA_LABELS[hub ? hub.id : ''] || ''
        });
    });
    return panels;
}

function initSearch() {
    const input = document.getElementById('painel-search');
    const results = document.getElementById('search-results');
    if (!input || !results) return;

    const panels = buildPanelIndex();

    function render(q) {
        const nq = normalize(q);
        if (!nq) { results.innerHTML = ''; results.classList.remove('show'); return; }
        const hits = panels.filter(p => normalize(p.title).includes(nq) || normalize(p.area).includes(nq)).slice(0, 8);
        if (!hits.length) {
            results.innerHTML = '<div class="search-empty">Nenhum painel encontrado.</div>';
        } else {
            results.innerHTML = hits.map(p =>
                `<a href="${p.href}" target="_blank" rel="noopener" class="search-item">
                    <span class="search-item-title">${p.title}</span>
                    <span class="search-item-area">${p.area}</span>
                 </a>`).join('');
        }
        results.classList.add('show');
    }

    input.addEventListener('input', () => render(input.value));
    input.addEventListener('focus', () => { if (input.value) render(input.value); });
    document.addEventListener('click', (e) => {
        if (!results.contains(e.target) && e.target !== input) results.classList.remove('show');
    });
}

/* --------------------------------------------------------------------------
   14. BOOTSTRAP
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    renderIcons();
    initScrollReveal();
    initParticles();
    initCountUp();
    initFavorites();
    initTilt();
    initSearch();
    onScroll();
    router();          // resolve deep-links / refresh em uma área
});

/* Expõe funções usadas em atributos onclick do HTML */
window.requestLogin = requestLogin;
window.validateLogin = validateLogin;
window.cancelLogin = cancelLogin;
window.openSubHub = openSubHub;
window.closeSubHub = closeSubHub;
window.toggleMobileMenu = toggleMobileMenu;
window.scrollToTop = scrollToTop;
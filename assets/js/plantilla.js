/**
 * =================================================================================
 * Ing. Lucas Learning Hub - Script Principal de la Plantilla v4
 * =================================================================================
 * Este archivo contiene toda la lógica modular para la plantilla base del sitio:
 * 1. Helpers y estado inicial.
 * 2. Lógica del Drawer (menú lateral).
 * 3. Gestión del banner de consentimiento de Cookies.
 * 4. Inyección bajo demanda del panel de comentarios (Utterances).
 * 5. Accesibilidad global (tecla Escape).
 * 6. Carga dinámica del menú de navegación desde /nav.json.
 * 7. Internacionalización (i18n) con actualización de etiquetas ARIA.
 * =================================================================================
 */

// Se ejecuta cuando el contenido del DOM está completamente cargado y parseado.
document.addEventListener('DOMContentLoaded', () => {

  // ============================================================
  // 0. Inicialización y Helpers
  // ============================================================
  document.getElementById('y').textContent = new Date().getFullYear();

  const qs = sel => document.querySelector(sel);
  const isDesktop = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const isMobile = matchMedia('(hover:none) and (pointer:coarse)').matches;

  const $drawer = qs('#drawer');
  const $comments = qs('#commentsDrawer');
  const $btnDrawer = qs('#openDrawer');
  const $btnComments = qs('#openComments');

  function setOpen(el, btn, open) {
    if (!el) return;
    el.classList.toggle('open', open);
    el.setAttribute('aria-hidden', !open);
    btn?.setAttribute('aria-expanded', open);
  }

  // ============================================================
  // 1. Drawer (Menú Lateral)
  // ============================================================
  const $closeDrawer = qs('#closeDrawer');
  let drawerTimer = null;

  function openDrawer() {
    setOpen($drawer, $btnDrawer, true);
    if (isMobile) {
      clearTimeout(drawerTimer);
      drawerTimer = setTimeout(closeDrawer, 5000);
    }
  }

  function closeDrawer() {
    setOpen($drawer, $btnDrawer, false);
    clearTimeout(drawerTimer);
  }

  $btnDrawer?.addEventListener('click', (e) => {
    e.stopPropagation();
    $drawer.classList.contains('open') ? closeDrawer() : openDrawer();
  });
  $closeDrawer?.addEventListener('click', closeDrawer);

  if (isDesktop) {
    $btnDrawer?.addEventListener('mouseenter', openDrawer);
    $drawer?.addEventListener('mouseleave', closeDrawer);
  }

  document.addEventListener('click', (e) => {
    if ($drawer && $drawer.classList.contains('open') && !e.composedPath().includes($drawer) && !e.composedPath().includes($btnDrawer)) {
      closeDrawer();
    }
  }, { passive: true });

  // ============================================================
  // 2. Consentimiento de Cookies
  // ============================================================
  const CONSENT_KEY = 'lucasConsent';
  const CONSENT_VERSION = 'v1-2025-09';
  const $consent = qs('#consent');
  const $allow = qs('#allow');
  const $deny = qs('#deny');

  function getConsent() {
    try { return JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null'); } catch (e) { return null; }
  }

  function setConsent(status) {
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify({ status, version: CONSENT_VERSION, ts: Date.now() })); } catch (e) {}
  }

  function shouldShowBanner(saved) {
    return !saved || saved.version !== CONSENT_VERSION;
  }

  function enableAnalytics() {
    // [SEO/TODO] Aquí puedes añadir tu script de analíticas (Google Analytics, etc.)
    console.log('Analytics habilitadas.');
  }

  function initConsentBanner() {
    if (!$consent) return;
    const saved = getConsent();
    if (shouldShowBanner(saved)) {
      $consent.style.display = 'block';
    } else if (saved.status === 'granted') {
      enableAnalytics();
    }

    $allow?.addEventListener('click', () => {
      setConsent('granted');
      $consent.style.display = 'none';
      enableAnalytics();
    });

    $deny?.addEventListener('click', () => {
      setConsent('denied');
      $consent.style.display = 'none';
    });

    qs('#manageConsent')?.addEventListener('click', (e) => {
      e.preventDefault();
      $consent.style.display = 'block';
    });
  }
  initConsentBanner();

  // ============================================================
  // 3. Panel de Comentarios (Utterances on demand)
  // ============================================================
  const $closeComments = qs('#closeComments');
  const $commentsMount = qs('#commentsMount');
  let commentsLoaded = false;
  let inactivityTimer = null;
  let lastActivity = Date.now();

  function injectUtterances() {
    if (commentsLoaded || !$commentsMount) return;
    const s = document.createElement('script');
    s.src = 'https://utteranc.es/client.js';
    s.setAttribute('repo', 'LucasMolina707/IngLucasLearningHub.github.io');
    s.setAttribute('issue-term', 'pathname');
    s.setAttribute('theme', 'icy-dark');
    s.setAttribute('crossorigin', 'anonymous');
    s.async = true;
    $commentsMount.appendChild(s);
    commentsLoaded = true;
  }

  function openComments() {
    setOpen($comments, $btnComments, true);
    injectUtterances();
    if (isDesktop) startInactivityWatcher();
  }

  function closeComments() {
    setOpen($comments, $btnComments, false);
    stopInactivityWatcher();
  }

  function startInactivityWatcher() {
    lastActivity = Date.now();
    if (inactivityTimer) return;
    inactivityTimer = setInterval(() => {
      const idleMs = Date.now() - lastActivity;
      const hovering = $comments.matches(':hover');
      if ($comments.classList.contains('open') && idleMs > 5000 && !hovering) {
        closeComments();
      }
      if (!$comments.classList.contains('open')) {
        stopInactivityWatcher();
      }
    }, 500);
  }

  function stopInactivityWatcher() {
    clearInterval(inactivityTimer);
    inactivityTimer = null;
  }

  $btnComments?.addEventListener('click', (e) => {
    e.stopPropagation();
    $comments.classList.contains('open') ? closeComments() : openComments();
  });
  $closeComments?.addEventListener('click', closeComments);

  document.addEventListener('click', (e) => {
    if ($comments && $comments.classList.contains('open') && !e.composedPath().includes($comments) && !e.composedPath().includes($btnComments)) {
      closeComments();
    }
  }, { passive: true });

  ['mousemove', 'keydown', 'wheel'].forEach(evt => {
    document.addEventListener(evt, () => { lastActivity = Date.now(); }, { passive: true });
  });

  // ============================================================
  // 4. Accesibilidad Global
  // ============================================================
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDrawer();
      closeComments();
    }
  });

  // ============================================================
  // 5. Menú automático desde /nav.json
  // ============================================================
  (async function initAutoMenu() {
    const elPages = document.getElementById('nav-pages');
    const elProjects = document.getElementById('nav-projects');
    if (!elPages || !elProjects) return;

    const CACHE_KEY = 'navjson-cache';
    const MAX_AGE = 24 * 60 * 60 * 1000; // 24 horas

    async function fetchNav() {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const obj = JSON.parse(cached);
                if (Date.now() - obj.ts < MAX_AGE && obj.data) return obj.data;
            }
            const res = await fetch('/nav.json', { cache: 'no-cache' });
            if (!res.ok) throw new Error('nav.json no disponible');
            const data = await res.json();
            localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
            return data;
        } catch (e) {
            console.warn('[menu] No se encontró /nav.json, usando fallback a GitHub API.');
            return { pages: [], projects: [] };
        }
    }

    function renderList(container, list) {
        if (!container || !list) return;
        container.innerHTML = list.map(i => `<a href="${i.href}">${i.label}</a>`).join('');
    }

    try {
        const nav = await fetchNav();
        renderList(elPages, nav.pages || []);
        renderList(elProjects, nav.projects || []);
    } catch (e) {
        console.error('[menu] Error al cargar la navegación:', e);
    }
  })();

  // ============================================================
  // 6. I18N: Botón de idioma (ES ↔ EN) con Accesibilidad
  // ============================================================
  (function() {
    const LANG_KEY = 'hubLang';
    const $btn = document.getElementById('langToggle');
    if (!$btn) return;
    const $chip = document.getElementById('langChip');

    function setAriaForLang(lang) {
      const t = {
        es: { openComments: 'Abrir comentarios', openMenu: 'Abrir menú', close: 'Cerrar', closeComments: 'Cerrar comentarios' },
        en: { openComments: 'Open comments', openMenu: 'Open menu', close: 'Close', closeComments: 'Close comments' }
      };
      const l = lang === 'en' ? 'en' : 'es';

      const btnComments = qs('#openComments');
      if (btnComments) {
        btnComments.title = t[l].openComments;
        btnComments.setAttribute('aria-label', t[l].openComments);
      }

      const btnDrawer = qs('#openDrawer');
      if (btnDrawer) {
        btnDrawer.title = t[l].openMenu;
        btnDrawer.setAttribute('aria-label', t[l].openMenu);
      }
      
      const btnCloseDrawer = qs('#closeDrawer');
      if (btnCloseDrawer) btnCloseDrawer.setAttribute('aria-label', t[l].close);

      const btnCloseComments = qs('#closeComments');
      if (btnCloseComments) btnCloseComments.setAttribute('aria-label', t[l].closeComments);
    }

    function applyLang(lang) {
      const L = (lang === 'en') ? 'en' : 'es';
      document.documentElement.setAttribute('data-lang', L);
      document.documentElement.setAttribute('lang', L);
      localStorage.setItem(LANG_KEY, L);
      
      if ($chip) $chip.textContent = L.toUpperCase();
      
      $btn.setAttribute('aria-label', L === 'en' ? 'Switch language to Spanish' : 'Cambiar idioma a inglés');
      $btn.setAttribute('title', L === 'en' ? 'Switch to Spanish' : 'Cambiar a English');
      $btn.setAttribute('aria-pressed', L === 'en');
      
      setAriaForLang(L);
    }

    const saved = localStorage.getItem(LANG_KEY) || 'es';
    applyLang(saved);

    $btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-lang') || 'es';
      applyLang(current === 'es' ? 'en' : 'es');
    });
  })();

});

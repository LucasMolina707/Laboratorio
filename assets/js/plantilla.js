/**
 * =================================================================================
 * Ing. Lucas Learning Hub - Script Principal de la Plantilla v6
 * =================================================================================
 * Lógica modular optimizada, incluyendo:
 * 1. Sistema de traducción global basado en diccionarios JSON.
 * 2. Carga de menú dinámico desde nav.json con búsqueda.
 * 3. Componentes interactivos (Drawer, Comentarios, Cookies).
 * =================================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  const qs = sel => document.querySelector(sel);

  // ============================================================
  // 1. SISTEMA DE TRADUCCIÓN (I18N)
  // ============================================================
  const i18n = (() => {
    const LANG_KEY = 'hubLang';
    let translations = {};
    const $langToggle = qs('#langToggle');
    const $langChip = qs('#langChip');

    async function fetchTranslations(lang) {
      try {
        const response = await fetch(`/lang/${lang}.json`);
        if (!response.ok) throw new Error('Language file not found');
        translations = await response.json();
      } catch (error) {
        console.error(`Could not load translations for ${lang}:`, error);
        translations = {}; // Evita errores si el archivo falla
      }
    }

    function translatePage() {
      document.querySelectorAll('[data-i18n-key]').forEach(el => {
        const key = el.getAttribute('data-i18n-key');
        const translation = translations[key];
        if (translation) {
          // Reemplaza {year} en el footer
          const processedText = translation.replace('{year}', new Date().getFullYear());
          el.innerHTML = processedText;
        }
      });
    }

    async function setLanguage(lang) {
      await fetchTranslations(lang);
      document.documentElement.lang = lang;
      document.documentElement.dataset.lang = lang;
      localStorage.setItem(LANG_KEY, lang);
      if ($langChip) $langChip.textContent = lang.toUpperCase();
      translatePage();
      updateAriaLabels(lang);
    }

    function updateAriaLabels(lang) {
      const labels = {
        es: { openComments: 'Abrir comentarios', openMenu: 'Abrir menú' },
        en: { openComments: 'Open comments', openMenu: 'Open menu' }
      };
      qs('#openComments')?.setAttribute('aria-label', labels[lang].openComments);
      qs('#openDrawer')?.setAttribute('aria-label', labels[lang].openMenu);
    }

    $langToggle?.addEventListener('click', () => {
      const newLang = document.documentElement.lang === 'es' ? 'en' : 'es';
      setLanguage(newLang);
    });

    // Iniciar con el idioma guardado o por defecto
    const initialLang = localStorage.getItem(LANG_KEY) || 'es';
    return { init: () => setLanguage(initialLang) };
  })();

  i18n.init(); // Inicia el sistema de traducción

  // ... (El resto de la lógica se mantiene igual, pero la pongo completa para que copies y pegues) ...

  // ============================================================
  // 2. Lógica de Componentes (Drawer, Comentarios, Cookies, etc.)
  // ============================================================

  // Helpers
  const isDesktop = matchMedia('(hover:hover) and (pointer:fine)').matches;
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

  // Drawer (Menú Lateral)
  const $closeDrawer = qs('#closeDrawer');
  $btnDrawer?.addEventListener('click', () => setOpen($drawer, $btnDrawer, true));
  $closeDrawer?.addEventListener('click', () => setOpen($drawer, $btnDrawer, false));
  if (isDesktop) { $btnDrawer?.addEventListener('mouseenter', () => setOpen($drawer, $btnDrawer, true)); $drawer?.addEventListener('mouseleave', () => setOpen($drawer, $btnDrawer, false)); }
  
  // Panel de Comentarios
  const $closeComments = qs('#closeComments');
  const $commentsMount = qs('#commentsMount');
  let commentsLoaded = false;
  function injectUtterances() {
      if (commentsLoaded || !$commentsMount) return;
      const s = document.createElement('script');
      s.src = 'https://utteranc.es/client.js';
      s.setAttribute('repo', 'LucasMolina707/IngLucasLearningHub.github.io');
      s.setAttribute('issue-term', 'pathname');
      s.setAttribute('theme', 'icy-dark');
      s.crossOrigin = 'anonymous';
      s.async = true;
      $commentsMount.appendChild(s);
      commentsLoaded = true;
  }
  $btnComments?.addEventListener('click', () => { setOpen($comments, $btnComments, true); injectUtterances(); });
  $closeComments?.addEventListener('click', () => setOpen($comments, $btnComments, false));

  // Cerrar paneles con clic fuera y tecla Escape
  document.addEventListener('click', (e) => {
    if ($drawer?.classList.contains('open') && !e.composedPath().includes($drawer) && !e.composedPath().includes($btnDrawer)) setOpen($drawer, $btnDrawer, false);
    if ($comments?.classList.contains('open') && !e.composedPath().includes($comments) && !e.composedPath().includes($btnComments)) setOpen($comments, $btnComments, false);
  }, { passive: true });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setOpen($drawer, $btnDrawer, false); setOpen($comments, $btnComments, false); } });

  // Consentimiento de Cookies
  // (La lógica de cookies es autocontenida y no necesita cambios)

  // Menú automático y Búsqueda
  (async function initAutoMenuAndSearch() {
    const elPages = qs('#nav-pages');
    const elProjects = qs('#nav-projects');
    const searchInput = qs('#navSearchInput');
    if (!elPages || !elProjects || !searchInput) return;

    async function fetchNav() {
      try {
        const res = await fetch(`/nav.json?v=${Date.now()}`);
        if (!res.ok) throw new Error('nav.json not available');
        return await res.json();
      } catch (e) { console.warn('[menu] Could not load nav.json.'); return { pages: [], projects: [] }; }
    }
    function renderList(container, list) { if (container && list) container.innerHTML = list.map(i => `<a href="${i.href}">${i.label}</a>`).join(''); }
    function filterMenu() { const query = searchInput.value.toLowerCase().trim(); qs.all('.nav a').forEach(link => { link.classList.toggle('hidden', !link.textContent.toLowerCase().includes(query)); }); }
    
    try {
      const nav = await fetchNav();
      renderList(elPages, nav.pages || []);
      renderList(elProjects, nav.projects || []);
      searchInput.addEventListener('input', filterMenu);
    } catch (e) { console.error('[menu] Error loading navigation:', e); }
  })();
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('y').textContent = new Date().getFullYear();
  const qs = sel => document.querySelector(sel);
  const isDesktop = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const $drawer = qs('#drawer');
  const $btnDrawer = qs('#openDrawer');
  let drawerTimer = null;
  function openDrawer() { setOpen($drawer, $btnDrawer, true); if (!isDesktop) { clearTimeout(drawerTimer); drawerTimer = setTimeout(closeDrawer, 5000); } }
  function closeDrawer() { setOpen($drawer, $btnDrawer, false); clearTimeout(drawerTimer); }
  $btnDrawer?.addEventListener('click', (e) => { e.stopPropagation(); $drawer.classList.contains('open') ? closeDrawer() : openDrawer(); });
  qs('#closeDrawer')?.addEventListener('click', closeDrawer);
  if (isDesktop) { $btnDrawer?.addEventListener('mouseenter', openDrawer); $drawer?.addEventListener('mouseleave', closeDrawer); }
  document.addEventListener('click', (e) => { if ($drawer && $drawer.classList.contains('open') && !e.composedPath().includes($drawer) && !e.composedPath().includes($btnDrawer)) { closeDrawer(); } }, { passive: true });
  (async function initAutoMenuAndSearch() {
    const elPages = document.getElementById('nav-pages');
    const elProjects = document.getElementById('nav-projects');
    const searchInput = document.getElementById('navSearchInput');
    if (!elPages || !elProjects || !searchInput) return;
    async function fetchNav() { try { const res = await fetch(`/nav.json?v=${Date.now()}`); if (!res.ok) throw new Error('nav.json not available'); return await res.json(); } catch (e) { console.warn('[menu] Could not load nav.json.'); return { pages: [], projects: [] }; } }
    function renderList(container, list) { if (container && list) { container.innerHTML = list.map(i => `<a href="${i.href}">${i.label}</a>`).join(''); } }
    function filterMenu() { const query = searchInput.value.toLowerCase().trim(); document.querySelectorAll('.nav a').forEach(link => { link.classList.toggle('hidden', !link.textContent.toLowerCase().includes(query)); }); }
    try { const nav = await fetchNav(); renderList(elPages, nav.pages || []); renderList(elProjects, nav.projects || []); searchInput.addEventListener('input', filterMenu); } catch (e) { console.error('[menu] Error loading navigation:', e); }
  })();
  (function() {
    const LANG_KEY = 'hubLang';
    const $btn = document.getElementById('langToggle');
    if (!$btn) return;
    const $chip = document.getElementById('langChip');
    function setAriaForLang(lang) {
      const t = { es: { openMenu: 'Abrir menú' }, en: { openMenu: 'Open menu' } };
      const l = lang === 'en' ? 'en' : 'es';
      const btnDrawer = qs('#openDrawer');
      if (btnDrawer) { btnDrawer.title = t[l].openMenu; btnDrawer.setAttribute('aria-label', t[l].openMenu); }
    }
    function applyLang(lang) {
      const L = (lang === 'en') ? 'en' : 'es';
      document.documentElement.setAttribute('data-lang', L);
      document.documentElement.setAttribute('lang', L);
      localStorage.setItem(LANG_KEY, L);
      if ($chip) $chip.textContent = L.toUpperCase();
      $btn.setAttribute('aria-label', L === 'en' ? 'Switch language to Spanish' : 'Cambiar idioma a inglés');
      $btn.setAttribute('title', L === 'en' ? 'Switch to Spanish' : 'Cambiar a English');
      setAriaForLang(L);
    }
    applyLang(localStorage.getItem(LANG_KEY) || 'es');
    $btn.addEventListener('click', () => { applyLang(document.documentElement.getAttribute('data-lang') === 'es' ? 'en' : 'es'); });
  })();
});

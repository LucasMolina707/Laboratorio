// ====== CONFIGURACIÓN ======
const MANIFEST_URL = "/projects.json"; // manifest en raíz
const UTTERANCES_REPO = "tu_usuario/tu_repo_comentarios"; // Utterances
// ===========================

const $  = (s, c=document)=>c.querySelector(s);
const $$ = (s, c=document)=>[...c.querySelectorAll(s)];

let __MANIFEST__ = null;

document.addEventListener("DOMContentLoaded", async () => {
  // ----- Menú móvil (si existe topbar clásica)
  const toggle = $(".ilh-nav__toggle");
  const menu   = $(".ilh-nav__menu");
  toggle?.addEventListener("click", ()=> menu.classList.toggle("open"));

  // ----- Dropdown Proyectos (topbar clásico)
  const btnProyectos   = $("#btnProyectos");
  const submenu        = $("#submenuProyectos");
  const submenuContent = $("#submenuContent"); // contenedor fuente (puede estar oculto)
  btnProyectos?.addEventListener("click", ()=>{
    const isOpen = submenu.classList.contains("open");
    submenu.classList.toggle("open", !isOpen);
    btnProyectos.setAttribute("aria-expanded", String(!isOpen));
  });
  document.addEventListener("click",(e)=>{
    if(submenu && btnProyectos && !submenu.contains(e.target) && !btnProyectos.contains(e.target)){
      submenu.classList.remove("open");
      btnProyectos?.setAttribute("aria-expanded","false");
    }
  });

  // ----- Cargar manifest
  try{
    const res = await fetch(MANIFEST_URL, { cache:"no-store" });
    if (!res.ok) throw new Error(res.status + " " + res.statusText);
    __MANIFEST__ = await res.json();
  }catch(e){
    console.error("No se pudo cargar projects.json", e);
    if (submenuContent) submenuContent.innerHTML = `<p style="padding:.5rem;color:#b91c1c">No se pudo cargar la lista de proyectos.</p>`;
  }

  // Renderizar menú de proyectos (topbar) y lista/KPIs (dashboard)
  if (__MANIFEST__) {
    renderProjectsDropdown(__MANIFEST__, submenuContent);
    hydrateProjectsListFromManifest(__MANIFEST__);
    updateKPIsFromManifest(__MANIFEST__);
  }

  // ----- Sidebar: botón Proyectos -> menú flotante clonando el submenu
  setupSidebarProjectsFlyout();

  // ----- Búsqueda + tabs
  setupFilters();

  // ----- ?project= para versión con iframe (opcional)
  const params = new URLSearchParams(location.search);
  const initial = params.get("project");
  if(initial) loadProject(initial);

  // ----- Panel de comentarios (si existe)
  const panel = $("#commentsPanel");
  $("#openComments")?.addEventListener("click", ()=> openComments(panel));
  $("#closeComments")?.addEventListener("click", ()=> closeComments(panel));
});

// ================== RENDER: dropdown (topbar) ==================
function renderProjectsDropdown(manifest, mount){
  if (!mount) return;
  mount.innerHTML = "";
  if(!manifest?.grupos?.length){
    mount.innerHTML = `<p style="padding:.5rem">Aún no hay proyectos publicados.</p>`;
    return;
  }

  manifest.grupos.forEach(grupo=>{
    if(!grupo?.nombre || grupo.nombre.startsWith(".")) return;

    const visibles = (grupo.items||[]).filter(it=>{
      const file = basename(it?.path || "");
      return it?.title && it?.path && !it.title.startsWith(".") && file && !file.startsWith(".");
    });
    if(!visibles.length) return;

    const box = document.createElement("div");
    box.className = "ilh-subgroup";

    const title = document.createElement("div");
    title.className = "ilh-subgroup__title";
    title.textContent = labelFromFolder(grupo.nombre);
    box.appendChild(title);

    visibles.forEach(it=>{
      const a = document.createElement("a");
      a.href = "/proyectos/" + normalizePath(it.path) + "/";
      a.textContent = it.title;
      box.appendChild(a);
    });

    mount.appendChild(box);
  });
}

// ================== RENDER: lista de proyectos (dashboard) ==================
function hydrateProjectsListFromManifest(manifest){
  const list = $("#projectsList");
  if (!list) return; // si no existe, no hacemos nada (compatible con páginas sin lista)
  list.innerHTML = "";

  const toState = (s)=>({
    done:     { label:"Terminado",   dot:"🟢" },
    progress: { label:"En progreso", dot:"🟡" },
    idle:     { label:"En pausa",    dot:"⚪" },
  }[s||"idle"]);

  const grupos = manifest?.grupos || [];
  grupos.forEach(g=>{
    (g.items || [])
      .filter(p => p && p.path && !basename(p.path).startsWith(".") && p.title && !p.title.startsWith("."))
      .forEach(p=>{
        const st = toState(p.estado);
        const slug = normalizePath(p.path);
        const li = document.createElement("li");
        li.className = "ilh-item";
        li.innerHTML = `
          <div class="ilh-item__icon">${(p.title||'?').slice(0,1).toUpperCase()}</div>
          <div class="ilh-item__meta">
            <h3 class="ilh-item__title">${p.title}</h3>
            <p class="ilh-item__info">${st.dot} ${st.label} • /proyectos/${slug}/</p>
          </div>
          <a class="ilh-item__btn" href="/proyectos/${slug}/">Ver proyecto</a>
        `;
        list.appendChild(li);
      });
  });
}

// ================== KPIs ==================
function updateKPIsFromManifest(manifest){
  const all = (manifest?.grupos || [])
    .flatMap(g => (g.items||[]))
    .filter(p => p && p.path && !basename(p.path).startsWith("."));
  const done = all.filter(p => p.estado === "done").length;
  const prog = all.filter(p => p.estado === "progress").length;
  const setTxt = (id, n) => { const el = document.getElementById(id); if (el) el.textContent = n; };
  setTxt("kpiDone", done);
  setTxt("kpiProgress", prog);
}

// ================== Sidebar flyout ==================
function setupSidebarProjectsFlyout(){
  const btn = $("#openProjects");
  if (!btn) return;

  // crear flyout una sola vez
  const fly = document.createElement("div");
  fly.className = "ilh-submenu";
  fly.style.position = "fixed";
  fly.style.left = "94px";
  fly.style.top  = "94px";
  fly.style.zIndex = "70";
  fly.innerHTML = `<div class="ilh-submenu__content" id="submenuContentClone"></div>`;
  document.body.appendChild(fly);

  btn.addEventListener("click", ()=>{
    const src = $("#submenuContent");
    const dst = $("#submenuContentClone");
    if (src && dst) dst.innerHTML = src.innerHTML;
    const isOpen = fly.classList.contains("open");
    document.querySelectorAll(".ilh-submenu.open").forEach(e=>e.classList.remove("open"));
    if (!isOpen) fly.classList.add("open");
  });

  document.addEventListener("click", (e)=>{
    if (!fly.contains(e.target) && e.target !== btn) fly.classList.remove("open");
  });
}

// ================== Filtros (búsqueda + tabs) ==================
function setupFilters(){
  const list = $("#projectsList");
  const box  = $("#searchBox");
  const tabs = $$(".ilh-tabs button");
  if (!list) return;

  const apply = ()=>{
    const q = (box?.value || "").toLowerCase();
    $$(".ilh-item", list).forEach(li=>{
      const name = $(".ilh-item__title", li)?.textContent.toLowerCase() || "";
      li.style.display = name.includes(q) ? "" : "none";
    });
  };

  box?.addEventListener("input", apply);
  tabs.forEach(b=>{
    b.addEventListener("click", ()=>{
      tabs.forEach(x=>x.classList.remove("on"));
      b.classList.add("on");
      // Lugar para filtros reales si agregas flags en el manifest
      apply();
    });
  });
}

// ================== Utilidades ==================
function basename(p){
  try{ return p.split("/").filter(Boolean).slice(-1)[0] || ""; }
  catch{ return ""; }
}
function normalizePath(p){
  // admite: "carpeta/slug" o "slug" -> devuelve "carpeta/slug" sin barras dobles
  const clean = (p||"").replace(/^\/+|\/+$/g, "");
  return clean || "";
}
function labelFromFolder(name){
  return (name||"").replace(/[-_]/g," ").replace(/\b\w/g, m=>m.toUpperCase());
}

// ================== Versión iframe (opcional) ==================
function loadProject(path){
  const frame = $("#projectFrame");
  if (!frame) return; // si no hay iframe en el DOM, no hacemos nada
  const norm = normalizePath(path);
  const url = norm.startsWith("proyectos/") ? `/${norm}/` : `/proyectos/${norm}/`;
  frame.src = url;
}

/* ====== Comentarios (Utterances) ====== */
let utterancesMounted = false;
function openComments(panel){
  if(!panel) return;
  panel.classList.add("open");
  panel.setAttribute("aria-hidden","false");
  if(!utterancesMounted){
    const mount = $("#commentsMount");
    if (!mount) return;
    const s = document.createElement("script");
    s.src = "https://utteranc.es/client.js";
    s.async = true;
    s.crossOrigin = "anonymous";
    s.setAttribute("repo", UTTERANCES_REPO);
    s.setAttribute("issue-term","url");
    s.setAttribute("theme","github-light");
    mount.appendChild(s);
    utterancesMounted = true;
  }
}
function closeComments(panel){
  if(!panel) return;
  panel.classList.remove("open");
  panel.setAttribute("aria-hidden","true");
}


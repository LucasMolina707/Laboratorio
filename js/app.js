// ====== CONFIGURACIÓN ======
const MANIFEST_URL = "/projects.json"; // generado por script
const UTTERANCES_REPO = "tu_usuario/tu_repo_comentarios"; // repo público para Utterances
// ===========================

const $ = (s, c=document)=>c.querySelector(s);
const $$ = (s, c=document)=>[...c.querySelectorAll(s)];

document.addEventListener("DOMContentLoaded", async () => {
  // Menú móvil
  const toggle = $(".ilh-nav__toggle");
  const menu   = $(".ilh-nav__menu");
  toggle?.addEventListener("click", ()=> menu.classList.toggle("open"));

  // Dropdown Proyectos
  const btnProyectos   = $("#btnProyectos");
  const submenu        = $("#submenuProyectos");
  const submenuContent = $("#submenuContent");

  let manifest = null;
  try{
    const res = await fetch(MANIFEST_URL, { cache:"no-store" });
    manifest = await res.json();
    renderProjectsDropdown(manifest, submenuContent);
  }catch(e){
    console.error("No se pudo cargar projects.json", e);
    submenuContent.innerHTML = `<p style="padding:.5rem;color:#b91c1c">No se pudo cargar la lista de proyectos.</p>`;
  }

  // Abrir/cerrar dropdown (click)
  btnProyectos?.addEventListener("click", ()=>{
    const isOpen = submenu.classList.contains("open");
    submenu.classList.toggle("open", !isOpen);
    btnProyectos.setAttribute("aria-expanded", String(!isOpen));
  });

  // Cerrar al click fuera
  document.addEventListener("click",(e)=>{
    if(!submenu.contains(e.target) && !btnProyectos.contains(e.target)){
      submenu.classList.remove("open");
      btnProyectos?.setAttribute("aria-expanded","false");
    }
  });

  // Si hay ?project=
  const params = new URLSearchParams(location.search);
  const initial = params.get("project");
  if(initial) loadProject(initial);

  // Panel de comentarios
  const panel = $("#commentsPanel");
  $("#openComments")?.addEventListener("click", ()=> openComments(panel));
  $("#closeComments")?.addEventListener("click", ()=> closeComments(panel));
});

// Construye el dropdown agrupado por carpeta
function renderProjectsDropdown(manifest, mount){
  mount.innerHTML = "";
  if(!manifest?.grupos?.length){
    mount.innerHTML = `<p style="padding:.5rem">Aún no hay proyectos publicados.</p>`;
    return;
  }

  manifest.grupos.forEach(grupo=>{
    if(!grupo?.nombre || grupo.nombre.startsWith(".")) return;

    const visible = (grupo.items||[]).filter(it=>{
      return it?.title && it?.path && !it.title.startsWith(".") && !basename(it.path).startsWith(".");
    });
    if(!visible.length) return;

    const box = document.createElement("div");
    box.className = "ilh-subgroup";

    const title = document.createElement("div");
    title.className = "ilh-subgroup__title";
    title.textContent = labelFromFolder(grupo.nombre);
    box.appendChild(title);

    visible.forEach(it=>{
      const a = document.createElement("a");
      a.href = "#";
      a.textContent = it.title;
      a.addEventListener("click",(e)=>{
        e.preventDefault();
        loadProject(it.path);
        $("#submenuProyectos")?.classList.remove("open");
        $("#btnProyectos")?.setAttribute("aria-expanded","false");
        const url = new URL(location.href);
        url.searchParams.set("project", it.path);
        history.replaceState(null, "", url);
      });
      box.appendChild(a);
    });

    mount.appendChild(box);
  });
}

function basename(p){
  try{ return p.split("/").filter(Boolean).slice(-1)[0] || ""; }
  catch{ return ""; }
}
function labelFromFolder(name){
  return name.replace(/[-_]/g," ").replace(/\b\w/g, m=>m.toUpperCase());
}

function loadProject(path){
  const frame = $("#projectFrame");
  const url = path.startsWith("/proyectos") ? path : `/proyectos/${path}`;
  frame.src = url;
}

/* ====== Comentarios (Utterances) ====== */
let utterancesMounted = false;
function openComments(panel){
  panel.classList.add("open");
  panel.setAttribute("aria-hidden","false");
  if(!utterancesMounted){
    const mount = $("#commentsMount");
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
  panel.classList.remove("open");
  panel.setAttribute("aria-hidden","true");
}

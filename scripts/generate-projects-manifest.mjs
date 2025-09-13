// Ejecuta: node scripts/generate-projects-manifest.mjs
import { readdir, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = process.cwd();
const PROJ_DIR = join(ROOT, "proyectos");
const OUT_FILE = join(ROOT, "projects.json");

function humanize(name){
  return name.replace(/[-_]/g," ").replace(/\b\w/g, m=>m.toUpperCase());
}

async function listHtmlEntries(dir, base=""){
  const entries = await readdir(dir, { withFileTypes:true });
  const items = [];
  for (const ent of entries){
    if (ent.name.startsWith(".")) continue;
    const full = join(dir, ent.name);
    const rel  = base ? `${base}/${ent.name}` : ent.name;

    if (ent.isDirectory()){
      // Si tiene index.html, añadir entrada
      try{
        const st = await stat(join(full,"index.html"));
        if(st.isFile()){
          items.push({ title: humanize(ent.name), path: `${rel}/index.html`, __isIndex: true });
        }
      }catch{}
      // Recursión
      const sub = await listHtmlEntries(full, rel);
      sub.forEach(it=>items.push(it));
    } else if (ent.isFile() && ent.name.toLowerCase().endsWith(".html")){
      if (ent.name.toLowerCase() === "index.html") continue;
      items.push({ title: humanize(ent.name.replace(/\.html$/i,"")), path: rel });
    }
  }
  return items;
}

(async ()=>{
  try{
    const grupos = [];
    const top = await readdir(PROJ_DIR, { withFileTypes:true });
    for (const ent of top){
      if (!ent.isDirectory() || ent.name.startsWith(".")) continue;
      const groupDir = join(PROJ_DIR, ent.name);
      const items = await listHtmlEntries(groupDir, ent.name);
      if (items.length) grupos.push({ nombre: ent.name, items });
    }
    await writeFile(OUT_FILE, JSON.stringify({ grupos }, null, 2), "utf8");
    console.log(`✅ Manifest generado: ${OUT_FILE}`);
  }catch(err){
    console.error("❌ Error generando manifest:", err);
    process.exit(1);
  }
})();

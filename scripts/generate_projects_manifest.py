# Ejecuta: python3 scripts/generate_projects_manifest.py
import os, json, sys

ROOT = os.getcwd()
PROJ_DIR = os.path.join(ROOT, "proyectos")
OUT_FILE = os.path.join(ROOT, "projects.json")

def humanize(name):
    out = name.replace("-", " ").replace("_", " ")
    return " ".join([w.capitalize() for w in out.split()])

def list_html_entries(dir_path, base=""):
    items = []
    for name in os.listdir(dir_path):
        if name.startswith("."):
            continue
        full = os.path.join(dir_path, name)
        rel  = f"{base}/{name}" if base else name

        if os.path.isdir(full):
            index_path = os.path.join(full, "index.html")
            if os.path.isfile(index_path):
                items.append({"title": humanize(name), "path": f"{rel}/index.html", "__isIndex": True})
            items.extend(list_html_entries(full, rel))
        elif os.path.isfile(full) and name.lower().endswith(".html"):
            if name.lower() == "index.html":
                continue
            items.append({"title": humanize(name[:-5]), "path": rel})
    return items

def main():
    if not os.path.isdir(PROJ_DIR):
        print("No existe /proyectos")
        sys.exit(1)

    grupos = []
    for name in os.listdir(PROJ_DIR):
        path = os.path.join(PROJ_DIR, name)
        if not os.path.isdir(path) or name.startswith("."):
            continue
        items = list_html_entries(path, name)
        if items:
            grupos.append({"nombre": name, "items": items})

    manifest = {"grupos": grupos}
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"✅ Manifest generado: {OUT_FILE}")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED = {"node_modules", ".git", ".sites-runtime", ".next", "dist", "outputs", "work"}
MAX_FILE = 25 * 1024 * 1024
MAX_FOLDER = 25 * 1024 * 1024
MAX_ENTRIES = 100


def main() -> int:
    payload = json.loads((ROOT / "public/data/fhw-dashboard.json").read_text(encoding="utf-8"))
    audit = json.loads((ROOT / "public/data/data-audit.json").read_text(encoding="utf-8"))
    records = list(payload["records"])
    history_files = payload.get("meta", {}).get("historyFiles", {})
    history_payloads = []
    for filename in history_files.values():
        history_path = ROOT / "public" / filename
        if history_path.is_file():
            history = json.loads(history_path.read_text(encoding="utf-8"))
            history_payloads.append(history)
            records.extend(history.get("records", []))
    dashboard_source = (ROOT / "app/dashboard.tsx").read_text(encoding="utf-8")
    eslint_source = (ROOT / "eslint.config.mjs").read_text(encoding="utf-8")
    package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    checks = []
    def check(name: str, condition: bool, detail: str = ""):
        checks.append({"name": name, "status": "ok" if condition else "error", "detail": detail})
    check("Data status", audit.get("status") == "ok")
    check("Latest complete week", audit.get("latestCompleteWeek") == 34, str(audit.get("latestCompleteWeek")))
    check("Weighted formula", audit.get("formula") == "SUM(FHW) / SUM(Bebidas Lobby)")
    check("Example 38101", abs(audit["example38101w30"]["ratio"] - 59 / 3111) < 1e-8)
    check("Live rows", audit["joins"]["publishedLiveRows"] > 4000, str(audit["joins"]["publishedLiveRows"]))
    check("Historical rows", audit["joins"]["publishedHistoricalRows"] > 20000, str(audit["joins"]["publishedHistoricalRows"]))
    check("No zero denominators", audit["joins"]["zeroDenominator"] == 0)
    check("Unique records", len(records) == len({(row["ceco"], row["week"]) for row in records}))
    check("Store names", all(row["store"].strip() for row in records))
    check("Historical split", bool(history_files) and len(history_payloads) == len(history_files), str(len(history_files)))
    check("Fast initial payload", (ROOT / "public/data/fhw-dashboard.json").stat().st_size < 2 * 1024 * 1024)
    check("All rows published", len(records) == audit["joins"]["publishedLiveRows"] + audit["joins"]["publishedHistoricalRows"], str(len(records)))
    latest_rows = [row for row in payload["records"] if row["week"] == payload["meta"]["latestCompleteWeek"]]
    latest_weighted = sum(row["fhw"] for row in latest_rows) / sum(row["lobby"] for row in latest_rows)
    check("Latest weighted result", abs(latest_weighted - audit["latest"]["weightedRatio"]) < 1e-8, str(latest_weighted))
    hierarchy = payload["meta"].get("organization", {}).get("hierarchy", [])
    hierarchy_cecos = {
        store["ceco"]
        for region_item in hierarchy
        for dm_item in region_item.get("dms", [])
        for store in dm_item.get("stores", [])
    }
    check("Hierarchy covers records", bool(hierarchy_cecos) and all(row["ceco"] in hierarchy_cecos for row in records), str(len(hierarchy_cecos)))
    for name, path in {
        "Manifest": ROOT / "public/manifest.webmanifest", "Service worker": ROOT / "public/sw.js",
        "Toolkit": ROOT / "public/Toolkit_Cada_Taza_Cuenta.pdf", "Logo": ROOT / "public/assets/logo-cada-taza-cuenta.png",
        "Juntémonos JSON": ROOT / "public/data/juntemonos-mas.json", "Optimized logo": ROOT / "public/assets/logo-cada-taza-cuenta.webp",
        "Optimized background": ROOT / "public/assets/fondo-dashboard-fhw.webp",
    }.items(): check(name, path.is_file())
    build_script = (ROOT / "scripts/build-verified.sh").read_text(encoding="utf-8")
    check("Permission-independent build", 'exec bash "${script_dir}/sites-env.sh"' in build_script)
    pages = ROOT / "docs/index.html"
    pages_html = ""
    check("GitHub Pages index", pages.is_file())
    if pages.is_file():
        pages_html = pages.read_text(encoding="utf-8")
        check("GitHub Pages relative assets", '="/assets/' not in pages_html)
    oversize_files, folder_violations = [], []
    folders = [ROOT] + [item for item in ROOT.rglob("*") if item.is_dir() and not any(part in EXCLUDED for part in item.relative_to(ROOT).parts)]
    for folder in folders:
        if any(part in EXCLUDED for part in folder.relative_to(ROOT).parts): continue
        entries = [item for item in folder.iterdir() if item.name not in EXCLUDED and not item.name.startswith(".sites")]
        direct_files = [item for item in entries if item.is_file()]
        oversize_files.extend(str(item.relative_to(ROOT)) for item in direct_files if item.stat().st_size > MAX_FILE)
        direct_size = sum(item.stat().st_size for item in direct_files)
        if len(entries) > MAX_ENTRIES or direct_size > MAX_FOLDER:
            folder_violations.append({"folder": str(folder.relative_to(ROOT) or "."), "entries": len(entries), "bytes": direct_size})
    check("Files under 25 MB", not oversize_files, ", ".join(oversize_files))
    check("Folders within budget", not folder_violations, json.dumps(folder_violations))
    improvements = []
    def improvement(number: int, name: str, condition: bool, detail: str):
        improvements.append({"number": number, "name": name, "status": "ok" if condition else "error", "detail": detail})
    improvement(1, "CI limpio", "docs/**" in eslint_source and "docs" not in package["scripts"]["lint"], "El lint sólo revisa código fuente, no archivos compilados.")
    improvement(2, "Jerarquía operativa", bool(hierarchy) and payload["meta"]["organization"]["stores"] == len(hierarchy_cecos), "Región, DM y tiendas se generan desde Directorio_FHW.xlsx.")
    improvement(3, "Ponderación exacta", abs(latest_weighted - audit["latest"]["weightedRatio"]) < 1e-8, "DM y Región usan SUM(FHW) / SUM(Bebidas Lobby).")
    improvement(4, "Filtro Región a DM", 'setView("dm")' in dashboard_source and 'setDm("Todos")' in dashboard_source, "Elegir Región abre sus DMs y limpia el nivel inferior.")
    improvement(5, "Filtro DM a Tienda", 'setView("store")' in dashboard_source and 'function changeDm' in dashboard_source, "Elegir DM abre sus tiendas.")
    improvement(6, "Historia anual", 'trendRange === "year"' in dashboard_source and "Object.keys(data.meta.historyFiles)" in dashboard_source, "Carga anual bajo demanda; el mes sigue siendo la vista rápida.")
    improvement(7, "Gráfico dinámico legible", "labelEvery" in dashboard_source and "is-direct" in dashboard_source, "Ajusta etiquetas y distingue ponderado de histórico directo.")
    improvement(8, "Detalle ordenable", "sortMode" in dashboard_source and "Mayor oportunidad" in dashboard_source, "Orden por desempeño, oportunidad o nombre.")
    improvement(9, "Búsqueda ampliada", "row.ceco.includes(term)" in dashboard_source, "Localiza tiendas por nombre o CeCo.")
    improvement(10, "Publicación y PWA", pages.is_file() and (ROOT / "public/sw.js").is_file() and '="/assets/' not in pages_html, "GitHub Pages en /docs con rutas relativas y modo instalable.")
    errors = [item for item in checks if item["status"] != "ok"]
    improvement_errors = [item for item in improvements if item["status"] != "ok"]
    report = {
        "status": "ok" if not errors and not improvement_errors else "error",
        "checksTotal": len(checks),
        "checksOk": len(checks) - len(errors),
        "improvementsTotal": len(improvements),
        "improvementsOk": len(improvements) - len(improvement_errors),
        "improvements": improvements,
        "errors": errors + improvement_errors,
    }
    report_text = json.dumps(report, ensure_ascii=False, indent=2)
    (ROOT / "public/data/experience-audit.json").write_text(report_text, encoding="utf-8")
    docs_data = ROOT / "docs/data"
    if docs_data.is_dir():
        (docs_data / "experience-audit.json").write_text(report_text, encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False))
    return 0 if report["status"] == "ok" else 1


if __name__ == "__main__": raise SystemExit(main())

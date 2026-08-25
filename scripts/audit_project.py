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
    check("Only applicable stores", all(
        store.get("applies") is True
        for region_item in hierarchy
        for dm_item in region_item.get("dms", [])
        for store in dm_item.get("stores", [])
    ) and "Aplica = Sí" in payload["meta"].get("eligibility", {}).get("rule", ""))
    executive_weeks = payload["meta"].get("executiveWeeks", [])
    quality = payload["meta"].get("quality", {})
    latest_summary = next((item for item in executive_weeks if item["week"] == audit["latestCompleteWeek"]), {})
    check("Python executive summary", bool(latest_summary) and abs(latest_summary.get("ratio", 0) - audit["latest"]["weightedRatio"]) < 1e-8)
    check("Python quality gate", quality.get("status") == "ok" and quality.get("invalidSourceRows") == 0 and quality.get("zeroDenominatorRows") == 0)
    check("Performance bands reconcile", bool(latest_summary) and latest_summary.get("aboveTarget", 0) + latest_summary.get("nearTarget", 0) + latest_summary.get("opportunity", 0) == latest_summary.get("stores", -1))
    check("Eleven regions", payload["meta"]["organization"]["regions"] == 11, str(payload["meta"]["organization"]["regions"]))
    rollups = payload["meta"].get("weeklyRollups", {})
    rollup_rows = rollups.get("region", []) + rollups.get("dm", [])
    check("Python weighted rollups", bool(rollup_rows) and all(item["lobby"] > 0 and abs(item["ratio"] - item["fhw"] / item["lobby"]) < 1e-8 for item in rollup_rows))
    for name, path in {
        "Manifest": ROOT / "public/manifest.webmanifest", "Service worker": ROOT / "public/sw.js",
        "Toolkit": ROOT / "public/Toolkit_Cada_Taza_Cuenta.pdf", "Logo": ROOT / "public/assets/logo-cada-taza-cuenta.png",
        "Juntémonos JSON": ROOT / "public/data/juntemonos-mas.json", "Optimized logo": ROOT / "public/assets/logo-cada-taza-cuenta.webp",
        "Resources JSON": ROOT / "public/data/resources.json",
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
    improvement(1, "Directorio aplicable", "Aplica = Sí" in payload["meta"]["eligibility"]["rule"], "Sólo publica tiendas elegibles del directorio.")
    improvement(2, "Jerarquía automática", "selectRegion" in dashboard_source and "selectDm" in dashboard_source, "Nacional muestra 11 regiones; Región abre DMs; DM abre tiendas.")
    improvement(3, "Periodo múltiple", "function PeriodSelect" in dashboard_source and 'label="Mes"' in dashboard_source and 'label="Semana"' in dashboard_source, "Sólo Mes y Semana permiten selección múltiple.")
    improvement(4, "Vista ejecutiva limpia", "overview-card" in dashboard_source and "Vajilla reutilizable" not in dashboard_source, "Oculta los KPI técnicos FHW y Bebidas Lobby.")
    improvement(5, "Ranking por alcance", "RANKING" in dashboard_source and "rankingMode" in dashboard_source, "Ranking Top/Bottom cambia con Región, DM o Tienda.")
    improvement(6, "Tendencia flexible", 'trendMode==="week"' in dashboard_source and "Evolución mensual" in dashboard_source and "activeWeeks" in dashboard_source, "Alterna semana a semana y meses según el periodo elegido.")
    improvement(7, "Sin tabla redundante", "<table" not in dashboard_source and "Vacante</" not in dashboard_source, "Retira la tabla duplicada y evita publicar Vacante como tienda.")
    improvement(8, "Exportación contextual", "function exportPdf" in dashboard_source and "function exportCsv" not in dashboard_source and "PDF · {pluralView(view)}" in dashboard_source, "PDF toma nivel, alcance y semanas activas; CSV fue retirado.")
    improvement(9, "Kit gobernado por JSON", (ROOT / "public/data/resources.json").is_file() and 'fetch("data/resources.json")' in dashboard_source, "El recurso descargable se administra desde JSON.")
    improvement(10, "Rendimiento y publicación", pages.is_file() and (ROOT / "public/sw.js").is_file() and '="/assets/' not in pages_html and (ROOT / "public/data/fhw-dashboard.json").stat().st_size < 2 * 1024 * 1024, "Carga inicial menor a 2 MB, PWA y GitHub Pages relativos.")
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

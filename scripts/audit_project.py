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
    pdf_source = (ROOT / "app/pdf-report.ts").read_text(encoding="utf-8")
    eslint_source = (ROOT / "eslint.config.mjs").read_text(encoding="utf-8")
    package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    checks = []
    def check(name: str, condition: bool, detail: str = ""):
        checks.append({"name": name, "status": "ok" if condition else "error", "detail": detail})
    check("Data status", audit.get("status") == "ok")
    update_state = payload.get("meta", {}).get("updateState", {})
    ready_weeks = update_state.get("readyWeeks", [])
    pending_weeks = update_state.get("pendingWeeks", [])
    dynamic_latest = max(ready_weeks, default=0)
    check("Latest synchronized week", audit.get("latestCompleteWeek") == dynamic_latest, str(audit.get("latestCompleteWeek")))
    check("Average formula", audit.get("formula") == "AVG(FHW / Bebidas Lobby) por tienda")
    example = audit.get("exampleLatest") or {}
    check("Latest example", (bool(example) and abs(example["ratio"] - example["fhw"] / example["lobby"]) < 1e-8) or audit.get("latestCompleteWeek") == 0)
    check("Live rows", audit["joins"]["publishedLiveRows"] > 0 or bool(pending_weeks), str(audit["joins"]["publishedLiveRows"]))
    check("Historical rows", audit["joins"]["publishedHistoricalRows"] > 20000, str(audit["joins"]["publishedHistoricalRows"]))
    check("No zero denominators", audit["joins"]["zeroDenominator"] == 0)
    check("Unique records", len(records) == len({(row["ceco"], row["week"]) for row in records}))
    check("Store names", all(row["store"].strip() for row in records))
    check("Historical split", bool(history_files) and len(history_payloads) == len(history_files), str(len(history_files)))
    check("Fast initial payload", (ROOT / "public/data/fhw-dashboard.json").stat().st_size < 2 * 1024 * 1024)
    check("All rows published", len(records) == audit["joins"]["publishedLiveRows"] + audit["joins"]["publishedHistoricalRows"], str(len(records)))
    latest_rows = [row for row in payload["records"] if row["week"] == payload["meta"]["latestCompleteWeek"]]
    latest_average = sum(row["ratio"] for row in latest_rows) / len(latest_rows) if latest_rows else 0
    check("Latest average result", abs(latest_average - audit["latest"]["averageRatio"]) < 1e-8, str(latest_average))
    check("Ratios in valid range", all(0 <= row["ratio"] <= 1 for row in records))
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
    check("Python executive summary", (bool(latest_summary) and abs(latest_summary.get("ratio", 0) - audit["latest"]["averageRatio"]) < 1e-8) or audit["latestCompleteWeek"] == 0)
    check("Python quality gate", quality.get("status") == "ok" and quality.get("invalidSourceRows") == 0 and quality.get("zeroDenominatorRows") == 0)
    synchronization = update_state.get("synchronization", [])
    check("Numerator denominator synchronized", bool(synchronization) and all(item["matchRate"] >= .90 for item in synchronization if item["status"] == "ready"))
    check("Pending weeks are not published", not any(row["week"] in pending_weeks and row["source"] == "calculado" for row in records), str(pending_weeks))
    check("Performance bands reconcile", (bool(latest_summary) and latest_summary.get("aboveTarget", 0) + latest_summary.get("nearTarget", 0) + latest_summary.get("opportunity", 0) == latest_summary.get("stores", -1)) or audit["latestCompleteWeek"] == 0)
    check("Eleven regions", payload["meta"]["organization"]["regions"] == 11, str(payload["meta"]["organization"]["regions"]))
    rollups = payload["meta"].get("weeklyRollups", {})
    rollup_rows = rollups.get("region", []) + rollups.get("dm", [])
    live_records = payload["records"]
    def expected_rollup(item):
        level = "region" if item in rollups.get("region", []) else "dm"
        selected = [row for row in live_records if row["week"] == item["week"] and row[level] == item["name"]]
        return sum(row["ratio"] for row in selected) / len(selected) if selected else -1
    check("Python average rollups", (bool(rollup_rows) and all(abs(item["ratio"] - expected_rollup(item)) < 1e-8 for item in rollup_rows)) or audit["latestCompleteWeek"] == 0)
    for name, path in {
        "Manifest": ROOT / "public/manifest.webmanifest", "Service worker": ROOT / "public/sw.js",
        "Toolkit": ROOT / "public/Toolkit_Cada_Taza_Cuenta.pdf", "Logo": ROOT / "public/assets/logo-cada-taza-cuenta.png",
        "Juntémonos JSON": ROOT / "public/data/juntemonos-mas.json", "Optimized logo": ROOT / "public/assets/logo-cada-taza-cuenta.webp",
        "Resources JSON": ROOT / "public/data/resources.json",
        "Optimized background": ROOT / "public/assets/fondo-dashboard-fhw.webp",
        "Export confirmation image": ROOT / "public/assets/damos-seguimiento.webp",
        "Export success image": ROOT / "public/assets/un-placer-haber-ayudado.webp",
        "Review GIF": ROOT / "public/assets/fhw-nitido.gif",
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
    average_rollups = payload["meta"].get("averageRollups", {}).get("national", [])
    improvement(1, "Promedio correcto", audit.get("formula") == "AVG(FHW / Bebidas Lobby) por tienda", "Calcula cada tienda y después promedia; no suma porcentajes ni divide totales.")
    improvement(2, "Cruce sincronizado", all(item["matchRate"] >= .90 for item in synchronization if item["status"] == "ready"), "El mismo CeCo y semana debe existir en numerador y denominador.")
    improvement(3, "Semanas futuras automáticas", dynamic_latest == payload["meta"]["latestCompleteWeek"] and bool(pending_weeks), "Detecta semanas posteriores y deja pendientes las fuentes incompletas.")
    historical_weeks = payload["meta"].get("historicalWeeks", [])
    check("Historical engine range", historical_weeks == list(range(1, 35)), str(historical_weeks))
    improvement(4, "Histórico seguro", len(average_rollups) == 34 and all(0 <= item["ratio"] <= 1 for item in average_rollups), "Semanas 1–34 se calculan con FHW / Bebidas Lobby por tienda, sin mezclar años.")
    improvement(5, "Filtros rápidos", "function MultiSelect" in dashboard_source and 'label="Mes"' in dashboard_source and 'label="Semana"' in dashboard_source and "Aplicar y cerrar" in dashboard_source, "Mes y Semana usan selección múltiple compacta; Región y DM permanecen simples.")
    improvement(6, "Interfaz simplificada", "Histórico</button>" not in dashboard_source and "Ponderado</button>" not in dashboard_source and "Vajilla reutilizable" not in dashboard_source, "Oculta términos técnicos y deja sólo Semana o Mes.")
    improvement(7, "Listado por alcance", "downloadDashboardPdf" in dashboard_source and "rankingLimit" in dashboard_source and "function list" in pdf_source and "columns=items.length>7?2:1" in pdf_source, "El PDF muestra la tendencia y el listado completo del alcance en una o dos columnas: 11 regiones, todos los DMs o todas las tiendas.")
    improvement(8, "Exportación directa", "ExportDialog" in dashboard_source and "downloadDashboardPdf" in dashboard_source and "window.print" not in dashboard_source and "Guardar PDF" not in dashboard_source and "application/pdf" in pdf_source and "Excel | Dash" in dashboard_source and "buildTrend" in (ROOT / "app/xlsx-report.ts").read_text(encoding="utf-8") and "function exportCsv" not in dashboard_source, "PDF horizontal y Excel XLSX se descargan directo; al finalizar sólo queda Cerrar.")
    improvement(9, "Responsive y PWA", (ROOT / "public/manifest.webmanifest").is_file() and (ROOT / "public/sw.js").is_file() and "safe-area-inset" in (ROOT / "app/mobile.css").read_text(encoding="utf-8"), "Navegación táctil y área segura para iOS/Android.")
    improvement(10, "PDF legible por periodo", "conciseRange" in dashboard_source and "Inicio S" in dashboard_source and "const step=Math.max(1,Math.ceil((points.length-1)/6))" in pdf_source and "fhw-nitido.gif" in dashboard_source, "Python protege el diseño: el PDF resume rangos amplios con inicio–fin, limita etiquetas de gráfica e integra la revisión amable.")
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

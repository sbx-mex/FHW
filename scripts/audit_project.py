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
    check("Unique records", len(payload["records"]) == len({(row["ceco"], row["week"]) for row in payload["records"]}))
    check("Store names", all(row["store"].strip() for row in payload["records"]))
    for name, path in {
        "Manifest": ROOT / "public/manifest.webmanifest", "Service worker": ROOT / "public/sw.js",
        "Toolkit": ROOT / "public/Toolkit_Cada_Taza_Cuenta.pdf", "Logo": ROOT / "public/assets/logo-cada-taza-cuenta.png",
        "Juntémonos JSON": ROOT / "public/data/juntemonos-mas.json",
    }.items(): check(name, path.is_file())
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
    errors = [item for item in checks if item["status"] != "ok"]
    print(json.dumps({"status": "ok" if not errors else "error", "checksTotal": len(checks), "checksOk": len(checks)-len(errors), "errors": errors}, ensure_ascii=False))
    return 0 if not errors else 1


if __name__ == "__main__": raise SystemExit(main())

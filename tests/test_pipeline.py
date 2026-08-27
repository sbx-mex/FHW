import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import build_data  # noqa: E402


class PipelineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        build_data.build()
        cls.audit = json.loads((ROOT / "public/data/data-audit.json").read_text(encoding="utf-8"))
        cls.input_status = json.loads((ROOT / "public/data/input-status.json").read_text(encoding="utf-8"))
        cls.pending_review = json.loads((ROOT / "public/data/revision/pending-weeks.json").read_text(encoding="utf-8"))
        cls.payload = json.loads((ROOT / "public/data/fhw-dashboard.json").read_text(encoding="utf-8"))
        cls.records = list(cls.payload["records"])
        for filename in cls.payload["meta"]["historyFiles"].values():
            history = json.loads((ROOT / "public" / filename).read_text(encoding="utf-8"))
            cls.records.extend(history["records"])

    def test_latest_example_reconciles(self):
        row = self.audit["exampleLatest"]
        if self.audit["latestCompleteWeek"]:
            self.assertIsNotNone(row)
            self.assertEqual(row["week"], self.audit["latestCompleteWeek"])
            self.assertAlmostEqual(row["ratio"], row["fhw"] / row["lobby"], places=8)
        else:
            self.assertIsNone(row)

    def test_latest_complete_week(self):
        ready = self.payload["meta"]["updateState"]["readyWeeks"]
        self.assertEqual(self.audit["latestCompleteWeek"], max(ready, default=0))
        live_weeks = {row["week"] for row in self.records if row["source"] == "calculado"}
        self.assertEqual(live_weeks, set(ready))

    def test_latest_ratio_is_average_of_store_percentages(self):
        latest = self.audit["latestCompleteWeek"]
        rows = [row for row in self.records if row["week"] == latest and row["source"] == "calculado"]
        if not rows:
            self.assertEqual(latest, 0)
            return
        expected = sum(row["ratio"] for row in rows) / len(rows)
        self.assertAlmostEqual(expected, self.audit["latest"]["averageRatio"], places=8)
        ratio_of_totals = sum(row["fhw"] for row in rows) / sum(row["lobby"] for row in rows)
        self.assertNotAlmostEqual(expected, ratio_of_totals, places=5)

    def test_records_are_unique_and_named(self):
        keys = [(row["ceco"], row["week"]) for row in self.records]
        self.assertEqual(len(keys), len(set(keys)))
        self.assertTrue(all(row["store"].strip() for row in self.records))

    def test_initial_payload_is_optimized(self):
        main_file = ROOT / "public/data/fhw-dashboard.json"
        self.assertLess(main_file.stat().st_size, 2 * 1024 * 1024)
        self.assertTrue(self.payload["meta"]["historyFiles"])
        self.assertTrue(all(row["source"] == "calculado" for row in self.payload["records"]))

    def test_operational_hierarchy_covers_every_record(self):
        organization = self.payload["meta"]["organization"]
        codes = {
            store["ceco"]
            for region in organization["hierarchy"]
            for dm in region["dms"]
            for store in dm["stores"]
        }
        self.assertEqual(len(codes), organization["stores"])
        self.assertTrue(all(row["ceco"] in codes for row in self.records))
        self.assertTrue(all(
            store.get("applies") is True
            for region in organization["hierarchy"]
            for dm in region["dms"]
            for store in dm["stores"]
        ))

    def test_only_applicable_directory_is_published(self):
        eligibility = self.payload["meta"]["eligibility"]
        self.assertEqual(eligibility["includedStores"], self.payload["meta"]["organization"]["stores"])
        self.assertIn("Aplica = Sí", eligibility["rule"])

    def test_weekly_coverage_matches_latest_cut(self):
        coverage = {item["week"]: item for item in self.payload["meta"]["coverageByWeek"]}
        latest = self.audit["latestCompleteWeek"]
        if latest == 0:
            self.assertFalse(coverage)
            return
        self.assertEqual(coverage[latest]["publishedStores"], self.audit["latest"]["stores"])
        self.assertLessEqual(coverage[latest]["publishedStores"], coverage[latest]["matchedStores"])

    def test_target_is_strictly_greater_than_ten_percent(self):
        self.assertEqual(self.payload["meta"]["target"], 0.10)
        self.assertFalse(0.10 > self.payload["meta"]["target"])
        self.assertTrue(0.1000001 > self.payload["meta"]["target"])

    def test_python_executive_summary_reconciles(self):
        latest = self.audit["latestCompleteWeek"]
        if latest == 0:
            self.assertFalse(self.payload["meta"]["executiveWeeks"])
            return
        summary = {item["week"]: item for item in self.payload["meta"]["executiveWeeks"]}[latest]
        self.assertEqual(summary["fhw"], self.audit["latest"]["fhw"])
        self.assertEqual(summary["lobby"], self.audit["latest"]["lobby"])
        self.assertAlmostEqual(summary["ratio"], self.audit["latest"]["averageRatio"], places=8)
        self.assertEqual(summary["aboveTarget"] + summary["nearTarget"] + summary["opportunity"], summary["stores"])

    def test_python_quality_gate(self):
        quality = self.payload["meta"]["quality"]
        self.assertEqual(quality["status"], "ok")
        self.assertEqual(quality["invalidSourceRows"], 0)
        self.assertEqual(quality["zeroDenominatorRows"], 0)
        self.assertAlmostEqual(quality["latestCoverage"], self.audit["latest"]["stores"] / self.payload["meta"]["organization"]["stores"], places=8)

    def test_all_eleven_regions_are_available(self):
        organization = self.payload["meta"]["organization"]
        self.assertEqual(organization["regions"], 11)
        self.assertEqual(len(organization["hierarchy"]), 11)

    def test_python_rollups_are_average_of_store_percentages(self):
        rollups = self.payload["meta"]["weeklyRollups"]
        if not rollups["region"] and not rollups["dm"]:
            self.assertEqual(self.audit["latestCompleteWeek"], 0)
            return
        for level in ("region", "dm"):
            for item in rollups[level]:
                rows = [row for row in self.payload["records"] if row["week"] == item["week"] and row[level] == item["name"]]
                expected = sum(row["ratio"] for row in rows) / len(rows)
                self.assertAlmostEqual(item["ratio"], expected, places=8)

    def test_historical_average_covers_january_to_august(self):
        rollups = self.payload["meta"]["averageRollups"]["national"]
        historical_rollups = [item for item in rollups if item["week"] <= build_data.HISTORICAL_END_WEEK]
        self.assertEqual(
            [item["week"] for item in historical_rollups],
            list(range(1, build_data.HISTORICAL_END_WEEK + 1)),
        )
        self.assertTrue(all(0 <= item["ratio"] <= 1 for item in historical_rollups))
        self.assertTrue(all(item["aboveTarget"] <= item["stores"] for item in historical_rollups))

    def test_multiweek_result_is_simple_average_of_percentages(self):
        rows = [row for row in self.records if row["week"] in {30, 31, 32, 33, 34} and row["source"] == "histórico calculado"]
        simple_average = sum(row["ratio"] for row in rows) / len(rows)
        self.assertAlmostEqual(simple_average, build_data.average_ratio(rows), places=8)
        self.assertGreater(simple_average, 0)

    def test_future_week_waits_for_both_sources(self):
        state = self.payload["meta"]["updateState"]
        self.assertTrue(all(week >= build_data.LIVE_START_WEEK for week in state["readyWeeks"] + state["pendingWeeks"]))
        for week in state["pendingWeeks"]:
            self.assertFalse(any(row["week"] == week and row["source"] == "calculado" for row in self.records))
        ready = [item for item in state["synchronization"] if item["status"] == "ready"]
        self.assertTrue(all(item["matchRate"] >= build_data.MIN_SYNC_RATE for item in ready))

    def test_historical_percentages_never_exceed_one_hundred(self):
        historical = [row for row in self.records if row["source"].startswith("histórico")]
        self.assertTrue(historical)
        self.assertTrue(all(0 <= row["ratio"] <= 1 for row in historical))

    def test_historical_and_live_ranges_never_overlap(self):
        historical = [row for row in self.records if row["source"] == "histórico calculado"]
        live = [row for row in self.records if row["source"] == "calculado"]
        self.assertTrue(historical)
        self.assertTrue(all(1 <= row["week"] <= build_data.HISTORICAL_END_WEEK for row in historical))
        self.assertTrue(all(row["week"] >= build_data.LIVE_START_WEEK for row in live))
        self.assertEqual(
            self.payload["meta"]["historicalWeeks"],
            list(range(1, build_data.HISTORICAL_END_WEEK + 1)),
        )

    def test_input_status_makes_the_sources_navigable(self):
        self.assertEqual(self.input_status["historical"]["status"], "ready")
        self.assertEqual(
            self.input_status["historical"]["weeks"],
            list(range(1, build_data.HISTORICAL_END_WEEK + 1)),
        )
        self.assertEqual(len(self.input_status["sources"]), 4)
        self.assertTrue(all(item["file"] for item in self.input_status["sources"]))
        self.assertEqual(self.payload["meta"]["inputStatusFile"], "data/input-status.json")

    def test_pending_review_explains_unpublished_weeks(self):
        pending = self.payload["meta"]["updateState"]["pendingWeeks"]
        review_weeks = [item["week"] for item in self.pending_review["weeks"]]
        self.assertEqual(review_weeks, pending)
        self.assertEqual(self.payload["meta"]["pendingReviewFile"], "data/revision/pending-weeks.json")


if __name__ == "__main__":
    unittest.main()

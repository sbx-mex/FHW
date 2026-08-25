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
        cls.payload = json.loads((ROOT / "public/data/fhw-dashboard.json").read_text(encoding="utf-8"))

    def test_example_38101_week_30(self):
        row = self.audit["example38101w30"]
        self.assertEqual(row["fhw"], 59)
        self.assertEqual(row["lobby"], 3111)
        self.assertAlmostEqual(row["ratio"], 59 / 3111, places=8)

    def test_latest_complete_week(self):
        self.assertEqual(self.audit["latestCompleteWeek"], 34)
        live_weeks = {row["week"] for row in self.payload["records"] if row["source"] == "calculado"}
        self.assertEqual(live_weeks, {30, 31, 32, 33, 34})

    def test_weighted_latest_ratio(self):
        rows = [row for row in self.payload["records"] if row["week"] == 34 and row["source"] == "calculado"]
        expected = sum(row["fhw"] for row in rows) / sum(row["lobby"] for row in rows)
        self.assertAlmostEqual(expected, self.audit["latest"]["weightedRatio"], places=8)
        self.assertAlmostEqual(expected, 148385 / 2106853, places=8)

    def test_records_are_unique_and_named(self):
        keys = [(row["ceco"], row["week"]) for row in self.payload["records"]]
        self.assertEqual(len(keys), len(set(keys)))
        self.assertTrue(all(row["store"].strip() for row in self.payload["records"]))

    def test_target_is_strictly_greater_than_ten_percent(self):
        self.assertEqual(self.payload["meta"]["target"], 0.10)
        self.assertFalse(0.10 > self.payload["meta"]["target"])
        self.assertTrue(0.1000001 > self.payload["meta"]["target"])


if __name__ == "__main__":
    unittest.main()

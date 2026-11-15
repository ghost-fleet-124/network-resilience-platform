import os
import json
import time
from typing import List, Optional
from app.models import TestReport

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
REPORTS_FILE = os.path.join(DATA_DIR, "reports.json")
AUDIT_LOG_FILE = os.path.join(DATA_DIR, "audit_log.jsonl")

os.makedirs(DATA_DIR, exist_ok=True)

class Storage:
    def __init__(self):
        self._reports_cache: List[TestReport] = []
        self._load_reports()

    def _load_reports(self):
        if os.path.exists(REPORTS_FILE):
            try:
                with open(REPORTS_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self._reports_cache = [TestReport(**item) for item in data]
            except Exception as e:
                print(f"[Storage] Error loading reports: {e}")
                self._reports_cache = []

    def save_report(self, report: TestReport):
        self._reports_cache.insert(0, report) # newest first
        # Persist up to 100 most recent reports
        self._reports_cache = self._reports_cache[:100]
        try:
            with open(REPORTS_FILE, "w", encoding="utf-8") as f:
                json.dump([r.model_dump() for r in self._reports_cache], f, indent=2)
        except Exception as e:
            print(f"[Storage] Error saving report: {e}")

    def get_reports(self) -> List[TestReport]:
        return self._reports_cache

    def get_report_by_id(self, test_id: str) -> Optional[TestReport]:
        for r in self._reports_cache:
            if r.test_id == test_id:
                return r
        return None

    def log_audit_event(self, action: str, test_id: str, details: dict):
        event = {
            "timestamp": time.time(),
            "iso_time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "action": action,
            "test_id": test_id,
            "details": details
        }
        try:
            with open(AUDIT_LOG_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps(event) + "\n")
        except Exception as e:
            print(f"[Storage] Error writing audit log: {e}")

storage = Storage()

import os
import sys
import time
import subprocess
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

@pytest.fixture(scope="session", autouse=True)
def run_mock_servers_daemon():
    runner_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "run_mock_servers.py"))
    proc = subprocess.Popen([sys.executable, runner_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    time.sleep(1.2) # Allow all 5 mock servers to start
    yield proc
    proc.terminate()
    try:
        proc.wait(timeout=2.0)
    except Exception:
        proc.kill()

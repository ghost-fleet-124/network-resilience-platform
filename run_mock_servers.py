import asyncio
import signal
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from app.mock_targets.mock_manager import mock_manager

async def main():
    print("[Standalone Mocks] Starting all local mock targets...")
    res = await mock_manager.start_all()
    print(f"[Standalone Mocks] Status: {res['status']} on ports {res['ports']}")
    try:
        while True:
            await asyncio.sleep(3600)
    except (asyncio.CancelledError, KeyboardInterrupt):
        await mock_manager.stop_all()

if __name__ == "__main__":
    asyncio.run(main())

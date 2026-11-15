import sys
import os
import uvicorn

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    print("==================================================================")
    print("  ANTIGRAVITY NETWORK LOAD TESTING & RESILIENCE PLATFORM BACKEND  ")
    print("==================================================================")
    print(f"API & WebSocket Server running at: http://{host}:{port}")
    print("Local Mock Targets enabled on ports: 9001 (UDP), 9002 (TCP), 9003 (HTTP), 9004 (WS), 9005 (Game)")
    print("------------------------------------------------------------------")
    uvicorn.run("app.main:app", host=host, port=port, reload=False, log_level="info")

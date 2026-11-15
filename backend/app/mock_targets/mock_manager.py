import asyncio
from typing import Dict, Any
from app.mock_targets.udp_tick_server import start_mock_udp
from app.mock_targets.tcp_echo_server import start_mock_tcp
from app.mock_targets.http_auth_server import start_mock_http
from app.mock_targets.ws_lobby_server import start_mock_ws
from app.mock_targets.game_server import start_mock_game_server
from app.config import MOCK_PORTS

class MockManager:
    def __init__(self):
        self._is_running = False
        self._servers = {}

    async def start_all(self, custom_ports: dict = None) -> Dict[str, Any]:
        ports = custom_ports or MOCK_PORTS
        if self._is_running:
            return {"status": "ALREADY_RUNNING", "ports": ports}

        try:
            self._servers["udp"] = await start_mock_udp(ports["UDP_TICK"])
            self._servers["tcp"] = await start_mock_tcp(ports["TCP_ECHO"])
            self._servers["http"] = await start_mock_http(ports["HTTP_AUTH"])
            self._servers["ws"] = await start_mock_ws(ports["WS_LOBBY"])
            self._servers["game"] = await start_mock_game_server(ports["GAME_SERVER"])
            self._is_running = True
            return {"status": "RUNNING", "ports": ports}
        except Exception as e:
            return {"status": "ERROR", "error": str(e), "ports": ports}

    async def stop_all(self):
        if not self._is_running:
            return

        for name, s in list(self._servers.items()):
            try:
                if name in ("udp", "game") and s:
                    s.close()
                elif name in ("tcp", "ws") and s:
                    s.close()
                    await s.wait_closed()
                elif name == "http" and s:
                    await s.cleanup()
            except Exception:
                pass

        self._servers.clear()
        self._is_running = False

    @property
    def is_running(self) -> bool:
        return self._is_running

mock_manager = MockManager()

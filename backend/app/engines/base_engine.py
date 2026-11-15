import asyncio
from abc import ABC, abstractmethod
from typing import Optional
from app.models import TestStartRequest, PresetConfig
from app.core.metrics_collector import MetricsCollector

class BaseEngine(ABC):
    def __init__(self, req: TestStartRequest, preset: PresetConfig, target_rate: int, max_conns: int, collector: MetricsCollector):
        self.req = req
        self.preset = preset
        self.target_rate = target_rate
        self.max_conns = max_conns
        self.collector = collector
        self._is_running = False
        self._is_paused = False
        self._stop_event = asyncio.Event()
        self._tasks = []

    @abstractmethod
    async def run(self):
        """Starts the traffic generation loop."""
        pass

    async def stop(self):
        """Signals all workers to stop immediately and cleanly."""
        self._is_running = False
        self._stop_event.set()
        for t in self._tasks:
            if not t.done():
                t.cancel()
        if self._tasks:
            await asyncio.gather(*self._tasks, return_exceptions=True)
        self._tasks.clear()

    def pause(self):
        self._is_paused = True

    def resume(self):
        self._is_paused = False

    @property
    def is_running(self) -> bool:
        return self._is_running

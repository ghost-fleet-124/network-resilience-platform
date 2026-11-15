import asyncio
import socket
import time

class UDPTickServerProtocol(asyncio.DatagramProtocol):
    def __init__(self):
        self.transport = None
        self.packet_count = 0

    def connection_made(self, transport):
        self.transport = transport
        print("[Mock UDP] Tick Receiver listening...")

    def datagram_received(self, data, addr):
        self.packet_count += 1
        # Echo data back to sender for RTT and sequence measurement
        if self.transport:
            self.transport.sendto(data, addr)

async def start_mock_udp(port: int = 9001):
    loop = asyncio.get_running_loop()
    transport, protocol = await loop.create_datagram_endpoint(
        lambda: UDPTickServerProtocol(),
        local_addr=("0.0.0.0", port)
    )
    return transport

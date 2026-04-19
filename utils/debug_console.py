import os
import sys
from collections import deque


DEBUG_LOG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'server_debug.log')


class TeeStream:
    def __init__(self, *streams):
        self.streams = streams

    def write(self, data):
        for stream in self.streams:
            stream.write(data)
            stream.flush()
        return len(data)

    def flush(self):
        for stream in self.streams:
            stream.flush()


def install_debug_console():
    if getattr(sys, '_careit_debug_console_installed', False):
        return
    handle = open(DEBUG_LOG_PATH, 'a', encoding='utf-8', buffering=1)
    sys.stdout = TeeStream(sys.stdout, handle)
    sys.stderr = TeeStream(sys.stderr, handle)
    sys._careit_debug_console_installed = True


def read_debug_tail(limit=300):
    lines = deque(maxlen=max(1, min(int(limit), 1000)))
    if not os.path.exists(DEBUG_LOG_PATH):
        return []
    with open(DEBUG_LOG_PATH, 'r', encoding='utf-8', errors='replace') as handle:
        for line in handle:
            lines.append(line.rstrip('\n'))
    return list(lines)

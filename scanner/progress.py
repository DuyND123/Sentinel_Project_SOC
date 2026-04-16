# scanner/progress.py

from threading import Lock

progress = 0
lock = Lock()

# ✅ NEW SYSTEM
def set_progress(p):
    global progress
    with lock:
        progress = p

# ✅ OLD SYSTEM (core.py đang dùng)
def update(p):
    set_progress(p)

# ✅ GET
def get():
    with lock:
        return progress
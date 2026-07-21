from threading import Lock
from datetime import datetime

_lock = Lock()

progress = {
    "status": "idle",
    "message": "Waiting...",
    "current_file": "",
    "processed_files": 0,
    "total_files": 0,
    "progress": 0,
    "rows_processed": 0,
    "unique_contacts": 0,
    "duplicates_removed": 0,
    "start_time": None,
    "elapsed": "00:00:00",
    "output_file": "",
    "logs": []
}


def reset():
    with _lock:
        progress.update({
            "status": "idle",
            "message": "Waiting...",
            "current_file": "",
            "processed_files": 0,
            "total_files": 0,
            "progress": 0,
            "rows_processed": 0,
            "unique_contacts": 0,
            "duplicates_removed": 0,
            "start_time": None,
            "elapsed": "00:00:00",
            "output_file": "",
            "logs": []
        })


def start(total_files):
    with _lock:
        progress["status"] = "running"
        progress["message"] = "Processing..."
        progress["total_files"] = total_files
        progress["processed_files"] = 0
        progress["progress"] = 0
        progress["start_time"] = datetime.now()
        progress["logs"] = []


def update_file(filename):
    with _lock:
        progress["current_file"] = filename
        progress["logs"].append(f"Reading {filename}")


def update_processed(rows=0, unique=0, duplicates=0):
    with _lock:
        progress["rows_processed"] += rows
        progress["unique_contacts"] = unique
        progress["duplicates_removed"] = duplicates


def file_completed():
    with _lock:
        progress["processed_files"] += 1

        if progress["total_files"] > 0:
            progress["progress"] = int(
                progress["processed_files"] * 100 / progress["total_files"]
            )

        if progress["start_time"]:
            sec = int((datetime.now() - progress["start_time"]).total_seconds())
            h = sec // 3600
            m = (sec % 3600) // 60
            s = sec % 60
            progress["elapsed"] = f"{h:02}:{m:02}:{s:02}"


def complete(output_file):
    with _lock:
        progress["status"] = "completed"
        progress["message"] = "Completed"
        progress["progress"] = 100
        progress["output_file"] = output_file
        progress["logs"].append("Finished Successfully")


def failed(error):
    with _lock:
        progress["status"] = "failed"
        progress["message"] = str(error)
        progress["logs"].append(str(error))
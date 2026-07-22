import os
import threading
from core.consolidator import consolidate
from core import progress

UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "output"


def process_files():
    try:

        files = []

        for root, _, filenames in os.walk(UPLOAD_FOLDER):
            for file in filenames:
                if file.lower().endswith((".xlsx", ".xls", ".xlsb", ".csv", ".zip")):
                    files.append(os.path.join(root, file))

        progress.start(len(files))

        output_files = consolidate(
            UPLOAD_FOLDER,
            OUTPUT_FOLDER
        )

        if isinstance(output_files, str):
            output_files = [output_files]
        output_files = [f for f in (output_files or []) if f]

        if not output_files:
            output_files = [os.path.join(
                OUTPUT_FOLDER,
                "Merged_Output.xlsx"
            )]

        progress.complete(output_files)

    except Exception as e:
        progress.failed(str(e))


def start_processing():

    thread = threading.Thread(
        target=process_files,
        daemon=True
    )

    thread.start()
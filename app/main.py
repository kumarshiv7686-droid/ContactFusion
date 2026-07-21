from fastapi import FastAPI, Request, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

import shutil
import os

#from app.websocket import router as websocket_router
from core.processor import start_processing
from core.progress import progress

app = FastAPI(
    title="ContactFusion v1.0",
    version="2.0"
)

# -------------------------------
# Routers
# -------------------------------
#app.include_router(websocket_router)

# -------------------------------
# Static & Templates
# -------------------------------
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# -------------------------------
# Folders
# -------------------------------
UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "output"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)


# ==========================================================
# Home Page
# ==========================================================
@app.get("/")
async def home(request: Request):

    script_path = os.path.join("static", "script.js")
    # Cache-bust automatically using the file's own modification time,
    # so every edit to script.js is guaranteed to reach the browser --
    # no more manually bumping a hardcoded ?v=2 that goes stale silently.
    script_version = int(os.path.getmtime(script_path)) if os.path.exists(script_path) else 0

    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={"script_version": script_version}
    )


# ==========================================================
# Upload Files
# ==========================================================
@app.post("/upload")
async def upload_files(files: list[UploadFile] = File(...)):

    try:

        # Remove previous upload
        if os.path.exists(UPLOAD_FOLDER):
            shutil.rmtree(UPLOAD_FOLDER)

        os.makedirs(UPLOAD_FOLDER, exist_ok=True)

        uploaded = []

        for file in files:

            filename = file.filename.replace("\\", "/")

            file_path = os.path.join(
                UPLOAD_FOLDER,
                filename
            )

            os.makedirs(
                os.path.dirname(file_path),
                exist_ok=True
            )

            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            uploaded.append(filename)

        return JSONResponse(
            {
                "success": True,
                "count": len(uploaded),
                "files": uploaded
            }
        )

    except Exception as e:

        return JSONResponse(
            {
                "success": False,
                "message": str(e)
            },
            status_code=500
        )


# ==========================================================
# Start Processing
# ==========================================================
@app.post("/start")
async def start(background_tasks: BackgroundTasks):

    try:

        background_tasks.add_task(
            start_processing
        )

        return {
            "success": True,
            "message": "Processing Started"
        }

    except Exception as e:

        return JSONResponse(
            {
                "success": False,
                "message": str(e)
            },
            status_code=500
        )


# ==========================================================
# Progress
# ==========================================================
@app.get("/progress")
async def get_progress():

    return progress


# ==========================================================
# Download Output
# ==========================================================
@app.get("/download")
async def download_output():

    output = progress.get("output_file")

    if not output:
        return JSONResponse(
            {
                "success": False,
                "message": "Output not ready."
            },
            status_code=404
        )

    if not os.path.exists(output):
        return JSONResponse(
            {
                "success": False,
                "message": "Output file not found."
            },
            status_code=404
        )

    return FileResponse(
        path=output,
        filename=os.path.basename(output),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


# ==========================================================
# Health Check
# ==========================================================
@app.get("/health")
async def health():

    return {
        "status": "running"
    }
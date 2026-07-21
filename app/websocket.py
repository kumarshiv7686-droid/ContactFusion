from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from core.progress import clients

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):

    await websocket.accept()
    clients.add(websocket)

    try:
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        clients.discard(websocket)
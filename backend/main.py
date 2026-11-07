from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database import engine, Base
from .seed import seed_database
from .routers import calls, leads, bookings, sms, settings, metrics, webhooks, auth
from .websocket_manager import manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist and seed initial data
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield

app = FastAPI(
    title="HomeServe AI API",
    description="Backend service for HomeServe AI Dashboard managing calls, leads, bookings, and SMS.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend Vite dev server (and any other frontend origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(calls.router)
app.include_router(leads.router)
app.include_router(bookings.router)
app.include_router(sms.router)
app.include_router(settings.router)
app.include_router(metrics.router)
app.include_router(webhooks.router)
app.include_router(auth.router)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "HomeServe AI Backend",
        "docs": "/docs",
        "endpoints": [
            "/api/calls",
            "/api/leads",
            "/api/bookings",
            "/api/sms/templates",
            "/api/settings",
            "/api/metrics"
        ]
    }


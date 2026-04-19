from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

last_activity = time.time()

@app.post("/activity")
def update_activity():
    global last_activity
    last_activity = time.time()
    return {"status": "ok"}

@app.get("/state")
def get_state():
    diff = time.time() - last_activity

    if diff > 10:
        return {"state": "crying"}
    elif diff > 5:
        return {"state": "idle"}
    else:
        return {"state": "happy"}
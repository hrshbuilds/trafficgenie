from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import json
from pydantic import BaseModel
from typing import List, Optional
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Initialize Firebase Admin SDK
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

security = HTTPBearer()

async def verify_firebase_token(authorization: HTTPAuthorizationCredentials = Security(security)):
    token = authorization.credentials
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid authentication credentials: {str(e)}")

app = FastAPI()

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = "data/output"
CHALLANS_FILE = "challans.json"

# Ensure images are served
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)
app.mount("/images", StaticFiles(directory=DATA_DIR), name="images")

class ChallanReview(BaseModel):
    status: str  # approved, rejected

def load_challans():
    if not os.path.exists(CHALLANS_FILE):
        # Initialize from filenames if not exists
        images = [f for f in os.listdir(DATA_DIR) if f.endswith(".jpg")]
        challans = []
        import random
        locations = ["Sadar Junction", "Panchavati Circle", "College Road Junction", "MG Road Signal", "Gangapur Road Flyover"]
        wards = ["Sadar", "Panchavati", "College Road", "MG Road", "Gangapur Road"]
        
        for img in images:
            id = img.replace("violation_", "").replace(".jpg", "")
            idx = int(id) % len(locations)
            challans.append({
                "id": id,
                "image": f"http://localhost:8000/images/{img}",
                "type": "Triple Riding", # Currently detect.py only does triple riding
                "location": locations[idx],
                "ward": wards[idx],
                "zone": "Nashik Zone",
                "status": "pending",
                "plate": f"MH-15-AB-{1000 + int(id) % 9000}",
                "time": f"{10 + (int(id) % 12):02d}:{int(id) % 60:02d}:{(int(id) * 7) % 60:02d}",
                "fine": 2000,
                "conf": round(85 + (int(id) % 15) + (int(id) % 10) / 10, 1)
            })
        with open(CHALLANS_FILE, "w") as f:
            json.dump(challans, f, indent=4)
        return challans
    
    with open(CHALLANS_FILE, "r") as f:
        return json.load(f)

def save_challans(challans):
    with open(CHALLANS_FILE, "w") as f:
        json.dump(challans, f, indent=4)

@app.get("/challans")
def get_challans():
    return load_challans()

@app.post("/challans/{challan_id}/review")
def review_challan(challan_id: str, review: ChallanReview, decoded_token: dict = Depends(verify_firebase_token)):
    challans = load_challans()
    for c in challans:
        if c["id"] == challan_id:
            c["status"] = review.status
            save_challans(challans)
            return c
    raise HTTPException(status_code=404, detail="Challan not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

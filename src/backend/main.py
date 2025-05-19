from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
from pathlib import Path
from .visual_odometry import process_image_sequence

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/upload")
async def upload_images(file: UploadFile = File(...)):
    try:
        # Create temp directory for extracted images
        temp_dir = Path("temp_images")
        temp_dir.mkdir(exist_ok=True)
        
        # Save uploaded zip file
        zip_path = temp_dir / "upload.zip"
        with zip_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process images and get trajectory
        trajectory = await process_image_sequence(zip_path, temp_dir)
        
        # Cleanup
        shutil.rmtree(temp_dir)
        
        return {"trajectory": trajectory}
    
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
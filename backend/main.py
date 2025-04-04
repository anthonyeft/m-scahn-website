from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import cv2
import base64
import zlib
import json
import os
from utils.helpers import align_mask
from utils.onnx_models import SegmentationModel, ClassificationModel, process_image_classification
import onnxruntime as ort

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# TEMPORARY
from fastapi import UploadFile, File

@app.post("/upload-model")
async def upload_model(file: UploadFile = File(...)):
    os.makedirs("/persistent/models", exist_ok=True)  # Ensures directory exists
    save_path = f"/persistent/models/{file.filename}"
    with open(save_path, "wb") as f:
        f.write(await file.read())
    return {"status": "uploaded", "path": save_path}

SEGMENTATION_MODEL_PATH = os.environ.get("SEGMENTATION_MODEL_PATH", "/persistent/models/segmentation_model.onnx")
CLASSIFICATION_MODEL_PATH = os.environ.get("CLASSIFICATION_MODEL_PATH", "/persistent/models/classification_model.onnx")

# Add global vars for models
segmentation_model = None
classification_model = None

@app.on_event("startup")
def load_models():
    global segmentation_model, classification_model

    if os.path.exists(SEGMENTATION_MODEL_PATH):
        try:
            segmentation_model = SegmentationModel(SEGMENTATION_MODEL_PATH)
            print("[INFO] Segmentation model loaded.")
        except Exception as e:
            print(f"[ERROR] Segmentation model failed to load: {e}")
    else:
        print(f"[WARN] Segmentation model not found at {SEGMENTATION_MODEL_PATH}")

    if os.path.exists(CLASSIFICATION_MODEL_PATH):
        try:
            classification_model = ClassificationModel(CLASSIFICATION_MODEL_PATH)
            print("[INFO] Classification model loaded.")
        except Exception as e:
            print(f"[ERROR] Classification model failed to load: {e}")
    else:
        print(f"[WARN] Classification model not found at {CLASSIFICATION_MODEL_PATH}")

class ABCInput(BaseModel):
    image_base64: str

class EvolutionInput(BaseModel):
    mask1_compressed: str
    mask2_compressed: str

def decompress_mask(compressed_str):
    if not compressed_str:
        return None
    decompressed = zlib.decompress(base64.b64decode(compressed_str)).decode("utf-8")
    return np.array(json.loads(decompressed)).astype(np.uint8)

def compress_mask(mask):
    mask_list = mask.tolist()
    json_data = json.dumps(mask_list)
    compressed = base64.b64encode(zlib.compress(json_data.encode())).decode("utf-8")
    return compressed

@app.post("/analyze")
def analyze(input_data: ABCInput):
    if segmentation_model is None or classification_model is None:
        return {"error": "Models not loaded yet."}
    classification_result, processed_image_base64, contour_image_base64, abc_result = process_image_classification(input_data.image_base64, segmentation_model, classification_model)

    # Combine results
    result = {
        "asymmetry_score": abc_result["asymmetry"],
        "border_score": abc_result["border_irregularity"],
        "color_score": abc_result["color"],
        "traits": abc_result["traits"],
        "classification": classification_result["classification"],
        "confidence_score": classification_result["confidence_score"],
        "processed_image": processed_image_base64,
        "contour_image": contour_image_base64,
    }
    
    return result

@app.post("/evolve")
def evolve(input_data: EvolutionInput):
    if segmentation_model is None or classification_model is None:
        return {"error": "Models not loaded yet."}
    mask1 = decompress_mask(input_data.mask1_compressed)
    mask2 = decompress_mask(input_data.mask2_compressed)

    # Align both masks
    aligned1 = align_mask(mask1)
    aligned2 = align_mask(mask2)

    # Calculate the differences
    # 1. Size difference percentage
    size1 = np.sum(aligned1)
    size2 = np.sum(aligned2)
    size_diff_percentage = abs(size2 - size1) / max(size1, 1) * 100
    growth_detected = size2 > size1 * 1.1  # 10% growth threshold
    
    # 2. Create overlay
    overlay = np.zeros((aligned1.shape[0], aligned1.shape[1], 3), dtype=np.uint8)
    overlay[aligned2 == 1] = [255, 0, 0]      # Red for new image
    overlay[aligned1 == 1] = [255, 255, 255]  # White for old image
    
    # Encode overlay image
    _, buffer = cv2.imencode(".png", overlay)
    encoded_image = base64.b64encode(buffer).decode("utf-8")
    
    # Create response with more detailed evolution analysis
    return {
        "overlay_image_base64": f"data:image/png;base64,{encoded_image}",
        "changePercentage": round(size_diff_percentage, 1),
        "growthDetected": growth_detected,
        "summary": f"Analysis shows a {round(size_diff_percentage, 1)}% change in the lesion size.",
        "recommendations": "Continue to monitor the lesion for further changes. Consider a follow-up with a dermatologist."
    }

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy"}
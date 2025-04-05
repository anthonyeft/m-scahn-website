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

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SEGMENTATION_MODEL_PATH = os.environ.get("SEGMENTATION_MODEL_PATH", "/persistent/models/segmentation_model.onnx")
CLASSIFICATION_MODEL_PATH = os.environ.get("CLASSIFICATION_MODEL_PATH", "/persistent/models/classification_model.onnx")

segmentation_model = None
classification_model = None

@app.on_event("startup")
def load_models():
    global segmentation_model, classification_model
    if os.path.exists(SEGMENTATION_MODEL_PATH):
        segmentation_model = SegmentationModel(SEGMENTATION_MODEL_PATH)
    if os.path.exists(CLASSIFICATION_MODEL_PATH):
        classification_model = ClassificationModel(CLASSIFICATION_MODEL_PATH)

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

@app.post("/analyze")
def analyze(input_data: ABCInput):
    if segmentation_model is None or classification_model is None:
        return {"error": "Models not loaded yet."}
    
    classification_result, processed_image_base64, contour_image_base64, abc_result = process_image_classification(
        input_data.image_base64, segmentation_model, classification_model
    )

    return {
        "asymmetry_score": abc_result["asymmetry"],
        "border_score": abc_result["border_irregularity"],
        "color_score": abc_result["color"],
        "traits": abc_result["traits"],
        "classification": classification_result["classification"],
        "confidence_score": classification_result["confidence_score"],
        "processed_image": processed_image_base64,
        "contour_image": contour_image_base64,
    }

@app.post("/evolve")
def evolve(input_data: EvolutionInput):
    if segmentation_model is None:
        return {"error": "Segmentation model not loaded."}
    
    mask1 = decompress_mask(input_data.mask1_compressed)
    mask2 = decompress_mask(input_data.mask2_compressed)

    aligned1 = align_mask(mask1)
    aligned2 = align_mask(mask2)

    size1 = np.sum(aligned1)
    size2 = np.sum(aligned2)
    size_diff_percentage = abs(size2 - size1) / max(size1, 1) * 100
    growth_detected = size2 > size1 * 1.1

    overlay = np.zeros((*aligned1.shape, 3), dtype=np.uint8)
    overlay[aligned2 == 1] = [255, 0, 0]
    overlay[aligned1 == 1] = [255, 255, 255]

    _, buffer = cv2.imencode(".png", overlay)
    encoded_image = base64.b64encode(buffer).decode("utf-8")

    return {
        "overlay_image_base64": f"data:image/png;base64,{encoded_image}",
        "changePercentage": round(size_diff_percentage, 1),
        "growthDetected": growth_detected,
        "summary": f"Analysis shows a {round(size_diff_percentage, 1)}% change in the lesion size.",
        "recommendations": "Continue to monitor the lesion for further changes. Consider a follow-up with a dermatologist."
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

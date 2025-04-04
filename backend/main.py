from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import cv2
import base64
import zlib
import json
import os
from utils.helpers import decode_image, apply_color_constancy, apply_color_constancy_no_gamma
from utils.abc_metrics import calculate_abc_score
from utils.onnx_models import SegmentationModel, ClassificationModel, process_image_classification

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models on startup
SEGMENTATION_MODEL_PATH = os.environ.get("SEGMENTATION_MODEL_PATH", "./models/segmentation_model.onnx")
CLASSIFICATION_MODEL_PATH = os.environ.get("CLASSIFICATION_MODEL_PATH", "./models/classification_model.onnx")

# Initialize models
segmentation_model = SegmentationModel(SEGMENTATION_MODEL_PATH)
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

def compress_mask(mask):
    mask_list = mask.tolist()
    json_data = json.dumps(mask_list)
    compressed = base64.b64encode(zlib.compress(json_data.encode())).decode("utf-8")
    return compressed

@app.post("/analyze")
def analyze(input_data: ABCInput):
    classification_result, processed_image_base64, contour_image_base64 = process_image_classification(input_data.image_base64, segmentation_model, classification_model)
    
    # Calculate ABC scores using the color corrected image
    abc_result = calculate_abc_score(image_corrected, mask)
    
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
        "mask_compressed": compress_mask(mask)
    }
    
    return result

@app.post("/evolve")
def evolve(input_data: EvolutionInput):
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
        "colorChangeDetected": False,  # Placeholder - implement color change detection logic
        "borderChangeDetected": False,  # Placeholder - implement border change detection logic
        "summary": f"Analysis shows a {round(size_diff_percentage, 1)}% change in the lesion size.",
        "recommendations": "Continue to monitor the lesion for further changes. Consider a follow-up with a dermatologist."
    }

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy"}
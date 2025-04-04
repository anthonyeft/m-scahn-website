from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import cv2
import base64
import zlib
import json
from utils.helpers import decode_image, apply_color_constancy, align_mask
from utils.abc_metrics import calculate_abc_score

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ABCInput(BaseModel):
    image_base64: str
    mask_compressed: str  # zlib-compressed JSON-encoded list

class EvolutionInput(BaseModel):
    mask1_compressed: str
    mask2_compressed: str

def decompress_mask(compressed_str):
    decompressed = zlib.decompress(base64.b64decode(compressed_str)).decode("utf-8")
    return np.array(json.loads(decompressed)).astype(np.uint8)

@app.post("/analyze")
def analyze(input_data: ABCInput):
    image = decode_image(input_data.image_base64)
    mask = decompress_mask(input_data.mask_compressed)
    image_corrected = apply_color_constancy(image)

    result = calculate_abc_score(image_corrected, mask)
    return result

@app.post("/evolve")
def evolve(input_data: EvolutionInput):
    mask1 = decompress_mask(input_data.mask1_compressed)
    mask2 = decompress_mask(input_data.mask2_compressed)

    # Align both masks
    aligned1 = align_mask(mask1)
    aligned2 = align_mask(mask2)

    # Overlay difference: white for mask1, red for mask2 only
    overlay = np.zeros((aligned1.shape[0], aligned1.shape[1], 3), dtype=np.uint8)
    overlay[aligned2 == 1] = [255, 0, 0]      # Red
    overlay[aligned1 == 1] = [255, 255, 255]  # White

    _, buffer = cv2.imencode(".png", overlay)
    encoded_image = base64.b64encode(buffer).decode("utf-8")
    return {"overlay_image_base64": f"data:image/png;base64,{encoded_image}"}

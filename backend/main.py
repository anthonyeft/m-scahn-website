from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import numpy as np
import onnxruntime as ort
import io

from utils import preprocess_image

app = FastAPI()

# Allow all origins (secure this later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load ONNX models
clf_session = ort.InferenceSession("models/caformer_b36.onnx")
seg_session = ort.InferenceSession("models/mit_unet.onnx")

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    input_tensor = preprocess_image(image)

    # Classification
    clf_output = clf_session.run(None, {"input": input_tensor})[0]
    predicted_class = int(np.argmax(clf_output, axis=1))

    # Segmentation (optional)
    seg_output = seg_session.run(None, {"input": input_tensor})[0]
    seg_mask = (seg_output[0] > 0.5).astype(np.uint8)  # Simplified mask

    return {
        "diagnosis": predicted_class,
        "segmentation_shape": str(seg_mask.shape),
    }

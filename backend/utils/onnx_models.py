import numpy as np
import cv2
import onnxruntime as ort
import base64
from .helpers import apply_color_constancy_no_gamma, apply_color_constancy
from .helpers import decode_image

class SegmentationModel:
    def __init__(self, model_path):
        # Configure ONNX Runtime session
        session_options = ort.SessionOptions()
        session_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        self.session = ort.InferenceSession(model_path, session_options)
        
        # Get model metadata
        model_inputs = self.session.get_inputs()
        self.input_name = model_inputs[0].name
        self.input_shape = model_inputs[0].shape
        self.input_height = self.input_shape[2]
        self.input_width = self.input_shape[3]
        
    def preprocess(self, image):
        # Resize image to model's input dimensions
        image_resized = cv2.resize(image, (self.input_width, self.input_height))
        # Convert to float32 for normalization
        image_float = image_resized.astype(np.float32)
        # Normalize with ImageNet mean and std
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        normalized_image = (image_float / 255.0 - mean) / std
        # Transpose from HWC to NCHW format
        image_preprocessed = np.transpose(normalized_image, (2, 0, 1))
        # Add batch dimension
        image_preprocessed = np.expand_dims(image_preprocessed, axis=0)
        return image_preprocessed
    
    def predict(self, image):
        # Preprocess the image
        preprocessed_input = self.preprocess(image)
        
        # Run inference
        outputs = self.session.run(None, {self.input_name: preprocessed_input})
        
        # Process the output mask
        mask = outputs[0][0, 0]  # Assuming output shape is [1, 1, H, W]
        
        # Resize mask back to original image size
        original_h, original_w = image.shape[:2]
        mask = cv2.resize(mask, (original_w, original_h))
        
        # Threshold to get binary mask
        binary_mask = (mask > 0.5).astype(np.uint8)
        
        return binary_mask


class ClassificationModel:
    def __init__(self, model_path):
        # Configure ONNX Runtime session
        session_options = ort.SessionOptions()
        session_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        self.session = ort.InferenceSession(model_path, session_options)
        
        # Get model metadata
        model_inputs = self.session.get_inputs()
        self.input_name = model_inputs[0].name
        self.input_shape = model_inputs[0].shape
        self.input_height = self.input_shape[2]
        self.input_width = self.input_shape[3]
        
        # Define class names (adjust based on your model)
        self.classes = ["Benign", "Melanoma"]
        
    def preprocess(self, image):
        # Resize image to model's input dimensions
        image_resized = cv2.resize(image, (self.input_width, self.input_height))
        # Convert to float32 for normalization
        image_float = image_resized.astype(np.float32)
        # Normalize with ImageNet mean and std
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        normalized_image = (image_float / 255.0 - mean) / std
        # Transpose from HWC to NCHW format
        image_preprocessed = np.transpose(normalized_image, (2, 0, 1))
        # Add batch dimension
        image_preprocessed = np.expand_dims(image_preprocessed, axis=0)
        return image_preprocessed
    
    def predict(self, image):
        preprocessed_input = self.preprocess(image)
        
        # Run inference
        outputs = self.session.run(None, {self.input_name: preprocessed_input})
        
        # Process the output probabilities
        probabilities = outputs[0][0]  # Assuming output shape is [1, num_classes]
        
        # Get the predicted class index and confidence
        predicted_class_idx = np.argmax(probabilities)
        confidence_score = probabilities[predicted_class_idx]
        
        return {
            "classification": self.classes[predicted_class_idx],
            "confidence_score": float(confidence_score)
        }

# Function to properly format and return images in main.py

def process_image(image_data, segmentation_model, classification_model):
    # Decode the base64 image to numpy array
    image = decode_image(image_data)
    
    # Save original image
    original_image = image.copy()
    
    # Apply color constancy without gamma for display
    image_no_gamma = apply_color_constancy_no_gamma(image.copy())

    # Apply color constancy with gamma for model input
    image_gamma = apply_color_constancy(image.copy())

    # Generate mask using segmentation model
    mask = segmentation_model.predict(image_gamma)
    binary_mask = mask.copy()
    
    # Find contours for drawing on processed image
    contours, _ = cv2.findContours(binary_mask.astype(np.uint8), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    # Draw contours over the processed image
    contour_image = image_no_gamma.copy()
    cv2.drawContours(contour_image, contours, -1, (0, 255, 0), 3)
    
    # Get classification results
    classification_results = classification_model.predict(image_gamma)
    
    # Encode images for response
    def encode_image(img):
        _, buffer = cv2.imencode(".png", cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
        return f"data:image/png;base64,{base64.b64encode(buffer).decode('utf-8')}"
    
    processed_image = encode_image(image_no_gamma)
    contour_image = encode_image(contour_image)
    
    return mask, classification_results, processed_image, contour_image
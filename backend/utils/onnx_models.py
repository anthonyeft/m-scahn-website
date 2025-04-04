import numpy as np
import cv2
import onnxruntime as ort
import base64
from .helpers import apply_color_constancy_no_gamma, apply_color_constancy, encode_image, decode_image
from .abc_metrics import calculate_abc_score


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
        image_resized = cv2.resize(image, (self.input_width, self.input_height))
        image_float = image_resized.astype(np.float32)
        
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
        
        # Process the output mask
        mask = outputs[0][0, 0]  # Assuming output shape is [1, 1, H, W]
        
        # Resize mask back to original image size
        original_h, original_w = image.shape[:2]
        mask = cv2.resize(mask, (original_w, original_h))
        
        # Threshold to get binary mask
        _, binary_mask = cv2.threshold(mask.astype(np.float32), 0.5, 1, cv2.THRESH_BINARY).astype(np.uint8)
        
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
        self.classes = ["Melanoma", "Benign Nevus", "Basal Cell Carcinoma", "Squamous Cell Carcinoma", "Actinic Keratosis", "Vascular Lesion", "Dermatofibroma"]
        
    def preprocess(self, image):
        image_resized = cv2.resize(image, (self.input_width, self.input_height))
        image_float = image_resized.astype(np.float32)

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


def process_image_classification(image_data, segmentation_model, classification_model):
    # Decode the base64 image to numpy array
    image = decode_image(image_data)
    
    # Apply color constancy without gamma for display
    image_no_gamma = apply_color_constancy_no_gamma(image.copy())

    # Apply color constancy with gamma for model input
    image_gamma = apply_color_constancy(image.copy())

    # Generate mask using segmentation model
    mask = segmentation_model.predict(image_gamma)
    
    # Find contours for drawing on processed image
    contours, _ = cv2.findContours(mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    main_contour = max(contours, key=cv2.contourArea) if contours else None

    # Get ABC metrics
    abc_results = calculate_abc_score(image_no_gamma, mask, main_contour)

    # Draw contours over the processed image
    contour_image = image_no_gamma.copy()
    cv2.drawContours(contour_image, main_contour, -1, (0, 255, 0), 3)
    
    # Get classification results
    classification_results = classification_model.predict(image_gamma)
    
    processed_image = encode_image(image_no_gamma)
    contour_image = encode_image(contour_image)
    
    return classification_results, processed_image, contour_image, abc_results
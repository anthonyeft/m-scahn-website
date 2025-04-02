import base64
import numpy as np
import cv2

def decode_image(base64_str):
    header_removed = base64_str.split(',')[-1]
    img_bytes = base64.b64decode(header_removed)
    np_arr = np.frombuffer(img_bytes, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

def decode_mask(mask_array):
    return np.array(mask_array).astype(np.uint8)

def apply_color_constancy(img, power=6, gamma=1.8):
    img_dtype = img.dtype
    img = img.astype('uint8')

    # Gamma correction
    look_up_table = np.array([((i / 255.0) ** (1 / gamma)) * 255 for i in range(256)]).astype('uint8')
    img = cv2.LUT(img, look_up_table)

    img = img.astype('float32')
    img_power = np.power(img, power)
    rgb_vec = np.power(np.mean(img_power, axis=(0, 1)), 1 / power)
    rgb_norm = np.linalg.norm(rgb_vec)
    rgb_vec = rgb_vec / rgb_norm
    scale = 1 / (rgb_vec * np.sqrt(3))

    img = np.clip(np.multiply(img, scale), 0, 255).astype('uint8')
    return img.astype(img_dtype)

def apply_color_constancy_no_gamma(img, power=6):
    img_dtype = img.dtype
    img = img.astype('float32')
    img_power = np.power(img, power)
    rgb_vec = np.power(np.mean(img_power, axis=(0, 1)), 1 / power)
    rgb_norm = np.linalg.norm(rgb_vec)
    rgb_vec = rgb_vec / rgb_norm
    scale = 1 / (rgb_vec * np.sqrt(3))

    img = np.clip(np.multiply(img, scale), 0, 255).astype('uint8')
    return img.astype(img_dtype)

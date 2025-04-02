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

def align_mask(mask):
    mask = mask.astype(np.uint8) * 255

    # Calculate image moments
    moments = cv2.moments(mask)

    if moments['m00'] == 0:
        return 0  # Return early if mask is empty

    # Calculate centroid (center of mass)
    cx = int(moments['m10'] / moments['m00'])
    cy = int(moments['m01'] / moments['m00'])

    # Calculate central moments for covariance matrix
    mu11 = moments['mu11']
    mu20 = moments['mu20']
    mu02 = moments['mu02']

    # Calculate covariance matrix and its eigenvectors
    covariance_matrix = np.array([[mu20, mu11], [mu11, mu02]])
    eigenvalues, eigenvectors = np.linalg.eig(covariance_matrix)

    # Calculate angle of rotation (in degrees)
    angle = -np.arctan2(eigenvectors[0, 1], eigenvectors[0, 0]) * (180 / np.pi)

    # Center of the image
    image_center = (mask.shape[1] // 2, mask.shape[0] // 2)

    # Rotation matrix (includes translation to re-center the image)
    rotation_matrix = cv2.getRotationMatrix2D((cx, cy), angle, 1.0)
    tx = image_center[0] - cx
    ty = image_center[1] - cy
    rotation_matrix[0, 2] += tx  # Translation in x
    rotation_matrix[1, 2] += ty  # Translation in y

    # Rotate and translate mask
    rotated_mask = cv2.warpAffine(mask, rotation_matrix, (mask.shape[1], mask.shape[0]))

    # convert mask back 0-1 range and binary
    rotated_mask = rotated_mask / 255
    rotated_mask = np.where(rotated_mask > 0.5, 1, 0)

    return rotated_mask
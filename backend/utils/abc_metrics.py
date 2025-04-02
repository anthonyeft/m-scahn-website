import numpy as np
import cv2
from skimage import segmentation, graph

def _weight_mean_color(graph, src, dst, n):
    diff = graph.nodes[dst]['mean color'] - graph.nodes[n]['mean color']
    diff = np.linalg.norm(diff)
    return {'weight': diff}

def merge_mean_color(graph, src, dst):
    graph.nodes[dst]['total color'] += graph.nodes[src]['total color']
    graph.nodes[dst]['pixel count'] += graph.nodes[src]['pixel count']
    graph.nodes[dst]['mean color'] = (graph.nodes[dst]['total color'] / graph.nodes[dst]['pixel count'])

def extract_main_contour(mask):
    _, binary_mask = cv2.threshold(mask.astype(np.float32), 0.5, 1, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(binary_mask.astype(np.uint8), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    if len(contours) == 0:
        return None
    return max(contours, key=cv2.contourArea)


def calculate_color_asymmetry(image, mask, traits):
    lab_image = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
    height, width = lab_image.shape[:2]

    left_half = lab_image[:, :width // 2]
    right_half = lab_image[:, width // 2:]
    top_half = lab_image[:height // 2, :]
    bottom_half = lab_image[height // 2:, :]

    mean_color_left = np.mean(left_half[mask[:, :width // 2] > 0], axis=0)
    mean_color_right = np.mean(right_half[mask[:, width // 2:] > 0], axis=0)
    mean_color_top = np.mean(top_half[mask[:height // 2, :] > 0], axis=0)
    mean_color_bottom = np.mean(bottom_half[mask[height // 2:, :] > 0], axis=0)

    threshold = 15
    color_h = np.linalg.norm(mean_color_left - mean_color_right) > threshold
    color_v = np.linalg.norm(mean_color_top - mean_color_bottom) > threshold

    if color_h:
        traits.append("Horizontal color asymmetry")
    if color_v:
        traits.append("Vertical color asymmetry")

    return int(color_h), int(color_v)


def calculate_asymmetry(image, mask, traits):
    mask = mask.astype(np.uint8) * 255
    moments = cv2.moments(mask)
    if moments['m00'] == 0:
        return 0

    cx = int(moments['m10'] / moments['m00'])
    cy = int(moments['m01'] / moments['m00'])
    mu11, mu20, mu02 = moments['mu11'], moments['mu20'], moments['mu02']

    cov = np.array([[mu20, mu11], [mu11, mu02]])
    _, vecs = np.linalg.eig(cov)
    angle = -np.arctan2(vecs[0, 1], vecs[0, 0]) * (180 / np.pi)

    center = (mask.shape[1] // 2, mask.shape[0] // 2)
    rot_mat = cv2.getRotationMatrix2D((cx, cy), angle, 1.0)
    rot_mat[0, 2] += center[0] - cx
    rot_mat[1, 2] += center[1] - cy

    rotated_mask = cv2.warpAffine(mask, rot_mat, (mask.shape[1], mask.shape[0]))
    rotated_image = cv2.warpAffine(image, rot_mat, (mask.shape[1], mask.shape[0]))

    h, w = rotated_mask.shape
    v_split = h // 2 + h % 2
    h_split = w // 2 + w % 2

    upper = rotated_mask[:v_split, :]
    lower = rotated_mask[v_split:, :]
    left = rotated_mask[:, :h_split]
    right = rotated_mask[:, h_split:]

    up_down_diff = np.sum(np.abs(upper - np.flip(lower, axis=0)))
    left_right_diff = np.sum(np.abs(left - np.flip(right, axis=1)))
    total = np.sum(rotated_mask) + 1e-6

    asymmetry_threshold = 0.035
    shape_h = up_down_diff / total > asymmetry_threshold
    shape_v = left_right_diff / total > asymmetry_threshold

    if shape_h:
        traits.append("Horizontal shape asymmetry")
    if shape_v:
        traits.append("Vertical shape asymmetry")

    color_h, color_v = calculate_color_asymmetry(rotated_image, rotated_mask, traits)
    points = int(shape_h or color_h) + int(shape_v or color_v)
    return points / 2


def calculate_border_irregularity(image, mask, contour, traits,
                                   circularity_threshold=0.2, convexity_threshold=0.95, edge_threshold=0.8):
    points = 0
    mask = mask.astype(np.uint8) * 255

    peri = cv2.arcLength(contour, True)
    area = cv2.contourArea(contour)
    circ = (4 * np.pi * area) / (peri ** 2 + 1e-6)
    if 1 - circ > circularity_threshold:
        traits.append("Irregular overall shape (circularity)")
        points += 1

    hull = cv2.convexHull(contour)
    hull_area = cv2.contourArea(hull)
    convexity = area / (hull_area + 1e-6)
    if convexity < convexity_threshold:
        traits.append("Irregular border shapes (convexity)")
        points += 1

    image = cv2.bilateralFilter(image, 9, 75, 75)
    edges = cv2.Canny(image, 100, 100)
    kernel = np.ones((40, 40), np.uint8)
    eroded = cv2.erode(mask, kernel, iterations=1)
    border = cv2.subtract(mask, eroded)
    border_edges = cv2.bitwise_and(edges, edges, mask=border)

    edge_count = np.sum(border_edges > 0)
    edge_score = edge_count / peri
    if edge_score > edge_threshold:
        traits.append("Fine border irregularities (edge detection)")
        points += 1

    return points / 3


def calculate_color_count(image, mask, traits):
    mask = mask.astype(np.uint8) * 255
    labels = segmentation.slic(image, compactness=25, n_segments=600, start_label=1)
    rag = graph.rag_mean_color(image, labels)
    labels2 = graph.merge_hierarchical(labels, rag, thresh=60, rag_copy=False,
                                       in_place_merge=True,
                                       merge_func=merge_mean_color,
                                       weight_func=_weight_mean_color)

    mean_colors = {}
    for label in np.unique(labels2):
        region = labels2 == label
        if np.sum(mask[region]) / np.sum(region) > 0.8 * 255:
            mean_colors[label] = np.mean(image[region], axis=0)

    def is_similar(color, others):
        for c in others:
            if np.linalg.norm(c - color) < 30:
                return True
        return False

    unique_colors = []
    for c in mean_colors.values():
        if not is_similar(c, unique_colors):
            unique_colors.append(c)

    score = (len(unique_colors) - 1) / 4
    score = min(max(score, 0), 1)
    if score >= 1:
        traits.append("High number of unique colors")

    return score, None  # Skip color image overlay for backend


def calculate_abc_score(image, mask):
    traits = []
    contour = extract_main_contour(mask)
    if contour is None:
        return {
            "asymmetry": 0,
            "border_irregularity": 0,
            "color": 0,
            "traits": ["No contour detected"]
        }

    a = calculate_asymmetry(image, mask, traits)
    b = calculate_border_irregularity(image, mask, contour, traits)
    c, _ = calculate_color_count(image, mask, traits)

    return {
        "asymmetry": round(a, 3),
        "border_irregularity": round(b, 3),
        "color": round(c, 3),
        "traits": traits
    }

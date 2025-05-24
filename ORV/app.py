from flask import Flask, request, jsonify
import cv2
import numpy as np
import io
from PIL import Image

app = Flask(__name__)

def detect_skin_regions(image):
    # Convert BGR to HSV
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    # Define skin color range in HSV
    lower_skin = np.array([0, 40, 70], dtype=np.uint8)
    upper_skin = np.array([25, 255, 255], dtype=np.uint8)

    # Mask for skin regions
    mask = cv2.inRange(hsv, lower_skin, upper_skin)

    # Morphological ops to clean up mask
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

    return mask

@app.route("/detect-face", methods=["POST"])
def detect_face():
    if "image" not in request.files:
        return jsonify({"error": "No image file uploaded"}), 400

    file = request.files["image"]
    img = Image.open(file.stream).convert("RGB")
    image_np = np.array(img)
    image_bgr = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)

    skin_mask = detect_skin_regions(image_bgr)

    # Count non-zero pixels to decide if skin-like region exists
    skin_area = cv2.countNonZero(skin_mask)
    total_area = skin_mask.shape[0] * skin_mask.shape[1]
    skin_ratio = skin_area / total_area

    result = {
        "skin_detected": skin_ratio > 0.02,
        "skin_area_ratio": skin_ratio
    }

    return jsonify(result)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

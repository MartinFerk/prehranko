from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from PIL import Image
import base64

app = Flask(__name__)

# You can allow everything during development:
CORS(app)

# OR: safer in production (replace with your frontend domain)
# CORS(app, resources={r"/preprocess": {"origins": "https://yourfrontenddomain.com"}})

def preprocess_image(image_bgr):
    image_resized = cv2.resize(image_bgr, (400, 400))
    image_blurred = cv2.GaussianBlur(image_resized, (5, 5), 0)
    return image_blurred

def encode_image_to_base64(image_bgr):
    _, buffer = cv2.imencode('.png', image_bgr)
    encoded = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/png;base64,{encoded}"

@app.route("/preprocess", methods=["POST"])
def preprocess_route():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    img = Image.open(file.stream).convert("RGB")
    image_np = np.array(img)
    image_bgr = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)

    preprocessed = preprocess_image(image_bgr)
    image_base64 = encode_image_to_base64(preprocessed)

    return jsonify({ "image_base64": image_base64 })

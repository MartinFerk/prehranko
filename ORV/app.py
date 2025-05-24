from flask import Flask, request, jsonify, render_template_string
import cv2
import numpy as np
from PIL import Image
import io
import base64

app = Flask(__name__)

def detect_skin_regions(image):
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    lower_skin = np.array([0, 40, 70], dtype=np.uint8)
    upper_skin = np.array([25, 255, 255], dtype=np.uint8)
    mask = cv2.inRange(hsv, lower_skin, upper_skin)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    return mask

def paint_mask_on_image(image_bgr, skin_mask):
    result = image_bgr.copy()
    result[skin_mask > 0] = [0, 255, 0]  # Paint skin pixels green
    return result

def encode_image_to_base64(image_bgr):
    _, buffer = cv2.imencode('.png', image_bgr)
    encoded = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/png;base64,{encoded}"

# Basic HTML template
HTML = """
<!DOCTYPE html>
<html>
<head>
  <title>Face Skin Detection</title>
</head>
<body>
  <h2>Upload an image</h2>
  <input type="file" id="fileInput" accept="image/*">
  <p id="result">Waiting for image...</p>
  <img id="debugImage" style="max-width: 400px; display: none;" />
  <script>
    const input = document.getElementById('fileInput');
    const resultText = document.getElementById('result');
    const debugImg = document.getElementById('debugImage');

    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('image', file);
      
      const res = await fetch('/detect-face', {
        method: 'POST',
        body: formData
      });

      const json = await res.json();
      resultText.innerText = 
        '✅ Skin Detected: ' + json.skin_detected +
        ' | Skin Area Ratio: ' + json.skin_area_ratio.toFixed(4);
      
      if (json.debug_image_base64) {
        debugImg.src = json.debug_image_base64;
        debugImg.style.display = 'block';
      }
    });
  </script>
</body>
</html>
"""

@app.route("/", methods=["GET"])
def index():
    return render_template_string(HTML)

@app.route("/detect-face", methods=["POST"])
def detect_face():
    if "image" not in request.files:
        return jsonify({"error": "No image file uploaded"}), 400

    file = request.files["image"]
    img = Image.open(file.stream).convert("RGB")
    image_np = np.array(img)
    image_bgr = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)

    skin_mask = detect_skin_regions(image_bgr)

    skin_area = cv2.countNonZero(skin_mask)
    total_area = skin_mask.shape[0] * skin_mask.shape[1]
    skin_ratio = skin_area / total_area

    # Create debug image with green highlights
    painted_image = paint_mask_on_image(image_bgr, skin_mask)
    debug_image_b64 = encode_image_to_base64(painted_image)

    result = {
        "skin_detected": skin_ratio > 0.02,
        "skin_area_ratio": skin_ratio,
        "debug_image_base64": debug_image_b64
    }

    return jsonify(result)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

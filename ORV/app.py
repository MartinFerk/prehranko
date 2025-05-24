from flask import Flask, request, render_template_string, jsonify
import cv2
import numpy as np
from PIL import Image
import io
import base64

app = Flask(__name__)

def preprocess_image(image_bgr):
    # Resize to standard size
    image_resized = cv2.resize(image_bgr, (400, 400))
    
    # Optional: blur
    image_blurred = cv2.GaussianBlur(image_resized, (5, 5), 0)

    # Optional: convert to grayscale
    #image_gray = cv2.cvtColor(image_blurred, cv2.COLOR_BGR2GRAY)

    # Convert grayscale back to 3-channel image for display
    #image_final = cv2.cvtColor(image_gray, cv2.COLOR_GRAY2BGR)

    return image_blurred

def encode_image_to_base64(image_bgr):
    _, buffer = cv2.imencode('.png', image_bgr)
    encoded = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/png;base64,{encoded}"

HTML = """
<!DOCTYPE html>
<html>
<head>
  <title>Image Preprocessing Preview</title>
</head>
<body>
  <h2>Upload an image to preprocess it</h2>
  <input type="file" id="fileInput" accept="image/*">
  <br><br>
  <img id="preview" style="max-width: 400px; display: none;" />
  <script>
    const input = document.getElementById('fileInput');
    const preview = document.getElementById('preview');

    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/preprocess', {
        method: 'POST',
        body: formData
      });

      const json = await res.json();
      if (json.image_base64) {
        preview.src = json.image_base64;
        preview.style.display = 'block';
      }
    });
  </script>
</body>
</html>
"""

@app.route("/", methods=["GET"])
def index():
    return render_template_string(HTML)

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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

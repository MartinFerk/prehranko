from flask import Flask, request, jsonify
from PIL import Image, ImageFilter
import numpy as np
import io
import base64

app = Flask(__name__)

def preprocess_image(image_pil):
    return image_pil.resize((400, 400)).filter(ImageFilter.GaussianBlur(radius=2))

def encode_image_to_base64(image_pil):
    buffer = io.BytesIO()
    image_pil.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode('utf-8')
    return f"data:image/png;base64,{encoded}"

def detect_skin(image_pil):
    # Pretvori sliko v HSV
    image_np = np.array(image_pil.convert("HSV"))
    h, s, v = image_np[:, :, 0], image_np[:, :, 1], image_np[:, :, 2]

    # Kožni razpon (posplošen)
    skin_mask = (
        (h > 0) & (h < 50) &     # Hue za svetlo rjavo/rožnato
        (s > 40) & (s < 200) &   # Saturation mora biti srednji
        (v > 80) & (v < 255)     # Brightness mora biti srednji
    )

    skin_pixels = np.sum(skin_mask)
    total_pixels = image_np.shape[0] * image_np.shape[1]

    skin_ratio = skin_pixels / total_pixels
    print(f"🧪 Kožni piksli: {skin_pixels}, razmerje: {skin_ratio:.3f}")

    return bool(skin_ratio > 0.05)
  # 5% kože = domnevna oseba

@app.route("/", methods=["GET"])
def index():
    return "<h1>API is running</h1>"

@app.route("/preprocess", methods=["POST"])
def preprocess_route():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    try:
        file = request.files["image"]
        img = Image.open(file.stream).convert("RGB")
        preprocessed = preprocess_image(img)
        authorized = detect_skin(preprocessed)
        image_base64 = encode_image_to_base64(preprocessed)

        return jsonify({
            "image_base64": image_base64,
            "authorized": authorized
        })

    except Exception as e:
        print("❌ Napaka pri obdelavi slike:", str(e))
        return jsonify({
            "error": "Image processing failed",
            "details": str(e),
            "authorized": False
        }), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

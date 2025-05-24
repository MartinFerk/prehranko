from flask import Flask, request, render_template_string, jsonify
from PIL import Image, ImageFilter
import io
import base64

app = Flask(__name__)

def preprocess_image(image_pil):
    image_resized = image_pil.resize((400, 400))
    image_blurred = image_resized.filter(ImageFilter.GaussianBlur(radius=2))
    return image_blurred

def encode_image_to_base64(image_pil):
    buffer = io.BytesIO()
    image_pil.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode('utf-8')
    return f"data:image/png;base64,{encoded}"

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
        image_base64 = encode_image_to_base64(preprocessed)

        return jsonify({ "image_base64": image_base64 })

    except Exception as e:
        print("❌ Napaka pri obdelavi slike:", str(e))
        return jsonify({ "error": "Image processing failed", "details": str(e) }), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

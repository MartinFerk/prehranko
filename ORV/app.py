from flask import Flask, request, jsonify
from PIL import Image, ImageFilter
import numpy as np
import io

app = Flask(__name__)


def preprocess_image(image_pil):
    return image_pil.resize((400, 400)).filter(ImageFilter.GaussianBlur(radius=2))


def extract_face_embedding(image_pil):
    # Simulacija 128-dimenzionalnega vektorja značilk
    return np.random.rand(128).tolist()


@app.route("/", methods=["GET"])
def index():
    return "<h1>Face Embedding API teče</h1>"


@app.route("/extract-embeddings", methods=["POST"])
def extract_embeddings():
    if "images" not in request.files:
        return jsonify({"error": "Ni naloženih slik (images)"}), 400

    images = request.files.getlist("images")
    if len(images) == 0:
        return jsonify({"error": "Seznam slik je prazen"}), 400
    if len(images) > 5:
        return jsonify({"error": "Največ 5 slik je dovoljeno"}), 400

    embeddings = []

    try:
        for file in images:
            img = Image.open(file.stream).convert("RGB")
            preprocessed = preprocess_image(img)
            embedding = extract_face_embedding(preprocessed)
            embeddings.append(embedding)

        return jsonify({
            "embeddings": embeddings,
            "count": len(embeddings)
        })

    except Exception as e:
        print("❌ Napaka pri obdelavi slik:", str(e))
        return jsonify({
            "error": "Napaka pri obdelavi slik",
            "details": str(e)
        }), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

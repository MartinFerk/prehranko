from flask import Flask, request, jsonify
import face_recognition
import numpy as np
import io
from PIL import Image

app = Flask(__name__)

@app.route("/")
def hello():
    return "Face Auth Service Running"

@app.route("/preprocess", methods=["POST"])
def preprocess():
    file = request.files["image"]
    image = face_recognition.load_image_file(file)
    faces = face_recognition.face_locations(image)

    if not faces:
        return jsonify({"message": "No face found"}), 400

    return jsonify({"message": "Face detected", "faces": len(faces)})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
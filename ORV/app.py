from flask import Flask, request, jsonify
from PIL import Image
import numpy as np
import cv2
from pymongo import MongoClient
import os
from dotenv import load_dotenv

# UVOZIM funkcije iz drugih datotek
from features import lbp_descriptor, cosine_similarity
from face_utils import detect_skin_hsv, find_face_box

# === Mongo povezava ===
load_dotenv()
mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)
db = client["face_auth"]
users = db["users"]

# === Flask App ===
app = Flask(__name__)

def extract_face_features(image_pil):
    mask = detect_skin_hsv(image_pil)
    box = find_face_box(mask)
    if not box:
        raise Exception("Ni bilo mogoče zaznati obraza.")
    x, y, w, h = box
    gray = image_pil.convert("L").crop((x, y, x+w, y+h)).resize((100, 100))
    return lbp_descriptor(np.array(gray))

# === API ROUTES ===
@app.route("/")
def home():
    return "✅ 2FA API with MongoDB running"

@app.route("/register", methods=["POST"])
def register():
    email = request.form.get("email")
    files = request.files.getlist("images")
    if not email or len(files) < 5:
        return jsonify({"error": "Email and 5 images required"}), 400

    features = []
    for file in files:
        image = Image.open(file.stream).convert("RGB")
        try:
            feat = extract_face_features(image)
            features.append(feat.tolist())
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    users.replace_one({"email": email}, {"email": email, "features": features}, upsert=True)
    return jsonify({"registered": True})

@app.route("/verify", methods=["POST"])
def verify():
    email = request.form.get("email")
    file = request.files.get("image")
    if not email or not file:
        return jsonify({"error": "Email and image required"}), 400

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404

    image = Image.open(file.stream).convert("RGB")
    try:
        feat = extract_face_features(image)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    similarities = [cosine_similarity(feat, np.array(f)) for f in user["features"]]
    best = max(similarities)

    return jsonify({
        "verified": best > 0.85,
        "similarity": round(best, 3)
    })

# === Railway Start ===
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

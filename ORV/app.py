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
        raise Exception("Ni bilo mogoce zaznati obraza.")
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
        print(f"⚠️ Obraz ni zaznan v eni izmed slik: {e}")
        continue

if len(features) < 3:
    return jsonify({"error": "Premalo uspešnih zaznav obraza"}), 400


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
    verified = best > 0.85

    # ✅ Če je uspešna primerjava, zbriši pending2FA
    if verified:
        users.update_one({"email": email}, {"$set": {"pending2FA": False}})

    return jsonify({
        "verified": verified,
        "similarity": round(best, 3)
    })


# === Railway Start ===
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

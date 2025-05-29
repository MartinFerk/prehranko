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

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def extract_face_features(image_pil):
    # Pretvori PIL sliko v OpenCV format (NumPy array)
    image_cv = np.array(image_pil)
    gray = cv2.cvtColor(image_cv, cv2.COLOR_RGB2GRAY)

    # Detekcija obrazov
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

    if len(faces) == 0:
        raise Exception("❌ Obraz ni bil zaznan (OpenCV)")

    # Uporabi prvi najdeni obraz
    x, y, w, h = faces[0]
    face_crop = gray[y:y+h, x:x+w]
    face_resized = cv2.resize(face_crop, (100, 100))

    # Izračunaj značilke z LBP
    return lbp_descriptor(face_resized)

# === API ROUTES ===
@app.route("/")
def home():
    return "✅ 2FA API with MongoDB running"

@app.route("/register", methods=["POST"])
def register():
    print("🚀 POST /register prejet")
    email = request.form.get("email")
    files = request.files.getlist("images")
    if not email or len(files) < 5:
        return jsonify({"error": "Email and 5 images required"}), 400

    features = []
    for i, file in enumerate(files):
        print(f"📷 Obdelujem sliko {i+1} za {email}")
        image = Image.open(file.stream).convert("RGB")
        try:
            feat = extract_face_features(image)
            features.append(feat.tolist())
            print(f"✅ Slika {i+1} uspešno obdelana.")
        except Exception as e:
            print(f"❌ Napaka pri zaznavi obraza na sliki {i+1}: {e}")
            continue
    print("✅ Register končan")

    if len(features) < 3:
        return jsonify({"error": "Premalo uspešnih zaznav obraza"}), 400

    # 🔐 Tukaj shraniš uporabnika v MongoDB
    users.replace_one(
        {"email": email},
        {"email": email, "features": features},
        upsert=True
    )

    return jsonify({"ok": True})



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

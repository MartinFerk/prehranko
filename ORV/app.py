from flask import Flask, request, jsonify
from PIL import Image
import numpy as np
import io
import cv2
import requests
import logging
import torch
from torchvision import models, transforms
import os
import urllib.request
import gdown

MODEL_PATH = "resnet50_face_trained.pt"
MODEL_URL = "https://drive.google.com/uc?export=download&id=1ylu7N69oA5N5QhxsilIgtsCS6CUgjtK9"
# 📦 Začasna shramba 2FA statusov
two_fa_status = {}

def download_model_if_missing():

    
    if not os.path.exists(MODEL_PATH):
        print("⬇️ Model ne obstaja – prenašam z Google Drive...")
        url = "https://drive.google.com/uc?id=1ylu7N69oA5N5QhxsilIgtsCS6CUgjtK9"
        gdown.download(url, output=MODEL_PATH, quiet=False)
        print("✅ Model uspešno prenesen.")
    else:
        print("📦 Model že obstaja – prenos ni potreben.")

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s [%(levelname)s] %(message)s'
)

app = Flask(__name__)

# === OpenCV Haar Cascade ===
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

# === Naloži naučen ResNet-50 model ===
resnet_model = models.resnet50(pretrained=False)
resnet_model.fc = torch.nn.Linear(2048, 3)
download_model_if_missing()

try:
    loaded = torch.load(MODEL_PATH, map_location=torch.device("cpu"))

    if isinstance(loaded, dict):
        # Če je naložen state_dict
        resnet_model = models.resnet50(weights=None)
        resnet_model.fc = torch.nn.Identity()  # odstranimo klasifikator
        resnet_model.load_state_dict(loaded)
        print("✅ Naložen state_dict model.")
    else:
        # Če je naložen celoten model
        resnet_model = loaded
        print("ℹ️ Naložen celoten model.")

    resnet_model.eval()

except Exception as e:
    print("❌ Napaka pri nalaganju modela:", e)
    raise

# === Transformacije za vhodne slike ===
resnet_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5]*3, std=[0.5]*3)
])

# === Obrezovanje slike in zaznava obraza ===
def preprocess_image(image_pil):
    return image_pil.resize((400, 400))

def detect_face(image_pil):
    try:
        image_np = np.array(image_pil.convert("RGB"))
        gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.05,
            minNeighbors=3,
            minSize=(30, 30)
        )

        logging.debug(f"Zaznani obrazi: {faces}")

        if len(faces) == 0:
            raise ValueError("Obraz ni bil zaznan.")

        x, y, w, h = sorted(faces, key=lambda f: f[2]*f[3], reverse=True)[0]
        face_region = image_np[y:y+h, x:x+w]
        face_resized = cv2.resize(face_region, (224, 224))
        return Image.fromarray(face_resized)

    except Exception as e:
        logging.warning("Napaka pri zaznavi obraza: %s", str(e))
        raise

# === Ekstrakcija značilk z naučenim ResNet-50 ===
def extract_resnet_embedding(image_pil):
    face_img = detect_face(image_pil)
    input_tensor = resnet_transform(face_img).unsqueeze(0)
    with torch.no_grad():
        embedding = resnet_model(input_tensor).squeeze().numpy()
    return embedding.tolist()

def cosine_similarity(a, b):
    a = np.array(a)
    b = np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

@app.route("/", methods=["GET"])
def index():
    return "<h1>Face Embedding API teče (ResNet-50 naučen model)</h1>"

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
            try:
                img = Image.open(file.stream).convert("RGB")
                preprocessed = preprocess_image(img)
                embedding = extract_resnet_embedding(preprocessed)
                embeddings.append(embedding)
            except Exception as e:
                print("⚠️ Napaka pri sliki:", file.filename, str(e))
                continue

        if len(embeddings) == 0:
            return jsonify({"error": "Ni bilo mogoče pridobiti značilk iz nobene slike"}), 400

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

@app.route("/api/auth/verify", methods=["GET", "POST"])
def verify_face():
    if request.method == "GET":
        return "<h3>✅ Endpoint deluje. Pošlji POST z email + image za preverjanje.</h3>"

    if "image" not in request.files or "email" not in request.form:
        logging.warning("Zahteva brez slike ali e-maila")
        return jsonify({"error": "Manjka email ali slika"}), 400

    email = request.form["email"]
    file = request.files["image"]
    logging.debug(f"📨 Preverjam e-mail: {email}")

    try:
        img = Image.open(file.stream).convert("RGB")
        preprocessed = preprocess_image(img)
        logging.debug("🖼️ Slika uspešno prebrana in predobdelana")

        try:
            test_embedding = extract_resnet_embedding(preprocessed)
            logging.debug(f"✅ Ekstrakcija značilk uspela, dolžina: {len(test_embedding)}")
        except Exception as e:
            logging.warning(f"❌ Obraz ni bil zaznan: {e}")
            return jsonify({"error": "Obraz ni bil zaznan"}), 400

        response = requests.get(f"https://prehranko-production.up.railway.app/api/auth/embeddings?email={email}")
        if response.status_code != 200:
            logging.error(f"❌ Napaka pri pridobivanju značilk: {response.status_code}")
            return jsonify({"error": "Napaka pri pridobivanju značilk"}), 500

        data = response.json()
        saved_embeddings = data.get("faceEmbeddings", [])

        if not saved_embeddings:
            logging.warning("⚠️ Ni shranjenih embeddingov za uporabnika")
            return jsonify({"error": "Ni shranjenih značilk"}), 404

        logging.debug(f"📦 Pridobljenih {len(saved_embeddings)} shranjenih embeddingov")

        avg_embedding = np.mean(np.array(saved_embeddings), axis=0)
        sim = cosine_similarity(test_embedding, avg_embedding)

        logging.info(f"▶️ Cosine similarity: {sim:.4f}")
        success = bool(sim > 0.8)
        if success:
            two_fa_status[email] = True  # ✅ Označi uporabnika kot uspešno preverjenega
            
        return jsonify({
            "success": success,
            "similarity": float(sim),
            "message": "Obraz ustreza" if success else "Obraz se ne ujema"
        })

    except Exception as e:
        logging.exception("❌ Nepričakovana napaka pri preverjanju")
        return jsonify({ "error": str(e) }), 500

@app.route("/auth/check-2fa", methods=["GET"])
def check_2fa_status():
    email = request.args.get("email")
    if not email:
        return jsonify({ "error": "Email ni podan." }), 400

    is_verified = two_fa_status.get(email, False)
    return jsonify({ "is2faVerified": is_verified })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

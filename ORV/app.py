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
import json
from datetime import datetime
import subprocess
import time
import uuid

MODEL_PATH = "resnet50_face_trained.pt"
MODEL_URL = "https://drive.google.com/uc?export=download&id=1ylu7N69oA5N5QhxsilIgtsCS6CUgjtK9"

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
        resnet_model = models.resnet50(weights=None)
        resnet_model.fc = torch.nn.Identity()
        resnet_model.load_state_dict(loaded)
        print("✅ Naložen state_dict model.")
    else:
        resnet_model = loaded
        print("ℹ️ Naložen celoten model.")
    resnet_model.eval()
except Exception as e:
    print("❌ Napaka pri nalaganju modela:", e)
    raise

# === Transformacije ===
resnet_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5]*3, std=[0.5]*3)
])

def preprocess_image(image_pil):
    return image_pil.resize((400, 400))

def detect_face(image_pil):
    try:
        image_np = np.array(image_pil.convert("RGB"))
        gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=3, minSize=(30, 30))
        if len(faces) == 0:
            raise ValueError("Obraz ni bil zaznan.")
        x, y, w, h = sorted(faces, key=lambda f: f[2]*f[3], reverse=True)[0]
        face_region = image_np[y:y+h, x:x+w]
        face_resized = cv2.resize(face_region, (224, 224))
        return Image.fromarray(face_resized)
    except Exception as e:
        logging.warning("Napaka pri zaznavi obraza: %s", str(e))
        raise

def extract_resnet_embedding(image_pil):
    face_img = detect_face(image_pil)
    input_tensor = resnet_transform(face_img).unsqueeze(0)
    with torch.no_grad():
        embedding = resnet_model(input_tensor).squeeze().numpy()
    return embedding.tolist()

@app.route("/", methods=["GET"])
def index():
    return "<h1>Face Embedding API teče (ResNet-50 naučen model)</h1>"

@app.route("/api/auth/verify", methods=["GET", "POST"])
def verify_face():
    if request.method == "GET":
        return "<h3>✅ Endpoint deluje. Pošlji POST z email + image.</h3>"

    if "image" not in request.files or "email" not in request.form:
        return jsonify({"error": "Manjka email ali slika"}), 400

    email = request.form["email"]
    file = request.files["image"]

    try:
        img = Image.open(file.stream).convert("RGB")
        preprocessed = preprocess_image(img)
        test_embedding = extract_resnet_embedding(preprocessed)

        # Pridobivanje embeddingov iz produkcije
        response = requests.get(f"https://prehranko-production.up.railway.app/api/auth/embeddings?email={email}")
        if response.status_code != 200:
            return jsonify({"error": "Napaka pri pridobivanju značilk iz baze"}), 500

        data = response.json()
        saved_embeddings = data.get("faceEmbeddings", [])

        if not saved_embeddings:
            logging.warning("⚠️ Ni shranjenih embeddingov, uporabljam demo podatke.")
            saved_embeddings = [test_embedding]

        # MPI Del
        unique_id = str(uuid.uuid4())
        input_filename = f"mpi_input_{unique_id}.json"
        result_filename = f"mpi_result_{unique_id}.json"

        mpi_payload = {
            "test_embedding": test_embedding,
            "saved_embeddings": saved_embeddings,
            "result_file": result_filename
        }

        with open(input_filename, "w") as f:
            json.dump(mpi_payload, f)

        # IZVRŠITEV MPI (Zamik popravljen tukaj)
        process = subprocess.run(
            ["mpiexec", "--allow-run-as-root", "-n", "4", "python", "mpi_verify.py", input_filename],
            capture_output=True,
            text=True,
            check=True
        )

        # Izpis MPI logov v Railway konzolo
        if process.stdout:
            print(process.stdout, flush=True)

        time.sleep(0.3)

        if os.path.exists(result_filename):
            with open(result_filename) as f:
                mpi_result = json.load(f)

            os.remove(input_filename)
            os.remove(result_filename)

            return jsonify({
                "success": mpi_result["success"],
                "similarity": float(mpi_result["avg_similarity"]),
                "message": "Obraz ustreza" if mpi_result["success"] else "Obraz se ne ujema"
            })
        else:
            raise FileNotFoundError("MPI ni ustvaril datoteke z rezultati.")

    except Exception as e:
        logging.exception("❌ Napaka pri preverjanju")
        return jsonify({ "error": str(e) }), 500

if __name__ == "__main__":
    # Railway uporablja PORT okoljsko spremenljivko
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
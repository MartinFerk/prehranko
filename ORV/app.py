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
    format="%(asctime)s [%(levelname)s] %(message)s"
)

app = Flask(__name__)

# === OpenCV Haar Cascade ===
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

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


# === Transformacije za vhodne slike ===
resnet_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5] * 3, std=[0.5] * 3)
])


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

        x, y, w, h = sorted(
            faces,
            key=lambda f: f[2] * f[3],
            reverse=True
        )[0]

        face_region = image_np[y:y + h, x:x + w]
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
            return jsonify({
                "error": "Ni bilo mogoče pridobiti značilk iz nobene slike"
            }), 400

        return jsonify({
            "embeddings": embeddings,
            "count": len(embeddings)
        })

    except Exception as e:
        return jsonify({
            "error": "Napaka pri obdelavi slik",
            "details": str(e)
        }), 500


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

        try:
            test_embedding = extract_resnet_embedding(preprocessed)
        except Exception:
            return jsonify({"error": "Obraz ni bil zaznan"}), 400

        response = requests.get(
            f"https://prehranko-production.up.railway.app/api/auth/embeddings?email={email}"
        )

        if response.status_code != 200:
            return jsonify({"error": "Napaka pri pridobivanju značilk"}), 500

        data = response.json()
        saved_embeddings = data.get("faceEmbeddings", [])

        if not saved_embeddings:
            saved_embeddings = [
                test_embedding,
                (np.array(test_embedding) +
                 np.random.normal(0, 0.01, len(test_embedding))).tolist()
            ]

        unique_id = str(uuid.uuid4())
        input_filename = f"mpi_input_{unique_id}.json"
        result_filename = f"mpi_result_{unique_id}.json"

        mpi_payload = {
            "test_embedding": test_embedding,
            "saved_embeddings": saved_embeddings,
            "email": email,
            "timestamp": datetime.now().isoformat(),
            "result_file": result_filename
        }

        with open(input_filename, "w") as f:
            json.dump(mpi_payload, f)

        logging.info(f"📁 Podatki shranjeni v {input_filename}")

        try:
            process = subprocess.run(
                ["mpiexec", "--allow-run-as-root", "-n", "4", "python", "mpi_verify.py", input_filename],
                capture_output=True,
                text=True,
                check=True
            )

            if process.stdout:
                print(process.stdout, flush=True)
            if process.stderr:
                print(f"MPI stderr: {process.stderr}", flush=True)

        except FileNotFoundError as e:
            logging.error("❌ mpiexec ni na voljo v okolju")
            return jsonify({
                "success": False,
                "error": "MPI ni podprt na strežniku"
            }), 501

        except subprocess.CalledProcessError as e:
            logging.error("❌ MPI proces se je sesul")
            logging.error(e.stderr)
            return jsonify({
                "success": False,
                "error": "Napaka pri MPI obdelavi"
            }), 500


        if process.stdout:
            print(process.stdout, flush=True)
        if process.stderr:
            print(f"MPI Error Log: {process.stderr}", flush=True)

        time.sleep(0.3)

        if not os.path.exists(result_filename):
            raise FileNotFoundError("MPI rezultat ni bil ustvarjen")

        with open(result_filename) as f:
            mpi_result = json.load(f)

        try:
            os.remove(input_filename)
            os.remove(result_filename)
        except Exception:
            pass

        return jsonify({
            "success": mpi_result["success"],
            "similarity": float(mpi_result["avg_similarity"]),
            "message": "Obraz ustreza"
            if mpi_result["success"]
            else "Obraz se ne ujema"
        })

    except Exception as e:
        logging.exception("❌ Nepričakovana napaka")
        return jsonify({"error": str(e)}), 500

@app.route("/check-mpi")
def check_mpi():
    import shutil
    path = shutil.which("mpiexec")
    if path:
        return f"✅ MPI je nameščen na: {path}"
    else:
        return "❌ MPI NI NAJDEN. Preveri Dockerfile in Nixpacks nastavitve."

if __name__ == "__main__":
    # Railway poda port preko okoljske spremenljivke PORT
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

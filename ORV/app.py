from flask import Flask, request, jsonify
from PIL import Image, ImageFilter
import numpy as np
import io


app = Flask(__name__)

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

def preprocess_image(image_pil):
    return image_pil.resize((400, 400))

def detect_face(image_pil):
    image_np = np.array(image_pil.convert("RGB"))
    gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

    if len(faces) == 0:
        raise ValueError("Obraz ni bil zaznan.")

    x, y, w, h = faces[0]
    face_region = image_np[y:y+h, x:x+w]
    face_resized = cv2.resize(face_region, (64, 64))
    return face_resized

def extract_basic_features(face_img):
    gray = cv2.cvtColor(face_img, cv2.COLOR_RGB2GRAY)
    gray = cv2.GaussianBlur(gray, (3, 3), 0)

    # Histogram sivinskih vrednosti
    hist = cv2.calcHist([gray], [0], None, [16], [0, 256])
    hist = cv2.normalize(hist, hist).flatten()

    # Sobel robne značilke
    sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    edge_mag = np.sqrt(sobelx**2 + sobely**2)
    edge_features = np.mean(edge_mag), np.std(edge_mag)

    # HOG značilke
    hog = cv2.HOGDescriptor(_winSize=(64, 64),
                            _blockSize=(16, 16),
                            _blockStride=(8, 8),
                            _cellSize=(8, 8),
                            _nbins=9)
    hog_features = hog.compute(gray).flatten()
    hog_features = hog_features[:64]  # zmanjšaj na osnovne

    # LBP značilke
    lbp = local_binary_pattern(gray)
    lbp_hist = cv2.calcHist([lbp.astype(np.uint8)], [0], None, [16], [0, 256])
    lbp_hist = cv2.normalize(lbp_hist, lbp_hist).flatten()

    # Združi vse
    features = np.concatenate([hist, edge_features, hog_features, lbp_hist], axis=0)
    return features.tolist()

def local_binary_pattern(gray_img):
    lbp = np.zeros_like(gray_img)
    for y in range(1, gray_img.shape[0] - 1):
        for x in range(1, gray_img.shape[1] - 1):
            center = gray_img[y, x]
            binary = 0
            binary |= (gray_img[y-1, x-1] > center) << 7
            binary |= (gray_img[y-1, x] > center) << 6
            binary |= (gray_img[y-1, x+1] > center) << 5
            binary |= (gray_img[y, x+1] > center) << 4
            binary |= (gray_img[y+1, x+1] > center) << 3
            binary |= (gray_img[y+1, x] > center) << 2
            binary |= (gray_img[y+1, x-1] > center) << 1
            binary |= (gray_img[y, x-1] > center) << 0
            lbp[y, x] = binary
    return lbp

def extract_face_embedding(image_pil):
    face = detect_face(image_pil)
    features = extract_basic_features(face)
    return features


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

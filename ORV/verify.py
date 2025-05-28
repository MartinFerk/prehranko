from pymongo import MongoClient
from PIL import Image
import numpy as np
import os
from dotenv import load_dotenv
from features import lbp_descriptor, cosine_similarity
from face_utils import detect_skin_hsv, find_face_box

load_dotenv()
client = MongoClient(os.getenv("MONGO_URI"))
users = client["face_auth"]["users"]

def extract_face_features(image_pil):
    mask = detect_skin_hsv(image_pil)
    box = find_face_box(mask)
    if not box:
        raise Exception("Ni bilo mogoče zaznati obraza.")
    x, y, w, h = box
    gray = image_pil.convert("L").crop((x, y, x+w, y+h)).resize((100, 100))
    return lbp_descriptor(np.array(gray))

def verify_user(email, image_path):
    user = users.find_one({"email": email})
    if not user:
        print("⚠️ Uporabnik ni registriran.")
        return

    img = Image.open(image_path).convert("RGB")
    feat = extract_face_features(img)
    similarities = [cosine_similarity(feat, np.array(f)) for f in user["features"]]
    best = max(similarities)

    print(f"🔎 Največja podobnost: {round(best, 3)}")
    if best > 0.85:
        print("✅ Avtentikacija uspešna.")
    else:
        print("❌ Avtentikacija neuspešna.")

# primer uporabe
if __name__ == "__main__":
    verify_user("user@example.com", "login_attempt.jpg")

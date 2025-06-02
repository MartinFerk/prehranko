from pymongo import MongoClient
from PIL import Image
import numpy as np
import os
from dotenv import load_dotenv
from features import lbp_descriptor
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

def register_user(email, image_paths):
    features = []
    for path in image_paths:
        img = Image.open(path).convert("RGB")
        feat = extract_face_features(img)
        features.append(feat.tolist())
    users.replace_one({"email": email}, {"email": email, "features": features}, upsert=True)
    print(f"✅ Uporabnik '{email}' registriran z {len(features)} slikami.")

# primer uporabe
if __name__ == "__main__":
    register_user("user@example.com", [
        "face1.jpg", "face2.jpg", "face3.jpg", "face4.jpg", "face5.jpg"
    ])

import numpy as np
import cv2

def detect_skin_hsv(image_pil):
    img_hsv = np.array(image_pil.convert("HSV"))
    h, s, v = img_hsv[:, :, 0], img_hsv[:, :, 1], img_hsv[:, :, 2]
    mask = (h > 0) & (h < 50) & (s > 40) & (s < 200) & (v > 80) & (v < 255)
    return mask.astype(np.uint8) * 255

def find_face_box(mask):
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for cnt in sorted(contours, key=cv2.contourArea, reverse=True):
        x, y, w, h = cv2.boundingRect(cnt)
        ratio = w / float(h)
        if 0.7 < ratio < 1.3 and w * h > 5000:
            return (x, y, w, h)
    return None

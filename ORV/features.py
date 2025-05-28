import numpy as np

def lbp_descriptor(gray_img):
    h, w = gray_img.shape
    descriptor = []
    for y in range(1, h-1):
        for x in range(1, w-1):
            center = gray_img[y, x]
            binary = ''
            for dy, dx in [(-1,-1), (-1,0), (-1,1), (0,1), (1,1), (1,0), (1,-1), (0,-1)]:
                binary += '1' if gray_img[y+dy, x+dx] >= center else '0'
            descriptor.append(int(binary, 2))
    hist = np.histogram(descriptor, bins=256, range=(0, 255))[0]
    return hist / np.sum(hist)

def cosine_similarity(a, b):
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

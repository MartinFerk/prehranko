import os
import random
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import models, transforms, datasets
from torch.utils.data import DataLoader, Dataset
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np

# === Parametri ===
data_dir = "dataset"
embedding_dim = 2048
batch_size = 8
num_epochs = 15
learning_rate = 0.0001
model_path = "resnet50_face_trained.pt"
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# === Transformacije ===
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.5]*3, [0.5]*3)
])

def flip_horizontal(img_np):
    return np.fliplr(img_np)

def adjust_brightness(img_np, factor=1.2):
    img_np = img_np.astype(np.float32) * factor
    return np.clip(img_np, 0, 255).astype(np.uint8)

def adjust_contrast(img_np, factor=1.5):
    mean = np.mean(img_np, axis=(0, 1), keepdims=True)
    img_np = (img_np - mean) * factor + mean
    return np.clip(img_np, 0, 255).astype(np.uint8)

def add_noise(img_np, std=10):
    noise = np.random.normal(0, std, img_np.shape)
    noisy = img_np.astype(np.float32) + noise
    return np.clip(noisy, 0, 255).astype(np.uint8)

def custom_augment(img):
    img_np = np.array(img)

    if random.random() > 0.5:
        img_np = flip_horizontal(img_np)
    if random.random() > 0.5:
        img_np = adjust_brightness(img_np, factor=random.uniform(0.9, 1.1))
    if random.random() > 0.5:
        img_np = adjust_contrast(img_np, factor=random.uniform(0.9, 1.1))
    if random.random() > 0.5:
        img_np = add_noise(img_np, std=random.randint(1, 5))

    return Image.fromarray(img_np.astype(np.uint8))


# === Custom Triplet Dataset ===
class TripletFaceDataset(Dataset):
    def __init__(self, root_dir, transform):
        self.dataset = datasets.ImageFolder(root=root_dir)
        self.classes = self.dataset.classes
        self.class_to_indices = self._build_index()
        self.transform = transform

    def _build_index(self):
        index = {cls: [] for cls in self.classes}
        for idx, (_, label) in enumerate(self.dataset.imgs):
            cls = self.dataset.classes[label]
            index[cls].append(idx)
        return index

    def __getitem__(self, index):
        anchor_path, anchor_label = self.dataset.imgs[index]
        anchor_class = self.dataset.classes[anchor_label]
        anchor_img = custom_augment(Image.open(anchor_path).convert("RGB"))
        anchor_img = self.transform(anchor_img)

        pos_idx = index
        while pos_idx == index:
            pos_idx = random.choice(self.class_to_indices[anchor_class])
        pos_path, _ = self.dataset.imgs[pos_idx]
        positive_img = custom_augment(Image.open(pos_path).convert("RGB"))
        positive_img = self.transform(positive_img)

        neg_class = anchor_class
        while neg_class == anchor_class:
            neg_class = random.choice(self.classes)
        neg_idx = random.choice(self.class_to_indices[neg_class])
        neg_path, _ = self.dataset.imgs[neg_idx]
        negative_img = custom_augment(Image.open(neg_path).convert("RGB"))
        negative_img = self.transform(negative_img)

        return anchor_img, positive_img, negative_img

    def __len__(self):
        return len(self.dataset)

# === Triplet Loss ===
class TripletLoss(nn.Module):
    def __init__(self, margin=1.0):
        super().__init__()
        self.loss_fn = nn.TripletMarginLoss(margin=margin, p=2)

    def forward(self, anchor, positive, negative):
        return self.loss_fn(anchor, positive, negative)

# === Model ===
resnet = models.resnet50(weights=None)
resnet.fc = nn.Identity()
model = resnet.to(device)

# === Dataset & Dataloader ===
triplet_dataset = TripletFaceDataset(data_dir, transform)
triplet_loader = DataLoader(triplet_dataset, batch_size=batch_size, shuffle=True)

# === Trening ===
criterion = TripletLoss(margin=0.8)
optimizer = optim.Adam(model.parameters(), lr=learning_rate)

print("\U0001F4DA Začenjam treniranje Triplet modela...\n")

for epoch in range(num_epochs):
    model.train()
    total_loss = 0

    for anchor, positive, negative in triplet_loader:
        anchor, positive, negative = anchor.to(device), positive.to(device), negative.to(device)

        emb_anchor = model(anchor)
        emb_positive = model(positive)
        emb_negative = model(negative)

        loss = criterion(emb_anchor, emb_positive, emb_negative)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        total_loss += loss.item()

    avg_loss = total_loss / len(triplet_loader)
    print(f"Epoch {epoch+1}/{num_epochs} - Loss: {avg_loss:.4f}")

model.eval()
# === Shrani model ===
torch.save(model.state_dict(), model_path)
print(f"\n✅ Triplet model shranjen v {model_path}")
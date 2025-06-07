import os
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import models, transforms, datasets
from torch.utils.data import DataLoader

# === Parametri ===
data_dir = "dataset"  # mapa s podmapami za vsakega uporabnika
num_epochs = 7
batch_size = 16
learning_rate = 0.001
model_path = "resnet50_face_trained.pt"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# === Transformacije slik ===
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5])
])

# === Dataset in Dataloader ===
dataset = datasets.ImageFolder(root=data_dir, transform=transform)
class_names = dataset.classes
num_classes = len(class_names)
dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

# === Model ===
model = models.resnet50(pretrained=False)
model.fc = nn.Linear(model.fc.in_features, num_classes)
model = model.to(device)

# === Izguba in optimizacija ===
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=learning_rate)

# === Trening zanke ===
for epoch in range(num_epochs):
    model.train()
    running_loss = 0.0

    for inputs, labels in dataloader:
        inputs, labels = inputs.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * inputs.size(0)

    epoch_loss = running_loss / len(dataset)
    print(f"Epoch {epoch+1}/{num_epochs} - Loss: {epoch_loss:.4f}")

# === Shrani model ===
torch.save(model.state_dict(), model_path)
print(f"✅ Model shranjen kot {model_path}")

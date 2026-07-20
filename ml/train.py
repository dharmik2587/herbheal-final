"""
Train a plant-species image classifier via transfer learning.

Expected data layout (standard torchvision ImageFolder):

    ml/data/
      train/
        Azadirachta_indica/   photo1.jpg  photo2.jpg  ...
        Curcuma_longa/        photo1.jpg  photo2.jpg  ...
        ...
      val/
        Azadirachta_indica/   photo1.jpg  ...
        Curcuma_longa/        photo1.jpg  ...
        ...

IMPORTANT — read this before you run this and expect a number back:
100 total photos is not "100 per species". If you have ~15-16 species
(matching the herbs already in your Prisma DB) and 100 photos total, that's
roughly 6 photos per class — nowhere near enough to train OR to validate a
>90% accuracy claim; a model can look like it hit 90%+ on a 2-3 image val
split by pure chance. Realistic minimums:
  - 30-50 photos/class absolute floor, with heavy augmentation
  - 100-150+ photos/class to get a trustworthy >90% on real held-out data
  - Photos should vary: different lighting, backgrounds, growth stages,
    phone cameras — not 100 near-duplicate crops of one leaf on one desk
Until you have that volume, treat IDENTIFY_STRATEGY=custom-first (not
custom-only) as the safe setting — Plant.id remains the fallback whenever
your model's confidence is low. See evaluate.py for how to actually measure
accuracy instead of assuming it.

Usage:
    python train.py --epochs 15 --data-dir data --out checkpoints/best.pt
"""
import argparse
import json
import time
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms


def build_transforms():
    # ImageNet normalization stats — required because we're fine-tuning a
    # network pretrained on ImageNet.
    normalize = transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])

    train_tf = transforms.Compose([
        transforms.RandomResizedCrop(224, scale=(0.7, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.ToTensor(),
        normalize,
    ])
    val_tf = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        normalize,
    ])
    return train_tf, val_tf


def build_model(num_classes: int, freeze_backbone: bool = True) -> nn.Module:
    # MobileNetV3-Small: small enough to fine-tune fast on CPU if needed,
    # and cheap enough to serve on a low-cost Cloud Run instance.
    model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.IMAGENET1K_V1)

    if freeze_backbone:
        for param in model.features.parameters():
            param.requires_grad = False

    in_features = model.classifier[-1].in_features
    model.classifier[-1] = nn.Linear(in_features, num_classes)
    return model


def train_one_epoch(model, loader, optimizer, criterion, device):
    model.train()
    running_loss, correct, total = 0.0, 0, 0
    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * images.size(0)
        correct += (outputs.argmax(1) == labels).sum().item()
        total += labels.size(0)
    return running_loss / total, correct / total


@torch.no_grad()
def evaluate(model, loader, criterion, device):
    model.eval()
    running_loss, correct, total = 0.0, 0, 0
    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        outputs = model(images)
        loss = criterion(outputs, labels)
        running_loss += loss.item() * images.size(0)
        correct += (outputs.argmax(1) == labels).sum().item()
        total += labels.size(0)
    return running_loss / total, correct / total


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", default="data")
    parser.add_argument("--epochs", type=int, default=15)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--out", default="checkpoints/best.pt")
    parser.add_argument("--unfreeze-at-epoch", type=int, default=8,
                         help="unfreeze backbone for fine-tuning after this many epochs")
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    train_tf, val_tf = build_transforms()
    train_dir = Path(args.data_dir) / "train"
    val_dir = Path(args.data_dir) / "val"

    if not train_dir.exists() or not val_dir.exists():
        raise FileNotFoundError(
            f"Expected {train_dir} and {val_dir} to exist. "
            "See the module docstring for the required folder layout."
        )

    train_ds = datasets.ImageFolder(train_dir, transform=train_tf)
    val_ds = datasets.ImageFolder(val_dir, transform=val_tf)

    if train_ds.classes != val_ds.classes:
        raise ValueError("train/ and val/ must contain the exact same class folders")

    per_class_counts = {c: 0 for c in train_ds.classes}
    for _, label in train_ds.samples:
        per_class_counts[train_ds.classes[label]] += 1
    thin_classes = {c: n for c, n in per_class_counts.items() if n < 20}
    if thin_classes:
        print(
            "⚠️  These classes have fewer than 20 training images — expect "
            f"unreliable predictions for them: {thin_classes}"
        )

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, num_workers=2)

    model = build_model(num_classes=len(train_ds.classes)).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(
        [p for p in model.parameters() if p.requires_grad], lr=args.lr
    )

    best_val_acc = 0.0
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)

    for epoch in range(1, args.epochs + 1):
        if epoch == args.unfreeze_at_epoch:
            print("Unfreezing backbone for full fine-tuning at lower LR")
            for param in model.features.parameters():
                param.requires_grad = True
            optimizer = torch.optim.Adam(model.parameters(), lr=args.lr / 10)

        start = time.time()
        train_loss, train_acc = train_one_epoch(model, train_loader, optimizer, criterion, device)
        val_loss, val_acc = evaluate(model, val_loader, criterion, device)
        elapsed = time.time() - start

        print(
            f"Epoch {epoch:02d}/{args.epochs} | "
            f"train_loss={train_loss:.4f} train_acc={train_acc:.4f} | "
            f"val_loss={val_loss:.4f} val_acc={val_acc:.4f} | {elapsed:.1f}s"
        )

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save({
                "model_state": model.state_dict(),
                "classes": train_ds.classes,
                "val_acc": val_acc,
            }, args.out)
            print(f"  ✅ New best (val_acc={val_acc:.4f}) saved to {args.out}")

    print(f"\nTraining complete. Best val_acc={best_val_acc:.4f}")
    print(
        "This val_acc is only as trustworthy as your val set is large and "
        "representative — see evaluate.py for a proper held-out test-set "
        "report (per-class precision/recall/confusion matrix) before you "
        "trust this number for a >90% claim."
    )

    # Save class list separately too, for convenience when loading in serve.py
    with open(Path(args.out).parent / "classes.json", "w") as f:
        json.dump(train_ds.classes, f, indent=2)


if __name__ == "__main__":
    main()

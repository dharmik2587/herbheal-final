"""
Evaluate a trained checkpoint on a held-out test set — separate from both
train/ and val/ used during training — and print the numbers you'd actually
want before claiming ">90% accuracy" anywhere.

Expected layout:
    ml/data/test/<ClassName>/*.jpg   (same class names as training)

Usage:
    python evaluate.py --checkpoint checkpoints/best.pt --data-dir data
"""
import argparse

import torch
from sklearn.metrics import classification_report, confusion_matrix
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

from train import build_model


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint", default="checkpoints/best.pt")
    parser.add_argument("--data-dir", default="data")
    parser.add_argument("--batch-size", type=int, default=16)
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    ckpt = torch.load(args.checkpoint, map_location=device)
    classes = ckpt["classes"]

    tf = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    test_ds = datasets.ImageFolder(f"{args.data_dir}/test", transform=tf)
    if test_ds.classes != classes:
        raise ValueError(
            f"Test set classes {test_ds.classes} don't match training classes {classes}. "
            "Make sure ml/data/test/ has one folder per class, matching train/ exactly."
        )

    if len(test_ds) < len(classes) * 5:
        print(
            f"⚠️  Only {len(test_ds)} test images across {len(classes)} classes "
            f"(~{len(test_ds)/len(classes):.1f}/class). Any accuracy number from a "
            "test set this small has a wide error margin — treat it as a rough "
            "signal, not a certified figure."
        )

    loader = DataLoader(test_ds, batch_size=args.batch_size, shuffle=False)

    model = build_model(num_classes=len(classes))
    model.load_state_dict(ckpt["model_state"])
    model.to(device).eval()

    all_preds, all_labels = [], []
    with torch.no_grad():
        for images, labels in loader:
            images = images.to(device)
            outputs = model(images)
            preds = outputs.argmax(1).cpu()
            all_preds.extend(preds.tolist())
            all_labels.extend(labels.tolist())

    print("\n=== Classification report (per-class precision/recall/F1) ===")
    print(classification_report(all_labels, all_preds, target_names=classes, zero_division=0))

    print("=== Confusion matrix (rows=true, cols=predicted) ===")
    cm = confusion_matrix(all_labels, all_preds)
    header = "        " + " ".join(f"{c[:6]:>6}" for c in classes)
    print(header)
    for i, row in enumerate(cm):
        print(f"{classes[i][:6]:>6}  " + " ".join(f"{v:>6}" for v in row))

    overall_acc = sum(p == l for p, l in zip(all_preds, all_labels)) / len(all_labels)
    print(f"\nOverall test accuracy: {overall_acc:.4f} on {len(all_labels)} held-out images")
    print(
        "Use THIS number (not train_acc or val_acc from training logs) as the "
        "accuracy figure you report externally."
    )


if __name__ == "__main__":
    main()

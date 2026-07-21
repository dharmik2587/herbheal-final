#!/usr/bin/env python3
"""
infer.py - Fast plant species identification from a photo using a Hugging Face model.

Usage:
    python infer.py path/to/plant.jpg
    python infer.py path/to/plant.jpg --model <hf_model_id> --topk 3

Designed for low latency (<5s on CPU for a single image, faster on GPU) by:
  - Using a lightweight pre-trained image-classification model (MobileNet-based by default)
  - Loading the model once and running a single forward pass
  - Using fp16 on GPU if available
"""

import argparse
import sys
import time

from PIL import Image


DEFAULT_MODEL = "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification"


def load_pipeline(model_id: str):
    import torch
    from transformers import pipeline

    device = 0 if torch.cuda.is_available() else -1
    dtype = torch.float16 if torch.cuda.is_available() else torch.float32

    clf = pipeline(
        task="image-classification",
        model=model_id,
        device=device,
        torch_dtype=dtype,
    )
    return clf


def identify(image_path: str, model_id: str = DEFAULT_MODEL, top_k: int = 3):
    start = time.time()

    image = Image.open(image_path).convert("RGB")

    clf = load_pipeline(model_id)
    results = clf(image, top_k=top_k)

    elapsed = time.time() - start
    return results, elapsed


def main():
    parser = argparse.ArgumentParser(description="Identify a plant from a photo using Hugging Face models.")
    parser.add_argument("image", help="Path to the plant image file")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Hugging Face model id to use")
    parser.add_argument("--topk", type=int, default=3, help="Number of top predictions to return")
    args = parser.parse_args()

    try:
        results, elapsed = identify(args.image, args.model, args.topk)
    except Exception as e:
        print(f"Error during inference: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"Inference time: {elapsed:.2f}s")
    print("Predictions:")
    for r in results:
        label = r.get("label", "unknown")
        score = r.get("score", 0.0)
        print(f"  - {label}: {score * 100:.2f}%")


if __name__ == "__main__":
    main()
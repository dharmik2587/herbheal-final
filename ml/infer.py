"""Loads a trained checkpoint and predicts species for a single image."""
import base64
import io

import torch
import torch.nn.functional as F
from PIL import Image
from torchvision import transforms

from train import build_model

_TRANSFORM = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


class PlantClassifier:
    def __init__(self, checkpoint_path: str, device: str | None = None):
        self.device = torch.device(device or ("cuda" if torch.cuda.is_available() else "cpu"))
        ckpt = torch.load(checkpoint_path, map_location=self.device)
        self.classes = ckpt["classes"]
        self.model = build_model(num_classes=len(self.classes))
        self.model.load_state_dict(ckpt["model_state"])
        self.model.to(self.device).eval()

    @torch.no_grad()
    def predict(self, image_base64: str, top_k: int = 3):
        image_bytes = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        tensor = _TRANSFORM(image).unsqueeze(0).to(self.device)

        logits = self.model(tensor)
        probs = F.softmax(logits, dim=1)[0]
        top_probs, top_idxs = probs.topk(min(top_k, len(self.classes)))

        return [
            {
                # class folder names are expected to be scientific names with
                # underscores, e.g. "Azadirachta_indica" -> "Azadirachta indica"
                "scientific": self.classes[idx].replace("_", " "),
                "label": self.classes[idx].replace("_", " "),
                "confidence": float(prob),
            }
            for prob, idx in zip(top_probs.tolist(), top_idxs.tolist())
        ]

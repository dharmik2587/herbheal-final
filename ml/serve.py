"""
Serves the trained model behind the exact contract lib/custom-model.ts
(Next.js) expects: POST /predict {"image_base64": "..."} ->
{"predictions": [{"label", "scientific", "confidence"}, ...]}

Run locally:
    uvicorn serve:app --reload --port 8001

Then set CUSTOM_MODEL_URL=http://localhost:8001 in your Next.js .env and
IDENTIFY_STRATEGY=custom-first to try it before falling back to Plant.id.

Deploy (e.g. Cloud Run):
    docker build -t herbheal-ml .
    docker push <your-registry>/herbheal-ml
    gcloud run deploy herbheal-ml --image <your-registry>/herbheal-ml --port 8001
Then point CUSTOM_MODEL_URL at the Cloud Run URL.
"""
import os

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from infer import PlantClassifier

app = FastAPI(title="HerbHeal Custom Plant Model")

CHECKPOINT_PATH = os.environ.get("MODEL_CHECKPOINT", "checkpoints/best.pt")
_classifier: PlantClassifier | None = None


def get_classifier() -> PlantClassifier:
    global _classifier
    if _classifier is None:
        if not os.path.exists(CHECKPOINT_PATH):
            raise HTTPException(
                status_code=503,
                detail=f"No checkpoint at {CHECKPOINT_PATH} — run train.py first.",
            )
        _classifier = PlantClassifier(CHECKPOINT_PATH)
    return _classifier


class PredictRequest(BaseModel):
    image_base64: str


@app.get("/health")
def health():
    return {"ok": True, "checkpoint": CHECKPOINT_PATH, "loaded": _classifier is not None}


@app.post("/predict")
def predict(req: PredictRequest):
    classifier = get_classifier()
    try:
        predictions = classifier.predict(req.image_base64)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not process image: {e}")
    return {"predictions": predictions}

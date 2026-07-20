# HerbHeal custom plant-ID model — swappable upgrade path

This is the "train your own model" side of plant identification, meant to
sit alongside (not replace) Plant.id — see `lib/plant-id.ts`'s
`identifyPlantWithStrategy()` in the main app, controlled by the
`IDENTIFY_STRATEGY` env var.

## Read this before training

**100 photos is not enough data to reliably hit >90% accuracy**, and it's
important to be upfront about why, rather than let a demo number stand in
for a real one:

- If "100 plant photos" means 100 total across ~16 species (the herbs
  already in your Prisma DB), that's ~6 photos/class. A model trained on
  that will overfit hard, and any ">90%" you see on a 1-2 image validation
  split is not a statistically meaningful number.
- If it means 100 photos *per* species, that's a workable starting point
  with transfer learning + augmentation, but validate on a genuinely
  held-out test set before trusting the number (see below) — and even then,
  expect real-world accuracy to be lower than lab accuracy, because phone
  photos "in the wild" (different lighting, angles, backgrounds, growth
  stages) are harder than a clean training set.
- Real production plant-ID (Plant.id, PlantNet, iNaturalist's model) is
  trained on tens of thousands to millions of images per species. That's
  the honest reason `IDENTIFY_STRATEGY=api` should stay your default — this
  pipeline is a legitimate upgrade path, not a drop-in replacement, until
  you've actually gathered and validated enough data.

## What's here

- `train.py` — transfer learning on MobileNetV3-Small (ImageNet-pretrained),
  with augmentation and a two-phase freeze/unfreeze schedule.
- `evaluate.py` — the script that gives you a real accuracy number: per-class
  precision/recall/F1 and a confusion matrix on a **held-out test set** you
  never trained or validated on.
- `infer.py` — loads a checkpoint, predicts top-k species for one image.
- `serve.py` — FastAPI server exposing `POST /predict` in exactly the shape
  `lib/custom-model.ts` expects, so wiring it in is just setting
  `CUSTOM_MODEL_URL`.
- `Dockerfile` — for deploying `serve.py` to Cloud Run (or any container host).

## Data layout

```
ml/data/
  train/
    Azadirachta_indica/   photo1.jpg  photo2.jpg  ...
    Curcuma_longa/        photo1.jpg  ...
  val/
    Azadirachta_indica/   photo1.jpg  ...
    Curcuma_longa/        photo1.jpg  ...
  test/                   ← held out, never seen until evaluate.py
    Azadirachta_indica/   photo1.jpg  ...
    Curcuma_longa/        photo1.jpg  ...
```

Folder names become the class labels — use the same underscored scientific
names as `Herb.scientificName` in the Prisma schema (spaces become
underscores; `infer.py` converts them back before returning a prediction),
so predictions map straight onto your existing herb records via
`mapToLocalHerb()`.

A rough split for however many photos you do have: 70% train / 15% val / 15%
test, with test set aside first and never touched during training or
hyperparameter tuning.

## Running it

```bash
pip install -r requirements.txt --break-system-packages   # if in a managed env

# 1. Train
python train.py --epochs 15 --data-dir data --out checkpoints/best.pt

# 2. Get a REAL accuracy number (not the training log's val_acc)
python evaluate.py --checkpoint checkpoints/best.pt --data-dir data

# 3. Serve locally to test the /predict contract
uvicorn serve:app --reload --port 8001
curl -X POST http://localhost:8001/predict \
  -H "Content-Type: application/json" \
  -d '{"image_base64": "'"$(base64 -i some_test_photo.jpg)"'"}'
```

## Turning it on in the main app

```bash
# .env
CUSTOM_MODEL_URL="https://your-cloud-run-url"
IDENTIFY_STRATEGY="custom-first"   # NOT "custom-only" until evaluate.py backs it up
```

`custom-first` tries your model, and only trusts it above a confidence
threshold (0.4, see `MIN_CUSTOM_MODEL_CONFIDENCE` in `lib/plant-id.ts`) —
otherwise it falls back to Plant.id automatically. That threshold is a
starting point, not a validated cutoff; tune it against your own
`evaluate.py` results once you have them.

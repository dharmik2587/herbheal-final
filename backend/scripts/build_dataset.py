"""
Merge external plant data sources into the master data/plants.csv.

This is a template for expanding the bundled demo dataset with real
sources (Kaggle medicinal plant datasets, IUCN exports, ENVIS, etc).
It expects raw CSVs under backend/raw/ and writes the merged result to
backend/data/plants.csv.

Usage:
    python scripts/build_dataset.py

Expected raw files (place what you have; missing ones are skipped):
    raw/kaggle_plants.csv   — columns like 'Plant Name', 'Scientific Name', 'Uses'
    raw/iucn_plants.csv     — columns like 'scientificName', 'redlistCategory'
"""
import os

import pandas as pd

RAW_DIR = os.path.join(os.path.dirname(__file__), "..", "raw")
OUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "plants.csv")

STATUS_MAP = {
    "EN": "Endangered",
    "VU": "Vulnerable",
    "NT": "Near Threatened",
    "LC": "Safe",
    "DD": "Unknown",
    "CR": "Critically Endangered",
}


def load_if_exists(filename):
    path = os.path.join(RAW_DIR, filename)
    if os.path.exists(path):
        return pd.read_csv(path)
    print(f"⚠️  Skipping missing file: {path}")
    return None


def main():
    kaggle_df = load_if_exists("kaggle_plants.csv")
    iucn_df = load_if_exists("iucn_plants.csv")

    if kaggle_df is None:
        print("No base dataset found in raw/kaggle_plants.csv — nothing to build.")
        print("Keeping the existing data/plants.csv untouched.")
        return

    kaggle_df = kaggle_df.rename(columns={
        "Plant Name": "name",
        "Scientific Name": "scientific_name",
        "Family": "family",
        "Uses": "uses",
        "Conservation": "iucn_status",
    })

    merged = kaggle_df

    if iucn_df is not None:
        iucn_df = iucn_df.rename(columns={
            "scientificName": "scientific_name",
            "redlistCategory": "iucn_status",
        })
        iucn_df["iucn_status"] = iucn_df["iucn_status"].map(STATUS_MAP).fillna(iucn_df["iucn_status"])

        merged = pd.merge(
            kaggle_df, iucn_df[["scientific_name", "iucn_status"]],
            on="scientific_name", how="left", suffixes=("", "_iucn"),
        )
        merged["iucn_status"] = merged["iucn_status_iucn"].fillna(merged.get("iucn_status"))
        merged.drop(columns=[c for c in ["iucn_status_iucn"] if c in merged.columns], inplace=True)

    merged["iucn_status"] = merged.get("iucn_status", pd.Series(dtype=str)).fillna("Safe")
    merged["uses"] = merged["uses"].astype(str).str.lower().str.strip()
    merged["traditional_system"] = merged.get("traditional_system", "Ayurveda")
    merged["image_url"] = merged.get("image_url", "")
    merged["genus"] = merged["scientific_name"].astype(str).str.split().str[0]

    merged.drop_duplicates(subset=["scientific_name"], inplace=True)
    merged.insert(0, "plant_id", range(1, len(merged) + 1))

    required = ["plant_id", "name", "scientific_name", "family", "genus",
                "uses", "iucn_status", "region", "traditional_system", "image_url"]
    for col in required:
        if col not in merged.columns:
            merged[col] = ""
    merged = merged[required]

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    merged.to_csv(OUT_PATH, index=False)
    print(f"✅ Master CSV built: {len(merged)} plants -> {OUT_PATH}")


if __name__ == "__main__":
    main()

"""
SearchEngine: loads the master plants CSV once and serves TF-IDF based
similarity search over plant name + uses text.

Kept dependency-light (pandas + scikit-learn) and entirely in-memory so a
single CSV reload is cheap and the API stays fast for a few thousand rows.
"""
import logging
import threading

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)

REQUIRED_COLUMNS = [
    "plant_id", "name", "scientific_name", "family", "genus",
    "uses", "iucn_status", "region", "traditional_system", "image_url",
]

RISKY_STATUSES = {"Endangered", "Vulnerable", "Critically Endangered"}


class SearchEngine:
    def __init__(self, csv_path: str):
        self.csv_path = csv_path
        self.df = None
        self.vectorizer = None
        self.tfidf_matrix = None
        self._lock = threading.Lock()
        self._load()

    def _load(self):
        df = pd.read_csv(self.csv_path)

        missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
        if missing:
            raise ValueError(f"plants.csv is missing required columns: {missing}")

        df = df.fillna("")
        df["plant_id"] = df["plant_id"].astype(int)

        corpus = (df["name"] + " " + df["uses"]).str.lower()

        vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            stop_words="english",
            max_features=5000,
        )
        tfidf_matrix = vectorizer.fit_transform(corpus)

        with self._lock:
            self.df = df.reset_index(drop=True)
            self.vectorizer = vectorizer
            self.tfidf_matrix = tfidf_matrix

        logger.info("Loaded %d plants into TF-IDF engine", len(self.df))

    def reload(self):
        """Hot-reload the CSV from disk without restarting the process."""
        self._load()

    def _row_to_dict(self, row, score=None):
        result = row.to_dict()
        result["uses"] = [u.strip() for u in str(result["uses"]).split(",") if u.strip()]
        result["is_risky"] = result["iucn_status"] in RISKY_STATUSES
        if score is not None:
            result["similarity_score"] = round(float(score), 3)
        return result

    def search(self, query: str, top_n: int = 5, system_filter: str = None):
        if not query or not query.strip():
            return []

        with self._lock:
            df = self.df
            vectorizer = self.vectorizer
            tfidf_matrix = self.tfidf_matrix

        query_vec = vectorizer.transform([query.lower().strip()])
        scores = cosine_similarity(query_vec, tfidf_matrix).flatten()

        if system_filter:
            mask = df["traditional_system"].str.lower() == system_filter.lower()
            scores = np.where(mask.to_numpy(), scores, 0)

        # Only consider plants with a non-trivial match, then take the top N.
        candidate_idx = np.where(scores >= 0.05)[0]
        if len(candidate_idx) == 0:
            return []

        ranked = candidate_idx[np.argsort(scores[candidate_idx])[::-1]]
        top_idx = ranked[:top_n]

        results = []
        for idx in top_idx:
            row = df.iloc[idx]
            results.append(self._row_to_dict(row, score=scores[idx]))
        return results

    def get_by_id(self, plant_id: int):
        with self._lock:
            df = self.df
        match = df[df["plant_id"] == plant_id]
        if match.empty:
            return None
        return self._row_to_dict(match.iloc[0])

    def find_alternative(self, plant: dict, top_n: int = 3):
        """
        Suggest the closest 'Safe' plant for a risky one, based on similarity
        of their use-case text. Returns None if no safe alternative is found.
        """
        with self._lock:
            df = self.df
            vectorizer = self.vectorizer
            tfidf_matrix = self.tfidf_matrix

        safe_mask = (df["iucn_status"] == "Safe") & (df["plant_id"] != plant["plant_id"])
        if not safe_mask.any():
            return None

        uses_text = ", ".join(plant["uses"]) if isinstance(plant["uses"], list) else str(plant["uses"])
        query_vec = vectorizer.transform([(plant["name"] + " " + uses_text).lower()])
        scores = cosine_similarity(query_vec, tfidf_matrix).flatten()
        scores = np.where(safe_mask.to_numpy(), scores, 0)

        best_idx = int(np.argmax(scores))
        if scores[best_idx] <= 0:
            return None

        row = df.iloc[best_idx]
        alt = self._row_to_dict(row, score=scores[best_idx])
        return {
            "plant_id": alt["plant_id"],
            "name": alt["name"],
            "scientific_name": alt["scientific_name"],
            "iucn_status": alt["iucn_status"],
            "similarity_score": alt["similarity_score"],
        }

    def stats(self):
        with self._lock:
            df = self.df
        return {
            "total_plants": int(len(df)),
            "risky_plants": int(df["iucn_status"].isin(RISKY_STATUSES).sum()),
            "traditional_systems": sorted(df["traditional_system"].unique().tolist()),
            "iucn_statuses": sorted(df["iucn_status"].unique().tolist()),
        }

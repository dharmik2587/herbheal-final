'use client';

import Link from 'next/link';
import Image from 'next/image';

export interface HerbCardData {
  id: string;
  name: string;
  scientificName?: string | null;
  description: string;
  imageUrl?: string | null;
  doshas: string[];
  symptoms?: { symptom: { name: string }; strength?: number }[];
  score?: number;
  matchedSymptoms?: { name: string; strength: number }[];
  doshaMatch?: boolean;
}

export default function HerbCard({ herb }: { herb: HerbCardData }) {
  return (
    <Link href={`/herbs/${herb.id}`} className="herb-card-link" id={`herb-card-${herb.id}`}>
      <div className="herb-card">
        <div className="herb-card-image">
          {herb.imageUrl ? (
            <Image src={herb.imageUrl} alt={herb.name} fill className="herb-card-img" sizes="(max-width: 768px) 100vw, 33vw" />
          ) : (
            <div className="herb-card-placeholder">
              <span className="placeholder-leaf">🌿</span>
            </div>
          )}
          <div className="herb-card-image-overlay"></div>
          {typeof herb.score === 'number' && (
            <span className="tag-score" id={`score-${herb.id}`}>
              Score: {herb.score}
            </span>
          )}
        </div>

        <div className="herb-card-body">
          <h3 className="herb-card-name">{herb.name}</h3>
          {herb.scientificName && (
            <p className="herb-card-scientific">{herb.scientificName}</p>
          )}
          <p className="herb-card-desc">{herb.description}</p>

          <div className="herb-card-tags">
            {(herb.doshas || []).slice(0, 3).map((d) => (
              <span key={d} className="tag tag-dosha">{d}</span>
            ))}
          </div>

          {herb.matchedSymptoms && herb.matchedSymptoms.length > 0 && (
            <div className="herb-card-matched">
              {herb.matchedSymptoms.map((s) => (
                <span key={s.name} className="tag tag-symptom-match">
                  {s.name} <span className="tag-strength">{s.strength}/10</span>
                </span>
              ))}
            </div>
          )}

          {!herb.matchedSymptoms && herb.symptoms && herb.symptoms.length > 0 && (
            <div className="herb-card-symptoms">
              {herb.symptoms.slice(0, 4).map((s) => (
                <span key={s.symptom.name} className="tag tag-symptom-sm">
                  {s.symptom.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

'use client';

import { useState } from 'react';

const DOSHAS = ['Vata', 'Pitta', 'Kapha'] as const;
const DOSHA_INFO: Record<string, string> = {
  Vata: 'Air & Ether — governs movement',
  Pitta: 'Fire & Water — governs transformation',
  Kapha: 'Earth & Water — governs structure',
};

const POPULAR_SYMPTOMS = [
  'Stress', 'Anxiety', 'Fatigue', 'Inflammation', 'Pain',
  'Digestive Issues', 'Insomnia', 'Cold', 'Cough', 'Fever',
  'Headache', 'Nausea', 'Acidity', 'Constipation', 'Diarrhea',
  'Joint Pain', 'Skin Irritation', 'Acne', 'Sore Throat', 'Allergies',
  'Low Immunity', 'High Blood Pressure', 'Diabetes', 'Weight Loss', 'Hair Fall',
  'Dandruff', 'Menstrual Cramps', 'Depression', 'Memory Loss', 'Eye Strain',
  'Wound Healing', 'Arthritis', 'Liver Detox', 'Respiratory Issues', 'Migraine'
];

export default function CompassForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (payload: { symptoms: string[]; dosha?: (typeof DOSHAS)[number] }) => void;
  isLoading: boolean;
}) {
  const [symptomInput, setSymptomInput] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [dosha, setDosha] = useState<(typeof DOSHAS)[number] | undefined>();

  const addSymptom = (name?: string) => {
    const trimmed = (name || symptomInput).trim();
    if (trimmed && !symptoms.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setSymptoms([...symptoms, trimmed]);
    }
    setSymptomInput('');
  };

  const removeSymptom = (s: string) => setSymptoms(symptoms.filter((x) => x !== s));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (symptoms.length === 0) return;
    onSubmit({ symptoms, dosha });
  };

  return (
    <form onSubmit={handleSubmit} className="compass-form" id="compass-form">
      <div className="form-group">
        <label className="form-label">What are your symptoms?</label>
        <div className="input-row">
          <input
            value={symptomInput}
            onChange={(e) => setSymptomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); addSymptom(); }
            }}
            placeholder="Type a symptom and press Enter..."
            className="form-input"
            id="compass-symptom-input"
          />
          <button
            type="button"
            onClick={() => addSymptom()}
            className="btn-secondary"
            id="compass-add-symptom"
          >
            Add
          </button>
        </div>

        {symptoms.length > 0 && (
          <div className="tag-list-inline compass-selected">
            {symptoms.map((s) => (
              <span key={s} className="tag tag-symptom-active">
                {s}
                <button
                  type="button"
                  onClick={() => removeSymptom(s)}
                  className="tag-remove"
                  aria-label={`Remove ${s}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="quick-add">
          <span className="quick-add-label">Quick add:</span>
          <div className="tag-list-inline">
            {POPULAR_SYMPTOMS.filter(s => !symptoms.some(sel => sel.toLowerCase() === s.toLowerCase())).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addSymptom(s)}
                className="tag tag-ghost"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Your Dosha (optional)</label>
        <div className="dosha-grid">
          {DOSHAS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDosha(dosha === d ? undefined : d)}
              className={`dosha-card ${dosha === d ? 'dosha-card-active' : ''}`}
              id={`dosha-${d.toLowerCase()}`}
            >
              <span className="dosha-name">{d}</span>
              <span className="dosha-desc">{DOSHA_INFO[d]}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={symptoms.length === 0 || isLoading}
        className="btn-primary btn-lg btn-full"
        id="compass-submit"
      >
        {isLoading ? (
          <span className="btn-loading">Finding herbs...</span>
        ) : (
          '🧭 Find My Herbs'
        )}
      </button>
    </form>
  );
}

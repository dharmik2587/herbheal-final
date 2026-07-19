'use client';

import CompassForm from '@/components/CompassForm';
import HerbCard from '@/components/HerbCard';
import { useRecommendations } from '@/hooks/useRecommendations';

export default function CompassPage() {
  const { mutate, data, isPending, isError, error, reset } = useRecommendations();

  return (
    <div className="page-compass">
      <section className="hero hero-compact">
        <div className="hero-glow"></div>
        <h1 className="hero-title">🧭 HerbHeal Compass</h1>
        <p className="hero-subtitle">
          Tell us your symptoms and dosha to discover personalized Ayurvedic herb recommendations.
        </p>
      </section>

      <div className="container">
        <section className="section">
          <CompassForm
            onSubmit={(payload) => mutate(payload)}
            isLoading={isPending}
          />
        </section>

        {isError && (
          <div className="error-card" id="compass-error">
            <p className="error-text">
              {error instanceof Error ? error.message : 'Something went wrong.'}
            </p>
            <button className="btn-secondary" onClick={() => reset()} id="compass-retry-btn">
              Try again
            </button>
          </div>
        )}

        {data?.data && (
          <section className="section results-section" id="compass-results">
            <h2 className="section-title">
              {data.data.length > 0
                ? `${data.data.length} herb${data.data.length > 1 ? 's' : ''} matched your symptoms`
                : 'No herbs matched — try different symptoms'}
            </h2>
            {data.data.length > 0 && (
              <div className="herb-grid">
                {data.data.map((herb: any) => (
                  <HerbCard key={herb.id} herb={herb} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

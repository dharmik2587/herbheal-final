'use client';

import CompassForm from '@/components/CompassForm';
import HerbCard from '@/components/HerbCard';
import SkeletonLoader from '@/components/SkeletonLoader';
import { useRecommendations } from '@/hooks/useRecommendations';

export default function CompassPage() {
  const { mutate, data, isPending, isError, error, reset } = useRecommendations();

  return (
    <div className="page-compass">
      <section className="hero hero-compact">
        <div className="hero-glow"></div>
        <h1 className="hero-title">
          <span className="hero-title-icon">🧭</span>
          <span className="hero-title-text">HerbHeal Compass</span>
        </h1>
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

        {isPending && (
          <section className="section">
            <h3 style={{ color: 'var(--accent-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ animation: 'spin 1.2s linear infinite' }}>🧭</span>
              Computing Ayurvedic Herb Recommendations...
            </h3>
            <SkeletonLoader count={4} type="card" />
          </section>
        )}

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

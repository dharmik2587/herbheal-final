'use client';

import HerbCard from './HerbCard';
import LoadingSkeleton from './LoadingSkeleton';
import { useHerbs, HerbFilters } from '@/hooks/useHerbs';

export default function HerbList({ symptom, q, dosha }: HerbFilters) {
  const { data, isLoading, isError, refetch } = useHerbs({ symptom, q, dosha, limit: 24 });

  if (isLoading) return <LoadingSkeleton />;

  if (isError) {
    return (
      <div className="empty-state" id="herb-list-error">
        <p className="empty-state-text">Something went wrong loading herbs.</p>
        <button onClick={() => refetch()} className="btn-primary" id="herb-list-retry">
          Retry
        </button>
      </div>
    );
  }

  const herbs = data?.data ?? [];

  if (herbs.length === 0) {
    return (
      <div className="empty-state" id="herb-list-empty">
        <span className="empty-state-icon">🌱</span>
        <p className="empty-state-text">No herbs found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="herb-grid" id="herb-grid">
      {herbs.map((herb: any) => (
        <HerbCard key={herb.id} herb={herb} />
      ))}
    </div>
  );
}

import { useMutation } from '@tanstack/react-query';

export interface RecommendationRequest {
  symptoms: string[];
  dosha?: 'Vata' | 'Pitta' | 'Kapha';
}

async function postRecommendations(payload: RecommendationRequest) {
  const res = await fetch('/api/recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch recommendations');
  }
  return res.json();
}

export function useRecommendations() {
  return useMutation({ mutationFn: postRecommendations });
}

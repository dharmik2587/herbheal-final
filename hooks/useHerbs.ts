import { useQuery, keepPreviousData } from '@tanstack/react-query';

export interface HerbFilters {
  symptom?: string;
  q?: string;
  dosha?: string;
  limit?: number;
  skip?: number;
}

async function fetchHerbs(filters: HerbFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });

  const res = await fetch(`/api/herbs?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch herbs');
  return res.json();
}

export function useHerbs(filters: HerbFilters, initialData?: any) {
  return useQuery({
    queryKey: ['herbs', filters],
    queryFn: () => fetchHerbs(filters),
    initialData: initialData ? { data: initialData, meta: { total: initialData.length, limit: 24, skip: 0, hasMore: true } } : undefined,
    placeholderData: keepPreviousData,
  });
}

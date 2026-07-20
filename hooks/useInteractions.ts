import { useQuery } from '@tanstack/react-query';

export interface Interaction {
  herb: string;
  herbCommon: string;
  drug: string;
  drugClass: string;
  severity: 'mild' | 'moderate' | 'severe';
  risk: string;
  mechanism: string;
  recommendation: string;
}

export interface InteractionsResponse {
  data: Interaction[];
  meta: {
    total: number;
    herbs: string[];
    drugs: string[];
  };
}

export function useInteractions(herb?: string, drug?: string) {
  return useQuery({
    queryKey: ['interactions', herb, drug],
    queryFn: async (): Promise<InteractionsResponse> => {
      const params = new URLSearchParams();
      if (herb) params.append('herb', herb);
      if (drug) params.append('drug', drug);
      
      const res = await fetch(`/api/interactions?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    },
    enabled: !!herb || !!drug,
  });
}

export function useDrugList() {
  return useQuery({
    queryKey: ['drugList'],
    queryFn: async (): Promise<{ data: string[] }> => {
      const res = await fetch('/api/interactions?list=drugs');
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    },
  });
}

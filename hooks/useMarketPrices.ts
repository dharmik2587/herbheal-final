import { useQuery } from '@tanstack/react-query';
import { MarketPrice } from '../lib/market-prices';

export type MarketPricesResponse = {
  data: MarketPrice[];
  meta: {
    source: 'google_sheets' | 'fallback';
    fetchedAt: string;
  };
};

export function useMarketPrices(autoRefresh: boolean = true) {
  return useQuery<MarketPricesResponse>({
    queryKey: ['market-prices'],
    queryFn: async () => {
      const res = await fetch('/api/market-prices');
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    },
    refetchInterval: autoRefresh ? 15000 : false,
  });
}

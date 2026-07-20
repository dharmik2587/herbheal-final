export type MarketPrice = {
  scientificName: string;
  commonName: string;
  pricePerKg: number;
  currency: string;
  buyerLocation: string;
};

export function parseCSVToMarketPrices(csvText: string): MarketPrice[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const scientificNameIdx = headers.indexOf('scientific_name');
  const commonNameIdx = headers.indexOf('common_name');
  const pricePerKgIdx = headers.indexOf('price_per_kg');
  const currencyIdx = headers.indexOf('currency');
  const buyerLocationIdx = headers.indexOf('buyer_location');

  if (scientificNameIdx === -1 || commonNameIdx === -1 || pricePerKgIdx === -1 || currencyIdx === -1 || buyerLocationIdx === -1) {
    return [];
  }

  const results: MarketPrice[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple CSV split (assuming no commas inside fields for this scope)
    const values = line.split(',').map(v => v.trim());
    
    if (values.length >= headers.length) {
      results.push({
        scientificName: values[scientificNameIdx],
        commonName: values[commonNameIdx],
        pricePerKg: parseFloat(values[pricePerKgIdx]) || 0,
        currency: values[currencyIdx],
        buyerLocation: values[buyerLocationIdx]
      });
    }
  }

  return results;
}

export async function fetchMarketPrices(sheetUrl?: string): Promise<MarketPrice[]> {
  try {
    if (sheetUrl) {
      const response = await fetch(sheetUrl);
      if (response.ok) {
        const csvText = await response.text();
        return parseCSVToMarketPrices(csvText);
      }
    }
    // Fallback logic
    const fallbackResponse = await fetch('/data/market-prices-fallback.csv');
    if (fallbackResponse.ok) {
      const fallbackCsvText = await fallbackResponse.text();
      return parseCSVToMarketPrices(fallbackCsvText);
    }
  } catch (error) {
    console.error('Failed to fetch market prices:', error);
  }
  return [];
}

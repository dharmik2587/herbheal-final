// Wikipedia's REST API rejects/throttles requests without a descriptive
// User-Agent (see https://meta.wikimedia.org/wiki/User-Agent_policy).
// Neither original draft set one — a real risk of silent 403s in production.
const USER_AGENT =
  process.env.WIKIPEDIA_USER_AGENT ||
  'HerbHealCompass/1.0 (https://your-domain.example; contact@your-domain.example)';

export interface WikipediaSummary {
  extract: string | null;
  imageUrl: string | null;
}

export async function fetchWikipediaSummary(
  herbName: string
): Promise<WikipediaSummary> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(herbName)}`,
      {
        headers: { 'User-Agent': USER_AGENT },
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      // 404 just means no matching Wikipedia article — not an error we
      // should crash on. Anything else (429/403) we surface for logging.
      if (res.status !== 404) {
        console.warn(`Wikipedia ${res.status} for "${herbName}"`);
      }
      return { extract: null, imageUrl: null };
    }

    const data = await res.json();
    return {
      extract: data.extract ?? null,
      imageUrl: data.thumbnail?.source ?? data.originalimage?.source ?? null,
    };
  } catch (err) {
    console.error(`Wikipedia fetch failed for "${herbName}":`, err);
    return { extract: null, imageUrl: null };
  }
}

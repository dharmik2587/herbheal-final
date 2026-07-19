// FIX vs. original draft: `esearch.fcgi` only returns a list of PubMed IDs.
// The previous version stored a fabricated title ("Research Study on X")
// instead of the real paper title, which is misleading in a health app.
// This adds the required second call to `esummary.fcgi` to fetch the
// actual title/journal/pubdate for each ID.
const EUTILS_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

export interface PubMedResult {
  pmid: string;
  title: string;
  url: string;
}

export async function fetchPubMedResearch(
  herbName: string,
  apiKey?: string,
  maxResults = 5
): Promise<PubMedResult[]> {
  try {
    const keyParam = apiKey ? `&api_key=${apiKey}` : '';

    const searchUrl =
      `${EUTILS_BASE}/esearch.fcgi?db=pubmed&retmode=json&retmax=${maxResults}` +
      `&term=${encodeURIComponent(herbName + ' medicinal properties')}${keyParam}`;

    const searchRes = await fetch(searchUrl, { cache: 'no-store' });
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();
    const ids: string[] = searchData?.esearchresult?.idlist ?? [];
    if (ids.length === 0) return [];

    // Second call: resolve real titles for those IDs
    const summaryUrl =
      `${EUTILS_BASE}/esummary.fcgi?db=pubmed&retmode=json` +
      `&id=${ids.join(',')}${keyParam}`;

    const summaryRes = await fetch(summaryUrl, { cache: 'no-store' });
    if (!summaryRes.ok) return [];
    const summaryData = await summaryRes.json();

    return ids
      .map((id) => {
        const entry = summaryData?.result?.[id];
        if (!entry?.title) return null;
        return {
          pmid: id,
          title: entry.title as string,
          url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        };
      })
      .filter((r): r is PubMedResult => r !== null);
  } catch (err) {
    console.error(`PubMed fetch failed for "${herbName}":`, err);
    return [];
  }
}

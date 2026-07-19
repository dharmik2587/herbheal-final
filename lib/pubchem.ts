// FIX vs. original draft: PubChem's `/compound/name/{name}/JSON` endpoint
// resolves a *chemical compound* name (e.g. "Curcumin", "Withaferin A").
// It does not know what "Ashwagandha" or "Withania somnifera" is, because
// those are organisms, not compounds — querying PubChem with the herb name
// will 404 for almost every herb. So we look up each of the herb's curated
// `knownCompounds` individually instead.
const PUBCHEM_BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';

export interface CompoundInfo {
  name: string;
  cid: number | null;
  molecularFormula: string | null;
  iupacName: string | null;
  canonicalSmiles: string | null;
}

export async function fetchCompoundInfo(compoundName: string): Promise<CompoundInfo | null> {
  try {
    const url =
      `${PUBCHEM_BASE}/compound/name/${encodeURIComponent(compoundName)}` +
      `/property/MolecularFormula,IUPACName,CanonicalSMILES/JSON`;

    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) {
      if (res.status !== 404) {
        console.warn(`PubChem ${res.status} for "${compoundName}"`);
      }
      return null;
    }

    const data = await res.json();
    const props = data?.PropertyTable?.Properties?.[0];
    if (!props) return null;

    return {
      name: compoundName,
      cid: props.CID ?? null,
      molecularFormula: props.MolecularFormula ?? null,
      iupacName: props.IUPACName ?? null,
      canonicalSmiles: props.CanonicalSMILES ?? null,
    };
  } catch (err) {
    console.error(`PubChem fetch failed for "${compoundName}":`, err);
    return null;
  }
}

/** Fetches every known compound for a herb, respecting PubChem's rate limits
 *  (max 5 req/sec, enforced here as a conservative serial delay). */
export async function fetchAllCompounds(compoundNames: string[]): Promise<CompoundInfo[]> {
  const results: CompoundInfo[] = [];
  for (const name of compoundNames) {
    const info = await fetchCompoundInfo(name);
    if (info) results.push(info);
    await sleep(300);
  }
  return results;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

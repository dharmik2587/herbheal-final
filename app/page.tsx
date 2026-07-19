import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import HerbList from '@/components/HerbList';
import SearchBar from '@/components/SearchBar';

export const dynamic = 'force-dynamic';

async function getSymptoms() {
  try {
    return await prisma.symptom.findMany({
      include: { _count: { select: { herbs: true } } },
      orderBy: { name: 'asc' },
    });
  } catch {
    return [];
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: { symptom?: string; q?: string; dosha?: string };
}) {
  const symptoms = await getSymptoms();

  return (
    <div className="page-home">
      <section className="hero">
        <div className="hero-glow"></div>
        <h1 className="hero-title">Discover Healing Herbs</h1>
        <p className="hero-subtitle">
          Ayurvedic herbs and their healing properties, enriched daily from Wikipedia, PubChem &amp; PubMed.
        </p>
        <Link href="/compass" className="btn-primary btn-lg" id="hero-compass-link">
          🧭 Try the Compass
        </Link>
      </section>

      <div className="container">
        <section className="section">
          <SearchBar />
        </section>

        {symptoms.length > 0 && (
          <section className="section">
            <h2 className="section-title">Filter by Symptom</h2>
            <div className="tag-list">
              {symptoms.map((s) => (
                <a
                  key={s.id}
                  href={`/?symptom=${encodeURIComponent(s.name)}`}
                  className={`tag tag-symptom ${searchParams.symptom === s.name ? 'tag-active' : ''}`}
                  id={`filter-symptom-${s.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {s.name}
                  <span className="tag-count">{s._count.herbs}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="section">
          <HerbList symptom={searchParams.symptom} q={searchParams.q} dosha={searchParams.dosha} />
        </section>
      </div>
    </div>
  );
}

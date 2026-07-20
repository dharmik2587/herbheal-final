import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import HerbList from '@/components/HerbList';
import SearchBar from '@/components/SearchBar';
import { parseJsonArray } from '@/lib/helpers';

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

async function getInitialHerbs(symptom?: string, q?: string, dosha?: string) {
  try {
    const where: any = {};

    if (symptom) {
      const allSymptoms = await prisma.symptom.findMany();
      const matchedSymptom = allSymptoms.find(
        (s) => s.name.toLowerCase() === symptom.toLowerCase()
      );
      if (matchedSymptom) {
        where.symptoms = { some: { symptomId: matchedSymptom.id } };
      } else {
        where.symptoms = { some: { symptomId: 'non-existent-id' } };
      }
    }
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { scientificName: { contains: q } },
        { description: { contains: q } },
      ];
    }
    if (dosha) {
      const normalized = dosha.charAt(0).toUpperCase() + dosha.slice(1).toLowerCase();
      where.doshas = { contains: normalized };
    }

    const herbs = await prisma.herb.findMany({
      where,
      include: {
        symptoms: { include: { symptom: true } },
      },
      orderBy: { name: 'asc' },
      take: 24,
    });

    return herbs.map((herb) => ({
      ...herb,
      ayurvedicProperties: parseJsonArray(herb.ayurvedicProperties),
      taste: parseJsonArray(herb.taste),
      doshas: parseJsonArray(herb.doshas),
      organs: parseJsonArray(herb.organs),
      contraindications: parseJsonArray(herb.contraindications),
      knownCompounds: parseJsonArray(herb.knownCompounds),
      compounds: herb.compounds ? JSON.parse(herb.compounds) : null,
    }));
  } catch {
    return [];
  }
}

const COMPASS_FEATURES = [
  {
    icon: '📷',
    title: 'Identification Compass',
    description: 'Point your camera at any plant — get instant species identification powered by Plant.id AI.',
    href: '/identify',
    gradient: 'linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(46, 125, 50, 0.08))',
    borderGlow: 'rgba(76, 175, 80, 0.3)',
    tag: 'Live API',
  },
  {
    icon: '🧭',
    title: 'Healing Compass',
    description: 'Tell us your symptoms & dosha to discover ranked Ayurvedic herb recommendations.',
    href: '/compass',
    gradient: 'linear-gradient(135deg, rgba(0, 188, 212, 0.15), rgba(0, 150, 136, 0.08))',
    borderGlow: 'rgba(0, 188, 212, 0.3)',
    tag: 'AI Ranked',
  },
  {
    icon: '💰',
    title: 'Trade Compass',
    description: 'Live market prices that update in real-time. Watch prices change during the demo.',
    href: '/market',
    gradient: 'linear-gradient(135deg, rgba(255, 183, 77, 0.15), rgba(255, 152, 0, 0.08))',
    borderGlow: 'rgba(255, 183, 77, 0.3)',
    tag: 'Real-Time',
  },
  {
    icon: '💊',
    title: 'Safety Compass',
    description: 'Check herb-drug interactions from a dynamic clinical database before recommending.',
    href: '/compass',
    gradient: 'linear-gradient(135deg, rgba(239, 83, 80, 0.12), rgba(211, 47, 47, 0.06))',
    borderGlow: 'rgba(239, 83, 80, 0.25)',
    tag: 'Dynamic DB',
  },
];

export default async function Home({
  searchParams,
}: {
  searchParams: { symptom?: string; q?: string; dosha?: string };
}) {
  const [symptoms, initialHerbs] = await Promise.all([
    getSymptoms(),
    getInitialHerbs(searchParams.symptom, searchParams.q, searchParams.dosha),
  ]);

  return (
    <div className="page-home">
      <section className="hero">
        <div className="hero-glow"></div>
        <h1 className="hero-title">Four Compasses. One Platform.</h1>
        <p className="hero-subtitle">
          Identify plants in real-time, discover healing herbs, track live market prices, and check drug safety — all powered by live data.
        </p>
      </section>

      <div className="container">
        {/* Four Compass Feature Cards */}
        <section className="section">
          <div className="compass-grid" id="compass-features">
            {COMPASS_FEATURES.map((feature) => (
              <Link
                key={feature.title}
                href={feature.href}
                className="compass-feature-card"
                id={`feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
                style={{
                  background: feature.gradient,
                  borderColor: feature.borderGlow,
                }}
              >
                <div className="compass-feature-tag">{feature.tag}</div>
                <span className="compass-feature-icon">{feature.icon}</span>
                <h3 className="compass-feature-title">{feature.title}</h3>
                <p className="compass-feature-desc">{feature.description}</p>
                <span className="compass-feature-arrow">→</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Browse Herb Database</h2>
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
          <HerbList
            symptom={searchParams.symptom}
            q={searchParams.q}
            dosha={searchParams.dosha}
            initialData={initialHerbs}
          />
        </section>
      </div>
    </div>
  );
}

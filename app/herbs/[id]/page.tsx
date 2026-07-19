import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function parseArr(val: string | null | undefined): string[] {
  if (!val) return [];
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; }
  catch { return []; }
}

async function getHerb(id: string) {
  try {
    return await prisma.herb.findUnique({
      where: { id },
      include: {
        symptoms: { include: { symptom: true } },
        researchLogs: { orderBy: { fetchedAt: 'desc' }, take: 10 },
      },
    });
  } catch { return null; }
}

export default async function HerbPage({ params }: { params: { id: string } }) {
  const herb = await getHerb(params.id);
  if (!herb) notFound();

  const doshas = parseArr(herb.doshas);
  const taste = parseArr(herb.taste);
  const organs = parseArr(herb.organs);
  const ayurvedicProps = parseArr(herb.ayurvedicProperties);
  const contraindications = parseArr(herb.contraindications);
  const knownCompounds = parseArr(herb.knownCompounds);
  const compounds = herb.compounds ? JSON.parse(herb.compounds) : null;

  return (
    <div className="page-detail">
      <div className="container">
        <Link href="/" className="back-link" id="detail-back-link">
          ← Back to herbs
        </Link>

        <div className="detail-card">
          <div className="detail-header">
            <div className="detail-image-wrapper">
              {herb.imageUrl ? (
                <Image src={herb.imageUrl} alt={herb.name} fill className="detail-image" sizes="(max-width: 768px) 100vw, 50vw" />
              ) : (
                <div className="detail-image-placeholder">
                  <span className="placeholder-icon">🌿</span>
                </div>
              )}
            </div>

            <div className="detail-info">
              <h1 className="detail-name">{herb.name}</h1>
              {herb.scientificName && (
                <p className="detail-scientific">{herb.scientificName}</p>
              )}
              <p className="detail-description">{herb.description}</p>

              <div className="detail-props-grid">
                <div className="detail-prop">
                  <h3 className="detail-prop-label">Temperature</h3>
                  <p className="detail-prop-value">{herb.temperature}</p>
                </div>
                <div className="detail-prop">
                  <h3 className="detail-prop-label">Doshas</h3>
                  <div className="tag-list-inline">
                    {doshas.map((d) => (
                      <span key={d} className="tag tag-dosha">{d}</span>
                    ))}
                  </div>
                </div>
                {taste.length > 0 && (
                  <div className="detail-prop">
                    <h3 className="detail-prop-label">Taste</h3>
                    <p className="detail-prop-value">{taste.join(', ')}</p>
                  </div>
                )}
                {organs.length > 0 && (
                  <div className="detail-prop">
                    <h3 className="detail-prop-label">Target Organs</h3>
                    <p className="detail-prop-value">{organs.join(', ')}</p>
                  </div>
                )}
              </div>

              {ayurvedicProps.length > 0 && (
                <div className="detail-section">
                  <h3 className="detail-section-title">Properties</h3>
                  <div className="tag-list-inline">
                    {ayurvedicProps.map((p) => (
                      <span key={p} className="tag">{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {contraindications.length > 0 && (
                <div className="warning-card">
                  <h3 className="warning-title">⚠️ Contraindications</h3>
                  <p className="warning-text">{contraindications.join(', ')}</p>
                </div>
              )}
            </div>
          </div>

          <div className="detail-body">
            <div className="detail-section">
              <h3 className="detail-section-title">Helps With</h3>
              <div className="tag-list-inline">
                {herb.symptoms.map((hs) => (
                  <Link
                    key={hs.symptomId}
                    href={`/?symptom=${encodeURIComponent(hs.symptom.name)}`}
                    className="tag tag-symptom"
                  >
                    {hs.symptom.name}
                    <span className="tag-strength">{hs.strength}/10</span>
                  </Link>
                ))}
              </div>
            </div>

            {compounds && Array.isArray(compounds) && compounds.length > 0 && (
              <div className="detail-section">
                <h3 className="detail-section-title">Known Compounds</h3>
                <div className="tag-list-inline">
                  {compounds.map((c: any) => (
                    <span key={c.name} className="tag tag-compound">
                      {c.name}
                      {c.molecularFormula && (
                        <span className="tag-formula"> ({c.molecularFormula})</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {herb.researchLogs.length > 0 && (
              <div className="detail-section">
                <h2 className="detail-section-title">Research &amp; Sources</h2>
                <div className="research-list">
                  {herb.researchLogs.map((log) => (
                    <div key={log.id} className="research-item">
                      <div className="research-item-content">
                        <h3 className="research-title">{log.title}</h3>
                        <p className="research-meta">
                          <span className="research-source">{log.source}</span>
                          <span className="research-date">
                            {new Date(log.fetchedAt).toLocaleDateString()}
                          </span>
                        </p>
                      </div>
                      <a
                        href={log.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ghost"
                        id={`research-link-${log.id}`}
                      >
                        Read →
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

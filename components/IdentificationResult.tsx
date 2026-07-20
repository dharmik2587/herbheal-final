'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { parseJsonArray } from '@/lib/helpers';

interface IdentificationResultProps {
  result: any;
  localMatch: any;
  insight?: { text: string; provider?: string; model?: string } | null;
  geminiVision?: {
    scientificName: string;
    commonNames: string[];
    confidence: number;
    family?: string;
    ayurvedicUses?: string[];
    safetyNotes?: string;
    description?: string;
    isPlant: boolean;
    model: string;
  } | null;
  identificationSource?: string;
}

export default function IdentificationResult({ result, localMatch, insight, geminiVision, identificationSource }: IdentificationResultProps) {
  const suggestions = result?.result?.classification?.suggestions || [];
  const diseases = result?.result?.disease?.suggestions || [];
  const isPlant = result?.result?.is_plant?.binary;
  const plantProb = result?.result?.is_plant?.probability;
  const [marketPrice, setMarketPrice] = useState<any>(null);

  const topMatch = suggestions[0];
  const scientificName = topMatch?.name || '';

  // Fetch market price for the identified plant
  useEffect(() => {
    if (!scientificName) return;
    fetch('/api/market-prices')
      .then(res => res.json())
      .then(data => {
        const match = data?.data?.find((p: any) =>
          p.scientificName.toLowerCase().includes(scientificName.toLowerCase()) ||
          scientificName.toLowerCase().includes(p.scientificName.toLowerCase())
        );
        if (match) setMarketPrice(match);
      })
      .catch(() => {});
  }, [scientificName]);

  if (suggestions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
        <p style={{ color: 'var(--warning)', margin: 0 }}>No plant could be identified in this image.</p>
      </div>
    );
  }

  if (isPlant === false && (plantProb || 0) < 0.5) {
    return (
      <div style={{ textAlign: 'center', padding: '24px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
        <p style={{ color: 'var(--warning)', margin: 0 }}>This doesn't look like a plant. Please try again with a clearer photo.</p>
      </div>
    );
  }

  const confidence = Math.round(topMatch.probability * 100);
  const taxonomy = topMatch.details?.taxonomy;
  const doshasList = localMatch?.doshas ? parseJsonArray(localMatch.doshas) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px', width: '100%', maxWidth: '800px', margin: '24px auto 0' }}>

      {/* Plant.id Top Result Section */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-glow)'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--bg-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(76, 175, 80, 0.15)',
                color: 'var(--accent-primary)',
                fontSize: '11px',
                fontWeight: 700,
                border: '1px solid rgba(76, 175, 80, 0.3)',
              }}>
                LIVE IDENTIFICATION
              </span>
              {identificationSource && (
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: identificationSource === 'gemini-vision'
                    ? 'rgba(0, 188, 212, 0.12)'
                    : 'rgba(255, 183, 77, 0.12)',
                  color: identificationSource === 'gemini-vision'
                    ? 'var(--accent-secondary)'
                    : 'var(--warning)',
                  fontSize: '10px',
                  fontWeight: 700,
                  border: `1px solid ${
                    identificationSource === 'gemini-vision'
                      ? 'rgba(0,188,212,0.3)'
                      : 'rgba(255,183,77,0.3)'
                  }`,
                }}>
                  {identificationSource === 'gemini-vision' ? '🧠 Gemini Vision' : '🔴 Plant.id v3'}
                </span>
              )}
            </div>
            <h2 style={{ margin: '0 0 4px 0', color: 'var(--text-primary)', fontSize: '24px' }}>
              {topMatch.name}
            </h2>
            {topMatch.details?.common_names && (
              <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
                Common names: {topMatch.details.common_names.slice(0, 5).join(', ')}
              </p>
            )}
            {/* Taxonomy Display */}
            {taxonomy && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                {taxonomy.family && (
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(0, 188, 212, 0.08)',
                    color: 'var(--accent-secondary)',
                    fontSize: '11px',
                    border: '1px solid rgba(0, 188, 212, 0.2)',
                  }}>
                    Family: {taxonomy.family}
                  </span>
                )}
                {taxonomy.genus && (
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(206, 147, 216, 0.08)',
                    color: 'var(--purple)',
                    fontSize: '11px',
                    border: '1px solid rgba(206, 147, 216, 0.2)',
                  }}>
                    Genus: {taxonomy.genus}
                  </span>
                )}
                {taxonomy.order && (
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(128, 222, 234, 0.08)',
                    color: 'var(--blue-soft)',
                    fontSize: '11px',
                    border: '1px solid rgba(128, 222, 234, 0.2)',
                  }}>
                    Order: {taxonomy.order}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Confidence Circle */}
          <div style={{ position: 'relative', width: '72px', height: '72px', flexShrink: 0 }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--bg-glass)"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={confidence > 70 ? 'var(--accent-primary)' : confidence > 40 ? 'var(--warning)' : 'var(--danger)'}
                strokeWidth="3"
                strokeDasharray={`${confidence}, 100`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1.5s ease-out' }}
              />
            </svg>
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column'
            }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', lineHeight: 1 }}>{confidence}%</span>
              <span style={{ fontSize: '8px', color: 'var(--text-muted)', lineHeight: 1 }}>match</span>
            </div>
          </div>
        </div>

        {/* Similar Images Gallery */}
        {topMatch.similar_images && topMatch.similar_images.length > 0 && (
          <div style={{ padding: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-muted)' }}>Visual Matches</h4>
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
              {topMatch.similar_images.slice(0, 4).map((img: any, i: number) => (
                <img
                  key={i}
                  src={img.url_small || img.url}
                  alt="similar visual match"
                  style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Description from Plant.id */}
        {topMatch.details?.description?.value && (
          <div style={{ padding: '0 20px 20px' }}>
            <p style={{
              margin: 0,
              color: 'var(--text-secondary)',
              fontSize: '14px',
              lineHeight: 1.7,
              borderLeft: '3px solid var(--accent-primary)',
              paddingLeft: '12px'
            }}>
              {topMatch.details.description.value.slice(0, 400)}{topMatch.details.description.value.length > 400 ? '...' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Market Price Inline (if matched) */}
      {marketPrice && (
        <div style={{
          backgroundColor: 'rgba(255, 183, 77, 0.06)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 183, 77, 0.2)',
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', color: 'var(--warning)', fontSize: '14px', fontWeight: 600 }}>
              💰 Trade Compass — Market Price
            </h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>
              Live price for {marketPrice.commonName}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-primary)' }}>
              ₹{marketPrice.pricePerKg}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}> / kg</span>
            <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: '12px' }}>
              📍 {marketPrice.buyerLocation}
            </p>
          </div>
        </div>
      )}

      {/* Health / Disease Section */}
      {diseases.length > 0 && diseases[0].probability > 0.4 && (
        <div style={{
          backgroundColor: 'rgba(239, 83, 80, 0.1)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--danger)',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span> Health Assessment
          </h3>
          <p style={{ margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
            <strong>{diseases[0].name}</strong> ({Math.round(diseases[0].probability * 100)}% match)
          </p>
          {diseases.length > 1 && (
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {diseases.slice(1, 4).map((disease: any, i: number) => (
                <span key={i} style={{
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(239, 83, 80, 0.05)',
                  border: '1px solid rgba(239, 83, 80, 0.2)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px'
                }}>
                  {disease.name} ({Math.round(disease.probability * 100)}%)
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Gemini Vision Panel — shown when Gemini Vision ran in parallel */}
      {geminiVision && geminiVision.isPlant && (
        <div style={{
          backgroundColor: 'rgba(0, 188, 212, 0.05)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(0, 188, 212, 0.2)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ margin: 0, color: 'var(--accent-secondary)', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🧠 Gemini Vision Analysis
              <span style={{
                padding: '2px 8px', borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(0,188,212,0.1)', fontSize: '10px',
                fontWeight: 700, color: 'var(--accent-secondary)',
                border: '1px solid rgba(0,188,212,0.2)'
              }}>{geminiVision.model}</span>
            </h3>
            <span style={{
              padding: '4px 10px', borderRadius: 'var(--radius-full)',
              backgroundColor: geminiVision.confidence > 0.7
                ? 'rgba(76,175,80,0.12)' : geminiVision.confidence > 0.4
                ? 'rgba(255,183,77,0.12)' : 'rgba(239,83,80,0.12)',
              color: geminiVision.confidence > 0.7
                ? 'var(--accent-primary)' : geminiVision.confidence > 0.4
                ? 'var(--warning)' : 'var(--danger)',
              fontSize: '13px', fontWeight: 700,
              border: `1px solid ${
                geminiVision.confidence > 0.7 ? 'rgba(76,175,80,0.3)'
                : geminiVision.confidence > 0.4 ? 'rgba(255,183,77,0.3)'
                : 'rgba(239,83,80,0.3)'
              }`,
            }}>{Math.round(geminiVision.confidence * 100)}% confidence</span>
          </div>

          <div>
            <p style={{ margin: '0 0 4px 0', color: 'var(--text-primary)', fontStyle: 'italic', fontSize: '16px', fontWeight: 600 }}>
              {geminiVision.scientificName}
            </p>
            {geminiVision.commonNames.length > 0 && (
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
                {geminiVision.commonNames.slice(0, 5).join(' · ')}
              </p>
            )}
            {geminiVision.family && (
              <span style={{
                display: 'inline-block', marginTop: '6px',
                padding: '2px 8px', borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(206,147,216,0.08)',
                color: 'var(--purple)', fontSize: '11px',
                border: '1px solid rgba(206,147,216,0.2)'
              }}>Family: {geminiVision.family}</span>
            )}
          </div>

          {geminiVision.description && (
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.7, borderLeft: '3px solid rgba(0,188,212,0.4)', paddingLeft: '10px' }}>
              {geminiVision.description}
            </p>
          )}

          {geminiVision.ayurvedicUses && geminiVision.ayurvedicUses.length > 0 && (
            <div>
              <p style={{ margin: '0 0 6px 0', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ayurvedic Uses</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {geminiVision.ayurvedicUses.map((use, i) => (
                  <span key={i} style={{
                    padding: '3px 10px', borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(76,175,80,0.08)',
                    color: 'var(--accent-primary)', fontSize: '12px',
                    border: '1px solid rgba(76,175,80,0.2)'
                  }}>{use}</span>
                ))}
              </div>
            </div>
          )}

          {geminiVision.safetyNotes && (
            <div style={{
              padding: '10px 14px', borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(255,183,77,0.06)',
              border: '1px solid rgba(255,183,77,0.2)',
              display: 'flex', gap: '8px', alignItems: 'flex-start'
            }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--warning)' }}>Safety: </strong>{geminiVision.safetyNotes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* AI Insight Section */}
      {insight && (
        <div style={{
          backgroundColor: 'rgba(0, 188, 212, 0.08)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(0, 188, 212, 0.24)',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 12px 0', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🧠 AI Insight
            {insight.provider && (
              <span style={{
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(0, 188, 212, 0.1)',
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--accent-secondary)',
                border: '1px solid rgba(0, 188, 212, 0.2)'
              }}>
                Gemini
              </span>
            )}
          </h3>
          <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: 1.7, fontSize: '14px', whiteSpace: 'pre-wrap' }}>
            {insight.text}
          </p>
        </div>
      )}

      {/* Local Database Match Section */}
      <div style={{
        backgroundColor: localMatch ? 'rgba(76, 175, 80, 0.05)' : 'var(--bg-glass)',
        borderRadius: 'var(--radius-lg)',
        border: `1px solid ${localMatch ? 'var(--accent-primary)' : 'var(--border-color)'}`,
        padding: '24px'
      }}>
        {localMatch ? (
          <>
            <h3 style={{ margin: '0 0 12px 0', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🌿</span> Found in HerbHeal Database
            </h3>
            <p style={{ margin: '0 0 12px 0', color: 'var(--text-primary)', fontSize: '18px' }}>
              <strong>{localMatch.name}</strong>
              {localMatch.sanskritName && <span style={{ color: 'var(--text-secondary)' }}> • {localMatch.sanskritName}</span>}
            </p>
            <p style={{ margin: '0 0 20px 0', color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.6 }}>
              {localMatch.description || 'Ayurvedic details available for this herb.'}
            </p>

            {doshasList.length > 0 && (
              <div style={{ margin: '0 0 20px 0', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {doshasList.map((dosha: string, idx: number) => (
                  <span key={idx} style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    border: '1px solid var(--border-color)'
                  }}>
                    {dosha}
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link href={`/herbs/${localMatch.id}`} style={{
                padding: '12px 20px',
                backgroundColor: 'var(--accent-primary)',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: 'var(--radius-md)',
                fontWeight: 'bold',
                fontSize: '14px',
                transition: 'var(--transition-base)'
              }}>
                View Full Details
              </Link>
              <Link href={`/market`} style={{
                padding: '12px 20px',
                backgroundColor: 'transparent',
                color: 'var(--accent-secondary)',
                border: '1px solid var(--accent-secondary)',
                textDecoration: 'none',
                borderRadius: 'var(--radius-md)',
                fontWeight: 'bold',
                fontSize: '14px',
                transition: 'var(--transition-base)'
              }}>
                View Market Price
              </Link>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ margin: 0 }}>ℹ️ This plant is not currently in our local medicinal database. The AI insight above provides its botanical and medicinal context.</p>
          </div>
        )}
      </div>

      {/* Other Suggestions */}
      {suggestions.length > 1 && (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '20px'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
            Other Possible Matches
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {suggestions.slice(1, 4).map((s: any, i: number) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-glass)',
                border: '1px solid var(--border-color)'
              }}>
                <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontStyle: 'italic' }}>
                  {s.name}
                </span>
                <span style={{
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: 600
                }}>
                  {Math.round(s.probability * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import CameraCapture from '@/components/CameraCapture';
import IdentificationResult from '@/components/IdentificationResult';
import ConservationBadge from '@/components/ConservationBadge';
import SafetyCompass from '@/components/SafetyCompass';

export default function IdentifyPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [resultData, setResultData] = useState<{
    result: any;
    localMatch: any;
    insight?: { text: string; provider?: string; model?: string } | null;
    marketPrice?: { pricePerKg: number; currency: string; buyerLocation: string } | null;
    identificationSource?: string;
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
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSafety, setShowSafety] = useState(false);

  const handleImageCapture = async (base64: string) => {
    setIsLoading(true);
    setError(null);
    setResultData(null);
    setShowSafety(false);

    try {
      const res = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to identify image');
      }

      setResultData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred while identifying.');
    } finally {
      setIsLoading(false);
    }
  };

  const topMatch = resultData?.result?.result?.classification?.suggestions?.[0];
  const scientificName = topMatch?.name || '';

  return (
    <main className="container section">
      <div className="hero hero-compact hero-glow" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '40px 24px 24px',
        marginBottom: '32px'
      }}>
        <h1 className="hero-title" style={{ marginBottom: '16px' }}>
          <span className="hero-title-icon">📷</span>
          <span className="hero-title-text">Identification Compass</span>
        </h1>
        <p className="hero-subtitle" style={{ maxWidth: '640px', margin: '0 auto 20px', lineHeight: '1.6' }}>
          Upload or snap a photo of a medicinal plant to identify it instantly, detect potential diseases, and discover its Ayurvedic properties.
        </p>
        <div className="badge-row" style={{ marginTop: '0', marginBottom: '16px' }}>
          <span style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(76, 175, 80, 0.12)',
            border: '1px solid rgba(76, 175, 80, 0.3)',
            color: 'var(--accent-primary)',
            fontSize: '13px',
            fontWeight: 600
          }}>
            🔴 Live API — Plant.id v3
          </span>
          <span style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(0, 188, 212, 0.12)',
            border: '1px solid rgba(0, 188, 212, 0.3)',
            color: 'var(--accent-secondary)',
            fontSize: '13px',
            fontWeight: 600
          }}>
            🧠 Gemini AI Insights
          </span>
          <span style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(255, 183, 77, 0.12)',
            border: '1px solid rgba(255, 183, 77, 0.3)',
            color: 'var(--warning)',
            fontSize: '13px',
            fontWeight: 600
          }}>
            ⚡ Supabase Synced
          </span>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 2, maxWidth: '520px', margin: '0 auto' }}>
        <CameraCapture onImageCapture={handleImageCapture} isLoading={isLoading} />

        {error && (
          <div
            style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: 'rgba(239, 83, 80, 0.1)',
              border: '1px solid var(--danger)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--danger)',
              textAlign: 'center',
              maxWidth: '500px',
              margin: '24px auto 0',
            }}
          >
            {error}
          </div>
        )}

        {resultData && (
          <>
            <IdentificationResult
              result={resultData.result}
              localMatch={resultData.localMatch}
              insight={resultData.insight}
              geminiVision={resultData.geminiVision}
              identificationSource={resultData.identificationSource}
            />

            {/* Conservation Badge Section */}
            {scientificName && (
              <div style={{
                maxWidth: '800px',
                margin: '24px auto 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  padding: '20px'
                }}>
                  <h3 style={{
                    margin: '0 0 12px 0',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '16px'
                  }}>
                    🏛️ Compliance Compass — Conservation Status
                  </h3>
                  <ConservationBadge scientificName={scientificName} />
                </div>

                {/* Safety Compass Toggle */}
                <button
                  onClick={() => setShowSafety(!showSafety)}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: showSafety ? 'var(--bg-card)' : 'rgba(239, 83, 80, 0.08)',
                    color: showSafety ? 'var(--text-primary)' : 'var(--warning)',
                    border: `1px solid ${showSafety ? 'var(--border-color)' : 'var(--warning)'}`,
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                    fontSize: '15px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    justifyContent: 'center'
                  }}
                >
                  💊 {showSafety ? 'Hide' : 'Check'} Drug Interactions for {topMatch?.details?.common_names?.[0] || scientificName}
                </button>

                {showSafety && (
                  <SafetyCompass
                    herbName={topMatch?.details?.common_names?.[0] || scientificName}
                    herbScientificName={scientificName}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

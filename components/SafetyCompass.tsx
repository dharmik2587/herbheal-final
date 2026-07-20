'use client';

import React, { useState } from 'react';
import { useDrugList, useInteractions } from '../hooks/useInteractions';

interface SafetyCompassProps {
  herbName?: string;
  herbScientificName?: string;
}

export default function SafetyCompass({ herbName, herbScientificName }: SafetyCompassProps) {
  const [selectedDrug, setSelectedDrug] = useState('');
  const [searchDrug, setSearchDrug] = useState('');
  const [submittedDrug, setSubmittedDrug] = useState('');

  const { data: drugListData, isLoading: isDrugListLoading } = useDrugList();
  
  const queryHerb = herbScientificName || herbName || '';
  const { data: interactionsData, isLoading: isInteractionsLoading, isError } = useInteractions(
    queryHerb,
    submittedDrug
  );

  const handleCheck = () => {
    setSubmittedDrug(selectedDrug);
  };

  const filteredDrugs = drugListData?.data.filter((d) =>
    d.toLowerCase().includes(searchDrug.toLowerCase())
  ) || [];

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)',
      padding: '2rem',
      boxShadow: 'var(--shadow-glow)',
      color: 'var(--text-primary)'
    }}>
      <h2 style={{
        margin: '0 0 1.5rem 0',
        fontSize: '1.5rem',
        color: 'var(--accent-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        💊 Safety Compass — Drug Interaction Check
      </h2>

      {herbName && (
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{
            background: 'var(--accent-glow)',
            color: 'var(--accent-primary)',
            padding: '0.25rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.875rem',
            fontWeight: 600,
            border: '1px solid var(--accent-primary)'
          }}>
            Selected Herb: {herbName}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}>
          <label htmlFor="drugSearch" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Search Medications
          </label>
          <input
            id="drugSearch"
            type="text"
            placeholder="Type to filter drugs..."
            value={searchDrug}
            onChange={(e) => {
              setSearchDrug(e.target.value);
              setSelectedDrug('');
            }}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'var(--transition-base)'
            }}
          />
          {searchDrug && !selectedDrug && filteredDrugs.length > 0 && (
            <ul style={{
              listStyle: 'none',
              margin: 0,
              padding: '0.5rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              maxHeight: '150px',
              overflowY: 'auto',
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '0.25rem',
              zIndex: 10,
              width: '100%',
              boxShadow: 'var(--shadow-glow)'
            }}>
              {filteredDrugs.map(drug => (
                <li
                  key={drug}
                  onClick={() => {
                    setSelectedDrug(drug);
                    setSearchDrug(drug);
                  }}
                  style={{
                    padding: '0.5rem',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-sm)',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-glass)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {drug}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            onClick={handleCheck}
            disabled={!selectedDrug && !queryHerb}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              cursor: (!selectedDrug && !queryHerb) ? 'not-allowed' : 'pointer',
              opacity: (!selectedDrug && !queryHerb) ? 0.5 : 1,
              transition: 'var(--transition-base)'
            }}
          >
            Check Interactions
          </button>
        </div>
      </div>

      {isInteractionsLoading && <p style={{ color: 'var(--text-muted)' }}>Checking interactions...</p>}

      {!selectedDrug && !submittedDrug && !isInteractionsLoading && !isDrugListLoading && (
        <div style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Choose a medication to run the interaction check.
        </div>
      )}
      
      {interactionsData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {interactionsData.data.length === 0 ? (
            <div style={{
              background: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid var(--accent-primary)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '1.25rem' }}>✅</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No known interactions</span>
            </div>
          ) : (
            interactionsData.data.map((interaction, idx) => {
              const isSevere = interaction.severity === 'severe';
              const isModerate = interaction.severity === 'moderate';
              
              const borderColor = isSevere ? 'var(--danger)' : isModerate ? 'var(--warning)' : 'var(--accent-primary)';
              const badgeColor = isSevere ? 'var(--danger)' : isModerate ? 'var(--warning)' : 'var(--accent-primary)';
              const bgColor = isSevere ? 'rgba(239, 83, 80, 0.1)' : isModerate ? 'rgba(255, 183, 77, 0.1)' : 'rgba(76, 175, 80, 0.1)';
              
              const animationStyle = isSevere ? { animation: 'pulse 2s infinite' } : {};
              
              return (
                <div key={idx} style={{
                  background: 'var(--bg-secondary)',
                  border: `1px solid ${borderColor}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  position: 'relative',
                  overflow: 'hidden',
                  ...animationStyle
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                  }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                      {interaction.herbCommon} + {interaction.drug} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>({interaction.drugClass})</span>
                    </h3>
                    <span style={{
                      background: bgColor,
                      color: badgeColor,
                      border: `1px solid ${badgeColor}`,
                      padding: '0.25rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem'
                    }}>
                      {interaction.severity === 'severe' ? '🔴' : interaction.severity === 'moderate' ? '🟡' : '🟢'} {interaction.severity}
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>Risk:</strong> <span style={{ color: 'var(--text-primary)' }}>{interaction.risk}</span>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>Mechanism:</strong> <span style={{ color: 'var(--text-muted)' }}>{interaction.mechanism}</span>
                  </div>
                  <div style={{
                    background: 'var(--bg-glass)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: `4px solid ${borderColor}`
                  }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>Clinical Recommendation:</strong><br />
                    <span style={{ color: 'var(--text-primary)' }}>{interaction.recommendation}</span>
                  </div>
                  
                  {isSevere && (
                    <style dangerouslySetInnerHTML={{__html: `
                      @keyframes pulse {
                        0% { box-shadow: 0 0 0 0 rgba(239, 83, 80, 0.4); }
                        70% { box-shadow: 0 0 0 10px rgba(239, 83, 80, 0); }
                        100% { box-shadow: 0 0 0 0 rgba(239, 83, 80, 0); }
                      }
                    `}} />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

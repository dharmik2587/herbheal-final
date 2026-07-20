'use client';

import React, { useEffect, useState } from 'react';

interface ConservationStatus {
  scientificName: string;
  commonName: string;
  iucnStatus: string;
  cites: string | null;
  biodiversityAct: boolean;
  biodiversityActNote: string | null;
  harvestRestriction: string | null;
}

export default function ConservationBadge({ scientificName }: { scientificName: string }) {
  const [data, setData] = useState<ConservationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchConservationData() {
      try {
        const res = await fetch('/data/conservation.json');
        if (res.ok) {
          const list: ConservationStatus[] = await res.json();
          const match = list.find(item => item.scientificName.toLowerCase() === scientificName.toLowerCase());
          setData(match || null);
        }
      } catch (error) {
        console.error('Error fetching conservation data', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (scientificName) {
      fetchConservationData();
    } else {
      setIsLoading(false);
    }
  }, [scientificName]);

  if (isLoading) return <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading...</div>;

  const isConcern = data && data.iucnStatus !== 'Least Concern';

  if (!data || !isConcern) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.25rem 0.5rem',
        background: 'rgba(76, 175, 80, 0.1)',
        border: '1px solid var(--accent-primary)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--accent-primary)',
        fontSize: '0.75rem',
        fontWeight: 600
      }}>
        🌱 Least Concern
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Critically Endangered': return 'var(--danger)';
      case 'Endangered': return '#ff7043'; // Orange
      case 'Vulnerable': return 'var(--warning)';
      case 'Near Threatened': return '#d4e157'; // Yellow-green
      default: return 'var(--accent-primary)';
    }
  };

  const statusColor = getStatusColor(data.iucnStatus);
  const isCriticallyEndangered = data.iucnStatus === 'Critically Endangered';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      background: 'var(--bg-secondary)',
      border: `1px solid ${statusColor}`,
      borderRadius: 'var(--radius-md)',
      padding: '0.75rem',
      maxWidth: '300px',
      ...(isCriticallyEndangered ? { animation: 'pulse-crit 2s infinite' } : {})
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span style={{
          background: `color-mix(in srgb, ${statusColor} 15%, transparent)`,
          color: statusColor,
          padding: '0.25rem 0.5rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.75rem',
          fontWeight: 700,
          border: `1px solid ${statusColor}`
        }}>
          IUCN: {data.iucnStatus}
        </span>
        
        {data.cites && (
          <span style={{
            background: 'rgba(206, 147, 216, 0.1)',
            color: 'var(--purple)',
            padding: '0.25rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem',
            fontWeight: 700,
            border: '1px solid var(--purple)'
          }}>
            CITES: App {data.cites}
          </span>
        )}
      </div>

      {data.biodiversityAct && (
        <div style={{
          background: 'rgba(239, 83, 80, 0.1)',
          color: 'var(--danger)',
          padding: '0.25rem 0.5rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.75rem',
          fontWeight: 600,
          borderLeft: '2px solid var(--danger)'
        }}>
          ⚠️ Protected by Biodiversity Act
        </div>
      )}

      {data.harvestRestriction && (
        <div style={{
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          fontStyle: 'italic'
        }}>
          Restriction: {data.harvestRestriction}
        </div>
      )}

      {isCriticallyEndangered && (
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes pulse-crit {
            0% { box-shadow: 0 0 0 0 rgba(239, 83, 80, 0.3); }
            70% { box-shadow: 0 0 0 6px rgba(239, 83, 80, 0); }
            100% { box-shadow: 0 0 0 0 rgba(239, 83, 80, 0); }
          }
        `}} />
      )}
    </div>
  );
}

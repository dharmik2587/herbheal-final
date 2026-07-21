import React from 'react';

export default function SkeletonLoader({ count = 3, type = 'card' }: { count?: number; type?: 'card' | 'row' | 'badge' }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: type === 'card' ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr',
      gap: '20px',
      width: '100%',
      margin: '20px 0'
    }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton-card skeleton-shimmer"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: type === 'card' ? '0' : '20px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-glow)',
            opacity: 0.8,
            animation: 'pulse 1.8s infinite ease-in-out'
          }}
        >
          {type === 'card' && (
            <div style={{
              height: '180px',
              backgroundColor: 'rgba(76, 175, 80, 0.08)',
              borderBottom: '1px solid var(--border-color)'
            }} />
          )}
          <div style={{ padding: '20px' }}>
            <div className="skeleton-line skeleton-line-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', height: '20px', borderRadius: '4px', marginBottom: '12px' }} />
            <div className="skeleton-line skeleton-line-md" style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', height: '14px', borderRadius: '4px', marginBottom: '8px' }} />
            <div className="skeleton-line skeleton-line-sm" style={{ backgroundColor: 'rgba(76, 175, 80, 0.15)', height: '14px', borderRadius: '4px', width: '50%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

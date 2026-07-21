'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useMarketPrices } from '../../hooks/useMarketPrices';
import MarketPriceCard from '../../components/MarketPriceCard';

export default function MarketPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading, isError, refetch } = useMarketPrices(autoRefresh);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState(0);
  
  const prevDataRef = useRef<Record<string, number>>({});
  const [previousPrices, setPreviousPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (data?.data) {
      const currentPrices = data.data.reduce((acc, curr) => {
        return { ...acc, [curr.scientificName]: curr.pricePerKg };
      }, {} as Record<string, number>);
      
      setPreviousPrices(prevDataRef.current);
      
      const timer = setTimeout(() => {
        prevDataRef.current = currentPrices;
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [data]);

  useEffect(() => {
    if (data?.meta?.fetchedAt) {
      const fetchedTime = new Date(data.meta.fetchedAt).getTime();
      const calculateTime = () => setTimeSinceUpdate(Math.floor((Date.now() - fetchedTime) / 1000));
      calculateTime();
      
      const interval = setInterval(calculateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [data?.meta?.fetchedAt]);

  const filteredData = useMemo(() => {
    if (!data?.data) return [];
    if (!searchTerm) return data.data;
    const lower = searchTerm.toLowerCase();
    return data.data.filter(item => 
      item.commonName.toLowerCase().includes(lower) || 
      item.scientificName.toLowerCase().includes(lower)
    );
  }, [data, searchTerm]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', paddingBottom: '4rem' }}>
      <div className="hero hero-compact hero-glow">
        <h1 className="hero-title">
          <span className="hero-title-icon">💰</span>
          <span className="hero-title-text">Trade Compass</span>
        </h1>
        <p className="hero-subtitle">
          Live market prices for medicinal herbs — updated in real-time
        </p>
      </div>

      <div className="container section" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '1rem', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-card)',
          padding: '1rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                borderRadius: '50%', 
                backgroundColor: autoRefresh ? 'var(--accent-primary)' : 'var(--text-muted)',
                boxShadow: autoRefresh ? '0 0 12px var(--accent-glow)' : 'none',
                animation: autoRefresh ? 'pulse 2s infinite' : 'none'
              }} />
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                {autoRefresh ? 'Live' : 'Paused'}
              </span>
            </div>
            
            <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Last updated: {data?.meta?.fetchedAt ? `${timeSinceUpdate} seconds ago` : 'Waiting...'}
            </div>
            
            {data?.meta?.source && (
              <div style={{ 
                padding: '0.25rem 0.75rem', 
                borderRadius: 'var(--radius-full)', 
                backgroundColor: 'var(--bg-glass)',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                border: '1px solid var(--border-color)'
              }}>
                Source: {data.meta.source === 'google_sheets' ? 'Google Sheets' : 'Local Data'}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setAutoRefresh(!autoRefresh)}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'var(--transition-base)'
              }}
            >
              {autoRefresh ? 'Pause Auto-Refresh' : 'Enable Auto-Refresh'}
            </button>
            <button 
              onClick={() => refetch()}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent-primary)',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition-base)',
                boxShadow: 'var(--shadow-glow)'
              }}
            >
              Refresh Prices
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <input 
            type="text" 
            placeholder="Search herbs by name or scientific name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '1rem 1.5rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'var(--transition-base)'
            }}
          />
        </div>

        {isLoading ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: '1.5rem' 
          }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ 
                height: '180px', 
                backgroundColor: 'var(--bg-card)', 
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                opacity: 0.5,
                animation: 'pulse 2s infinite'
              }} />
            ))}
          </div>
        ) : isError ? (
          <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--danger)' }}>
            <h3 style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '1.5rem' }}>Error Loading Data</h3>
            <p style={{ color: 'var(--text-muted)' }}>Failed to load market prices from the server. Please try again.</p>
            <button 
              onClick={() => refetch()}
              style={{
                marginTop: '1.5rem',
                padding: '0.75rem 2rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--danger)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Retry Connection
            </button>
          </div>
        ) : filteredData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>No market prices found matching "{searchTerm}".</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: '1.5rem' 
          }}>
            {filteredData.map(price => (
              <MarketPriceCard 
                key={price.scientificName} 
                price={price} 
                previousPrice={previousPrices[price.scientificName]}
              />
            ))}
          </div>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.98); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}} />
    </div>
  );
}

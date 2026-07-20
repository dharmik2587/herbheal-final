'use client';

import React, { useEffect, useState } from 'react';
import { MarketPrice } from '../lib/market-prices';

interface MarketPriceCardProps {
  price: MarketPrice;
  previousPrice?: number;
}

export default function MarketPriceCard({ price, previousPrice }: MarketPriceCardProps) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (previousPrice !== undefined && price.pricePerKg !== previousPrice) {
      setFlash(price.pricePerKg > previousPrice ? 'up' : 'down');
      const timer = setTimeout(() => setFlash(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [price.pricePerKg, previousPrice]);

  const trend = previousPrice === undefined || price.pricePerKg === previousPrice
    ? 'neutral'
    : price.pricePerKg > previousPrice ? 'up' : 'down';

  const currencySymbol = price.currency === 'INR' ? '₹' : price.currency;

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      position: 'relative',
      overflow: 'hidden',
      transition: 'box-shadow 0.5s ease',
      boxShadow: flash === 'up' ? '0 0 20px rgba(76, 175, 80, 0.4)' : flash === 'down' ? '0 0 20px rgba(239, 83, 80, 0.4)' : 'none'
    }}>
      <div>
        <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 600 }}>
          {price.commonName}
        </h3>
        <p style={{ margin: '0.25rem 0 0 0', fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {price.scientificName}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
            {currencySymbol}{price.pricePerKg}
          </span>
          <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/ kg</span>
        </div>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: '32px', 
          height: '32px', 
          borderRadius: '50%', 
          backgroundColor: 'var(--bg-secondary)' 
        }}>
          {trend === 'up' && <span style={{ color: 'var(--accent-primary)', fontSize: '1.2rem', lineHeight: 1 }}>▲</span>}
          {trend === 'down' && <span style={{ color: 'var(--danger)', fontSize: '1.2rem', lineHeight: 1 }}>▼</span>}
          {trend === 'neutral' && <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem', lineHeight: 1 }}>—</span>}
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem', 
        marginTop: 'auto', 
        paddingTop: '1rem', 
        borderTop: '1px solid var(--border-color)' 
      }}>
        <span role="img" aria-label="location" style={{ fontSize: '1rem' }}>📍</span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {price.buyerLocation}
        </span>
      </div>
    </div>
  );
}

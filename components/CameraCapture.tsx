'use client';

import React, { useState, useRef } from 'react';

interface CameraCaptureProps {
  onImageCapture: (base64: string) => void;
  isLoading: boolean;
}

export default function CameraCapture({ onImageCapture, isLoading }: CameraCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreview(base64String);
      onImageCapture(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    if (isLoading) return;
    fileInputRef.current?.click();
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '500px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      {!preview ? (
        <div 
          onClick={triggerFileInput}
          style={{
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '40px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            backgroundColor: 'var(--bg-secondary)',
            transition: 'var(--transition-base)',
            opacity: isLoading ? 0.7 : 1,
            textAlign: 'center',
            minHeight: '200px'
          }}
        >
          <span style={{ fontSize: '48px', marginBottom: '16px' }}>📷</span>
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
            Tap to Capture or Upload
          </h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>
            Take a clear photo of the plant leaves, flowers, or fruit.
          </p>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            disabled={isLoading}
          />
        </div>
      ) : (
        <div style={{
          position: 'relative',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <img 
            src={preview} 
            alt="Captured plant preview" 
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '400px',
              objectFit: 'cover',
              display: 'block'
            }} 
          />
          {!isLoading && (
            <button
              onClick={handleRemove}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                backgroundColor: 'var(--danger)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                transition: 'var(--transition-base)'
              }}
            >
              Remove
            </button>
          )}
          {isLoading && (
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(10, 15, 13, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
              fontWeight: 'bold',
              fontSize: '20px',
              backdropFilter: 'blur(4px)'
            }}>
              <span style={{ animation: 'pulse 1.5s infinite' }}>Scanning Plant...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

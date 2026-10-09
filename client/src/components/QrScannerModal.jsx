import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const QrScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    let html5QrCode;

    if (isOpen) {
      setError('');
      setIsScanning(true);

      const timer = setTimeout(async () => {
        try {
          html5QrCode = new Html5Qrcode('qr-reader-viewport');
          scannerRef.current = html5QrCode;

          const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          };

          await html5QrCode.start(
            { facingMode: 'environment' },
            config,
            (decodedText) => {
              // Extract documentId if it's a full verify URL or direct ID
              let docId = decodedText.trim();
              if (docId.includes('/verify/')) {
                const parts = docId.split('/verify/');
                docId = parts[parts.length - 1].split('?')[0].split('#')[0];
              }

              // Stop scanner and notify parent
              html5QrCode
                .stop()
                .then(() => {
                  html5QrCode.clear();
                  onScanSuccess(docId);
                  onClose();
                })
                .catch((err) => {
                  console.warn('Error stopping scanner:', err);
                  onScanSuccess(docId);
                  onClose();
                });
            },
            (errorMessage) => {
              // Frame scan failure — safe to ignore during scanning
            }
          );
        } catch (err) {
          console.error('Camera startup error:', err);
          setIsScanning(false);
          if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
            setError(
              'Camera permission was denied. Please allow camera access in your browser settings to scan QR codes.'
            );
          } else if (err.name === 'NotFoundError' || err.message?.includes('device')) {
            setError('No camera detected on this device. Please enter the Document ID manually.');
          } else {
            setError('Unable to access camera: ' + (err.message || 'Unknown error'));
          }
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          try {
            scannerRef.current
              .stop()
              .then(() => scannerRef.current?.clear())
              .catch(() => {});
          } catch (e) {}
        }
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '460px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-xl)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>📷</span>
            <h3 style={{ fontSize: '1.125rem' }}>Scan Document QR Code</h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {error ? (
          <div className="alert alert-error" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <span>⚠️</span>
            <div>{error}</div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Point your device camera at the QR code on the certificate or document.
          </p>
        )}

        {/* Viewport for html5-qrcode */}
        <div
          id="qr-reader-viewport"
          style={{
            width: '100%',
            minHeight: '280px',
            backgroundColor: '#000000',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            marginBottom: '1rem',
          }}
        />

        <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
          Cancel / Close Scanner
        </button>
      </div>
    </div>
  );
};

export default QrScannerModal;

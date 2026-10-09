import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import QrScannerModal from '../components/QrScannerModal';

const PublicVerify = () => {
  const { documentId: urlDocId } = useParams();
  const navigate = useNavigate();

  const [searchId, setSearchId] = useState(urlDocId || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // File integrity check state (Feature 3.5)
  const [checkFile, setCheckFile] = useState(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkResult, setCheckResult] = useState(null);

  const handleCheckFileIntegrity = async (e) => {
    e.preventDefault();
    if (!checkFile || !result?.data?.documentId) return;

    setCheckLoading(true);
    setCheckResult(null);

    try {
      const formData = new FormData();
      formData.append('file', checkFile);

      const res = await api.post(
        `/verify/${result.data.documentId}/check-file`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      setCheckResult(res.data);
    } catch (err) {
      setCheckResult({
        match: false,
        message:
          err.response?.data?.error ||
          'Failed to perform file integrity check.',
      });
    } finally {
      setCheckLoading(false);
    }
  };

  const verifyDocument = async (idToVerify) => {
    const cleanId = idToVerify?.trim();
    if (!cleanId) return;

    setLoading(true);
    setError('');
    setResult(null);
    setHasSearched(true);

    try {
      const res = await api.get(`/verify/${cleanId}`);
      setResult(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setResult({
          valid: false,
          notFound: true,
          error:
            err.response.data?.error ||
            'No matching record found in the official registry.',
        });
      } else {
        setError(
          err.response?.data?.error ||
            'Failed to contact the verification service. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlDocId) {
      setSearchId(urlDocId);
      verifyDocument(urlDocId);
    }
  }, [urlDocId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/verify/${searchId.trim()}`);
      verifyDocument(searchId.trim());
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 4.25rem)',
        background: 'linear-gradient(180deg, #f0f4f9 0%, #f8fafc 100%)',
        padding: '2.5rem 1rem',
      }}
    >
      <div className="container" style={{ maxWidth: '780px' }}>
        {/* Header & Verification Search Bar */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0f3d75 0%, #1e5ba3 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              fontWeight: '800',
              margin: '0 auto 1.25rem',
              boxShadow: '0 4px 12px rgba(15, 61, 117, 0.25)',
            }}
          >
            ✓
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            Public Document Verification Portal
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '540px', margin: '0 auto' }}>
            Instant, cryptographic verification of official certificates, marksheets, and credentials.
          </p>
        </div>

        {/* Search input card */}
        <div
          className="card"
          style={{
            padding: '1.5rem',
            boxShadow: 'var(--shadow-md)',
            marginBottom: '2rem',
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            <input
              type="text"
              className="form-input"
              style={{
                flex: '1 1 280px',
                fontFamily: 'var(--font-mono)',
                fontSize: '1rem',
                textTransform: 'uppercase',
              }}
              placeholder="Enter Document ID (e.g. DOC-9EA2871A57)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              required
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ minWidth: '130px' }}
            >
              {loading ? 'Verifying...' : 'Verify Now'}
            </button>
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <span>📷</span> Scan QR
            </button>
          </form>
        </div>

        {/* QR Camera Scanner Modal */}
        <QrScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={(scannedId) => {
            setSearchId(scannedId);
            navigate(`/verify/${scannedId}`);
            verifyDocument(scannedId);
          }}
        />

        {/* General Error Alert */}
        {error && (
          <div className="alert alert-error">
            <span>⚠️</span>
            <div>{error}</div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                border: '4px solid #e2e8f0',
                borderTopColor: 'var(--primary)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 1rem',
              }}
            />
            <p style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>
              Checking cryptographic records in the registry...
            </p>
          </div>
        )}

        {/* Verification Result Display */}
        {!loading && hasSearched && result && (
          <div>
            {result.valid ? (
              /* ================== VALID RESULT CARD ================== */
              <div
                className="card"
                style={{
                  border: '2px solid var(--status-verified)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2rem',
                  boxShadow: '0 8px 24px rgba(5, 150, 105, 0.12)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Top Green Banner */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    paddingBottom: '1.5rem',
                    borderBottom: '1px solid var(--status-verified-border)',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'var(--status-verified-bg)',
                      border: '2px solid var(--status-verified)',
                      color: 'var(--status-verified)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.75rem',
                      fontWeight: 'bold',
                      flexShrink: 0,
                    }}
                  >
                    ✓
                  </div>
                  <div>
                    <span
                      style={{
                        background: 'var(--status-verified-bg)',
                        color: 'var(--status-verified)',
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--status-verified-border)',
                      }}
                    >
                      Authentic Credential
                    </span>
                    <h2
                      style={{
                        color: 'var(--status-verified)',
                        fontSize: '1.5rem',
                        marginTop: '0.35rem',
                      }}
                    >
                      Official Document is Valid
                    </h2>
                  </div>
                </div>

                {/* Certificate Details Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1.25rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Document ID
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.125rem', fontWeight: '700', color: 'var(--primary)' }}>
                      {result.data.documentId}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Document Title
                    </div>
                    <div style={{ fontSize: '1.0625rem', fontWeight: '700' }}>
                      {result.data.documentName}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Document Type
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: '600' }}>
                      {result.data.documentType}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Verified Holder Name
                    </div>
                    <div style={{ fontSize: '1.0625rem', fontWeight: '700' }}>
                      {result.data.holderName}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Issuing Authority
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: '600' }}>
                      {result.data.issuedBy}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Issue Date
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: '600' }}>
                      {new Date(result.data.issueDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Audit footnote */}
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      Verified by Official Reviewer:{' '}
                      <strong>{result.data.verifiedByName || 'Authorized Verifier'}</strong>
                    </div>
                    {result.data.verificationCount && (
                      <div style={{ color: 'var(--primary)', fontWeight: '600' }}>
                        👁️ Verified {result.data.verificationCount} times
                      </div>
                    )}
                  </div>
                  {result.data.remarks && (
                    <div style={{ marginTop: '0.25rem' }}>
                      Remarks: <em>"{result.data.remarks}"</em>
                    </div>
                  )}
                  {result.data.expiryDate && (
                    <div style={{ marginTop: '0.25rem' }}>
                      Expires on: {new Date(result.data.expiryDate).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Feature 3.5: SHA-256 File Integrity Checker */}
                {result.data.hasFileHash && (
                  <div
                    style={{
                      marginTop: '1.5rem',
                      paddingTop: '1.25rem',
                      borderTop: '1px solid var(--border-color)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <span style={{ fontSize: '1.125rem' }}>🔒</span>
                      <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                        Cryptographic File Integrity Verification (SHA-256)
                      </h3>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      Upload the digital certificate or PDF file you possess to check whether its binary content has been tampered with or altered.
                    </p>

                    <form onSubmit={handleCheckFileIntegrity} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <input
                        type="file"
                        accept=".pdf,image/png,image/jpeg,image/webp"
                        onChange={(e) => {
                          setCheckFile(e.target.files[0] || null);
                          setCheckResult(null);
                        }}
                        style={{ fontSize: '0.8125rem', flex: '1 1 220px' }}
                        required
                      />
                      <button
                        type="submit"
                        className="btn btn-secondary btn-sm"
                        disabled={checkLoading || !checkFile}
                      >
                        {checkLoading ? 'Computing Hash...' : 'Check File Integrity'}
                      </button>
                    </form>

                    {/* Hash Comparison Result */}
                    {checkResult && (
                      <div
                        style={{
                          marginTop: '1rem',
                          padding: '1rem',
                          borderRadius: 'var(--radius-md)',
                          background: checkResult.match ? '#ecfdf5' : '#fef2f2',
                          border: `1px solid ${checkResult.match ? '#a7f3d0' : '#fecaca'}`,
                          color: checkResult.match ? '#065f46' : '#991b1b',
                          fontSize: '0.8125rem',
                        }}
                      >
                        <div style={{ fontWeight: '700', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span>{checkResult.match ? '✅' : '🚨'}</span>
                          <span>{checkResult.message}</span>
                        </div>

                        {checkResult.computedHash && (
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                            <div>Computed Hash: {checkResult.computedHash}</div>
                            <div>Master Record: {checkResult.storedHash}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* ================== INVALID / NOT FOUND CARD ================== */
              <div
                className="card"
                style={{
                  border: '2px solid var(--status-rejected)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2rem',
                  boxShadow: '0 8px 24px rgba(220, 38, 38, 0.12)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    paddingBottom: '1.25rem',
                    borderBottom: '1px solid var(--status-rejected-border)',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'var(--status-rejected-bg)',
                      border: '2px solid var(--status-rejected)',
                      color: 'var(--status-rejected)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.75rem',
                      fontWeight: 'bold',
                      flexShrink: 0,
                    }}
                  >
                    ✕
                  </div>
                  <div>
                    <span
                      style={{
                        background: 'var(--status-rejected-bg)',
                        color: 'var(--status-rejected)',
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--status-rejected-border)',
                      }}
                    >
                      Verification Failed
                    </span>
                    <h2
                      style={{
                        color: 'var(--status-rejected)',
                        fontSize: '1.5rem',
                        marginTop: '0.35rem',
                      }}
                    >
                      {result.notFound ? 'Document Not Found' : 'Document is Invalid / Unverified'}
                    </h2>
                  </div>
                </div>

                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  {result.notFound
                    ? `No official document matching ID "${searchId}" exists in the verified database. Please check for typos or contact the issuing authority.`
                    : `This document exists in the system but its verification status is "${result.data?.verificationStatus}". Only documents with "Verified" status are considered valid.`}
                </p>

                {result.data && (
                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.875rem',
                    }}
                  >
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>Document Name:</strong> {result.data.documentName}
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>Holder:</strong> {result.data.holderName}
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>Current Status:</strong>{' '}
                      <span className={`badge badge-${result.data.verificationStatus?.toLowerCase()}`}>
                        {result.data.verificationStatus}
                      </span>
                    </div>
                    {result.data.remarks && (
                      <div>
                        <strong>Reason / Remarks:</strong> "{result.data.remarks}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicVerify;

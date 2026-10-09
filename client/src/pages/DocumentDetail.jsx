import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const DocumentDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [document, setDocument] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState(true);
  const [error, setError] = useState('');

  // Status review state (admin and verifier only)
  const [statusInput, setStatusInput] = useState('');
  const [remarksInput, setRemarksInput] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState('');
  const [statusError, setStatusError] = useState('');

  // Fetch document details
  const fetchDocument = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/documents/${id}`);
      if (res.data.success) {
        setDocument(res.data.data);
        setStatusInput(res.data.data.verificationStatus);
        setRemarksInput(res.data.data.remarks || '');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load document details.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch QR code
  const fetchQrCode = async (docId) => {
    try {
      setQrLoading(true);
      const res = await api.get(`/documents/${docId}/qr`);
      if (res.data.success) {
        setQrData(res.data);
      }
    } catch (err) {
      console.error('Failed to load QR code:', err);
    } finally {
      setQrLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [id]);

  useEffect(() => {
    if (document) {
      fetchQrCode(document._id);
    }
  }, [document?._id]);

  // Handle status update (verifier / admin)
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!statusInput) return;

    setStatusLoading(true);
    setStatusError('');
    setStatusSuccess('');

    try {
      const res = await api.patch(`/documents/${document._id}/status`, {
        status: statusInput,
        remarks: remarksInput,
      });

      if (res.data.success) {
        setDocument(res.data.data);
        setStatusSuccess(`Document status updated to ${statusInput} successfully.`);
        setTimeout(() => setStatusSuccess(''), 4000);
      }
    } catch (err) {
      setStatusError(
        err.response?.data?.error || 'Failed to update document status.'
      );
    } finally {
      setStatusLoading(false);
    }
  };

  // Generate and download PDF verification certificate
  const downloadCertificate = () => {
    if (!document || !qrData?.qrCode) return;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const pageHeight = 297;

    // Outer decorative border
    pdf.setDrawColor(15, 61, 117); // Navy blue
    pdf.setLineWidth(2.5);
    pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // Inner thin border
    pdf.setDrawColor(203, 213, 225); // Slate
    pdf.setLineWidth(0.5);
    pdf.rect(14, 14, pageWidth - 28, pageHeight - 28);

    // Header Background banner
    pdf.setFillColor(15, 61, 117);
    pdf.rect(15, 15, pageWidth - 30, 28, 'F');

    // Header text
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text('DIGITAL DOCUMENT VERIFICATION SYSTEM', pageWidth / 2, 27, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text('OFFICIAL CERTIFICATE OF AUTHENTICITY', pageWidth / 2, 35, { align: 'center' });

    // Certificate ID & Issue Date
    pdf.setTextColor(71, 85, 105);
    pdf.setFontSize(9);
    pdf.text(`VERIFICATION REF: ${document.documentId}`, 20, 52);
    pdf.text(`DATE ISSUED: ${new Date().toLocaleDateString()}`, pageWidth - 20, 52, { align: 'right' });

    // Status Ribbon
    pdf.setFillColor(236, 253, 245); // Emerald light bg
    pdf.setDrawColor(167, 243, 208);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(20, 58, pageWidth - 40, 16, 2, 2, 'FD');

    pdf.setTextColor(5, 150, 105); // Emerald green
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('STATUS: VERIFIED & AUTHENTIC', pageWidth / 2, 68, { align: 'center' });

    // Document Title
    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text(document.documentName, pageWidth / 2, 88, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Document Classification: ${document.documentType}`, pageWidth / 2, 95, { align: 'center' });

    // Divider line
    pdf.setDrawColor(226, 232, 240);
    pdf.line(25, 102, pageWidth - 25, 102);

    // Key Credential Fields
    const startY = 112;
    const lineSpacing = 12;

    const fields = [
      ['Certified Holder:', document.holderName],
      ['Holder Email:', document.holderEmail],
      ['Issuing Organization:', document.issuedBy],
      ['Document Issue Date:', new Date(document.issueDate).toLocaleDateString()],
      ['Verified By Official:', document.verifiedBy?.name || 'Authorized Verifier'],
      ['Verification Notes:', document.remarks || 'Original credentials checked and confirmed.'],
    ];

    fields.forEach(([label, value], idx) => {
      const currentY = startY + idx * lineSpacing;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(71, 85, 105);
      pdf.text(label, 30, currentY);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(15, 23, 42);
      pdf.text(value, 80, currentY);
    });

    // Embed QR Code
    const qrSize = 48;
    const qrX = (pageWidth - qrSize) / 2;
    const qrY = 195;

    pdf.addImage(qrData.qrCode, 'PNG', qrX, qrY, qrSize, qrSize);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(15, 61, 117);
    pdf.text('SCAN TO RE-VERIFY ONLINE', pageWidth / 2, qrY + qrSize + 6, { align: 'center' });

    pdf.setFont('courier', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(qrData.verifyUrl, pageWidth / 2, qrY + qrSize + 11, { align: 'center' });

    // Security footer disclaimer
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(7.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text(
      'This certificate was generated by the Digital Document Verification cryptographic audit engine.',
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    );

    pdf.save(`${document.documentId}_Certificate.pdf`);
  };

  // Download QR code image
  const downloadQr = () => {
    if (!qrData?.qrCode) return;
    const link = window.document.createElement('a');
    link.href = qrData.qrCode;
    link.download = `${document.documentId}_QR.png`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  // Print document card
  const printSheet = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            border: '3px solid #e2e8f0',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem',
          }}
        />
        <p style={{ color: 'var(--text-secondary)' }}>Loading document records...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '480px', margin: '0 auto', padding: '2.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ marginBottom: '0.5rem' }}>Document Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {error || 'The requested document does not exist or you do not have permission to view it.'}
          </p>
          <Link to="/dashboard" className="btn btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const canReview = user.role === 'admin' || user.role === 'verifier';

  return (
    <div className="container" style={{ padding: '2rem 1.25rem' }}>
      {/* Breadcrumb Navigation */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
        <Link to="/dashboard" style={{ color: 'var(--text-secondary)' }}>
          Dashboard
        </Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
          {document.documentId}
        </span>
      </div>

      {/* Main Grid: Details on Left, QR & Review on Right */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.75rem',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Details Card */}
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '1.25rem',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.875rem',
                  color: 'var(--primary)',
                  fontWeight: '700',
                  letterSpacing: '0.05em',
                }}
              >
                {document.documentId}
              </span>
              <h1 style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>
                {document.documentName}
              </h1>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Type: {document.documentType}
              </div>
            </div>

            <span className={`badge badge-${document.verificationStatus.toLowerCase()}`}>
              <span className="badge-dot" />
              {document.verificationStatus}
            </span>
          </div>

          {/* Key Information Fields */}
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Document Holder
                </div>
                <div style={{ fontSize: '1rem', fontWeight: '600', marginTop: '0.25rem' }}>
                  {document.holderName}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  {document.holderEmail}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Issuing Authority
                </div>
                <div style={{ fontSize: '1rem', fontWeight: '600', marginTop: '0.25rem' }}>
                  {document.issuedBy}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Issued: {new Date(document.issueDate).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div
              style={{
                background: '#f8fafc',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Verification Audit Details
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Status: </span>
                  <strong>{document.verificationStatus}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Verified By: </span>
                  <strong>{document.verifiedBy ? document.verifiedBy.name : 'Pending Review'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Public Checks: </span>
                  <strong>{document.verificationCount || 0} times scanned</strong>
                </div>
              </div>

              {document.remarks && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Reviewer Remarks:
                  </div>
                  <div style={{ fontSize: '0.875rem', fontStyle: 'italic', color: 'var(--text-primary)' }}>
                    "{document.remarks}"
                  </div>
                </div>
              )}
            </div>

            {/* Audit Trail Timeline for Admin and Verifier */}
            {canReview && document.auditTrail && document.auditTrail.length > 0 && (
              <div
                style={{
                  background: '#ffffff',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: '700',
                    color: 'var(--primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span>📜</span> Historical Audit Trail Timeline
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {document.auditTrail.map((log, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        position: 'relative',
                        paddingLeft: '0.5rem',
                        borderLeft: '2px solid var(--primary-border)',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: '700',
                              background: 'var(--primary-light)',
                              color: 'var(--primary)',
                              padding: '0.15rem 0.4rem',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            {log.action}
                          </span>
                          <span style={{ fontSize: '0.8125rem', fontWeight: '600' }}>
                            {log.performedByName || 'System'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          {log.details}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-muted)', paddingTop: '0.5rem' }}>
              <div>Submitted on: {new Date(document.createdAt).toLocaleString()}</div>
              <div>Last updated: {new Date(document.updatedAt).toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Right Column: QR Code Card & Status Management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* QR Code Verification Card */}
          <div className="card" style={{ textAlign: 'center', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>
              Authenticity QR Code
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
              Scan with any mobile camera to verify genuine record
            </p>

            <div
              style={{
                background: '#ffffff',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                display: 'inline-block',
                border: '2px solid var(--primary-light)',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '1rem',
              }}
            >
              {qrLoading ? (
                <div style={{ width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      border: '3px solid #e2e8f0',
                      borderTopColor: 'var(--primary)',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                </div>
              ) : qrData?.qrCode ? (
                <img
                  src={qrData.qrCode}
                  alt={`QR code for ${document.documentId}`}
                  style={{ width: '220px', height: '220px', display: 'block' }}
                />
              ) : (
                <div style={{ color: 'var(--status-rejected)' }}>QR generation failed</div>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {document.verificationStatus === 'Verified' && (
                <button
                  onClick={downloadCertificate}
                  className="btn btn-primary btn-sm"
                  style={{ background: 'var(--status-verified)' }}
                >
                  📜 Download Certificate
                </button>
              )}
              <button onClick={downloadQr} className="btn btn-secondary btn-sm" disabled={!qrData?.qrCode}>
                💾 Download QR
              </button>
              <button onClick={printSheet} className="btn btn-secondary btn-sm">
                🖨️ Print Sheet
              </button>
              <Link
                to={`/verify/${document.documentId}`}
                target="_blank"
                className="btn btn-outline btn-sm"
              >
                ↗ Open Public Verify
              </Link>
            </div>
          </div>

          {/* Review & Status Management Panel (Admin and Verifier ONLY) */}
          {canReview && (
            <div
              className="card"
              style={{
                border: '1px solid var(--primary-border)',
                background: '#ffffff',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>⚖️</span>
                <h3 style={{ fontSize: '1.0625rem' }}>
                  Official Review Console
                </h3>
              </div>

              {statusSuccess && (
                <div className="alert alert-success">
                  <span>✓</span>
                  <div>{statusSuccess}</div>
                </div>
              )}

              {statusError && (
                <div className="alert alert-error">
                  <span>⚠️</span>
                  <div>{statusError}</div>
                </div>
              )}

              <form onSubmit={handleStatusUpdate}>
                <div className="form-group">
                  <label className="form-label">Set Verification Status</label>
                  <select
                    className="form-select"
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value)}
                    required
                  >
                    <option value="Verified">Verified (Marks Valid)</option>
                    <option value="Pending">Pending (Under Review)</option>
                    <option value="Rejected">Rejected (Marks Invalid)</option>
                    <option value="Revoked">Revoked (Permanently Invalidate)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Review Remarks / Notes</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="Enter verification notes or reason for rejection/revocation..."
                    value={remarksInput}
                    onChange={(e) => setRemarksInput(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={statusLoading}
                >
                  {statusLoading ? 'Updating Status...' : 'Apply Status Decision'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentDetail;

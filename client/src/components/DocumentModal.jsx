import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const DocumentModal = ({ isOpen, onClose, onSuccess, initialDocument }) => {
  const { user } = useAuth();
  const isEdit = !!initialDocument;
  const isAdminOrVerifier = user?.role === 'admin' || user?.role === 'verifier';

  const [formData, setFormData] = useState({
    documentName: '',
    documentType: 'Certificate',
    holderName: '',
    holderEmail: '',
    issuedBy: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    verificationStatus: 'Verified',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialDocument) {
      setFormData({
        documentName: initialDocument.documentName || '',
        documentType: initialDocument.documentType || 'Certificate',
        holderName: initialDocument.holderName || '',
        holderEmail: initialDocument.holderEmail || '',
        issuedBy: initialDocument.issuedBy || '',
        issueDate: initialDocument.issueDate
          ? new Date(initialDocument.issueDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        expiryDate: initialDocument.expiryDate
          ? new Date(initialDocument.expiryDate).toISOString().split('T')[0]
          : '',
        verificationStatus: initialDocument.verificationStatus || 'Verified',
      });
    } else {
      setFormData({
        documentName: '',
        documentType: 'Certificate',
        holderName: '',
        holderEmail: '',
        issuedBy: '',
        issueDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        verificationStatus: isAdminOrVerifier ? 'Verified' : 'Pending',
      });
    }
    setSelectedFile(null);
    setError('');
  }, [initialDocument, isOpen, isAdminOrVerifier]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { documentName, documentType, holderName, holderEmail, issuedBy, issueDate, expiryDate, verificationStatus } = formData;

    if (!documentName || !documentType || !holderName || !holderEmail || !issuedBy || !issueDate) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('documentName', documentName);
      data.append('documentType', documentType);
      data.append('holderName', holderName);
      data.append('holderEmail', holderEmail);
      data.append('issuedBy', issuedBy);
      data.append('issueDate', issueDate);
      if (verificationStatus) data.append('verificationStatus', verificationStatus);
      if (expiryDate) data.append('expiryDate', expiryDate);
      if (selectedFile) data.append('file', selectedFile);

      if (isEdit) {
        await api.put(`/documents/${initialDocument._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/documents', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-xl)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <h2 style={{ fontSize: '1.25rem' }}>
            {isEdit ? 'Edit Document' : 'Submit New Document'}
          </h2>
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

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="documentName">
              Document Name *
            </label>
            <input
              id="documentName"
              type="text"
              name="documentName"
              className="form-input"
              placeholder="e.g. Bachelor of Technology Degree"
              value={formData.documentName}
              onChange={handleChange}
              required
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}
          >
            <div className="form-group">
              <label className="form-label" htmlFor="documentType">
                Document Type *
              </label>
              <select
                id="documentType"
                name="documentType"
                className="form-select"
                value={formData.documentType}
                onChange={handleChange}
                required
              >
                <option value="Certificate">Certificate</option>
                <option value="Marksheet">Marksheet</option>
                <option value="ID Proof">ID Proof</option>
                <option value="License">License</option>
                <option value="Diploma">Diploma</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="issueDate">
                Issue Date *
              </label>
              <input
                id="issueDate"
                type="date"
                name="issueDate"
                className="form-input"
                value={formData.issueDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}
          >
            <div className="form-group">
              <label className="form-label" htmlFor="issueDate">
                Issue Date *
              </label>
              <input
                id="issueDate"
                type="date"
                name="issueDate"
                className="form-input"
                value={formData.issueDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="expiryDate">
                Expiry Date (Optional)
              </label>
              <input
                id="expiryDate"
                type="date"
                name="expiryDate"
                className="form-input"
                value={formData.expiryDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="holderName">
              Document Holder Name *
            </label>
            <input
              id="holderName"
              type="text"
              name="holderName"
              className="form-input"
              placeholder="e.g. Alice Smith"
              value={formData.holderName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="holderEmail">
              Holder Email Address *
            </label>
            <input
              id="holderEmail"
              type="email"
              name="holderEmail"
              className="form-input"
              placeholder="alice@example.com"
              value={formData.holderEmail}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="issuedBy">
              Issuing Organization / Authority *
            </label>
            <input
              id="issuedBy"
              type="text"
              name="issuedBy"
              className="form-input"
              placeholder="e.g. National Board of Higher Education"
              value={formData.issuedBy}
              onChange={handleChange}
              required
            />
          </div>

          {/* Optional File Attachment (Feature 3.5: SHA-256 Hashing) */}
          <div
            className="form-group"
            style={{
              background: '#f8fafc',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-color)',
            }}
          >
            <label className="form-label" htmlFor="docFile">
              Attach Original File (PDF or Image)
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              The server will calculate and store a SHA-256 cryptographic hash to enable tamper-detection on the verify portal.
            </p>
            <input
              id="docFile"
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp"
              onChange={(e) => setSelectedFile(e.target.files[0] || null)}
              style={{ fontSize: '0.875rem' }}
            />
            {selectedFile && (
              <div style={{ marginTop: '0.35rem', fontSize: '0.8125rem', color: 'var(--primary)', fontWeight: '600' }}>
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading
                ? isEdit
                  ? 'Updating...'
                  : 'Submitting...'
                : isEdit
                ? 'Update Document'
                : 'Submit Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentModal;

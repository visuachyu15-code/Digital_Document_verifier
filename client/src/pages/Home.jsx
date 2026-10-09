import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Home = () => {
  const [docId, setDocId] = useState('');
  const [activeTab, setActiveTab] = useState('visitor');
  const navigate = useNavigate();

  const handleVerify = (e) => {
    e.preventDefault();
    if (docId.trim()) {
      navigate(`/verify/${docId.trim()}`);
    }
  };

  const fillSample = (sampleId) => {
    setDocId(sampleId);
  };

  return (
    <div style={{ background: '#f8fafc', color: 'var(--text-primary)', minHeight: '100vh' }}>
      
      {/* 🌟 HERO SECTION (Trustworthy Deep Navy Theme) */}
      <section
        style={{
          background: 'linear-gradient(180deg, #0f3d75 0%, #0a2c56 100%)',
          color: '#ffffff',
          padding: '4.5rem 1.25rem 5rem',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <div className="container" style={{ maxWidth: '860px' }}>
          
          {/* Trust pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(8px)',
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8125rem',
              fontWeight: '600',
              marginBottom: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <span>🛡️</span> Cryptographic Digital Document Verification Portal
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.2rem, 4.5vw, 3.2rem)',
              fontWeight: '800',
              color: '#ffffff',
              letterSpacing: '-0.03em',
              marginBottom: '1.25rem',
              lineHeight: 1.15,
            }}
          >
            Instant, Tamper-Proof Digital Document Verification
          </h1>

          <p
            style={{
              fontSize: '1.125rem',
              color: '#cbd5e1',
              maxWidth: '640px',
              margin: '0 auto 2.5rem',
              lineHeight: 1.6,
            }}
          >
            Verify certificates, academic marksheets, and official credentials in
            seconds. Scan any document QR code or enter a Document ID directly.
          </p>

          {/* 🔍 Hero Search Box */}
          <div
            style={{
              background: '#ffffff',
              padding: '0.625rem',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 20px 35px -10px rgba(0, 0, 0, 0.3)',
              maxWidth: '580px',
              margin: '0 auto 1.5rem',
            }}
          >
            <form
              onSubmit={handleVerify}
              style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
              }}
            >
              <input
                type="text"
                placeholder="Enter Document ID (e.g. DOC-37DCD695B1)"
                value={docId}
                onChange={(e) => setDocId(e.target.value)}
                style={{
                  flex: '1 1 240px',
                  border: 'none',
                  outline: 'none',
                  padding: '0.75rem 1rem',
                  fontSize: '0.9375rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                }}
                required
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.5rem', fontWeight: '700' }}
              >
                🔍 Verify Document
              </button>
            </form>
          </div>

          {/* Demo Quick Samples */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              fontSize: '0.8125rem',
              color: '#94a3b8',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ color: '#cbd5e1', fontWeight: '600' }}>Quick sample search:</span>
            <button
              type="button"
              onClick={() => fillSample('DOC-37DCD695B1')}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#ffffff',
                padding: '0.3rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: '600',
                fontFamily: 'var(--font-mono)',
              }}
            >
              📄 DOC-37DCD695B1 (Inter Marksheet)
            </button>
            <button
              type="button"
              onClick={() => fillSample('DOC-44095080BB')}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#ffffff',
                padding: '0.3rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: '600',
                fontFamily: 'var(--font-mono)',
              }}
            >
              🎓 DOC-44095080BB (CS Degree)
            </button>
            <Link
              to="/verify"
              style={{ color: '#93c5fd', textDecoration: 'underline', fontWeight: '600', marginLeft: '0.25rem' }}
            >
              📷 Open Camera Scanner
            </Link>
          </div>

        </div>
      </section>

      {/* 📘 USER GUIDE & HOW TO USE THE WEB APP */}
      <section style={{ padding: '4.5rem 1.25rem', background: '#ffffff', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span
              style={{
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8125rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              📖 How to Use The Application
            </span>
            <h2 style={{ fontSize: '2.25rem', marginTop: '0.5rem', fontWeight: '800' }}>
              Select Your Role for Quick Instructions
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '580px', margin: '0.5rem auto 0', fontSize: '1rem' }}>
              Click any of the roles below to see exact step-by-step guidance:
            </p>
          </div>

          {/* Role Tabs */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '2rem',
              flexWrap: 'wrap',
            }}
          >
            {[
              { id: 'visitor', label: '🌐 Public Visitor (No Login)', icon: '🔍' },
              { id: 'user', label: '👤 User / Applicant', icon: '📝' },
              { id: 'verifier', label: '🔍 Verifier Role', icon: '✅' },
              { id: 'admin', label: '👑 Admin Role', icon: '⚡' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: '700',
                  fontSize: '0.9375rem',
                  cursor: 'pointer',
                  border: activeTab === tab.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  background: activeTab === tab.id ? 'var(--primary-light)' : '#ffffff',
                  color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                  boxShadow: activeTab === tab.id ? '0 4px 12px rgba(15, 61, 117, 0.12)' : 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Card */}
          <div className="card" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
            
            {activeTab === 'visitor' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '2rem' }}>🔍</span>
                  <div>
                    <h3 style={{ fontSize: '1.35rem', margin: 0 }}>Public Document Verification (No Login Needed)</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', margin: 0 }}>
                      Anyone can verify if a document is authentic without logging in.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginTop: '1.75rem' }}>
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: '700', color: 'var(--primary)', marginBottom: '0.35rem' }}>Step 1: Enter ID or Scan QR</div>
                    <div style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                      Enter <code>DOC-37DCD695B1</code> in the search bar or click <b>"Scan QR Code"</b> to open your device camera.
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: '700', color: 'var(--status-verified)', marginBottom: '0.35rem' }}>Step 2: Green "VALID" Result</div>
                    <div style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                      Renders a green <b>VALID</b> certificate card displaying holder details, issuer, and reviewer notes.
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: '700', color: '#0284c7', marginBottom: '0.35rem' }}>Step 3: Check File Integrity</div>
                    <div style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                      Upload your PDF/image to calculate its <b>SHA-256 hash</b> and confirm the file hasn't been edited.
                    </div>
                  </div>
                </div>
                
                <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
                  <Link to="/verify/DOC-37DCD695B1" className="btn btn-primary" style={{ padding: '0.625rem 1.5rem' }}>
                    🚀 Try Public Verification →
                  </Link>
                </div>
              </div>
            )}

            {activeTab === 'user' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '2rem' }}>📝</span>
                  <div>
                    <h3 style={{ fontSize: '1.35rem', margin: 0 }}>User / Applicant Guide</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', margin: 0 }}>
                      Submit your credentials and track their review status.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginTop: '1.75rem' }}>
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: '700', color: 'var(--primary)', marginBottom: '0.35rem' }}>1. Sign In</div>
                    <div style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                      Log in using <code>user@demo.com</code> / <code>password123</code>.
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: '700', color: 'var(--primary)', marginBottom: '0.35rem' }}>2. Add Document</div>
                    <div style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                      Click <b>"+ Add Document"</b> on your dashboard to submit your mark sheet or certificate.
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: '700', color: 'var(--status-pending)', marginBottom: '0.35rem' }}>3. Pending Review</div>
                    <div style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                      Newly submitted records start in <b>Pending</b> status until reviewed by a Verifier or Admin.
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
                  <Link to="/login" className="btn btn-primary" style={{ padding: '0.625rem 1.5rem' }}>
                    👤 Sign In as Demo User →
                  </Link>
                </div>
              </div>
            )}

            {activeTab === 'verifier' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '2rem' }}>✅</span>
                  <div>
                    <h3 style={{ fontSize: '1.35rem', margin: 0 }}>Verifier Role Guide</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', margin: 0 }}>
                      Review submitted credentials, assign verification status, and generate PDF certificates.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginTop: '1.75rem' }}>
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: '700', color: 'var(--primary)', marginBottom: '0.35rem' }}>1. Sign In</div>
                    <div style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                      Log in using <code>verifier@demo.com</code> / <code>password123</code>.
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: '700', color: 'var(--status-verified)', marginBottom: '0.35rem' }}>2. Update Status</div>
                    <div style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                      Open any document detail page, select <b>Verified</b>, enter remarks, and save.
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: '700', color: '#0284c7', marginBottom: '0.35rem' }}>3. Download Certificate</div>
                    <div style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                      Download official PDF certificate with embedded QR code.
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
                  <Link to="/login" className="btn btn-primary" style={{ padding: '0.625rem 1.5rem' }}>
                    🔍 Sign In as Demo Verifier →
                  </Link>
                </div>
              </div>
            )}

            {activeTab === 'admin' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '2rem' }}>👑</span>
                  <div>
                    <h3 style={{ fontSize: '1.35rem', margin: 0 }}>System Administrator Guide</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', margin: 0 }}>
                      Full administrative permissions across all records and user accounts.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginTop: '1.75rem' }}>
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: '700', color: 'var(--primary)', marginBottom: '0.35rem' }}>1. Sign In</div>
                    <div style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                      Log in using <code>admin@demo.com</code> / <code>password123</code>.
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: '700', color: 'var(--status-verified)', marginBottom: '0.35rem' }}>2. Direct Verified Creation</div>
                    <div style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                      Add new documents directly as <b>Verified</b> upon creation.
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: '700', color: '#dc2626', marginBottom: '0.35rem' }}>3. User Management</div>
                    <div style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                      Manage user roles (Admin/Verifier/User) on the Users page.
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
                  <Link to="/login" className="btn btn-primary" style={{ padding: '0.625rem 1.5rem' }}>
                    👑 Sign In as Demo Admin →
                  </Link>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* 3-STEP PIPELINE SECTION */}
      <section style={{ padding: '4.5rem 1.25rem', background: '#f8fafc' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span
              style={{
                color: 'var(--primary)',
                fontSize: '0.8125rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Streamlined Architecture
            </span>
            <h2 style={{ fontSize: '2rem', marginTop: '0.35rem' }}>
              How Digital Verification Works
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0.5rem auto 0' }}>
              A 3-step pipeline guaranteeing document authenticity and immediate validation
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem',
            }}
          >
            {/* Step 1 */}
            <div className="card" style={{ padding: '2rem', position: 'relative' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: '800',
                  marginBottom: '1.25rem',
                }}
              >
                1
              </div>
              <h3 style={{ fontSize: '1.1875rem', marginBottom: '0.5rem' }}>
                Create Unique Identifier
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                Every submitted certificate or credential receives an automatically
                generated, unique identifier (e.g. <code>DOC-XXXXXXXXXX</code>) stored in
                MongoDB.
              </p>
            </div>

            {/* Step 2 */}
            <div className="card" style={{ padding: '2rem', position: 'relative' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: '800',
                  marginBottom: '1.25rem',
                }}
              >
                2
              </div>
              <h3 style={{ fontSize: '1.1875rem', marginBottom: '0.5rem' }}>
                QR Code Generation
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                The server encodes the permanent public URL into a high-density QR code
                graphic. Certified verifiers review records and assign verified status.
              </p>
            </div>

            {/* Step 3 */}
            <div className="card" style={{ padding: '2rem', position: 'relative' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'var(--status-verified-bg)',
                  color: 'var(--status-verified)',
                  border: '1px solid var(--status-verified-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: '800',
                  marginBottom: '1.25rem',
                }}
              >
                3
              </div>
              <h3 style={{ fontSize: '1.1875rem', marginBottom: '0.5rem' }}>
                Instant Public Verification
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                Anyone scans the QR code with any smartphone camera. Without needing to log
                in, the public verify page renders a Valid or Invalid certificate result.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          background: '#0f172a',
          color: '#94a3b8',
          padding: '2.5rem 1.25rem',
          textAlign: 'center',
          fontSize: '0.875rem',
        }}
      >
        <div className="container">
          <div style={{ fontWeight: '700', color: '#ffffff', fontSize: '1rem', marginBottom: '0.5rem' }}>
            DocuVerify — Digital Document Verification System
          </div>
          <div>MERN Stack Architecture • MongoDB • Express • React • Node.js</div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

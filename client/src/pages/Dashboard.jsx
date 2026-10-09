import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import DocumentModal from '../components/DocumentModal';

const Dashboard = () => {
  const { user } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    revoked: 0,
  });

  const [charts, setCharts] = useState({
    statusChart: [],
    typeChart: [],
  });
  const [chartsLoading, setChartsLoading] = useState(true);

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters and search
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch document statistics
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await api.get('/documents/stats');
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch chart aggregations
  const fetchCharts = async () => {
    try {
      setChartsLoading(true);
      const res = await api.get('/documents/charts');
      if (res.data.success) {
        setCharts({
          statusChart: res.data.statusChart || [],
          typeChart: res.data.typeChart || [],
        });
      }
    } catch (err) {
      console.error('Failed to fetch charts:', err);
    } finally {
      setChartsLoading(false);
    }
  };

  // Fetch documents list with filters
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== 'All') params.status = statusFilter;
      if (typeFilter !== 'All') params.type = typeFilter;

      const res = await api.get('/documents', { params });
      if (res.data.success) {
        setDocuments(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, typeFilter]);

  useEffect(() => {
    fetchStats();
    fetchCharts();
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleOpenCreateModal = () => {
    setEditingDoc(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (doc) => {
    setEditingDoc(doc);
    setIsModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/documents/${id}`);
        fetchDocuments();
        fetchStats();
        fetchCharts();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete document.');
      }
    }
  };

  const handleModalSuccess = () => {
    fetchDocuments();
    fetchStats();
    fetchCharts();
  };

  // Helper function to check if user can edit a document
  const canEdit = (doc) => {
    if (user.role === 'admin') return true;
    if (user.role === 'user' && doc.verificationStatus === 'Pending') {
      const creatorId = typeof doc.createdBy === 'object' ? doc.createdBy._id : doc.createdBy;
      return creatorId === user._id;
    }
    return false;
  };

  // Helper function to check if user can delete a document
  const canDelete = (doc) => {
    if (user.role === 'admin') return true;
    if (user.role === 'user' && doc.verificationStatus === 'Pending') {
      const creatorId = typeof doc.createdBy === 'object' ? doc.createdBy._id : doc.createdBy;
      return creatorId === user._id;
    }
    return false;
  };

  return (
    <div className="container" style={{ padding: '2rem 1.25rem' }}>
      {/* Header section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
            {user.role === 'admin'
              ? 'Administrator Dashboard'
              : user.role === 'verifier'
              ? 'Verifier Review Console'
              : 'My Verified Documents'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            {user.role === 'admin'
              ? 'Oversee all submitted documents, manage roles, and review records.'
              : user.role === 'verifier'
              ? 'Review pending credentials, mark valid or reject with feedback.'
              : 'Manage and track verification status of your credentials.'}
          </p>
        </div>

        {/* Create button (users & admins) */}
        {user.role !== 'verifier' && (
          <button onClick={handleOpenCreateModal} className="btn btn-primary">
            <span>+</span> Submit New Document
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {/* Total Card */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: '700', textTransform: 'uppercase' }}>
            Total Documents
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)', marginTop: '0.375rem' }}>
            {statsLoading ? '—' : stats.total}
          </div>
        </div>

        {/* Verified Card */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--status-verified)' }}>
          <div style={{ color: 'var(--status-verified)', fontSize: '0.8125rem', fontWeight: '700', textTransform: 'uppercase' }}>
            Verified (Valid)
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--status-verified)', marginTop: '0.375rem' }}>
            {statsLoading ? '—' : stats.verified}
          </div>
        </div>

        {/* Pending Card */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--status-pending)' }}>
          <div style={{ color: 'var(--status-pending)', fontSize: '0.8125rem', fontWeight: '700', textTransform: 'uppercase' }}>
            Pending Review
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--status-pending)', marginTop: '0.375rem' }}>
            {statsLoading ? '—' : stats.pending}
          </div>
        </div>

        {/* Rejected Card */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--status-rejected)' }}>
          <div style={{ color: 'var(--status-rejected)', fontSize: '0.8125rem', fontWeight: '700', textTransform: 'uppercase' }}>
            Rejected
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--status-rejected)', marginTop: '0.375rem' }}>
            {statsLoading ? '—' : stats.rejected}
          </div>
        </div>

        {/* Revoked Card */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--status-revoked)' }}>
          <div style={{ color: 'var(--status-revoked)', fontSize: '0.8125rem', fontWeight: '700', textTransform: 'uppercase' }}>
            Revoked
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--status-revoked)', marginTop: '0.375rem' }}>
            {statsLoading ? '—' : stats.revoked}
          </div>
        </div>
      </div>

      {/* Analytics Charts (Feature 3.4) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {/* Status Donut Chart */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.0625rem', marginBottom: '0.25rem' }}>
            Documents by Verification Status
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
            Distribution of authentic vs. pending/rejected records
          </p>

          <div style={{ width: '100%', height: '220px' }}>
            {chartsLoading ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading analytics...</p>
              </div>
            ) : charts.statusChart.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No records to chart</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.statusChart}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {charts.statusChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: 'var(--shadow-md)',
                      fontSize: '0.8125rem',
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '0.8125rem' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Type Bar Chart */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.0625rem', marginBottom: '0.25rem' }}>
            Documents by Category Type
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
            Volume breakdown across credentials and proof categories
          </p>

          <div style={{ width: '100%', height: '220px' }}>
            {chartsLoading ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading analytics...</p>
              </div>
            ) : charts.typeChart.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No records to chart</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.typeChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: 'var(--shadow-md)',
                      fontSize: '0.8125rem',
                    }}
                  />
                  <Bar dataKey="count" fill="#0f3d75" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Search */}
        <div style={{ flex: '1 1 280px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by ID (DOC-...), name, holder, or issuer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div style={{ minWidth: '150px' }}>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
            <option value="Revoked">Revoked</option>
          </select>
        </div>

        {/* Type Filter */}
        <div style={{ minWidth: '150px' }}>
          <select
            className="form-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="Certificate">Certificate</option>
            <option value="Marksheet">Marksheet</option>
            <option value="ID Proof">ID Proof</option>
            <option value="License">License</option>
            <option value="Diploma">Diploma</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Reset button */}
        {(search || statusFilter !== 'All' || typeFilter !== 'All') && (
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('All');
              setTypeFilter('All');
            }}
            className="btn btn-secondary btn-sm"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Documents Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {error && (
          <div style={{ padding: '1.25rem' }}>
            <div className="alert alert-error">{error}</div>
          </div>
        )}

        {loading ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
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
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Loading documents...
            </p>
          </div>
        ) : documents.length === 0 ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📄</div>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.375rem' }}>
              No documents found
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              {search || statusFilter !== 'All' || typeFilter !== 'All'
                ? 'Try adjusting your search query or filter options.'
                : 'Submit your first document to get started.'}
            </p>
            {user.role !== 'verifier' && (
              <button onClick={handleOpenCreateModal} className="btn btn-primary btn-sm">
                + Submit Document
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.875rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: '#f8fafc',
                    borderBottom: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    fontWeight: '700',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <th style={{ padding: '0.875rem 1.25rem' }}>Document ID</th>
                  <th style={{ padding: '0.875rem 1.25rem' }}>Title & Type</th>
                  <th style={{ padding: '0.875rem 1.25rem' }}>Holder</th>
                  <th style={{ padding: '0.875rem 1.25rem' }}>Issued By</th>
                  <th style={{ padding: '0.875rem 1.25rem' }}>Status</th>
                  <th style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr
                    key={doc._id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Document ID with Mono font */}
                    <td style={{ padding: '1rem 1.25rem', fontFamily: 'var(--font-mono)', fontWeight: '600', color: 'var(--primary)' }}>
                      <Link to={`/documents/${doc.documentId}`} style={{ color: 'inherit' }}>
                        {doc.documentId}
                      </Link>
                    </td>

                    {/* Title and Type */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        {doc.documentName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {doc.documentType}
                      </div>
                    </td>

                    {/* Holder */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: '500' }}>{doc.holderName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {doc.holderEmail}
                      </div>
                    </td>

                    {/* Issued By */}
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)' }}>
                      {doc.issuedBy}
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span className={`badge badge-${doc.verificationStatus.toLowerCase()}`}>
                        <span className="badge-dot" />
                        {doc.verificationStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <Link
                          to={`/documents/${doc.documentId}`}
                          className="btn btn-secondary btn-sm"
                        >
                          View
                        </Link>

                        {canEdit(doc) && (
                          <button
                            onClick={() => handleOpenEditModal(doc)}
                            className="btn btn-outline btn-sm"
                          >
                            Edit
                          </button>
                        )}

                        {canDelete(doc) && (
                          <button
                            onClick={() => handleDelete(doc._id, doc.documentName)}
                            className="btn btn-danger btn-sm"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Document Modal */}
      <DocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        initialDocument={editingDoc}
      />
    </div>
  );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Users = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/users');
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      setError('');
      const res = await api.patch(`/users/${userId}/role`, { role: newRole });
      if (res.data.success) {
        setSuccess(`User role updated to ${newRole}`);
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user role.');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (
      window.confirm(
        `Are you sure you want to delete user "${userName}"? This cannot be undone.`
      )
    ) {
      try {
        setError('');
        const res = await api.delete(`/users/${userId}`);
        if (res.data.success) {
          setSuccess(`User ${userName} deleted successfully.`);
          fetchUsers();
          setTimeout(() => setSuccess(''), 3000);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete user.');
      }
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1.25rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
          User Account Management
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage user permissions, assign verifiers, and maintain portal access.
        </p>
      </div>

      {success && (
        <div className="alert alert-success">
          <span>✓</span>
          <div>{success}</div>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span>⚠️</span>
          <div>{error}</div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
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
            <p style={{ color: 'var(--text-secondary)' }}>Loading accounts...</p>
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
                  <th style={{ padding: '0.875rem 1.25rem' }}>Name</th>
                  <th style={{ padding: '0.875rem 1.25rem' }}>Email</th>
                  <th style={{ padding: '0.875rem 1.25rem' }}>Current Role</th>
                  <th style={{ padding: '0.875rem 1.25rem' }}>Registered On</th>
                  <th style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u._id === currentUser?._id;

                  return (
                    <tr
                      key={u._id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      <td style={{ padding: '1rem 1.25rem', fontWeight: '600' }}>
                        {u.name}{' '}
                        {isSelf && (
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              background: '#f1f5f9',
                              color: 'var(--primary)',
                              padding: '0.15rem 0.4rem',
                              borderRadius: 'var(--radius-sm)',
                              marginLeft: '0.35rem',
                            }}
                          >
                            You
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)' }}>
                        {u.email}
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span className={`badge badge-role badge-role-${u.role}`}>
                          {u.role}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                          }}
                        >
                          {/* Role selector dropdown */}
                          <select
                            value={u.role}
                            disabled={isSelf}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            className="form-select"
                            style={{
                              padding: '0.3rem 0.5rem',
                              fontSize: '0.8125rem',
                              width: 'auto',
                            }}
                            title={isSelf ? 'Cannot change your own role' : 'Change user role'}
                          >
                            <option value="user">User</option>
                            <option value="verifier">Verifier</option>
                            <option value="admin">Admin</option>
                          </select>

                          {/* Delete button */}
                          <button
                            disabled={isSelf}
                            onClick={() => handleDeleteUser(u._id, u.name)}
                            className="btn btn-danger btn-sm"
                            title={isSelf ? 'Cannot delete your own account' : 'Delete user'}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      style={{
        background: '#ffffff',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '4.25rem',
        }}
      >
        {/* Brand / Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0f3d75 0%, #1e5ba3 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: '800',
              fontSize: '1.125rem',
              boxShadow: '0 2px 4px rgba(15, 61, 117, 0.25)',
            }}
          >
            ✓
          </div>
          <div>
            <div
              style={{
                fontSize: '1.0625rem',
                fontWeight: '800',
                color: 'var(--primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              DocuVerify
            </div>
            <div
              style={{
                fontSize: '0.6875rem',
                fontWeight: '600',
                color: 'var(--text-muted)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Secure Verification System
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
          }}
          className="desktop-menu"
        >
          <Link
            to="/verify"
            style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: isActive('/verify') ? 'var(--primary)' : 'var(--text-secondary)',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: isActive('/verify') ? 'var(--primary-light)' : 'transparent',
            }}
          >
            Public Verify
          </Link>

          {user ? (
            <>
              <Link
                to="/dashboard"
                style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: isActive('/dashboard') ? 'var(--primary)' : 'var(--text-secondary)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: isActive('/dashboard') ? 'var(--primary-light)' : 'transparent',
                }}
              >
                Dashboard
              </Link>

              {/* Users only visible to Admin */}
              {user.role === 'admin' && (
                <Link
                  to="/users"
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: isActive('/users') ? 'var(--primary)' : 'var(--text-secondary)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: isActive('/users') ? 'var(--primary-light)' : 'transparent',
                  }}
                >
                  Manage Users
                </Link>
              )}

              {/* User Profile Info & Role */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  paddingLeft: '0.75rem',
                  borderLeft: '1px solid var(--border-color)',
                }}
              >
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {user.name}
                  </div>
                  <span className={`badge badge-role badge-role-${user.role}`}>
                    {user.role}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                  title="Sign out"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

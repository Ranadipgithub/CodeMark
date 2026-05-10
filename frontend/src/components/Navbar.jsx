import { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Menu, X } from 'lucide-react';
import logoImg from '../assets/logo.png';

const Navbar = () => {
  const { user, api, setUser } = useContext(AuthContext);
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  const navLinks = [
    { label: 'My Dashboard', to: '/dashboard' },
    { label: 'Revision Queue', to: '/queue' },
    // { label: 'Statistics', to: '#', comingSoon: true },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(14,14,14,0.6)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <nav
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 48px',
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          id="nav-logo"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            textDecoration: 'none',
          }}
        >
          <img
            src={logoImg}
            alt="CodeMark"
            style={{
              height: 100,
              width: 'auto',
              objectFit: 'contain',
            }}
          />
        </Link>

        {/* Desktop Nav Links */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
          className="nav-desktop"
        >
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              id={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
              style={{
                position: 'relative',
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 500,
                borderRadius: 8,
                textDecoration: 'none',
                transition: 'all 0.2s',
                color: isActive(link.to) ? '#fff' : 'rgba(255,255,255,0.45)',
                background: isActive(link.to) ? 'rgba(255,255,255,0.08)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive(link.to)) {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(link.to)) {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {link.label}
              {link.comingSoon && (
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#f59e0b',
                  }}
                  className="animate-glow-pulse"
                />
              )}
            </Link>
          ))}
        </div>

        {/* Right Side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user ? (
            <button
              onClick={handleLogout}
              id="nav-logout"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                fontSize: 14,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.45)',
                background: 'transparent',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <LogOut size={16} />
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              id="nav-login"
              style={{
                padding: '8px 20px',
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                background: 'linear-gradient(135deg, #4ADE80, #14b8a6)',
                borderRadius: 8,
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(74,222,128,0.2)',
                transition: 'all 0.2s',
              }}
            >
              Sign In
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            id="nav-mobile-toggle"
            style={{
              display: 'none',
              padding: 8,
              color: 'rgba(255,255,255,0.6)',
              background: 'transparent',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
            }}
            className="nav-mobile-toggle"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(14,14,14,0.95)',
            backdropFilter: 'blur(20px)',
            padding: '16px 48px',
          }}
          className="animate-slide-up"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                style={{
                  padding: '12px 16px',
                  fontSize: 14,
                  fontWeight: 500,
                  borderRadius: 8,
                  textDecoration: 'none',
                  color: isActive(link.to) ? '#fff' : 'rgba(255,255,255,0.45)',
                  background: isActive(link.to) ? 'rgba(255,255,255,0.08)' : 'transparent',
                }}
              >
                {link.label}
                {link.comingSoon && (
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 10,
                      color: '#f59e0b',
                      background: 'rgba(245,158,11,0.1)',
                      padding: '2px 8px',
                      borderRadius: 99,
                    }}
                  >
                    Soon
                  </span>
                )}
              </Link>
            ))}
            {user ? (
              <button
                onClick={() => { handleLogout(); setMobileOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 16px',
                  fontSize: 14,
                  color: '#FF375F',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <LogOut size={15} />
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                style={{
                  padding: '12px 16px',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#4ADE80',
                  textDecoration: 'none',
                  borderRadius: 8,
                }}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-toggle { display: flex !important; }
        }
      `}</style>
    </header>
  );
};

export default Navbar;

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuth';
import { Button } from './ui/Button';

export const Header: React.FC = () => {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 focus-ring rounded-lg" aria-label="CropSage home">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">CropSage</span>
          </Link>

          {/* Desktop nav */}
          {user ? (
            <div className="hidden sm:flex items-center gap-4">
              <nav className="flex items-center gap-1" aria-label="Main navigation">
                <Link to="/dashboard" className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus-ring">
                  Dashboard
                </Link>
                <Link to="/advisories" className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus-ring">
                  My Advisories
                </Link>
                <Link to="/advisory/new" className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus-ring">
                  New Advisory
                </Link>
              </nav>

              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-right hidden md:block">
                  <p className="text-xs font-medium text-gray-900 truncate max-w-[180px]">{user.email}</p>
                  <p className="text-xs text-gray-500">Farmer Account</p>
                </div>
                <Button variant="secondary" size="sm" onClick={handleLogout}>
                  Sign Out
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">Get Started</Button>
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          {user && (
            <button
              className="sm:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 focus-ring"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-label="Toggle navigation menu"
            >
              {menuOpen ? (
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Mobile dropdown menu */}
        {user && menuOpen && (
          <div className="sm:hidden border-t border-gray-100 py-3 space-y-1">
            <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Dashboard</Link>
            <Link to="/advisories" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">My Advisories</Link>
            <Link to="/advisory/new" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">New Advisory</Link>
            <div className="pt-2 border-t border-gray-100 mt-2">
              <p className="px-3 text-xs text-gray-500 truncate">{user.email}</p>
              <button onClick={handleLogout} className="mt-1 w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg">
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

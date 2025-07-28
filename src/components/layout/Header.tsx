import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut, Settings, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSelector from '../shared/LanguageSelector';

const Header = ({ onMenuClick }: { onMenuClick?: () => void }) => {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    <header className="z-10 flex h-16 w-full items-center justify-between border-b border-gray-200 px-6" style={{ backgroundColor: '#011589' }}>
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button
            className="p-2 text-white focus:outline-none"
            onClick={onMenuClick}
          >
            <Menu size={28} />
          </button>
        )}
        <span className="text-xl font-semibold text-white">ADAM Dashboard</span>
      </div>
      <div className="flex items-center gap-4">
        
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center rounded-full bg-white p-2 text-[#011589] hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-[#011589] focus:ring-offset-2"
          >
            <User size={20} />
          </button>
          
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 transition-all duration-200">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="truncate text-xs text-gray-500">{user?.email}</p>
                <div className="mt-1 text-xs font-medium text-blue-600">Role: {user?.role}</div>
              </div>
              <div className="py-1">
                <div className="px-4 py-2 border-b border-gray-100">
                  <LanguageSelector 
                    selectedLanguage={language}
                    onChange={(lang) => setLanguage(lang as 'EN' | 'DE' | 'FR')}
                  />
                </div>
                <Link
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                >
                  <User size={16} className="mr-2" />
                  Edit Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                >
                  <Settings size={16} className="mr-2" />
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50"
                >
                  <LogOut size={16} className="mr-2" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
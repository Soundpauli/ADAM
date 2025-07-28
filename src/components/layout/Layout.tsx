import React, { useState, useRef, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import LoginPage from '../../pages/LoginPage';
import { Menu } from 'lucide-react';

const Layout = () => {
  const { user, isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const sidebarRef = useRef(null);

  useEffect(() => {
    if (!sidebarCollapsed) {
      const handleClickOutside = (event: MouseEvent) => {
        if (sidebarRef.current && !(sidebarRef.current as any).contains(event.target)) {
          setSidebarCollapsed(true);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [sidebarCollapsed]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar collapsed={sidebarCollapsed} ref={sidebarRef} onNavigate={() => setSidebarCollapsed(true)} />
      {!sidebarCollapsed && (
        <div className="fixed inset-0 z-[998]" style={{ background: 'transparent' }} onClick={() => setSidebarCollapsed(true)} />
      )}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarCollapsed((c) => !c)} />
        <main className="flex-1 overflow-auto bg-white p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
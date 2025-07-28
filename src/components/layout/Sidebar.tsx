import React from 'react';
import { NavLink } from 'react-router-dom';
import { SlidersHorizontal, Package, Star, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onNavigate?: () => void;
}
const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ collapsed, onNavigate }, ref) => {
    const { user } = useAuth();
    
    const isAdmin = user?.role === 'admin';
    if (collapsed) return null;
    
    return (
      <aside
        ref={ref}
        className="w-64 absolute z-[999] border-r border-gray-200 shrink-0 bg-gradient-to-b from-[#f5f8ff] via-white to-[#eaf0ff] shadow-xl rounded-r-2xl"
        style={{ top: '63px' }}
      >
        <div className="flex flex-col h-full">
          <div className="px-6 py-5 mb-2 border-b border-gray-100">
            <span className="text-xl font-bold text-[#011589] tracking-wide">Menu</span>
          </div>
          <nav className="flex-1 px-2 py-2 space-y-2">
            <NavLink
              to="/"
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium text-base shadow-sm ${
                  isActive
                    ? 'bg-[#011589] text-white shadow-md'
                    : 'text-gray-700 hover:bg-[#eaf0ff] hover:text-[#011589]'
                }`
              }
            >
              <Package size={20} className="opacity-80" />
              Products
            </NavLink>
            <NavLink
              to="/fields"
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium text-base shadow-sm ${
                  isActive
                    ? 'bg-[#011589] text-white shadow-md'
                    : 'text-gray-700 hover:bg-[#eaf0ff] hover:text-[#011589]'
                }`
              }
            >
              <SlidersHorizontal size={20} className="opacity-80" />
              Field Config
            </NavLink>
            <NavLink
              to="/goldstandard"
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium text-base shadow-sm ${
                  isActive
                    ? 'bg-[#011589] text-white shadow-md'
                    : 'text-gray-700 hover:bg-[#eaf0ff] hover:text-[#011589]'
                }`
              }
            >
              <Star size={20} className="opacity-80" />
              Goldstandard Examples
            </NavLink>
            <NavLink
              to="/claims"
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium text-base shadow-sm ${
                  isActive
                    ? 'bg-[#011589] text-white shadow-md'
                    : 'text-gray-700 hover:bg-[#eaf0ff] hover:text-[#011589]'
                }`
              }
            >
              <FileText size={20} className="opacity-80" />
              Claims
            </NavLink>
          </nav>
        </div>
      </aside>
    );
  }
);

export default Sidebar;
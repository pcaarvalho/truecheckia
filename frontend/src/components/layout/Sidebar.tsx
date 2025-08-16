import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Upload,
  FileText,
  User,
  Shield,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Upload', href: '/upload', icon: Upload },
  { name: 'Relatórios', href: '/reports', icon: FileText },
  { name: 'Perfil', href: '/profile', icon: User },
];

const adminNavigation = [{ name: 'Admin', href: '/admin', icon: Shield }];

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-dark-800 border border-dark-600 text-white"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-dark-900 border-r border-dark-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-6 border-b border-dark-700">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TC</span>
              </div>
              <span className="text-xl font-bold gradient-text">TrueCheck AI</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => `
                    flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                    ${
                      isActive
                        ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                        : 'text-dark-300 hover:text-white hover:bg-dark-800'
                    }
                  `}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}

            {/* Admin navigation */}
            {user?.role === 'ADMIN' && (
              <div className="pt-4 border-t border-dark-700">
                <p className="px-4 text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2">
                  Administração
                </p>
                {adminNavigation.map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={({ isActive }) => `
                        flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                        ${
                          isActive
                            ? 'bg-secondary-500/10 text-secondary-400 border border-secondary-500/20'
                            : 'text-dark-300 hover:text-white hover:bg-dark-800'
                        }
                      `}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon size={20} />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            )}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-dark-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-dark-400 truncate">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-dark-300 hover:text-white hover:bg-dark-800 transition-all duration-200"
            >
              <LogOut size={20} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

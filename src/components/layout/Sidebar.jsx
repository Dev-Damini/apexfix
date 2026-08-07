import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  Send,
  Shield,
  LogOut,
  X,
  TrendingUp,
  FileText,
  Globe,
  Settings,
  User,
  BarChart2,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ui/ThemeToggle';
const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
  { label: 'Cards', path: '/cards', icon: CreditCard },
  { label: 'Transfers', path: '/transfers', icon: Send },
];

const moreItems = [
  { label: 'Analytics', path: '/analytics', icon: BarChart2 },
  { label: 'Investments', path: '/investments', icon: TrendingUp },
  { label: 'PDF Statements', path: '/statements', icon: FileText },
  { label: 'FX Converter', path: '/converter', icon: Globe },
  { label: 'Settings', path: '/settings', icon: Settings },
];

const adminItem = { label: 'Admin Panel', path: '/admin', icon: Shield };

export default function Sidebar({ user, isOpen, onClose }) {
  // passed user prop used for notification bell
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  const isActive = (path) => location.pathname === path;

  const navLink = (item) => (
    <Link
      key={item.path}
      to={item.path}
      onClick={onClose}
      className={`
        flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
        ${isActive(item.path)
          ? 'bg-primary text-primary-foreground shadow-md'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
        }
      `}
    >
      <item.icon className="w-4 h-4" />
      {item.label}
    </Link>
  );

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-50
        flex flex-col transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
              Apex<span className="text-primary">Bank</span>
            </h1>
            <p className="text-[10px] text-muted-foreground mt-0.5 tracking-widest uppercase">Premium Banking</p>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="lg:hidden w-7 h-7" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {/* Main nav */}
          <div className="mb-2">
            {navItems.map(navLink)}
          </div>

          <div className="border-t border-border my-2" />

          {/* More items */}
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest px-4 py-1 font-semibold">More Services</p>
          {moreItems.map(navLink)}

          {isAdmin && (
            <>
              <div className="border-t border-border my-2" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest px-4 py-1 font-semibold">Admin</p>
              {navLink(adminItem)}
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-border">
          <Link
            to="/settings"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-all mb-1 group"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              {user?.profile_picture
                ? <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                : <span className="text-sm font-semibold text-primary">{user?.full_name?.[0]?.toUpperCase() || 'U'}</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.full_name || 'User'}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
            <Settings className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
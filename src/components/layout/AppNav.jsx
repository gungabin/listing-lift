import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, History, Settings, LogOut, Menu, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const links = [
  { to: '/dashboard', label: 'Stage', icon: Sparkles },
  { to: '/history', label: 'History', icon: History },
  { to: '/account', label: 'Account', icon: Settings },
];

function NavLinks({ location, onClose }) {
  return (
    <div className="space-y-1 flex-1">
      {links.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onClose}
          className={`flex items-center gap-3 px-3 py-2.5 text-sm font-sans transition-colors rounded-sm ${
            location.pathname === to
              ? 'bg-white/10 text-white'
              : 'text-[#999] hover:text-white hover:bg-white/5'
          }`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </Link>
      ))}
    </div>
  );
}

export default function AppNav({ user, subscription }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const usedPct = subscription
    ? Math.min((subscription.generations_used / subscription.generations_limit) * 100, 100)
    : 0;

  const usageBar = subscription && (
    <div className="mb-6">
      <div className="flex justify-between text-xs font-sans text-[#999] mb-1">
        <span>This month</span>
        <span>{subscription.generations_used} / {subscription.generations_limit}</span>
      </div>
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${usedPct > 85 ? 'bg-red-400' : 'bg-[#A89080]'}`}
          style={{ width: `${usedPct}%` }}
        />
      </div>
      <p className="text-xs font-sans text-[#666] mt-1 capitalize">{subscription.plan} plan</p>
    </div>
  );

  const userFooter = user && (
    <div className="border-t border-white/10 pt-4">
      <p className="text-xs font-sans text-[#999] truncate mb-2">{user.email}</p>
      <button
        onClick={() => base44.auth.logout('/')}
        className="flex items-center gap-2 text-xs font-sans text-[#666] hover:text-white transition-colors"
      >
        <LogOut className="w-3 h-3" /> Sign out
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="bg-[#2C2C2C] text-white flex flex-col h-full w-56 py-8 px-5 fixed left-0 top-0 bottom-0 z-30 hidden md:flex">
        <Link to="/dashboard" className="flex items-center gap-2 mb-10">
          <Sparkles className="w-4 h-4 text-[#A89080]" />
          <span className="text-sm tracking-widest uppercase font-light">Listing Lift</span>
        </Link>
        <NavLinks location={location} onClose={() => {}} />
        {usageBar}
        {userFooter}
      </nav>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#2C2C2C] text-white flex items-center justify-between px-5 py-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#A89080]" />
          <span className="text-sm tracking-widest uppercase font-light">Listing Lift</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="text-[#999] hover:text-white transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="relative bg-[#2C2C2C] text-white w-64 flex flex-col py-8 px-5 h-full shadow-2xl">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#A89080]" />
                <span className="text-sm tracking-widest uppercase font-light">Listing Lift</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-[#999] hover:text-white transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <NavLinks location={location} onClose={() => setMobileOpen(false)} />
            {usageBar}
            {userFooter}
          </div>
        </div>
      )}
    </>
  );
}

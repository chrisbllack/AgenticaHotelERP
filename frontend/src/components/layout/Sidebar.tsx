import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth-context';
import {
  LayoutDashboard, BedDouble, CalendarCheck, Users, ChefHat,
  Package, Calculator, BarChart3, Settings, LogOut,
  ClipboardList, Wrench, UserSearch, Utensils,
  Globe, CreditCard, Heart, Calendar, ShoppingBag, Bot,
  TrendingUp, UsersRound, PartyPopper, Award,
  Moon, DollarSign, ArrowRightLeft, Smartphone
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Assistant', href: '/ai', icon: Bot },
  { name: 'Front Desk', href: '/front-desk', icon: BedDouble },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Reservations', href: '/reservations', icon: CalendarCheck },
  { name: 'Rooms', href: '/rooms', icon: BedDouble },
  { name: 'Guests', href: '/guests', icon: UserSearch },
  { name: 'CRM', href: '/crm', icon: Heart },
  { name: 'POS', href: '/pos', icon: ChefHat },
  { name: 'Restaurant', href: '/restaurant', icon: Utensils },
  { name: 'KDS', href: '/kds', icon: Utensils },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Procurement', href: '/procurement', icon: Package },
  { name: 'Recipes & Costing', href: '/recipes', icon: Utensils },
  { name: 'Finance', href: '/finance', icon: Calculator },
  { name: 'Assets & Expenses', href: '/assets', icon: Calculator },
  { name: 'HR', href: '/hr', icon: Users },
  { name: 'Revenue Mgmt', href: '/revenue', icon: TrendingUp },
  { name: 'Group Bookings', href: '/group-bookings', icon: UsersRound },
  { name: 'Sales & Catering', href: '/sales-catering', icon: PartyPopper },
  { name: 'Loyalty Program', href: '/loyalty', icon: Award },
  { name: 'Night Audit', href: '/night-audit', icon: Moon },
  { name: 'Rate Management', href: '/rate-management', icon: DollarSign },
  { name: 'Shift Handover', href: '/shift-handover', icon: ArrowRightLeft },
  { name: 'Guest Portal', href: '/guest-portal', icon: Smartphone },
  { name: 'Housekeeping', href: '/housekeeping', icon: ClipboardList },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Booking Engine', href: '/booking-engine', icon: ShoppingBag },
  { name: 'Channels & HW', href: '/channels', icon: Globe },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-xl font-bold text-blue-400">INFINEON</h1>
        <p className="text-xs text-slate-400">Enterprise Platform</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navigation.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        {user && (
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
              {user.name?.[0] || 'U'}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
              {(user as any).role && (
                <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-blue-900/50 text-blue-300 text-[10px] rounded font-medium capitalize">
                  {(user as any).role.replace(/_/g, ' ')}
                </span>
              )}
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white w-full rounded"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
        <p className="text-xs text-slate-500 mt-2">v1.0.0 — INFINEON Enterprise Platform</p>
      </div>
    </aside>
  );
}

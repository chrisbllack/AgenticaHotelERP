import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ModuleFeature {
  name: string;
  icon: string;
  description: string;
  capabilities: string[];
  href?: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badge?: string;
}

interface ModuleCategory {
  name: string;
  icon: string;
  description: string;
  modules: ModuleFeature[];
}

const categories: ModuleCategory[] = [
  {
    name: 'Front Office & Guest Services',
    icon: '🏨',
    description: 'Complete guest lifecycle management from reservation to checkout',
    modules: [
      {
        name: 'Dashboard',
        icon: '📊',
        href: '/dashboard',
        description: 'Real-time hotel operations overview with live KPIs, occupancy rates, revenue metrics, room status, and quick actions.',
        capabilities: ['Live occupancy rate with donut chart', 'Arrivals, departures, in-house guests', 'Outstanding balance tracker', 'Room status overview (clean/dirty/occupied)', 'Quick action buttons', 'VIP arrival alerts'],
        color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200',
      },
      {
        name: 'Front Desk',
        icon: '🛎️',
        href: '/front-desk',
        description: 'Opera-style front desk with drag-and-drop room assignment, walk-in workflow, key encoding, and shift management.',
        capabilities: ['Drag-and-drop room assignment', 'Walk-in guest registration', 'Room status grid with color coding', 'Guest search and lookup', 'Key card encoding simulation', 'Shift handover tracking'],
        color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200',
      },
      {
        name: 'Calendar',
        icon: '📅',
        href: '/calendar',
        description: 'Visual reservation calendar with rooms vertically and dates horizontally. Supports drag-and-drop operations.',
        capabilities: ['Daily/weekly/monthly views', 'Drag-and-drop reservation moves', 'Extend or shorten stay', 'Room type change', 'Split and merge reservations', 'Visual availability heatmap'],
        color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200',
      },
      {
        name: 'Reservations',
        icon: '📝',
        href: '/reservations',
        description: 'Full reservation management with individual, group, corporate, OTA, and walk-in booking types.',
        capabilities: ['Multiple booking sources (14 channels)', 'Group and block reservations', 'Corporate rate management', 'Cancellation and no-show tracking', 'Deposit and payment tracking', 'Special requests management'],
        color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200',
      },
      {
        name: 'Rooms',
        icon: '🛏️',
        href: '/rooms',
        description: 'Complete room inventory management with types, status tracking, and availability overview.',
        capabilities: ['Room type configuration', 'Individual room status tracking', '13 room status states', 'Floor and building hierarchy', 'Bed configuration management', 'Room amenities and photos'],
        color: 'text-cyan-600', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200',
      },
      {
        name: 'Guests',
        icon: '👤',
        href: '/guests',
        description: 'Guest profile management with stay history, preferences, and CRM integration.',
        capabilities: ['Guest profile creation', 'Stay and booking history', 'Guest preferences tracking', 'VIP status management', 'Corporate relationship', 'Marketing consent tracking'],
        color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-200',
      },
      {
        name: 'CRM',
        icon: '💝',
        href: '/crm',
        description: 'Guest relationship management with loyalty tiers, feedback, and guest segmentation.',
        capabilities: ['Guest segmentation', 'Spending analysis per guest', 'Loyalty tier management', 'Feedback and complaints', 'Guest lifetime value', 'Communication preferences'],
        color: 'text-pink-600', bgColor: 'bg-pink-50', borderColor: 'border-pink-200',
      },
      {
        name: 'Guest Portal',
        icon: '📱',
        href: '/guest-portal',
        description: 'Self-service guest portal for digital check-in, folio viewing, service requests, and feedback.',
        capabilities: ['4-step digital check-in', 'Folio and bill viewing', '10 service request options', 'Digital key delivery', 'Real-time folio charges', 'Guest feedback and rating'],
        color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200',
      },
      {
        name: 'Booking Engine',
        icon: '🛒',
        href: '/booking-engine',
        description: 'Online booking engine with room search, rate selection, extras, payment, and confirmation.',
        capabilities: ['Room availability search', 'Rate plan comparison', 'Extra services add-on', 'Secure payment processing', 'Booking confirmation and voucher', 'Email/SMS notifications'],
        color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200',
      },
    ],
  },
  {
    name: 'Revenue & Rate Management',
    icon: '📈',
    description: 'Maximize revenue with dynamic pricing, group bookings, and yield management',
    modules: [
      {
        name: 'Revenue Management',
        icon: '💹',
        href: '/revenue',
        description: 'Opera/Djubo-style revenue management with ADR, RevPAR, occupancy forecasting, and dynamic pricing recommendations.',
        capabilities: ['ADR and RevPAR calculation', '7-day occupancy forecast', 'Dynamic pricing recommendations', 'Rate plan performance analysis', 'ADR by room type comparison', 'Today/MTD/YTD period toggle'],
        color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200',
      },
      {
        name: 'Rate Management',
        icon: '💲',
        href: '/rate-management',
        description: 'Advanced rate management with seasonal pricing, occupancy-based dynamic rates, and competitor intelligence.',
        capabilities: ['12+ rate plan types (BAR, Corporate, OTA, etc.)', 'Seasonal pricing rules', 'Occupancy-based dynamic pricing', 'Competitor rate intelligence', 'Promotional rate management', 'Blackout date configuration'],
        color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200',
      },
      {
        name: 'Group Bookings',
        icon: '👥',
        href: '/group-bookings',
        description: 'Opera-style group room blocks with master folio, group check-in/out, and billing management.',
        capabilities: ['Group room block creation', 'Master folio management', 'Group check-in and check-out', 'Room assignment by group', 'Group billing and invoicing', 'Block release tracking'],
        color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-200',
      },
      {
        name: 'Sales & Catering',
        icon: '🎉',
        href: '/sales-catering',
        description: 'Event venues, catering packages, and banquet management for conferences, weddings, and functions.',
        capabilities: ['4 event venues with pricing', '6 catering packages', 'Event booking management', 'Equipment and staffing', 'Invoice and deposit tracking', 'Event calendar view'],
        color: 'text-fuchsia-600', bgColor: 'bg-fuchsia-50', borderColor: 'border-fuchsia-200',
      },
      {
        name: 'Loyalty Program',
        icon: '🏆',
        href: '/loyalty',
        description: '5-tier loyalty program with points, rewards, guest segmentation, and tier benefits.',
        capabilities: ['5 loyalty tiers (Member → VIP)', 'Points earning and redemption', 'Guest segmentation analysis', 'Tier-based benefits', 'Recent rewards feed', 'Loyalty program analytics'],
        color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200',
      },
    ],
  },
  {
    name: 'Food & Beverage',
    icon: '🍽️',
    description: 'Restaurant POS, kitchen display, bar management, and recipe costing',
    modules: [
      {
        name: 'POS',
        icon: '🍳',
        href: '/pos',
        description: 'Touchscreen restaurant POS with table management, orders, KOT, bill splitting, and multi-payment support.',
        capabilities: ['Touchscreen POS interface', 'Table management and layout', 'Menu categories and items', 'Kitchen Order Ticket (KOT)', 'Bill splitting and merging', 'Multiple payment modes', 'Room charge posting'],
        color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200',
      },
      {
        name: 'KDS',
        icon: '🖥️',
        href: '/kds',
        description: 'Kitchen Display System routing orders to stations with real-time status tracking.',
        capabilities: ['Multi-station routing', 'Order status tracking', 'Preparation timing', 'Ready/served notifications', 'Priority order handling', 'Kitchen productivity metrics'],
        color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200',
      },
      {
        name: 'Recipes & Costing',
        icon: '📖',
        href: '/recipes',
        description: 'Recipe management with ingredient linking, cost calculation, and menu profitability analysis.',
        capabilities: ['Recipe-ingredient linking', 'Automatic cost calculation', 'Selling price vs cost analysis', 'Gross margin tracking', 'Profitability ranking', 'Ingredient cost alerts'],
        color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200',
      },
    ],
  },
  {
    name: 'Inventory & Procurement',
    icon: '📦',
    description: 'Stock management, purchasing, goods receiving, and supplier management',
    modules: [
      {
        name: 'Inventory',
        icon: '📋',
        href: '/inventory',
        description: 'Multi-store inventory management with stock movements, valuation, and wastage tracking.',
        capabilities: ['Multi-store hierarchy', 'Stock movement tracking', 'Weighted average and FIFO costing', 'Wastage management', 'Low stock alerts', 'Stock count and variance', 'Supplier management'],
        color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200',
      },
      {
        name: 'Procurement',
        icon: '🛒',
        href: '/procurement',
        description: 'Purchase requisition, purchase order, goods receiving, and three-way matching.',
        capabilities: ['Purchase requisition workflow', 'Approval hierarchy', 'Purchase order management', 'Goods receiving and inspection', 'Three-way matching', 'Supplier evaluation'],
        color: 'text-teal-700', bgColor: 'bg-teal-50', borderColor: 'border-teal-200',
      },
    ],
  },
  {
    name: 'Finance & Accounting',
    icon: '💰',
    description: 'Double-entry accounting, financial reporting, and treasury management',
    modules: [
      {
        name: 'Finance',
        icon: '🏦',
        href: '/finance',
        description: 'Complete accounting engine with Chart of Accounts, General Ledger, AR, AP, P&L, and Balance Sheet.',
        capabilities: ['Chart of Accounts', 'Journal entries with double-entry', 'Accounts Receivable aging', 'Accounts Payable management', 'Profit & Loss report', 'Bank reconciliation', 'Budget vs actual tracking'],
        color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200',
      },
      {
        name: 'Assets & Expenses',
        icon: '🏗️',
        href: '/assets',
        description: 'Fixed asset register with depreciation, expense tracking, and asset lifecycle management.',
        capabilities: ['Fixed asset register', 'Depreciation calculation', 'Expense request workflow', 'Expense approval tracking', 'Asset disposal management', 'Department cost allocation'],
        color: 'text-slate-600', bgColor: 'bg-slate-50', borderColor: 'border-slate-200',
      },
      {
        name: 'Payments',
        icon: '💳',
        href: '/payments',
        description: 'Payment processing with multiple gateways, reconciliation, and refund management.',
        capabilities: ['Multiple payment gateways', 'Paystack and Flutterwave integration', 'Refund management', 'Payment reconciliation', 'Cash drawer management', 'End-of-day settlement'],
        color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200',
      },
    ],
  },
  {
    name: 'Human Resources',
    icon: '👥',
    description: 'Employee management, attendance, leave, and payroll processing',
    modules: [
      {
        name: 'HR',
        icon: '👔',
        href: '/hr',
        description: 'Complete HR module with employee records, attendance tracking, leave management, and payroll.',
        capabilities: ['Employee master records', 'Biometric attendance integration', 'Leave request workflow', 'Payroll calculation', 'Payslip generation', 'Department management', '14 departments seeded'],
        color: 'text-indigo-700', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200',
      },
    ],
  },
  {
    name: 'Operations & Housekeeping',
    icon: '🧹',
    description: 'Housekeeping, maintenance, night audit, and shift management',
    modules: [
      {
        name: 'Housekeeping',
        icon: '🛏️',
        href: '/housekeeping',
        description: 'Room cleaning management with attendant assignment, task tracking, and maintenance escalation.',
        capabilities: ['Room assignment to attendants', 'Task priority management', 'Cleaning time tracking', 'Deep cleaning scheduling', 'Maintenance escalation', 'Productivity reporting'],
        color: 'text-sky-600', bgColor: 'bg-sky-50', borderColor: 'border-sky-200',
      },
      {
        name: 'Maintenance',
        icon: '🔧',
        href: '/maintenance',
        description: 'Work order management with preventive schedules, equipment register, and cost tracking.',
        capabilities: ['Work order creation', 'Preventive maintenance schedules', 'Equipment/asset register', 'Spare parts management', 'Technician assignment', 'Maintenance cost tracking'],
        color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200',
      },
      {
        name: 'Night Audit',
        icon: '🌙',
        href: '/night-audit',
        description: 'Automated night audit with step-by-step workflow, validation checks, and business date management.',
        capabilities: ['8 pre-audit validation checks', '11-step automated workflow', 'Room charge posting', 'Tax and service charge calculation', 'Cash reconciliation', 'Business date close/open', 'Idempotent duplicate prevention'],
        color: 'text-indigo-800', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200',
      },
      {
        name: 'Shift Handover',
        icon: '🔄',
        href: '/shift-handover',
        description: 'Opera-style shift management with cash reconciliation, activity log, and outstanding issues.',
        capabilities: ['Cash drawer reconciliation', 'Shift activity log', 'Outstanding issues tracking', 'Handover notes', 'Incoming/outgoing staff', 'Revenue summary per shift'],
        color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200',
      },
    ],
  },
  {
    name: 'Platform & Intelligence',
    icon: '🤖',
    description: 'AI assistant, channel management, hardware integration, and analytics',
    modules: [
      {
        name: 'AI Assistant',
        icon: '🤖',
        href: '/ai',
        description: 'AI-powered assistant for querying live PMS data, generating reports, and providing operational insights.',
        capabilities: ['Natural language queries', 'Real-time data access', 'Revenue analysis', 'Occupancy forecasting', 'Guest insights', 'Operational recommendations'],
        color: 'text-violet-700', bgColor: 'bg-violet-50', borderColor: 'border-violet-200',
        badge: 'AI',
      },
      {
        name: 'Channels & HW',
        icon: '🌐',
        href: '/channels',
        description: 'Channel manager for OTA synchronization and hardware integration framework.',
        capabilities: ['OTA synchronization (Booking.com, Expedia)', 'Rate and availability push', 'Hardware abstraction layer', 'Door lock integration (JCSMARTS)', 'POS terminal management', 'Key card encoder support'],
        color: 'text-cyan-700', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200',
      },
      {
        name: 'Reports',
        icon: '📊',
        href: '/reports',
        description: 'Comprehensive reporting engine with executive dashboard, occupancy, revenue, and operational reports.',
        capabilities: ['Executive KPI dashboard', 'Occupancy and revenue reports', 'POS sales analysis', 'Inventory summary', 'Financial reports (P&L, Balance Sheet)', 'PDF and Excel export', 'Scheduled email reports'],
        color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200',
      },
      {
        name: 'Settings',
        icon: '⚙️',
        href: '/settings',
        description: 'System configuration with property details, tax rates, payment methods, departments, and system parameters.',
        capabilities: ['Property details management', '6 Nigerian tax rates', '11 payment methods (OPay, PalmPay, etc.)', '14 departments', '8 numbering sequences', '33 system parameters', 'Database statistics'],
        color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-200',
      },
    ],
  },
];

export default function FeatureTourPage() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const navigate = useNavigate();

  const totalModules = categories.reduce((sum, cat) => sum + cat.modules.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center">
              <span className="text-3xl">🏨</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold">INFINEON Enterprise Platform</h1>
              <p className="text-blue-200 mt-1 text-lg">Comprehensive Hotel Property Management System</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-6 mt-8">
            <div className="bg-white/10 backdrop-blur rounded-xl px-5 py-3">
              <p className="text-3xl font-bold">{totalModules}</p>
              <p className="text-blue-200 text-sm">Modules</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-5 py-3">
              <p className="text-3xl font-bold">{categories.length}</p>
              <p className="text-blue-200 text-sm">Categories</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-5 py-3">
              <p className="text-3xl font-bold">9</p>
              <p className="text-blue-200 text-sm">User Roles</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-5 py-3">
              <p className="text-3xl font-bold">50</p>
              <p className="text-blue-200 text-sm">Demo Rooms</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-5 py-3">
              <p className="text-3xl font-bold">₦</p>
              <p className="text-blue-200 text-sm">Nigerian Naira</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setActiveCategory(idx)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === idx
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'bg-white text-gray-600 border hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeCategory === idx ? 'bg-white/20' : 'bg-gray-100'
              }`}>{cat.modules.length}</span>
            </button>
          ))}
        </div>

        {/* Category Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-3xl">{categories[activeCategory].icon}</span>
            {categories[activeCategory].name}
          </h2>
          <p className="text-gray-500 mt-1">{categories[activeCategory].description}</p>
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories[activeCategory].modules.map((mod) => {
            const isExpanded = expandedModule === mod.name;
            return (
              <div
                key={mod.name}
                className={`bg-white rounded-2xl border ${mod.borderColor} overflow-hidden transition-all hover:shadow-lg cursor-pointer ${
                  isExpanded ? 'shadow-lg ring-2 ring-blue-200' : 'shadow-sm'
                }`}
                onClick={() => setExpandedModule(isExpanded ? null : mod.name)}
              >
                {/* Card Header */}
                <div className={`${mod.bgColor} px-5 py-4`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{mod.icon}</span>
                      <div>
                        <h3 className="font-bold text-gray-900">{mod.name}</h3>
                        {mod.badge && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-purple-600 text-white text-[10px] font-bold rounded-full">
                            {mod.badge}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`text-sm ${mod.color} transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-5 py-4">
                  <p className="text-sm text-gray-600 leading-relaxed">{mod.description}</p>
                  
                  {isExpanded && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Key Capabilities</h4>
                      {mod.capabilities.map((cap, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className={`${mod.color} mt-0.5`}>✓</span>
                          <span className="text-gray-700">{cap}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {mod.href && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(mod.href!);
                      }}
                      className={`mt-4 w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                        mod.color.includes('blue') ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                        mod.color.includes('green') ? 'bg-green-600 hover:bg-green-700 text-white' :
                        mod.color.includes('purple') || mod.color.includes('violet') ? 'bg-purple-600 hover:bg-purple-700 text-white' :
                        mod.color.includes('red') ? 'bg-red-600 hover:bg-red-700 text-white' :
                        mod.color.includes('orange') ? 'bg-orange-600 hover:bg-orange-700 text-white' :
                        mod.color.includes('teal') || mod.color.includes('cyan') ? 'bg-teal-600 hover:bg-teal-700 text-white' :
                        mod.color.includes('indigo') ? 'bg-indigo-600 hover:bg-indigo-700 text-white' :
                        mod.color.includes('amber') || mod.color.includes('yellow') ? 'bg-amber-600 hover:bg-amber-700 text-white' :
                        mod.color.includes('pink') || mod.color.includes('fuchsia') ? 'bg-pink-600 hover:bg-pink-700 text-white' :
                        mod.color.includes('slate') || mod.color.includes('gray') ? 'bg-gray-700 hover:bg-gray-800 text-white' :
                        mod.color.includes('emerald') ? 'bg-emerald-600 hover:bg-emerald-700 text-white' :
                        mod.color.includes('sky') ? 'bg-sky-600 hover:bg-sky-700 text-white' :
                        'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      Open Module →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* System Architecture Summary */}
        <div className="mt-12 bg-white rounded-2xl border p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">🏗️ System Architecture</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
              <h4 className="font-bold text-blue-900 mb-3">🖥️ Frontend</h4>
              <ul className="text-sm text-blue-800 space-y-1.5">
                <li>React + TypeScript + Vite</li>
                <li>Tailwind CSS for styling</li>
                <li>React Query for data fetching</li>
                <li>Responsive design (desktop/tablet/mobile)</li>
                <li>31 navigation modules</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
              <h4 className="font-bold text-green-900 mb-3">⚡ Backend</h4>
              <ul className="text-sm text-green-800 space-y-1.5">
                <li>Go (Golang) — single binary deployment</li>
                <li>Chi router with middleware</li>
                <li>JWT authentication + RBAC</li>
                <li>SQLite (demo) / PostgreSQL (production)</li>
                <li>API-first architecture</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200">
              <h4 className="font-bold text-purple-900 mb-3">🔒 Enterprise Features</h4>
              <ul className="text-sm text-purple-800 space-y-1.5">
                <li>9 user roles with permissions</li>
                <li>Immutable audit trail</li>
                <li>Offline-first architecture</li>
                <li>On-premise deployment ready</li>
                <li>African payment integrations</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6">
          <h3 className="font-bold text-amber-900 mb-3">🔑 Demo Credentials</h3>
          <p className="text-sm text-amber-700 mb-4">Each role has its own password: <code className="bg-amber-100 px-2 py-0.5 rounded font-mono">admin123</code>, <code className="bg-amber-100 px-2 py-0.5 rounded font-mono">manager123</code>, <code className="bg-amber-100 px-2 py-0.5 rounded font-mono">reception123</code>, etc.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { role: 'Admin', email: 'admin@infineon.com', pass: 'admin123' },
              { role: 'General Manager', email: 'gm@infineon.com', pass: 'manager123' },
              { role: 'Receptionist', email: 'receptionist@infineon.com', pass: 'reception123' },
              { role: 'Cashier', email: 'cashier@infineon.com', pass: 'cashier123' },
              { role: 'Housekeeping', email: 'housekeeping@infineon.com', pass: 'housekeep123' },
              { role: 'Kitchen Manager', email: 'kitchen@infineon.com', pass: 'kitchen123' },
              { role: 'Accountant', email: 'accountant@infineon.com', pass: 'account123' },
              { role: 'HR Manager', email: 'hr@infineon.com', pass: 'hr123' },
              { role: 'Waiter', email: 'waiter@infineon.com', pass: 'waiter123' },
            ].map((u) => (
              <button
                key={u.email}
                onClick={() => navigate('/login')}
                className="text-left bg-white rounded-lg border border-amber-200 p-3 hover:shadow-md transition-shadow"
              >
                <p className="font-semibold text-gray-900 text-sm">{u.role}</p>
                <p className="text-xs text-gray-500 font-mono mt-1">{u.email}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8 text-sm text-gray-400">
          <p>INFINEON Enterprise Platform v1.0.0 — Built for Africa 🌍</p>
          <p className="mt-1">On-premise deployment • Offline resilient • Single Go binary</p>
        </div>
      </div>
    </div>
  );
}

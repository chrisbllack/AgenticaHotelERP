import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './lib/auth-context';
import { Layout } from './components/layout/Layout';
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/dashboard/DashboardPage';
import FrontDeskPage from './features/front-desk/FrontDeskPage';
import ReservationsPage from './features/reservations/ReservationsPage';
import RoomsPage from './features/rooms/RoomsPage';
import GuestsPage from './features/guests/GuestsPage';
import CheckInPage from './features/front-desk/CheckInPage';
import FolioPage from './features/front-desk/FolioPage';
import POSPage from './features/pos/POSPage';
import InventoryPage from './features/inventory/InventoryPage';
import HousekeepingPage from './features/housekeeping/HousekeepingPage';
import FinancePage from './features/finance/FinancePage';
import HRPage from './features/hr/HRPage';
import ReportsPage from './features/reports/ReportsPage';
import SettingsPage from './features/settings/SettingsPage';
import ChannelsPage from './features/channels/ChannelsPage';
import PaymentsPage from './features/payments/PaymentsPage';
import CRMPage from './features/crm/CRMPage';
import ReservationCalendar from './features/reservations/ReservationCalendar';
import BookingEnginePage from './features/bookings/BookingEnginePage';
import AIAssistantPage from './features/ai/AIAssistantPage';
import FeatureTourPage from './features/feature-tour/FeatureTourPage';
import ProcurementPage from './features/procurement/ProcurementPage';
import RecipesPage from './features/recipes/RecipesPage';
import KDSPage from './features/kds/KDSPage';
import RestaurantPage from './features/restaurant/RestaurantPage';
import AssetsPage from './features/assets/AssetsPage';
import DeviceManagementPage from './features/hr/DeviceManagementPage';
import Guest360Page from './features/front-desk/Guest360Page';
import TracesPage from './features/front-desk/TracesPage';
import RoomAssignmentPage from './features/front-desk/RoomAssignmentPage';
import RevenuePage from './features/revenue/RevenuePage';
import GroupBookingsPage from './features/group-bookings/GroupBookingsPage';
import SalesCateringPage from './features/sales-catering/SalesCateringPage';
import LoyaltyPage from './features/loyalty/LoyaltyPage';
import NightAuditPage from './features/night-audit/NightAuditPage';
import RateManagementPage from './features/rate-management/RateManagementPage';
import ShiftHandoverPage from './features/shift-handover/ShiftHandoverPage';
import GuestPortalPage from './features/guest-portal/GuestPortalPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>              <Route path="/login" element={<LoginPage />} />
              <Route path="/tour" element={<FeatureTourPage />} />
              <Route path="/book" element={<BookingEnginePage />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="front-desk" element={<FrontDeskPage />} />
              <Route path="reservations" element={<ReservationsPage />} />
              <Route path="rooms" element={<RoomsPage />} />
              <Route path="guests" element={<GuestsPage />} />
              <Route path="check-in/:reservationId" element={<CheckInPage />} />
              <Route path="check-out/:reservationId" element={<CheckInPage />} />
              <Route path="folio/:stayId" element={<FolioPage />} />
              <Route path="pos" element={<POSPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="housekeeping" element={<HousekeepingPage />} />
              <Route path="maintenance" element={<HousekeepingPage />} />
              <Route path="finance" element={<FinancePage />} />
              <Route path="hr" element={<HRPage />} />
              <Route path="crm" element={<CRMPage />} />
              <Route path="calendar" element={<ReservationCalendar />} />
              <Route path="booking-engine" element={<BookingEnginePage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="channels" element={<ChannelsPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="ai" element={<AIAssistantPage />} />
              <Route path="procurement" element={<ProcurementPage />} />
              <Route path="recipes" element={<RecipesPage />} />
              <Route path="kds" element={<KDSPage />} />
              <Route path="restaurant" element={<RestaurantPage />} />
              <Route path="assets" element={<AssetsPage />} />
              <Route path="revenue" element={<RevenuePage />} />
              <Route path="group-bookings" element={<GroupBookingsPage />} />
              <Route path="sales-catering" element={<SalesCateringPage />} />
              <Route path="loyalty" element={<LoyaltyPage />} />
              <Route path="night-audit" element={<NightAuditPage />} />
              <Route path="rate-management" element={<RateManagementPage />} />
              <Route path="shift-handover" element={<ShiftHandoverPage />} />
              <Route path="guest-portal" element={<GuestPortalPage />} />
              <Route path="guest-360/:id" element={<Guest360Page />} />
              <Route path="traces" element={<TracesPage />} />
              <Route path="room-assignment" element={<RoomAssignmentPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="devices" element={<DeviceManagementPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

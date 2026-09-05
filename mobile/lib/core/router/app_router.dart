import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:infineon_mobile/features/auth/auth_provider.dart';
import 'package:infineon_mobile/shared/widgets/main_scaffold.dart';

import 'package:infineon_mobile/features/auth/login_screen.dart';
import 'package:infineon_mobile/features/auth/role_picker_screen.dart';

// Manager
import 'package:infineon_mobile/features/dashboard/dashboard_screen.dart';
import 'package:infineon_mobile/features/front_desk/front_desk_screen.dart';
import 'package:infineon_mobile/features/manager/approvals_screen.dart';
import 'package:infineon_mobile/features/manager/reports_screen.dart';

// Staff
import 'package:infineon_mobile/features/housekeeping/housekeeping_screen.dart';
import 'package:infineon_mobile/features/maintenance/maintenance_screen.dart';
import 'package:infineon_mobile/features/waiter/waiter_screen.dart';

// Guest
import 'package:infineon_mobile/features/guest/guest_dashboard.dart';
import 'package:infineon_mobile/features/guest/room_service_screen.dart';
import 'package:infineon_mobile/features/guest/spa_booking_screen.dart';
import 'package:infineon_mobile/features/guest/folio_view_screen.dart';
import 'package:infineon_mobile/features/guest/feedback_screen.dart';

// Admin
import 'package:infineon_mobile/features/admin/admin_dashboard.dart';

// Owner
import 'package:infineon_mobile/features/owner/owner_dashboard.dart';

// Settings (shared)
import 'package:infineon_mobile/features/settings/settings_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final isLoggedIn = authState.isAuthenticated;
      final isLoginRoute = state.matchedLocation == '/login' || state.matchedLocation == '/role-picker';

      if (!isLoggedIn && !isLoginRoute) return '/role-picker';
      if (isLoggedIn && isLoginRoute) return _getDefaultRoute(authState.role);
      return null;
    },
    routes: [
      // ── Auth Routes ──
      GoRoute(path: '/login', builder: (_, s) => const LoginScreen()),
      GoRoute(path: '/role-picker', builder: (_, s) => const RolePickerScreen()),

      // ── Shared Shell ──
      ShellRoute(
        builder: (context, state, child) => MainScaffold(child: child),
        routes: [
          // Dashboard (role-specific)
          GoRoute(path: '/', builder: (_, s) => _buildDashboard(authState.role)),
          GoRoute(path: '/dashboard', builder: (_, s) => _buildDashboard(authState.role)),

          // ── Manager Routes ──
          GoRoute(path: '/front-desk', builder: (_, s) => const FrontDeskScreen()),
          GoRoute(path: '/approvals', builder: (_, s) => const ApprovalsScreen()),
          GoRoute(path: '/reports', builder: (_, s) => const ReportsScreen()),

          // ── Staff Routes ──
          GoRoute(path: '/housekeeping', builder: (_, s) => const HousekeepingScreen()),
          GoRoute(path: '/maintenance', builder: (_, s) => const MaintenanceScreen()),
          GoRoute(path: '/waiter', builder: (_, s) => const WaiterScreen()),

          // ── Guest Routes ──
          GoRoute(path: '/room-service', builder: (_, s) => const RoomServiceScreen()),
          GoRoute(path: '/spa', builder: (_, s) => const SpaBookingScreen()),
          GoRoute(path: '/my-folio', builder: (_, s) => const FolioViewScreen()),
          GoRoute(path: '/feedback', builder: (_, s) => const FeedbackScreen()),

          // ── Owner Routes ──
          GoRoute(path: '/properties', builder: (_, s) => const OwnerDashboard()),
          GoRoute(path: '/financials', builder: (_, s) => const ReportsScreen()),

          // ── Admin Routes ──
          GoRoute(path: '/admin', builder: (_, s) => const AdminDashboard()),

          // ── Shared ──
          GoRoute(path: '/settings', builder: (_, s) => const SettingsScreen()),
        ],
      ),
    ],
  );
});

Widget _buildDashboard(UserRole role) {
  switch (role) {
    case UserRole.owner:
      return const OwnerDashboard();
    case UserRole.guest:
      return const GuestDashboard();
    case UserRole.admin:
      return const AdminDashboard();
    case UserRole.manager:
      return const DashboardScreen();
    case UserRole.staff:
      return const HousekeepingScreen(); // Default for staff
  }
}

String _getDefaultRoute(UserRole role) {
  switch (role) {
    case UserRole.owner: return '/';
    case UserRole.guest: return '/';
    case UserRole.admin: return '/admin';
    case UserRole.manager: return '/';
    case UserRole.staff: return '/';
  }
}

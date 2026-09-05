import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:infineon_mobile/features/auth/auth_provider.dart';

class MainScaffold extends ConsumerWidget {
  final Widget child;
  const MainScaffold({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location = GoRouterState.of(context).matchedLocation;
    final role = ref.watch(userRoleProvider);

    final destinations = _getNavItems(role);
    final selectedIndex = _getSelectedIndex(location, role);

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: selectedIndex,
        onDestinationSelected: (index) => _onTap(context, role, index),
        destinations: destinations.map((item) => NavigationDestination(
          icon: Icon(item['icon'] as IconData),
          selectedIcon: Icon(item['selectedIcon'] as IconData? ?? item['icon'] as IconData),
          label: item['label'] as String,
        )).toList(),
      ),
    );
  }

  List<Map<String, dynamic>> _getNavItems(UserRole role) {
    switch (role) {
      case UserRole.owner:
        return [
          {'label': 'Portfolio', 'icon': Icons.dashboard_outlined, 'selectedIcon': Icons.dashboard, 'route': '/'},
          {'label': 'Reports', 'icon': Icons.assessment_outlined, 'selectedIcon': Icons.assessment, 'route': '/reports'},
          {'label': 'Financials', 'icon': Icons.trending_up_outlined, 'selectedIcon': Icons.trending_up, 'route': '/financials'},
          {'label': 'Settings', 'icon': Icons.settings_outlined, 'selectedIcon': Icons.settings, 'route': '/settings'},
        ];
      case UserRole.manager:
        return [
          {'label': 'Dashboard', 'icon': Icons.dashboard_outlined, 'selectedIcon': Icons.dashboard, 'route': '/'},
          {'label': 'Front Desk', 'icon': Icons.hotel_outlined, 'selectedIcon': Icons.hotel, 'route': '/front-desk'},
          {'label': 'Approvals', 'icon': Icons.approval_outlined, 'selectedIcon': Icons.approval, 'route': '/approvals'},
          {'label': 'Reports', 'icon': Icons.assessment_outlined, 'selectedIcon': Icons.assessment, 'route': '/reports'},
          {'label': 'Settings', 'icon': Icons.settings_outlined, 'selectedIcon': Icons.settings, 'route': '/settings'},
        ];
      case UserRole.admin:
        return [
          {'label': 'System', 'icon': Icons.admin_panel_settings_outlined, 'selectedIcon': Icons.admin_panel_settings, 'route': '/admin'},
          {'label': 'Dashboard', 'icon': Icons.dashboard_outlined, 'selectedIcon': Icons.dashboard, 'route': '/'},
          {'label': 'Settings', 'icon': Icons.settings_outlined, 'selectedIcon': Icons.settings, 'route': '/settings'},
        ];
      case UserRole.guest:
        return [
          {'label': 'Home', 'icon': Icons.home_outlined, 'selectedIcon': Icons.home, 'route': '/'},
          {'label': 'Services', 'icon': Icons.room_service_outlined, 'selectedIcon': Icons.room_service, 'route': '/room-service'},
          {'label': 'Spa', 'icon': Icons.spa_outlined, 'selectedIcon': Icons.spa, 'route': '/spa'},
          {'label': 'Folio', 'icon': Icons.receipt_outlined, 'selectedIcon': Icons.receipt, 'route': '/my-folio'},
          {'label': 'Feedback', 'icon': Icons.star_outline, 'selectedIcon': Icons.star, 'route': '/feedback'},
        ];
      case UserRole.staff:
        return [
          {'label': 'Tasks', 'icon': Icons.cleaning_services_outlined, 'selectedIcon': Icons.cleaning_services, 'route': '/housekeeping'},
          {'label': 'Maint.', 'icon': Icons.build_outlined, 'selectedIcon': Icons.build, 'route': '/maintenance'},
          {'label': 'POS', 'icon': Icons.restaurant_outlined, 'selectedIcon': Icons.restaurant, 'route': '/waiter'},
          {'label': 'Settings', 'icon': Icons.settings_outlined, 'selectedIcon': Icons.settings, 'route': '/settings'},
        ];
    }
  }

  int _getSelectedIndex(String location, UserRole role) {
    final items = _getNavItems(role);
    for (int i = 0; i < items.length; i++) {
      if (items[i]['route'] == location) return i;
    }
    return 0;
  }

  void _onTap(BuildContext context, UserRole role, int index) {
    final items = _getNavItems(role);
    final route = items[index]['route'] as String;
    context.go(route);
  }
}

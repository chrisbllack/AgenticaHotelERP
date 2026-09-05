import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// ── User Roles ──
enum UserRole {
  staff,      // Housekeeping, maintenance, waiter, front desk agent
  admin,      // System administrator
  guest,      // Hotel guest (in-house)
  manager,    // Hotel manager / department heads
  owner,      // Hotel owner / investor
}

extension UserRoleExtension on UserRole {
  String get label {
    switch (this) {
      case UserRole.staff: return 'Staff';
      case UserRole.admin: return 'Administrator';
      case UserRole.guest: return 'Guest';
      case UserRole.manager: return 'Manager';
      case UserRole.owner: return 'Owner';
    }
  }

  String get icon {
    switch (this) {
      case UserRole.staff: return '👨‍🔧';
      case UserRole.admin: return '⚙️';
      case UserRole.guest: return '🏨';
      case UserRole.manager: return '👔';
      case UserRole.owner: return '💎';
    }
  }

  List<String> get permissions {
    switch (this) {
      case UserRole.staff:
        return [
          'housekeeping.read', 'housekeeping.update_status',
          'maintenance.read', 'maintenance.create_work_order',
          'pos.orders.read', 'pos.orders.create',
          'front_desk.read', 'guests.read',
        ];
      case UserRole.admin:
        return ['*']; // All permissions
      case UserRole.guest:
        return [
          'guest_profile.read',
          'folio.read',
          'services.book', // spa, room service, laundry
          'feedback.write',
          'concierge.read',
        ];
      case UserRole.manager:
        return [
          'dashboard.*', 'rooms.*', 'reservations.*',
          'front_desk.*', 'guests.*', 'housekeeping.*',
          'pos.*', 'inventory.read', 'finance.read',
          'hr.*', 'reports.*', 'approvals.*',
        ];
      case UserRole.owner:
        return [
          'dashboard.read', 'reports.read',
          'finance.read', 'finance.reports',
          'properties.read', 'occupancy.read',
          'revenue.read', 'pnl.read',
        ];
    }
  }

  bool hasPermission(String permission) {
    if (permissions.contains('*')) return true;
    if (permissions.contains(permission)) return true;
    // Check prefix match (e.g. 'housekeeping.*' matches 'housekeeping.read')
    for (final p in permissions) {
      if (p.endsWith('.*')) {
        final prefix = p.substring(0, p.length - 2);
        if (permission.startsWith('$prefix.')) return true;
      }
    }
    return false;
  }
}

// ── User Model ──
class AppUser {
  final String id;
  final String name;
  final String email;
  final UserRole role;
  final String? propertyId;
  final String? propertyName;
  final String? department;
  final String? avatarUrl;
  final String? roomNumber; // For guest role
  final String? folioId;    // For guest role

  const AppUser({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.propertyId,
    this.propertyName,
    this.department,
    this.avatarUrl,
    this.roomNumber,
    this.folioId,
  });

  AppUser copyWith({
    String? id,
    String? name,
    String? email,
    UserRole? role,
    String? propertyId,
    String? propertyName,
    String? department,
    String? avatarUrl,
    String? roomNumber,
    String? folioId,
  }) {
    return AppUser(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      role: role ?? this.role,
      propertyId: propertyId ?? this.propertyId,
      propertyName: propertyName ?? this.propertyName,
      department: department ?? this.department,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      roomNumber: roomNumber ?? this.roomNumber,
      folioId: folioId ?? this.folioId,
    );
  }
}

// ── Auth State ──
class AuthState {
  final bool isAuthenticated;
  final AppUser? user;
  final String? token;
  final String? error;
  final bool isLoading;

  AuthState({
    this.isAuthenticated = false,
    this.user,
    this.token,
    this.error,
    this.isLoading = false,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    AppUser? user,
    String? token,
    String? error,
    bool? isLoading,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      user: user ?? this.user,
      token: token ?? this.token,
      error: error,
      isLoading: isLoading ?? this.isLoading,
    );
  }

  UserRole get role => user?.role ?? UserRole.staff;
}

// ── Auth Notifier ──
class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(AuthState()) {
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    // Check secure storage for existing token
    // If valid, restore session
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      // In production: call API
      // For demo: determine role from email
      UserRole role = _guessRole(email);

      final user = AppUser(
        id: '1',
        name: _getNameForRole(role),
        email: email,
        role: role,
        propertyId: '1',
        propertyName: 'Grand Palm Hotel Lagos',
        department: role == UserRole.staff ? 'Front Desk' : null,
        roomNumber: role == UserRole.guest ? '301' : null,
        folioId: role == UserRole.guest ? 'F-301' : null,
      );

      state = state.copyWith(
        isAuthenticated: true,
        user: user,
        token: 'demo-token',
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> loginAsRole(UserRole role) async {
    state = state.copyWith(isLoading: true);
    final user = AppUser(
      id: '1',
      name: _getNameForRole(role),
      email: '${role.name}@infineon.com',
      role: role,
      propertyId: '1',
      propertyName: 'Grand Palm Hotel Lagos',
      roomNumber: role == UserRole.guest ? '301' : null,
      folioId: role == UserRole.guest ? 'F-301' : null,
    );
    state = state.copyWith(
      isAuthenticated: true,
      user: user,
      token: 'demo-token',
      isLoading: false,
    );
  }

  Future<void> logout() async {
    state = AuthState();
  }

  UserRole _guessRole(String email) {
    final lower = email.toLowerCase();
    if (lower.contains('admin')) return UserRole.admin;
    if (lower.contains('owner') || lower.contains('investor')) return UserRole.owner;
    if (lower.contains('manager') || lower.contains('gm')) return UserRole.manager;
    if (lower.contains('guest') || lower.contains('checkin')) return UserRole.guest;
    return UserRole.staff;
  }

  String _getNameForRole(UserRole role) {
    switch (role) {
      case UserRole.staff: return 'Chioma Eze';
      case UserRole.admin: return 'System Admin';
      case UserRole.guest: return 'Adebayo Johnson';
      case UserRole.manager: return 'Fatima Abubakar';
      case UserRole.owner: return 'Chief Obi Nwosu';
    }
  }
}

// ── Providers ──
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});

final currentUserProvider = Provider<AppUser?>((ref) {
  return ref.watch(authProvider).user;
});

final userRoleProvider = Provider<UserRole>((ref) {
  return ref.watch(authProvider).role;
});

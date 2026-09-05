import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:infineon_mobile/features/auth/auth_provider.dart';

class RolePickerScreen extends ConsumerWidget {
  const RolePickerScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primary,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Icon(Icons.hotel, size: 40, color: Colors.white),
                ),
                const SizedBox(height: 24),
                Text(
                  'INFINEON PMS',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'Select your role to continue',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.grey),
                ),
                const SizedBox(height: 40),

                // Role Cards
                ...UserRole.values.map((role) => _RoleCard(
                  role: role,
                  onTap: () async {
                    await ref.read(authProvider.notifier).loginAsRole(role);
                    if (context.mounted) context.go('/');
                  },
                )),

                const SizedBox(height: 24),

                // Or login with credentials
                TextButton(
                  onPressed: () => context.push('/login'),
                  child: const Text('Sign in with credentials instead →'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  final UserRole role;
  final VoidCallback onTap;

  const _RoleCard({required this.role, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final descriptions = {
      UserRole.owner: 'Multi-property overview, P&L, occupancy trends, revenue',
      UserRole.manager: 'Hotel dashboard, approvals, reports, department management',
      UserRole.admin: 'System configuration, users, roles, backups, integrations',
      UserRole.staff: 'Housekeeping, maintenance, POS, front desk operations',
      UserRole.guest: 'Room service, spa booking, folio view, feedback, concierge',
    };

    final colors = {
      UserRole.owner: Colors.amber,
      UserRole.manager: Colors.blue,
      UserRole.admin: Colors.purple,
      UserRole.staff: Colors.green,
      UserRole.guest: Colors.teal,
    };

    final color = colors[role]!;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border.all(color: color.withOpacity(0.3), width: 2),
            borderRadius: BorderRadius.circular(16),
            color: color.withOpacity(0.05),
          ),
          child: Row(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Center(child: Text(role.icon, style: const TextStyle(fontSize: 28))),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      role.label,
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: color),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      descriptions[role]!,
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: color),
            ],
          ),
        ),
      ),
    );
  }
}

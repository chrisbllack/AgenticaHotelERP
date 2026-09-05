import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:infineon_mobile/features/auth/auth_provider.dart';

class GuestDashboard extends ConsumerWidget {
  const GuestDashboard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Welcome'),
        actions: [
          IconButton(icon: const Icon(Icons.notifications_outlined), onPressed: () {}),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => await Future.delayed(const Duration(seconds: 1)),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome card
              Card(
                color: Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 28,
                        backgroundColor: Theme.of(context).colorScheme.primary,
                        child: const Icon(Icons.person, color: Colors.white, size: 30),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Welcome, ${user?.name ?? 'Guest'}!',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Room ${user?.roomNumber ?? '301'} • Grand Palm Hotel Lagos',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey.shade700),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Stay info
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Your Stay', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      _InfoRow(icon: Icons.login, label: 'Check-in', value: 'Aug 29, 2026 — 2:00 PM'),
                      _InfoRow(icon: Icons.logout, label: 'Check-out', value: 'Sep 2, 2026 — 12:00 PM'),
                      _InfoRow(icon: Icons.nights_stay, label: 'Nights', value: '4 nights'),
                      _InfoRow(icon: Icons.person, label: 'Guests', value: '2 adults'),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Folio summary
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Your Folio', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                          TextButton(
                            onPressed: () => context.push('/my-folio'),
                            child: const Text('View All →'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _FolioStat(label: 'Charges', value: '₦103,750', color: Colors.red),
                          _FolioStat(label: 'Payments', value: '₦100,000', color: Colors.green),
                          _FolioStat(label: 'Balance', value: '₦3,750', color: Colors.orange),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Quick actions
              Text('Services & Amenities', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              GridView.count(
                crossAxisCount: 3,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1,
                children: [
                  _ServiceTile(
                    icon: Icons.restaurant,
                    label: 'Room Service',
                    color: Colors.orange,
                    onTap: () => context.push('/room-service'),
                  ),
                  _ServiceTile(
                    icon: Icons.spa,
                    label: 'Spa & Wellness',
                    color: Colors.teal,
                    onTap: () => context.push('/spa'),
                  ),
                  _ServiceTile(
                    icon: Icons.local_laundry_service,
                    label: 'Laundry',
                    color: Colors.blue,
                    onTap: () {},
                  ),
                  _ServiceTile(
                    icon: Icons.directions_car,
                    label: 'Transport',
                    color: Colors.purple,
                    onTap: () {},
                  ),
                  _ServiceTile(
                    icon: Icons.tour,
                    label: 'Tours & Trips',
                    color: Colors.green,
                    onTap: () {},
                  ),
                  _ServiceTile(
                    icon: Icons.chat,
                    label: 'Concierge',
                    color: Colors.amber,
                    onTap: () {},
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Quick feedback
              Card(
                child: ListTile(
                  leading: const Icon(Icons.star_outline),
                  title: const Text('Rate Your Stay'),
                  subtitle: const Text('Help us improve your experience'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/feedback'),
                ),
              ),
              const SizedBox(height: 16),

              // WiFi info
              Card(
                child: ListTile(
                  leading: const Icon(Icons.wifi),
                  title: const Text('Hotel WiFi'),
                  subtitle: const Text('Network: GrandPalm_Guest'),
                  trailing: const Icon(Icons.copy, size: 18),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _InfoRow({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.grey.shade500),
          const SizedBox(width: 8),
          Text('$label: ', style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
          Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _FolioStat extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _FolioStat({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: color)),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
      ],
    );
  }
}

class _ServiceTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _ServiceTile({required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          border: Border.all(color: color.withOpacity(0.2)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 6),
            Text(label, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

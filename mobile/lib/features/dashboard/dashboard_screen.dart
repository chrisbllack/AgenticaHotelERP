import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:infineon_mobile/core/network/api_client.dart';

final dashboardProvider = FutureProvider.autoDispose<DashboardData>((ref) async {
  final client = ApiClient(baseUrl: await ApiClient.getServerUrl());
  final response = await client.get('/reports/dashboard');
  final payload = response['data'];

  if (payload is! Map) {
    throw const FormatException('Dashboard response is missing data');
  }

  return DashboardData.fromJson(Map<String, dynamic>.from(payload));
});

class DashboardData {
  final int arrivals;
  final int departures;
  final int occupiedRooms;
  final int cleanRooms;
  final int dirtyRooms;
  final int outOfOrderRooms;
  final double occupancyRate;
  final double todayTotalRevenue;

  const DashboardData({
    required this.arrivals,
    required this.departures,
    required this.occupiedRooms,
    required this.cleanRooms,
    required this.dirtyRooms,
    required this.outOfOrderRooms,
    required this.occupancyRate,
    required this.todayTotalRevenue,
  });

  factory DashboardData.fromJson(Map<String, dynamic> json) {
    int asInt(String key) => (json[key] as num?)?.round() ?? 0;
    double asDouble(String key) => (json[key] as num?)?.toDouble() ?? 0;

    return DashboardData(
      arrivals: asInt('today_arrivals'),
      departures: asInt('today_departures'),
      occupiedRooms: asInt('occupied_rooms'),
      cleanRooms: asInt('clean_rooms'),
      dirtyRooms: asInt('dirty_rooms'),
      outOfOrderRooms: asInt('out_of_order_rooms'),
      occupancyRate: asDouble('occupancy_rate'),
      todayTotalRevenue: asDouble('today_total_revenue'),
    );
  }
}

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboard = ref.watch(dashboardProvider);

    return dashboard.when(
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (_, __) => Scaffold(
        appBar: AppBar(title: const Text('Dashboard')),
        body: Center(
          child: FilledButton.icon(
            onPressed: () => ref.invalidate(dashboardProvider),
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ),
      ),
      data: (data) => Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () => context.push('/settings'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(dashboardProvider);
          await ref.read(dashboardProvider.future);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 24,
                        backgroundColor: Theme.of(context).colorScheme.primary,
                        child: const Icon(Icons.person, color: Colors.white),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Good Morning!',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.grey,
                            ),
                          ),
                          Text(
                            'Manager',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // KPI Grid
              Text(
                'Today\'s Overview',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.5,
                children: [
                  _KPICard(
                    title: 'Occupancy',
                    value: '${data.occupancyRate.round()}%',
                    icon: Icons.hotel,
                    color: Colors.blue,
                  ),
                  _KPICard(
                    title: 'Arrivals',
                    value: data.arrivals.toString(),
                    icon: Icons.login,
                    color: Colors.green,
                  ),
                  _KPICard(
                    title: 'Departures',
                    value: data.departures.toString(),
                    icon: Icons.logout,
                    color: Colors.orange,
                  ),
                  _KPICard(
                    title: 'Revenue',
                    value: _formatRevenue(data.todayTotalRevenue),
                    icon: Icons.attach_money,
                    color: Colors.purple,
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Quick Actions
              Text(
                'Quick Actions',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  _QuickAction(
                    icon: Icons.how_to_reg,
                    label: 'Check In',
                    onTap: () => context.push('/front-desk'),
                  ),
                  _QuickAction(
                    icon: Icons.how_to_vote,
                    label: 'Check Out',
                    onTap: () => context.push('/front-desk'),
                  ),
                  _QuickAction(
                    icon: Icons.cleaning_services,
                    label: 'Housekeeping',
                    onTap: () => context.push('/housekeeping'),
                  ),
                  _QuickAction(
                    icon: Icons.restaurant,
                    label: 'POS',
                    onTap: () => context.push('/waiter'),
                  ),
                  _QuickAction(
                    icon: Icons.build,
                    label: 'Maintenance',
                    onTap: () => context.push('/maintenance'),
                  ),
                  _QuickAction(
                    icon: Icons.cleaning_services,
                    label: 'Clean Room',
                    onTap: () => context.push('/housekeeping'),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Room Status Summary
              Text(
                'Room Status',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              _RoomStatusSummary(data: data),
            ],
          ),
        ),
      ),
      ),
    );
  }

  String _formatRevenue(double value) {
    if (value >= 1000000) return '₦${(value / 1000000).toStringAsFixed(1)}M';
    if (value >= 1000) return '₦${(value / 1000).toStringAsFixed(1)}K';
    return '₦${value.toStringAsFixed(0)}';
  }
}

class _KPICard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _KPICard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              children: [
                Icon(icon, size: 16, color: color),
                const SizedBox(width: 4),
                Text(title, style: Theme.of(context).textTheme.bodySmall),
                const Spacer(),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _QuickAction({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 100,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Icon(icon, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 4),
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _RoomStatusSummary extends StatelessWidget {
  final DashboardData data;

  const _RoomStatusSummary({required this.data});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            _StatusRow(label: 'Vacant Clean', count: data.cleanRooms, color: Colors.green),
            _StatusRow(label: 'Occupied', count: data.occupiedRooms, color: Colors.blue),
            _StatusRow(label: 'Vacant Dirty', count: data.dirtyRooms, color: Colors.orange),
            _StatusRow(label: 'Out of Order', count: data.outOfOrderRooms, color: Colors.red),
            _StatusRow(label: 'Arrivals', count: data.arrivals, color: Colors.purple),
            _StatusRow(label: 'Departures', count: data.departures, color: Colors.amber),
          ],
        ),
      ),
    );
  }
}

class _StatusRow extends StatelessWidget {
  final String label;
  final int count;
  final Color color;

  const _StatusRow({
    required this.label,
    required this.count,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(3),
            ),
          ),
          const SizedBox(width: 8),
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
          const Spacer(),
          Text(
            count.toString(),
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:infineon_mobile/features/auth/auth_provider.dart';

class OwnerDashboard extends ConsumerWidget {
  const OwnerDashboard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Owner Dashboard'),
        actions: [
          IconButton(icon: const Icon(Icons.notifications_outlined), onPressed: () {}),
          IconButton(icon: const Icon(Icons.settings), onPressed: () {}),
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
              // Welcome
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const CircleAvatar(
                            radius: 24,
                            backgroundColor: Colors.amber,
                            child: Icon(Icons.diamond, color: Colors.white),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Welcome, ${user?.name ?? 'Owner'}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                              Text(user?.propertyName ?? 'Grand Palm Hotels Group', style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Properties summary
              Text('Portfolio Overview', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              _PropertyCard(
                name: 'Grand Palm Hotel Lagos',
                occupancy: 78, adr: 25000, revenue: 2400000,
                status: 'Operating', rooms: 50, occupied: 39,
              ),
              _PropertyCard(
                name: 'Grand Palm Hotel Abuja',
                occupancy: 65, adr: 30000, revenue: 1950000,
                status: 'Operating', rooms: 80, occupied: 52,
              ),
              _PropertyCard(
                name: 'Grand Palm Resort Accra',
                occupancy: 82, adr: 35000, revenue: 2870000,
                status: 'Operating', rooms: 40, occupied: 33,
              ),
              const SizedBox(height: 24),

              // Financial KPIs
              Text('Financial Summary', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.5,
                children: [
                  _KPICard(title: 'Total Revenue', value: '₦7.2M', icon: Icons.trending_up, color: Colors.green),
                  _KPICard(title: 'Net Profit', value: '₦2.1M', icon: Icons.savings, color: Colors.blue),
                  _KPICard(title: 'Total Expenses', value: '₦5.1M', icon: Icons.receipt, color: Colors.orange),
                  _KPICard(title: 'Avg Occupancy', value: '75%', icon: Icons.hotel, color: Colors.purple),
                  _KPICard(title: 'Avg ADR', value: '₦28,500', icon: Icons.attach_money, color: Colors.teal),
                  _KPICard(title: 'RevPAR', value: '₦21,375', icon: Icons.analytics, color: Colors.indigo),
                ],
              ),
              const SizedBox(height: 24),

              // P&L summary
              Text('Profit & Loss', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _PLRow(label: 'Room Revenue', amount: 5200000, isPositive: true),
                      _PLRow(label: 'F&B Revenue', amount: 3500000, isPositive: true),
                      _PLRow(label: 'Spa & Other', amount: 850000, isPositive: true),
                      const Divider(),
                      _PLRow(label: 'Total Revenue', amount: 7220000, isPositive: true, bold: true),
                      const SizedBox(height: 12),
                      _PLRow(label: 'Staff Costs', amount: 2800000, isPositive: false),
                      _PLRow(label: 'Food & Beverage Cost', amount: 1200000, isPositive: false),
                      _PLRow(label: 'Utilities & Maintenance', amount: 650000, isPositive: false),
                      _PLRow(label: 'Other Expenses', amount: 450000, isPositive: false),
                      const Divider(),
                      _PLRow(label: 'Net Profit', amount: 2120000, isPositive: true, bold: true),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PropertyCard extends StatelessWidget {
  final String name;
  final int occupancy;
  final int adr;
  final int revenue;
  final String status;
  final int rooms;
  final int occupied;

  const _PropertyCard({
    required this.name, required this.occupancy, required this.adr,
    required this.revenue, required this.status, required this.rooms, required this.occupied,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(child: Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15))),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(12)),
                  child: Text(status, style: TextStyle(fontSize: 11, color: Colors.green.shade700, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _MiniStat(label: 'Occupancy', value: '$occupancy%', color: Colors.blue),
                _MiniStat(label: 'ADR', value: '₦${adr.toString()}', color: Colors.green),
                _MiniStat(label: 'Revenue', value: '₦${(revenue / 1000000).toStringAsFixed(1)}M', color: Colors.purple),
                _MiniStat(label: 'Rooms', value: '$occupied/$rooms', color: Colors.orange),
              ],
            ),
            const SizedBox(height: 8),
            // Occupancy bar
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: occupancy / 100.0,
                minHeight: 6,
                backgroundColor: Colors.grey.shade200,
                valueColor: AlwaysStoppedAnimation(occupancy > 80 ? Colors.green : occupancy > 50 ? Colors.blue : Colors.orange),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _MiniStat({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontWeight: FontWeight.bold, color: color, fontSize: 14)),
        Text(label, style: TextStyle(fontSize: 10, color: Colors.grey.shade600)),
      ],
    );
  }
}

class _KPICard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;
  const _KPICard({required this.title, required this.value, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(height: 4),
            Text(title, style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
            const SizedBox(height: 2),
            Text(value, style: TextStyle(fontWeight: FontWeight.bold, color: color, fontSize: 16)),
          ],
        ),
      ),
    );
  }
}

class _PLRow extends StatelessWidget {
  final String label;
  final double amount;
  final bool isPositive;
  final bool bold;
  const _PLRow({required this.label, required this.amount, required this.isPositive, this.bold = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontWeight: bold ? FontWeight.bold : FontWeight.normal, fontSize: 13)),
          Text(
            '${isPositive ? '' : '-'}₦${(amount / 1000).toStringAsFixed(0)}K',
            style: TextStyle(
              fontWeight: bold ? FontWeight.bold : FontWeight.w600,
              color: isPositive ? Colors.green.shade700 : Colors.red.shade700,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}

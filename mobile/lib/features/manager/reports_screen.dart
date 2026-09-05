import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ReportsScreen extends ConsumerWidget {
  const ReportsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reports & Analytics')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Revenue card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Today\'s Revenue', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _RevStat(label: 'Rooms', value: '₦1.2M', color: Colors.blue),
                      _RevStat(label: 'F&B', value: '₦680K', color: Colors.orange),
                      _RevStat(label: 'Spa', value: '₦150K', color: Colors.teal),
                      _RevStat(label: 'Total', value: '₦2.1M', color: Colors.green),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Available reports
          const Text('Available Reports', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          _ReportTile(icon: Icons.hotel, title: 'Occupancy Report', subtitle: 'Daily, weekly, monthly occupancy trends', color: Colors.blue),
          _ReportTile(icon: Icons.attach_money, title: 'Revenue Report', subtitle: 'Room revenue, ADR, RevPAR analysis', color: Colors.green),
          _ReportTile(icon: Icons.restaurant, title: 'POS Sales Report', subtitle: 'Outlet sales, waiter performance, top items', color: Colors.orange),
          _ReportTile(icon: Icons.trending_up, title: 'Financial Report', subtitle: 'P&L, balance sheet, cash flow', color: Colors.purple),
          _ReportTile(icon: Icons.inventory, title: 'Inventory Report', subtitle: 'Stock levels, consumption, wastage', color: Colors.teal),
          _ReportTile(icon: Icons.people, title: 'Guest Report', subtitle: 'Guest demographics, loyalty, repeat rate', color: Colors.indigo),
          _ReportTile(icon: Icons.assessment, title: 'Night Audit Report', subtitle: 'Business date summary and reconciliation', color: Colors.brown),
        ],
      ),
    );
  }
}

class _RevStat extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _RevStat({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontWeight: FontWeight.bold, color: color, fontSize: 16)),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
      ],
    );
  }
}

class _ReportTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  const _ReportTile({required this.icon, required this.title, required this.subtitle, required this.color});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: color.withOpacity(0.1),
          child: Icon(icon, color: color, size: 20),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12)),
        trailing: const Icon(Icons.chevron_right),
        onTap: () {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Generating $title...')),
          );
        },
      ),
    );
  }
}

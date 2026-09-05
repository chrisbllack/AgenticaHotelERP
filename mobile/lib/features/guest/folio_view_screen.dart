import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class FolioViewScreen extends ConsumerWidget {
  const FolioViewScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final charges = [
      {'desc': 'Room 301 — Night 1', 'debit': 25000.0, 'credit': 0.0, 'date': 'Aug 29'},
      {'desc': 'Room 301 — Night 2', 'debit': 25000.0, 'credit': 0.0, 'date': 'Aug 30'},
      {'desc': 'Room 301 — Night 3', 'debit': 25000.0, 'credit': 0.0, 'date': 'Aug 31'},
      {'desc': 'VAT (5%)', 'debit': 3750.0, 'credit': 0.0, 'date': 'Aug 31'},
      {'desc': 'Service Charge (10%)', 'debit': 7500.0, 'credit': 0.0, 'date': 'Aug 31'},
      {'desc': 'Room Service — Jollof Rice', 'debit': 3500.0, 'credit': 0.0, 'date': 'Aug 30'},
      {'desc': 'Spa — Swedish Massage', 'debit': 15000.0, 'credit': 0.0, 'date': 'Aug 31'},
      {'desc': 'Deposit (at check-in)', 'debit': 0.0, 'credit': 50000.0, 'date': 'Aug 29'},
      {'desc': 'Card Payment', 'debit': 0.0, 'credit': 50000.0, 'date': 'Aug 31'},
    ];

    final totalDebit = charges.fold<double>(0, (s, c) => s + (c['debit'] as double));
    final totalCredit = charges.fold<double>(0, (s, c) => s + (c['credit'] as double));
    final balance = totalDebit - totalCredit;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Folio'),
        actions: [
          IconButton(icon: const Icon(Icons.receipt_long), onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Invoice downloaded')));
          }),
        ],
      ),
      body: Column(
        children: [
          // Balance header
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [Colors.teal.shade700, Colors.teal.shade500]),
            ),
            child: Column(
              children: [
                const Text('Current Balance', style: TextStyle(color: Colors.white70, fontSize: 14)),
                const SizedBox(height: 4),
                Text(
                  '₦${balance.toStringAsFixed(2)}',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _BalanceStat(label: 'Charges', value: '₦${totalDebit.toStringAsFixed(0)}'),
                    _BalanceStat(label: 'Payments', value: '₦${totalCredit.toStringAsFixed(0)}'),
                  ],
                ),
              ],
            ),
          ),

          // Charges list
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: charges.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final charge = charges[index];
                final isCredit = (charge['credit'] as double) > 0;
                return ListTile(
                  title: Text(charge['desc'] as String, style: const TextStyle(fontSize: 14)),
                  subtitle: Text(charge['date'] as String, style: const TextStyle(fontSize: 12)),
                  trailing: Text(
                    isCredit ? '-₦${(charge['credit'] as double).toStringAsFixed(0)}' : '+₦${(charge['debit'] as double).toStringAsFixed(0)}',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: isCredit ? Colors.green : Colors.red.shade700,
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _BalanceStat extends StatelessWidget {
  final String label;
  final String value;
  const _BalanceStat({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 12)),
      ],
    );
  }
}

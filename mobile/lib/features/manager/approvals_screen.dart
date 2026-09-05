import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ApprovalsScreen extends ConsumerWidget {
  const ApprovalsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final approvals = [
      {'type': 'Purchase Order', 'desc': 'Kitchen equipment — ₦450,000', 'requestedBy': 'Store Manager', 'date': 'Today', 'urgency': 'high'},
      {'type': 'Refund', 'desc': 'Guest refund for cancelled reservation — ₦25,000', 'requestedBy': 'Front Desk', 'date': 'Today', 'urgency': 'medium'},
      {'type': 'Rate Change', 'desc': 'Weekend rate adjustment — Suite from ₦30K to ₦35K', 'requestedBy': 'Revenue Manager', 'date': 'Yesterday', 'urgency': 'low'},
      {'type': 'Inventory Adjustment', 'desc': 'Wastage claim — 5 bottles of wine', 'requestedBy': 'Bar Manager', 'date': 'Yesterday', 'urgency': 'medium'},
      {'type': 'Expense', 'desc': 'Generator fuel — ₦120,000', 'requestedBy': 'Maintenance', 'date': '2 days ago', 'urgency': 'high'},
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Pending Approvals')),
      body: approvals.isEmpty
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.check_circle_outline, size: 64, color: Colors.green),
                  SizedBox(height: 16),
                  Text('All caught up!', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  Text('No pending approvals'),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: approvals.length,
              itemBuilder: (context, index) {
                final approval = approvals[index];
                final urgencyColor = approval['urgency'] == 'high' ? Colors.red :
                    approval['urgency'] == 'medium' ? Colors.orange : Colors.green;

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: urgencyColor.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                approval['type'] as String,
                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: urgencyColor),
                              ),
                            ),
                            const Spacer(),
                            Text(approval['date'] as String, style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(approval['desc'] as String, style: const TextStyle(fontWeight: FontWeight.w600)),
                        const SizedBox(height: 4),
                        Text('Requested by ${approval['requestedBy']}', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('❌ ${approval['type']} rejected'), backgroundColor: Colors.red),
                                  );
                                },
                                icon: const Icon(Icons.close, size: 16),
                                label: const Text('Reject'),
                                style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('✅ ${approval['type']} approved'), backgroundColor: Colors.green),
                                  );
                                },
                                icon: const Icon(Icons.check, size: 16),
                                label: const Text('Approve'),
                                style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}

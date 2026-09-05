import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class MaintenanceScreen extends ConsumerStatefulWidget {
  const MaintenanceScreen({super.key});

  @override
  ConsumerState<MaintenanceScreen> createState() => _MaintenanceScreenState();
}

class _MaintenanceScreenState extends ConsumerState<MaintenanceScreen> {
  @override
  Widget build(BuildContext context) {
    final workOrders = [
      {'id': 'WO-101', 'room': '205', 'issue': 'AC not cooling', 'priority': 'high', 'status': 'pending', 'date': 'Today'},
      {'id': 'WO-102', 'room': '108', 'issue': 'Leaky faucet', 'priority': 'medium', 'status': 'in_progress', 'date': 'Today'},
      {'id': 'WO-103', 'room': '310', 'issue': 'TV not working', 'priority': 'low', 'status': 'pending', 'date': 'Yesterday'},
      {'id': 'WO-104', 'room': '401', 'issue': 'Door lock jammed', 'priority': 'urgent', 'status': 'pending', 'date': 'Today'},
      {'id': 'WO-105', 'room': '102', 'issue': 'Light bulb replacement', 'priority': 'low', 'status': 'completed', 'date': 'Today'},
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Maintenance'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () {},
          ),
        ],
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(8),
        itemCount: workOrders.length,
        itemBuilder: (context, index) {
          final order = workOrders[index];
          final priority = order['priority'] as String;
          final status = order['status'] as String;
          final priorityColor = priority == 'urgent'
              ? Colors.red
              : priority == 'high'
                  ? Colors.orange
                  : priority == 'medium'
                      ? Colors.amber
                      : Colors.grey;

          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              leading: Container(
                width: 4,
                decoration: BoxDecoration(
                  color: priorityColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              title: Row(
                children: [
                  Text(order['id'] as String, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                  const SizedBox(width: 8),
                  Expanded(child: Text(order['issue'] as String)),
                ],
              ),
              subtitle: Text('Room ${order['room']} • ${order['date']}'),
              trailing: Chip(
                label: Text(
                  status.replaceAll('_', ' '),
                  style: TextStyle(
                    fontSize: 10,
                    color: status == 'completed'
                        ? Colors.green
                        : status == 'in_progress'
                            ? Colors.blue
                            : Colors.orange,
                  ),
                ),
                backgroundColor: status == 'completed'
                    ? Colors.green.shade50
                    : status == 'in_progress'
                        ? Colors.blue.shade50
                        : Colors.orange.shade50,
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Show create work order dialog
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}

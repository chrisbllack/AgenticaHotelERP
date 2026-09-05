import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class HousekeepingScreen extends ConsumerStatefulWidget {
  const HousekeepingScreen({super.key});

  @override
  ConsumerState<HousekeepingScreen> createState() => _HousekeepingScreenState();
}

class _HousekeepingScreenState extends ConsumerState<HousekeepingScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Housekeeping'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Dirty (6)'),
            Tab(text: 'In Progress (3)'),
            Tab(text: 'Clean (18)'),
            Tab(text: 'Inspected (4)'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _RoomList(status: 'dirty'),
          _RoomList(status: 'in_progress'),
          _RoomList(status: 'clean'),
          _RoomList(status: 'inspected'),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: ElevatedButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.refresh),
            label: const Text('Refresh Room Status'),
          ),
        ),
      ),
    );
  }
}

class _RoomList extends StatelessWidget {
  final String status;
  const _RoomList({required this.status});

  @override
  Widget build(BuildContext context) {
    // Demo data — in production, fetch from API with offline cache
    final rooms = _getDemoRooms(status);

    if (rooms.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.check_circle, size: 64, color: Colors.green.shade300),
            const SizedBox(height: 16),
            Text(
              'All rooms are ${status == 'dirty' ? 'clean' : status}!',
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: rooms.length,
      itemBuilder: (context, index) {
        final room = rooms[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: _getStatusColor(status),
              child: Text(
                room['number'],
                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
              ),
            ),
            title: Text('Room ${room['number']} — ${room['type']}'),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Floor ${room['floor']} • ${room['beds']} bed(s)'),
                if (status == 'dirty')
                  Text(
                    'Last cleaned: ${room['lastCleaned']}',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                  ),
                if (room['isVip'] == true)
                  Container(
                    margin: const EdgeInsets.only(top: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.amber.shade100,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text('VIP', style: TextStyle(fontSize: 10, color: Colors.amber)),
                  ),
              ],
            ),
            trailing: _ActionButtons(status: status, roomNumber: room['number']),
          ),
        );
      },
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'dirty': return Colors.orange;
      case 'in_progress': return Colors.blue;
      case 'clean': return Colors.green;
      case 'inspected': return Colors.purple;
      default: return Colors.grey;
    }
  }

  List<Map<String, dynamic>> _getDemoRooms(String status) {
    switch (status) {
      case 'dirty':
        return [
          {'number': '101', 'type': 'Standard', 'floor': 1, 'beds': 1, 'lastCleaned': 'Yesterday', 'isVip': false},
          {'number': '205', 'type': 'Deluxe', 'floor': 2, 'beds': 2, 'lastCleaned': '2 days ago', 'isVip': false},
          {'number': '310', 'type': 'Suite', 'floor': 3, 'beds': 2, 'lastCleaned': 'Yesterday', 'isVip': true},
          {'number': '108', 'type': 'Standard', 'floor': 1, 'beds': 1, 'lastCleaned': '3 days ago', 'isVip': false},
          {'number': '212', 'type': 'Deluxe', 'floor': 2, 'beds': 2, 'lastCleaned': 'Yesterday', 'isVip': false},
          {'number': '401', 'type': 'Presidential', 'floor': 4, 'beds': 3, 'lastCleaned': 'Yesterday', 'isVip': true},
        ];
      case 'in_progress':
        return [
          {'number': '102', 'type': 'Standard', 'floor': 1, 'beds': 1, 'lastCleaned': 'N/A', 'isVip': false},
          {'number': '203', 'type': 'Deluxe', 'floor': 2, 'beds': 2, 'lastCleaned': 'N/A', 'isVip': false},
          {'number': '305', 'type': 'Suite', 'floor': 3, 'beds': 2, 'lastCleaned': 'N/A', 'isVip': true},
        ];
      case 'clean':
        return List.generate(18, (i) => {
          'number': '${(i + 1).toString().padLeft(3, '0')}',
          'type': i % 3 == 0 ? 'Suite' : i % 2 == 0 ? 'Deluxe' : 'Standard',
          'floor': (i ~/ 5) + 1,
          'beds': i % 3 == 0 ? 2 : 1,
          'lastCleaned': 'Just now',
          'isVip': i == 5,
        });
      case 'inspected':
        return [
          {'number': '104', 'type': 'Standard', 'floor': 1, 'beds': 1, 'lastCleaned': 'Today', 'isVip': false},
          {'number': '208', 'type': 'Deluxe', 'floor': 2, 'beds': 2, 'lastCleaned': 'Today', 'isVip': false},
          {'number': '302', 'type': 'Suite', 'floor': 3, 'beds': 2, 'lastCleaned': 'Today', 'isVip': true},
          {'number': '115', 'type': 'Standard', 'floor': 1, 'beds': 1, 'lastCleaned': 'Today', 'isVip': false},
        ];
      default:
        return [];
    }
  }
}

class _ActionButtons extends StatelessWidget {
  final String status;
  final String roomNumber;
  const _ActionButtons({required this.status, required this.roomNumber});

  @override
  Widget build(BuildContext context) {
    switch (status) {
      case 'dirty':
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.play_arrow, color: Colors.blue),
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Started cleaning Room $roomNumber')),
                );
              },
              tooltip: 'Start Cleaning',
            ),
          ],
        );
      case 'in_progress':
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.check, color: Colors.green),
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Room $roomNumber marked as clean')),
                );
              },
              tooltip: 'Mark Clean',
            ),
            IconButton(
              icon: const Icon(Icons.flag, color: Colors.red),
              onPressed: () {
                // Report maintenance issue
              },
              tooltip: 'Report Issue',
            ),
          ],
        );
      case 'clean':
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.search, color: Colors.purple),
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Room $roomNumber inspected')),
                );
              },
              tooltip: 'Inspect',
            ),
          ],
        );
      default:
        return const Icon(Icons.check_circle, color: Colors.green);
    }
  }
}

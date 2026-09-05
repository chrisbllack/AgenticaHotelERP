import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class FrontDeskScreen extends ConsumerStatefulWidget {
  const FrontDeskScreen({super.key});

  @override
  ConsumerState<FrontDeskScreen> createState() => _FrontDeskScreenState();
}

class _FrontDeskScreenState extends ConsumerState<FrontDeskScreen>
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
        title: const Text('Front Desk'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Arrivals (12)'),
            Tab(text: 'In-House (28)'),
            Tab(text: 'Departures (8)'),
            Tab(text: 'Rooms'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _ArrivalsTab(),
          _InHouseTab(),
          _DeparturesTab(),
          _RoomsTab(),
        ],
      ),
    );
  }
}

class _ArrivalsTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final arrivals = [
      {'name': 'Adebayo Johnson', 'room': '301', 'type': 'Suite', 'time': '2:00 PM', 'isVip': true, 'status': 'expected'},
      {'name': 'Fatima Abubakar', 'room': '205', 'type': 'Deluxe', 'time': '3:00 PM', 'isVip': false, 'status': 'expected'},
      {'name': 'Chen Wei', 'room': '108', 'type': 'Standard', 'time': '4:00 PM', 'isVip': false, 'status': 'early'},
      {'name': 'Grace Okafor', 'room': '401', 'type': 'Presidential', 'time': '2:00 PM', 'isVip': true, 'status': 'expected'},
      {'name': 'Mohammed Ali', 'room': '310', 'type': 'Suite', 'time': '5:00 PM', 'isVip': false, 'status': 'group'},
    ];

    return ListView.builder(
      padding: const EdgeInsets.all(8),
      itemCount: arrivals.length,
      itemBuilder: (context, index) {
        final arrival = arrivals[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: (arrival['isVip'] as bool) ? Colors.amber : Colors.blue,
              child: Text(
                (arrival['name'] as String).substring(0, 2),
                style: const TextStyle(color: Colors.white, fontSize: 12),
              ),
            ),
            title: Row(
              children: [
                Text(arrival['name'] as String),
                if (arrival['isVip'] as bool) ...[
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                    decoration: BoxDecoration(
                      color: Colors.amber.shade100,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text('VIP', style: TextStyle(fontSize: 9, color: Colors.amber)),
                  ),
                ],
              ],
            ),
            subtitle: Text('Room ${arrival['room']} • ${arrival['type']} • ETA ${arrival['time']}'),
            trailing: ElevatedButton(
              onPressed: () {
                // Navigate to check-in
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 12),
              ),
              child: const Text('Check In', style: TextStyle(fontSize: 12)),
            ),
          ),
        );
      },
    );
  }
}

class _InHouseTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.hotel, size: 48, color: Colors.blue),
          SizedBox(height: 16),
          Text('28 guests currently in-house'),
          SizedBox(height: 8),
          Text('Tap a guest to view folio or process checkout'),
        ],
      ),
    );
  }
}

class _DeparturesTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.logout, size: 48, color: Colors.orange),
          SizedBox(height: 16),
          Text('8 departures today'),
          SizedBox(height: 8),
          Text('3 guests have outstanding balances'),
        ],
      ),
    );
  }
}

class _RoomsTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // Simple room grid
    return GridView.builder(
      padding: const EdgeInsets.all(8),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 5,
        mainAxisSpacing: 4,
        crossAxisSpacing: 4,
        childAspectRatio: 1,
      ),
      itemCount: 50,
      itemBuilder: (context, index) {
        final roomNum = index + 1;
        final statuses = ['vacant_clean', 'occupied', 'dirty', 'reserved', 'ooo'];
        final status = statuses[index % 5];
        final color = status == 'vacant_clean'
            ? Colors.green
            : status == 'occupied'
                ? Colors.blue
                : status == 'dirty'
                    ? Colors.orange
                    : status == 'reserved'
                        ? Colors.purple
                        : Colors.red;

        return Container(
          decoration: BoxDecoration(
            color: color.withOpacity(0.15),
            border: Border.all(color: color, width: 1.5),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Center(
            child: Text(
              '$roomNum',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 12,
                color: color,
              ),
            ),
          ),
        );
      },
    );
  }
}

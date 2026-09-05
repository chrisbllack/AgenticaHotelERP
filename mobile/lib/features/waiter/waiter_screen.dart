import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class WaiterScreen extends ConsumerStatefulWidget {
  const WaiterScreen({super.key});

  @override
  ConsumerState<WaiterScreen> createState() => _WaiterScreenState();
}

class _WaiterScreenState extends ConsumerState<WaiterScreen> {
  int _selectedOutlet = 0;
  String? _selectedTable;
  final List<_OrderItem> _currentOrder = [];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('POS — Restaurant'),
        actions: [
          // Outlet selector
          DropdownButton<int>(
            value: _selectedOutlet,
            underline: const SizedBox(),
            items: const [
              DropdownMenuItem(value: 0, child: Text('Restaurant')),
              DropdownMenuItem(value: 1, child: Text('Bar')),
              DropdownMenuItem(value: 2, child: Text('Room Service')),
            ],
            onChanged: (v) => setState(() => _selectedOutlet = v ?? 0),
          ),
        ],
      ),
      body: Row(
        children: [
          // Left: Table grid or order
          Expanded(
            flex: 3,
            child: _selectedTable == null ? _buildTableGrid() : _buildOrderView(),
          ),
          // Right: Menu items
          if (_selectedTable != null)
            Expanded(
              flex: 2,
              child: _buildMenuPanel(),
            ),
        ],
      ),
      bottomNavigationBar: _selectedTable != null && _currentOrder.isNotEmpty
          ? SafeArea(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [BoxShadow(blurRadius: 4, color: Colors.black12)],
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${_currentOrder.length} items',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          Text(
                            '₦${_calculateTotal().toStringAsFixed(2)}',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton.icon(
                      onPressed: _submitOrder,
                      icon: const Icon(Icons.send),
                      label: const Text('Send Order'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton.icon(
                      onPressed: _billPayment,
                      icon: const Icon(Icons.payment),
                      label: const Text('Pay'),
                    ),
                  ],
                ),
              ),
            )
          : null,
    );
  }

  Widget _buildTableGrid() {
    // Demo table data
    final tables = List.generate(20, (i) => {
      'id': '${i + 1}',
      'number': 'T${i + 1}',
      'seats': (i % 4 + 2) * 2,
      'status': i < 8 ? 'occupied' : i < 12 ? 'available' : 'reserved',
      'guests': i < 8 ? (i % 4 + 1) : 0,
      'amount': i < 8 ? (i * 2500 + 5000).toDouble() : 0.0,
    });

    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Legend
          Wrap(
            spacing: 16,
            children: [
              _LegendItem(color: Colors.green, label: 'Available'),
              _LegendItem(color: Colors.red, label: 'Occupied'),
              _LegendItem(color: Colors.blue, label: 'Reserved'),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 4,
                mainAxisSpacing: 8,
                crossAxisSpacing: 8,
                childAspectRatio: 1,
              ),
              itemCount: tables.length,
              itemBuilder: (context, index) {
                final table = tables[index];
                final status = table['status'] as String;
                final color = status == 'available'
                    ? Colors.green
                    : status == 'occupied'
                        ? Colors.red
                        : Colors.blue;

                return InkWell(
                  onTap: () {
                    setState(() => _selectedTable = table['id'] as String);
                  },
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.1),
                      border: Border.all(color: color, width: 2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          table['number'] as String,
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: color,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${table['seats']} seats',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        if (status == 'occupied') ...[
                          const SizedBox(height: 4),
                          Text(
                            '₦${(table['amount'] as double).toStringAsFixed(0)}',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: color,
                            ),
                          ),
                          Text(
                            '${table['guests']} guests',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 10),
                          ),
                        ],
                        if (status == 'reserved')
                          Text(
                            'Reserved',
                            style: TextStyle(fontSize: 10, color: color),
                          ),
                      ],
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

  Widget _buildOrderView() {
    return Column(
      children: [
        // Table header
        Container(
          padding: const EdgeInsets.all(12),
          color: Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3),
          child: Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => setState(() {
                  _selectedTable = null;
                  _currentOrder.clear();
                }),
              ),
              Text(
                'Table $_selectedTable — New Order',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
        // Order items
        Expanded(
          child: _currentOrder.isEmpty
              ? const Center(
                  child: Text('Tap menu items to add to order'),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(8),
                  itemCount: _currentOrder.length,
                  itemBuilder: (context, index) {
                    final item = _currentOrder[index];
                    return Card(
                      child: ListTile(
                        title: Text(item.name),
                        subtitle: Text('₦${item.price.toStringAsFixed(0)} × ${item.quantity}'),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.remove_circle_outline, size: 20),
                              onPressed: () => _updateQuantity(index, -1),
                            ),
                            Text('${item.quantity}'),
                            IconButton(
                              icon: const Icon(Icons.add_circle_outline, size: 20),
                              onPressed: () => _updateQuantity(index, 1),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline, size: 20, color: Colors.red),
                              onPressed: () => setState(() => _currentOrder.removeAt(index)),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildMenuPanel() {
    final menuItems = [
      {'name': 'Jollof Rice & Chicken', 'price': 3500.0, 'category': 'Main'},
      {'name': 'Fried Rice & Fish', 'price': 3000.0, 'category': 'Main'},
      {'name': 'Pepper Soup (Goat)', 'price': 2500.0, 'category': 'Soup'},
      {'name': 'Egusi Soup & Pounded Yam', 'price': 2800.0, 'category': 'Soup'},
      {'name': 'Suya Platter', 'price': 2000.0, 'category': 'Grill'},
      {'name': 'Chapman Cocktail', 'price': 1500.0, 'category': 'Drink'},
      {'name': 'Fresh Orange Juice', 'price': 800.0, 'category': 'Drink'},
      {'name': 'Malt Drink', 'price': 600.0, 'category': 'Drink'},
      {'name': 'Garri Soaking', 'price': 500.0, 'category': 'Snack'},
      {'name': 'Puff Puff', 'price': 400.0, 'category': 'Snack'},
      {'name': 'Chin Chin', 'price': 500.0, 'category': 'Snack'},
      {'name': 'Fried Plantain', 'price': 700.0, 'category': 'Side'},
      {'name': 'Coleslaw', 'price': 500.0, 'category': 'Side'},
      {'name': 'Moimoi', 'price': 600.0, 'category': 'Side'},
      {'name': 'Grilled Tilapia', 'price': 4500.0, 'category': 'Grill'},
    ];

    return Container(
      color: Colors.grey.shade50,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(8),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search menu...',
                prefixIcon: const Icon(Icons.search, size: 20),
                isDense: true,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              itemCount: menuItems.length,
              itemBuilder: (context, index) {
                final item = menuItems[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 4),
                  child: ListTile(
                    dense: true,
                    title: Text(item['name'] as String, style: const TextStyle(fontSize: 13)),
                    subtitle: Text(
                      '₦${(item['price'] as double).toStringAsFixed(0)} • ${item['category']}',
                      style: const TextStyle(fontSize: 11),
                    ),
                    trailing: IconButton(
                      icon: const Icon(Icons.add_circle, color: Colors.green, size: 24),
                      onPressed: () => _addToOrder(
                        item['name'] as String,
                        item['price'] as double,
                      ),
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

  void _addToOrder(String name, double price) {
    setState(() {
      final existing = _currentOrder.indexWhere((i) => i.name == name);
      if (existing >= 0) {
        _currentOrder[existing].quantity++;
      } else {
        _currentOrder.add(_OrderItem(name: name, price: price));
      }
    });
  }

  void _updateQuantity(int index, int delta) {
    setState(() {
      _currentOrder[index].quantity += delta;
      if (_currentOrder[index].quantity <= 0) {
        _currentOrder.removeAt(index);
      }
    });
  }

  double _calculateTotal() {
    return _currentOrder.fold(0, (sum, item) => sum + item.price * item.quantity);
  }

  void _submitOrder() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Order sent to kitchen — ${_currentOrder.length} items'),
        backgroundColor: Colors.green,
      ),
    );
    setState(() => _currentOrder.clear());
  }

  void _billPayment() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Payment — Table $_selectedTable',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Total: ₦${_calculateTotal().toStringAsFixed(2)}',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
            const SizedBox(height: 24),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                _PaymentOption(
                  icon: Icons.money,
                  label: 'Cash',
                  onTap: () => Navigator.pop(context),
                ),
                _PaymentOption(
                  icon: Icons.credit_card,
                  label: 'Card (POS)',
                  onTap: () => Navigator.pop(context),
                ),
                _PaymentOption(
                  icon: Icons.phone,
                  label: 'Mobile Pay',
                  onTap: () => Navigator.pop(context),
                ),
                _PaymentOption(
                  icon: Icons.hotel,
                  label: 'Room Charge',
                  onTap: () => Navigator.pop(context),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _OrderItem {
  final String name;
  final double price;
  int quantity;

  _OrderItem({required this.name, required this.price, this.quantity = 1});
}

class _LegendItem extends StatelessWidget {
  final Color color;
  final String label;
  const _LegendItem({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 12, height: 12, decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(3),
        )),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 12)),
      ],
    );
  }
}

class _PaymentOption extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _PaymentOption({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 80,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade300),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Icon(icon, size: 28),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(fontSize: 11), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

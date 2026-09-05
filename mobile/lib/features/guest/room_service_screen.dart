import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class RoomServiceScreen extends ConsumerStatefulWidget {
  const RoomServiceScreen({super.key});

  @override
  ConsumerState<RoomServiceScreen> createState() => _RoomServiceScreenState();
}

class _RoomServiceScreenState extends ConsumerState<RoomServiceScreen> {
  final List<_OrderItem> _cart = [];
  String _selectedCategory = 'All';

  final menuData = <String, List<Map<String, dynamic>>>{
    'Breakfast': [
      {'name': 'Nigerian Breakfast', 'desc': 'Yam, eggs, beans, plantain, pepper soup', 'price': 4500, 'icon': '🍳'},
      {'name': 'Continental Breakfast', 'desc': 'Croissant, eggs, bacon, juice, coffee', 'price': 5500, 'icon': '🥐'},
      {'name': 'Oatmeal & Fruits', 'desc': 'Oats with honey, banana, berries', 'price': 3000, 'icon': '🥣'},
    ],
    'Lunch & Dinner': [
      {'name': 'Jollof Rice & Chicken', 'desc': 'Classic Nigerian jollof with grilled chicken', 'price': 3500, 'icon': '🍚'},
      {'name': 'Pepper Soup', 'desc': 'Goat meat pepper soup with eba', 'price': 3000, 'icon': '🍲'},
      {'name': 'Grilled Tilapia', 'desc': 'Whole tilapia with yam and sauce', 'price': 5000, 'icon': '🐟'},
      {'name': 'Egusi Soup & Pounded Yam', 'desc': 'Rich egusi with assorted meat', 'price': 3500, 'icon': '🥘'},
      {'name': 'Steak & Fries', 'desc': 'Grilled sirloin steak with seasoned fries', 'price': 8000, 'icon': '🥩'},
    ],
    'Snacks': [
      {'name': 'Suya Platter', 'desc': 'Grilled beef suya with onions and tomatoes', 'price': 2500, 'icon': '🍢'},
      {'name': 'Puff Puff (6 pcs)', 'desc': 'Freshly fried dough balls', 'price': 800, 'icon': '🍩'},
      {'name': 'Chin Chin', 'desc': 'Crispy fried snack', 'price': 500, 'icon': '🍿'},
    ],
    'Drinks': [
      {'name': 'Fresh Orange Juice', 'desc': 'Freshly squeezed', 'price': 800, 'icon': '🍊'},
      {'name': 'Chapman Cocktail', 'desc': 'Non-alcoholic cocktail', 'price': 1500, 'icon': '🍹'},
      {'name': 'Malt Drink', 'desc': 'Cold malt', 'price': 600, 'icon': '🍺'},
      {'name': 'Bottle Water (1L)', 'desc': 'Still water', 'price': 300, 'icon': '💧'},
    ],
  };

  List<Map<String, dynamic>> get _filteredItems {
    if (_selectedCategory == 'All') {
      return menuData.values.expand((e) => e).toList();
    }
    return menuData[_selectedCategory] ?? [];
  }

  @override
  Widget build(BuildContext context) {
    final total = _cart.fold<double>(0, (sum, item) => sum + item.price * item.quantity);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Room Service'),
        actions: [
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(icon: const Icon(Icons.shopping_cart), onPressed: _showCart),
              if (_cart.isNotEmpty)
                Positioned(
                  right: 8, top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                    child: Text('${_cart.fold(0, (int s, i) => s + i.quantity)}',
                      style: const TextStyle(color: Colors.white, fontSize: 10)),
                  ),
                ),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          // Category chips
          SizedBox(
            height: 50,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              children: ['All', ...menuData.keys].map((cat) {
                final isSelected = _selectedCategory == cat;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(cat),
                    selected: isSelected,
                    onSelected: (_) => setState(() => _selectedCategory = cat),
                    selectedColor: Colors.teal.shade100,
                  ),
                );
              }).toList(),
            ),
          ),

          // Menu items
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: _filteredItems.length,
              itemBuilder: (context, index) {
                final item = _filteredItems[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: Text(item['icon'] as String, style: const TextStyle(fontSize: 32)),
                    title: Text(item['name'] as String, style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text(item['desc'] as String, style: const TextStyle(fontSize: 12)),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('₦${item['price']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        InkWell(
                          onTap: () => _addToCart(item),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.teal, borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text('Add', style: TextStyle(color: Colors.white, fontSize: 11)),
                          ),
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
      bottomNavigationBar: _cart.isNotEmpty
          ? Container(
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
                        Text('${_cart.fold(0, (int s, i) => s + i.quantity)} items', style: const TextStyle(fontSize: 12)),
                        Text('₦${total.toStringAsFixed(0)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                  ElevatedButton.icon(
                    onPressed: _placeOrder,
                    icon: const Icon(Icons.send),
                    label: const Text('Place Order'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, foregroundColor: Colors.white),
                  ),
                ],
              ),
            )
          : null,
    );
  }

  void _addToCart(Map<String, dynamic> item) {
    setState(() {
      final existing = _cart.indexWhere((c) => c.name == item['name']);
      if (existing >= 0) {
        _cart[existing].quantity++;
      } else {
        _cart.add(_OrderItem(
          name: item['name'] as String,
          price: (item['price'] as num).toDouble(),
        ));
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('${item['name']} added to cart'), duration: const Duration(seconds: 1)),
    );
  }

  void _showCart() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        maxChildSize: 0.9,
        expand: false,
        builder: (ctx, scrollController) => Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Your Order', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
            ),
            Expanded(
              child: ListView.builder(
                controller: scrollController,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _cart.length,
                itemBuilder: (ctx, i) {
                  final item = _cart[i];
                  return ListTile(
                    title: Text(item.name),
                    subtitle: Text('₦${item.price.toStringAsFixed(0)} × ${item.quantity}'),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.remove_circle_outline, size: 20),
                          onPressed: () => setState(() {
                            item.quantity--;
                            if (item.quantity <= 0) _cart.removeAt(i);
                          }),
                        ),
                        Text('${item.quantity}'),
                        IconButton(
                          icon: const Icon(Icons.add_circle_outline, size: 20),
                          onPressed: () => setState(() => item.quantity++),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Total', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      Text('₦${_cart.fold<double>(0, (s, i) => s + i.price * i.quantity).toStringAsFixed(0)}',
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text('Estimated delivery: 25-35 minutes', style: TextStyle(fontSize: 12, color: Colors.grey)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _placeOrder() {
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('✅ Room service order placed! Estimated delivery: 25-35 min'),
        backgroundColor: Colors.green,
      ),
    );
    setState(() => _cart.clear());
  }
}

class _OrderItem {
  final String name;
  final double price;
  int quantity;
  _OrderItem({required this.name, required this.price, this.quantity = 1});
}

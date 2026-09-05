import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class SpaBookingScreen extends ConsumerStatefulWidget {
  const SpaBookingScreen({super.key});

  @override
  ConsumerState<SpaBookingScreen> createState() => _SpaBookingScreenState();
}

class _SpaBookingScreenState extends ConsumerState<SpaBookingScreen> {
  String? _selectedService;
  DateTime _selectedDate = DateTime.now();
  TimeOfDay _selectedTime = const TimeOfDay(hour: 10, minute: 0);

  final services = [
    {'name': 'Swedish Massage', 'duration': '60 min', 'price': 15000, 'icon': '💆'},
    {'name': 'Deep Tissue Massage', 'duration': '90 min', 'price': 20000, 'icon': '🤲'},
    {'name': 'Facial Treatment', 'duration': '45 min', 'price': 12000, 'icon': '🧴'},
    {'name': 'Manicure & Pedicure', 'duration': '60 min', 'price': 8000, 'icon': '💅'},
    {'name': 'Hair Styling', 'duration': '45 min', 'price': 10000, 'icon': '✂️'},
    {'name': 'Steam & Sauna', 'duration': '30 min', 'price': 5000, 'icon': '♨️'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Spa & Wellness')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Choose a Service', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            ...services.map((service) {
              final isSelected = _selectedService == service['name'];
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: isSelected ? Colors.teal : Colors.transparent, width: 2),
                ),
                child: ListTile(
                  leading: Text(service['icon'] as String, style: const TextStyle(fontSize: 32)),
                  title: Text(service['name'] as String, style: const TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text('${service['duration']} • ₦${service['price']}'),
                  trailing: isSelected ? const Icon(Icons.check_circle, color: Colors.teal) : null,
                  onTap: () => setState(() => _selectedService = service['name']),
                ),
              );
            }),

            if (_selectedService != null) ...[
              const SizedBox(height: 24),
              Text('Select Date & Time', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              Card(
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.calendar_today),
                      title: Text('${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}'),
                      subtitle: const Text('Date'),
                      onTap: () async {
                        final date = await showDatePicker(context: context, initialDate: _selectedDate, firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 30)));
                        if (date != null) setState(() => _selectedDate = date);
                      },
                    ),
                    const Divider(height: 1),
                    ListTile(
                      leading: const Icon(Icons.access_time),
                      title: Text(_selectedTime.format(context)),
                      subtitle: const Text('Time'),
                      onTap: () async {
                        final time = await showTimePicker(context: context, initialTime: _selectedTime);
                        if (time != null) setState(() => _selectedTime = time);
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _bookService,
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 16)),
                  child: const Text('Book Appointment'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _bookService() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('✅ $_selectedService booked for ${_selectedDate.day}/${_selectedDate.month} at ${_selectedTime.format(context)}'),
        backgroundColor: Colors.teal,
      ),
    );
    Navigator.pop(context);
  }
}

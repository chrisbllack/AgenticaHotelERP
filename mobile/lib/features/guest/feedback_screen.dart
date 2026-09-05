import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class FeedbackScreen extends ConsumerStatefulWidget {
  const FeedbackScreen({super.key});

  @override
  ConsumerState<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends ConsumerState<FeedbackScreen> {
  int _overallRating = 0;
  int _roomRating = 0;
  int _serviceRating = 0;
  int _foodRating = 0;
  final _commentController = TextEditingController();
  final _issues = <String>[];
  bool _wouldRecommend = true;

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Rate Your Stay')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Overall rating
            Center(
              child: Column(
                children: [
                  Text(_overallRating > 0 ? _getEmoji(_overallRating) : '🏨', style: const TextStyle(fontSize: 48)),
                  const SizedBox(height: 8),
                  Text(_overallRating > 0 ? _getLabel(_overallRating) : 'How was your stay?',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  _StarRating(rating: _overallRating, onChanged: (r) => setState(() => _overallRating = r)),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Category ratings
            Text('Detailed Ratings', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _RatingRow(label: '🛏️ Room Cleanliness', rating: _roomRating, onChanged: (r) => setState(() => _roomRating = r)),
            _RatingRow(label: '🧑‍💼 Staff Service', rating: _serviceRating, onChanged: (r) => setState(() => _serviceRating = r)),
            _RatingRow(label: '🍽️ Food & Drinks', rating: _foodRating, onChanged: (r) => setState(() => _foodRating = r)),

            const SizedBox(height: 24),

            // Issues
            Text('Any Issues?', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: ['Cleanliness', 'Noise', 'AC/Heating', 'WiFi', 'Plumbing', 'Pests', 'Room Service', 'Other'].map((issue) {
                final selected = _issues.contains(issue);
                return FilterChip(
                  label: Text(issue, style: TextStyle(fontSize: 12)),
                  selected: selected,
                  onSelected: (sel) => setState(() {
                    if (sel) _issues.add(issue);
                    else _issues.remove(issue);
                  }),
                  selectedColor: Colors.orange.shade100,
                );
              }).toList(),
            ),

            const SizedBox(height: 24),

            // Comment
            Text('Comments', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            TextField(
              controller: _commentController,
              maxLines: 4,
              decoration: const InputDecoration(
                hintText: 'Tell us about your experience...',
                border: OutlineInputBorder(),
              ),
            ),

            const SizedBox(height: 16),

            // Recommend
            SwitchListTile(
              title: const Text('Would you recommend us?'),
              value: _wouldRecommend,
              onChanged: (v) => setState(() => _wouldRecommend = v),
            ),

            const SizedBox(height: 24),

            // Submit
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _overallRating > 0 ? _submitFeedback : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.teal,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: const Text('Submit Feedback'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getEmoji(int rating) {
    switch (rating) {
      case 1: return '😞';
      case 2: return '😕';
      case 3: return '😐';
      case 4: return '😊';
      case 5: return '🤩';
      default: return '🏨';
    }
  }

  String _getLabel(int rating) {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Below Average';
      case 3: return 'Average';
      case 4: return 'Good';
      case 5: return 'Excellent';
      default: return '';
    }
  }

  void _submitFeedback() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('✅ Thank you for your feedback!'), backgroundColor: Colors.teal),
    );
    Navigator.pop(context);
  }
}

class _StarRating extends StatelessWidget {
  final int rating;
  final ValueChanged<int> onChanged;
  const _StarRating({required this.rating, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(5, (i) => IconButton(
        icon: Icon(i < rating ? Icons.star : Icons.star_border, color: Colors.amber, size: 32),
        onPressed: () => onChanged(i + 1),
      )),
    );
  }
}

class _RatingRow extends StatelessWidget {
  final String label;
  final int rating;
  final ValueChanged<int> onChanged;
  const _RatingRow({required this.label, required this.rating, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Expanded(child: Text(label, style: const TextStyle(fontWeight: FontWeight.w500))),
          ...List.generate(5, (i) => GestureDetector(
            onTap: () => onChanged(i + 1),
            child: Icon(i < rating ? Icons.star : Icons.star_border, color: Colors.amber, size: 24),
          )),
        ],
      ),
    );
  }
}

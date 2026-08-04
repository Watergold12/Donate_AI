import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../data/models/donor_models.dart';
import '../../data/services/donor_service.dart';

class ScanCatalogTab extends StatefulWidget {
  final DonorService donorService;
  final VoidCallback onDonationSubmitted;

  const ScanCatalogTab({
    super.key,
    required this.donorService,
    required this.onDonationSubmitted,
  });

  @override
  State<ScanCatalogTab> createState() => _ScanCatalogTabState();
}

class _ScanCatalogTabState extends State<ScanCatalogTab> {
  final _notesController = TextEditingController();
  final List<DetectedItem> _catalog = [];
  bool _isScanning = false;
  bool _isSubmitting = false;

  final _categories = const ['clothing', 'food', 'books', 'electronics', 'medical', 'furniture', 'toys', 'other'];
  final _conditions = const ['new', 'like_new', 'good', 'fair'];

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _handleScan() async {
    setState(() => _isScanning = true);
    try {
      final items = await widget.donorService.runAiScan();
      if (!mounted) return;
      setState(() {
        _catalog.addAll(items);
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('AI auto-detected ${items.length} donation item(s)!'),
          backgroundColor: AppColors.success,
        ),
      );
    } finally {
      if (mounted) setState(() => _isScanning = false);
    }
  }

  void _addManualItem() {
    setState(() {
      _catalog.add(
        DetectedItem(
          name: 'New Donation Item',
          category: 'other',
          confidence: 1.0,
          condition: 'good',
          description: '',
          count: 1,
        ),
      );
    });
  }

  Future<void> _handleSubmit() async {
    if (_catalog.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please scan or add items before submitting.')),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final success = await widget.donorService.submitDonation(
        _catalog,
        _notesController.text.trim(),
      );
      if (!mounted) return;
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Donation submitted! AI matching engine initiated.'),
            backgroundColor: AppColors.primary,
          ),
        );
        setState(() {
          _catalog.clear();
          _notesController.clear();
        });
        widget.onDonationSubmitted();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Submission failed. Please check your backend connection.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // Camera / Scan Banner Card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.qr_code_scanner,
                    size: 40,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Scan & Catalog Items',
                  style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                Text(
                  'Scan items with AI or manually add catalog details for donor matching.',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: isDark ? AppColors.darkMutedText : AppColors.lightMutedText,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _isScanning ? null : _handleScan,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        icon: _isScanning
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Icon(Icons.camera_alt),
                        label: Text(_isScanning ? 'Scanning...' : 'AI Scan Photo'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    OutlinedButton.icon(
                      onPressed: _addManualItem,
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      icon: const Icon(Icons.add),
                      label: const Text('Add Manual'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 20),

        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Cataloged Items (${_catalog.length})',
              style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            if (_catalog.isNotEmpty)
              TextButton(
                onPressed: () => setState(() => _catalog.clear()),
                child: const Text('Clear All', style: TextStyle(color: AppColors.error)),
              ),
          ],
        ),

        const SizedBox(height: 8),

        if (_catalog.isEmpty)
          Container(
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkSurface : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark ? Colors.white10 : Colors.black12,
              ),
            ),
            child: Column(
              children: [
                const Icon(Icons.inventory_2_outlined, size: 36, color: AppColors.lightMutedText),
                const SizedBox(height: 8),
                Text(
                  'No items cataloged yet',
                  style: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 4),
                Text(
                  'Tap AI Scan Photo or Add Manual to add items to your donation.',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: isDark ? AppColors.darkMutedText : AppColors.lightMutedText,
                  ),
                ),
              ],
            ),
          )
        else
          Column(
            children: _catalog.asMap().entries.map((entry) {
              final idx = entry.key;
              final item = entry.value;

              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              initialValue: item.name,
                              decoration: const InputDecoration(
                                labelText: 'Item Name',
                                isDense: true,
                              ),
                              onChanged: (val) => item.name = val,
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete_outline, color: AppColors.error),
                            onPressed: () {
                              setState(() => _catalog.removeAt(idx));
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              initialValue: _categories.contains(item.category.toLowerCase())
                                  ? item.category.toLowerCase()
                                  : 'other',
                              decoration: const InputDecoration(labelText: 'Category', isDense: true),
                              items: _categories.map((cat) {
                                return DropdownMenuItem(
                                  value: cat,
                                  child: Text(cat.toUpperCase()),
                                );
                              }).toList(),
                              onChanged: (val) {
                                if (val != null) setState(() => item.category = val);
                              },
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              initialValue: _conditions.contains(item.condition.toLowerCase())
                                  ? item.condition.toLowerCase()
                                  : 'good',
                              decoration: const InputDecoration(labelText: 'Condition', isDense: true),
                              items: _conditions.map((cond) {
                                return DropdownMenuItem(
                                  value: cond,
                                  child: Text(cond.replaceAll('_', ' ').toUpperCase()),
                                );
                              }).toList(),
                              onChanged: (val) {
                                if (val != null) setState(() => item.condition = val);
                              },
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Text('Quantity:', style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold)),
                          IconButton(
                            icon: const Icon(Icons.remove_circle_outline, size: 20),
                            onPressed: () {
                              if (item.count > 1) setState(() => item.count--);
                            },
                          ),
                          Text('${item.count}', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                          IconButton(
                            icon: const Icon(Icons.add_circle_outline, size: 20),
                            onPressed: () => setState(() => item.count++),
                          ),
                          const Spacer(),
                          Text(
                            '${(item.confidence * 100).toInt()}% AI Conf.',
                            style: const TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),

        if (_catalog.isNotEmpty) ...[
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Donation Notes (Optional)', style: theme.textTheme.titleSmall),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _notesController,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      hintText: 'Add pickup preferences or notes for NGOs...',
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _isSubmitting ? null : _handleSubmit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.success,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      icon: _isSubmitting
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Icon(Icons.send),
                      label: Text(_isSubmitting ? 'Submitting...' : 'Submit Donation for AI Matching'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }
}

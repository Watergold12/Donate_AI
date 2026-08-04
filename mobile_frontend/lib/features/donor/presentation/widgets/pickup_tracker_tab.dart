import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../data/models/donor_models.dart';
import '../../data/services/donor_service.dart';

class PickupTrackerTab extends StatefulWidget {
  final DonorService donorService;

  const PickupTrackerTab({super.key, required this.donorService});

  @override
  State<PickupTrackerTab> createState() => _PickupTrackerTabState();
}

class _PickupTrackerTabState extends State<PickupTrackerTab> {
  late Future<List<PickupRecord>> _pickupsFuture;
  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    _pickupsFuture = widget.donorService.getPickups();
  }

  Future<void> _refresh() async {
    setState(() {
      _pickupsFuture = widget.donorService.getPickups();
    });
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'in_transit':
        return AppColors.warning;
      case 'completed':
        return AppColors.success;
      case 'scheduled':
      default:
        return AppColors.primary;
    }
  }

  String _formatStatusLabel(String status) {
    switch (status.toLowerCase()) {
      case 'in_transit':
        return 'In Transit';
      case 'completed':
        return 'Completed';
      case 'scheduled':
      default:
        return 'Scheduled';
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return RefreshIndicator(
      onRefresh: _refresh,
      child: FutureBuilder<List<PickupRecord>>(
        future: _pickupsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final allPickups = snapshot.data ?? [];
          final filteredPickups = allPickups.where((p) {
            if (_filter == 'all') return true;
            return p.status.toLowerCase() == _filter;
          }).toList();

          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              // Title Banner
              Text(
                'Pickup & Logistics Tracker',
                style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              Text(
                'Track courier assignment, arrival time slots, and real-time pickup status.',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: isDark ? AppColors.darkMutedText : AppColors.lightMutedText,
                ),
              ),

              const SizedBox(height: 16),

              // Filter Chips
              Row(
                children: [
                  _buildFilterChip('All', 'all'),
                  const SizedBox(width: 8),
                  _buildFilterChip('Active', 'in_transit'),
                  const SizedBox(width: 8),
                  _buildFilterChip('Scheduled', 'scheduled'),
                  const SizedBox(width: 8),
                  _buildFilterChip('Completed', 'completed'),
                ],
              ),

              const SizedBox(height: 16),

              if (filteredPickups.isEmpty)
                Container(
                  padding: const EdgeInsets.all(32),
                  alignment: Alignment.center,
                  child: const Column(
                    children: [
                      Icon(Icons.local_shipping_outlined, size: 48, color: AppColors.lightMutedText),
                      SizedBox(height: 8),
                      Text('No pickups found for selected status.'),
                    ],
                  ),
                )
              else
                ...filteredPickups.map((pickup) {
                  final color = _getStatusColor(pickup.status);
                  final statusText = _formatStatusLabel(pickup.status);

                  return Card(
                    margin: const EdgeInsets.only(bottom: 16),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Pickup #${pickup.id}',
                                style: theme.textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.lightMutedText,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: color.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  statusText,
                                  style: TextStyle(
                                    color: color,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 12),

                          Row(
                            children: [
                              const Icon(Icons.calendar_today, size: 16, color: AppColors.primary),
                              const SizedBox(width: 8),
                              Text(
                                '${pickup.scheduledDate} (${pickup.timeSlot})',
                                style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),

                          const SizedBox(height: 8),

                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.location_on_outlined, size: 16, color: AppColors.error),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  pickup.address,
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: isDark ? AppColors.darkMutedText : AppColors.lightMutedText,
                                  ),
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 12),
                          const Divider(),
                          const SizedBox(height: 8),

                          // Driver Details Box
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: isDark ? AppColors.darkBackground : AppColors.lightBackground,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  backgroundColor: AppColors.primary.withOpacity(0.15),
                                  radius: 20,
                                  child: const Icon(Icons.person, color: AppColors.primary),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        pickup.driverName,
                                        style: theme.textTheme.bodyMedium?.copyWith(
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      Text(
                                        'Vehicle: ${pickup.vehicleNo}',
                                        style: theme.textTheme.bodySmall?.copyWith(
                                          color: isDark ? AppColors.darkMutedText : AppColors.lightMutedText,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.phone, color: AppColors.success),
                                  onPressed: () {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text('Calling driver ${pickup.driverPhone}...')),
                                    );
                                  },
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 12),

                          Text(
                            'Items for pickup: ${pickup.itemNames.join(', ')}',
                            style: theme.textTheme.bodySmall?.copyWith(
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
            ],
          );
        },
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _filter == value;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      selectedColor: AppColors.primary,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : AppColors.lightMutedText,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
      onSelected: (selected) {
        if (selected) setState(() => _filter = value);
      },
    );
  }
}

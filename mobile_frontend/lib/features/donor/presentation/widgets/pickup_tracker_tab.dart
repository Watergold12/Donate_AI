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
  late Future<List<DonationRecord>> _donationsFuture;
  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() {
    _pickupsFuture = widget.donorService.getPickups();
    _donationsFuture = widget.donorService.getRecentDonations();
  }

  Future<void> _refresh() async {
    setState(() {
      _loadData();
    });
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'in_transit':
      case 'collected':
        return AppColors.warning;
      case 'completed':
      case 'delivered':
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
      case 'collected':
        return 'Collected';
      case 'completed':
      case 'delivered':
        return 'Completed';
      case 'scheduled':
      default:
        return 'Scheduled';
    }
  }

  void _showScheduleModal(BuildContext context, List<DonationRecord> donations) {
    final schedulable = donations.where((d) {
      return !['completed', 'cancelled', 'pickup_scheduled', 'collected', 'delivered'].contains(d.status.toLowerCase());
    }).toList();

    if (schedulable.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No active donations waiting for pickup scheduling.')),
      );
      return;
    }

    String selectedDonationId = schedulable.first.id;
    final dateController = TextEditingController(text: DateTime.now().add(const Duration(days: 1)).toString().split(' ')[0]);
    String timeSlot = '09:00 - 12:00';
    final addressController = TextEditingController();
    final notesController = TextEditingController();
    bool isSaving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (modalCtx, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                top: 20,
                left: 20,
                right: 20,
                bottom: MediaQuery.of(modalCtx).viewInsets.bottom + 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Schedule Pickup', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: selectedDonationId,
                      decoration: const InputDecoration(labelText: 'Select Donation'),
                      items: schedulable.map((d) {
                        return DropdownMenuItem(
                          value: d.id,
                          child: Text('${d.totalItems} item(s) (${d.status})'),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setModalState(() => selectedDonationId = val);
                      },
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: dateController,
                      decoration: const InputDecoration(
                        labelText: 'Scheduled Date (YYYY-MM-DD)',
                        prefixIcon: Icon(Icons.calendar_today),
                      ),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: timeSlot,
                      decoration: const InputDecoration(labelText: 'Time Slot'),
                      items: const [
                        DropdownMenuItem(value: '09:00 - 12:00', child: Text('Morning (09:00 - 12:00)')),
                        DropdownMenuItem(value: '12:00 - 15:00', child: Text('Afternoon (12:00 - 15:00)')),
                        DropdownMenuItem(value: '15:00 - 18:00', child: Text('Evening (15:00 - 18:00)')),
                      ],
                      onChanged: (val) {
                        if (val != null) setModalState(() => timeSlot = val);
                      },
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: addressController,
                      decoration: const InputDecoration(
                        labelText: 'Pickup Address',
                        prefixIcon: Icon(Icons.location_on_outlined),
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                        onPressed: isSaving
                            ? null
                            : () async {
                                if (addressController.text.trim().isEmpty) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Please enter a pickup address.')),
                                  );
                                  return;
                                }

                                setModalState(() => isSaving = true);
                                final ok = await widget.donorService.schedulePickup(
                                  donationId: selectedDonationId,
                                  scheduledDate: dateController.text.trim(),
                                  timeSlot: timeSlot,
                                  address: addressController.text.trim(),
                                  notes: notesController.text.trim(),
                                );
                                if (!modalCtx.mounted) return;
                                Navigator.pop(modalCtx);
                                if (ok && mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Pickup scheduled successfully!'),
                                      backgroundColor: AppColors.success,
                                    ),
                                  );
                                  _refresh();
                                }
                              },
                        child: Text(isSaving ? 'Scheduling...' : 'Confirm Pickup Schedule'),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return RefreshIndicator(
      onRefresh: _refresh,
      child: FutureBuilder<List<dynamic>>(
        future: Future.wait([_pickupsFuture, _donationsFuture]),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final pickups = (snapshot.data?[0] as List<PickupRecord>?) ?? [];
          final donations = (snapshot.data?[1] as List<DonationRecord>?) ?? [];

          final filteredPickups = pickups.where((p) {
            if (_filter == 'all') return true;
            return p.status.toLowerCase() == _filter;
          }).toList();

          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              // Header Card
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Pickup Tracker',
                          style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                        ),
                        Text(
                          'Track courier assignment and scheduled pickup windows.',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: isDark ? AppColors.darkMutedText : AppColors.lightMutedText,
                          ),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton.icon(
                    onPressed: () => _showScheduleModal(context, donations),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: const Icon(Icons.add, size: 18),
                    label: const Text('Schedule'),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // Filter Chips
              Row(
                children: [
                  _buildFilterChip('All', 'all'),
                  const SizedBox(width: 8),
                  _buildFilterChip('Scheduled', 'scheduled'),
                  const SizedBox(width: 8),
                  _buildFilterChip('In Transit', 'in_transit'),
                  const SizedBox(width: 8),
                  _buildFilterChip('Completed', 'completed'),
                ],
              ),

              const SizedBox(height: 16),

              if (filteredPickups.isEmpty)
                Container(
                  padding: const EdgeInsets.all(32),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkSurface : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.local_shipping_outlined, size: 48, color: AppColors.lightMutedText),
                      const SizedBox(height: 8),
                      Text(
                        'No pickups found',
                        style: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Tap + Schedule to create a pickup window for your donation.',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: isDark ? AppColors.darkMutedText : AppColors.lightMutedText,
                        ),
                      ),
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
                                'Pickup #${pickup.id.isNotEmpty ? pickup.id.substring(0, 8) : '001'}',
                                style: theme.textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.lightMutedText,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: color.withValues(alpha: 0.15),
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
                                  backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                                  radius: 18,
                                  child: const Icon(Icons.person, color: AppColors.primary, size: 20),
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

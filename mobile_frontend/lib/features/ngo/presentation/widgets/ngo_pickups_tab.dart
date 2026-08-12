import 'package:flutter/material.dart';

import 'package:mobile_frontend/core/theme/app_colors.dart';
import 'package:mobile_frontend/features/ngo/data/models/ngo_pickup_model.dart';
import 'package:mobile_frontend/features/ngo/data/services/ngo_pickup_service.dart';

class NGOPickupsTab extends StatefulWidget {
  final NGOPickupService pickupService;

  const NGOPickupsTab({super.key, required this.pickupService});

  @override
  State<NGOPickupsTab> createState() => _NGOPickupsTabState();
}

class _NGOPickupsTabState extends State<NGOPickupsTab> {
  final List<NGOPickup> _pickups = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  int _page = 1;
  int _totalPages = 1;
  String _statusFilter = 'scheduled';
  String? _actionPickupId;

  @override
  void initState() {
    super.initState();
    _loadPickups();
  }

  Future<void> _loadPickups({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _page = 1;
        _pickups.clear();
        _isLoading = true;
      });
    } else {
      setState(() => _isLoadingMore = true);
    }

    try {
      final envelope = await widget.pickupService.getPickups(
        page: _page,
        size: 10,
        statusFilter: _statusFilter,
      );
      
      setState(() {
        _pickups.addAll(envelope.data ?? []);
        _totalPages = envelope.pagination?['pages'] as int? ?? 1;
        _isLoading = false;
        _isLoadingMore = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _isLoadingMore = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load pickups: $e')),
        );
      }
    }
  }

  void _loadMore() {
    if (!_isLoadingMore && _page < _totalPages) {
      _page++;
      _loadPickups();
    }
  }

  Future<void> _updateStatus(String pickupId, String status, String successMessage) async {
    setState(() => _actionPickupId = pickupId);
    try {
      await widget.pickupService.updatePickupStatus(pickupId, status);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(successMessage)),
        );
        _loadPickups(refresh: true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update status: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _actionPickupId = null);
      }
    }
  }

  Widget _buildFilterChips() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            ChoiceChip(
              label: const Text('Scheduled'),
              selected: _statusFilter == 'scheduled',
              onSelected: (selected) {
                if (selected) {
                  setState(() => _statusFilter = 'scheduled');
                  _loadPickups(refresh: true);
                }
              },
            ),
            const SizedBox(width: 8),
            ChoiceChip(
              label: const Text('In Transit'),
              selected: _statusFilter == 'in_transit',
              onSelected: (selected) {
                if (selected) {
                  setState(() => _statusFilter = 'in_transit');
                  _loadPickups(refresh: true);
                }
              },
            ),
            const SizedBox(width: 8),
            ChoiceChip(
              label: const Text('Delivered'),
              selected: _statusFilter == 'delivered',
              onSelected: (selected) {
                if (selected) {
                  setState(() => _statusFilter = 'delivered');
                  _loadPickups(refresh: true);
                }
              },
            ),
            const SizedBox(width: 8),
            ChoiceChip(
              label: const Text('Completed'),
              selected: _statusFilter == 'completed',
              onSelected: (selected) {
                if (selected) {
                  setState(() => _statusFilter = 'completed');
                  _loadPickups(refresh: true);
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPickupCard(NGOPickup pickup) {
    final theme = Theme.of(context);
    
    DateTime? parsedDate;
    try {
      parsedDate = DateTime.parse(pickup.scheduledAt);
    } catch (_) {}
    
    final dateStr = parsedDate != null ? '${parsedDate.month.toString().padLeft(2, '0')}/${parsedDate.day.toString().padLeft(2, '0')}/${parsedDate.year} ${parsedDate.hour.toString().padLeft(2, '0')}:${parsedDate.minute.toString().padLeft(2, '0')}' : pickup.scheduledAt;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: ExpansionTile(
        title: Text('Date: $dateStr', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
        subtitle: Text('City: ${pickup.pickupCity}', style: theme.textTheme.bodyMedium),
        leading: const CircleAvatar(
          backgroundColor: AppColors.primary,
          child: Icon(Icons.local_shipping, color: Colors.white, size: 20),
        ),
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Address:', style: theme.textTheme.titleSmall),
                const SizedBox(height: 4),
                Text(pickup.pickupAddress, style: theme.textTheme.bodyMedium),
                const SizedBox(height: 12),
                if (pickup.contactPhone != null && pickup.contactPhone!.isNotEmpty) ...[
                  Text('Contact:', style: theme.textTheme.titleSmall),
                  const SizedBox(height: 4),
                  Text(pickup.contactPhone!, style: theme.textTheme.bodyMedium),
                  const SizedBox(height: 12),
                ],
                if (pickup.notes != null && pickup.notes!.isNotEmpty) ...[
                  Text('Notes:', style: theme.textTheme.titleSmall),
                  const SizedBox(height: 4),
                  Text(pickup.notes!, style: theme.textTheme.bodyMedium?.copyWith(fontStyle: FontStyle.italic)),
                  const SizedBox(height: 12),
                ],
                const SizedBox(height: 8),
                if (_actionPickupId == pickup.id)
                   const Center(child: CircularProgressIndicator())
                else if (pickup.status == 'scheduled')
                  Align(
                    alignment: Alignment.centerRight,
                    child: FilledButton.icon(
                      style: FilledButton.styleFrom(backgroundColor: AppColors.primaryDark),
                      onPressed: () => _updateStatus(pickup.id, 'confirmed', 'Logistics confirmed for pickup.'),
                      icon: const Icon(Icons.check_circle_outline),
                      label: const Text('Confirm Logistics'),
                    ),
                  )
                else if (pickup.status == 'collected')
                  Align(
                    alignment: Alignment.centerRight,
                    child: FilledButton.icon(
                      style: FilledButton.styleFrom(backgroundColor: AppColors.success),
                      onPressed: () => _updateStatus(pickup.id, 'delivered', 'Marked as received by NGO.'),
                      icon: const Icon(Icons.inventory_2),
                      label: const Text('Mark Received'),
                    ),
                  )
                else
                   Center(
                     child: Chip(
                       label: Text(pickup.status.toUpperCase()),
                       backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                     ),
                   )
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.all(20).copyWith(bottom: 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Pickups Management',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 6),
              Text(
                'Monitor logistics and confirm receipt of incoming donations.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkMutedText : AppColors.lightMutedText,
                ),
              ),
            ],
          ),
        ),
        _buildFilterChips(),
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: () => _loadPickups(refresh: true),
                  child: _pickups.isEmpty
                      ? ListView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          children: [
                            SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                            const Center(child: Text('No pickups found for this status.')),
                          ],
                        )
                      : ListView.builder(
                          physics: const AlwaysScrollableScrollPhysics(),
                          itemCount: _pickups.length + (_page < _totalPages ? 1 : 0),
                          itemBuilder: (context, index) {
                            if (index == _pickups.length) {
                              _loadMore();
                              return const Padding(
                                padding: EdgeInsets.all(20),
                                child: Center(child: CircularProgressIndicator()),
                              );
                            }
                            return _buildPickupCard(_pickups[index]);
                          },
                        ),
                ),
        ),
      ],
    );
  }
}

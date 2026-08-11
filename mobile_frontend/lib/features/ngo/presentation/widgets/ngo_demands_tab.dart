import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/network/api_exception.dart';
import '../../data/models/ngo_models.dart';
import '../../data/models/ngo_demand_model.dart';
import '../../data/services/ngo_service.dart';
import '../../data/services/ngo_demand_service.dart';

class NGODemandsTab extends StatefulWidget {
  final NGOService ngoService;
  final NGODemandService demandService;

  const NGODemandsTab({
    super.key,
    required this.ngoService,
    required this.demandService,
  });

  @override
  State<NGODemandsTab> createState() => _NGODemandsTabState();
}

class _NGODemandsTabState extends State<NGODemandsTab> {
  bool _isLoading = true;
  NGOProfile? _ngoProfile;
  List<NGODemand> _demands = [];
  int _page = 1;
  int _total = 0;
  String? _deletingId;

  // Form controllers
  final _formKey = GlobalKey<FormState>();
  final _itemNameController = TextEditingController();
  final _quantityController = TextEditingController(text: '1');
  final _descriptionController = TextEditingController();
  String _selectedCategory = 'other';
  String _selectedUrgency = 'medium';
  bool _isSubmitting = false;

  final _categories = const [
    {'value': 'clothing', 'label': 'Clothing'},
    {'value': 'food', 'label': 'Food'},
    {'value': 'electronics', 'label': 'Electronics'},
    {'value': 'furniture', 'label': 'Furniture'},
    {'value': 'books', 'label': 'Books'},
    {'value': 'medical', 'label': 'Medical'},
    {'value': 'toys', 'label': 'Toys'},
    {'value': 'other', 'label': 'Other'},
  ];

  final _urgencies = const [
    {'value': 'low', 'label': 'Low'},
    {'value': 'medium', 'label': 'Medium'},
    {'value': 'high', 'label': 'High'},
    {'value': 'critical', 'label': 'Critical'},
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _itemNameController.dispose();
    _quantityController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final profile = await widget.ngoService.getProfile();
      final paginated = await widget.demandService.getDemands(page: _page, size: 20);
      
      if (mounted) {
        setState(() {
          _ngoProfile = profile;
          _demands = paginated.data;
          _total = paginated.total;
        });
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to load demands')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _deleteDemand(String id) async {
    setState(() => _deletingId = id);
    try {
      await widget.demandService.deleteDemand(id);
      if (mounted) {
        setState(() {
          _demands.removeWhere((d) => d.id == id);
          _total = _total > 0 ? _total - 1 : 0;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Demand deactivated'), backgroundColor: AppColors.success),
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message), backgroundColor: AppColors.error),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to delete demand'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _deletingId = null);
    }
  }

  void _showAddDemandModal() {
    if (_ngoProfile != null && !_ngoProfile!.isVerified) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Your NGO profile is pending verification. Please upload verification documents to unlock demand creation.'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    _itemNameController.clear();
    _quantityController.text = '1';
    _descriptionController.clear();
    setState(() {
      _selectedCategory = 'other';
      _selectedUrgency = 'medium';
    });

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          final theme = Theme.of(context);
          return Container(
            decoration: BoxDecoration(
              color: theme.scaffoldBackgroundColor,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            ),
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom,
              left: 20,
              right: 20,
              top: 20,
            ),
            child: Form(
              key: _formKey,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Add Demand', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _itemNameController,
                      decoration: const InputDecoration(labelText: 'Item name', border: OutlineInputBorder()),
                      validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      value: _selectedCategory,
                      decoration: const InputDecoration(labelText: 'Category', border: OutlineInputBorder()),
                      items: _categories.map((c) => DropdownMenuItem(value: c['value'], child: Text(c['label']!))).toList(),
                      onChanged: (v) => setModalState(() => _selectedCategory = v!),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _quantityController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Quantity needed', border: OutlineInputBorder()),
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'Required';
                        final num = int.tryParse(v);
                        if (num == null || num < 1) return 'At least 1';
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      value: _selectedUrgency,
                      decoration: const InputDecoration(labelText: 'Urgency', border: OutlineInputBorder()),
                      items: _urgencies.map((u) => DropdownMenuItem(value: u['value'], child: Text(u['label']!))).toList(),
                      onChanged: (v) => setModalState(() => _selectedUrgency = v!),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _descriptionController,
                      maxLines: 3,
                      decoration: const InputDecoration(labelText: 'Description (optional)', border: OutlineInputBorder()),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                        ),
                        onPressed: _isSubmitting ? null : () async {
                          if (!_formKey.currentState!.validate()) return;
                          
                          setModalState(() => _isSubmitting = true);
                          try {
                            final newDemand = await widget.demandService.createDemand(
                              itemCategory: _selectedCategory,
                              itemName: _itemNameController.text.trim(),
                              quantityNeeded: int.parse(_quantityController.text),
                              urgencyLevel: _selectedUrgency,
                              description: _descriptionController.text.trim(),
                            );
                            
                            if (mounted) {
                              setState(() {
                                _demands.insert(0, newDemand);
                                _total++;
                              });
                              Navigator.pop(context);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Demand created successfully'), backgroundColor: AppColors.success),
                              );
                            }
                          } on ApiException catch (e) {
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text(e.message), backgroundColor: AppColors.error),
                              );
                            }
                          } catch (_) {
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Failed to create demand'), backgroundColor: AppColors.error),
                              );
                            }
                          } finally {
                            setModalState(() => _isSubmitting = false);
                          }
                        },
                        child: _isSubmitting 
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Text('Create Demand'),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Demand Management',
                      style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$_total active demand${_total != 1 ? 's' : ''}',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: isDark ? AppColors.darkMutedText : AppColors.lightMutedText,
                      ),
                    ),
                  ],
                ),
              ),
              ElevatedButton.icon(
                onPressed: _showAddDemandModal,
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Add'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Demands List or Empty State
          if (_demands.isEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 20),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('📋', style: TextStyle(fontSize: 48)),
                    const SizedBox(height: 16),
                    Text('No active demands', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text(
                      'Add a demand to start receiving matched donations',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: isDark ? AppColors.darkMutedText : AppColors.lightMutedText,
                      ),
                    ),
                    const SizedBox(height: 24),
                    OutlinedButton(
                      onPressed: _showAddDemandModal,
                      child: const Text('Add Demand'),
                    ),
                  ],
                ),
              ),
            )
          else
            Card(
              clipBehavior: Clip.antiAlias,
              child: ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _demands.length,
                separatorBuilder: (context, index) => const Divider(height: 1),
                itemBuilder: (context, index) {
                  final demand = _demands[index];
                  return Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                demand.itemName ?? 'Unknown Item',
                                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                              ),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  _buildBadge(demand.itemCategory, Colors.blue),
                                  _buildBadge(demand.urgencyLevel, _getUrgencyColor(demand.urgencyLevel)),
                                  _buildBadge('Qty ${demand.quantityNeeded}', Colors.grey),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Added ${_formatDate(demand.createdAt)}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? AppColors.darkMutedText : AppColors.lightMutedText,
                                ),
                              ),
                            ],
                          ),
                        ),
                        TextButton(
                          onPressed: _deletingId == demand.id ? null : () => _deleteDemand(demand.id),
                          style: TextButton.styleFrom(foregroundColor: AppColors.error),
                          child: _deletingId == demand.id
                            ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.error))
                            : const Text('Delete'),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildBadge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        border: Border.all(color: color.withValues(alpha: 0.2)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text[0].toUpperCase() + text.substring(1),
        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: color),
      ),
    );
  }

  Color _getUrgencyColor(String urgency) {
    switch (urgency.toLowerCase()) {
      case 'low': return Colors.grey;
      case 'medium': return Colors.blue;
      case 'high': return Colors.orange;
      case 'critical': return AppColors.error;
      default: return Colors.grey;
    }
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
}

class NGODemand {
  final String id;
  final String ngoId;
  final String itemCategory;
  final String? itemName;
  final int quantityNeeded;
  final int quantityFulfilled;
  final String urgencyLevel;
  final String? description;
  final bool isActive;
  final DateTime? expiresAt;
  final DateTime createdAt;

  const NGODemand({
    required this.id,
    required this.ngoId,
    required this.itemCategory,
    this.itemName,
    required this.quantityNeeded,
    required this.quantityFulfilled,
    required this.urgencyLevel,
    this.description,
    required this.isActive,
    this.expiresAt,
    required this.createdAt,
  });

  factory NGODemand.fromJson(Map<String, dynamic> json) {
    return NGODemand(
      id: json['id']?.toString() ?? '',
      ngoId: json['ngo_id']?.toString() ?? '',
      itemCategory: json['item_category'] as String? ?? 'other',
      itemName: json['item_name'] as String?,
      quantityNeeded: json['quantity_needed'] as int? ?? 1,
      quantityFulfilled: json['quantity_fulfilled'] as int? ?? 0,
      urgencyLevel: json['urgency_level'] as String? ?? 'medium',
      description: json['description'] as String?,
      isActive: json['is_active'] as bool? ?? true,
      expiresAt: json['expires_at'] != null ? DateTime.parse(json['expires_at'] as String) : null,
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at'] as String) : DateTime.now(),
    );
  }
}

class PaginatedDemands {
  final List<NGODemand> data;
  final int total;
  final int page;
  final int pages;

  const PaginatedDemands({
    required this.data,
    required this.total,
    required this.page,
    required this.pages,
  });

  factory PaginatedDemands.fromJson(Map<String, dynamic> json) {
    final itemsRaw = json['data'] as List?;
    final items = itemsRaw?.map((i) => NGODemand.fromJson(i as Map<String, dynamic>)).toList() ?? [];
    
    final meta = json['pagination'] as Map<String, dynamic>? ?? {};
    
    return PaginatedDemands(
      data: items,
      total: meta['total'] as int? ?? items.length,
      page: meta['page'] as int? ?? 1,
      pages: meta['pages'] as int? ?? 1,
    );
  }
}

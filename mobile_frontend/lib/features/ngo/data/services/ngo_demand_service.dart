import 'package:mobile_frontend/core/network/api_client.dart';
import 'package:mobile_frontend/core/network/api_exception.dart';
import 'package:mobile_frontend/features/ngo/data/models/ngo_demand_model.dart';

class NGODemandService {
  final ApiClient _client;

  NGODemandService({ApiClient? client}) : _client = client ?? ApiClient();

  Future<PaginatedDemands> getDemands({int page = 1, int size = 20}) async {
    final response = await _client.get<List<dynamic>>(
      '/api/v1/ngos/demands?page=$page&size=$size',
      fromJson: (json) => List<dynamic>.from(json as List),
    );
    
    final items = response.data?.map((i) => NGODemand.fromJson(i as Map<String, dynamic>)).toList() ?? [];
    final meta = response.pagination ?? {};

    return PaginatedDemands(
      data: items,
      total: meta['total'] as int? ?? items.length,
      page: meta['page'] as int? ?? 1,
      pages: meta['pages'] as int? ?? 1,
    );
  }

  Future<NGODemand> createDemand({
    required String itemCategory,
    required String itemName,
    required int quantityNeeded,
    required String urgencyLevel,
    String? description,
    String? expiresAt,
  }) async {
    final payload = {
      'item_category': itemCategory,
      'item_name': itemName,
      'quantity_needed': quantityNeeded,
      'urgency_level': urgencyLevel,
      if (description != null && description.isNotEmpty) 'description': description,
      if (expiresAt != null && expiresAt.isNotEmpty) 'expires_at': expiresAt,
    };

    final response = await _client.post<Map<String, dynamic>>(
      '/api/v1/ngos/demands',
      body: payload,
      fromJson: (json) => Map<String, dynamic>.from(json as Map),
    );
    
    final data = response.data;
    if (data == null) {
      throw ApiException('Failed to parse demand from response');
    }
    return NGODemand.fromJson(data);
  }

  Future<void> deleteDemand(String id) async {
    await _client.delete<Map<String, dynamic>>(
      '/api/v1/ngos/demands/$id',
      fromJson: (json) => Map<String, dynamic>.from(json as Map),
    );
  }
}

import 'package:mobile_frontend/core/network/api_client.dart';
import 'package:mobile_frontend/core/network/api_response.dart';
import 'package:mobile_frontend/features/ngo/data/models/ngo_pickup_model.dart';

class NGOPickupService {
  final ApiClient _client;

  NGOPickupService({ApiClient? client}) : _client = client ?? ApiClient();

  Future<ApiEnvelope<List<NGOPickup>>> getPickups({
    int page = 1,
    int size = 10,
    String? statusFilter,
  }) async {
    String url = '/api/v1/pickups/ngo?page=$page&size=$size';
    if (statusFilter != null && statusFilter.isNotEmpty) {
      url += '&status_filter=$statusFilter';
    }

    final response = await _client.get<List<dynamic>>(
      url,
      fromJson: (json) => List<dynamic>.from(json as List),
    );
    
    final dataList = response.data ?? [];
    final pickups = dataList.map((j) => NGOPickup.fromJson(j as Map<String, dynamic>)).toList();
    
    return ApiEnvelope<List<NGOPickup>>(
      success: response.success,
      message: response.message,
      data: pickups,
      pagination: response.pagination,
    );
  }

  Future<NGOPickup> updatePickupStatus(String pickupId, String status) async {
    final response = await _client.put<Map<String, dynamic>>(
      '/api/v1/pickups/$pickupId/status',
      body: {'status': status},
      fromJson: (json) => Map<String, dynamic>.from(json as Map),
    );
    
    final data = response.data;
    if (data == null) {
      throw Exception('Failed to update pickup status: No data returned');
    }
    return NGOPickup.fromJson(data);
  }
}

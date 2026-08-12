import 'package:mobile_frontend/core/network/api_client.dart';
import 'package:mobile_frontend/core/network/api_response.dart';
import 'package:mobile_frontend/features/ngo/data/models/ngo_match_model.dart';

class NGOMatchService {
  final ApiClient _client;

  NGOMatchService({ApiClient? client}) : _client = client ?? ApiClient();

  Future<ApiEnvelope<List<NGOMatch>>> getMatches({
    int page = 1,
    int size = 10,
    String? statusFilter,
  }) async {
    String url = '/api/v1/matching/results?page=$page&size=$size';
    if (statusFilter != null && statusFilter.isNotEmpty) {
      url += '&status_filter=$statusFilter';
    }

    final response = await _client.get<List<dynamic>>(
      url,
      fromJson: (json) => List<dynamic>.from(json as List),
    );
    
    final dataList = response.data ?? [];
    final matches = dataList.map((j) => NGOMatch.fromJson(j as Map<String, dynamic>)).toList();
    
    return ApiEnvelope<List<NGOMatch>>(
      success: response.success,
      message: response.message,
      data: matches,
      pagination: response.pagination,
    );
  }

  Future<NGOMatch> acceptMatch(String matchId) async {
    final response = await _client.put<Map<String, dynamic>>(
      '/api/v1/ngos/matches/$matchId/accept',
      body: {}, // Empty body required by backend if no data expected, though backend doesn't explicitly require a body, it's a PUT request.
      fromJson: (json) => Map<String, dynamic>.from(json as Map),
    );
    final data = response.data?['data'];
    if (data == null) {
      throw Exception('Failed to accept match: No data returned');
    }
    return NGOMatch.fromJson(data as Map<String, dynamic>);
  }

  Future<NGOMatch> rejectMatch(String matchId, String reason) async {
    final response = await _client.put<Map<String, dynamic>>(
      '/api/v1/ngos/matches/$matchId/reject',
      body: {'rejection_reason': reason},
      fromJson: (json) => Map<String, dynamic>.from(json as Map),
    );
    final data = response.data?['data'];
    if (data == null) {
      throw Exception('Failed to reject match: No data returned');
    }
    return NGOMatch.fromJson(data as Map<String, dynamic>);
  }
}

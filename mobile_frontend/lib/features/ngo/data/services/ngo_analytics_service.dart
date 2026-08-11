import 'package:mobile_frontend/core/network/api_client.dart';
import 'package:mobile_frontend/features/ngo/data/models/ngo_analytics_models.dart';

class NGOAnalyticsService {
  final ApiClient _client;

  NGOAnalyticsService({ApiClient? client}) : _client = client ?? ApiClient();

  Future<NGOSummaryStats?> getSummary() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/api/v1/analytics/summary',
        fromJson: (json) => Map<String, dynamic>.from(json as Map),
      );
      final data = response.data;
      if (data != null) {
        return NGOSummaryStats.fromJson(data);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<List<CategoryBreakdown>> getCategoryBreakdown() async {
    try {
      final response = await _client.get<List<dynamic>>(
        '/api/v1/analytics/categories',
        fromJson: (json) => List<dynamic>.from(json as List),
      );
      final data = response.data;
      if (data != null) {
        return data.map((json) => CategoryBreakdown.fromJson(json as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  Future<PickupStats?> getPickupStats() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/api/v1/analytics/pickups',
        fromJson: (json) => Map<String, dynamic>.from(json as Map),
      );
      final data = response.data;
      if (data != null) {
        return PickupStats.fromJson(data);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<List<MatchingRatePoint>> getMatchingRate({int days = 30}) async {
    try {
      final response = await _client.get<List<dynamic>>(
        '/api/v1/analytics/matching-rate?days=$days',
        fromJson: (json) => List<dynamic>.from(json as List),
      );
      final data = response.data;
      if (data != null) {
        return data.map((json) => MatchingRatePoint.fromJson(json as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }
}

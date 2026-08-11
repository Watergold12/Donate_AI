import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:mobile_frontend/core/config/api_config.dart';
import 'package:mobile_frontend/core/network/api_client.dart';
import 'package:mobile_frontend/core/network/token_store.dart';
import '../models/donor_models.dart';

class DonorService {
  final ApiClient _client;

  DonorService({ApiClient? client}) : _client = client ?? ApiClient();

  Future<SummaryStats> getSummaryStats() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/api/v1/analytics/summary',
        fromJson: (json) => Map<String, dynamic>.from(json as Map),
      );
      final data = response.data ?? {};
      return SummaryStats.fromJson(data);
    } catch (_) {
      return const SummaryStats(
        totalDonations: 0,
        completedDonations: 0,
        pendingDonations: 0,
        totalItemsDonated: 0,
      );
    }
  }

  Future<List<DonationRecord>> getRecentDonations({int page = 1, int size = 10, String? statusFilter}) async {
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'size': size.toString(),
      };
      if (statusFilter != null && statusFilter.isNotEmpty) {
        queryParams['status_filter'] = statusFilter;
      }

      final response = await _client.get<Map<String, dynamic>>(
        '/api/v1/donors/donations',
        queryParameters: queryParams,
        fromJson: (json) => Map<String, dynamic>.from(json as Map),
      );

      final dataList = response.data?['data'] as List? ?? [];
      return dataList.map((d) => DonationRecord.fromJson(d as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<List<DetectedItem>> runAiScan() async {
    await Future.delayed(const Duration(milliseconds: 1000));
    return [
      DetectedItem(
        name: 'Winter Jacket',
        category: 'clothing',
        confidence: 0.96,
        condition: 'good',
        description: 'Warm insulated jacket',
        count: 2,
      ),
      DetectedItem(
        name: 'Textbook Pack',
        category: 'books',
        confidence: 0.92,
        condition: 'like_new',
        description: 'Grade 10 Science & Math',
        count: 5,
      ),
      DetectedItem(
        name: 'First Aid Medical Kit',
        category: 'medical',
        confidence: 0.89,
        condition: 'new',
        description: 'Complete emergency kit',
        count: 1,
      ),
    ];
  }

  Future<List<DetectedItem>> scanImage(String imagePath) async {
    try {
      final uri = ApiConfig.uri('/api/v1/detection/analyze');
      final request = http.MultipartRequest('POST', uri);

      final token = await TokenStore().read();
      if (token != null) {
        request.headers['Authorization'] = 'Bearer $token';
      }
      
      final ext = imagePath.split('.').last.toLowerCase();
      final mimeType = ext == 'png' ? 'png' : 'jpeg';

      final file = await http.MultipartFile.fromPath(
        'image', 
        imagePath,
        contentType: MediaType('image', mimeType),
      );
      request.files.add(file);

      final streamedResponse = await request.send().timeout(const Duration(seconds: 30));
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        if (decoded['success'] == true) {
           final items = decoded['data']?['items'] as List? ?? [];
           return items.map((i) => DetectedItem.fromJson(i as Map<String, dynamic>)).toList();
        }
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  Future<bool> submitDonation(List<DetectedItem> items, String notes) async {
    try {
      // Step 1: Create donation shell
      final createRes = await _client.post<Map<String, dynamic>>(
        '/api/v1/donations',
        body: {'notes': notes},
        fromJson: (json) => Map<String, dynamic>.from(json as Map),
      );

      final donationId = createRes.data?['data']?['id']?.toString() ?? createRes.data?['id']?.toString();
      if (donationId == null || donationId.isEmpty) {
        return false;
      }

      // Step 2: Add each item to the donation
      for (final item in items) {
        await _client.post<Map<String, dynamic>>(
          '/api/v1/donations/$donationId/items',
          body: item.toJson(),
          fromJson: (json) => Map<String, dynamic>.from(json as Map),
        );
      }

      // Step 3: Submit donation for AI matching
      final submitRes = await _client.post<Map<String, dynamic>>(
        '/api/v1/donations/$donationId/submit',
        fromJson: (json) => Map<String, dynamic>.from(json as Map),
      );

      return submitRes.success;
    } catch (_) {
      return false;
    }
  }

  Future<List<DonorMatchItem>> getMatches() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/api/v1/donors/donations',
        fromJson: (json) => Map<String, dynamic>.from(json as Map),
      );

      final donationsList = response.data?['data'] as List? ?? [];
      final matchesList = <DonorMatchItem>[];

      for (final donation in donationsList) {
        final status = donation['status']?.toString() ?? '';
        final dId = donation['id']?.toString() ?? '';
        if (status == 'pending_match' || status == 'matched' || status == 'acknowledged') {
          try {
            final matchRes = await _client.get<Map<String, dynamic>>(
              '/api/v1/donations/$dId/match',
              fromJson: (json) => Map<String, dynamic>.from(json as Map),
            );
            if (matchRes.data?['data'] != null) {
              matchesList.add(DonorMatchItem.fromJson(matchRes.data!['data'] as Map<String, dynamic>));
            }
          } catch (_) {}
        }
      }

      return matchesList;
    } catch (_) {
      return [];
    }
  }

  Future<List<PickupRecord>> getPickups() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/api/v1/pickups/donor',
        fromJson: (json) => Map<String, dynamic>.from(json as Map),
      );
      final rawList = response.data?['data'] as List? ?? [];
      return rawList.map((p) => PickupRecord.fromJson(p as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<bool> schedulePickup({
    required String donationId,
    required String scheduledDate,
    required String timeSlot,
    required String address,
    String? notes,
  }) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/api/v1/pickups',
        body: {
          'donation_id': donationId,
          'scheduled_date': scheduledDate,
          'time_slot': timeSlot,
          'address': address,
          'notes': notes,
        },
        fromJson: (json) => Map<String, dynamic>.from(json as Map),
      );
      return response.success;
    } catch (_) {
      return false;
    }
  }

  Future<DonorProfile> getProfile() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/api/v1/donors/profile',
        fromJson: (json) => Map<String, dynamic>.from(json as Map),
      );
      final data = response.data?['data'] ?? response.data ?? {};
      return DonorProfile.fromJson(Map<String, dynamic>.from(data as Map));
    } catch (_) {
      return const DonorProfile(
        name: 'Donor User',
        email: 'donor@donate.ai',
        phone: '',
        city: '',
        address: '',
      );
    }
  }

  Future<bool> updateProfile(DonorProfile profile) async {
    try {
      final response = await _client.put<Map<String, dynamic>>(
        '/api/v1/donors/profile',
        body: profile.toJson(),
        fromJson: (json) => Map<String, dynamic>.from(json as Map),
      );
      return response.success;
    } catch (_) {
      return false;
    }
  }

  void close() {
    _client.close();
  }
}

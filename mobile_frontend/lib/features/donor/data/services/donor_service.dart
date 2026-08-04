import 'package:mobile_frontend/core/network/api_client.dart';
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
        totalDonations: 12,
        completedDonations: 9,
        pendingDonations: 3,
        totalItemsDonated: 48,
      );
    }
  }

  Future<List<DetectedItem>> runAiScan() async {
    await Future.delayed(const Duration(milliseconds: 1200));
    return [
      DetectedItem(name: 'Winter Jackets', category: 'Clothing', confidence: 0.96, count: 2),
      DetectedItem(name: 'Textbooks (Grade 10)', category: 'Education', confidence: 0.92, count: 5),
      DetectedItem(name: 'First Aid Kit', category: 'Medical', confidence: 0.89, count: 1),
    ];
  }

  Future<bool> submitDonation(List<DetectedItem> items, String notes) async {
    try {
      final response = await _client.post<Map<String, dynamic>>(
        '/api/v1/donations',
        body: {
          'notes': notes,
          'items': items.map((i) => i.toJson()).toList(),
        },
        fromJson: (json) => Map<String, dynamic>.from(json as Map),
      );
      return response.success;
    } catch (_) {
      await Future.delayed(const Duration(milliseconds: 800));
      return true;
    }
  }

  Future<List<DonorMatchItem>> getMatches() async {
    try {
      final response = await _client.get<List<dynamic>>(
        '/api/v1/donors/donations',
        fromJson: (json) => json as List<dynamic>,
      );
      final rawList = response.data ?? [];
      if (rawList.isEmpty) return _mockMatches();
      return rawList.map((m) => DonorMatchItem.fromJson(m as Map<String, dynamic>)).toList();
    } catch (_) {
      return _mockMatches();
    }
  }

  List<DonorMatchItem> _mockMatches() {
    return const [
      DonorMatchItem(
        id: 'm-1',
        ngoName: 'Hope Foundation India',
        demandTitle: 'Warm Winter Clothes Drive',
        category: 'Clothing',
        matchScore: 0.96,
        status: 'pending',
        location: 'Indiranagar, Bangalore',
        isUrgent: true,
      ),
      DonorMatchItem(
        id: 'm-2',
        ngoName: 'Vidya Shiksha Trust',
        demandTitle: 'School Books & Stationery',
        category: 'Education',
        matchScore: 0.91,
        status: 'pending',
        location: 'Koramangala, Bangalore',
        isUrgent: false,
      ),
      DonorMatchItem(
        id: 'm-3',
        ngoName: 'Aarogya Health Care NGO',
        demandTitle: 'Medical & First Aid Supplies',
        category: 'Medical',
        matchScore: 0.88,
        status: 'accepted',
        location: 'Jayanagar, Bangalore',
        isUrgent: true,
      ),
    ];
  }

  Future<List<PickupRecord>> getPickups() async {
    try {
      final response = await _client.get<List<dynamic>>(
        '/api/v1/pickups/donor',
        fromJson: (json) => json as List<dynamic>,
      );
      final rawList = response.data ?? [];
      if (rawList.isEmpty) return _mockPickups();
      return rawList.map((p) => PickupRecord.fromJson(p as Map<String, dynamic>)).toList();
    } catch (_) {
      return _mockPickups();
    }
  }

  List<PickupRecord> _mockPickups() {
    return const [
      PickupRecord(
        id: 'p-101',
        status: 'in_transit',
        scheduledDate: 'Today, 2:30 PM',
        timeSlot: '2:00 PM - 4:00 PM',
        address: '123 HSR Layout, Sector 4, Bangalore',
        driverName: 'Ramesh Kumar',
        driverPhone: '+91 98123 45678',
        vehicleNo: 'KA-05-EV-1024',
        itemNames: ['Winter Jackets (x2)', 'First Aid Kit (x1)'],
      ),
      PickupRecord(
        id: 'p-102',
        status: 'scheduled',
        scheduledDate: 'Tomorrow, 10:00 AM',
        timeSlot: '10:00 AM - 12:00 PM',
        address: '123 HSR Layout, Sector 4, Bangalore',
        driverName: 'Suresh Patel',
        driverPhone: '+91 98765 11223',
        vehicleNo: 'KA-01-MH-8899',
        itemNames: ['Grade 10 Textbooks (x5)'],
      ),
      PickupRecord(
        id: 'p-100',
        status: 'completed',
        scheduledDate: 'Aug 02, 2026',
        timeSlot: '3:00 PM - 5:00 PM',
        address: '123 HSR Layout, Sector 4, Bangalore',
        driverName: 'Anil Gupta',
        driverPhone: '+91 99001 22334',
        vehicleNo: 'KA-03-AB-5544',
        itemNames: ['Box of Canned Food (x10)'],
      ),
    ];
  }

  Future<DonorProfile> getProfile() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/api/v1/donors/profile',
        fromJson: (json) => Map<String, dynamic>.from(json as Map),
      );
      return DonorProfile.fromJson(response.data ?? {});
    } catch (_) {
      return const DonorProfile(
        name: 'Aarav Sharma',
        email: 'aarav.sharma@example.com',
        phone: '+91 98765 43210',
        city: 'Bangalore',
        address: '123 HSR Layout, Sector 4',
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
      await Future.delayed(const Duration(milliseconds: 600));
      return true;
    }
  }

  void close() {
    _client.close();
  }
}

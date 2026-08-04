class SummaryStats {
  final int totalDonations;
  final int completedDonations;
  final int pendingDonations;
  final int totalItemsDonated;

  const SummaryStats({
    required this.totalDonations,
    required this.completedDonations,
    required this.pendingDonations,
    required this.totalItemsDonated,
  });

  factory SummaryStats.fromJson(Map<String, dynamic> json) {
    return SummaryStats(
      totalDonations: json['total_donations'] as int? ?? 0,
      completedDonations: json['completed_donations'] as int? ?? 0,
      pendingDonations: json['pending_donations'] as int? ?? 0,
      totalItemsDonated: json['total_items_donated'] as int? ?? 0,
    );
  }
}

class DetectedItem {
  final String name;
  final String category;
  final double confidence;
  int count;

  DetectedItem({
    required this.name,
    required this.category,
    required this.confidence,
    this.count = 1,
  });

  factory DetectedItem.fromJson(Map<String, dynamic> json) {
    return DetectedItem(
      name: json['name']?.toString() ?? 'Donation Item',
      category: json['category']?.toString() ?? 'General',
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.95,
      count: json['count'] as int? ?? 1,
    );
  }

  Map<String, dynamic> toJson() => {
        'title': name,
        'category': category,
        'quantity': count,
        'condition': 'good',
      };
}

class DonorMatchItem {
  final String id;
  final String ngoName;
  final String demandTitle;
  final String category;
  final double matchScore;
  final String status;
  final String location;
  final bool isUrgent;

  const DonorMatchItem({
    required this.id,
    required this.ngoName,
    required this.demandTitle,
    required this.category,
    required this.matchScore,
    required this.status,
    required this.location,
    this.isUrgent = false,
  });

  factory DonorMatchItem.fromJson(Map<String, dynamic> json) {
    final score = (json['score'] as num?)?.toDouble() ?? 0.88;
    return DonorMatchItem(
      id: json['id']?.toString() ?? '',
      ngoName: json['ngo_name']?.toString() ?? json['ngo']?['name']?.toString() ?? 'Community Hope NGO',
      demandTitle: json['demand_title']?.toString() ?? 'Warm Clothes & Essentials',
      category: json['category']?.toString() ?? 'Clothing',
      matchScore: score,
      status: json['status']?.toString() ?? 'pending',
      location: json['location']?.toString() ?? 'Downtown Community Center',
      isUrgent: json['is_urgent'] as bool? ?? false,
    );
  }
}

class PickupRecord {
  final String id;
  final String status;
  final String scheduledDate;
  final String timeSlot;
  final String address;
  final String driverName;
  final String driverPhone;
  final String vehicleNo;
  final List<String> itemNames;

  const PickupRecord({
    required this.id,
    required this.status,
    required this.scheduledDate,
    required this.timeSlot,
    required this.address,
    required this.driverName,
    required this.driverPhone,
    required this.vehicleNo,
    required this.itemNames,
  });

  factory PickupRecord.fromJson(Map<String, dynamic> json) {
    final itemsRaw = json['items'] as List?;
    final itemsList = itemsRaw?.map((i) => i.toString()).toList() ?? ['Donation Package'];
    return PickupRecord(
      id: json['id']?.toString() ?? '',
      status: json['status']?.toString() ?? 'scheduled',
      scheduledDate: json['scheduled_date']?.toString() ?? 'Today, 2:30 PM',
      timeSlot: json['time_slot']?.toString() ?? '2:00 PM - 4:00 PM',
      address: json['address']?.toString() ?? '123 Main Street, Apt 4B',
      driverName: json['driver_name']?.toString() ?? 'Rahul Sharma',
      driverPhone: json['driver_phone']?.toString() ?? '+91 98765 43210',
      vehicleNo: json['vehicle_no']?.toString() ?? 'KA-01-EA-4921',
      itemNames: itemsList,
    );
  }
}

class DonorProfile {
  final String name;
  final String email;
  final String phone;
  final String city;
  final String address;
  final bool emailNotifications;
  final bool pushNotifications;

  const DonorProfile({
    required this.name,
    required this.email,
    required this.phone,
    required this.city,
    required this.address,
    this.emailNotifications = true,
    this.pushNotifications = true,
  });

  factory DonorProfile.fromJson(Map<String, dynamic> json) {
    return DonorProfile(
      name: json['full_name']?.toString() ?? json['name']?.toString() ?? 'Donor User',
      email: json['email']?.toString() ?? 'donor@donate.ai',
      phone: json['phone']?.toString() ?? '+91 98765 12345',
      city: json['city']?.toString() ?? 'Bangalore',
      address: json['address']?.toString() ?? 'Sector 4, HSR Layout',
      emailNotifications: json['email_notifications'] as bool? ?? true,
      pushNotifications: json['push_notifications'] as bool? ?? true,
    );
  }

  DonorProfile copyWith({
    String? name,
    String? email,
    String? phone,
    String? city,
    String? address,
    bool? emailNotifications,
    bool? pushNotifications,
  }) {
    return DonorProfile(
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      city: city ?? this.city,
      address: address ?? this.address,
      emailNotifications: emailNotifications ?? this.emailNotifications,
      pushNotifications: pushNotifications ?? this.pushNotifications,
    );
  }

  Map<String, dynamic> toJson() => {
        'full_name': name,
        'phone': phone,
        'city': city,
        'address': address,
        'email_notifications': emailNotifications,
        'push_notifications': pushNotifications,
      };
}

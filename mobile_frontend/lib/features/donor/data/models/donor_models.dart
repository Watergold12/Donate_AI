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
  String name;
  String category;
  final double confidence;
  String condition;
  String description;
  int count;

  DetectedItem({
    required this.name,
    required this.category,
    required this.confidence,
    this.condition = 'good',
    this.description = '',
    this.count = 1,
  });

  factory DetectedItem.fromJson(Map<String, dynamic> json) {
    return DetectedItem(
      name: json['name']?.toString() ?? json['item_name']?.toString() ?? 'Donation Item',
      category: json['category']?.toString() ?? 'other',
      confidence: (json['confidence'] as num?)?.toDouble() ?? (json['confidence_score'] as num?)?.toDouble() ?? 0.95,
      condition: json['condition']?.toString() ?? 'good',
      description: json['description']?.toString() ?? '',
      count: json['count'] as int? ?? json['quantity'] as int? ?? 1,
    );
  }

  Map<String, dynamic> toJson() => {
        'item_name': name,
        'category': category.toLowerCase(),
        'quantity': count,
        'condition': condition.toLowerCase(),
        'description': description,
        'ai_detected': true,
        'confidence_score': confidence,
      };
}

class DonationItemModel {
  final String id;
  final String itemName;
  final String category;
  final int quantity;
  final String condition;
  final String? description;

  const DonationItemModel({
    required this.id,
    required this.itemName,
    required this.category,
    required this.quantity,
    required this.condition,
    this.description,
  });

  factory DonationItemModel.fromJson(Map<String, dynamic> json) {
    return DonationItemModel(
      id: json['id']?.toString() ?? '',
      itemName: json['item_name']?.toString() ?? 'Item',
      category: json['category']?.toString() ?? 'other',
      quantity: json['quantity'] as int? ?? 1,
      condition: json['condition']?.toString() ?? 'good',
      description: json['description']?.toString(),
    );
  }
}

class DonationRecord {
  final String id;
  final String status;
  final String? notes;
  final int totalItems;
  final String createdAt;
  final List<DonationItemModel> items;

  const DonationRecord({
    required this.id,
    required this.status,
    this.notes,
    required this.totalItems,
    required this.createdAt,
    required this.items,
  });

  factory DonationRecord.fromJson(Map<String, dynamic> json) {
    final itemsRaw = json['items'] as List?;
    final itemsList = itemsRaw != null
        ? itemsRaw.map((i) => DonationItemModel.fromJson(i as Map<String, dynamic>)).toList()
        : <DonationItemModel>[];

    return DonationRecord(
      id: json['id']?.toString() ?? '',
      status: json['status']?.toString() ?? 'draft',
      notes: json['notes']?.toString(),
      totalItems: json['total_items'] as int? ?? itemsList.length,
      createdAt: json['created_at']?.toString() ?? '',
      items: itemsList,
    );
  }
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
    final score = (json['score'] as num?)?.toDouble() ?? (json['match_score'] as num?)?.toDouble() ?? 0.88;
    return DonorMatchItem(
      id: json['id']?.toString() ?? '',
      ngoName: json['ngo_name']?.toString() ?? json['ngo']?['name']?.toString() ?? 'Partner NGO',
      demandTitle: json['demand_title']?.toString() ?? json['title']?.toString() ?? 'Resource Demand',
      category: json['category']?.toString() ?? 'General',
      matchScore: score,
      status: json['status']?.toString() ?? 'pending',
      location: json['location']?.toString() ?? json['city']?.toString() ?? 'Location',
      isUrgent: json['is_urgent'] as bool? ?? false,
    );
  }
}

class PickupRecord {
  final String id;
  final String donationId;
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
    required this.donationId,
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
      donationId: json['donation_id']?.toString() ?? '',
      status: json['status']?.toString() ?? 'scheduled',
      scheduledDate: json['scheduled_date']?.toString() ?? 'Today',
      timeSlot: json['time_slot']?.toString() ?? '09:00 - 12:00',
      address: json['address']?.toString() ?? 'Registered Pickup Address',
      driverName: json['driver_name']?.toString() ?? 'Assigned Logistics Driver',
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
      phone: json['phone']?.toString() ?? '',
      city: json['city']?.toString() ?? '',
      address: json['address']?.toString() ?? '',
      emailNotifications: json['email_notifications'] as bool? ?? true,
      pushNotifications: json['push_notifications'] as bool? ?? true,
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

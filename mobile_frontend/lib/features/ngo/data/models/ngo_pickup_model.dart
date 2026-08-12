class NGOPickup {
  final String id;
  final String donationId;
  final String ngoId;
  final String? matchId;
  final String status;
  final String scheduledAt;
  final String pickupAddress;
  final String pickupCity;
  final String? contactPhone;
  final String? notes;
  final String createdAt;
  final String? completedAt;

  const NGOPickup({
    required this.id,
    required this.donationId,
    required this.ngoId,
    this.matchId,
    required this.status,
    required this.scheduledAt,
    required this.pickupAddress,
    required this.pickupCity,
    this.contactPhone,
    this.notes,
    required this.createdAt,
    this.completedAt,
  });

  factory NGOPickup.fromJson(Map<String, dynamic> json) {
    return NGOPickup(
      id: json['id']?.toString() ?? '',
      donationId: json['donation_id']?.toString() ?? '',
      ngoId: json['ngo_id']?.toString() ?? '',
      matchId: json['match_id']?.toString(),
      status: json['status']?.toString() ?? 'scheduled',
      scheduledAt: json['scheduled_at']?.toString() ?? '',
      pickupAddress: json['pickup_address']?.toString() ?? '',
      pickupCity: json['pickup_city']?.toString() ?? '',
      contactPhone: json['contact_phone']?.toString(),
      notes: json['notes']?.toString(),
      createdAt: json['created_at']?.toString() ?? '',
      completedAt: json['completed_at']?.toString(),
    );
  }
}

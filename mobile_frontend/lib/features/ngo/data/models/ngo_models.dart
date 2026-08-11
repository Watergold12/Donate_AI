class NGOProfile {
  final String id;
  final String orgName;
  final String? registrationNumber;
  final String? missionStatement;
  final String? address;
  final String? contactPhone;
  final bool isVerified;
  final String verificationStatus;
  final String? verificationDocPath;
  final DateTime? verificationSubmittedAt;
  final String? rejectionReason;
  final DateTime createdAt;

  const NGOProfile({
    required this.id,
    required this.orgName,
    this.registrationNumber,
    this.missionStatement,
    this.address,
    this.contactPhone,
    required this.isVerified,
    required this.verificationStatus,
    this.verificationDocPath,
    this.verificationSubmittedAt,
    this.rejectionReason,
    required this.createdAt,
  });

  factory NGOProfile.fromJson(Map<String, dynamic> json) {
    return NGOProfile(
      id: json['id']?.toString() ?? '',
      orgName: json['org_name'] as String? ?? '',
      registrationNumber: json['registration_number'] as String?,
      missionStatement: json['mission_statement'] as String?,
      address: json['address'] as String?,
      contactPhone: json['contact_phone'] as String?,
      isVerified: json['is_verified'] as bool? ?? false,
      verificationStatus: json['verification_status'] as String? ?? 'unsubmitted',
      verificationDocPath: json['verification_doc_path'] as String?,
      verificationSubmittedAt: json['verification_submitted_at'] != null
          ? DateTime.parse(json['verification_submitted_at'] as String)
          : null,
      rejectionReason: json['rejection_reason'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'org_name': orgName,
      'registration_number': registrationNumber,
      'mission_statement': missionStatement,
      'address': address,
      'contact_phone': contactPhone,
      'is_verified': isVerified,
      'verification_status': verificationStatus,
      'verification_doc_path': verificationDocPath,
      'verification_submitted_at': verificationSubmittedAt?.toIso8601String(),
      'rejection_reason': rejectionReason,
      'created_at': createdAt.toIso8601String(),
    };
  }
}

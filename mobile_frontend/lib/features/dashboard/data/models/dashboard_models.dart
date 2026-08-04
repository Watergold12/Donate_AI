class DonorSummary {
  const DonorSummary({
    required this.totalDonations,
    required this.completedDonations,
    required this.pendingDonations,
    required this.totalItemsDonated,
  });

  final int totalDonations;
  final int completedDonations;
  final int pendingDonations;
  final int totalItemsDonated;

  factory DonorSummary.fromJson(Map<String, dynamic> json) {
    return DonorSummary(
      totalDonations: (json['total_donations'] as num?)?.toInt() ?? 0,
      completedDonations: (json['completed_donations'] as num?)?.toInt() ?? 0,
      pendingDonations: (json['pending_donations'] as num?)?.toInt() ?? 0,
      totalItemsDonated: (json['total_items_donated'] as num?)?.toInt() ?? 0,
    );
  }
}

class NgoSummary {
  const NgoSummary({
    required this.totalDemands,
    required this.activeDemands,
    required this.totalMatches,
    required this.acceptedMatches,
    required this.pickupsCompleted,
  });

  final int totalDemands;
  final int activeDemands;
  final int totalMatches;
  final int acceptedMatches;
  final int pickupsCompleted;

  factory NgoSummary.fromJson(Map<String, dynamic> json) {
    return NgoSummary(
      totalDemands: (json['total_demands'] as num?)?.toInt() ?? 0,
      activeDemands: (json['active_demands'] as num?)?.toInt() ?? 0,
      totalMatches: (json['total_matches'] as num?)?.toInt() ?? 0,
      acceptedMatches: (json['accepted_matches'] as num?)?.toInt() ?? 0,
      pickupsCompleted: (json['pickups_completed'] as num?)?.toInt() ?? 0,
    );
  }
}

class AdminSummary {
  const AdminSummary({
    required this.totalUsers,
    required this.totalDonors,
    required this.totalNgos,
    required this.pendingNgoVerifications,
    required this.totalDonations,
    required this.totalMatches,
    required this.matchSuccessRate,
  });

  final int totalUsers;
  final int totalDonors;
  final int totalNgos;
  final int pendingNgoVerifications;
  final int totalDonations;
  final int totalMatches;
  final double matchSuccessRate;

  factory AdminSummary.fromJson(Map<String, dynamic> json) {
    return AdminSummary(
      totalUsers: (json['total_users'] as num?)?.toInt() ?? 0,
      totalDonors: (json['total_donors'] as num?)?.toInt() ?? 0,
      totalNgos: (json['total_ngos'] as num?)?.toInt() ?? 0,
      pendingNgoVerifications: (json['pending_ngo_verifications'] as num?)?.toInt() ?? 0,
      totalDonations: (json['total_donations'] as num?)?.toInt() ?? 0,
      totalMatches: (json['total_matches'] as num?)?.toInt() ?? 0,
      matchSuccessRate: (json['match_success_rate'] as num?)?.toDouble() ?? 0,
    );
  }
}


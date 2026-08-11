class NGOSummaryStats {
  final int totalDemands;
  final int activeDemands;
  final int totalMatches;
  final int acceptedMatches;
  final int pickupsCompleted;

  const NGOSummaryStats({
    required this.totalDemands,
    required this.activeDemands,
    required this.totalMatches,
    required this.acceptedMatches,
    required this.pickupsCompleted,
  });

  factory NGOSummaryStats.fromJson(Map<String, dynamic> json) {
    return NGOSummaryStats(
      totalDemands: json['total_demands'] as int? ?? 0,
      activeDemands: json['active_demands'] as int? ?? 0,
      totalMatches: json['total_matches'] as int? ?? 0,
      acceptedMatches: json['accepted_matches'] as int? ?? 0,
      pickupsCompleted: json['pickups_completed'] as int? ?? 0,
    );
  }
}

class CategoryBreakdown {
  final String category;
  final int count;
  final double percentage;

  const CategoryBreakdown({
    required this.category,
    required this.count,
    required this.percentage,
  });

  factory CategoryBreakdown.fromJson(Map<String, dynamic> json) {
    return CategoryBreakdown(
      category: json['category'] as String? ?? 'Other',
      count: json['count'] as int? ?? 0,
      percentage: (json['percentage'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class PickupStats {
  final int totalScheduled;
  final int completed;
  final int failed;
  final double completionRate;

  const PickupStats({
    required this.totalScheduled,
    required this.completed,
    required this.failed,
    required this.completionRate,
  });

  factory PickupStats.fromJson(Map<String, dynamic> json) {
    return PickupStats(
      totalScheduled: json['total_scheduled'] as int? ?? 0,
      completed: json['completed'] as int? ?? 0,
      failed: json['failed'] as int? ?? 0,
      completionRate: (json['completion_rate'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class MatchingRatePoint {
  final String date;
  final int totalMatches;
  final int accepted;
  final double rate;

  const MatchingRatePoint({
    required this.date,
    required this.totalMatches,
    required this.accepted,
    required this.rate,
  });

  factory MatchingRatePoint.fromJson(Map<String, dynamic> json) {
    return MatchingRatePoint(
      date: json['date'] as String? ?? '',
      totalMatches: json['total_matches'] as int? ?? 0,
      accepted: json['accepted'] as int? ?? 0,
      rate: (json['rate'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

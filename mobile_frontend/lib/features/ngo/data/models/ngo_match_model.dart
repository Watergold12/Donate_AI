class NGOMatch {
  final String id;
  final String donationId;
  final String? ngoDemandId;
  final double score;
  final String status;
  final String proposedAt;
  final String? expiresAt;
  final String? donationNotes;
  final String? itemsSummary;
  final String? demandItemName;
  final Map<String, dynamic>? scoreBreakdown;
  final List<String>? matchExplanation;

  const NGOMatch({
    required this.id,
    required this.donationId,
    this.ngoDemandId,
    required this.score,
    required this.status,
    required this.proposedAt,
    this.expiresAt,
    this.donationNotes,
    this.itemsSummary,
    this.demandItemName,
    this.scoreBreakdown,
    this.matchExplanation,
  });

  factory NGOMatch.fromJson(Map<String, dynamic> json) {
    return NGOMatch(
      id: json['id']?.toString() ?? '',
      donationId: json['donation_id']?.toString() ?? '',
      ngoDemandId: json['ngo_demand_id']?.toString(),
      score: (json['score'] as num?)?.toDouble() ?? 0.0,
      status: json['status']?.toString() ?? 'proposed',
      proposedAt: json['proposed_at']?.toString() ?? '',
      expiresAt: json['expires_at']?.toString(),
      donationNotes: json['donation_notes']?.toString(),
      itemsSummary: json['items_summary']?.toString(),
      demandItemName: json['demand_item_name']?.toString(),
      scoreBreakdown: json['score_breakdown'] as Map<String, dynamic>?,
      matchExplanation: (json['match_explanation'] as List?)?.map((e) => e.toString()).toList(),
    );
  }
}

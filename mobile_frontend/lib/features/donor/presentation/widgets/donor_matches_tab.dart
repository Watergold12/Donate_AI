import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../data/models/donor_models.dart';
import '../../data/services/donor_service.dart';

class DonorMatchesTab extends StatefulWidget {
  final DonorService donorService;

  const DonorMatchesTab({super.key, required this.donorService});

  @override
  State<DonorMatchesTab> createState() => _DonorMatchesTabState();
}

class _DonorMatchesTabState extends State<DonorMatchesTab> {
  late Future<List<DonorMatchItem>> _matchesFuture;

  @override
  void initState() {
    super.initState();
    _matchesFuture = widget.donorService.getMatches();
  }

  Future<void> _refresh() async {
    setState(() {
      _matchesFuture = widget.donorService.getMatches();
    });
  }

  void _handleAccept(DonorMatchItem match) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Accepted match with ${match.ngoName}! Logistics scheduling initialized.'),
        backgroundColor: AppColors.success,
      ),
    );
  }

  void _handleDecline(DonorMatchItem match) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Declined match with ${match.ngoName}. AI will re-allocate items.'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return RefreshIndicator(
      onRefresh: _refresh,
      child: FutureBuilder<List<DonorMatchItem>>(
        future: _matchesFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final matches = snapshot.data ?? [];

          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              // Header Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.primary, AppColors.primaryDark],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.auto_awesome, color: Colors.amber, size: 22),
                        SizedBox(width: 8),
                        Text(
                          'AI Resource Matching Engine',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Matches are generated in real-time based on NGO demand urgency, item suitability, and geographic proximity.',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.9),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Active AI Recommendations (${matches.length})',
                    style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  IconButton(
                    icon: const Icon(Icons.refresh),
                    onPressed: _refresh,
                    tooltip: 'Refresh matches',
                  ),
                ],
              ),

              const SizedBox(height: 8),

              if (matches.isEmpty)
                Container(
                  padding: const EdgeInsets.all(32),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkSurface : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.handshake_outlined, size: 48, color: AppColors.lightMutedText),
                      const SizedBox(height: 8),
                      Text(
                        'No active matches found',
                        style: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Submit a new donation to trigger AI match recommendations.',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: isDark ? AppColors.darkMutedText : AppColors.lightMutedText,
                        ),
                      ),
                    ],
                  ),
                )
              else
                ...matches.map((match) {
                  final scorePercent = (match.matchScore * 100).toInt();

                  return Card(
                    margin: const EdgeInsets.only(bottom: 14),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppColors.success.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(color: AppColors.success.withValues(alpha: 0.3)),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.stars, size: 14, color: AppColors.success),
                                    const SizedBox(width: 4),
                                    Text(
                                      '$scorePercent% AI Match Score',
                                      style: const TextStyle(
                                        color: AppColors.success,
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              if (match.isUrgent)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppColors.warning.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Text(
                                    'URGENT DEMAND',
                                    style: TextStyle(
                                      color: AppColors.warning,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            match.ngoName,
                            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Requesting: ${match.demandTitle}',
                            style: theme.textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              const Icon(Icons.location_on_outlined, size: 14, color: AppColors.lightMutedText),
                              const SizedBox(width: 4),
                              Text(
                                match.location,
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: isDark ? AppColors.darkMutedText : AppColors.lightMutedText,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Container(
                                width: 4,
                                height: 4,
                                decoration: const BoxDecoration(
                                  color: AppColors.lightMutedText,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Text(
                                'Category: ${match.category}',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: isDark ? AppColors.darkMutedText : AppColors.lightMutedText,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: () => _handleDecline(match),
                                  style: OutlinedButton.styleFrom(
                                    side: const BorderSide(color: AppColors.lightMutedText),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                  child: const Text('Decline'),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: ElevatedButton(
                                  onPressed: () => _handleAccept(match),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primary,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                  child: const Text('Accept Match'),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                }),
            ],
          );
        },
      ),
    );
  }
}

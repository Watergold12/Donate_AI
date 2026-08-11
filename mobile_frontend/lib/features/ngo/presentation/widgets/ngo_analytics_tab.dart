import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../../core/theme/app_colors.dart';
import '../../data/models/ngo_analytics_models.dart';
import '../../data/services/ngo_analytics_service.dart';

class NGOAnalyticsTab extends StatefulWidget {
  final NGOAnalyticsService analyticsService;

  const NGOAnalyticsTab({
    super.key,
    required this.analyticsService,
  });

  @override
  State<NGOAnalyticsTab> createState() => _NGOAnalyticsTabState();
}

class _NGOAnalyticsTabState extends State<NGOAnalyticsTab> {
  bool _isLoading = true;
  NGOSummaryStats? _summaryStats;
  List<CategoryBreakdown>? _categoryBreakdown;
  PickupStats? _pickupStats;
  List<MatchingRatePoint>? _matchingRate;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final summary = await widget.analyticsService.getSummary();
      final categories = await widget.analyticsService.getCategoryBreakdown();
      final pickups = await widget.analyticsService.getPickupStats();
      final rates = await widget.analyticsService.getMatchingRate();

      if (mounted) {
        setState(() {
          _summaryStats = summary;
          _categoryBreakdown = categories;
          _pickupStats = pickups;
          _matchingRate = rates;
        });
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to load analytics data')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Header
          Text(
            'Analytics Dashboard',
            style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 6),
          Text(
            'Track your organisation\'s resource distribution metrics and impact.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: isDark ? AppColors.darkMutedText : AppColors.lightMutedText,
            ),
          ),
          const SizedBox(height: 24),

          // Overview Stats
          if (_summaryStats != null) ...[
            Text('OVERVIEW', style: _labelStyle(theme)),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _buildStatCard(theme, 'Active Demands', '${_summaryStats!.activeDemands}', Icons.assignment_outlined, AppColors.primary)),
                const SizedBox(width: 12),
                Expanded(child: _buildStatCard(theme, 'Accepted Matches', '${_summaryStats!.acceptedMatches}', Icons.handshake_outlined, AppColors.success)),
              ],
            ),
            const SizedBox(height: 24),
          ],

          // Category Breakdown
          if (_categoryBreakdown != null && _categoryBreakdown!.isNotEmpty) ...[
            Text('CATEGORY BREAKDOWN', style: _labelStyle(theme)),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: SizedBox(
                  height: 250,
                  child: PieChart(
                    PieChartData(
                      sectionsSpace: 2,
                      centerSpaceRadius: 50,
                      sections: _buildPieSections(),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            _buildCategoryLegend(theme),
            const SizedBox(height: 24),
          ],

          // Matching Rate Trend
          if (_matchingRate != null && _matchingRate!.isNotEmpty) ...[
            Text('MATCHING RATE (LAST 30 DAYS)', style: _labelStyle(theme)),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: SizedBox(
                  height: 220,
                  child: LineChart(
                    LineChartData(
                      gridData: FlGridData(show: true, drawVerticalLine: false),
                      titlesData: FlTitlesData(
                        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        bottomTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        leftTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            reservedSize: 40,
                            getTitlesWidget: (value, meta) => Text('${value.toInt()}%', style: const TextStyle(fontSize: 10)),
                          ),
                        ),
                      ),
                      borderData: FlBorderData(show: false),
                      minX: 0,
                      maxX: (_matchingRate!.length - 1).toDouble(),
                      minY: 0,
                      maxY: 100,
                      lineBarsData: [
                        LineChartBarData(
                          spots: _buildLineSpots(),
                          isCurved: true,
                          color: AppColors.primary,
                          barWidth: 3,
                          isStrokeCapRound: true,
                          dotData: const FlDotData(show: false),
                          belowBarData: BarAreaData(
                            show: true,
                            color: AppColors.primary.withValues(alpha: 0.15),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],

          // Pickups
          if (_pickupStats != null) ...[
            Text('PICKUP COMPLETION', style: _labelStyle(theme)),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Completion Rate', style: theme.textTheme.titleMedium),
                        Text('${_pickupStats!.completionRate.toStringAsFixed(1)}%', 
                          style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold, color: AppColors.success)),
                      ],
                    ),
                    const SizedBox(height: 16),
                    LinearProgressIndicator(
                      value: _pickupStats!.completionRate / 100,
                      backgroundColor: Colors.grey.withValues(alpha: 0.2),
                      color: AppColors.success,
                      minHeight: 8,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildSmallStat('Scheduled', _pickupStats!.totalScheduled, Colors.blue),
                        _buildSmallStat('Completed', _pickupStats!.completed, AppColors.success),
                        _buildSmallStat('Failed', _pickupStats!.failed, AppColors.error),
                      ],
                    )
                  ],
                ),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ],
      ),
    );
  }

  TextStyle _labelStyle(ThemeData theme) {
    return theme.textTheme.labelSmall!.copyWith(
      color: AppColors.primary,
      fontWeight: FontWeight.bold,
      letterSpacing: 1.2,
    );
  }

  Widget _buildStatCard(ThemeData theme, String title, String value, IconData icon, Color color) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: color.withValues(alpha: 0.2)),
      ),
      color: color.withValues(alpha: 0.05),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 12),
            Text(value, style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold, color: color)),
            const SizedBox(height: 4),
            Text(title, style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }

  Widget _buildSmallStat(String label, int value, Color color) {
    return Column(
      children: [
        Text('$value', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
        Text(label, style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w500)),
      ],
    );
  }

  List<PieChartSectionData> _buildPieSections() {
    if (_categoryBreakdown == null) return [];
    
    final colors = [
      AppColors.primary,
      AppColors.success,
      Colors.orange,
      Colors.purple,
      Colors.blue,
      Colors.teal,
    ];
    
    return _categoryBreakdown!.asMap().entries.map((entry) {
      final index = entry.key;
      final item = entry.value;
      final color = colors[index % colors.length];
      return PieChartSectionData(
        color: color,
        value: item.percentage,
        title: '${item.percentage.toStringAsFixed(1)}%',
        radius: 60,
        titleStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
      );
    }).toList();
  }

  Widget _buildCategoryLegend(ThemeData theme) {
    if (_categoryBreakdown == null) return const SizedBox();
    
    final colors = [
      AppColors.primary,
      AppColors.success,
      Colors.orange,
      Colors.purple,
      Colors.blue,
      Colors.teal,
    ];
    
    return Wrap(
      spacing: 12,
      runSpacing: 8,
      alignment: WrapAlignment.center,
      children: _categoryBreakdown!.asMap().entries.map((entry) {
        final index = entry.key;
        final item = entry.value;
        final color = colors[index % colors.length];
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(width: 12, height: 12, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
            const SizedBox(width: 6),
            Text(item.category, style: theme.textTheme.bodySmall),
          ],
        );
      }).toList(),
    );
  }

  List<FlSpot> _buildLineSpots() {
    if (_matchingRate == null) return [];
    return _matchingRate!.asMap().entries.map((entry) {
      return FlSpot(entry.key.toDouble(), entry.value.rate);
    }).toList();
  }
}

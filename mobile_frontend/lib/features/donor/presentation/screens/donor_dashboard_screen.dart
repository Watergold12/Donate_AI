import 'package:flutter/material.dart';

import 'package:mobile_frontend/app/app.dart';
import 'package:mobile_frontend/core/network/api_client.dart';
import 'package:mobile_frontend/core/network/api_exception.dart';
import 'package:mobile_frontend/core/network/token_store.dart';
import 'package:mobile_frontend/core/theme/app_colors.dart';
import 'package:mobile_frontend/features/auth/data/auth_service.dart';
import 'package:mobile_frontend/features/donor/data/models/donor_models.dart';
import 'package:mobile_frontend/features/donor/data/services/donor_service.dart';
import 'package:mobile_frontend/features/donor/presentation/widgets/donor_matches_tab.dart';
import 'package:mobile_frontend/features/donor/presentation/widgets/donor_profile_tab.dart';
import 'package:mobile_frontend/features/donor/presentation/widgets/pickup_tracker_tab.dart';
import 'package:mobile_frontend/features/donor/presentation/widgets/scan_catalog_tab.dart';

class DonorDashboardScreen extends StatefulWidget {
  const DonorDashboardScreen({super.key});

  @override
  State<DonorDashboardScreen> createState() => _DonorDashboardScreenState();
}

class _DonorDashboardScreenState extends State<DonorDashboardScreen> {
  late final ApiClient _apiClient;
  late final AuthService _authService;
  late final DonorService _donorService;
  late Future<Map<String, dynamic>> _summaryFuture;
  late Future<StoredSession?> _sessionFuture;
  int _selectedIndex = 0;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _apiClient = ApiClient();
    _authService = AuthService(client: _apiClient);
    _donorService = DonorService(client: _apiClient);
    _summaryFuture = _loadSummary();
    _sessionFuture = _apiClient.readSession();
  }

  @override
  void dispose() {
    _donorService.close();
    _apiClient.close();
    super.dispose();
  }

  Future<Map<String, dynamic>> _loadSummary() async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '/api/v1/analytics/summary',
      fromJson: (json) => Map<String, dynamic>.from(json as Map),
    );
    return response.data ?? const {};
  }

  Future<void> _refresh() async {
    setState(() {
      _summaryFuture = _loadSummary();
      _sessionFuture = _apiClient.readSession();
    });
  }

  Future<void> _logout() async {
    setState(() => _busy = true);
    try {
      await _authService.logout();
      if (!mounted) return;
      Navigator.of(context).pushNamedAndRemoveUntil('/auth', (route) => false);
    } on ApiException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Logout failed: $error')));
    } finally {
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = DonateAiApp.of(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Donate AI'),
        actions: [
          IconButton(
            onPressed: _busy ? null : _refresh,
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh',
          ),
          TextButton(
            onPressed: _busy ? null : _logout,
            child: Text(_busy ? 'Signing out...' : 'Sign out'),
          ),
          const SizedBox(width: 12),
        ],
      ),
      body: SafeArea(
        child: IndexedStack(
          index: _selectedIndex,
          children: [
            _OverviewTab(
              donorService: _donorService,
              sessionFuture: _sessionFuture,
              summaryFuture: _summaryFuture,
              onNavigateToScan: () {
                setState(() => _selectedIndex = 1);
              },
              onNavigateToTracker: () {
                setState(() => _selectedIndex = 3);
              },
            ),
            ScanCatalogTab(
              donorService: _donorService,
              onDonationSubmitted: () {
                setState(() {
                  _selectedIndex = 2; // Jump to Matches tab after submission
                });
              },
            ),
            DonorMatchesTab(
              donorService: _donorService,
            ),
            PickupTrackerTab(
              donorService: _donorService,
            ),
            DonorProfileTab(
              donorService: _donorService,
              onLogout: _busy ? null : _logout,
              logoutLabel: _busy ? 'Signing out...' : 'Sign out',
              isDarkMode: isDark,
              onToggleTheme: (val) {
                appState?.toggleTheme(val);
              },
            ),
          ],
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.qr_code_scanner_outlined),
            selectedIcon: Icon(Icons.qr_code_scanner),
            label: 'Scan',
          ),
          NavigationDestination(
            icon: Icon(Icons.handshake_outlined),
            selectedIcon: Icon(Icons.handshake),
            label: 'Matches',
          ),
          NavigationDestination(
            icon: Icon(Icons.location_on_outlined),
            selectedIcon: Icon(Icons.location_on),
            label: 'Tracker',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

class _OverviewTab extends StatelessWidget {
  const _OverviewTab({
    required this.donorService,
    required this.sessionFuture,
    required this.summaryFuture,
    required this.onNavigateToScan,
    required this.onNavigateToTracker,
  });

  final DonorService donorService;
  final Future<StoredSession?> sessionFuture;
  final Future<Map<String, dynamic>> summaryFuture;
  final VoidCallback onNavigateToScan;
  final VoidCallback onNavigateToTracker;

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return AppColors.success;
      case 'matched':
      case 'pickup_scheduled':
      case 'in_transit':
        return AppColors.warning;
      case 'cancelled':
        return AppColors.error;
      case 'draft':
      case 'pending_match':
      default:
        return AppColors.primary;
    }
  }

  String _formatStatusLabel(String status) {
    switch (status.toLowerCase()) {
      case 'pending_match':
        return 'Pending Match';
      case 'packaging_notified':
        return 'Packaging Ready';
      case 'pickup_scheduled':
        return 'Pickup Scheduled';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.replaceAll('_', ' ').toUpperCase();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return FutureBuilder<StoredSession?>(
      future: sessionFuture,
      builder: (context, sessionSnap) {
        return FutureBuilder<Map<String, dynamic>>(
          future: summaryFuture,
          builder: (context, summarySnap) {
            final summary = summarySnap.data ?? {};
            final totalDonations = (summary['total_donations'] as num?)?.toInt() ?? 0;
            final completedDonations = (summary['completed_donations'] as num?)?.toInt() ?? 0;
            final accuracy = totalDonations > 0 ? '${((completedDonations / totalDonations) * 100).round()}%' : '—';

            return ListView(
              padding: const EdgeInsets.all(20),
              children: [
                // Welcome header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Welcome back',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: isDark ? AppColors.darkMutedText : AppColors.lightMutedText,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Hi Donor',
                          style: theme.textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    ElevatedButton.icon(
                      onPressed: onNavigateToScan,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      icon: const Icon(Icons.add, size: 18),
                      label: const Text('+ Donate item'),
                    ),
                  ],
                ),

                const SizedBox(height: 20),

                // Stat Cards Grid
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard(
                        context: context,
                        value: '$totalDonations',
                        label: 'Donations',
                        valueColor: theme.colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildStatCard(
                        context: context,
                        value: '$completedDonations',
                        label: 'NGOs helped',
                        valueColor: theme.colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildStatCard(
                        context: context,
                        value: accuracy,
                        label: 'Match accuracy',
                        valueColor: AppColors.primary,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // Recent Activity Section
                Text(
                  'Recent Activity',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 10),

                FutureBuilder<List<DonationRecord>>(
                  future: donorService.getRecentDonations(size: 5),
                  builder: (context, donationsSnap) {
                    if (donationsSnap.connectionState == ConnectionState.waiting) {
                      return const Center(
                        child: Padding(
                          padding: EdgeInsets.all(24),
                          child: CircularProgressIndicator(),
                        ),
                      );
                    }

                    final donations = donationsSnap.data ?? [];

                    if (donations.isEmpty) {
                      return Card(
                        child: Padding(
                          padding: const EdgeInsets.all(28),
                          child: Column(
                            children: [
                              const Icon(Icons.volunteer_activism_outlined, size: 40, color: AppColors.lightMutedText),
                              const SizedBox(height: 8),
                              Text(
                                'No donations yet',
                                style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Start making a difference by creating your first donation',
                                textAlign: TextAlign.center,
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: isDark ? AppColors.darkMutedText : AppColors.lightMutedText,
                                ),
                              ),
                              const SizedBox(height: 14),
                              ElevatedButton(
                                onPressed: onNavigateToScan,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                  foregroundColor: Colors.white,
                                ),
                                child: const Text('Create Donation'),
                              ),
                            ],
                          ),
                        ),
                      );
                    }

                    return Card(
                      child: ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: donations.length,
                        separatorBuilder: (_, _) => const Divider(height: 1),
                        itemBuilder: (context, index) {
                          final donation = donations[index];
                          final statusColor = _getStatusColor(donation.status);
                          final statusLabel = _formatStatusLabel(donation.status);
                          final canSchedule = !['completed', 'cancelled', 'pickup_scheduled', 'collected', 'delivered'].contains(donation.status.toLowerCase());

                          return ListTile(
                            title: Text(
                              donation.notes != null && donation.notes!.isNotEmpty
                                  ? donation.notes!
                                  : '${donation.totalItems} item(s) donated',
                              style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold),
                            ),
                            subtitle: Text(
                              donation.createdAt.isNotEmpty ? donation.createdAt.split('T')[0] : 'Recent',
                              style: theme.textTheme.bodySmall?.copyWith(fontSize: 11),
                            ),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: statusColor.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    statusLabel,
                                    style: TextStyle(
                                      color: statusColor,
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                if (canSchedule) ...[
                                  const SizedBox(width: 8),
                                  ElevatedButton(
                                    onPressed: onNavigateToTracker,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.primary,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                      minimumSize: Size.zero,
                                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                    ),
                                    child: const Text('Schedule', style: TextStyle(fontSize: 11)),
                                  ),
                                ],
                              ],
                            ),
                          );
                        },
                      ),
                    );
                  },
                ),
              ],
            );
          },
        );
      },
    );
  }

  Widget _buildStatCard({
    required BuildContext context,
    required String value,
    required String label,
    required Color valueColor,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value,
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
                fontSize: 26,
                color: valueColor,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: isDark ? AppColors.darkMutedText : AppColors.lightMutedText,
              ),
            ),
          ],
        ),
      ),
    );
  }
}





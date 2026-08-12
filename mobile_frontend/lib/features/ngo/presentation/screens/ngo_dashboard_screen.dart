import 'package:flutter/material.dart';

import 'package:mobile_frontend/core/network/api_client.dart';
import 'package:mobile_frontend/core/network/api_exception.dart';
import 'package:mobile_frontend/core/network/token_store.dart';
import 'package:mobile_frontend/core/theme/app_colors.dart';
import 'package:mobile_frontend/features/auth/data/auth_service.dart';
import '../../data/services/ngo_service.dart';
import '../../data/services/ngo_analytics_service.dart';
import '../../data/services/ngo_demand_service.dart';
import '../../data/services/ngo_match_service.dart';
import '../../data/services/ngo_pickup_service.dart';
import '../widgets/ngo_verification_tab.dart';
import '../widgets/ngo_analytics_tab.dart';
import '../widgets/ngo_demands_tab.dart';
import '../widgets/ngo_matches_tab.dart';
import '../widgets/ngo_pickups_tab.dart';
import '../widgets/ngo_settings_tab.dart';
class NGODashboardScreen extends StatefulWidget {
  const NGODashboardScreen({super.key});

  @override
  State<NGODashboardScreen> createState() => _NGODashboardScreenState();
}

class _NGODashboardScreenState extends State<NGODashboardScreen> {
  late final ApiClient _apiClient;
  late final AuthService _authService;
  late final NGOService _ngoService;
  late final NGOAnalyticsService _analyticsService;
  late final NGODemandService _demandService;
  late final NGOMatchService _matchService;
  late final NGOPickupService _pickupService;
  late Future<Map<String, dynamic>> _summaryFuture;
  late Future<StoredSession?> _sessionFuture;
  int _selectedIndex = 0;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _apiClient = ApiClient();
    _authService = AuthService(client: _apiClient);
    _ngoService = NGOService(client: _apiClient);
    _analyticsService = NGOAnalyticsService(client: _apiClient);
    _demandService = NGODemandService(client: _apiClient);
    _matchService = NGOMatchService(client: _apiClient);
    _pickupService = NGOPickupService(client: _apiClient);
    _summaryFuture = _loadSummary();
    _sessionFuture = _apiClient.readSession();
  }

  @override
  void dispose() {
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
              title: 'NGO workspace',
              subtitle: 'Manage demands, matches, and pickups from your phone.',
              accent: AppColors.success,
              sessionFuture: _sessionFuture,
              summaryFuture: _summaryFuture,
            ),
            NGOVerificationTab(
              ngoService: _ngoService,
            ),
            NGODemandsTab(
              ngoService: _ngoService,
              demandService: _demandService,
            ),
            NGOMatchesTab(
              matchService: _matchService,
            ),
            NGOPickupsTab(
              pickupService: _pickupService,
            ),
            NGOAnalyticsTab(
              analyticsService: _analyticsService,
            ),
            NGOSettingsTab(
              sessionFuture: _sessionFuture,
              onLogout: _busy ? null : _logout,
              logoutLabel: _busy ? 'Signing out...' : 'Sign out',
              ngoService: _ngoService,
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
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.fact_check_outlined),
            selectedIcon: Icon(Icons.fact_check),
            label: 'Verify',
          ),
          NavigationDestination(
            icon: Icon(Icons.assignment_outlined),
            selectedIcon: Icon(Icons.assignment),
            label: 'Demands',
          ),
          NavigationDestination(
            icon: Icon(Icons.handshake_outlined),
            selectedIcon: Icon(Icons.handshake),
            label: 'Matches',
          ),
          NavigationDestination(
            icon: Icon(Icons.local_shipping_outlined),
            selectedIcon: Icon(Icons.local_shipping),
            label: 'Pickups',
          ),
          NavigationDestination(
            icon: Icon(Icons.analytics_outlined),
            selectedIcon: Icon(Icons.analytics),
            label: 'Analytics',
          ),
          NavigationDestination(
            icon: Icon(Icons.settings_outlined),
            selectedIcon: Icon(Icons.settings),
            label: 'Settings',
          ),
        ],
      ),
    );
  }
}

class _OverviewTab extends StatelessWidget {
  const _OverviewTab({
    required this.title,
    required this.subtitle,
    required this.accent,
    required this.sessionFuture,
    required this.summaryFuture,
  });

  final String title;
  final String subtitle;
  final Color accent;
  final Future<StoredSession?> sessionFuture;
  final Future<Map<String, dynamic>> summaryFuture;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _HeroBanner(
          title: title,
          subtitle: subtitle,
          accent: accent,
        ),
        const SizedBox(height: 16),
        FutureBuilder<StoredSession?>(
          future: sessionFuture,
          builder: (context, snapshot) {
            final role = snapshot.data?.role ?? 'ngo';
            return _InfoCard(
              title: 'Signed in as',
              value: role,
              subtitle: 'Your saved session is active on this device.',
            );
          },
        ),
        const SizedBox(height: 16),
        FutureBuilder<Map<String, dynamic>>(
          future: summaryFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const _LoadingCard(label: 'Loading NGO summary...');
            }
            if (snapshot.hasError) {
              return _ErrorCard(message: 'Could not load NGO summary: ${snapshot.error}');
            }

            final summary = snapshot.data ?? const {};
            return _StatsGrid(
              cards: [
                _StatSpec('Total demands', '${summary['total_demands'] ?? 0}'),
                _StatSpec('Active demands', '${summary['active_demands'] ?? 0}'),
                _StatSpec('Total matches', '${summary['total_matches'] ?? 0}'),
                _StatSpec('Pickups done', '${summary['pickups_completed'] ?? 0}'),
              ],
            );
          },
        ),
      ],
    );
  }
}







class _HeroBanner extends StatelessWidget {
  const _HeroBanner({
    required this.title,
    required this.subtitle,
    required this.accent,
  });

  final String title;
  final String subtitle;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [accent, accent.withValues(alpha: 0.78)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: theme.textTheme.headlineMedium?.copyWith(color: Colors.white)),
          const SizedBox(height: 8),
          Text(subtitle, style: theme.textTheme.bodyLarge?.copyWith(color: Colors.white70)),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({
    required this.title,
    required this.value,
    required this.subtitle,
  });

  final String title;
  final String value;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: theme.textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(value, style: theme.textTheme.headlineMedium),
            const SizedBox(height: 6),
            Text(subtitle, style: theme.textTheme.bodyMedium),
          ],
        ),
      ),
    );
  }
}

class _LoadingCard extends StatelessWidget {
  const _LoadingCard({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            const SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            const SizedBox(width: 12),
            Expanded(child: Text(label)),
          ],
        ),
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Text(
          message,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.error,
              ),
        ),
      ),
    );
  }
}

class _StatSpec {
  const _StatSpec(this.label, this.value);

  final String label;
  final String value;
}

class _StatsGrid extends StatelessWidget {
  const _StatsGrid({required this.cards});

  final List<_StatSpec> cards;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.65,
      children: cards
          .map(
            (card) => Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(card.label, style: Theme.of(context).textTheme.bodyMedium),
                    const SizedBox(height: 6),
                    Text(card.value, style: Theme.of(context).textTheme.headlineMedium),
                  ],
                ),
              ),
            ),
          )
          .toList(),
    );
  }
}

class _ActionList extends StatelessWidget {
  const _ActionList({
    required this.title,
    required this.actions,
  });

  final String title;
  final List<String> actions;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: theme.textTheme.titleLarge),
            const SizedBox(height: 12),
            ...actions.map(
              (action) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Padding(
                      padding: EdgeInsets.only(top: 4),
                      child: Icon(Icons.circle, size: 8),
                    ),
                    const SizedBox(width: 10),
                    Expanded(child: Text(action, style: theme.textTheme.bodyMedium)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';

import 'package:mobile_frontend/core/network/api_client.dart';
import 'package:mobile_frontend/core/network/api_exception.dart';
import 'package:mobile_frontend/core/network/token_store.dart';
import 'package:mobile_frontend/core/theme/app_colors.dart';
import 'package:mobile_frontend/features/auth/data/auth_service.dart';

class DonorDashboardScreen extends StatefulWidget {
  const DonorDashboardScreen({super.key});

  @override
  State<DonorDashboardScreen> createState() => _DonorDashboardScreenState();
}

class _DonorDashboardScreenState extends State<DonorDashboardScreen> {
  late final ApiClient _apiClient;
  late final AuthService _authService;
  late Future<Map<String, dynamic>> _summaryFuture;
  late Future<StoredSession?> _sessionFuture;
  int _selectedIndex = 0;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _apiClient = ApiClient();
    _authService = AuthService(client: _apiClient);
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
              title: 'Donor workspace',
              subtitle: 'Track donations, pickups, and impact from your phone.',
              accent: AppColors.primary,
              sessionFuture: _sessionFuture,
              summaryFuture: _summaryFuture,
            ),
            _ActionTab(
              title: 'Scan and catalog',
              subtitle: 'AI item scanning and inventory cataloging.',
              accent: AppColors.primaryDark,
              cards: const [
                _ActionCardData('Capture item photo', 'Scan items using device camera or gallery.'),
                _ActionCardData('Extract AI details', 'Auto-detect item category, condition, and specs.'),
                _ActionCardData('Review cataloged items', 'Check pending scanned items before submitting.'),
                _ActionCardData('Add to donation queue', 'Submit cataloged items to donation list.'),
              ],
            ),
            _ActionTab(
              title: 'Matches',
              subtitle: 'Review intelligent AI match recommendations.',
              accent: AppColors.primaryDark,
              cards: const [
                _ActionCardData('View top NGO matches', 'See NGOs requesting items matching your donation.'),
                _ActionCardData('Check match breakdown', 'Review similarity score and allocation fit.'),
                _ActionCardData('Accept match proposal', 'Confirm NGO match to schedule pickup.'),
                _ActionCardData('Match history', 'Review previous successful resource matches.'),
              ],
            ),
            _ActionTab(
              title: 'Tracker',
              subtitle: 'Track scheduled pickups and delivery status.',
              accent: AppColors.primaryDark,
              cards: const [
                _ActionCardData('Active pickup schedule', 'Monitor current driver pickup windows.'),
                _ActionCardData('Driver & route info', 'View assigned courier details and vehicle info.'),
                _ActionCardData('Real-time updates', 'Track status changes from pending to fulfilled.'),
                _ActionCardData('Completed pickups', 'Review history of collected donations.'),
              ],
            ),
            _AccountTab(
              sessionFuture: _sessionFuture,
              onLogout: _busy ? null : _logout,
              logoutLabel: _busy ? 'Signing out...' : 'Sign out',
              roleLabel: 'donor',
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
            final role = snapshot.data?.role ?? 'donor';
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
              return const _LoadingCard(label: 'Loading donor summary...');
            }
            if (snapshot.hasError) {
              return _ErrorCard(message: 'Could not load donor summary: ${snapshot.error}');
            }

            final summary = snapshot.data ?? const {};
            return _StatsGrid(
              cards: [
                _StatSpec('Total donations', '${summary['total_donations'] ?? 0}'),
                _StatSpec('Completed', '${summary['completed_donations'] ?? 0}'),
                _StatSpec('In progress', '${summary['pending_donations'] ?? 0}'),
                _StatSpec('Items donated', '${summary['total_items_donated'] ?? 0}'),
              ],
            );
          },
        ),
      ],
    );
  }
}

class _ActionTab extends StatelessWidget {
  const _ActionTab({
    required this.title,
    required this.subtitle,
    required this.accent,
    required this.cards,
  });

  final String title;
  final String subtitle;
  final Color accent;
  final List<_ActionCardData> cards;

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
        _ActionList(
          title: 'Quick actions',
          actions: cards.map((card) => card.title).toList(),
        ),
        const SizedBox(height: 16),
        _ActionList(
          title: 'What this page covers',
          actions: cards.map((card) => card.subtitle).toList(),
        ),
      ],
    );
  }
}

class _AccountTab extends StatelessWidget {
  const _AccountTab({
    required this.sessionFuture,
    required this.onLogout,
    required this.logoutLabel,
    required this.roleLabel,
  });

  final Future<StoredSession?> sessionFuture;
  final VoidCallback? onLogout;
  final String logoutLabel;
  final String roleLabel;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const _HeroBanner(
          title: 'Account',
          subtitle: 'Manage your signed-in session and account access.',
          accent: AppColors.primaryDark,
        ),
        const SizedBox(height: 16),
        FutureBuilder<StoredSession?>(
          future: sessionFuture,
          builder: (context, snapshot) {
            final session = snapshot.data;
            return _InfoCard(
              title: 'Current role',
              value: session?.role ?? roleLabel,
              subtitle: 'Your mobile session stays on this device until you log out.',
            );
          },
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Session actions', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 12),
                Text(
                  'Sign out when you are done so the next user has to authenticate again.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 16),
                Align(
                  alignment: Alignment.centerRight,
                  child: OutlinedButton(
                    onPressed: onLogout,
                    child: Text(logoutLabel),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _ActionCardData {
  const _ActionCardData(this.title, this.subtitle);

  final String title;
  final String subtitle;
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

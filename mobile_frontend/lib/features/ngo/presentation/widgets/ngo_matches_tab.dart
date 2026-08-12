import 'package:flutter/material.dart';
import 'package:mobile_frontend/core/theme/app_colors.dart';
import 'package:mobile_frontend/features/ngo/data/models/ngo_match_model.dart';
import 'package:mobile_frontend/features/ngo/data/services/ngo_match_service.dart';

class NGOMatchesTab extends StatefulWidget {
  final NGOMatchService matchService;

  const NGOMatchesTab({super.key, required this.matchService});

  @override
  State<NGOMatchesTab> createState() => _NGOMatchesTabState();
}

class _NGOMatchesTabState extends State<NGOMatchesTab> {
  final List<NGOMatch> _matches = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  int _page = 1;
  int _totalPages = 1;
  String _statusFilter = 'proposed';
  String? _actionMatchId;

  @override
  void initState() {
    super.initState();
    _loadMatches();
  }

  Future<void> _loadMatches({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _page = 1;
        _matches.clear();
        _isLoading = true;
      });
    } else {
      setState(() => _isLoadingMore = true);
    }

    try {
      final envelope = await widget.matchService.getMatches(
        page: _page,
        size: 10,
        statusFilter: _statusFilter,
      );
      
      setState(() {
        _matches.addAll(envelope.data ?? []);
        _totalPages = envelope.pagination?['pages'] as int? ?? 1;
        _isLoading = false;
        _isLoadingMore = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _isLoadingMore = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load matches: $e')),
        );
      }
    }
  }

  void _loadMore() {
    if (!_isLoadingMore && _page < _totalPages) {
      _page++;
      _loadMatches();
    }
  }

  Future<void> _acceptMatch(String matchId) async {
    setState(() => _actionMatchId = matchId);
    try {
      await widget.matchService.acceptMatch(matchId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Match accepted successfully! Pickup scheduling started.')),
        );
        _loadMatches(refresh: true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to accept match: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _actionMatchId = null);
      }
    }
  }

  Future<void> _rejectMatch(String matchId, String reason) async {
    setState(() => _actionMatchId = matchId);
    try {
      await widget.matchService.rejectMatch(matchId, reason);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Match rejected.')),
        );
        _loadMatches(refresh: true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to reject match: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _actionMatchId = null);
      }
    }
  }

  void _showRejectDialog(String matchId) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reject Match'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Please provide a reason for rejecting this match. This helps improve future recommendations.'),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              decoration: const InputDecoration(
                labelText: 'Reason',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () {
              Navigator.pop(context);
              if (controller.text.trim().isNotEmpty) {
                _rejectMatch(matchId, controller.text.trim());
              }
            },
            child: const Text('Reject Match'),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChips() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Row(
        children: [
          ChoiceChip(
            label: const Text('Proposed'),
            selected: _statusFilter == 'proposed',
            onSelected: (selected) {
              if (selected) {
                setState(() => _statusFilter = 'proposed');
                _loadMatches(refresh: true);
              }
            },
          ),
          const SizedBox(width: 8),
          ChoiceChip(
            label: const Text('Accepted'),
            selected: _statusFilter == 'accepted',
            onSelected: (selected) {
              if (selected) {
                setState(() => _statusFilter = 'accepted');
                _loadMatches(refresh: true);
              }
            },
          ),
          const SizedBox(width: 8),
          ChoiceChip(
            label: const Text('Rejected'),
            selected: _statusFilter == 'rejected',
            onSelected: (selected) {
              if (selected) {
                setState(() => _statusFilter = 'rejected');
                _loadMatches(refresh: true);
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildMatchCard(NGOMatch match) {
    final theme = Theme.of(context);
    final scorePercent = (match.score * 100).toStringAsFixed(1);
    
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: ExpansionTile(
        title: Text('Match Score: $scorePercent%', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
        subtitle: Text('Demand: ${match.demandItemName ?? "General items"}', style: theme.textTheme.bodyMedium),
        leading: CircleAvatar(
          backgroundColor: match.score > 0.8 ? AppColors.success : (match.score > 0.5 ? AppColors.warning : AppColors.error),
          child: Icon(Icons.handshake, color: Colors.white, size: 20),
        ),
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (match.itemsSummary != null) ...[
                  Text('Items Offered:', style: theme.textTheme.titleSmall),
                  const SizedBox(height: 4),
                  Text(match.itemsSummary!, style: theme.textTheme.bodyMedium),
                  const SizedBox(height: 12),
                ],
                if (match.donationNotes != null) ...[
                  Text('Donor Notes:', style: theme.textTheme.titleSmall),
                  const SizedBox(height: 4),
                  Text(match.donationNotes!, style: theme.textTheme.bodyMedium?.copyWith(fontStyle: FontStyle.italic)),
                  const SizedBox(height: 12),
                ],
                Text('Score Breakdown:', style: theme.textTheme.titleSmall),
                const SizedBox(height: 6),
                if (match.scoreBreakdown != null)
                  ...match.scoreBreakdown!.entries.where((e) => e.value is num).map((e) => Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(e.key.replaceAll('_', ' ').toUpperCase(), style: theme.textTheme.bodySmall),
                            Text('${((e.value as num) * 100).toStringAsFixed(1)}%', style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.bold)),
                          ],
                        ),
                      )),
                const SizedBox(height: 16),
                if (match.status == 'proposed' && _actionMatchId != match.id)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      OutlinedButton(
                        style: OutlinedButton.styleFrom(foregroundColor: AppColors.error),
                        onPressed: () => _showRejectDialog(match.id),
                        child: const Text('Reject'),
                      ),
                      const SizedBox(width: 12),
                      FilledButton(
                        style: FilledButton.styleFrom(backgroundColor: AppColors.success),
                        onPressed: () => _acceptMatch(match.id),
                        child: const Text('Accept Match'),
                      ),
                    ],
                  )
                else if (_actionMatchId == match.id)
                   const Center(child: CircularProgressIndicator())
                else
                   Center(
                     child: Chip(
                       label: Text(match.status.toUpperCase()),
                       backgroundColor: match.status == 'accepted' ? AppColors.success.withValues(alpha: 0.1) : AppColors.error.withValues(alpha: 0.1),
                     ),
                   )
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.all(20).copyWith(bottom: 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Matches Management',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 6),
              Text(
                'Review AI-recommended donations and accept matching items.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).brightness == Brightness.dark ? AppColors.darkMutedText : AppColors.lightMutedText,
                ),
              ),
            ],
          ),
        ),
        _buildFilterChips(),
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: () => _loadMatches(refresh: true),
                  child: _matches.isEmpty
                      ? ListView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          children: [
                            SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                            const Center(child: Text('No matches found for this status.')),
                          ],
                        )
                      : ListView.builder(
                          physics: const AlwaysScrollableScrollPhysics(),
                          itemCount: _matches.length + (_page < _totalPages ? 1 : 0),
                          itemBuilder: (context, index) {
                            if (index == _matches.length) {
                              _loadMore();
                              return const Padding(
                                padding: EdgeInsets.all(20),
                                child: Center(child: CircularProgressIndicator()),
                              );
                            }
                            return _buildMatchCard(_matches[index]);
                          },
                        ),
                ),
        ),
      ],
    );
  }
}

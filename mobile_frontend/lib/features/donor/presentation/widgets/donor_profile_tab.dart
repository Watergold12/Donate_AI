import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../data/models/donor_models.dart';
import '../../data/services/donor_service.dart';

class DonorProfileTab extends StatefulWidget {
  final DonorService donorService;
  final VoidCallback? onLogout;
  final String logoutLabel;
  final bool isDarkMode;
  final ValueChanged<bool> onToggleTheme;

  const DonorProfileTab({
    super.key,
    required this.donorService,
    required this.onLogout,
    required this.logoutLabel,
    required this.isDarkMode,
    required this.onToggleTheme,
  });

  @override
  State<DonorProfileTab> createState() => _DonorProfileTabState();
}

class _DonorProfileTabState extends State<DonorProfileTab> {
  late Future<DonorProfile> _profileFuture;

  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _cityController = TextEditingController();
  final _addressController = TextEditingController();

  bool _emailNotifications = true;
  bool _pushNotifications = true;
  bool _isSaving = false;
  bool _isLoaded = false;

  @override
  void initState() {
    super.initState();
    _profileFuture = _loadProfile();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _cityController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<DonorProfile> _loadProfile() async {
    final profile = await widget.donorService.getProfile();
    if (!_isLoaded) {
      _nameController.text = profile.name;
      _phoneController.text = profile.phone;
      _cityController.text = profile.city;
      _addressController.text = profile.address;
      _emailNotifications = profile.emailNotifications;
      _pushNotifications = profile.pushNotifications;
      _isLoaded = true;
    }
    return profile;
  }

  Future<void> _handleSave() async {
    setState(() => _isSaving = true);
    try {
      final updated = DonorProfile(
        name: _nameController.text.trim(),
        email: '',
        phone: _phoneController.text.trim(),
        city: _cityController.text.trim(),
        address: _addressController.text.trim(),
        emailNotifications: _emailNotifications,
        pushNotifications: _pushNotifications,
      );

      final success = await widget.donorService.updateProfile(updated);
      if (!mounted) return;
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile saved successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return FutureBuilder<DonorProfile>(
      future: _profileFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting && !_isLoaded) {
          return const Center(child: CircularProgressIndicator());
        }

        final profile = snapshot.data;

        return ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // User Header Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: const BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        (profile?.name ?? 'D').substring(0, 1).toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            profile?.name ?? 'Donor User',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            profile?.email ?? 'donor@donate.ai',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: isDark ? AppColors.darkMutedText : AppColors.lightMutedText,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'Verified Donor Account',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Profile Edit Form
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Contact & Location', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        labelText: 'Full Name',
                        prefixIcon: Icon(Icons.person_outline),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _phoneController,
                      decoration: const InputDecoration(
                        labelText: 'Phone Number',
                        prefixIcon: Icon(Icons.phone_outlined),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _cityController,
                      decoration: const InputDecoration(
                        labelText: 'City',
                        prefixIcon: Icon(Icons.location_city_outlined),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _addressController,
                      maxLines: 2,
                      decoration: const InputDecoration(
                        labelText: 'Pickup Address',
                        prefixIcon: Icon(Icons.home_outlined),
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isSaving ? null : _handleSave,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        child: Text(_isSaving ? 'Saving Changes...' : 'Save Profile Changes'),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Preferences Card (Dark Mode Toggle & Notifications)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('App Preferences', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),

                    // Dark Mode Toggle
                    SwitchListTile(
                      value: widget.isDarkMode,
                      onChanged: widget.onToggleTheme,
                      title: const Text('Dark Mode'),
                      subtitle: const Text('Toggle between sleek dark and light themes'),
                      secondary: Icon(
                        widget.isDarkMode ? Icons.dark_mode : Icons.light_mode,
                        color: widget.isDarkMode ? Colors.amber : AppColors.primary,
                      ),
                    ),

                    const Divider(),

                    SwitchListTile(
                      value: _emailNotifications,
                      onChanged: (val) => setState(() => _emailNotifications = val),
                      title: const Text('Email Notifications'),
                      subtitle: const Text('Receive pickup & match updates via email'),
                      secondary: const Icon(Icons.email_outlined),
                    ),

                    SwitchListTile(
                      value: _pushNotifications,
                      onChanged: (val) => setState(() => _pushNotifications = val),
                      title: const Text('Push Notifications'),
                      subtitle: const Text('Instant mobile alerts for status changes'),
                      secondary: const Icon(Icons.notifications_active_outlined),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Account Actions
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Session Actions', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: widget.onLogout,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.error,
                          side: const BorderSide(color: AppColors.error),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        icon: const Icon(Icons.logout),
                        label: Text(widget.logoutLabel),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

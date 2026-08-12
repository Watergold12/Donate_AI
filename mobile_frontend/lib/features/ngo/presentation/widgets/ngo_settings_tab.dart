import 'package:flutter/material.dart';
import 'package:mobile_frontend/core/network/token_store.dart';
import 'package:mobile_frontend/app/app.dart';
import 'package:mobile_frontend/core/theme/app_colors.dart';
import 'package:mobile_frontend/features/ngo/data/models/ngo_models.dart';
import 'package:mobile_frontend/features/ngo/data/services/ngo_service.dart';

class NGOSettingsTab extends StatefulWidget {
  final Future<StoredSession?> sessionFuture;
  final VoidCallback? onLogout;
  final String logoutLabel;
  final NGOService ngoService;

  const NGOSettingsTab({
    super.key,
    required this.sessionFuture,
    required this.onLogout,
    required this.logoutLabel,
    required this.ngoService,
  });

  @override
  State<NGOSettingsTab> createState() => _NGOSettingsTabState();
}

class _NGOSettingsTabState extends State<NGOSettingsTab> {
  final _formKey = GlobalKey<FormState>();
  
  bool _isLoading = true;
  bool _isSaving = false;
  NGOProfile? _profile;

  // Form Controllers
  final _phoneController = TextEditingController();
  final _websiteController = TextEditingController();
  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _pincodeController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _serviceAreasController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _websiteController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _pincodeController.dispose();
    _descriptionController.dispose();
    _serviceAreasController.dispose();
    super.dispose();
  }

  Future<void> _loadProfile() async {
    setState(() => _isLoading = true);
    try {
      final profile = await widget.ngoService.getProfile();
      if (profile != null) {
        _profile = profile;
        _phoneController.text = profile.contactPhone ?? '';
        _websiteController.text = profile.website ?? '';
        _addressController.text = profile.address ?? '';
        _cityController.text = profile.city ?? '';
        _stateController.text = profile.state ?? '';
        _pincodeController.text = profile.pincode ?? '';
        _descriptionController.text = profile.description ?? '';
        _serviceAreasController.text = (profile.serviceAreas ?? []).join(', ');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load profile: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    final serviceAreasList = _serviceAreasController.text
        .split(',')
        .map((e) => e.trim())
        .where((e) => e.isNotEmpty)
        .toList();

    final payload = {
      'contact_phone': _phoneController.text.trim(),
      'website': _websiteController.text.trim(),
      'address': _addressController.text.trim(),
      'city': _cityController.text.trim(),
      'state': _stateController.text.trim(),
      'pincode': _pincodeController.text.trim(),
      'description': _descriptionController.text.trim(),
      'service_areas': serviceAreasList,
    };

    // Remove empty values to avoid sending empty strings if not required
    payload.removeWhere((key, value) => value == '' || (value is List && value.isEmpty));

    try {
      final updatedProfile = await widget.ngoService.updateProfile(payload);
      if (mounted) {
        setState(() {
          _profile = updatedProfile;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile updated successfully!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update profile: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    final theme = Theme.of(context);

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(
          'Settings',
          style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 6),
        Text(
          'Manage your organization profile and application preferences.',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.brightness == Brightness.dark ? AppColors.darkMutedText : AppColors.lightMutedText,
          ),
        ),
        const SizedBox(height: 24),
        
        // Profile Editing Section
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Organization Profile', style: theme.textTheme.titleLarge),
                  const SizedBox(height: 16),
                  
                  // Read-only fields
                  Text('Organization Name: ${_profile?.orgName ?? ''}', style: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text('Registration No: ${_profile?.registrationNumber ?? ''}', style: theme.textTheme.bodyMedium),
                  const Divider(height: 32),
                  
                  TextFormField(
                    controller: _phoneController,
                    decoration: const InputDecoration(labelText: 'Contact Phone', border: OutlineInputBorder()),
                    keyboardType: TextInputType.phone,
                  ),
                  const SizedBox(height: 16),
                  
                  TextFormField(
                    controller: _websiteController,
                    decoration: const InputDecoration(labelText: 'Website', border: OutlineInputBorder()),
                    keyboardType: TextInputType.url,
                  ),
                  const SizedBox(height: 16),
                  
                  TextFormField(
                    controller: _descriptionController,
                    decoration: const InputDecoration(labelText: 'Description', border: OutlineInputBorder()),
                    maxLines: 3,
                  ),
                  const SizedBox(height: 16),
                  
                  TextFormField(
                    controller: _addressController,
                    decoration: const InputDecoration(labelText: 'Street Address', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 16),
                  
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _cityController,
                          decoration: const InputDecoration(labelText: 'City', border: OutlineInputBorder()),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          controller: _stateController,
                          decoration: const InputDecoration(labelText: 'State', border: OutlineInputBorder()),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  TextFormField(
                    controller: _pincodeController,
                    decoration: const InputDecoration(labelText: 'Pincode', border: OutlineInputBorder()),
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 16),
                  
                  TextFormField(
                    controller: _serviceAreasController,
                    decoration: const InputDecoration(
                      labelText: 'Service Areas (Cities)', 
                      hintText: 'Comma separated e.g. Delhi, Gurgaon, Noida',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: FilledButton(
                      onPressed: _isSaving ? null : _saveProfile,
                      child: _isSaving 
                          ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('Save Changes'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        
        const SizedBox(height: 24),
        
        // Session Section
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('App Preferences', style: theme.textTheme.titleLarge),
                const SizedBox(height: 12),
                SwitchListTile(
                  title: const Text('Dark Mode'),
                  contentPadding: EdgeInsets.zero,
                  value: DonateAiApp.of(context)?.themeMode == ThemeMode.dark ||
                         (DonateAiApp.of(context)?.themeMode == ThemeMode.system && theme.brightness == Brightness.dark),
                  onChanged: (bool value) {
                    DonateAiApp.of(context)?.toggleTheme(value);
                  },
                ),
                const Divider(height: 32),
                Text('Session', style: theme.textTheme.titleLarge),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: OutlinedButton.icon(
                    onPressed: widget.onLogout,
                    icon: const Icon(Icons.logout),
                    label: Text(widget.logoutLabel),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 40),
      ],
    );
  }
}



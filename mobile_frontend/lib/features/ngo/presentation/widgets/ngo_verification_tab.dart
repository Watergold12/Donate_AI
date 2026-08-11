import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/config/api_config.dart';
import '../../../../core/network/api_exception.dart';
import '../../data/models/ngo_models.dart';
import '../../data/services/ngo_service.dart';

class NGOVerificationTab extends StatefulWidget {
  final NGOService ngoService;

  const NGOVerificationTab({
    super.key,
    required this.ngoService,
  });

  @override
  State<NGOVerificationTab> createState() => _NGOVerificationTabState();
}

class _NGOVerificationTabState extends State<NGOVerificationTab> {
  NGOProfile? _profile;
  bool _isLoading = true;
  bool _isUploading = false;
  PlatformFile? _selectedFile;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() => _isLoading = true);
    try {
      final profile = await widget.ngoService.getProfile();
      if (mounted) {
        setState(() {
          _profile = profile;
        });
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to load verification details')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _pickFile() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx'],
      );

      if (result != null && result.files.isNotEmpty) {
        setState(() {
          _selectedFile = result.files.first;
        });
      }
    } catch (_) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to pick a file')),
      );
    }
  }

  Future<void> _submitVerification() async {
    if (_selectedFile == null || _selectedFile!.path == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a document file to upload')),
      );
      return;
    }

    setState(() => _isUploading = true);
    try {
      final updatedProfile = await widget.ngoService.uploadVerificationDocs(_selectedFile!.path!);
      if (mounted) {
        setState(() {
          _profile = updatedProfile;
          _selectedFile = null;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Verification documents submitted successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.message),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to upload verification documents.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  String _formatDate(DateTime? date) {
    if (date == null) return '';
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    final status = _profile?.verificationStatus ?? 'unsubmitted';
    final isVerified = _profile?.isVerified ?? false;
    final orgName = _profile?.orgName ?? 'Unknown NGO';

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // Page Header
        Text(
          'NGO Document Verification',
          style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 6),
        Text(
          'Submit official registration documents to verify your organisation and unlock full platform capabilities.',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: isDark ? AppColors.darkMutedText : AppColors.lightMutedText,
          ),
        ),
        const SizedBox(height: 24),

        // Status Card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top section: Status and Org Name
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'VERIFICATION STATUS',
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: AppColors.primary,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.2,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            orgName,
                            style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 8),
                          _buildStatusBadge(isVerified, status),
                          const SizedBox(height: 8),
                          Text(
                            'Registration #: ${_profile?.registrationNumber ?? 'N/A'}',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: isDark ? AppColors.darkMutedText : AppColors.lightMutedText,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (_profile?.verificationSubmittedAt != null)
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            'Submitted On',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: isDark ? AppColors.darkMutedText : AppColors.lightMutedText,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _formatDate(_profile!.verificationSubmittedAt),
                            style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                  ],
                ),
                
                const SizedBox(height: 20),
                const Divider(),
                const SizedBox(height: 16),
                
                // Alert Message Box
                _buildAlertBox(isVerified, status, _profile?.rejectionReason),

                // Uploaded Document Banner
                if (_profile?.verificationDocPath != null && _profile!.verificationDocPath!.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  Text(
                    'UPLOADED DOCUMENT',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.darkSurface.withValues(alpha: 0.5) : Colors.grey.shade50,
                      border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.attach_file, color: AppColors.primary),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Verification Document', style: TextStyle(fontWeight: FontWeight.w600)),
                              Text(
                                _profile!.verificationDocPath!,
                                style: TextStyle(fontSize: 12, color: isDark ? AppColors.darkMutedText : AppColors.lightMutedText),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        TextButton.icon(
                          onPressed: () async {
                            final url = Uri.parse('${ApiConfig.baseUrl}${_profile!.verificationDocPath}');
                            if (await canLaunchUrl(url)) {
                              await launchUrl(url);
                            }
                          },
                          icon: const Icon(Icons.open_in_new, size: 16),
                          label: const Text('View'),
                          style: TextButton.styleFrom(
                            foregroundColor: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ]
              ],
            ),
          ),
        ),

        const SizedBox(height: 24),

        // Upload Form
        if (!isVerified)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    status == 'pending' ? 'Update / Re-upload Document' : 'Upload Verification File',
                    style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Supported file formats: PDF, PNG, JPG, DOC, DOCX (Max size: 10 MB).',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: isDark ? AppColors.darkMutedText : AppColors.lightMutedText,
                    ),
                  ),
                  const SizedBox(height: 20),
                  
                  // File Picker Dropzone
                  InkWell(
                    onTap: _pickFile,
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: _selectedFile != null ? AppColors.success : AppColors.primary.withValues(alpha: 0.4),
                          width: 2,
                          style: BorderStyle.solid,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        color: _selectedFile != null 
                            ? AppColors.success.withValues(alpha: 0.05) 
                            : AppColors.primary.withValues(alpha: 0.05),
                      ),
                      child: Column(
                        children: [
                          Icon(
                            _selectedFile != null ? Icons.file_present : Icons.cloud_upload_outlined,
                            size: 48,
                            color: _selectedFile != null ? AppColors.success : AppColors.primary,
                          ),
                          const SizedBox(height: 12),
                          if (_selectedFile != null) ...[
                            Text(
                              _selectedFile!.name,
                              style: const TextStyle(fontWeight: FontWeight.bold),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${(_selectedFile!.size / (1024 * 1024)).toStringAsFixed(2)} MB — Ready to submit',
                              style: const TextStyle(color: AppColors.success, fontSize: 12),
                            ),
                          ] else
                            const Text(
                              'Tap to select a document file',
                              style: TextStyle(fontWeight: FontWeight.w500),
                            ),
                        ],
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isUploading ? null : _submitVerification,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                      ),
                      child: _isUploading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : Text(status == 'pending' ? 'Re-submit Document' : 'Submit for Verification'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Verification badges reassure donors that their contributions reach genuine causes.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 11, color: Colors.grey),
                  ),
                ],
              ),
            ),
          )
      ],
    );
  }

  Widget _buildStatusBadge(bool isVerified, String status) {
    Color bgColor;
    Color textColor;
    String text;

    if (isVerified) {
      bgColor = AppColors.success.withValues(alpha: 0.1);
      textColor = AppColors.success;
      text = 'Verified NGO';
    } else if (status == 'pending') {
      bgColor = Colors.orange.withValues(alpha: 0.1);
      textColor = Colors.orange;
      text = 'Under Review';
    } else if (status == 'rejected') {
      bgColor = AppColors.error.withValues(alpha: 0.1);
      textColor = AppColors.error;
      text = 'Action Required (Rejected)';
    } else {
      bgColor = Colors.blue.withValues(alpha: 0.1);
      textColor = Colors.blue;
      text = 'Unsubmitted';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: textColor.withValues(alpha: 0.3)),
      ),
      child: Text(
        text,
        style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 12),
      ),
    );
  }

  Widget _buildAlertBox(bool isVerified, String status, String? rejectionReason) {
    Color borderColor;
    Color bgColor;
    Color iconColor;
    IconData icon;
    String title;
    String message;

    if (isVerified) {
      borderColor = AppColors.success.withValues(alpha: 0.3);
      bgColor = AppColors.success.withValues(alpha: 0.1);
      iconColor = AppColors.success;
      icon = Icons.check_circle;
      title = 'Verification Complete';
      message = 'Your organisation has been fully verified by an administrator. You have unrestricted access to create demands, accept matched donations, and schedule pickups.';
    } else if (status == 'pending') {
      borderColor = Colors.orange.withValues(alpha: 0.3);
      bgColor = Colors.orange.withValues(alpha: 0.1);
      iconColor = Colors.orange;
      icon = Icons.hourglass_empty;
      title = 'Documents Under Review';
      message = 'An admin is currently reviewing your uploaded verification documents. Once approved, demand creation and matching features will automatically activate.';
    } else if (status == 'rejected') {
      borderColor = AppColors.error.withValues(alpha: 0.3);
      bgColor = AppColors.error.withValues(alpha: 0.1);
      iconColor = AppColors.error;
      icon = Icons.cancel;
      title = 'Application Requires Re-submission';
      message = 'Admin Reason: ${rejectionReason ?? 'Please upload updated registration documentation.'}\n\nPlease review the reason above and upload valid official documents below.';
    } else {
      borderColor = Colors.blue.withValues(alpha: 0.3);
      bgColor = Colors.blue.withValues(alpha: 0.1);
      iconColor = Colors.blue;
      icon = Icons.description;
      title = 'Upload Required Documents';
      message = 'Please upload your official NGO registration certificate or 80G/12A tax exemption proof to begin the verification process.';
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bgColor,
        border: Border.all(color: borderColor),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: iconColor),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: iconColor,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  message,
                  style: TextStyle(
                    fontSize: 12,
                    color: iconColor.withValues(alpha: 0.8),
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

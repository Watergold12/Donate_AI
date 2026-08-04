import 'package:flutter/material.dart';

import '../../../../core/network/api_exception.dart';
import '../../../../core/network/token_store.dart';
import '../../../auth/data/auth_service.dart';
import '../../../auth/data/models/auth_models.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key, this.authService});

  final AuthService? authService;

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  late final AuthService _authService;
  late Future<StoredSession?> _sessionFuture;

  final _loginFormKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _authService = widget.authService ?? AuthService();
    _sessionFuture = _authService.currentSession();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    if (widget.authService == null) {
      _authService.close();
    }
    super.dispose();
  }

  Future<void> _refreshSession() async {
    setState(() {
      _sessionFuture = _authService.currentSession();
    });
  }

  Future<void> _handleLogin() async {
    if (!(_loginFormKey.currentState?.validate() ?? false)) {
      return;
    }

    setState(() => _busy = true);
    try {
      final session = await _authService.login(
        LoginRequest(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        ),
      );
      await _refreshSession();
      if (!mounted) return;

      if (session.role == 'donor') {
        Navigator.of(context).pushNamedAndRemoveUntil('/donor', (route) => false);
        return;
      }

      if (session.role == 'ngo') {
        Navigator.of(context).pushNamedAndRemoveUntil('/ngo', (route) => false);
        return;
      }

      await _authService.logout();
      await _refreshSession();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Admin accounts use the separate admin app.'),
        ),
      );
    } on ApiException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.message)),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Login failed: $error')),
      );
    } finally {
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }

  Future<void> _handleLogout() async {
    setState(() => _busy = true);
    try {
      await _authService.logout();
      await _refreshSession();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Logged out and session cleared.')),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Logout failed: $error')),
      );
    } finally {
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Donate AI'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Sign in', style: theme.textTheme.headlineMedium),
                    const SizedBox(height: 8),
                    Text(
                      'Use your account to open the correct donor or NGO workspace.',
                      style: theme.textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 20),
                    FutureBuilder<StoredSession?>(
                      future: _sessionFuture,
                      builder: (context, snapshot) {
                        final session = snapshot.data;
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Current Session', style: theme.textTheme.titleLarge),
                            const SizedBox(height: 8),
                            if (snapshot.connectionState == ConnectionState.waiting)
                              const Text('Checking saved session...')
                            else if (session == null)
                              const Text('No saved session found. Sign in to continue.')
                            else ...[
                              Text('Role: ${session.role}', style: theme.textTheme.bodyMedium),
                              const SizedBox(height: 4),
                              Text(
                                'Access token: ${_shorten(session.accessToken)}',
                                style: theme.textTheme.bodyMedium,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Refresh token: ${_shorten(session.refreshToken)}',
                                style: theme.textTheme.bodyMedium,
                              ),
                              const SizedBox(height: 12),
                              Align(
                                alignment: Alignment.centerRight,
                                child: OutlinedButton(
                                  onPressed: _busy ? null : _handleLogout,
                                  child: const Text('Logout'),
                                ),
                              ),
                            ],
                          ],
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Form(
                  key: _loginFormKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Login', style: theme.textTheme.titleLarge),
                      const SizedBox(height: 20),
                      TextFormField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(labelText: 'Email address'),
                        validator: (value) {
                          final text = value?.trim() ?? '';
                          if (text.isEmpty) {
                            return 'Email is required';
                          }
                          if (!text.contains('@')) {
                            return 'Enter a valid email';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _passwordController,
                        obscureText: true,
                        decoration: const InputDecoration(labelText: 'Password'),
                        validator: (value) {
                          if ((value ?? '').isEmpty) {
                            return 'Password is required';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: _busy ? null : _handleLogin,
                          child: Text(_busy ? 'Signing in...' : 'Sign in'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _shorten(String value) {
    if (value.length <= 12) {
      return value;
    }
    return '${value.substring(0, 6)}...${value.substring(value.length - 4)}';
  }
}

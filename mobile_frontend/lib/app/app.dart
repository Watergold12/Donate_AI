import 'package:flutter/material.dart';

import '../core/network/token_store.dart';
import '../core/theme/app_theme.dart';
import '../features/auth/presentation/screens/auth_screen.dart';
import '../features/donor/presentation/screens/donor_dashboard_screen.dart';
import '../features/home/presentation/screens/mobile_home_screen.dart';
import '../features/ngo/presentation/screens/ngo_dashboard_screen.dart';

class DonateAiApp extends StatefulWidget {
  const DonateAiApp({super.key});

  static DonateAiAppState? of(BuildContext context) =>
      context.findAncestorStateOfType<DonateAiAppState>();

  @override
  State<DonateAiApp> createState() => DonateAiAppState();
}

class DonateAiAppState extends State<DonateAiApp> {
  ThemeMode _themeMode = ThemeMode.system;

  ThemeMode get themeMode => _themeMode;

  void toggleTheme(bool isDark) {
    setState(() {
      _themeMode = isDark ? ThemeMode.dark : ThemeMode.light;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Donate AI',
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: _themeMode,
      home: const _StartupGate(),
      routes: {
        '/auth': (_) => const AuthScreen(),
        '/donor': (_) => const DonorDashboardScreen(),
        '/ngo': (_) => const NGODashboardScreen(),
      },
    );
  }
}

class _StartupGate extends StatelessWidget {
  const _StartupGate();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<StoredSession?>(
      future: TokenStore().read(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        final session = snapshot.data;
        if (session != null) {
          if (session.role == 'donor') {
            return const DonorDashboardScreen();
          }
          if (session.role == 'ngo') {
            return const NGODashboardScreen();
          }
        }

        return const SplashScreen();
      },
    );
  }
}

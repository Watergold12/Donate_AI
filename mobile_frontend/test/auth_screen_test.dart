import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile_frontend/features/auth/presentation/screens/auth_screen.dart';

void main() {
  testWidgets('Auth screen renders login-only flow', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: AuthScreen(),
      ),
    );

    expect(find.text('Donate AI'), findsOneWidget);
    expect(find.text('Login'), findsOneWidget);
    expect(find.text('Sign in'), findsNWidgets(2));
    expect(find.text('Current Session'), findsOneWidget);
    expect(find.text('Register'), findsNothing);
  });
}

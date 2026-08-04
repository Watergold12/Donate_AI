import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile_frontend/app/app.dart';
import 'package:mobile_frontend/core/network/token_store.dart';

void main() {
  testWidgets('Donate AI splash renders when no session exists', (WidgetTester tester) async {
    await TokenStore().clear();
    await tester.pumpWidget(const DonateAiApp());
    await tester.pumpAndSettle();

    expect(find.byType(DonateAiApp), findsOneWidget);
    expect(find.byType(MaterialApp), findsOneWidget);
    expect(find.text('Donate AI'), findsWidgets);
    expect(find.text('Sign in'), findsWidgets);
  });
}

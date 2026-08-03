// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile_frontend/app/app.dart';
import 'package:mobile_frontend/core/network/token_store.dart';

void main() {
  testWidgets('DonateAI mobile shell renders', (WidgetTester tester) async {
    await TokenStore().clear();
    await tester.pumpWidget(const DonateAiApp());
    await tester.pump();

    expect(find.byType(DonateAiApp), findsOneWidget);
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}

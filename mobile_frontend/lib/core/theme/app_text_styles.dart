import 'package:flutter/material.dart';

import 'app_colors.dart';

class AppTextStyles {
  const AppTextStyles._();

  static TextTheme light = const TextTheme(
    displayLarge: TextStyle(fontSize: 40, fontWeight: FontWeight.w700, color: AppColors.lightText),
    displayMedium: TextStyle(fontSize: 32, fontWeight: FontWeight.w700, color: AppColors.lightText),
    headlineMedium: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.lightText),
    titleLarge: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: AppColors.lightText),
    titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.lightText),
    bodyLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w400, color: AppColors.lightText),
    bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w400, color: AppColors.lightMutedText),
    labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.lightText),
  );

  static TextTheme dark = const TextTheme(
    displayLarge: TextStyle(fontSize: 40, fontWeight: FontWeight.w700, color: AppColors.darkText),
    displayMedium: TextStyle(fontSize: 32, fontWeight: FontWeight.w700, color: AppColors.darkText),
    headlineMedium: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.darkText),
    titleLarge: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: AppColors.darkText),
    titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.darkText),
    bodyLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w400, color: AppColors.darkText),
    bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w400, color: AppColors.darkMutedText),
    labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.darkText),
  );
}


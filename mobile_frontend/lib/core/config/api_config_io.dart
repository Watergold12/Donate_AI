import 'dart:io';

class ApiConfig {
  const ApiConfig._();

  static const String _overrideBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '',
  );

  static Duration requestTimeout = const Duration(seconds: 12);

  static String get baseUrl {
    if (_overrideBaseUrl.isNotEmpty) return _overrideBaseUrl;

    // Development phase codeblock:
    if (Platform.isAndroid) {
      
      return 'http://localhost:8000'; // <- Uncomment for physical Android device
      // return 'http://10.0.2.2:8000';     // <- Default for Android Emulator
    }
    
    // iOS Simulators and Desktop apps
    return 'http://localhost:8000';
  }

  static Uri uri(String path, {Map<String, String>? queryParameters}) {
    final normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    return Uri.parse(baseUrl).resolve(normalizedPath).replace(
          queryParameters: queryParameters,
        );
  }
}


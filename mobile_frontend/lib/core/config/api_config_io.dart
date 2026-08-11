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
      // 10.0.2.2 is the alias to your machine's localhost for the Android Emulator.
      // 
      // IMPORTANT FOR PHYSICAL DEVICES: 
      // If you are testing on a physical Android device connected via USB, 
      // 10.0.2.2 will not work. You should run `adb reverse tcp:8000 tcp:8000` 
      // in your terminal and uncomment the 'localhost' line below:
      
      // return 'http://localhost:8000'; // <- Uncomment for physical Android device
      return 'http://10.0.2.2:8000';     // <- Default for Android Emulator
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


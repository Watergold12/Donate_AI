class ApiConfig {
  const ApiConfig._();

  static const String _overrideBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '',
  );

  static Duration requestTimeout = const Duration(seconds: 12);

  static String get baseUrl {
    if (_overrideBaseUrl.isNotEmpty) {
      return _overrideBaseUrl;
    }

    return 'http://localhost:8000';
  }

  static Uri uri(String path, {Map<String, String>? queryParameters}) {
    final normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    return Uri.parse(baseUrl).resolve(normalizedPath).replace(
          queryParameters: queryParameters,
        );
  }
}


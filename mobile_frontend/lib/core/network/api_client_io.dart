import 'dart:convert';
import 'dart:async';
import 'dart:io';

import '../config/api_config.dart';
import 'api_exception.dart';
import 'api_response.dart';
import 'token_store.dart';

class ApiClient {
  ApiClient({
    HttpClient? httpClient,
    TokenStore? tokenStore,
  })  : _httpClient = httpClient ?? HttpClient(),
        _tokenStore = tokenStore ?? TokenStore();

  final HttpClient _httpClient;
  final TokenStore _tokenStore;

  Future<ApiEnvelope<T>> get<T>(
    String path, {
    Map<String, String>? queryParameters,
    bool authorized = true,
    T Function(Object? json)? fromJson,
  }) {
    return _request<T>(
      'GET',
      path,
      queryParameters: queryParameters,
      authorized: authorized,
      fromJson: fromJson,
    );
  }

  Future<ApiEnvelope<T>> post<T>(
    String path, {
    Object? body,
    Map<String, String>? queryParameters,
    bool authorized = true,
    T Function(Object? json)? fromJson,
  }) {
    return _request<T>(
      'POST',
      path,
      body: body,
      queryParameters: queryParameters,
      authorized: authorized,
      fromJson: fromJson,
    );
  }

  Future<ApiEnvelope<T>> put<T>(
    String path, {
    Object? body,
    Map<String, String>? queryParameters,
    bool authorized = true,
    T Function(Object? json)? fromJson,
  }) {
    return _request<T>(
      'PUT',
      path,
      body: body,
      queryParameters: queryParameters,
      authorized: authorized,
      fromJson: fromJson,
    );
  }

  Future<ApiEnvelope<T>> patch<T>(
    String path, {
    Object? body,
    Map<String, String>? queryParameters,
    bool authorized = true,
    T Function(Object? json)? fromJson,
  }) {
    return _request<T>(
      'PATCH',
      path,
      body: body,
      queryParameters: queryParameters,
      authorized: authorized,
      fromJson: fromJson,
    );
  }

  Future<ApiEnvelope<T>> delete<T>(
    String path, {
    Object? body,
    Map<String, String>? queryParameters,
    bool authorized = true,
    T Function(Object? json)? fromJson,
  }) {
    return _request<T>(
      'DELETE',
      path,
      body: body,
      queryParameters: queryParameters,
      authorized: authorized,
      fromJson: fromJson,
    );
  }

  Future<ApiEnvelope<T>> _request<T>(
    String method,
    String path, {
    Object? body,
    Map<String, String>? queryParameters,
    bool authorized = true,
    T Function(Object? json)? fromJson,
  }) async {
    try {
      final uri = ApiConfig.uri(path, queryParameters: queryParameters);
      final request = await _httpClient.openUrl(method, uri);
      request.headers.set(HttpHeaders.acceptHeader, 'application/json');
      if (body != null) {
        request.headers.set(HttpHeaders.contentTypeHeader, 'application/json');
      }

      if (authorized) {
        final token = await _tokenStore.readAccessToken();
        if (token != null && token.isNotEmpty) {
          request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');
        }
      }

      if (body != null) {
        request.add(utf8.encode(jsonEncode(body)));
      }

      final response = await request.close().timeout(ApiConfig.requestTimeout);
      final responseBody = await utf8.decoder.bind(response).join();

      return _parseResponse<T>(response.statusCode, responseBody, fromJson);
    } on TimeoutException {
      throw ApiException('Network request timed out. Please try again.');
    }
  }

  ApiEnvelope<T> _parseResponse<T>(
    int statusCode,
    String responseBody,
    T Function(Object? json)? fromJson,
  ) {
    if (statusCode < 200 || statusCode >= 300) {
      throw ApiException(
        _extractMessage(responseBody) ?? 'Request failed',
        statusCode: statusCode,
        details: responseBody,
      );
    }

    if (responseBody.trim().isEmpty) {
      return ApiEnvelope<T>(success: true, message: 'OK');
    }

    final decoded = jsonDecode(responseBody);
    if (decoded is Map<String, dynamic>) {
      return ApiEnvelope<T>.fromJson(decoded, (json) {
        if (fromJson == null) {
          return json as T;
        }
        return fromJson(json);
      });
    }

    if (fromJson == null) {
      return ApiEnvelope<T>(success: true, message: 'OK', data: decoded as T);
    }

    return ApiEnvelope<T>(success: true, message: 'OK', data: fromJson(decoded));
  }

  String? _extractMessage(String rawBody) {
    if (rawBody.trim().isEmpty) {
      return null;
    }

    try {
      final decoded = jsonDecode(rawBody);
      if (decoded is Map<String, dynamic>) {
        final message = decoded['message'];
        if (message != null) {
          return message.toString();
        }
      }
    } catch (_) {
      return rawBody;
    }
    return rawBody;
  }

  Future<BackendHealth> checkHealth() async {
    final response = await get<Map<String, dynamic>>(
      '/health',
      authorized: false,
      fromJson: (json) => Map<String, dynamic>.from(json as Map),
    );
    return BackendHealth.fromJson(response.data ?? const {});
  }

  Future<void> saveSession(StoredSession session) => _tokenStore.save(session);

  Future<void> clearSession() => _tokenStore.clear();

  Future<StoredSession?> readSession() => _tokenStore.read();

  Future<String?> readAccessToken() => _tokenStore.readAccessToken();

  void close() {
    _httpClient.close(force: true);
  }
}

class BackendHealth {
  const BackendHealth({
    required this.status,
    required this.version,
    required this.environment,
  });

  final String status;
  final String version;
  final String environment;

  factory BackendHealth.fromJson(Map<String, dynamic> json) {
    return BackendHealth(
      status: json['status']?.toString() ?? 'unknown',
      version: json['version']?.toString() ?? 'unknown',
      environment: json['environment']?.toString() ?? 'unknown',
    );
  }
}

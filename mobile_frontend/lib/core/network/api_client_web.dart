// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:convert';
import 'dart:async';
import 'dart:html' as html;

import '../config/api_config.dart';
import 'api_exception.dart';
import 'api_response.dart';
import 'token_store.dart';

class ApiClient {
  ApiClient({
    TokenStore? tokenStore,
  }) : _tokenStore = tokenStore ?? TokenStore();

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
      final headers = <String, String>{
        'Accept': 'application/json',
      };
      if (body != null) {
        headers['Content-Type'] = 'application/json';
      }

      if (authorized) {
        final token = await _tokenStore.readAccessToken();
        if (token != null && token.isNotEmpty) {
          headers['Authorization'] = 'Bearer $token';
        }
      }

      final response = await html.HttpRequest.request(
        uri.toString(),
        method: method,
        requestHeaders: headers,
        sendData: body == null ? null : jsonEncode(body),
      ).timeout(ApiConfig.requestTimeout);

      final statusCode = response.status ?? 200;
      final responseText = response.responseText ?? '';
      return _parseResponse<T>(statusCode, responseText, fromJson);
    } on html.ProgressEvent catch (error) {
      throw ApiException(
        'Network request failed. Check that the backend is running and CORS allows this web origin.',
        details: error,
      );
    } on html.DomException catch (error) {
      throw ApiException(
        'Network request failed. Check that the backend is running and CORS allows this web origin.',
        details: error,
      );
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

  void close() {}
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

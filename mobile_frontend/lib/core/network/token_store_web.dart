// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:convert';
import 'dart:html' as html;

class StoredSession {
  const StoredSession({
    required this.accessToken,
    required this.refreshToken,
    required this.tokenType,
    required this.role,
  });

  final String accessToken;
  final String refreshToken;
  final String tokenType;
  final String role;

  Map<String, dynamic> toJson() => {
        'access_token': accessToken,
        'refresh_token': refreshToken,
        'token_type': tokenType,
        'role': role,
      };

  factory StoredSession.fromJson(Map<String, dynamic> json) {
    return StoredSession(
      accessToken: json['access_token']?.toString() ?? '',
      refreshToken: json['refresh_token']?.toString() ?? '',
      tokenType: json['token_type']?.toString() ?? 'bearer',
      role: json['role']?.toString() ?? '',
    );
  }
}

class TokenStore {
  static const String _key = 'donateai_session';

  Future<void> save(StoredSession session) async {
    html.window.localStorage[_key] = jsonEncode(session.toJson());
  }

  Future<StoredSession?> read() async {
    final raw = html.window.localStorage[_key];
    if (raw == null || raw.trim().isEmpty) {
      return null;
    }

    final decoded = jsonDecode(raw);
    if (decoded is Map<String, dynamic>) {
      return StoredSession.fromJson(decoded);
    }
    return null;
  }

  Future<String?> readAccessToken() async {
    final session = await read();
    return session?.accessToken;
  }

  Future<void> clear() async {
    html.window.localStorage.remove(_key);
  }
}


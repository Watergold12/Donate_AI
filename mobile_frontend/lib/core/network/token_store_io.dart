import 'dart:convert';
import 'dart:io';

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
  TokenStore({File? file}) : _file = file ?? _defaultFile();

  final File _file;

  static File _defaultFile() {
    final tempDir = Directory.systemTemp.path;
    return File('$tempDir${Platform.pathSeparator}donateai_session.json');
  }

  Future<void> save(StoredSession session) async {
    await _file.create(recursive: true);
    await _file.writeAsString(jsonEncode(session.toJson()));
  }

  Future<StoredSession?> read() async {
    if (!await _file.exists()) {
      return null;
    }

    final raw = await _file.readAsString();
    if (raw.trim().isEmpty) {
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
    if (await _file.exists()) {
      await _file.delete();
    }
  }
}


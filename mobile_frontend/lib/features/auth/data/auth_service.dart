import '../../../../core/network/api_client.dart';
import '../../../../core/network/token_store.dart';
import 'models/auth_models.dart';

class AuthService {
  AuthService({ApiClient? client}) : _client = client ?? ApiClient();

  final ApiClient _client;

  Future<StoredSession?> currentSession() => _client.readSession();

  Future<StoredSession> login(LoginRequest request) async {
    final response = await _client.post<Map<String, dynamic>>(
      '/api/v1/auth/login',
      authorized: false,
      body: request.toJson(),
      fromJson: (json) => Map<String, dynamic>.from(json as Map),
    );

    final payload = response.data ?? const <String, dynamic>{};
    final tokens = AuthTokenPair.fromJson(payload);
    final session = StoredSession(
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType,
      role: tokens.role,
    );
    await _client.saveSession(session);
    return session;
  }

  Future<AuthUser> register(RegisterRequest request) async {
    final response = await _client.post<Map<String, dynamic>>(
      '/api/v1/auth/register',
      authorized: false,
      body: request.toJson(),
      fromJson: (json) => Map<String, dynamic>.from(json as Map),
    );

    final payload = response.data ?? const <String, dynamic>{};
    return AuthUser.fromJson(payload);
  }

  Future<void> logout() async {
    final session = await _client.readSession();
    try {
      if (session != null && session.refreshToken.isNotEmpty) {
        await _client.post<dynamic>(
          '/api/v1/auth/logout',
          body: {'refresh_token': session.refreshToken},
          fromJson: (json) => json,
        );
      }
    } catch (_) {
      // Logout should always clear the local session even if the backend call fails.
    } finally {
      await _client.clearSession();
    }
  }

  void close() {
    _client.close();
  }
}

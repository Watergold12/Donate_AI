class LoginRequest {
  const LoginRequest({
    required this.email,
    required this.password,
  });

  final String email;
  final String password;

  Map<String, dynamic> toJson() => {
        'email': email,
        'password': password,
      };
}

class RegisterRequest {
  const RegisterRequest({
    required this.email,
    required this.password,
    required this.fullName,
    required this.role,
    this.orgName,
    this.registrationNumber,
  });

  final String email;
  final String password;
  final String fullName;
  final String role;
  final String? orgName;
  final String? registrationNumber;

  Map<String, dynamic> toJson() => {
        'email': email,
        'password': password,
        'full_name': fullName,
        'role': role,
        if (orgName != null) 'org_name': orgName,
        if (registrationNumber != null) 'registration_number': registrationNumber,
      };
}

class AuthTokenPair {
  const AuthTokenPair({
    required this.accessToken,
    required this.refreshToken,
    required this.tokenType,
    required this.role,
  });

  final String accessToken;
  final String refreshToken;
  final String tokenType;
  final String role;

  factory AuthTokenPair.fromJson(Map<String, dynamic> json) {
    return AuthTokenPair(
      accessToken: json['access_token']?.toString() ?? '',
      refreshToken: json['refresh_token']?.toString() ?? '',
      tokenType: json['token_type']?.toString() ?? 'bearer',
      role: json['role']?.toString() ?? '',
    );
  }
}

class AuthUser {
  const AuthUser({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    required this.isActive,
    required this.isVerified,
    this.createdAt,
  });

  final String id;
  final String email;
  final String fullName;
  final String role;
  final bool isActive;
  final bool isVerified;
  final String? createdAt;

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      fullName: json['full_name']?.toString() ?? '',
      role: json['role']?.toString() ?? '',
      isActive: json['is_active'] == true,
      isVerified: json['is_verified'] == true,
      createdAt: json['created_at']?.toString(),
    );
  }
}


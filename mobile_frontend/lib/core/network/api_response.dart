class ApiEnvelope<T> {
  const ApiEnvelope({
    required this.success,
    required this.message,
    this.data,
  });

  final bool success;
  final String message;
  final T? data;

  factory ApiEnvelope.fromJson(
    Map<String, dynamic> json,
    T Function(Object? json) fromJson,
  ) {
    return ApiEnvelope<T>(
      success: json['success'] == true,
      message: json['message']?.toString() ?? '',
      data: json.containsKey('data') && json['data'] != null
          ? fromJson(json['data'])
          : null,
    );
  }
}


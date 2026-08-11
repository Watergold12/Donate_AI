class ApiEnvelope<T> {
  const ApiEnvelope({
    required this.success,
    required this.message,
    this.data,
    this.pagination,
  });

  final bool success;
  final String message;
  final T? data;
  final Map<String, dynamic>? pagination;

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
      pagination: json['pagination'] as Map<String, dynamic>?,
    );
  }
}


import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

import 'package:mobile_frontend/core/config/api_config.dart';
import 'package:mobile_frontend/core/network/api_client.dart';
import 'package:mobile_frontend/core/network/token_store.dart';
import 'package:mobile_frontend/core/network/api_exception.dart';
import '../models/ngo_models.dart';

class NGOService {
  final ApiClient _client;

  NGOService({ApiClient? client}) : _client = client ?? ApiClient();

  Future<NGOProfile?> getProfile() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/api/v1/ngos/profile',
        fromJson: (json) => Map<String, dynamic>.from(json as Map),
      );
      final data = response.data?['data'];
      if (data != null) {
        return NGOProfile.fromJson(data as Map<String, dynamic>);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<NGOProfile> uploadVerificationDocs(String filePath) async {
    final uri = ApiConfig.uri('/api/v1/ngos/verification-documents');
    final request = http.MultipartRequest('POST', uri);

    final token = await TokenStore().read();
    if (token != null) {
      request.headers['Authorization'] = 'Bearer $token';
    }
    
    final ext = filePath.split('.').last.toLowerCase();
    String mimeType = 'application/octet-stream';
    if (ext == 'pdf') mimeType = 'application/pdf';
    else if (ext == 'png') mimeType = 'image/png';
    else if (ext == 'jpg' || ext == 'jpeg') mimeType = 'image/jpeg';
    else if (ext == 'doc') mimeType = 'application/msword';
    else if (ext == 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    final mediaType = MediaType.parse(mimeType);

    final file = await http.MultipartFile.fromPath(
      'file', 
      filePath,
      contentType: mediaType,
    );
    request.files.add(file);

    final streamedResponse = await request.send().timeout(const Duration(seconds: 60));
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final decoded = jsonDecode(response.body);
      if (decoded['success'] == true) {
         final data = decoded['data'];
         return NGOProfile.fromJson(data as Map<String, dynamic>);
      } else {
        throw ApiException(decoded['message'] ?? 'Failed to upload document');
      }
    } else {
      final decoded = jsonDecode(response.body);
      throw ApiException(decoded['detail'] ?? 'Failed to upload document. Status code: ${response.statusCode}');
    }
  }
}

import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/telemetry_model.dart';

class ApiService {
  // May chu tiep nhan bao cao Render
  static String baseUrl = 'https://qu-n-l-s1k1.onrender.com';

  /// Gui toa do GPS, trang thai pin, va mang ve may chu
  static Future<bool> sendTelemetry(StudentTelemetry data) async {
    try {
      final uri = Uri.parse('$baseUrl/api/devices/report');
      final response = await http
          .post(
            uri,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(data.toJson()),
          )
          .timeout(const Duration(seconds: 10));

      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      // In loi ra log va thu lai o lan sau
      return false;
    }
  }

  /// Gui tin hieu khan cap khi hoc sinh dong hoac go ung dung
  static Future<bool> sendUninstallBeacon({
    required String deviceUuid,
    required String studentName,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/api/devices/uninstall');
      final response = await http
          .post(
            uri,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'deviceUuid': deviceUuid,
              'studentName': studentName,
              'isUninstalled': true,
            }),
          )
          .timeout(const Duration(seconds: 5));

      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}

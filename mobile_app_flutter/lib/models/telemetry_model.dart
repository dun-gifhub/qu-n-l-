// Model du lieu bao cao tu dien thoai hoc sinh ve may chu Render
class StudentTelemetry {
  final String deviceUuid;
  final String deviceName;
  final String studentName;
  final String studentId;
  final String schoolName;
  final String grade;
  final String className;
  final String parentPhone;
  final String platform;
  final double? latitude;
  final double? longitude;
  final double? accuracy;
  final int batteryLevel;
  final bool charging;
  final String networkType; // 'WIFI', '4G', 'NONE'
  final String currentApp;
  final bool isUninstalled;
  final bool isNoNetwork;

  StudentTelemetry({
    required this.deviceUuid,
    required this.deviceName,
    required this.studentName,
    required this.studentId,
    required this.schoolName,
    required this.grade,
    required this.className,
    required this.parentPhone,
    required this.platform,
    this.latitude,
    this.longitude,
    this.accuracy,
    required this.batteryLevel,
    required this.charging,
    required this.networkType,
    required this.currentApp,
    this.isUninstalled = false,
    this.isNoNetwork = false,
  });

  Map<String, dynamic> toJson() {
    return {
      'deviceUuid': deviceUuid,
      'name': deviceName,
      'studentName': studentName,
      'studentId': studentId,
      'schoolName': schoolName,
      'grade': grade,
      'className': className,
      'parentPhone': parentPhone,
      'platform': platform,
      'latitude': latitude,
      'longitude': longitude,
      'accuracy': accuracy,
      'batteryLevel': batteryLevel,
      'charging': charging,
      'networkType': networkType,
      'currentApp': currentApp,
      'isUninstalled': isUninstalled,
      'isNoNetwork': isNoNetwork,
    };
  }
}

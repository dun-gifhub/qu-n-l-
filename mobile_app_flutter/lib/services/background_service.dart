import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:battery_plus/battery_plus.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../models/telemetry_model.dart';
import 'api_service.dart';
import 'location_service.dart';

/// Khoi tao background service chay ngam tren Android/iOS
Future<void> initializeBackgroundService() async {
  final service = FlutterBackgroundService();

  await service.configure(
    androidConfiguration: AndroidConfiguration(
      onStart: onStartBackgroundService,
      autoStart: true,
      isForegroundMode: true,
      notificationChannelId: 'student_monitor_channel',
      initialNotificationTitle: 'Hệ thống bảo vệ học sinh đang chạy',
      initialNotificationContent: 'Đang định vị và bảo vệ thiết bị liên tục',
      foregroundServiceNotificationId: 888,
    ),
    iosConfiguration: IosConfiguration(
      autoStart: true,
      onForeground: onStartBackgroundService,
      onBackground: onIosBackground,
    ),
  );
}

@pragma('vm:entry-point')
Future<bool> onIosBackground(ServiceInstance service) async {
  WidgetsFlutterBinding.ensureInitialized();
  DartPluginRegistrant.ensureInitialized();
  return true;
}

@pragma('vm:entry-point')
void onStartBackgroundService(ServiceInstance service) async {
  DartPluginRegistrant.ensureInitialized();

  final battery = Battery();
  final connectivity = Connectivity();

  // Chu ky gui du lieu: mac dinh 15 giay mot lan khi chay nen
  Timer.periodic(const Duration(seconds: 15), (timer) async {
    final prefs = await SharedPreferences.getInstance();
    final deviceUuid = prefs.getString('deviceUuid');
    final studentName = prefs.getString('studentName');
    final schoolName = prefs.getString('schoolName');
    final className = prefs.getString('className');
    final serverUrl = prefs.getString('serverUrl');

    if (serverUrl != null && serverUrl.isNotEmpty) {
      ApiService.baseUrl = serverUrl;
    }

    if (deviceUuid == null || studentName == null) return;

    // 1. Doc thong tin pin
    int batteryLevel = 100;
    bool isCharging = false;
    try {
      batteryLevel = await battery.batteryLevel;
      final state = await battery.batteryState;
      isCharging = state == BatteryState.charging || state == BatteryState.full;
    } catch (_) {}

    // 2. Doc trang thai ket noi mang (Wi-Fi, 4G, None)
    String networkType = 'WIFI';
    bool isNoNet = false;
    try {
      final connResult = await connectivity.checkConnectivity();
      if (connResult.contains(ConnectivityResult.none)) {
        networkType = 'NONE';
        isNoNet = true;
      } else if (connResult.contains(ConnectivityResult.mobile)) {
        networkType = '4G';
      } else if (connResult.contains(ConnectivityResult.wifi)) {
        networkType = 'WIFI';
      }
    } catch (_) {}

    // 3. Lay vi tri GPS
    final position = await LocationService.getCurrentPosition();

    // 4. Gui len Render
    final telemetry = StudentTelemetry(
      deviceUuid: deviceUuid,
      deviceName: prefs.getString('deviceName') ?? 'Điện thoại học sinh',
      studentName: studentName,
      studentId: prefs.getString('studentId') ?? '',
      schoolName: schoolName ?? 'THPT Chuyên Lê Hồng Phong',
      grade: prefs.getString('grade') ?? 'Khối 10',
      className: className ?? '10A1',
      parentPhone: prefs.getString('parentPhone') ?? '',
      platform: 'Android',
      latitude: position?.latitude,
      longitude: position?.longitude,
      accuracy: position?.accuracy,
      batteryLevel: batteryLevel,
      charging: isCharging,
      networkType: networkType,
      currentApp: 'Chạy ngầm liên tục',
      isNoNetwork: isNoNet,
    );

    await ApiService.sendTelemetry(telemetry);
  });
}

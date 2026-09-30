import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:battery_plus/battery_plus.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'models/telemetry_model.dart';
import 'services/api_service.dart';
import 'services/location_service.dart';
import 'services/background_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeBackgroundService();
  runApp(const StudentMonitorApp());
}

class StudentMonitorApp extends StatelessWidget {
  const StudentMonitorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Giám Sát Thiết Bị Học Sinh',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF4F46E5)),
        useMaterial3: true,
      ),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with WidgetsBindingObserver {
  final _studentNameController = TextEditingController(text: 'Nguyễn Minh Quân');
  final _schoolNameController = TextEditingController(text: 'THPT Chuyên Lê Hồng Phong');
  final _classNameController = TextEditingController(text: '10A1');
  final _parentPhoneController = TextEditingController(text: '0901234567');
  final _serverUrlController = TextEditingController(text: 'https://qu-n-l-s1k1.onrender.com');

  String _deviceUuid = '';
  bool _isTracking = true;
  String _statusText = 'Đang kết nối máy chủ Render...';
  int _sentCount = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadSettings();
    _startLiveTracking();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _timer?.cancel();
    _studentNameController.dispose();
    _schoolNameController.dispose();
    _classNameController.dispose();
    _parentPhoneController.dispose();
    _serverUrlController.dispose();
    super.dispose();
  }

  // Phat hien su kien dong ung dung / tat nguon / go cai dat
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.detached) {
      // Gui tin hieu khan cap ve Render truoc khi tien trinh bi kill
      ApiService.sendUninstallBeacon(
        deviceUuid: _deviceUuid,
        studentName: _studentNameController.text.trim(),
      );
    }
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _deviceUuid = prefs.getString('deviceUuid') ??
          'FLUTTER-${DateTime.now().millisecondsSinceEpoch.toRadixString(36).toUpperCase()}';
      _studentNameController.text = prefs.getString('studentName') ?? 'Nguyễn Minh Quân';
      _schoolNameController.text = prefs.getString('schoolName') ?? 'THPT Chuyên Lê Hồng Phong';
      _classNameController.text = prefs.getString('className') ?? '10A1';
      _parentPhoneController.text = prefs.getString('parentPhone') ?? '0901234567';
      _serverUrlController.text = prefs.getString('serverUrl') ?? ApiService.baseUrl;
    });

    prefs.setString('deviceUuid', _deviceUuid);
  }

  Future<void> _saveSettings() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('studentName', _studentNameController.text.trim());
    await prefs.setString('schoolName', _schoolNameController.text.trim());
    await prefs.setString('className', _classNameController.text.trim());
    await prefs.setString('parentPhone', _parentPhoneController.text.trim());
    await prefs.setString('serverUrl', _serverUrlController.text.trim());
    ApiService.baseUrl = _serverUrlController.text.trim();

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đã lưu cấu hình thiết bị thành công!')),
      );
    }
  }

  void _startLiveTracking() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 10), (timer) async {
      if (!_isTracking) return;

      final position = await LocationService.getCurrentPosition();
      final battery = Battery();
      int battLevel = 100;
      bool isCharging = false;
      try {
        battLevel = await battery.batteryLevel;
        final state = await battery.batteryState;
        isCharging = state == BatteryState.charging || state == BatteryState.full;
      } catch (_) {}

      final connectivity = Connectivity();
      String netType = 'WIFI';
      try {
        final result = await connectivity.checkConnectivity();
        if (result.contains(ConnectivityResult.none)) {
          netType = 'NONE';
        } else if (result.contains(ConnectivityResult.mobile)) {
          netType = '4G';
        }
      } catch (_) {}

      final data = StudentTelemetry(
        deviceUuid: _deviceUuid,
        deviceName: 'Flutter Mobile App',
        studentName: _studentNameController.text.trim(),
        studentId: 'HS-${_deviceUuid.substring(0, 4)}',
        schoolName: _schoolNameController.text.trim(),
        grade: 'Khối 10',
        className: _classNameController.text.trim(),
        parentPhone: _parentPhoneController.text.trim(),
        platform: 'Android',
        latitude: position?.latitude,
        longitude: position?.longitude,
        accuracy: position?.accuracy,
        batteryLevel: battLevel,
        charging: isCharging,
        networkType: netType,
        currentApp: 'Ứng dụng Học Sinh',
      );

      final ok = await ApiService.sendTelemetry(data);
      if (mounted) {
        setState(() {
          if (ok) {
            _sentCount++;
            _statusText =
                '🟢 Đang truyền dữ liệu thời gian thực lên Google Maps ($netType - Pin: $battLevel%)';
          } else {
            _statusText = '⚠️ Không thể gửi tới máy chủ Render (Đang thử lại...)';
          }
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Giám Sát Thiết Bị Học Sinh',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: const Color(0xFF4F46E5),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Status Card
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              color: const Color(0xFFEEF2FF),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    const Icon(Icons.satellite_alt_rounded, size: 48, color: Color(0xFF4F46E5)),
                    const SizedBox(height: 8),
                    Text(
                      _statusText,
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Số lần gửi thành công: $_sentCount lần',
                      style: const TextStyle(fontSize: 12, color: Colors.black54),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Settings Form
            const Text(
              'Cấu hình thông tin học sinh & trường học',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _studentNameController,
              decoration: const InputDecoration(
                labelText: 'Họ và tên học sinh',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.person),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _schoolNameController,
              decoration: const InputDecoration(
                labelText: 'Trường học',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.school),
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _classNameController,
                    decoration: const InputDecoration(
                      labelText: 'Lớp học',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.class_),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: _parentPhoneController,
                    decoration: const InputDecoration(
                      labelText: 'SĐT Phụ huynh',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.phone),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _serverUrlController,
              decoration: const InputDecoration(
                labelText: 'Địa chỉ máy chủ Render',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.cloud_upload),
              ),
            ),
            const SizedBox(height: 16),

            ElevatedButton.icon(
              onPressed: _saveSettings,
              icon: const Icon(Icons.save),
              label: const Text('Lưu & Cập Nhật Cấu Hình'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4F46E5),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 12),

            // Warning Banner for Uninstall
            OutlinedButton.icon(
              onPressed: () {
                ApiService.sendUninstallBeacon(
                  deviceUuid: _deviceUuid,
                  studentName: _studentNameController.text.trim(),
                );
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Đã gửi tín hiệu thử nghiệm: Cảnh báo gỡ app lên máy chủ!'),
                    backgroundColor: Colors.red,
                  ),
                );
              },
              icon: const Icon(Icons.warning_amber_rounded, color: Colors.red),
              label: const Text(
                'Thử nghiệm tín hiệu gỡ ứng dụng (Gửi cảnh báo)',
                style: TextStyle(color: Colors.red),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Colors.red),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

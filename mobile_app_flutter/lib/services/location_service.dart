import 'package:geolocator/geolocator.dart';

class LocationService {
  /// Yeu cau quyen truy cap vi tri GPS (ca khi chay nen tren dien thoai)
  static Future<bool> requestPermissions() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return false;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return false;
    }

    return true;
  }

  /// Lay vi tri hien tai voi che do toi uu pin:
  /// - Khi hoc sinh dung yen: su dung vi tri gan nhat, khong danh thuc chip GPS qua muc
  /// - Khi hoc sinh di chuyen tren 10m: cap nhat toa do moi nhat
  static Future<Position?> getCurrentPosition() async {
    try {
      final hasPermission = await requestPermissions();
      if (!hasPermission) return null;

      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 10, // Chi cap nhat khi di chuyen >= 10m de tiet kiem pin
        ),
      );
    } catch (e) {
      return null;
    }
  }
}

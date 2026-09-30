# Ứng Dụng Di Động Học Sinh (Flutter Mobile App)

Mã nguồn ứng dụng di động Flutter chuyên dụng cài đặt trên điện thoại học sinh để thu thập GPS thời gian thực, mức pin, trạng thái mạng Wi-Fi và phát hiện gỡ cài đặt.

---

## 1. Yêu Cầu Cài Đặt Môi Trường
- **Flutter SDK**: Phiên bản 3.0.0 trở lên (`flutter --version`)
- **Android Studio** hoặc **VS Code** với Flutter extension
- **Java JDK**: JDK 17 hoặc JDK 21

---

## 2. Hướng Dẫn Cài Đặt & Chạy Thử Nghiệm

1. Di chuyển vào thư mục ứng dụng di động:
   ```bash
   cd mobile_app_flutter
   ```

2. Tải các thư viện phụ thuộc:
   ```bash
   flutter pub get
   ```

3. Kết nối điện thoại Android qua cáp USB (đã bật chế độ gỡ lỗi USB / Developer Options) hoặc mở máy ảo Android.

4. Chạy ứng dụng:
   ```bash
   flutter run
   ```

---

## 3. Hướng Dẫn Đóng Gói File APK Cài Đặt Trực Tiếp Lên Điện Thoại Học Sinh

Để tạo file file `.apk` cài trực tiếp lên điện thoại học sinh mà không cần máy tính:

```bash
flutter build apk --release
```

File cài đặt APK sẽ được tạo tại:
`mobile_app_flutter/build/app/outputs/flutter-apk/app-release.apk`

---

## 4. Các Quyền Cần Cấp Trên Điện Thoại Học Sinh
1. **Vị trí (Location)**: Chọn **"Luôn cho phép" (Allow all the time)** để ứng dụng có thể gửi tọa độ ngay cả khi tắt màn hình.
2. **Tối ưu hóa pin (Battery Optimization)**: Chọn **"Không tối ưu hóa" (Don't optimize / Unrestricted)** để hệ điều hành Android không tự động tắt dịch vụ chạy ngầm.
3. **Tự khởi động (Auto-start)**: Bật trên các dòng điện thoại Xiaomi, Oppo, Vivo, Samsung.

---

## 5. Cấu Hình Địa Chỉ Máy Chủ (Server URL)
Mở ứng dụng trên điện thoại, nhập địa chỉ máy chủ Render của bạn:
`https://qu-n-l-s1k1.onrender.com` (hoặc tên miền riêng của bạn) rồi nhấn **"Lưu & Cập Nhật Cấu Hình"**.
Ứng dụng sẽ bắt đầu truyền GPS và tình trạng thiết bị lên bản đồ vệ tinh Google Maps của trang web quản lý.

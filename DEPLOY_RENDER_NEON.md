# HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG GIÁM SÁT THIẾT BỊ HỌC SINH (RENDER + NEON POSTGRESQL)

Tài liệu hướng dẫn chi tiết từng bước xây dựng và triển khai toàn bộ hệ thống gồm máy chủ NodeJS Backend, Trang Web Quản Lý, Cơ sở dữ liệu Neon PostgreSQL và Ứng dụng di động học sinh.

---

## MỤC LỤC
1. [Khởi tạo Cơ Sở Dữ Liệu Neon PostgreSQL](#1-khởi-tạo-cơ-sở-dữ-liệu-neon-postgresql)
2. [Triển khai Backend & Web Lên Render.com](#2-triển-khai-backend--web-lên-rendercom)
3. [Cấu hình Biến Môi Trường (.env)](#3-cấu-hình-biến-môi-trường-env)
4. [Tài Khoản & Phân Quyền Hệ Thống](#4-tài-khoản--phân-quyền-hệ-thống)
5. [Tính Năng Bản Đồ Vệ Tinh Google Maps](#5-tính-năng-bản-đồ-vệ-tinh-google-maps)
6. [Cài Đặt & Kết Nối Điện Thoại Học Sinh](#6-cài-đặt--kết-nối-điện-thoại-học-sinh)

---

## 1. KHỞI TẠO CƠ SỞ DỮ LIỆU NEON POSTGRESQL

Neon cung cấp cơ sở dữ liệu PostgreSQL Serverless hoàn toàn miễn phí, tốc độ cao:

1. Truy cập trang web: [https://neon.tech](https://neon.tech) và đăng ký tài khoản miễn phí bằng tài khoản GitHub hoặc Google.
2. Nhấn nút **"Create Project"**:
   - **Project Name:** `device-monitor-db`
   - **Postgres Version:** `16` hoặc `17`
   - **Region:** Chọn `ap-southeast-1 (Singapore)` để có độ trễ kết nối thấp nhất tại Việt Nam.
3. Sau khi tạo xong, màn hình sẽ hiển thị **Connection String** (Chuỗi kết nối).
   - Chọn định dạng: `Postgres`
   - Chuỗi kết nối có dạng:
     ```
     postgresql://neondb_owner:matkhau_cua_ban@ep-xyz.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
     ```
4. Sao chép chuỗi kết nối này để cấu hình vào Render ở bước tiếp theo.
> *Lưu ý: Hệ thống đã tích hợp sẵn cơ chế Auto-create tables (tự động tạo bảng `devices`, `device_locations`, `device_statuses`, `activities`) khi khởi động lần đầu, bạn không cần phải chạy câu lệnh SQL thủ công.*

---

## 2. TRIỂN KHAI BACKEND & WEB LÊN RENDER.COM

Hệ thống được thiết kế theo kiến trúc Full-Stack Node.js Express kết hợp giao diện React SPA tối ưu chạy trên 1 cổng dịch vụ duy nhất của Render.

### Cách 1: Triển khai tự động bằng Blueprint (Khuyên dùng)
1. Đẩy mã nguồn dự án lên GitHub cá nhân của bạn.
2. Đăng nhập [https://dashboard.render.com](https://dashboard.render.com).
3. Chọn **"Blueprints"** -> **"New Blueprint Instance"**.
4. Chọn repository GitHub vừa đẩy lên -> Render sẽ tự động đọc file cấu hình `render.yaml` có sẵn trong mã nguồn và khởi tạo dịch vụ.
5. Điền giá trị `DATABASE_URL` là chuỗi kết nối Neon PostgreSQL của bạn.
6. Nhấn **"Apply"** để Render tự động build và chạy trang web.

### Cách 2: Triển khai thủ công bằng Web Service
1. Trên Render Dashboard, nhấn nút **"New +"** -> chọn **"Web Service"**.
2. Chọn repository GitHub của bạn.
3. Điền các thông số:
   - **Name:** `device-monitor` (hoặc tên tùy thích)
   - **Region:** `Singapore`
   - **Branch:** `main` (hoặc `master`)
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     npm install --legacy-peer-deps && npm run build
     ```
   - **Start Command:**
     ```bash
     npm start
     ```
   - **Plan Type:** `Free`
4. Mở mục **"Advanced"** -> Thêm các biến môi trường (xem Bước 3).
5. Nhấn **"Create Web Service"**. Quá trình build sẽ mất từ 1 đến 2 phút.

---

## 3. CẤU HÌNH BIẾN MÔI TRƯỜNG (.ENV)

Trong phần **Environment Variables** trên Render, thiết lập các biến sau:

| Tên biến (Key) | Giá trị mẫu (Value) | Giải thích |
|---|---|---|
| `NODE_ENV` | `production` | Chạy ở chế độ môi trường sản xuất |
| `DATABASE_URL` | `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require` | Chuỗi kết nối Neon PostgreSQL |
| `JWT_SECRET` | `chuoi_khoa_bao_mat_ngau_nhien_rat_dai_123456` | Khóa bí mật mã hóa JWT Token phiên làm việc |
| `CLIENT_URL` | `https://ten-app-cua-ban.onrender.com` | Địa chỉ URL trang web của bạn trên Render |
| `PORT` | `3000` | Cổng máy chủ (Render tự động điều phối) |
| `ADMIN_EMAIL` | `admin@devicemonitor.com` | **(Tùy chọn)** Email tài khoản Admin quản trị hệ thống |
| `ADMIN_PASSWORD` | `mat_khau_admin_an_toan_123` | **(Tùy chọn)** Mật khẩu Admin (hệ thống tự động hash bcrypt) |
| `ADMIN_NAME` | `Quản Trị Viên (Admin)` | **(Tùy chọn)** Tên hiển thị của Admin |
| `ADMIN_PHONE` | `0901234567` | **(Tùy chọn)** Số điện thoại liên hệ của Admin |

> *Ghi chú: Nếu bạn chưa thêm `ADMIN_EMAIL` và `ADMIN_PASSWORD` vào Environment Variables thì hệ thống sẽ tự động dùng tài khoản mặc định `admin@devicemonitor.com` / `admin123`. Khi bạn thêm biến môi trường sau này, hệ thống sẽ tự động đồng bộ và kích hoạt mật khẩu mới ngay lập tức.*

---

## 4. TÀI KHOẢN & PHÂN QUYỀN HỆ THỐNG

Hệ thống phân chia 3 vai trò nghiêm ngặt với giao diện và quyền hạn hoàn toàn tách biệt:

### 1. Quản Trị Viên (Admin Tối Thượng)
- **Tài khoản mặc định khởi tạo:**
  - **Email:** `admin@devicemonitor.com`
  - **Mật khẩu (MK):** `admin123`
- **Quyền hạn:**
  - Toàn quyền giám sát 100% học sinh, giáo viên, phụ huynh trên toàn hệ thống.
  - Phê duyệt (Approve) hoặc Từ chối (Reject) / Khóa tài khoản của Giáo viên và Phụ huynh mới đăng ký.
  - Cấp tài khoản mới trực tiếp, đổi mật khẩu cho bất kỳ tài khoản nào khi có yêu cầu.
  - Theo dõi nhật ký hoạt động tổng thể và nhận mọi cảnh báo thời gian thực.

### 2. Giáo Viên Chủ Nhiệm
- **Quyền hạn:**
  - Chỉ xem danh sách và vị trí học sinh thuộc trường học do giáo viên phụ trách.
  - Có thể lọc học sinh theo từng lớp (VD: Lớp 10A1, 10A2, Khối 10...).
  - Nhận thông báo tức thì khi học sinh trong trường kết nối mạng Wi-Fi, mất mạng, hoặc dùng máy trong giờ học.

### 3. Phụ Huynh Học Sinh
- **Quyền hạn:**
  - Chỉ được xem duy nhất thiết bị của con mình (vị trí GPS, mức pin, ứng dụng đang mở, thời gian dùng màn hình).
  - Không có quyền xem bất kỳ học sinh hay lớp học nào khác trong trường để đảm bảo quyền riêng tư tuyệt đối.

### 4. Quên Mật Khẩu & Đổi Mật Khẩu
- Trên trang đăng nhập `/login`, người dùng có thể nhấn **"Quên mật khẩu?"** để khôi phục mật khẩu mới.
- Người dùng đã đăng nhập có thể đổi mật khẩu tại trang **Cài Đặt (`/settings`)**.

---

## 5. TÍNH NĂNG BẢN ĐỒ VỆ TINH GOOGLE MAPS

Bản đồ được tích hợp trực tiếp lớp vệ tinh Google Maps độ phân giải cao (`Google Hybrid Tiles` & `Roadmap`):
- **Phân biệt màu sắc học sinh chuẩn:**
  - 🟢 **Màu Xanh Lá:** Học sinh đang trực tuyến, kết nối bình thường.
  - 🟡 **Màu Vàng:** Học sinh đang sử dụng thiết bị (mở app game, mạng xã hội, hoặc hoạt động trong khung giờ học).
  - 🔴 **Màu Đỏ:** Thiết bị mất kết nối mạng / Đã gửi tín hiệu gỡ ứng dụng theo dõi.
- **Tương tác khi nhấp vào vị trí học sinh:**
  - Hiển thị bảng chi tiết: Tên học sinh, trường, lớp, tình trạng pin (có đang sạc không), loại mạng Wi-Fi/4G.
  - Tọa độ GPS chính xác kèm liên kết mở trực tiếp trên ứng dụng Google Maps hoặc Google Directions chỉ đường.

---

## 6. CÀI ĐẶT & KẾT NỐI ĐIỆN THOẠI HỌC SINH

Bạn có thể kết nối điện thoại học sinh bằng một trong 2 hình thức:

### Cách 1: Ứng dụng Di Động Flutter (Khuyên dùng cho Android)
Mã nguồn đầy đủ nằm trong thư mục `/mobile_app_flutter`:
1. Mở terminal, chạy lệnh đóng gói file APK:
   ```bash
   cd mobile_app_flutter
   flutter pub get
   flutter build apk --release
   ```
2. Cài đặt file `app-release.apk` lên điện thoại học sinh.
3. Cấp quyền **"Vị trí: Luôn cho phép" (Allow all the time)** và **"Tắt tối ưu hóa pin"**.
4. Ứng dụng sẽ chạy ngầm và tự khởi động lại khi khởi động máy. Khi bị tháo gỡ hoặc đóng tiến trình đột ngột, ứng dụng sẽ gửi cảnh báo khẩn cấp lên Web ngay lập tức.

### Cách 2: Mở Link Trực Tiếp Trên Trình Duyệt Điện Thoại (Không cần cài APK)
1. Trên điện thoại học sinh (iPhone hoặc Android), mở trình duyệt Safari/Chrome truy cập:
   ```
   https://ten-app-cua-ban.onrender.com/report
   ```
2. Cho phép trình duyệt truy cập Vị trí GPS (Location) khi được hỏi.
3. Nhập họ tên học sinh, lớp, trường học rồi nhấn **"Bắt Đầu Báo Cáo"**.
4. Tọa độ GPS, phần trăm pin và trạng thái kết nối mạng sẽ tự động truyền về bản đồ của Giáo viên và Phụ huynh theo thời gian thực mỗi giây!

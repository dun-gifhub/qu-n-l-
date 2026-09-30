# DeviceMonitor — Nền Tảng Quản Lý & Định Vị Thiết Bị

Hệ thống quản lý, giám sát trạng thái pin, kiểu kết nối mạng và vị trí GPS thời gian thực của thiết bị. Được xây dựng theo kiến trúc **Web-First**, sẵn sàng cho Mobile App (iOS / Android) kết nối thông qua REST API mà không cần sửa đổi backend.

---

## 1. Yêu Cầu Hệ Thống (Requirements)

* **Node.js**: Phiên bản 18.x hoặc 20.x trở lên
* **npm**: Phiên bản 9.x hoặc 10.x
* **Cơ sở dữ liệu**: Neon PostgreSQL (hoặc bất kỳ PostgreSQL 14+ nào)
* **Tài khoản Render**: Để deploy backend & frontend

---

## 2. Cài Đặt (Installation)

Clone repository và cài đặt các dependencies:

```bash
# Cài đặt toàn bộ thư viện
npm install
```

---

## 3. Cấu Hình Biến Môi Trường (.env)

Tạo file `.env` từ file mẫu `.env.example`:

```bash
cp .env.example .env
```

Nội dung cấu hình trong file `.env`:

```env
# URL kết nối Neon PostgreSQL
DATABASE_URL="postgresql://user:password@ep-xyz-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Khóa bí mật ký JWT (dài tối thiểu 32 ký tự trên production)
JWT_SECRET="YOUR_SUPER_SECRET_KEY_REPLACE_IN_PRODUCTION"

# Cổng khởi chạy (mặc định 3000)
PORT=3000

# Chế độ môi trường
NODE_ENV="development"

# URL của Client Frontend
CLIENT_URL="http://localhost:3000"
```

*Lưu ý: Nếu chưa điền `DATABASE_URL`, hệ thống sẽ tự động sử dụng bộ nhớ lưu trữ file nội bộ `.data/database.json` để bạn có thể kiểm thử toàn bộ tính năng ngay lập tức.*

---

## 4. Tạo Database Trên Neon (Neon PostgreSQL)

1. Truy cập [Neon Console](https://console.neon.tech) và đăng nhập / đăng ký tài khoản.
2. Nhấn **New Project**, đặt tên dự án (ví dụ: `device-monitor-db`).
3. Chọn khu vực (Region) gần nhất (ví dụ: `ap-southeast-1` Singapore hoặc `us-east-2`).
4. Sau khi khởi tạo xong, copy chuỗi **Connection String** dạng:
   ```text
   postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require
   ```
5. Dán chuỗi này vào biến `DATABASE_URL` trong file `.env`.

---

## 5. Đồng Bộ & Migrate Prisma (Prisma Migration)

Sinh mã client Prisma và đẩy lược đồ vào database Neon:

```bash
# 1. Sinh client Prisma
npx prisma generate

# 2. Đẩy cấu trúc bảng vào Neon PostgreSQL
npx prisma db push

# Hoặc tạo migration nếu dùng Prisma Migrate:
# npx prisma migrate dev --name init
```

Lược đồ database bao gồm các bảng:
- `users`: Thông tin người dùng, họ tên, email, mật khẩu băm bcrypt.
- `devices`: Danh sách thiết bị (iPhone, Android, Tablet), Device UUID độc nhất.
- `device_locations`: Tọa độ GPS (latitude, longitude, accuracy, timestamp).
- `device_statuses`: Mức pin (%), trạng thái sạc, kiểu mạng (WiFi, 4G, 5G), status (ONLINE, IDLE, OFFLINE).
- `sessions`: Phiên đăng nhập người dùng.

---

## 6. Khởi Chạy Local Development

Khởi chạy ứng dụng fullstack (Express Backend + Vite Frontend tích hợp) chỉ với một lệnh:

```bash
npm run dev
```

Truy cập trên trình duyệt:
* **Web Dashboard**: `http://localhost:3000`
* **Health Check API**: `http://localhost:3000/api/health`

Đăng ký tài khoản:
* Truy cập `http://localhost:3000/register` để tạo tài khoản quản trị viên của bạn.
* Đăng nhập tại `http://localhost:3000/login` và bắt đầu thêm thiết bị.

---

## 7. Build Cho Production

Để build mã nguồn chuẩn bị triển khai:

```bash
npm run build
```

Mã frontend sẽ được đóng gói vào thư mục `dist/`.

Khởi chạy server production:

```bash
npm start
```

---

## 8. Triển Khai Lên Render (Deploy on Render)

Dự án đã được cấu hình sẵn file `render.yaml`. Bạn có thể triển khai qua các bước:

### Cách 1: Sử dụng Render Blueprint (Khuyên dùng)
1. Đẩy code lên GitHub repository của bạn.
2. Truy cập [Render Dashboard](https://dashboard.render.com).
3. Chọn **Blueprints** -> **New Blueprint Instance**.
4. Chọn repository vừa đẩy lên. Render sẽ tự động đọc `render.yaml` và thiết lập.
5. Điền biến `DATABASE_URL` từ Neon vào bảng cấu hình.

### Cách 2: Tạo Web Service thủ công trên Render
1. Tạo một **Web Service** mới trên Render.
2. Cấu hình các lệnh:
   * **Build Command**: `npm install && npx prisma generate && npm run build`
   * **Start Command**: `npm start`
   * **Node Version**: `20.x`
3. Trong tab **Environment Variables**, thêm:
   * `DATABASE_URL`: Chuỗi kết nối Neon PostgreSQL
   * `JWT_SECRET`: Khóa bí mật ngẫu nhiên
   * `NODE_ENV`: `production`

---

## 9. Danh Sách REST API Cho Mobile App

Mobile App (iOS/Android) sẽ sử dụng các endpoint sau để giao tiếp với hệ thống:

### Xác thực
* `POST /api/auth/register` — Đăng ký tài khoản
* `POST /api/auth/login` — Đăng nhập, nhận JWT token
* `POST /api/auth/logout` — Đăng xuất
* `GET  /api/auth/me` — Lấy thông tin tài khoản hiện tại

### Quản lý thiết bị
* `GET    /api/devices` — Danh sách thiết bị của tài khoản
* `POST   /api/devices` — Đăng ký thiết bị mới
* `GET    /api/devices/:id` — Chi tiết thiết bị
* `PATCH  /api/devices/:id` — Cập nhật thiết bị
* `DELETE /api/devices/:id` — Xóa thiết bị

### Telemetry Vị Trí & Trạng Thái (Mobile Background Worker)
* `POST /api/devices/:id/location` — Gửi tọa độ GPS
  ```json
  {
    "latitude": 10.7769,
    "longitude": 106.7009,
    "accuracy": 5.0,
    "timestamp": "2026-09-29T10:00:00Z"
  }
  ```
* `GET  /api/devices/:id/location` — Vị trí mới nhất
* `GET  /api/devices/:id/location-history?range=today` — Lịch sử vị trí
* `POST /api/devices/:id/heartbeat` — Gửi thông số pin và mạng
  ```json
  {
    "batteryLevel": 85,
    "charging": true,
    "networkType": "WIFI",
    "status": "ONLINE"
  }
  ```
* `GET  /api/devices/:id/status` — Trạng thái mới nhất
* `GET  /api/devices/:id/activity` — Nhật ký hoạt động của thiết bị
* `GET  /api/health` — Kiểm tra trạng thái máy chủ & cơ sở dữ liệu

---

## 10. Bảo Mật & Quyền Riêng Tư

* **Kiểm tra quyền sở hữu (Ownership Enforcement)**: Người dùng A tuyệt đối không thể xem hay chỉnh sửa thiết bị của Người dùng B.
* **Mã hóa mật khẩu**: Sử dụng `bcrypt` với muối an toàn.
* **Quy định vị trí**: Vị trí chỉ được ghi nhận khi thiết bị bật quyền chia sẻ vị trí và được người dùng đồng ý. Không hỗ trợ tính năng theo dõi ngầm bí mật.

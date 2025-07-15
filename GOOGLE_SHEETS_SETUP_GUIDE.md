# Hướng dẫn Setup Google Sheets Database

## Tổng quan

Hướng dẫn này sẽ giúp bạn tạo một database Google Sheets hoàn toàn mới cho hệ thống quản lý phòng khám, bao gồm dữ liệu mẫu để bắt đầu sử dụng ngay.

## Lợi ích của Google Sheets Database

- **Dễ truy cập**: Xem và chỉnh sửa dữ liệu trực tiếp trên Google Sheets
- **Chia sẻ dễ dàng**: Chia sẻ với nhân viên khác trong phòng khám
- **Backup tự động**: Google tự động sao lưu dữ liệu
- **Chi phí thấp**: Miễn phí cho hầu hết các trường hợp sử dụng
- **Tích hợp tốt**: Dễ dàng xuất báo cáo và phân tích dữ liệu
- **Không cần migration**: Bắt đầu với database mới, sạch sẽ

## Bước 1: Chuẩn bị Google Cloud Project

### 1.1 Tạo Google Cloud Project

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới:
   - Click **New Project**
   - Project name: `Clinic Management System`
   - Ghi nhớ Project ID

### 1.2 Bật Google Sheets API

1. Trong Google Cloud Console, vào **APIs & Services** > **Library**
2. Tìm kiếm "Google Sheets API"
3. Click **Enable**

### 1.3 Tạo Service Account

1. Vào **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **Service Account**
3. Điền thông tin:
   - Service account name: `clinic-sheets-service`
   - Service account ID: `clinic-sheets-service`
   - Description: `Service account for clinic management system`
4. Click **Create and Continue**
5. Bỏ qua phần Grant access (optional)
6. Click **Done**

### 1.4 Tạo Service Account Key

1. Click vào service account vừa tạo
2. Vào tab **Keys**
3. Click **Add Key** > **Create new key**
4. Chọn **JSON** format
5. Click **Create** - file JSON sẽ được tải xuống
6. **Lưu file này an toàn**, bạn sẽ cần nó ở bước tiếp theo

## Bước 2: Tạo Google Spreadsheet

### 2.1 Tạo Spreadsheet mới

1. Truy cập [Google Sheets](https://sheets.google.com/)
2. Tạo spreadsheet mới (click **Blank**)
3. Đặt tên: **"Clinic Management Database"**
4. Copy Spreadsheet ID từ URL:
   - URL ví dụ: `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit`
   - Spreadsheet ID: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

### 2.2 Chia sẻ Spreadsheet với Service Account

1. Click nút **Share** (góc trên bên phải)
2. Trong phần "Add people and groups":
   - Thêm email của service account (tìm trong file JSON đã tải, trường `client_email`)
   - Ví dụ: `clinic-sheets-service@your-project-id.iam.gserviceaccount.com`
3. Chọn quyền **Editor**
4. **Bỏ tick** "Notify people" (không cần gửi email thông báo)
5. Click **Share**

## Bước 3: Cấu hình Environment Variables

### 3.1 Cập nhật file .env.local

Tạo hoặc cập nhật file `.env.local` trong thư mục root của project:

```env
# Google Sheets Configuration
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here

# Service Account Credentials (copy toàn bộ nội dung file JSON)
GOOGLE_SERVICE_ACCOUNT_CREDENTIALS={"type":"service_account","project_id":"your_project_id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"clinic-sheets-service@your-project-id.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

### 3.2 Lấy Service Account Credentials

1. Mở file JSON service account key đã tải
2. Copy **toàn bộ nội dung** (là một JSON object)
3. Paste vào biến `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS`
4. **Quan trọng**: Đảm bảo JSON nằm trên một dòng duy nhất, không có xuống dòng

### 3.3 Ví dụ file .env.local hoàn chỉnh

```env
GOOGLE_SHEETS_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
GOOGLE_SERVICE_ACCOUNT_CREDENTIALS={"type":"service_account","project_id":"clinic-management-12345","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n","client_email":"clinic-sheets-service@clinic-management-12345.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs/clinic-sheets-service%40clinic-management-12345.iam.gserviceaccount.com"}
```

## Bước 4: Cài đặt Dependencies

Đảm bảo các package cần thiết đã được cài đặt:

```bash
npm install google-auth-library googleapis
```

## Bước 5: Khởi tạo Database

### 5.1 Restart ứng dụng

```bash
npm run dev
```

### 5.2 Truy cập trang Setup

1. Mở trình duyệt và truy cập: `http://localhost:3000/setup`
2. Đọc kỹ hướng dẫn trên trang
3. Kiểm tra lại các bước đã hoàn thành

### 5.3 Chạy Setup Database

1. Click nút **"Khởi tạo Database Google Sheets"**
2. Chờ quá trình hoàn thành (có thể mất 1-2 phút)
3. Kiểm tra kết quả setup

## Bước 6: Kiểm tra và Xác nhận

### 6.1 Kiểm tra Google Sheets

1. Mở Google Spreadsheet đã tạo
2. Xác nhận các sheet đã được tạo:
   - **Patients** (3 bệnh nhân mẫu)
   - **Appointments** (3 lịch hẹn mẫu)
   - **Medications** (3 thuốc mẫu)
   - **Staff** (3 nhân viên mẫu)
   - **Invoices** (2 hóa đơn mẫu)
   - **MedicalRecords** (2 hồ sơ bệnh án mẫu)
   - **Prescriptions** (1 đơn thuốc mẫu)
3. Kiểm tra dữ liệu trong từng sheet

### 6.2 Test ứng dụng

1. Truy cập các trang chính của ứng dụng:
   - `http://localhost:3000/patients` - Danh sách bệnh nhân
   - `http://localhost:3000/appointments` - Lịch hẹn
   - Các trang khác...
2. Kiểm tra dữ liệu mẫu hiển thị đúng
3. Thử tạo bệnh nhân mới, lịch hẹn mới để test chức năng ghi dữ liệu

## Cấu trúc Database

### Patients (Bệnh nhân)
- ID, Tên, Năm sinh, Giới tính
- Địa chỉ, Số điện thoại, CCCD
- Cân nặng, Lần khám cuối
- Tiền sử bệnh, Tài liệu đính kèm

### Appointments (Lịch hẹn)
- ID, Tên bệnh nhân, Tên bác sĩ
- Ngày, Giờ bắt đầu, Giờ kết thúc
- Trạng thái, Ghi chú

### Medications (Thuốc)
- ID, Tên thuốc, Hoạt chất
- Nồng độ, Dạng bào chế, Đơn vị
- Nhà sản xuất, Số đăng ký
- Giá nhập, Giá bán, Tồn kho

### Staff (Nhân viên)
- ID, Tên, Vai trò
- Điện thoại, Email
- Số chứng chỉ hành nghề
- Ngày cấp, Nơi cấp, Ngày hết hạn

### Invoices (Hóa đơn)
- ID, Tên bệnh nhân, Ngày
- Danh sách items, Tổng tiền
- Trạng thái thanh toán

### Medical Records (Hồ sơ bệnh án)
- ID, ID bệnh nhân, ID lịch hẹn
- Ngày khám, Tên bác sĩ
- Triệu chứng, Chẩn đoán, Điều trị
- Đơn thuốc, Lịch tái khám

### Prescriptions (Đơn thuốc)
- Thông tin bệnh nhân và bác sĩ
- Chẩn đoán, Triệu chứng
- Danh sách thuốc và liều dùng
- Tổng chi phí, Ghi chú bác sĩ

## Troubleshooting

### Lỗi "Missing environment variables"
**Nguyên nhân**: Chưa cấu hình đúng file .env.local
**Giải pháp**: 
- Kiểm tra file .env.local có tồn tại
- Đảm bảo có đủ 2 biến: GOOGLE_SHEETS_SPREADSHEET_ID và GOOGLE_SERVICE_ACCOUNT_CREDENTIALS
- Restart ứng dụng sau khi thay đổi .env.local

### Lỗi "Could not load the default credentials"
**Nguyên nhân**: JSON credentials không hợp lệ
**Giải pháp**:
- Kiểm tra JSON credentials có đúng format không
- Đảm bảo không có ký tự xuống dòng trong JSON
- Copy lại toàn bộ nội dung file JSON service account

### Lỗi "The caller does not have permission"
**Nguyên nhân**: Service account chưa có quyền truy cập spreadsheet
**Giải pháp**:
- Kiểm tra đã share spreadsheet với service account email chưa
- Đảm bảo quyền là "Editor"
- Kiểm tra service account email có đúng không

### Lỗi "Requested entity was not found"
**Nguyên nhân**: Spreadsheet ID không đúng
**Giải pháp**:
- Kiểm tra lại GOOGLE_SHEETS_SPREADSHEET_ID
- Copy lại ID từ URL của spreadsheet
- Đảm bảo spreadsheet tồn tại và accessible

### Lỗi "Quota exceeded"
**Nguyên nhân**: Vượt quá giới hạn API calls
**Giải pháp**:
- Chờ một lúc rồi thử lại
- Kiểm tra quota trong Google Cloud Console
- Liên hệ Google để tăng quota nếu cần

## Bảo mật

### Bảo vệ Service Account Key
- **Không commit** file .env.local vào Git
- Lưu trữ service account key file an toàn
- Định kỳ rotate service account key
- Chỉ cấp quyền tối thiểu cần thiết

### Backup và Recovery
- Google Sheets tự động backup
- Có thể export dữ liệu ra CSV/Excel định kỳ
- Sử dụng Google Sheets revision history để khôi phục
- Tạo copy của spreadsheet làm backup

## Bước tiếp theo

Sau khi setup thành công:

1. **Tùy chỉnh dữ liệu mẫu**: Thay thế dữ liệu mẫu bằng dữ liệu thực của phòng khám
2. **Cấu hình quyền truy cập**: Chia sẻ spreadsheet với nhân viên khác nếu cần
3. **Tạo backup định kỳ**: Thiết lập quy trình backup dữ liệu
4. **Monitor usage**: Theo dõi API usage và performance
5. **Tối ưu hóa**: Điều chỉnh cấu trúc dữ liệu theo nhu cầu thực tế

## Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra logs trong browser console
2. Xem kết quả chi tiết trong trang setup
3. Đảm bảo tất cả environment variables đã được cấu hình đúng
4. Thử setup lại từ đầu nếu cần thiết

---

**Lưu ý**: Hệ thống này tạo database hoàn toàn mới, không cần migrate từ hệ thống cũ. Bạn có thể bắt đầu sử dụng ngay với dữ liệu mẫu và dần thay thế bằng dữ liệu thực.
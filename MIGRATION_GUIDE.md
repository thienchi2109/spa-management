# Hướng dẫn Migration từ Firestore sang Google Sheets

## Tổng quan

Hướng dẫn này sẽ giúp bạn chuyển đổi hệ thống quản lý phòng khám từ Firebase Firestore sang Google Sheets làm cơ sở dữ liệu chính.

## Lợi ích của việc chuyển sang Google Sheets

- **Dễ truy cập**: Có thể xem và chỉnh sửa dữ liệu trực tiếp trên Google Sheets
- **Chia sẻ dễ dàng**: Chia sẻ với nhân viên khác trong phòng khám
- **Backup tự động**: Google tự động sao lưu dữ liệu
- **Chi phí thấp**: Miễn phí cho hầu hết các trường hợp sử dụng
- **Tích hợp tốt**: Dễ dàng xuất báo cáo và phân tích dữ liệu

## Bước 1: Chuẩn bị Google Cloud Project

### 1.1 Tạo Google Cloud Project

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Ghi nhớ Project ID

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
6. Lưu file này an toàn, bạn sẽ cần nó sau

## Bước 2: Tạo Google Spreadsheet

### 2.1 Tạo Spreadsheet mới

1. Truy cập [Google Sheets](https://sheets.google.com/)
2. Tạo spreadsheet mới
3. Đặt tên: "Clinic Management Database"
4. Copy Spreadsheet ID từ URL (phần giữa `/d/` và `/edit`)
   - Ví dụ: `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit`
   - Spreadsheet ID: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

### 2.2 Chia sẻ Spreadsheet với Service Account

1. Click **Share** button
2. Thêm email của service account (có trong file JSON đã tải, trường `client_email`)
3. Chọn quyền **Editor**
4. Click **Send**

## Bước 3: Cấu hình Environment Variables

### 3.1 Cập nhật file .env.local

Tạo hoặc cập nhật file `.env.local` với thông tin sau:

```env
# Google Sheets Configuration
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here

# Service Account Credentials (copy toàn bộ nội dung file JSON)
GOOGLE_SERVICE_ACCOUNT_CREDENTIALS={"type":"service_account","project_id":"your_project",...}
```

### 3.2 Lấy Service Account Credentials

1. Mở file JSON service account key đã tải
2. Copy toàn bộ nội dung (là một JSON object)
3. Paste vào biến `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS`
4. Đảm bảo không có xuống dòng trong chuỗi JSON

## Bước 4: Cài đặt Dependencies

```bash
npm install google-auth-library googleapis
```

## Bước 5: Chạy Migration

### 5.1 Backup dữ liệu hiện tại

Trước khi migration, hãy backup dữ liệu Firestore:

```bash
# Truy cập trang migration trong ứng dụng
http://localhost:3000/migration
```

### 5.2 Thực hiện Migration

1. Truy cập trang Migration: `http://localhost:3000/migration`
2. Đọc kỹ cảnh báo và hướng dẫn
3. Click **"Bắt đầu Migration toàn bộ"**
4. Chờ quá trình hoàn thành
5. Kiểm tra kết quả migration

### 5.3 Migration từng phần (nếu cần)

Nếu migration toàn bộ gặp lỗi, bạn có thể migration từng collection:

1. Click vào từng collection trong phần "Migration từng phần"
2. Kiểm tra kết quả từng collection
3. Xử lý lỗi nếu có

## Bước 6: Kiểm tra và Xác nhận

### 6.1 Kiểm tra Google Sheets

1. Mở Google Spreadsheet đã tạo
2. Xác nhận các sheet đã được tạo:
   - Patients
   - Appointments
   - Medications
   - Invoices
   - Staff
   - MedicalRecords
   - Prescriptions
3. Kiểm tra dữ liệu trong từng sheet

### 6.2 Test ứng dụng

1. Restart ứng dụng Next.js
2. Test các chức năng chính:
   - Xem danh sách bệnh nhân
   - Tạo lịch hẹn mới
   - Quản lý kho thuốc
   - Tạo hóa đơn
3. Đảm bảo dữ liệu được lưu vào Google Sheets

## Bước 7: Dọn dẹp (Optional)

### 7.1 Tắt Firestore (sau khi đã test thành công)

1. Có thể xóa các import Firebase không cần thiết
2. Xóa file `src/lib/firebase.ts` và `src/lib/firestore-utils.ts`
3. Xóa Firebase dependencies từ package.json (nếu không dùng cho mục đích khác)

### 7.2 Cập nhật .gitignore

Đảm bảo file service account key không được commit:

```gitignore
# Service account keys
service-account-key.json
.env.local
```

## Troubleshooting

### Lỗi Authentication

```
Error: Could not load the default credentials
```

**Giải pháp:**
- Kiểm tra biến môi trường `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS`
- Đảm bảo JSON credentials hợp lệ
- Kiểm tra service account có quyền truy cập spreadsheet

### Lỗi Permission Denied

```
Error: The caller does not have permission
```

**Giải pháp:**
- Đảm bảo đã share spreadsheet với service account email
- Kiểm tra quyền Editor cho service account
- Đảm bảo Google Sheets API đã được bật

### Lỗi Spreadsheet Not Found

```
Error: Requested entity was not found
```

**Giải pháp:**
- Kiểm tra `GOOGLE_SHEETS_SPREADSHEET_ID` có đúng không
- Đảm bảo spreadsheet tồn tại và accessible
- Kiểm tra service account có quyền truy cập

### Lỗi Rate Limiting

```
Error: Quota exceeded
```

**Giải pháp:**
- Thêm delay giữa các request
- Giảm số lượng operation đồng thời
- Kiểm tra quota limits trong Google Cloud Console

## Backup và Recovery

### Tạo Backup định kỳ

1. Tạo script backup tự động từ Google Sheets
2. Export dữ liệu ra CSV/Excel định kỳ
3. Sử dụng Google Takeout để backup toàn bộ

### Recovery từ Backup

1. Import dữ liệu từ CSV/Excel backup
2. Sử dụng Google Sheets revision history
3. Restore từ Google Drive trash nếu cần

## Monitoring và Maintenance

### Theo dõi Performance

1. Monitor API usage trong Google Cloud Console
2. Kiểm tra response time của các operation
3. Theo dõi error logs

### Bảo trì định kỳ

1. Dọn dẹp dữ liệu cũ
2. Optimize sheet structure nếu cần
3. Update service account credentials khi hết hạn

## Liên hệ hỗ trợ

Nếu gặp vấn đề trong quá trình migration, hãy:

1. Kiểm tra logs chi tiết trong browser console
2. Xem migration results để xác định collection nào gặp lỗi
3. Thử migration từng phần thay vì toàn bộ
4. Đảm bảo tất cả environment variables đã được cấu hình đúng

---

**Lưu ý quan trọng:** Luôn backup dữ liệu trước khi thực hiện migration và test kỹ trên môi trường development trước khi áp dụng lên production.
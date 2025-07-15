# Google Sheets Migration - Quick Start Guide

## 🚀 Hướng dẫn nhanh để chạy migration

### Bước 1: Cài đặt dependencies
```bash
npm install
```

### Bước 2: Setup Google Cloud & Sheets API

#### 2.1 Tạo Google Cloud Project
1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Ghi nhớ Project ID

#### 2.2 Bật Google Sheets API
1. Trong Google Cloud Console → **APIs & Services** → **Library**
2. Tìm "Google Sheets API" → Click **Enable**

#### 2.3 Tạo Service Account
1. **APIs & Services** → **Credentials** → **Create Credentials** → **Service Account**
2. Điền thông tin:
   - Name: `clinic-sheets-service`
   - ID: `clinic-sheets-service`
3. Click **Create and Continue** → **Done**

#### 2.4 Tạo Service Account Key
1. Click vào service account vừa tạo
2. Tab **Keys** → **Add Key** → **Create new key** → **JSON**
3. File JSON sẽ được tải xuống - lưu an toàn!

### Bước 3: Tạo Google Spreadsheet

#### 3.1 Tạo Spreadsheet
1. Vào [Google Sheets](https://sheets.google.com/)
2. Tạo spreadsheet mới
3. Đặt tên: "Clinic Management Database"
4. Copy Spreadsheet ID từ URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

#### 3.2 Share với Service Account
1. Click **Share** button
2. Thêm email từ file JSON (trường `client_email`)
3. Chọn quyền **Editor** → **Send**

### Bước 4: Cấu hình Environment Variables

Tạo file `.env.local`:

```env
# Google Sheets Configuration
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here

# Service Account Credentials (copy toàn bộ nội dung file JSON)
GOOGLE_SERVICE_ACCOUNT_CREDENTIALS={"type":"service_account","project_id":"your_project_id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"your_service_account@your_project.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}

# Firebase (giữ nguyên để migration)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**⚠️ Lưu ý quan trọng:**
- Copy toàn bộ nội dung file JSON service account vào `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS`
- Không có xuống dòng trong chuỗi JSON
- Thay `your_spreadsheet_id_here` bằng ID thực của spreadsheet

### Bước 5: Chạy Migration

```bash
# Start development server
npm run dev

# Truy cập migration page
http://localhost:3000/migration
```

### Bước 6: Thực hiện Migration

1. **Kiểm tra cấu hình**: Đảm bảo tất cả environment variables đã đúng
2. **Backup**: Migration sẽ tự động backup dữ liệu Firestore
3. **Chạy migration**: Click "Bắt đầu Migration toàn bộ"
4. **Kiểm tra kết quả**: Xem chi tiết migration results
5. **Verify**: Kiểm tra dữ liệu trong Google Spreadsheet

### Bước 7: Test ứng dụng

Sau khi migration thành công:
1. Restart server: `npm run dev`
2. Test các trang:
   - `/patients` - Quản lý bệnh nhân
   - `/appointments` - Lịch hẹn
   - `/inventory` - Kho thuốc
3. Tạo dữ liệu mới để test CRUD operations
4. Kiểm tra dữ liệu được lưu vào Google Sheets

## 🔧 Troubleshooting

### Lỗi thường gặp:

#### 1. "Could not load the default credentials"
```
Error: Could not load the default credentials
```
**Giải pháp:**
- Kiểm tra `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` có đúng format JSON không
- Đảm bảo không có ký tự xuống dòng trong chuỗi JSON

#### 2. "The caller does not have permission"
```
Error: The caller does not have permission
```
**Giải pháp:**
- Đảm bảo đã share spreadsheet với service account email
- Kiểm tra quyền Editor cho service account

#### 3. "Requested entity was not found"
```
Error: Requested entity was not found
```
**Giải pháp:**
- Kiểm tra `GOOGLE_SHEETS_SPREADSHEET_ID` có đúng không
- Đảm bảo spreadsheet tồn tại và accessible

#### 4. Build errors với webpack
Đã được fix trong `next.config.ts` với webpack fallbacks.

### Debug Tips:

1. **Kiểm tra environment variables:**
   ```bash
   # In browser console
   console.log(process.env.GOOGLE_SHEETS_SPREADSHEET_ID)
   ```

2. **Test API endpoints:**
   ```bash
   # Test sheets API
   curl http://localhost:3000/api/sheets?collection=patients
   
   # Test migration API
   curl http://localhost:3000/api/migration?action=backup
   ```

3. **Kiểm tra Google Cloud Console:**
   - APIs & Services → Credentials
   - APIs & Services → Enabled APIs
   - IAM & Admin → Service Accounts

## 📊 Sau khi Migration

### Lợi ích của Google Sheets:
- ✅ Truy cập dữ liệu trực tiếp qua Google Sheets
- ✅ Chia sẻ với nhân viên khác
- ✅ Backup tự động
- ✅ Export/Import dễ dàng
- ✅ Tạo charts và reports

### Quản lý dữ liệu:
- Có thể chỉnh sửa trực tiếp trên Google Sheets
- Sử dụng Google Sheets functions
- Tạo pivot tables cho báo cáo
- Chia sẻ với quyền view-only cho báo cáo

### Backup & Recovery:
- Google tự động backup
- Sử dụng version history
- Export định kỳ ra CSV/Excel
- Google Takeout cho full backup

---

**🎉 Chúc mừng!** Bạn đã hoàn thành migration từ Firestore sang Google Sheets. Ứng dụng giờ sẽ sử dụng Google Sheets làm database chính với tất cả tính năng được giữ nguyên.
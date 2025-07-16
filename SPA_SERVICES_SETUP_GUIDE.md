# Hướng Dẫn Setup Bảng SpaServices

## Tổng quan
Hướng dẫn này sẽ giúp bạn tạo bảng **SpaServices** trong Google Sheets với cấu trúc hoàn chỉnh và dữ liệu mẫu cho hệ thống quản lý spa.

## Cấu trúc bảng SpaServices

### Các cột chính:
| Cột | Tên | Kiểu dữ liệu | Mô tả |
|-----|-----|--------------|-------|
| A | id | Text | ID duy nhất của dịch vụ (VD: SPA001) |
| B | name | Text | Tên dịch vụ |
| C | category | Text | Danh mục dịch vụ |
| D | description | Text | Mô tả chi tiết |
| E | duration | Number | Thời gian thực hiện (phút) |
| F | price | Number | Giá dịch vụ (VNĐ) |
| G | discountPrice | Number | Giá khuyến mãi (tùy chọn) |
| H | requiredStaff | Text | Loại nhân viên cần thiết |
| I | equipment | Text | Thiết bị cần thiết |
| J | roomType | Text | Loại phòng |
| K | preparationTime | Number | Thời gian chuẩn bị (phút) |
| L | cleanupTime | Number | Thời gian dọn dẹp (phút) |
| M | maxCapacity | Number | Số khách tối đa |
| N | ageRestriction | Text | Giới hạn độ tuổi |
| O | contraindications | Text | Chống chỉ định |
| P | benefits | Text | Lợi ích |
| Q | aftercareInstructions | Text | Hướng dẫn chăm sóc sau |
| R | isActive | Boolean | Trạng thái hoạt động |
| S | imageUrl | Text | URL hình ảnh |
| T | createdAt | Date | Ngày tạo |
| U | updatedAt | Date | Ngày cập nhật |

## Cách 1: Sử dụng Google Apps Script (Khuyến nghị)

### Bước 1: Mở Google Sheets
1. Truy cập Google Sheets của bạn
2. Mở spreadsheet chứa dữ liệu spa

### Bước 2: Mở Apps Script Editor
1. Trong Google Sheets, chọn **Extensions** > **Apps Script**
2. Xóa code mặc định trong editor

### Bước 3: Copy script setup
1. Mở file `spa-services-setup.js` 
2. Copy toàn bộ nội dung
3. Paste vào Apps Script Editor

### Bước 4: Chạy script
1. Chọn function `runSpaServicesSetup` từ dropdown
2. Click **Run** (▶️)
3. Cấp quyền truy cập khi được yêu cầu
4. Chờ script hoàn thành

### Bước 5: Kiểm tra kết quả
- Script sẽ tạo sheet "SpaServices" với 21 cột
- Thêm 8 dịch vụ mẫu
- Format tự động cho giá tiền và thời gian

## Cách 2: Import file CSV

### Bước 1: Tải file CSV
- Sử dụng file `spa_services_sample.csv` đã tạo

### Bước 2: Import vào Google Sheets
1. Trong Google Sheets, chọn **File** > **Import**
2. Chọn **Upload** và tải file CSV
3. Chọn **Replace spreadsheet** hoặc **Insert new sheet(s)**
4. Click **Import data**

### Bước 3: Format dữ liệu
- Format cột giá: `#,##0" ₫"`
- Format cột thời gian: `0" phút"`
- Đóng băng hàng header

## Dữ liệu mẫu được tạo

### 8 dịch vụ spa mẫu:

#### 🤲 Massage (2 dịch vụ)
- **Massage Thư Giãn Toàn Thân** - 90 phút - 450,000₫
- **Massage Đá Nóng** - 75 phút - 520,000₫

#### 💆‍♀️ Facial (2 dịch vụ)  
- **Chăm Sóc Da Mặt Cơ Bản** - 60 phút - 280,000₫
- **Điều Trị Mụn Chuyên Sâu** - 90 phút - 450,000₫

#### 🧴 Body Treatment (1 dịch vụ)
- **Tẩy Tế Bào Chết Toàn Thân** - 45 phút - 320,000₫

#### 💅 Nail Care (2 dịch vụ)
- **Manicure Cơ Bản** - 30 phút - 150,000₫  
- **Pedicure Cơ Bản** - 45 phút - 180,000₫

#### 💇‍♀️ Hair Care (1 dịch vụ)
- **Gội Đầu Massage Thư Giãn** - 30 phút - 120,000₫

## Các danh mục dịch vụ

Hệ thống hỗ trợ các danh mục sau:
- **Massage** - Các dịch vụ massage
- **Facial** - Chăm sóc da mặt  
- **Body Treatment** - Chăm sóc cơ thể
- **Nail Care** - Chăm sóc móng
- **Hair Care** - Chăm sóc tóc
- **Wellness** - Dịch vụ thư giãn (sauna, steam...)

## Lưu ý quan trọng

### Định dạng dữ liệu:
- **ID**: Phải duy nhất, format SPA001, SPA002...
- **Giá**: Số nguyên, đơn vị VNĐ
- **Thời gian**: Số nguyên, đơn vị phút
- **Boolean**: TRUE/FALSE cho isActive
- **Arrays**: Phân cách bằng dấu phẩy (equipment, contraindications, benefits)

### Validation:
- Tên dịch vụ không được trống
- Giá phải > 0
- Thời gian phải > 0
- Category phải thuộc danh sách cho phép

## Kiểm tra sau khi setup

1. **Kiểm tra cấu trúc**: 21 cột với header đúng
2. **Kiểm tra dữ liệu**: 8 dịch vụ mẫu
3. **Kiểm tra format**: Giá có ký hiệu ₫, thời gian có "phút"
4. **Test CRUD**: Thử thêm/sửa/xóa dịch vụ

## Troubleshooting

### Lỗi thường gặp:
- **Permission denied**: Cấp quyền cho Apps Script
- **Sheet already exists**: Xóa sheet cũ hoặc đổi tên
- **Invalid data format**: Kiểm tra format CSV

### Liên hệ hỗ trợ:
Nếu gặp vấn đề, hãy kiểm tra:
1. Quyền truy cập Google Sheets
2. Format dữ liệu đúng
3. Tên sheet và cột chính xác

---

✅ **Hoàn thành setup bảng SpaServices thành công!**

Bây giờ bạn có thể sử dụng hệ thống quản lý dịch vụ spa với đầy đủ tính năng CRUD và dữ liệu mẫu để test.
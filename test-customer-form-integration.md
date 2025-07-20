# Test Case: Customer Form Integration with Confirmation Dialog

## Mục tiêu
Kiểm tra workflow mới: sau khi thêm khách hàng mới, hiển thị dialog xác nhận có muốn thêm vào form lịch hẹn không.

## Giải pháp mới: Confirmation Dialog UX

### ✅ **Ưu điểm của approach này:**
1. **User có quyền lựa chọn** - Không bắt buộc phải thêm vào lịch hẹn
2. **UX rõ ràng** - User biết chính xác điều gì sẽ xảy ra
3. **Tránh nhầm lẫn** - Không tự động điền mà user không mong muốn
4. **Professional workflow** - Giống các ứng dụng chuyên nghiệp khác

## Flow hoạt động mới

1. **User mở form tạo lịch hẹn**
2. **User click nút "+" để thêm khách hàng mới**
3. **User điền thông tin trong SimplifiedCustomerForm**
4. **User click "Thêm khách hàng"**
5. **SimplifiedCustomerForm đóng, khách hàng được lưu thành công**
6. **🆕 Dialog xác nhận xuất hiện:**
   ```
   ┌─────────────────────────────────────┐
   │ Thêm vào lịch hẹn?                  │
   │                                     │
   │ Khách hàng [Tên] đã được tạo thành  │
   │ công. Bạn có muốn thêm khách hàng   │
   │ này vào form tạo lịch hẹn không?    │
   │                                     │
   │              [Hủy] [Thêm vào lịch hẹn] │
   └─────────────────────────────────────┘
   ```
7. **User chọn:**
   - **"Thêm vào lịch hẹn"** → Tên tự động điền vào form
   - **"Hủy"** → Không điền, tiếp tục tạo lịch hẹn bình thường

## Code Implementation

### 1. State management:
```typescript
const [showAddToAppointmentDialog, setShowAddToAppointmentDialog] = useState(false);
const [newCustomerToAdd, setNewCustomerToAdd] = useState<Customer | null>(null);
```

### 2. Modified handleSaveNewCustomer:
```typescript
// Thay vì tự động điền, hiển thị dialog xác nhận
setNewCustomerToAdd(newPatient);
setShowAddToAppointmentDialog(true);
```

### 3. Confirmation handlers:
```typescript
const handleAddCustomerToAppointment = () => {
  // Điền vào form nếu user chọn "Thêm"
  form.setValue('patientName', newCustomerToAdd.name);
  setPatientSearch(newCustomerToAdd.name);
};

const handleSkipAddingCustomer = () => {
  // Chỉ đóng dialog nếu user chọn "Hủy"
};
```

## Test Cases

### ✅ **Test Case 1: User chọn "Thêm vào lịch hẹn"**
1. Thêm khách hàng mới
2. Dialog xác nhận xuất hiện
3. Click "Thêm vào lịch hẹn"
4. **Expected**: Tên xuất hiện trong form lịch hẹn

### ✅ **Test Case 2: User chọn "Hủy"**
1. Thêm khách hàng mới
2. Dialog xác nhận xuất hiện
3. Click "Hủy"
4. **Expected**: Form lịch hẹn không thay đổi, user có thể tiếp tục

### ✅ **Test Case 3: Multiple customers**
1. Thêm khách hàng A → Chọn "Hủy"
2. Thêm khách hàng B → Chọn "Thêm vào lịch hẹn"
3. **Expected**: Chỉ khách hàng B xuất hiện trong form

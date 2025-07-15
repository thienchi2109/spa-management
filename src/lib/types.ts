export interface Patient {
  id: string;
  name: string;
  birthYear: number;
  gender: 'Nam' | 'Nữ' | 'Male' | 'Female' | 'Other';
  address: string;
  phone: string;
  citizenId: string;
  weight: number;
  lastVisit: string;
  avatarUrl: string;
  medicalHistory?: string[] | string;
  documents?: PatientDocument[];
}

export interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'Scheduled' | 'Completed' | 'Cancelled';
  notes?: string;
}

export interface Medication {
  id: string;
  name: string;
  activeIngredient: string;        // Hoạt chất
  concentration: string;           // Hàm lượng/Nồng độ (VD: 500mg, 250mg/5ml)
  dosageForm: string;             // Dạng bào chế (Viên nén, Viên nang, Dung dịch, Thuốc mỡ...)
  unit: string;                   // Đơn vị tính cơ bản (Viên, Vỉ, Hộp, Chai, Tuýp...)
  manufacturer: string;           // Nhà sản xuất
  manufacturerCountry: string;    // Nước sản xuất
  registrationNumber: string;     // Số đăng ký (SĐK) do Cục Quản lý Dược cấp
  supplier: string;               // Nhà cung cấp
  importPrice: number;            // Giá nhập (VNĐ)
  sellPrice: number;              // Giá bán (VNĐ)
  storageLocation: string;        // Vị trí lưu kho (VD: Tủ A, Kệ 2, Ngăn 3)
  minStockThreshold: number;      // Ngưỡng tồn kho tối thiểu
  batchNo: string;               // Số lô
  expiryDate: string;            // Ngày hết hạn
  stock: number;                 // Số lượng tồn kho hiện tại
  status?: string;               // Trạng thái (optional)
}

export interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Invoice {
  id: string;
  patientName: string;
  date: string;
  items: InvoiceItem[];
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'Paid' | 'Pending' | 'Overdue';
}

export interface PatientDocument {
  id: string;
  name: string;
  type: 'Ultrasound' | 'X-Ray' | 'Blood Test' | 'Prescription' | 'Tài liệu';
  uploadDate: string;
  url: string;
}

export interface Staff {
  id: string;
  name: string;
  role: 'Bác sĩ' | 'Điều dưỡng' | 'admin';
  avatarUrl: string;
  phone: string;
  email: string;
  password: string;
  licenseNumber?: string;       // Số giấy phép hành nghề
  licenseIssueDate?: string;    // Ngày cấp
  licenseIssuePlace?: string;   // Nơi cấp
  licenseExpiryDate?: string;   // Ngày hết hạn
}

// TODO: Develop more detailed prescription functionality later
export interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  appointmentId: string;
  date: string;
  doctorName: string;
  symptoms: string;          // Triệu chứng
  diagnosis: string;         // Chẩn đoán
  treatment: string;         // Phương pháp điều trị
  prescription?: string;     // Đơn thuốc (TODO: expand this to detailed prescription system)
  nextAppointment?: string;  // Ngày hẹn tái khám
  notes?: string;           // Ghi chú thêm
}

export interface PrescriptionItem {
  id: string;
  medicationId: string;
  medicationName: string;
  concentration: string;
  dosageForm: string;
  quantity: number;
  unit: string;
  dosage: string;           // Liều dùng
  instructions: string;     // Hướng dẫn sử dụng
  unitPrice: number;
  totalCost: number;
  notes?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  patientWeight?: number;
  patientAddress?: string;
  doctorId: string;
  doctorName: string;
  doctorLicense?: string;
  medicalRecordId?: string;
  appointmentId?: string;
  date: string;
  diagnosis: string;
  symptoms?: string;
  items: PrescriptionItem[];
  totalCost: number;
  doctorNotes?: string;
  nextAppointment?: string;
  status: 'Draft' | 'Finalized' | 'Dispensed' | 'Cancelled';
  validUntil?: string;
  clinicInfo?: {
    name: string;
    address: string;
    phone: string;
    licenseNumber: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

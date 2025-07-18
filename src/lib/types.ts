export interface Customer {
  id: string;
  name: string;
  birthYear: number;
  gender: 'Nam' | 'Nữ' | 'Male' | 'Female' | 'Other';
  address: string;
  phone: string;
  lastVisit: string;
  avatarUrl: string;
  tongChiTieu: number; // Tổng chi tiêu của khách hàng
  citizenId?: string; // Optional
  weight?: number; // Optional
  medicalHistory?: string[] | string; // Optional
  documents?: PatientDocument[]; // Optional
  createdAt?: string; // Optional, for tracking
}

export interface AppointmentService {
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
}

export interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  schedulerName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'Scheduled' | 'Completed' | 'Cancelled';
  services?: AppointmentService[];
  notes?: string;
}

export interface SpaService {
  id: string;
  name: string;                    // Tên dịch vụ (VD: "Massage thư giãn", "Chăm sóc da mặt")
  category: string;                // Danh mục (VD: "Massage", "Facial", "Body Treatment", "Nail Care")
  description: string;             // Mô tả chi tiết dịch vụ
  duration: number;                // Thời gian thực hiện (phút)
  price: number;                   // Giá dịch vụ (VNĐ)
  discountPrice?: number;          // Giá khuyến mãi (nếu có)
  requiredStaff: string | string[]; // Loại kỹ thuật viên cần thiết
  equipment?: string | string[];   // Thiết bị cần thiết
  roomType?: string;               // Loại phòng (VD: "Phòng massage", "Phòng facial")
  preparationTime?: number;        // Thời gian chuẩn bị (phút)
  cleanupTime?: number;            // Thời gian dọn dẹp sau (phút)
  maxCapacity?: number;            // Số khách tối đa (cho dịch vụ nhóm)
  ageRestriction?: string;         // Giới hạn độ tuổi
  contraindications?: string | string[]; // Chống chỉ định
  benefits?: string | string[];    // Lợi ích của dịch vụ
  aftercareInstructions?: string;  // Hướng dẫn chăm sóc sau
  isActive: boolean;               // Trạng thái hoạt động
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
  type: 'Ultrasound' | 'X-Ray' | 'Blood Test' | 'Tài liệu';
  uploadDate: string;
  url: string;
}

export interface Staff {
  id: string;
  name: string;
  role: 'Chuyên viên' | 'Kỹ thuật viên' | 'admin';
  avatarUrl: string;
  phone: string;
  email: string;
  password: string;
  licenseNumber?: string;       // Số giấy phép hành nghề
  licenseIssueDate?: string;    // Ngày cấp
  licenseIssuePlace?: string;   // Nơi cấp
  licenseExpiryDate?: string;   // Ngày hết hạn
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  appointmentId: string;
  date: string;
  doctorName: string;
  symptoms: string;          // Tình trạng
  diagnosis: string;         // Đánh giá
  treatment: string;         // Phương pháp chăm sóc
  products?: string;         // Sản phẩm sử dụng
  nextAppointment?: string;  // Ngày hẹn tái khám
  notes?: string;           // Ghi chú thêm
}

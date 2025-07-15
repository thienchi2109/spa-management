import { Patient, Appointment, Medication, Invoice, PatientDocument, Staff, MedicalRecord, Prescription } from './types';

// Hardcode dates to prevent hydration errors from `new Date()`
export const staticToday = '2024-07-27';
const staticExpiringSoon = '2024-08-14'; // 15 days from staticToday
const staticExpired = '2024-07-25'; // 5 days before staticToday

export const documents: PatientDocument[] = [
  { id: 'DOC001', name: 'Ultrasound_Scan_Abdomen.pdf', type: 'Ultrasound', uploadDate: '2023-10-15', url: '#' },
  { id: 'DOC002', name: 'Blood_Test_Results_Jan23.pdf', type: 'Blood Test', uploadDate: '2023-10-14', url: '#' },
  { id: 'DOC003', name: 'Chest_XRay_Report.pdf', type: 'X-Ray', uploadDate: '2023-09-20', url: '#' },
  { id: 'DOC004', name: 'Prescription_Amoxicillin.pdf', type: 'Prescription', uploadDate: '2023-10-15', url: '#' },
];


export const patients: Patient[] = [
  { id: 'BN00001', name: 'Nguyễn Văn An', birthYear: 1985, gender: 'Male', address: '123 Đường ABC, Quận 1, TP.HCM', phone: '0901234567', citizenId: '001085123456', weight: 70, lastVisit: '2023-10-26', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', medicalHistory: 'Tiền sử huyết áp cao, đang điều trị bằng Amlodipin 5mg.', documents: documents.slice(0, 2) },
  { id: 'PATIENT-30072024-000', name: 'Trần Thị Bích', birthYear: 1990, gender: 'Female', address: '456 Đường Sồi, Quận 3, TP.HCM', phone: '0902345678', citizenId: '001190123456', weight: 55, lastVisit: staticToday, avatarUrl: 'https://placehold.co/100x100.png', medicalHistory: 'Không có bệnh mãn tính.', documents: [] },
  { id: 'PATIENT-30072024-001', name: 'Lê Thị Cẩm', birthYear: 1996, gender: 'Female', address: '789 Đường Thông, Quận 5, TP.HCM', phone: '0903456789', citizenId: '001196123456', weight: 60, lastVisit: staticToday, avatarUrl: 'https://placehold.co/100x100.png', medicalHistory: 'Hen suyễn từ nhỏ.', documents: [documents[2]] },
  { id: 'PATIENT-30072024-002', name: 'Phạm Văn Dũng', birthYear: 2001, gender: 'Male', address: '101 Đường Liễu, Quận 10, TP.HCM', phone: '0904567890', citizenId: '001201123456', weight: 75, lastVisit: staticToday, avatarUrl: 'https://placehold.co/100x100.png', medicalHistory: 'Gãy tay năm 2020.', documents: [] },
  { id: 'PATIENT-30072024-003', name: 'Võ Minh Long', birthYear: 1982, gender: 'Male', address: '212 Đường Tre, Quận Tân Bình, TP.HCM', phone: '0905678901', citizenId: '001082123456', weight: 80, lastVisit: staticToday, avatarUrl: 'https://placehold.co/100x100.png', medicalHistory: 'Tiểu đường type 2.', documents: [] },
];

export const staff: Staff[] = [
    { id: 'STAFF001', name: 'Bs. Minh', role: 'Bác sĩ', avatarUrl: 'https://placehold.co/100x100.png', phone: '090-123-4567', email: 'minh.bs@clinic.com', password: 'minh123', licenseNumber: 'CCHN00123/HCM' },
    { id: 'STAFF002', name: 'Bs. Hải', role: 'Bác sĩ', avatarUrl: 'https://placehold.co/100x100.png', phone: '090-234-5678', email: 'hai.bs@clinic.com', password: 'hai123' },
    { id: 'STAFF003', name: 'Bs. Hoài', role: 'Bác sĩ', avatarUrl: 'https://placehold.co/100x100.png', phone: '090-345-6789', email: 'hoai.bs@clinic.com', password: 'hoai123', licenseNumber: 'CCHN00789/HNO' },
    { id: 'STAFF004', name: 'Bs. Linh', role: 'Bác sĩ', avatarUrl: 'https://placehold.co/100x100.png', phone: '090-456-7890', email: 'linh.bs@clinic.com', password: 'linh123' },
    { id: 'STAFF005', name: 'Đd. Hạnh', role: 'Điều dưỡng', avatarUrl: 'https://placehold.co/100x100.png', phone: '090-567-8901', email: 'hanh.dd@clinic.com', password: 'hanh123', licenseNumber: 'CCHN-DD00456/DNA' },
    { id: 'STAFF006', name: 'Đd. Hoa', role: 'Điều dưỡng', avatarUrl: 'https://placehold.co/100x100.png', phone: '090-678-9012', email: 'hoa.dd@clinic.com', password: 'hoa123' },
    { id: 'STAFF007', name: 'Bs. An', role: 'Bác sĩ', avatarUrl: 'https://placehold.co/100x100.png', phone: '090-789-0123', email: 'an.bs@clinic.com', password: 'an123' },
    { id: 'STAFF008', name: 'Bs. Bình', role: 'Bác sĩ', avatarUrl: 'https://placehold.co/100x100.png', phone: '090-890-1234', email: 'binh.bs@clinic.com', password: 'binh123', licenseNumber: 'CCHN01112/BDI' },
    { id: 'STAFF009', name: 'Đd. Chi', role: 'Điều dưỡng', avatarUrl: 'https://placehold.co/100x100.png', phone: '090-901-2345', email: 'chi.dd@clinic.com', password: 'chi123' },
    { id: 'STAFF010', name: 'Đd. Dung', role: 'Điều dưỡng', avatarUrl: 'https://placehold.co/100x100.png', phone: '090-012-3456', email: 'dung.dd@clinic.com', password: 'dung123' },
];

export const appointments: Appointment[] = [
  { id: 'APP001', patientName: 'Anh Thắng', doctorName: 'Bs. Hải', date: staticToday, startTime: '07:00', endTime: '07:30', status: 'Scheduled' },
  { id: 'APP002', patientName: 'Trần Thị Bích', doctorName: 'Bs. Minh', date: staticToday, startTime: '08:00', endTime: '08:45', status: 'Completed', notes: 'Viêm họng cấp. Kê đơn kháng sinh và thuốc giảm đau.' },
  { id: 'APP003', patientName: 'Anh Mạnh', doctorName: 'Bs. Hoài', date: staticToday, startTime: '08:30', endTime: '09:00', status: 'Scheduled' },
  { id: 'APP004', patientName: 'Chị Mận', doctorName: 'Bs. Linh', date: staticToday, startTime: '09:15', endTime: '10:15', status: 'Cancelled' },
  { id: 'APP005', patientName: 'Nguyễn Văn An', doctorName: 'Đd. Hạnh', date: staticToday, startTime: '10:30', endTime: '11:15', status: 'Scheduled' },
  { id: 'APP006', patientName: 'Bệnh nhân X', doctorName: 'Đd. Hoa', date: staticToday, startTime: '14:00', endTime: '15:00', status: 'Scheduled' },
  { id: 'APP007', patientName: 'Lê Thị Cẩm', doctorName: 'Bs. Hải', date: staticToday, startTime: '11:00', endTime: '11:45', status: 'Completed', notes: 'Kiểm tra định kỳ cho bệnh hen suyễn. Tình trạng ổn định. Tiếp tục dùng thuốc cũ.' },
  { id: 'APP008', patientName: 'Sarah Connor', doctorName: 'Bs. Minh', date: '2024-08-01', startTime: '09:30', endTime: '10:00', status: 'Scheduled' },
  { id: 'APP009', patientName: 'Phạm Văn Dũng', doctorName: 'Bs. An', date: staticToday, startTime: '09:00', endTime: '09:30', status: 'Scheduled' },
  { id: 'APP010', patientName: 'Hoàng Văn Em', doctorName: 'Bs. Bình', date: staticToday, startTime: '13:00', endTime: '14:00', status: 'Scheduled' },
];

export const medications: Medication[] = [
  {
    id: 'MED001',
    name: 'Paracetamol 500mg',
    activeIngredient: 'Paracetamol',
    concentration: '500mg',
    dosageForm: 'Viên nén',
    unit: 'Viên',
    manufacturer: 'Công ty TNHH Dược phẩm Traphaco',
    manufacturerCountry: 'Việt Nam',
    registrationNumber: 'VD-18533-15',
    supplier: 'Công ty CP Dược phẩm Hà Tây',
    importPrice: 1200,
    sellPrice: 1800,
    storageLocation: 'Tủ A - Kệ 1 - Ngăn 2',
    minStockThreshold: 50,
    batchNo: 'B0123',
    expiryDate: '2025-12-31',
    stock: 150
  },
  {
    id: 'MED002',
    name: 'Amoxicillin 250mg',
    activeIngredient: 'Amoxicillin trihydrate',
    concentration: '250mg',
    dosageForm: 'Viên nang',
    unit: 'Viên',
    manufacturer: 'Công ty CP Dược Hậu Giang',
    manufacturerCountry: 'Việt Nam',
    registrationNumber: 'VD-15234-16',
    supplier: 'Công ty CP Dược phẩm Imexpharm',
    importPrice: 2500,
    sellPrice: 3200,
    storageLocation: 'Tủ B - Kệ 2 - Ngăn 1',
    minStockThreshold: 30,
    batchNo: 'B0456',
    expiryDate: staticExpiringSoon,
    stock: 75
  },
  {
    id: 'MED003',
    name: 'Ibuprofen 200mg',
    activeIngredient: 'Ibuprofen',
    concentration: '200mg',
    dosageForm: 'Viên nén bao phim',
    unit: 'Viên',
    manufacturer: 'Công ty TNHH Dược phẩm Stellapharm',
    manufacturerCountry: 'Việt Nam',
    registrationNumber: 'VD-19876-17',
    supplier: 'Công ty CP Dược phẩm Mediplantex',
    importPrice: 1800,
    sellPrice: 2500,
    storageLocation: 'Tủ A - Kệ 3 - Ngăn 1',
    minStockThreshold: 40,
    batchNo: 'B0789',
    expiryDate: '2024-08-31',
    stock: 200
  },
  {
    id: 'MED004',
    name: 'Aspirin 100mg',
    activeIngredient: 'Acid acetylsalicylic',
    concentration: '100mg',
    dosageForm: 'Viên nén',
    unit: 'Viên',
    manufacturer: 'Bayer AG',
    manufacturerCountry: 'Đức',
    registrationNumber: 'VD-12345-14',
    supplier: 'Công ty TNHH Bayer Việt Nam',
    importPrice: 800,
    sellPrice: 1200,
    storageLocation: 'Tủ C - Kệ 1 - Ngăn 3',
    minStockThreshold: 25,
    batchNo: 'B1011',
    expiryDate: staticExpired,
    stock: 40
  },
  {
    id: 'MED005',
    name: 'Lisinopril 10mg',
    activeIngredient: 'Lisinopril dihydrate',
    concentration: '10mg',
    dosageForm: 'Viên nén',
    unit: 'Viên',
    manufacturer: 'Công ty CP Dược phẩm Zentiva',
    manufacturerCountry: 'Cộng hòa Séc',
    registrationNumber: 'VD-20987-18',
    supplier: 'Công ty TNHH Dược phẩm Sanofi Việt Nam',
    importPrice: 3500,
    sellPrice: 4800,
    storageLocation: 'Tủ B - Kệ 1 - Ngăn 2',
    minStockThreshold: 20,
    batchNo: 'B1213',
    expiryDate: '2026-01-31',
    stock: 90
  },
  {
    id: 'MED006',
    name: 'Metformin 500mg',
    activeIngredient: 'Metformin hydrochloride',
    concentration: '500mg',
    dosageForm: 'Viên nén bao phim',
    unit: 'Viên',
    manufacturer: 'Công ty CP Dược phẩm Domesco',
    manufacturerCountry: 'Việt Nam',
    registrationNumber: 'VD-16789-19',
    supplier: 'Công ty CP Dược phẩm Domesco',
    importPrice: 1500,
    sellPrice: 2200,
    storageLocation: 'Tủ A - Kệ 2 - Ngăn 3',
    minStockThreshold: 35,
    batchNo: 'B1415',
    expiryDate: '2025-06-30',
    stock: 120
  },
  {
    id: 'MED007',
    name: 'Cephalexin 250mg',
    activeIngredient: 'Cephalexin',
    concentration: '250mg',
    dosageForm: 'Viên nang',
    unit: 'Viên',
    manufacturer: 'Công ty TNHH Dược phẩm Boston',
    manufacturerCountry: 'Việt Nam',
    registrationNumber: 'VD-14567-20',
    supplier: 'Công ty CP Dược phẩm Pymepharco',
    importPrice: 2800,
    sellPrice: 3600,
    storageLocation: 'Tủ B - Kệ 3 - Ngăn 2',
    minStockThreshold: 25,
    batchNo: 'B1617',
    expiryDate: '2024-09-15',
    stock: 15
  },
  {
    id: 'MED008',
    name: 'Omeprazole 20mg',
    activeIngredient: 'Omeprazole',
    concentration: '20mg',
    dosageForm: 'Viên nang kháng acid',
    unit: 'Viên',
    manufacturer: 'Công ty TNHH Dược phẩm Stada Việt Nam',
    manufacturerCountry: 'Việt Nam',
    registrationNumber: 'VD-18901-21',
    supplier: 'Công ty TNHH Dược phẩm Stada Việt Nam',
    importPrice: 4200,
    sellPrice: 5500,
    storageLocation: 'Tủ C - Kệ 2 - Ngăn 1',
    minStockThreshold: 30,
    batchNo: 'B1819',
    expiryDate: '2025-03-20',
    stock: 85
  }
];

export const invoices: Invoice[] = [
  { id: 'INV001', patientName: 'Nguyễn Văn An', date: '2023-10-15', items: [{id: '1', description: 'Phí tư vấn', amount: 100000}, {id: '2', description: 'Thuốc', amount: 50000}], amount: 150000, status: 'Paid' },
  { id: 'INV002', patientName: 'Trần Thị Bích', date: staticToday, items: [{id: '1', description: 'Phí khám bệnh', amount: 75000}], amount: 75000, status: 'Paid' },
  { id: 'INV003', patientName: 'Lê Thị Cẩm', date: staticToday, items: [{id: '1', description: 'Phí tái khám', amount: 200000}], amount: 200000, status: 'Pending' },
  { id: 'INV004', patientName: 'Phạm Văn Dũng', date: '2023-12-05', items: [{id: '1', description: 'Phí tư vấn', amount: 250000}, {id: '2', description: 'Xét nghiệm máu', amount: 60000}], amount: 310000, status: 'Overdue' },
  { id: 'INV005', patientName: 'Hoàng Văn Em', date: '2024-01-02', items: [{id: '1', description: 'Phí tư vấn', amount: 50000}], amount: 50000, status: 'Paid' },
];

// TODO: Expand prescription system with detailed medication management
export const medicalRecords: MedicalRecord[] = [
  {
    id: 'MR001',
    patientId: 'PATIENT-30072024-000',
    patientName: 'Trần Thị Bích',
    appointmentId: 'APP002',
    date: staticToday,
    doctorName: 'Bs. Minh',
    symptoms: 'Đau họng, khó nuốt, sốt nhẹ 37.5°C',
    diagnosis: 'Viêm họng cấp tính do virus',
    treatment: 'Nghỉ ngơi, uống nhiều nước, súc miệng bằng nước muối',
    prescription: 'Paracetamol 500mg x 3 lần/ngày x 5 ngày, Amoxicillin 250mg x 3 lần/ngày x 7 ngày',
    nextAppointment: '2024-08-05',
    notes: 'Bệnh nhân cần tái khám sau 1 tuần nếu triệu chứng không cải thiện'
  },
  {
    id: 'MR002',
    patientId: 'PATIENT-30072024-001',
    patientName: 'Lê Thị Cẩm',
    appointmentId: 'APP007',
    date: staticToday,
    doctorName: 'Bs. Hải',
    symptoms: 'Tái khám định kỳ, thở bình thường',
    diagnosis: 'Hen suyễn kiểm soát tốt',
    treatment: 'Tiếp tục sử dụng thuốc cũ theo đúng liều',
    prescription: 'Salbutamol inhaler - sử dụng khi cần, Budesonide inhaler 2 lần/ngày',
    notes: 'Tình trạng ổn định, khuyến khích duy trì lối sống lành mạnh'
  }
];

export const prescriptions: Prescription[] = [
  {
    id: 'PR001',
    patientId: 'PATIENT-30072024-000',
    patientName: 'Trần Thị Bích',
    patientAge: 34,
    patientGender: 'Female',
    patientWeight: 55,
    patientAddress: '456 Đường Sồi, Quận 3, TP.HCM',
    doctorId: 'STAFF001',
    doctorName: 'Bs. Minh',
    doctorLicense: 'CCHN00123/HCM',
    medicalRecordId: 'MR001',
    appointmentId: 'APP002',
    date: staticToday,
    diagnosis: 'Viêm họng cấp tính do virus',
    symptoms: 'Đau họng, khó nuốt, sốt nhẹ 37.5°C',
    items: [
      {
        id: 'PI001',
        medicationId: 'MED001',
        medicationName: 'Paracetamol 500mg',
        concentration: '500mg',
        dosageForm: 'Viên nén',
        quantity: 20,
        unit: 'Viên',
        dosage: '1 viên/lần',
        instructions: '3-4 lần/ngày sau ăn khi sốt trên 38.5°C',
        unitPrice: 1800,
        totalCost: 36000,
        notes: ''
      },
      {
        id: 'PI002',
        medicationId: 'MED002',
        medicationName: 'Amoxicillin 250mg',
        concentration: '250mg',
        dosageForm: 'Viên nang',
        quantity: 14,
        unit: 'Viên',
        dosage: '1 viên/lần',
        instructions: '2 lần/ngày (sáng, tối) sau ăn. Uống hết liều.',
        unitPrice: 3200,
        totalCost: 44800,
        notes: ''
      }
    ],
    totalCost: 80800,
    doctorNotes: 'Uống nhiều nước ấm, nghỉ ngơi, giữ ấm cổ. Hạn chế đồ ăn cay nóng.',
    nextAppointment: '2024-08-05',
    status: 'Finalized',
    validUntil: '2024-08-01',
    clinicInfo: {
      name: 'PHÒNG KHÁM ĐA KHOA ABC',
      address: 'Số 123, Đường XYZ, Phường Cống Vị, Quận Ba Đình, Hà Nội',
      phone: '(024) 3456 7890',
      licenseNumber: '01234'
    },
    createdAt: staticToday,
    updatedAt: staticToday
  },
  {
    id: 'PR002',
    patientId: 'PATIENT-30072024-001',
    patientName: 'Lê Thị Cẩm',
    patientAge: 28,
    patientGender: 'Female',
    patientWeight: 60,
    patientAddress: '789 Đường Thông, Quận 5, TP.HCM',
    doctorId: 'STAFF002',
    doctorName: 'Bs. Hải',
    doctorLicense: '',
    medicalRecordId: 'MR002',
    appointmentId: 'APP007',
    date: staticToday,
    diagnosis: 'Hen suyễn kiểm soát tốt',
    symptoms: 'Tái khám định kỳ, thở bình thường',
    items: [
      {
        id: 'PI003',
        medicationId: 'MED003',
        medicationName: 'Ibuprofen 200mg',
        concentration: '200mg',
        dosageForm: 'Viên nén bao phim',
        quantity: 10,
        unit: 'Viên',
        dosage: '1 viên/lần',
        instructions: 'Uống khi cần thiết để giảm đau',
        unitPrice: 2500,
        totalCost: 25000,
        notes: 'Sử dụng khi cần'
      }
    ],
    totalCost: 25000,
    doctorNotes: 'Tiếp tục duy trì lối sống lành mạnh, tránh các chất gây dị ứng.',
    status: 'Draft',
    validUntil: '2024-08-01',
    clinicInfo: {
      name: 'PHÒNG KHÁM ĐA KHOA ABC',
      address: 'Số 123, Đường XYZ, Phường Cống Vị, Quận Ba Đình, Hà Nội',
      phone: '(024) 3456 7890',
      licenseNumber: '01234'
    },
    createdAt: staticToday,
    updatedAt: staticToday
  }
];

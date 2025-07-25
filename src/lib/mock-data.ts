import { Patient, Appointment, SpaService, Invoice, PatientDocument, Staff, MedicalRecord } from './types';

// Hardcode dates to prevent hydration errors from `new Date()`
export const staticToday = '2024-07-27';
const staticExpiringSoon = '2024-08-14'; // 15 days from staticToday
const staticExpired = '2024-07-25'; // 5 days before staticToday

export const documents: PatientDocument[] = [
  { id: 'DOC001', name: 'Ultrasound_Scan_Abdomen.pdf', type: 'Ultrasound', uploadDate: '2023-10-15', url: '#' },
  { id: 'DOC002', name: 'Blood_Test_Results_Jan23.pdf', type: 'Blood Test', uploadDate: '2023-10-14', url: '#' },
  { id: 'DOC003', name: 'Chest_XRay_Report.pdf', type: 'X-Ray', uploadDate: '2023-09-20', url: '#' },

];


export const patients: Patient[] = [
  { id: 'BN00001', name: 'Nguyễn Văn An', birthYear: 1985, gender: 'Male', address: '123 Đường ABC, Quận 1, TP.HCM', phone: '0901234567', citizenId: '001085123456', weight: 70, lastVisit: '2023-10-26', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', medicalHistory: 'Tiền sử huyết áp cao, đang điều trị bằng Amlodipin 5mg.', documents: documents.slice(0, 2) },
  { id: 'PATIENT-30072024-000', name: 'Trần Thị Bích', birthYear: 1990, gender: 'Female', address: '456 Đường Sồi, Quận 3, TP.HCM', phone: '0902345678', citizenId: '001190123456', weight: 55, lastVisit: staticToday, avatarUrl: 'https://placehold.co/100x100.png', medicalHistory: 'Không có bệnh mãn tính.', documents: [] },
  { id: 'PATIENT-30072024-001', name: 'Lê Thị Cẩm', birthYear: 1996, gender: 'Female', address: '789 Đường Thông, Quận 5, TP.HCM', phone: '0903456789', citizenId: '001196123456', weight: 60, lastVisit: staticToday, avatarUrl: 'https://placehold.co/100x100.png', medicalHistory: 'Hen suyễn từ nhỏ.', documents: [documents[2]] },
  { id: 'PATIENT-30072024-002', name: 'Phạm Văn Dũng', birthYear: 2001, gender: 'Male', address: '101 Đường Liễu, Quận 10, TP.HCM', phone: '0904567890', citizenId: '001201123456', weight: 75, lastVisit: staticToday, avatarUrl: 'https://placehold.co/100x100.png', medicalHistory: 'Gãy tay năm 2020.', documents: [] },
  { id: 'PATIENT-30072024-003', name: 'Võ Minh Long', birthYear: 1982, gender: 'Male', address: '212 Đường Tre, Quận Tân Bình, TP.HCM', phone: '0905678901', citizenId: '001082123456', weight: 80, lastVisit: staticToday, avatarUrl: 'https://placehold.co/100x100.png', medicalHistory: 'Tiểu đường type 2.', documents: [] },
];

export const staff: Staff[] = [
    { id: 'STAFF001', name: 'Cv. Minh', role: 'Chuyên viên', avatarUrl: 'https://placehold.co/100x100.png', phone: '090-123-4567', email: 'minh.cv@spa.com', password: 'minh123', licenseNumber: 'CCHN00123/HCM' },
    { id: 'STAFF002', name: 'Cv. Hải', role: 'Chuyên viên', avatarUrl: 'https://placehold.co/100x100.png', phone: '090-234-5678', email: 'hai.cv@spa.com', password: 'hai123' },
    { id: 'STAFF003', name: 'Cv. Hoài', role: 'Chuyên viên', avatarUrl: 'https://placehold.co/100x100.png', phone: '090-345-6789', email: 'hoai.cv@spa.com', password: 'hoai123', licenseNumber: 'CCHN00789/HNO' },
    { id: 'STAFF004', name: 'Cv. Linh', role: 'Chuyên viên', avatarUrl: 'https://placehold.co/100x100.png', phone: '090-456-7890', email: 'linh.cv@spa.com', password: 'linh123' },
    { id: 'STAFF005', name: 'Kt. Hạnh', role: 'Kỹ thuật viên', avatarUrl: 'https://placehold.co/100x100.png', phone: '090-567-8901', email: 'hanh.kt@spa.com', password: 'hanh123', licenseNumber: 'CCHN-DD00456/DNA' },
    { id: 'STAFF006', name: 'Kt. Hoa', role: 'Kỹ thuật viên', avatarUrl: 'https://placehold.co/100x100.png', phone: '090-678-9012', email: 'hoa.kt@spa.com', password: 'hoa123' },
    { id: 'STAFF007', name: 'Cv. An', role: 'Chuyên viên', avatarUrl: 'https://placehold.co/100x100.png', phone: '090-789-0123', email: 'an.cv@spa.com', password: 'an123' },
    { id: 'STAFF008', name: 'Cv. Bình', role: 'Chuyên viên', avatarUrl: 'https://placehold.co/100x100.png', phone: '090-890-1234', email: 'binh.cv@spa.com', password: 'binh123', licenseNumber: 'CCHN01112/BDI' },
    { id: 'STAFF009', name: 'Kt. Chi', role: 'Kỹ thuật viên', avatarUrl: 'https://placehold.co/100x100.png', phone: '090-901-2345', email: 'chi.kt@spa.com', password: 'chi123' },
    { id: 'STAFF010', name: 'Kt. Dung', role: 'Kỹ thuật viên', avatarUrl: 'https://placehold.co/100x100.png', phone: '090-012-3456', email: 'dung.kt@spa.com', password: 'dung123' },
];

export const appointments: Appointment[] = [
  { id: 'APP001', patientName: 'Anh Thắng', doctorName: 'Cv. Hải', date: staticToday, startTime: '07:00', endTime: '07:30', status: 'Scheduled' },
  { id: 'APP002', patientName: 'Trần Thị Bích', doctorName: 'Cv. Minh', date: staticToday, startTime: '08:00', endTime: '08:45', status: 'Completed', notes: 'Chăm sóc da mặt cơ bản. Tư vấn sản phẩm dưỡng da.' },
  { id: 'APP003', patientName: 'Anh Mạnh', doctorName: 'Cv. Hoài', date: staticToday, startTime: '08:30', endTime: '09:00', status: 'Scheduled' },
  { id: 'APP004', patientName: 'Chị Mận', doctorName: 'Cv. Linh', date: staticToday, startTime: '09:15', endTime: '10:15', status: 'Cancelled' },
  { id: 'APP005', patientName: 'Nguyễn Văn An', doctorName: 'Kt. Hạnh', date: staticToday, startTime: '10:30', endTime: '11:15', status: 'Scheduled' },
  { id: 'APP006', patientName: 'Khách hàng X', doctorName: 'Kt. Hoa', date: staticToday, startTime: '14:00', endTime: '15:00', status: 'Scheduled' },
  { id: 'APP007', patientName: 'Lê Thị Cẩm', doctorName: 'Cv. Hải', date: staticToday, startTime: '11:00', endTime: '11:45', status: 'Completed', notes: 'Massage thư giãn định kỳ. Tình trạng da tốt. Tiếp tục chăm sóc theo lịch.' },
  { id: 'APP008', patientName: 'Sarah Connor', doctorName: 'Cv. Minh', date: '2024-08-01', startTime: '09:30', endTime: '10:00', status: 'Scheduled' },
  { id: 'APP009', patientName: 'Phạm Văn Dũng', doctorName: 'Cv. An', date: staticToday, startTime: '09:00', endTime: '09:30', status: 'Scheduled' },
  { id: 'APP010', patientName: 'Hoàng Văn Em', doctorName: 'Cv. Bình', date: staticToday, startTime: '13:00', endTime: '14:00', status: 'Scheduled' },
];

export const spaServices: SpaService[] = [
  {
    id: 'SPA001',
    name: 'Massage Thư Giãn Toàn Thân',
    category: 'Massage',
    description: 'Massage thư giãn toàn thân với tinh dầu thiên nhiên, giúp giảm căng thẳng và mệt mỏi',
    duration: 90,
    price: 450000,
    discountPrice: 380000,
    requiredStaff: ['Kỹ thuật viên'],
    equipment: ['Giường massage', 'Tinh dầu thư giãn', 'Khăn ấm'],
    roomType: 'Phòng massage',
    preparationTime: 10,
    cleanupTime: 15,
    maxCapacity: 1,
    ageRestriction: 'Từ 16 tuổi trở lên',
    contraindications: ['Phụ nữ có thai', 'Người có vết thương hở', 'Người bị sốt'],
    benefits: ['Giảm căng thẳng', 'Cải thiện tuần hoàn máu', 'Thư giãn cơ bắp'],
    aftercareInstructions: 'Uống nhiều nước, nghỉ ngơi 30 phút sau massage',
    isActive: true,
    imageUrl: 'https://placehold.co/400x300/spa-massage',
    createdAt: staticToday,
    updatedAt: staticToday
  },
  {
    id: 'SPA002',
    name: 'Chăm Sóc Da Mặt Cơ Bản',
    category: 'Facial',
    description: 'Làm sạch sâu, tẩy tế bào chết và dưỡng ẩm cho da mặt',
    duration: 60,
    price: 280000,
    requiredStaff: ['Chuyên viên'],
    equipment: ['Máy hút mụn', 'Mặt nạ dưỡng da', 'Serum vitamin C'],
    roomType: 'Phòng facial',
    preparationTime: 5,
    cleanupTime: 10,
    maxCapacity: 1,
    ageRestriction: 'Từ 14 tuổi trở lên',
    contraindications: ['Da bị viêm nhiễm nặng', 'Dị ứng mỹ phẩm'],
    benefits: ['Làm sạch sâu lỗ chân lông', 'Cải thiện độ ẩm da', 'Làm mịn da'],
    aftercareInstructions: 'Tránh ánh nắng mặt trời 24h, sử dụng kem chống nắng',
    isActive: true,
    imageUrl: 'https://placehold.co/400x300/facial-care',
    createdAt: staticToday,
    updatedAt: staticToday
  },
  {
    id: 'SPA003',
    name: 'Tẩy Tế Bào Chết Toàn Thân',
    category: 'Body Treatment',
    description: 'Tẩy tế bào chết toàn thân bằng muối biển và tinh dầu tự nhiên',
    duration: 45,
    price: 320000,
    discountPrice: 280000,
    requiredStaff: ['Kỹ thuật viên'],
    equipment: ['Muối tẩy tế bào chết', 'Tinh dầu dưỡng da', 'Găng tay massage'],
    roomType: 'Phòng body treatment',
    preparationTime: 5,
    cleanupTime: 15,
    maxCapacity: 1,
    ageRestriction: 'Từ 16 tuổi trở lên',
    contraindications: ['Da bị tổn thương', 'Dị ứng muối biển'],
    benefits: ['Loại bỏ tế bào chết', 'Làm mềm da', 'Cải thiện tuần hoàn'],
    aftercareInstructions: 'Dưỡng ẩm da trong 24h, tránh tắm nước quá nóng',
    isActive: true,
    imageUrl: 'https://placehold.co/400x300/body-scrub',
    createdAt: staticToday,
    updatedAt: staticToday
  },
  {
    id: 'SPA004',
    name: 'Manicure Cơ Bản',
    category: 'Nail Care',
    description: 'Chăm sóc móng tay cơ bản, cắt tỉa, đánh bóng và sơn móng',
    duration: 30,
    price: 150000,
    requiredStaff: ['Kỹ thuật viên'],
    equipment: ['Bộ dụng cụ manicure', 'Sơn móng', 'Dầu dưỡng móng'],
    roomType: 'Phòng nail',
    preparationTime: 5,
    cleanupTime: 10,
    maxCapacity: 1,
    ageRestriction: 'Không giới hạn',
    contraindications: ['Nhiễm trùng móng', 'Vết thương ở tay'],
    benefits: ['Móng tay đẹp', 'Vệ sinh móng', 'Thư giãn'],
    aftercareInstructions: 'Tránh làm việc nặng trong 2h đầu',
    isActive: true,
    imageUrl: 'https://placehold.co/400x300/manicure',
    createdAt: staticToday,
    updatedAt: staticToday
  },
  {
    id: 'SPA005',
    name: 'Pedicure Cơ Bản',
    category: 'Nail Care',
    description: 'Chăm sóc móng chân, ngâm chân thư giãn và massage bàn chân',
    duration: 45,
    price: 180000,
    requiredStaff: ['Kỹ thuật viên'],
    equipment: ['Chậu ngâm chân', 'Bộ dụng cụ pedicure', 'Kem massage chân'],
    roomType: 'Phòng nail',
    preparationTime: 10,
    cleanupTime: 15,
    maxCapacity: 1,
    ageRestriction: 'Không giới hạn',
    contraindications: ['Nhiễm trùng móng chân', 'Vết thương ở chân'],
    benefits: ['Móng chân đẹp', 'Thư giãn bàn chân', 'Cải thiện tuần hoàn'],
    aftercareInstructions: 'Giữ chân khô ráo, mang giày thoáng khí',
    isActive: true,
    imageUrl: 'https://placehold.co/400x300/pedicure',
    createdAt: staticToday,
    updatedAt: staticToday
  },
  {
    id: 'SPA006',
    name: 'Massage Đá Nóng',
    category: 'Massage',
    description: 'Massage thư giãn với đá nóng tự nhiên, giúp giãn cơ sâu',
    duration: 75,
    price: 520000,
    requiredStaff: ['Chuyên viên'],
    equipment: ['Đá nóng basalt', 'Tinh dầu massage', 'Máy hâm đá'],
    roomType: 'Phòng massage VIP',
    preparationTime: 15,
    cleanupTime: 20,
    maxCapacity: 1,
    ageRestriction: 'Từ 18 tuổi trở lên',
    contraindications: ['Phụ nữ có thai', 'Người có bệnh tim', 'Huyết áp cao'],
    benefits: ['Giãn cơ sâu', 'Giảm đau nhức', 'Thư giãn tâm trí'],
    aftercareInstructions: 'Uống nhiều nước, tránh tắm nước lạnh trong 2h',
    isActive: true,
    imageUrl: 'https://placehold.co/400x300/hot-stone',
    createdAt: staticToday,
    updatedAt: staticToday
  },
  {
    id: 'SPA007',
    name: 'Điều Trị Mụn Chuyên Sâu',
    category: 'Facial',
    description: 'Điều trị mụn chuyên sâu với công nghệ hiện đại',
    duration: 90,
    price: 450000,
    requiredStaff: ['Chuyên viên'],
    equipment: ['Máy điều trị mụn', 'Serum trị mụn', 'Mặt nạ kháng viêm'],
    roomType: 'Phòng điều trị',
    preparationTime: 10,
    cleanupTime: 15,
    maxCapacity: 1,
    ageRestriction: 'Từ 16 tuổi trở lên',
    contraindications: ['Da quá nhạy cảm', 'Đang dùng thuốc trị mụn'],
    benefits: ['Giảm mụn hiệu quả', 'Thu nhỏ lỗ chân lông', 'Cải thiện da'],
    aftercareInstructions: 'Tránh ánh nắng, không chạm tay vào mặt 24h',
    isActive: true,
    imageUrl: 'https://placehold.co/400x300/acne-treatment',
    createdAt: staticToday,
    updatedAt: staticToday
  },
  {
    id: 'SPA008',
    name: 'Gội Đầu Massage Thư Giãn',
    category: 'Hair Care',
    description: 'Gội đầu với massage da đầu thư giãn, sử dụng dầu gội thảo dược',
    duration: 30,
    price: 120000,
    requiredStaff: ['Kỹ thuật viên'],
    equipment: ['Dầu gội thảo dược', 'Tinh dầu massage đầu'],
    roomType: 'Phòng gội đầu',
    preparationTime: 5,
    cleanupTime: 10,
    maxCapacity: 1,
    ageRestriction: 'Không giới hạn',
    contraindications: ['Da đầu bị viêm nhiễm', 'Dị ứng dầu gội'],
    benefits: ['Thư giãn da đầu', 'Cải thiện tuần hoàn máu', 'Tóc mềm mượt'],
    aftercareInstructions: 'Tránh gội đầu trong 12h tiếp theo',
    isActive: true,
    imageUrl: 'https://placehold.co/400x300/hair-wash',
    createdAt: staticToday,
    updatedAt: staticToday
  }
];

export const invoices: Invoice[] = [
  { id: 'INV001', patientName: 'Nguyễn Văn An', date: '2023-10-15', items: [{id: '1', description: 'Phí tư vấn', amount: 100000}, {id: '2', description: 'Thuốc', amount: 50000}], amount: 150000, status: 'Paid' },
  { id: 'INV002', patientName: 'Trần Thị Bích', date: staticToday, items: [{id: '1', description: 'Phí chăm sóc da', amount: 75000}], amount: 75000, status: 'Paid' },
  { id: 'INV003', patientName: 'Lê Thị Cẩm', date: staticToday, items: [{id: '1', description: 'Phí massage thư giãn', amount: 200000}], amount: 200000, status: 'Pending' },
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
    doctorName: 'Cv. Minh',
    symptoms: 'Da khô, cần dưỡng ẩm, mệt mỏi',
    diagnosis: 'Da thiếu nước, cần chăm sóc đặc biệt',
    treatment: 'Massage thư giãn, dưỡng ẩm sâu, nghỉ ngơi',
    products: 'Serum dưỡng ẩm, Kem chống nắng SPF 30',
    nextAppointment: '2024-08-05',
    notes: 'Khách hàng cần tái khám sau 1 tuần nếu tình trạng không cải thiện'
  },
  {
    id: 'MR002',
    patientId: 'PATIENT-30072024-001',
    patientName: 'Lê Thị Cẩm',
    appointmentId: 'APP007',
    date: staticToday,
    doctorName: 'Cv. Hải',
    symptoms: 'Tái khám định kỳ, da tình trạng tốt',
    diagnosis: 'Tình trạng da ổn định',
    treatment: 'Tiếp tục chăm sóc da theo lịch trình',
    products: 'Kem dưỡng da chuyên dụng, Sữa rửa mặt nhẹ',
    notes: 'Tình trạng ổn định, khuyến khích duy trì lối sống lành mạnh'
  }
];



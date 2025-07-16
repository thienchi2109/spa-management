import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Patient, Prescription, PrescriptionItem } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

export function calculateAge(birthYear: number): number {
  if (!birthYear) return 0;
  // Use a static year to be consistent with mock data and avoid hydration errors.
  return 2024 - birthYear;
}

export function formatCurrency(amount: number): string {
    if (typeof amount !== 'number') return '';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

/**
 * Generates a patient ID following the pattern: PATIENT-DDMMYYYY-XXX
 * @param existingPatients - Array of existing patients to check for ID collisions
 * @param creationDate - Optional date for ID generation (defaults to today)
 * @returns Generated patient ID
 */
export function generatePatientId(existingPatients: { id: string }[], creationDate?: Date): string {
    const date = creationDate || new Date();

    // Format date as DDMMYYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    const dateStr = `${day}${month}${year}`;

    // Find existing patient IDs for the same date
    const datePrefix = `PATIENT-${dateStr}-`;
    const existingIdsForDate = existingPatients
        .filter(patient => patient.id.startsWith(datePrefix))
        .map(patient => patient.id)
        .sort();

    // Find the next available sequence number
    let sequenceNumber = 0;
    for (const existingId of existingIdsForDate) {
        const sequencePart = existingId.split('-')[2];
        const currentSequence = parseInt(sequencePart, 10);
        if (currentSequence === sequenceNumber) {
            sequenceNumber++;
        } else {
            break;
        }
    }

    // Format sequence number as XXX (3 digits with leading zeros)
    const sequenceStr = sequenceNumber.toString().padStart(3, '0');

    return `PATIENT-${dateStr}-${sequenceStr}`;
}

/**
 * Generates a customer ID following the pattern: CUSTOMER-DDMMYYYY-XXX
 * @param existingCustomers - Array of existing customers to check for ID collisions
 * @param creationDate - Optional date for ID generation (defaults to today)
 * @returns Generated customer ID
 */
export function generateCustomerId(existingCustomers: { id: string }[], creationDate?: Date): string {
    const date = creationDate || new Date();

    // Format date as DDMMYYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    const dateStr = `${day}${month}${year}`;

    // Find existing customer IDs for the same date
    const datePrefix = `CUSTOMER-${dateStr}-`;
    const existingIdsForDate = existingCustomers
        .filter(customer => customer.id.startsWith(datePrefix))
        .map(customer => customer.id)
        .sort();

    // Find the next available sequence number
    let sequenceNumber = 0;
    for (const existingId of existingIdsForDate) {
        const sequencePart = existingId.split('-')[2];
        const currentSequence = parseInt(sequencePart, 10);
        if (currentSequence === sequenceNumber) {
            sequenceNumber++;
        } else {
            break;
        }
    }

    // Format sequence number as XXX (3 digits with leading zeros)
    const sequenceStr = sequenceNumber.toString().padStart(3, '0');

    return `CUSTOMER-${dateStr}-${sequenceStr}`;
}

// Prescription utilities
export function generatePrescriptionId(existingPrescriptions: Prescription[] = [], facilityCode: string = '01234', prescriptionType: 'N' | 'H' | 'C' = 'C'): string {
  // Tạo mã đơn thuốc theo quy định: xxxxxyyyyyyy-z
  // x: 5 ký tự mã cơ sở khám bệnh, chữa bệnh
  // y: 7 ký tự mã đơn thuốc ngẫu nhiên (0-9, a-z)
  // z: loại đơn thuốc (N: gây nghiện, H: hướng thần, C: khác)

  const generateRandomCode = (length: number): string => {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Đảm bảo mã cơ sở có đúng 5 ký tự
  const normalizedFacilityCode = facilityCode.padStart(5, '0').substring(0, 5);

  let prescriptionCode: string;
  let fullId: string;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    // Tạo 7 ký tự ngẫu nhiên cho mã đơn thuốc
    prescriptionCode = generateRandomCode(7);
    fullId = `${normalizedFacilityCode}${prescriptionCode}-${prescriptionType}`;
    attempts++;

    // Kiểm tra tính duy nhất
    if (!existingPrescriptions.some(p => p.id === fullId) || attempts >= maxAttempts) {
      break;
    }
  } while (attempts < maxAttempts);

  return fullId;
}

export function calculatePrescriptionTotal(items: PrescriptionItem[]): number {
  return items.reduce((total, item) => total + item.totalCost, 0);
}

export function calculateItemTotal(quantity: number, unitPrice: number): number {
  return quantity * unitPrice;
}

export function generatePrescriptionValidUntil(issueDate: string, validityDays: number = 5): string {
  const date = new Date(issueDate);
  date.setDate(date.getDate() + validityDays);
  return date.toISOString().split('T')[0];
}

export function isPrescriptionValid(prescription: Prescription): boolean {
  if (!prescription.validUntil) return true;
  const today = new Date();
  const validUntil = new Date(prescription.validUntil);
  return validUntil >= today;
}

export function formatPrescriptionStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'Draft': 'Bản nháp',
    'Finalized': 'Đã hoàn thành',
    'Dispensed': 'Đã cung cấp',
    'Cancelled': 'Đã hủy'
  };
  return statusMap[status] || status;
}

export function getPrescriptionStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'Draft': 'outline',
    'Finalized': 'default',
    'Dispensed': 'secondary',
    'Cancelled': 'destructive'
  };
  return variantMap[status] || 'outline';
}

export function generatePrescriptionHTML(prescription: Prescription): string {
  // Format date in Vietnamese style
  const currentDate = new Date();
  const day = currentDate.getDate();
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  const formattedDate = `Ngày ${day} tháng ${month} năm ${year}`;

  // Calculate patient age and format birth date
  const patientAge = prescription.patientAge || 'N/A';
  const patientBirthDate = prescription.patientAge ?
    `${new Date().getFullYear() - prescription.patientAge}` : 'N/A';

  // Format gender display
  const formatGender = (gender?: string) => {
    if (!gender) return 'N/A';
    switch (gender.toLowerCase()) {
      case 'male': return 'Nam';
      case 'female': return 'Nữ';
      case 'other': return 'Khác';
      default: return gender;
    }
  };

  // Format doctor notes as bulleted list
  const formatDoctorNotes = (notes: string) => {
    if (!notes) return '';
    const lines = notes.split('\n').filter(line => line.trim());
    return lines.map(line => `<li>${line.trim()}</li>`).join('');
  };

  const medicationRows = prescription.items.map((item, index) => `
    <tr>
      <td class="border p-1 text-center">${index + 1}</td>
      <td class="border p-1">
        <strong style="font-size: 10px;">${item.medicationName}</strong>
        <br>
        <span style="font-size: 8px; color: #6b7280;">(${item.concentration} - ${item.dosageForm})</span>
      </td>
      <td class="border p-1 text-center">${item.unit}</td>
      <td class="border p-1 text-center">${item.quantity}</td>
      <td class="border p-1" style="font-size: 9px;">${item.dosage}, ${item.instructions}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đơn Thuốc Điện Tử</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #f3f4f6;
            margin: 0;
            padding: 0;
        }

        /* Cấu hình cho khổ giấy A5 khổ đứng */
        @page {
            size: A5 portrait;
            margin: 0.8cm;
        }

        /* Điều chỉnh scale cho A5 */
        .prescription-container {
            width: 148mm; /* Chiều rộng A5 trừ margin */
            min-height: 200mm; /* Chiều cao A5 trừ margin */
            max-width: 148mm;
            font-size: 11px; /* Giảm font size để vừa trang */
            line-height: 1.3;
            margin: 0 auto;
            padding: 8mm;
            box-sizing: border-box;
        }

        /* Tối ưu hóa giao diện khi in */
        @media print {
            body {
                background-color: #fff;
                margin: 0;
                padding: 0;
            }
            .prescription-container {
                box-shadow: none;
                margin: 0;
                padding: 8mm;
                width: 100%;
                max-width: 100%;
                border: none;
                font-size: 10px; /* Font nhỏ hơn khi in */
            }
            .no-print {
                display: none;
            }
        }

        /* Điều chỉnh kích thước các thành phần */
        .prescription-container h1 {
            font-size: 18px;
            margin: 8px 0;
        }

        .prescription-container h2 {
            font-size: 12px;
        }

        .prescription-container table {
            font-size: 10px;
            page-break-inside: auto;
        }

        .prescription-container tr {
            page-break-inside: avoid;
            page-break-after: auto;
        }

        .prescription-container thead {
            display: table-header-group;
        }

        .prescription-container tfoot {
            display: table-footer-group;
        }

        /* Điều chỉnh khoảng cách */
        .prescription-container .text-xs {
            font-size: 9px;
        }

        .prescription-container .text-sm {
            font-size: 10px;
        }

        /* QR Code size */
        .qr-code {
            width: 80px;
            height: 80px;
        }

        /* Responsive cho màn hình nhỏ */
        @media (max-width: 768px) {
            .prescription-container {
                width: 100%;
                max-width: 100%;
                margin: 10px;
                padding: 15px;
                font-size: 12px;
            }
        }
    </style>
</head>
<body>

    <!-- Nút In Đơn Thuốc (Sẽ bị ẩn khi in) -->
    <div class="no-print" style="text-align: center; padding: 10px; background-color: #f8f9fa; border-bottom: 1px solid #dee2e6;">
        <button onclick="window.print()" style="background-color: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 14px; margin-right: 10px;">
            🖨️ In đơn thuốc
        </button>
        <button onclick="window.close()" style="background-color: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 14px;">
            ✖️ Đóng
        </button>
    </div>

    <!-- Khung chứa toàn bộ đơn thuốc -->
    <div id="prescription" class="prescription-container bg-white shadow-lg border border-gray-200">
        
        <header class="flex justify-between items-start pb-4 border-b-2 border-gray-200">
            <div class="text-xs">
                <h2 class="font-bold text-sm uppercase text-blue-700">${prescription.clinicInfo?.name || 'SPA CHĂM SÓC SẮC ĐẸP ABC'}</h2>
                <p class="mt-1"><strong>Địa chỉ:</strong> ${prescription.clinicInfo?.address || 'Số 123, Đường XYZ, Phường Cống Vị, Quận Ba Đình, Hà Nội'}</p>
                <p><strong>Điện thoại:</strong> ${prescription.clinicInfo?.phone || '(024) 3456 7890'}</p>
                <p><strong>Mã CSKCB:</strong> ${prescription.clinicInfo?.licenseNumber || '01234'}</p>
            </div>
            <div class="text-center">
                <p class="text-xs">Mã đơn thuốc:</p>
                <p class="font-mono font-bold text-sm">${prescription.id}</p>
                <img src="https://quickchart.io/qr?text=${encodeURIComponent(prescription.id)}&size=250"
                     alt="QR Code tra cứu đơn thuốc"
                     class="qr-code mt-1 mx-auto"
                     onerror="this.onerror=null;this.src='https://placehold.co/60x60/e2e8f0/333?text=QR+Error';">
            </div>
        </header>

        <!-- TIÊU ĐỀ ĐƠN THUỐC -->
        <div class="text-center my-4">
            <h1 class="font-bold uppercase" style="font-size: 18px;">ĐƠN THUỐC</h1>
        </div>

        <!-- PHẦN THÔNG TIN BỆNH NHÂN -->
        <section class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-4">
            <div><strong>Họ và tên:</strong> ${prescription.patientName ? prescription.patientName.toUpperCase() : 'N/A'}</div>
            <div><strong>Ngày sinh:</strong> ${patientBirthDate} (${patientAge} tuổi)</div>
            <div><strong>Giới tính:</strong> ${formatGender(prescription.patientGender)}</div>
            <div><strong>Số CCCD:</strong> ${prescription.patientId || 'N/A'}</div>
            <div><strong>Cân nặng:</strong> ${prescription.patientWeight ? `${prescription.patientWeight} kg` : 'N/A'}</div>
            <div><strong>Số thẻ BHYT:</strong> N/A</div>
            <div class="col-span-2"><strong>Địa chỉ:</strong> ${prescription.patientAddress || 'N/A'}</div>
            <div class="col-span-2 bg-gray-100 p-2 rounded-md mt-2">
                <strong style="color: #dc2626; font-size: 11px;">
                    Đánh giá: ${prescription.diagnosis || 'Chưa có đánh giá'}
                </strong>
            </div>
        </section>

        <!-- PHẦN KÊ ĐƠN THUỐC -->
        <section class="mt-3">
            <table class="w-full border-collapse" style="font-size: 10px;">
                <thead class="bg-gray-100">
                    <tr>
                        <th class="border p-1 text-center font-semibold" style="width: 8%;">TT</th>
                        <th class="border p-1 text-left font-semibold" style="width: 35%;">Tên thuốc, nồng độ</th>
                        <th class="border p-1 text-center font-semibold" style="width: 10%;">ĐVT</th>
                        <th class="border p-1 text-center font-semibold" style="width: 8%;">SL</th>
                        <th class="border p-1 text-left font-semibold" style="width: 39%;">Liều dùng - Cách dùng</th>
                    </tr>
                </thead>
                <tbody>
                    ${medicationRows}
                </tbody>
            </table>
        </section>

        <!-- LỜI DẶN CỦA CHUYÊN VIÊN -->
        ${prescription.doctorNotes ? `
        <section class="mt-3" style="font-size: 10px;">
            <p><strong>Lời dặn của chuyên viên:</strong></p>
            <ul class="list-disc list-inside pl-3 mt-1">
                ${formatDoctorNotes(prescription.doctorNotes)}
            </ul>
        </section>
        ` : ''}

        <!-- PHẦN CUỐI: Ngày tháng, chữ ký -->
        <footer class="mt-4 pt-3">
            <div class="flex justify-between items-start">
                <!-- Thông tin người nhận thuốc -->
                <div class="text-center w-1/2" style="font-size: 10px;">
                    <p class="font-semibold">Người nhận thuốc/Người nhà</p>
                    <p style="font-size: 8px; font-style: italic;">(Ký, ghi rõ họ tên)</p>
                    <div style="height: 40px;"></div> <!-- Khoảng trống để ký tên -->
                </div>

                <!-- Thông tin chuyên viên kê đơn -->
                <div class="text-center w-1/2" style="font-size: 10px;">
                    <p style="font-style: italic;">${formattedDate}</p>
                    <p class="font-semibold mt-1">Chuyên viên kê đơn</p>
                    <div style="height: 30px; display: flex; align-items: center; justify-content: center;">
                        <!-- Đây là nơi hiển thị thông tin chữ ký số đã được xác thực -->
                        <span style="font-style: italic; color: #16a34a;">-- Đã ký số --</span>
                    </div>
                    <p class="font-bold" style="font-size: 11px;">${prescription.doctorName ? prescription.doctorName.toUpperCase() : 'N/A'}</p>
                    ${prescription.doctorLicense ? `<p style="font-size: 8px;">Số GPHN: ${prescription.doctorLicense}</p>` : ''}
                </div>
            </div>
            ${prescription.nextAppointment ? `
            <div class="mt-2 text-center" style="font-size: 8px; color: #6b7280;">
                <p><strong>Hẹn tái khám:</strong> ${formatDate(prescription.nextAppointment)}</p>
                <p class="mt-1">Vui lòng mang theo đơn này khi tái khám.</p>
            </div>
            ` : `
            <div class="mt-2 text-center" style="font-size: 8px; color: #6b7280;">
                <p><strong>Hẹn tái khám:</strong> Theo chỉ định của chuyên viên hoặc khi cần chăm sóc thêm.</p>
                <p class="mt-1">Vui lòng mang theo đơn này khi tái khám.</p>
            </div>
            `}
        </footer>
    </div>
</body>
</html>
  `;
}

export function printPrescription(prescription: Prescription): void {
  const htmlContent = generatePrescriptionHTML(prescription);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    // Không tự động in, chỉ hiển thị trang để người dùng xem trước
  }
}

import * as XLSX from 'xlsx';

export interface ExcelTemplateConfig {
  includeExamples?: boolean;
  includeInstructions?: boolean;
}

/**
 * Generate Excel template for medication import
 */
export function generateMedicationExcelTemplate(config: ExcelTemplateConfig = {}): ArrayBuffer {
  const { includeExamples = true, includeInstructions = true } = config;

  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Define column headers (Vietnamese with spaces for user-friendly)
  const headers = [
    'Tên thuốc',
    'Hoạt chất', 
    'Hàm lượng',
    'Dạng bào chế',
    'Đơn vị tính',
    'Nhà sản xuất',
    'Nước sản xuất',
    'Số đăng ký',
    'Nhà cung cấp',
    'Giá nhập',
    'Giá bán',
    'Vị trí kho',
    'Ngưỡng tồn kho',
    'Số lô',
    'Ngày hết hạn',
    'Tồn kho'
  ];

  // Create worksheet data
  const worksheetData: any[][] = [];

  // Add instructions if requested
  if (includeInstructions) {
    worksheetData.push(['HƯỚNG DẪN NHẬP LIỆU THUỐC']);
    worksheetData.push(['']);
    worksheetData.push(['1. Điền đầy đủ thông tin vào các cột bên dưới']);
    worksheetData.push(['2. Các cột bắt buộc: Tên thuốc, Hoạt chất, Đơn vị tính, Nhà sản xuất, Số lô, Ngày hết hạn, Tồn kho']);
    worksheetData.push(['3. Định dạng ngày hết hạn: DD/MM/YYYY (VD: 31/12/2025)']);
    worksheetData.push(['4. Giá nhập/bán: chỉ nhập số, không có dấu phẩy (VD: 15000)']);
    worksheetData.push(['5. Sau khi hoàn thành, lưu file dưới dạng CSV (UTF-8) để upload']);
    worksheetData.push(['']);
    worksheetData.push(['BẢNG DỮ LIỆU:']);
    worksheetData.push(['']);
  }

  // Add headers
  worksheetData.push(headers);

  // Add example data if requested
  if (includeExamples) {
    const exampleData = [
      [
        'Paracetamol 500mg',
        'Paracetamol',
        '500mg',
        'Viên nén',
        'Viên',
        'Công ty TNHH Dược phẩm Traphaco',
        'Việt Nam',
        'VD-18533-15',
        'Công ty CP Dược phẩm Hà Tây',
        1200,
        1800,
        'Tủ A - Kệ 1 - Ngăn 2',
        50,
        'B0123',
        '31/12/2025',
        150
      ],
      [
        'Amoxicillin 250mg',
        'Amoxicillin',
        '250mg',
        'Viên nang',
        'Viên',
        'Công ty CP Dược Hậu Giang',
        'Việt Nam',
        'VD-19284-16',
        'Công ty CP Dược phẩm Hà Tây',
        2500,
        3500,
        'Tủ B - Kệ 2 - Ngăn 1',
        30,
        'B0124',
        '15/11/2025',
        80
      ],
      [
        'Vitamin C 1000mg',
        'Acid ascorbic',
        '1000mg',
        'Viên sủi',
        'Viên',
        'Công ty TNHH Dược phẩm Imexpharm',
        'Việt Nam',
        'VD-20156-17',
        'Công ty CP Dược phẩm Miền Nam',
        800,
        1200,
        'Tủ C - Kệ 1 - Ngăn 3',
        100,
        'B0125',
        '20/03/2026',
        200
      ]
    ];

    exampleData.forEach(row => worksheetData.push(row));
  }

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths
  const columnWidths = [
    { wch: 25 }, // Tên thuốc
    { wch: 20 }, // Hoạt chất
    { wch: 12 }, // Hàm lượng
    { wch: 15 }, // Dạng bào chế
    { wch: 12 }, // Đơn vị tính
    { wch: 30 }, // Nhà sản xuất
    { wch: 15 }, // Nước sản xuất
    { wch: 15 }, // Số đăng ký
    { wch: 30 }, // Nhà cung cấp
    { wch: 12 }, // Giá nhập
    { wch: 12 }, // Giá bán
    { wch: 20 }, // Vị trí kho
    { wch: 15 }, // Ngưỡng tồn kho
    { wch: 12 }, // Số lô
    { wch: 15 }, // Ngày hết hạn
    { wch: 12 }  // Tồn kho
  ];
  worksheet['!cols'] = columnWidths;

  // Style the header row
  const headerRowIndex = includeInstructions ? 10 : 0; // Adjust based on instructions
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  // Apply styles to header row
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: col });
    if (!worksheet[cellAddress]) continue;
    
    worksheet[cellAddress].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '4472C4' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      }
    };
  }

  // Style instruction rows
  if (includeInstructions) {
    // Title row
    const titleCell = worksheet['A1'];
    if (titleCell) {
      titleCell.s = {
        font: { bold: true, size: 14, color: { rgb: '1F4E79' } },
        alignment: { horizontal: 'center' }
      };
    }

    // Instruction rows styling
    for (let row = 2; row <= 7; row++) {
      const cellAddress = `A${row + 1}`;
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { color: { rgb: '7F7F7F' } },
          alignment: { horizontal: 'left' }
        };
      }
    }
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách thuốc');

  // Create a second sheet with field descriptions
  const descriptionData = [
    ['TÊN CỘT', 'MÔ TẢ', 'VÍ DỤ', 'BẮT BUỘC'],
    ['Tên thuốc', 'Tên thương mại của thuốc', 'Paracetamol 500mg', 'Có'],
    ['Hoạt chất', 'Thành phần hoạt chất chính', 'Paracetamol', 'Có'],
    ['Hàm lượng', 'Nồng độ hoạt chất', '500mg, 250mg/5ml', 'Không'],
    ['Dạng bào chế', 'Hình thức thuốc', 'Viên nén, Viên nang, Dung dịch', 'Không'],
    ['Đơn vị tính', 'Đơn vị tính cơ bản', 'Viên, Vỉ, Hộp, Chai', 'Có'],
    ['Nhà sản xuất', 'Công ty sản xuất thuốc', 'Công ty TNHH Dược phẩm Traphaco', 'Có'],
    ['Nước sản xuất', 'Quốc gia sản xuất', 'Việt Nam, Pháp, Đức', 'Không'],
    ['Số đăng ký', 'Số đăng ký lưu hành', 'VD-18533-15', 'Không'],
    ['Nhà cung cấp', 'Công ty cung cấp thuốc', 'Công ty CP Dược phẩm Hà Tây', 'Không'],
    ['Giá nhập', 'Giá nhập vào (VNĐ)', '15000', 'Không'],
    ['Giá bán', 'Giá bán ra (VNĐ)', '22000', 'Không'],
    ['Vị trí kho', 'Vị trí lưu trữ trong kho', 'Tủ A - Kệ 1 - Ngăn 2', 'Không'],
    ['Ngưỡng tồn kho', 'Số lượng tối thiểu cảnh báo', '50', 'Không'],
    ['Số lô', 'Số lô sản xuất', 'B0123', 'Có'],
    ['Ngày hết hạn', 'Ngày hết hạn sử dụng', '31/12/2025', 'Có'],
    ['Tồn kho', 'Số lượng hiện có', '150', 'Có']
  ];

  const descriptionSheet = XLSX.utils.aoa_to_sheet(descriptionData);
  
  // Set column widths for description sheet
  descriptionSheet['!cols'] = [
    { wch: 20 }, // Tên cột
    { wch: 40 }, // Mô tả
    { wch: 30 }, // Ví dụ
    { wch: 12 }  // Bắt buộc
  ];

  // Style description sheet header
  for (let col = 0; col < 4; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (descriptionSheet[cellAddress]) {
      descriptionSheet[cellAddress].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '70AD47' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }
  }

  XLSX.utils.book_append_sheet(workbook, descriptionSheet, 'Hướng dẫn');

  // Convert to array buffer
  const excelBuffer = XLSX.write(workbook, { 
    bookType: 'xlsx', 
    type: 'array',
    cellStyles: true 
  });

  return excelBuffer;
}

/**
 * Download Excel template file
 */
export function downloadMedicationExcelTemplate(config?: ExcelTemplateConfig): void {
  try {
    const buffer = generateMedicationExcelTemplate(config);
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Mau_Nhap_Thuoc_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('Error generating Excel template:', error);
    throw new Error('Không thể tạo file Excel template');
  }
}

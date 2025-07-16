/**
 * Script để tạo cấu trúc bảng SpaServices trong Google Sheets
 * Chạy script này để thêm header và dữ liệu mẫu vào bảng SpaServices
 */

function setupSpaServicesSheet() {
  // Lấy spreadsheet hiện tại
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Tìm hoặc tạo sheet SpaServices
  let sheet = spreadsheet.getSheetByName('SpaServices');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('SpaServices');
  }
  
  // Xóa dữ liệu cũ nếu có
  sheet.clear();
  
  // Tạo header cho bảng SpaServices
  const headers = [
    'id',
    'name',
    'category',
    'description',
    'duration',
    'price',
    'discountPrice',
    'requiredStaff',
    'equipment',
    'roomType',
    'preparationTime',
    'cleanupTime',
    'maxCapacity',
    'ageRestriction',
    'contraindications',
    'benefits',
    'aftercareInstructions',
    'isActive',
    'imageUrl',
    'createdAt',
    'updatedAt'
  ];
  
  // Thêm header vào hàng đầu tiên
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // Tự động điều chỉnh độ rộng cột
  sheet.autoResizeColumns(1, headers.length);
  
  // Đóng băng hàng header
  sheet.setFrozenRows(1);
  
  console.log('✅ Đã tạo cấu trúc bảng SpaServices thành công!');
  
  return sheet;
}

function addSpaServicesData() {
  const sheet = setupSpaServicesSheet();
  
  // Dữ liệu mẫu cho SpaServices
  const spaServicesData = [
    [
      'SPA001',
      'Massage Thư Giãn Toàn Thân',
      'Massage',
      'Massage thư giãn toàn thân với tinh dầu thiên nhiên, giúp giảm căng thẳng và mệt mỏi',
      90,
      450000,
      380000,
      'Kỹ thuật viên',
      'Giường massage, Tinh dầu thư giãn, Khăn ấm',
      'Phòng massage',
      10,
      15,
      1,
      'Từ 16 tuổi trở lên',
      'Phụ nữ có thai, Người có vết thương hở, Người bị sốt',
      'Giảm căng thẳng, Cải thiện tuần hoàn máu, Thư giãn cơ bắp',
      'Uống nhiều nước, nghỉ ngơi 30 phút sau massage',
      true,
      'https://placehold.co/400x300/spa-massage',
      '2024-07-27',
      '2024-07-27'
    ],
    [
      'SPA002',
      'Chăm Sóc Da Mặt Cơ Bản',
      'Facial',
      'Làm sạch sâu, tẩy tế bào chết và dưỡng ẩm cho da mặt',
      60,
      280000,
      '',
      'Chuyên viên',
      'Máy hút mụn, Mặt nạ dưỡng da, Serum vitamin C',
      'Phòng facial',
      5,
      10,
      1,
      'Từ 14 tuổi trở lên',
      'Da bị viêm nhiễm nặng, Dị ứng mỹ phẩm',
      'Làm sạch sâu lỗ chân lông, Cải thiện độ ẩm da, Làm mịn da',
      'Tránh ánh nắng mặt trời 24h, sử dụng kem chống nắng',
      true,
      'https://placehold.co/400x300/facial-care',
      '2024-07-27',
      '2024-07-27'
    ],
    [
      'SPA003',
      'Tẩy Tế Bào Chết Toàn Thân',
      'Body Treatment',
      'Tẩy tế bào chết toàn thân bằng muối biển và tinh dầu tự nhiên',
      45,
      320000,
      280000,
      'Kỹ thuật viên',
      'Muối tẩy tế bào chết, Tinh dầu dưỡng da, Găng tay massage',
      'Phòng body treatment',
      5,
      15,
      1,
      'Từ 16 tuổi trở lên',
      'Da bị tổn thương, Dị ứng muối biển',
      'Loại bỏ tế bào chết, Làm mềm da, Cải thiện tuần hoàn',
      'Dưỡng ẩm da trong 24h, tránh tắm nước quá nóng',
      true,
      'https://placehold.co/400x300/body-scrub',
      '2024-07-27',
      '2024-07-27'
    ],
    [
      'SPA004',
      'Manicure Cơ Bản',
      'Nail Care',
      'Chăm sóc móng tay cơ bản, cắt tỉa, đánh bóng và sơn móng',
      30,
      150000,
      '',
      'Kỹ thuật viên',
      'Bộ dụng cụ manicure, Sơn móng, Dầu dưỡng móng',
      'Phòng nail',
      5,
      10,
      1,
      'Không giới hạn',
      'Nhiễm trùng móng, Vết thương ở tay',
      'Móng tay đẹp, Vệ sinh móng, Thư giãn',
      'Tránh làm việc nặng trong 2h đầu',
      true,
      'https://placehold.co/400x300/manicure',
      '2024-07-27',
      '2024-07-27'
    ],
    [
      'SPA005',
      'Pedicure Cơ Bản',
      'Nail Care',
      'Chăm sóc móng chân, ngâm chân thư giãn và massage bàn chân',
      45,
      180000,
      '',
      'Kỹ thuật viên',
      'Chậu ngâm chân, Bộ dụng cụ pedicure, Kem massage chân',
      'Phòng nail',
      10,
      15,
      1,
      'Không giới hạn',
      'Nhiễm trùng móng chân, Vết thương ở chân',
      'Móng chân đẹp, Thư giãn bàn chân, Cải thiện tuần hoàn',
      'Giữ chân khô ráo, mang giày thoáng khí',
      true,
      'https://placehold.co/400x300/pedicure',
      '2024-07-27',
      '2024-07-27'
    ],
    [
      'SPA006',
      'Massage Đá Nóng',
      'Massage',
      'Massage thư giãn với đá nóng tự nhiên, giúp giãn cơ sâu',
      75,
      520000,
      '',
      'Chuyên viên',
      'Đá nóng basalt, Tinh dầu massage, Máy hâm đá',
      'Phòng massage VIP',
      15,
      20,
      1,
      'Từ 18 tuổi trở lên',
      'Phụ nữ có thai, Người có bệnh tim, Huyết áp cao',
      'Giãn cơ sâu, Giảm đau nhức, Thư giãn tâm trí',
      'Uống nhiều nước, tránh tắm nước lạnh trong 2h',
      true,
      'https://placehold.co/400x300/hot-stone',
      '2024-07-27',
      '2024-07-27'
    ],
    [
      'SPA007',
      'Điều Trị Mụn Chuyên Sâu',
      'Facial',
      'Điều trị mụn chuyên sâu với công nghệ hiện đại',
      90,
      450000,
      '',
      'Chuyên viên',
      'Máy điều trị mụn, Serum trị mụn, Mặt nạ kháng viêm',
      'Phòng điều trị',
      10,
      15,
      1,
      'Từ 16 tuổi trở lên',
      'Da quá nhạy cảm, Đang dùng thuốc trị mụn',
      'Giảm mụn hiệu quả, Thu nhỏ lỗ chân lông, Cải thiện da',
      'Tránh ánh nắng, không chạm tay vào mặt 24h',
      true,
      'https://placehold.co/400x300/acne-treatment',
      '2024-07-27',
      '2024-07-27'
    ],
    [
      'SPA008',
      'Gội Đầu Massage Thư Giãn',
      'Hair Care',
      'Gội đầu với massage da đầu thư giãn, sử dụng dầu gội thảo dược',
      30,
      120000,
      '',
      'Kỹ thuật viên',
      'Dầu gội thảo dược, Tinh dầu massage đầu',
      'Phòng gội đầu',
      5,
      10,
      1,
      'Không giới hạn',
      'Da đầu bị viêm nhiễm, Dị ứng dầu gội',
      'Thư giãn da đầu, Cải thiện tuần hoàn máu, Tóc mềm mượt',
      'Tránh gội đầu trong 12h tiếp theo',
      true,
      'https://placehold.co/400x300/hair-wash',
      '2024-07-27',
      '2024-07-27'
    ]
  ];
  
  // Thêm dữ liệu vào sheet
  if (spaServicesData.length > 0) {
    const dataRange = sheet.getRange(2, 1, spaServicesData.length, spaServicesData[0].length);
    dataRange.setValues(spaServicesData);
    
    // Format dữ liệu
    // Format cột giá (price và discountPrice)
    const priceRange = sheet.getRange(2, 6, spaServicesData.length, 2); // Cột F và G
    priceRange.setNumberFormat('#,##0" ₫"');
    
    // Format cột thời gian (duration, preparationTime, cleanupTime)
    const timeRange1 = sheet.getRange(2, 5, spaServicesData.length, 1); // Cột E (duration)
    const timeRange2 = sheet.getRange(2, 11, spaServicesData.length, 2); // Cột K và L
    timeRange1.setNumberFormat('0" phút"');
    timeRange2.setNumberFormat('0" phút"');
    
    // Format cột boolean (isActive)
    const booleanRange = sheet.getRange(2, 18, spaServicesData.length, 1); // Cột R
    booleanRange.setHorizontalAlignment('center');
    
    // Tự động điều chỉnh độ rộng cột
    sheet.autoResizeColumns(1, 21);
  }
  
  console.log(`✅ Đã thêm ${spaServicesData.length} dịch vụ spa mẫu vào bảng!`);
  
  // Hiển thị thông báo thành công
  SpreadsheetApp.getUi().alert(
    'Thành công!',
    `Đã tạo bảng SpaServices với ${spaServicesData.length} dịch vụ mẫu.\n\n` +
    'Các danh mục dịch vụ:\n' +
    '• Massage (2 dịch vụ)\n' +
    '• Facial (2 dịch vụ)\n' +
    '• Body Treatment (1 dịch vụ)\n' +
    '• Nail Care (2 dịch vụ)\n' +
    '• Hair Care (1 dịch vụ)',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Hàm để chạy setup hoàn chỉnh
 * Chạy hàm này để tạo bảng và thêm dữ liệu mẫu
 */
function runSpaServicesSetup() {
  try {
    addSpaServicesData();
  } catch (error) {
    console.error('❌ Lỗi khi setup bảng SpaServices:', error);
    SpreadsheetApp.getUi().alert(
      'Lỗi!',
      'Có lỗi xảy ra khi tạo bảng SpaServices: ' + error.toString(),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}
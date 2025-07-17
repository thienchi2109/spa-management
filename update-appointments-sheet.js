/**
 * Script để cập nhật sheet Appointments với cột services mới
 * Chạy script này trong Google Apps Script Editor
 */

function updateAppointmentsSheet() {
  // Lấy spreadsheet hiện tại
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Tìm sheet Appointments
  let sheet = spreadsheet.getSheetByName('Appointments');
  if (!sheet) {
    console.log('❌ Không tìm thấy sheet Appointments');
    return;
  }
  
  console.log('📋 Đang cập nhật sheet Appointments...');
  
  // Lấy header row hiện tại
  const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  const currentHeaders = headerRange.getValues()[0];
  
  console.log('📝 Headers hiện tại:', currentHeaders);
  
  // Headers mới theo đúng thứ tự
  const newHeaders = [
    'id', 
    'patientName', 
    'doctorName', 
    'schedulerName', 
    'date', 
    'startTime', 
    'endTime', 
    'status', 
    'services',  // Cột mới
    'notes'
  ];
  
  // Kiểm tra xem cột services đã tồn tại chưa
  const servicesIndex = currentHeaders.indexOf('services');
  
  if (servicesIndex !== -1) {
    console.log('✅ Cột services đã tồn tại tại vị trí:', servicesIndex + 1);
    
    // Kiểm tra xem thứ tự có đúng không
    const expectedIndex = 8; // services should be at index 8 (column I)
    if (servicesIndex === expectedIndex) {
      console.log('✅ Cột services đã ở đúng vị trí');
      return;
    } else {
      console.log('⚠️ Cột services ở sai vị trí, cần sắp xếp lại');
    }
  }
  
  // Backup dữ liệu hiện tại
  const dataRange = sheet.getDataRange();
  const allData = dataRange.getValues();
  
  console.log('💾 Đã backup dữ liệu:', allData.length, 'rows');
  
  // Xóa toàn bộ sheet
  sheet.clear();
  
  // Tạo header mới
  const headerRange2 = sheet.getRange(1, 1, 1, newHeaders.length);
  headerRange2.setValues([newHeaders]);
  
  // Format header
  headerRange2.setFontWeight('bold');
  headerRange2.setBackground('#f0f0f0');
  
  console.log('📋 Đã tạo headers mới:', newHeaders);
  
  // Nếu có dữ liệu cũ, migrate sang format mới
  if (allData.length > 1) {
    console.log('🔄 Đang migrate dữ liệu...');
    
    const oldHeaders = allData[0];
    const oldData = allData.slice(1);
    
    // Tạo mapping từ old headers sang new headers
    const columnMapping = {};
    oldHeaders.forEach((header, index) => {
      columnMapping[header] = index;
    });
    
    // Migrate từng row
    const newData = oldData.map(row => {
      const newRow = new Array(newHeaders.length).fill('');
      
      newHeaders.forEach((header, newIndex) => {
        const oldIndex = columnMapping[header];
        if (oldIndex !== undefined && row[oldIndex] !== undefined) {
          newRow[newIndex] = row[oldIndex];
        } else if (header === 'services') {
          // Cột services mới, để trống hoặc giá trị mặc định
          newRow[newIndex] = '';
        }
      });
      
      return newRow;
    });
    
    // Ghi dữ liệu mới
    if (newData.length > 0) {
      const dataRange2 = sheet.getRange(2, 1, newData.length, newHeaders.length);
      dataRange2.setValues(newData);
      console.log('✅ Đã migrate', newData.length, 'rows dữ liệu');
    }
  }
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, newHeaders.length);
  
  console.log('🎉 Hoàn thành cập nhật sheet Appointments!');
  console.log('📊 Cấu trúc mới:');
  newHeaders.forEach((header, index) => {
    console.log(`  ${index + 1}. ${header}`);
  });
}

// Chạy function
updateAppointmentsSheet();

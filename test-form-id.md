# Test Form ID Functionality

## Các bước test chức năng form_id

### 1. Test tạo form mới
1. Chạy ứng dụng: `npm run dev`
2. Truy cập `/form` để tạo form mới
3. Điền đầy đủ thông tin form
4. Submit form
5. Kiểm tra trong database xem form_id có được tạo tự động không (format: Country-YYYYMMDDHHMMSS)

### 2. Test hiển thị form_id
1. Truy cập `/user/dashboard` 
2. Kiểm tra cột "Form ID" có hiển thị trong bảng không
3. Click "View" để xem chi tiết form
4. Kiểm tra Form ID có hiển thị trong modal chi tiết không

### 3. Test admin dashboard
1. Truy cập `/admin/dashboard`
2. Kiểm tra cột "Form ID" có hiển thị trong bảng không
3. Click "View" để xem chi tiết form
4. Kiểm tra Form ID có hiển thị trong modal chi tiết không

### 4. Test export Excel
1. Trong admin dashboard, click "Export Excel"
2. Mở file Excel đã tải về
3. Kiểm tra cột "Form ID" có trong file Excel không

### 5. Test với các operator khác nhau
Tạo form với các operator khác nhau để kiểm tra form_id được tạo đúng format:
- Bitel (Peru) → Peru-YYYYMMDDHHMMSS
- Lumitel (Burundi) → Burundi-YYYYMMDDHHMMSS
- Movitel (Mozambique) → Mozambique-YYYYMMDDHHMMSS

## Kết quả mong đợi
- Form_id được tạo tự động khi submit form mới
- Form_id hiển thị đúng format: Country-YYYYMMDDHHMMSS
- Form_id hiển thị trong tất cả các view (user dashboard, admin dashboard, modal chi tiết, export Excel)
- Không có lỗi TypeScript hoặc runtime error

# UI-06: Tài liệu Thiết kế Giao diện Chi tiết (Screen Design Specification)

**Dự án**: Nông Lạc Digital Farm Platform  
**Phiên bản**: 1.0.0  
**Tác giả**: Gemini Notebook Engine  
**Trạng thái**: Official Technical Specification  

---

## 1. TỔNG QUAN VÀ NGUYÊN TẮC THIẾT KẾ GIAO DIỆN

Bộ thiết kế giao diện hệ thống Nông Lạc được xây dựng nhằm hiện thực hóa bản sao số (Digital Twin) nông nghiệp và nền tảng truy xuất nguồn gốc minh bạch. Thiết kế giao diện tuân thủ nghiêm ngặt **5 Nguyên tắc cốt lõi**:

1. **Location First**: Mọi thao tác và góc nhìn dữ liệu đều bắt đầu từ vị trí địa lý trong cây phân cấp (`Farm -> Zone -> Field -> Bed -> Row -> Plant`).
2. **Event First**: Giao diện tập trung vào việc ghi nhận hoạt động (tưới, bón phân, phun thuốc, thu hoạch) theo thời gian thực.
3. **Evidence First**: Bắt buộc đính kèm bằng chứng trực quan (GPS-stamped Photo/Video, QR Code) ở mọi form nhập liệu.
4. **Automation First**: Tối đa hóa tự động điền dữ liệu, quét QR Code, định vị GPS tự động và gợi ý thông minh để giảm thiểu gõ phím.
5. **Human Friendly**: Giao diện di động tối ưu cho nông dân ngoài đồng ruộng (nút bấm to, tương phản cao, thao tác 1-Tap) và giao diện Web trực quan cho quản lý.

---

## 2. PHÂN HỆ MOBILE APP (NÔNG DÂN & CÔNG NHÂN)

---

### MH-01: Đăng nhập & Xác thực Offline (Login & Auth)

#### a. Wireframe Layout (ASCII)
```
+-----------------------------------+
|            NÔNG LẠC               |
|      [ Logo Nông Lạc Farm ]       |
|  Digital Farm & Traceability Platform |
+-----------------------------------+
|  [ SĐT / Mã định danh       ]     |
|  [ Mật khẩu / PIN (4 số)    ]     |
|                                   |
|  (x) Ghi nhớ đăng nhập Offline   |
|                                   |
|  +-----------------------------+  |
|  |     [ ĐĂNG NHẬP 4G/WIFI ]   |  |
|  +-----------------------------+  |
|  |     [ VÀO CHẾ ĐỘ OFFLINE ]  |  |
|  +-----------------------------+  |
|                                   |
|  [!] Thiết bị có 12 nhật ký offline |
|      chưa đồng bộ về hệ thống.    |
+-----------------------------------+
```

#### b. Danh sách UI Components
* `HeaderLogo`: Logo vector Nông Lạc + Subtitle.
* `InputPhone`: Input text dạng số, tích hợp validation SĐT Việt Nam.
* `InputPIN`: Input mã PIN 4-6 số bảo mật, ẩn kí tự.
* `CheckboxOffline`: Checkbox lưu token JWT vào SecureStore trên điện thoại.
* `BtnOnlineLogin`: Button chính màu xanh lá tươi (Primary Brand Color).
* `BtnOfflineMode`: Button phụ viền xám, cho phép vào thẳng ứng dụng bằng Token đã cache.
* `SyncBadgeAlert`: Thẻ cảnh báo số lượng dữ liệu `PENDING_SYNC` còn đọng trên máy.

#### c. Các trạng thái màn hình (Screen States)
* **Loading**: Spinner xoay nhẹ tại `BtnOnlineLogin`, disable các input.
* **Error**: Khung thông báo đỏ: *"Sai SĐT hoặc mã PIN. Vui lòng thử lại!"* hoặc *"Không có kết nối mạng. Hãy chọn Đăng nhập Offline!"*
* **Empty**: Các ô input rỗng, hiển thị placeholder hướng dẫn.
* **Offline**: Tự động làm sáng nút `[VÀO CHẾ ĐỘ OFFLINE]`, ẩn nút Đăng nhập Online nếu không tìm thấy mạng.

#### d. Luồng tương tác (Interaction Flow)
1. Người dùng mở app -> App kiểm tra kết nối mạng và Token trong SecureStore.
2. Nếu có mạng: Nhập SĐT/PIN -> Bấm `ĐĂNG NHẬP` -> Gọi API `/api/v1/auth/login` -> Lưu AccessToken/RefreshToken -> Chuyển sang **MH-02**.
3. Nếu mất mạng: Bấm `VÀO CHẾ ĐỘ OFFLINE` -> Kiểm tra RefreshToken hợp lệ trong local WatermelonDB -> Chuyển trực tiếp sang **MH-02** với cờ `isOfflineMode = true`.

---

### MH-02: Trang chủ Công việc (Today's Tasks Dashboard)

#### a. Wireframe Layout (ASCII)
```
+-----------------------------------+
|  [Avatar] Ngô Văn An    [Offline ⚡3]|
|  Trang trại: Nông Lạc Dalat Zone A|
+-----------------------------------+
|  TỔNG QUAN HÔM NAY (22/09)        |
|  +--------+  +--------+  +--------+ |
|  | Cần làm|  |Đã xong |  | Chờ sync| |
|  |   05   |  |   12   |  |   03   | |
|  +--------+  +--------+  +--------+ |
+-----------------------------------+
| LỌC THEO KHU VỰC: [Tất cả Thửa  v]|
+-----------------------------------+
| DANH SÁCH CÔNG VIỆC:              |
| [!] ⚡ CẢNH BÁO: Bón phân Luống B2 |
|     Thửa 01 - Ưu tiên cao - 08:00 |
|                                   |
| [ ] Tưới nước tự động Luống A1    |
|     Thửa 01 - Đang tiến hành      |
|                                   |
| [x] Thu hoạch Dâu tây Luống C5    |
|     Thửa 02 - Hoàn thành 07:30    |
+-----------------------------------+
|    [ 📷 QUÉT QR / GPS ĐỊNH VỊ ]   | (Floating Button)
+-----------------------------------+
| [Trang chủ]  [Nhật ký]  [Đồng bộ] | (Bottom Nav)
+-----------------------------------+
```

#### b. Danh sách UI Components
* `TopUserInfo`: Avatar, Tên công nhân, Tên nông trại, Badge trạng thái kết nối mạng + Số bản ghi chưa sync.
* `KPIStatCards`: 3 thẻ đếm số lượng công việc (Cần làm, Đã xong, Chờ đồng bộ).
* `FilterDropdown`: Dropdown chọn lọc nhanh theo `Zone` hoặc `Field`.
* `TaskList`: Card danh sách công việc có Tag màu độ ưu tiên (Đỏ: Cao, Vàng: Trung bình, Xanh: Thấp).
* `FABScan`: Nút tròn nổi kích thước lớn (64x64px) màu xanh nhô cao giữa màn hình để quét QR nhanh.
* `BottomNavBar`: Thanh điều hướng 3 tab cố định ở đáy ứng dụng.

#### c. Các trạng thái màn hình (Screen States)
* **Loading**: Skeleton Loading cho 3 thẻ KPI và 5 dòng TaskList.
* **Error**: Thẻ Error Retry màu xám: *"Không thể tải danh sách công việc trực tuyến. Đang hiển thị dữ liệu Offline gần nhất!"*
* **Empty**: Thẻ minh họa hoạt họa: *"Chúc mừng! Bạn đã hoàn thành tất cả công việc hôm nay!"*
* **Offline**: Biểu tượng ⚡ vàng sáng lên trên góc phải, dữ liệu được đọc trực tiếp từ SQLite/WatermelonDB cục bộ.

#### d. Luồng tương tác (Interaction Flow)
1. Chạm vào bất kỳ thẻ Công việc -> Chuyển hướng sang **MH-04** với dữ liệu công việc được điền sẵn.
2. Chạm vào nút nổi `[📷 QUÉT QR / GPS ĐỊNH VỊ]` -> Chuyển trực tiếp sang **MH-03**.
3. Vuốt nhẹ màn hình từ trên xuống (Pull-to-refresh) -> Kích hoạt Sync Engine ngầm nếu có Wifi/4G.

---

### MH-03: Quét QR & GPS Định vị Nhanh (Fast Location Scan)

#### a. Wireframe Layout (ASCII)
```
+-----------------------------------+
| [<- Quay lại]    [Flash 💡]       |
+-----------------------------------+
|                                   |
|         +---------------+         |
|         | |           | |         |
|         |   Khung quét  |         |
|         |    QR Code    |         |
|         | |           | |         |
|         +---------------+         |
|                                   |
|     Đang quét mã QR thực thể...   |
+-----------------------------------+
| KẾT QUẢ ĐỊNH VỊ TỰ ĐỘNG:          |
| 📍 GPS: 11.94041, 108.45831 (±3m) |
| 🏷️ Mã nhận dạng: NL-DL-Z1-F2-B05  |
| 🌿 Vị trí: Luống 05 - Thửa 02     |
| [x] Khớp vị trí trên bản đồ số    |
+-----------------------------------+
|    [ XÁC NHẬN VỊ TRÍ NÀY ]        |
+-----------------------------------+
```

#### b. Danh sách UI Components
* `CameraViewfinder`: Màn hình Camera full-width với hiệu ứng tia laser đỏ quét ngang.
* `FlashToggle`: Nút bật/tắt đèn Flash hỗ trợ quét thiếu sáng ngoài đồng.
* `GPSLiveBadge`: Thẻ hiển thị độ chính xác GPS thời gian thực (độ lệch ±m).
* `EntityResultCard`: Thẻ thông tin thực thể quét được (Tên luống, Tên thửa, Mã định danh LTREE `path`).
* `BtnConfirmLocation`: Button xác nhận vị trí màu xanh lá để chuyển bước ghi nhật ký.

#### c. Các trạng thái màn hình (Screen States)
* **Loading**: Hiệu ứng sóng GPS đang tìm kiếm tọa độ.
* **Error**: Khung cảnh báo đỏ: *"Cảnh báo: Tọa độ GPS của bạn (cách 150m) không khớp với vị trí mã QR Luống 05. Vui lòng kiểm tra lại!"*
* **Empty**: *"Chưa phát hiện mã QR. Hãy đưa camera lại gần thẻ QR gắn tại đầu Luống/Cây!"*
* **Offline**: Ứng dụng giải mã QR chuỗi trực tiếp offline và đọc thông tin vị trí từ cơ sở dữ liệu SQLite trong máy.

#### d. Luồng tương tác (Interaction Flow)
1. Đưa camera vào mã QR gắn trên đầu luống/thân cây -> Máy rung nhẹ (Haptic Feedback) và phát tiếng kêu "Bíp".
2. Hệ thống đọc chuỗi `NL-DL-Z1-F2-B05` -> Tra cứu trong local DB -> Lấy tọa độ GPS thiết bị hiện tại -> Khai báo thuộc tính `target_entity_id`.
3. Nhấp `[XÁC NHẬN VỊ TRÍ NÀY]` -> Tự động chuyển thẳng sang **MH-04** với thuộc tính Vị trí đã được khóa cố định.

---

### MH-04: Form Ghi nhận Nhật ký 1-Tap (1-Tap Activity Form)

#### a. Wireframe Layout (ASCII)
```
+-----------------------------------+
| [<-] GHI NHẬT KÝ CANH TÁC          |
| Vị trí: Luống 05 - Thửa 02 (Đã khóa)|
+-----------------------------------+
| 1. CHỌN LOẠI HOẠT ĐỘNG (1-TAP):   |
| [💧 Tưới]  [🌱 Bón phân] [💊 Thuốc]|
| [✂️ Tỉa cây] [🌾 Thu hoạch] [❓Khác] |
+-----------------------------------+
| 2. CHI TIẾT VẬT TƯ & SỐ LƯỢNG:    |
| Loạt vật tư: [ Phân NPK 16-16-8 v] |
| Số lượng:    [ 2.5 ] kg           |
+-----------------------------------+
| 3. BẰNG CHỨNG TRỰC QUAN (EVIDENCE)|
| +------------+  +------------+    |
| | 📷 [Ảnh 1] |  | 🎥 [Video] |    |
| | (GPS+Time) |  | (Tùy chọn) |    |
| +------------+  +------------+    |
+-----------------------------------+
| Ghi chú: [ Vừa tưới vừa bón lót..]|
+-----------------------------------+
|   [ 💾 LƯU NHẬT KÝ (OFFLINE) ]    |
+-----------------------------------+
```

#### b. Danh sách UI Components
* `ActivityTypeGrid`: Grid 6 nút tròn đường kính lớn có icon sinh động, chọn theo cơ chế 1-Tap (Single Select Highlight).
* `MaterialSelectDropdown`: Dropdown chọn vật tư nông nghiệp sẵn có trong kho nông trại.
* `QuantityInput`: Input dạng Numpad số lớn với đơn vị đo tự động (kg, lít, bao).
* `EvidencePicker`: Ô chụp ảnh/quay video trực tiếp từ ứng dụng (vô hiệu hóa chọn ảnh từ Gallery để chống gian lận).
* `BtnSaveActivity`: Button màu xanh lá lớn tràn viền ở cuối màn hình.

#### c. Các trạng thái màn hình (Screen States)
* **Loading**: Spinner hiển thị khi đang nén ảnh và gắn Watermark tọa độ GPS/Timestamp.
* **Error**: Viền đỏ ô ảnh: *"Bắt buộc phải chụp ít nhất 1 ảnh bằng chứng thực tế tại đồng ruộng!"*
* **Empty**: Mặc định chưa chọn loại hoạt động, ẩn phần chọn vật tư cho đến khi nhấp chọn loại hoạt động phù hợp.
* **Offline**: Hiển thị nhãn nút `[💾 LƯU NHẬT KÝ (OFFLINE)]`. Dữ liệu ghi thẳng vào bảng `cultivation_activities` nội bộ với cờ `sync_status = 'PENDING'`.

#### d. Luồng tương tác (Interaction Flow)
1. Nhấp chọn loại hoạt động (VD: `[🌱 Bón phân]`) -> Hiện khung chọn Phân bón và Nhập khối lượng.
2. Nhấp `📷 [Ảnh 1]` -> Mở camera chụp ảnh luống dâu -> Máy tự động chèn Watermark dòng chữ: `11.94041, 108.45831 - 2026-09-22 08:15:00`.
3. Bấm `[LƯU NHẬT KÝ]` -> Lưu thành công -> Phát âm thanh xác nhận -> Chuyển về **MH-02** kèm Toast Message *"Đã lưu nhật ký vào hàng đợi đồng bộ!"*.

---

### MH-05: Quản lý Đồng bộ Offline (Offline Queue Manager)

#### a. Wireframe Layout (ASCII)
```
+-----------------------------------+
| [<-] HÀNG ĐỘI ĐỒNG BỘ (QUEUE)     |
| Trạng thái mạng: [📶 4G Khỏe ]    |
+-----------------------------------+
| DUNG LƯỢNG CHỜ SYNC: 14.2 MB (3)  |
| Tiến trình: [=========>    ] 66%  |
+-----------------------------------+
| DANH SÁCH BẢN GHI CHỜ TẢI LÊN:   |
| 1. 🌱 Bón phân Luống B2           |
|    Lúc: 08:15 - 1 Ảnh (4.2 MB)    |
|    Trạng thái: [ Đang tải lên... ]|
|                                   |
| 2. 💧 Tưới nước Luống A1          |
|    Lúc: 07:45 - 1 Ảnh (3.8 MB)    |
|    Trạng thái: [ Chờ đến lượt   ] |
|                                   |
| 3. 🌾 Thu hoạch Dâu tây Luống C5  |
|    Lúc: 07:10 - 2 Ảnh (6.2 MB)    |
|    Trạng thái: [ x Lỗi kết nối  ] |
+-----------------------------------+
|     [ 🔄 ĐỒNG BỘ TẤT CẢ NGAY ]    |
+-----------------------------------+
```

#### b. Danh sách UI Components
* `NetworkStatusBanner`: Thanh trạng thái hiển thị cường độ mạng hiện tại (Wifi/4G/No Connection).
* `SyncProgressBar`: Thanh tiến trình phần trăm tổng dung lượng media đang đẩy lên Cloud Storage.
* `QueueItemList`: Danh sách các item `PENDING_SYNC` hoặc `ERROR` có kèm hình thu nhỏ (Thumbnail).
* `BtnSyncNow`: Button kích hoạt chạy chuỗi Promise đẩy từng gói ghi nhận qua API `/api/v1/sync/push`.

#### c. Các trạng thái màn hình (Screen States)
* **Loading**: Thanh Progress chạy hoạt họa, các item hiện icon xoay tròn.
* **Error**: Item lỗi hiện nút `[Thử lại]` đỏ kèm nguyên nhân (*Lỗi Timeout server / Token hết hạn*).
* **Empty**: Thẻ xanh lá mạ: *"Tệt vời! Tất cả dữ liệu và bằng chứng đã được đồng bộ an toàn lên Server!"*
* **Offline**: Button `[ĐỒNG BỘ TẤT CẢ NGAY]` bị vô hiệu hóa, hiện dòng nhắc *"Vui lòng kết nối 4G hoặc Wifi để tải dữ liệu lên!"*.

#### d. Luồng tương tác (Interaction Flow)
1. Khi có mạng 4G/Wifi -> Background Service tự động gọi Sync Engine.
2. Với mỗi item: Upload ảnh lên Cloud Storage lấy URL -> Đẩy payload JSON ghi nhận vào Backend -> Nhận mã `ACK` -> Xóa item khỏi Queue hoặc đổi cờ sang `SYNCED`.
3. Nhấp vào item bị lỗi -> Mở popup chi tiết lỗi và cho phép chỉnh sửa nội dung hoặc chụp lại ảnh.

---

### MH-06: Hồ sơ Cây số (Plant Passport Viewer)

#### a. Wireframe Layout (ASCII)
```
+-----------------------------------+
| [<-] HỒ SƠ CÂY SỐ (PLANT PASSPORT)|
+-----------------------------------+
|  [ Ảnh chụp Dâu tây #NL-P882 ]   |
|  Mã số cây: NL-DL-Z1-F2-B05-P882  |
|  Giống: Dâu tây Nhật Hana (F1)    |
|  Ngày trồng: 12/08/2026 (41 ngày) |
|  Tọa độ: 11.940415, 108.458312    |
+-----------------------------------+
| NHẬT KÝ VÒNG ĐỜI (TIMELINE):      |
| o 20/09/2026 - Tỉa lá già & chồi  |
|   Bởi: Ngô Văn An (Công nhân)     |
|   [Ảnh chụp bằng chứng]           |
|                                   |
| o 10/09/2026 - Phun vi sinh EM    |
|   Liều lượng: 50ml/10L            |
|   [Ảnh chụp bằng chứng]           |
|                                   |
| o 12/08/2026 - Hạ giống gieo trồng|
|   Nguồn giống: Viện Cây Trồng DL |
+-----------------------------------+
|    [ 🖨️ IN MÃ QR CÂY NÀY ]        |
+-----------------------------------+
```

#### b. Danh sách UI Components
* `PlantHeaderCard`: Ảnh đại diện cây, Mã QR định danh, Giống cây, Tuổi cây (số ngày từ khi hạ giống).
* `GeoLocationMiniMap`: Bản đồ vệ tinh hiển thị đúng 1 điểm Point tọa độ của gốc cây.
* `LifecycleTimeline`: Trục thời gian đứng nối các sự kiện từ gieo trồng đến hiện tại kèm ảnh chụp thực tế.
* `BtnPrintQR`: Nút kết nối máy in Bluetooth cầm tay để in nhãn QR dán lên chậu/gốc cây.

#### c. Các trạng thái màn hình (Screen States)
* **Loading**: Skeleton hình tròn avatar và các đường Timeline.
* **Error**: *"Không tìm thấy dữ liệu cây số cho mã QR này!"*
* **Empty**: *"Cây số mới tạo, chưa có nhật ký hoạt động nào được ghi nhận."*
* **Offline**: Hiển thị dữ liệu cây số đã được lưu trong bộ nhớ đệm ứng dụng.

#### d. Luồng tương tác (Interaction Flow)
1. Quét QR trên thân cây từ **MH-03** -> Chọn "Xem hồ sơ cây" -> Chuyển sang **MH-06**.
2. Chạm vào bất kỳ ảnh bằng chứng trên Timeline -> Phóng to ảnh xem Watermark GPS/Timestamp.
3. Chạm `[IN MÃ QR]` -> Kết nối máy in nhiệt Bluetooth di động -> In nhãn QR dán tại chỗ.

---

## 3. PHÂN HỆ WEB ADMIN (CHỦ TRANG TRẠI & QUẢN LÝ)

---

### MH-07: Dashboard Tổng quan Nông trại (Executive Dashboard)

#### a. Wireframe Layout (ASCII)
```
+-------------------------------------------------------------------+
| NÔNG LẠC WEB ADMIN  | [Bản đồ] [Thực thể] [Mùa vụ] [Kiểm toán]    | (Header)
+-------------------------------------------------------------------+
| BÁO CÁO TỔNG QUAN NÔNG TRẠI DALAT ZONE A       [ Chọn Mùa Vụ v ] |
| +---------------+ +---------------+ +---------------+ +----------+|
| | DIỆN TÍCH SỐ  | | SẢN LƯỢNG DỰ  | | BẮT BƯỚC SYNC | | DIGITAL  ||
| |   12.5 Ha     | |   18.5 Tấn    | | 100% Hoànthành| | COVERAGE ||
| | (4 Zones)     | | (Dâu tây/Cà)  | | (0 Đang đọng) | |   94.2%  ||
| +---------------+ +---------------+ +---------------+ +----------+|
+-----------------------------------+-------------------------------+
| CHI PHÍ SẢN XUẤT THEO THỰC THỂ    | CẢNH BÁO BẤT THƯỜNG (ANOMALY) |
| [Biểu đồ Cột: Chi phí Phân/Thuốc] | [!] Luống B2 nghi vấn sai GPS |
|   |  ██    ██                     |     Nhật ký tưới cách 2.3km   |
|   |  ██  ████                     | [!] Thiếu ảnh bằng chứng     |
|   +------------                   |     Hoạt động thu hoạch Z2   |
|   T1   T2  T3                     | [ Xem tất cả 5 cảnh báo ]     |
+-----------------------------------+-------------------------------+
```

#### b. Danh sách UI Components
* `TopNavHeader`: Thanh điều hướng chính của Web Admin, hiển thị Logo, Menu chính và Profile Chủ trang trại.
* `KpiMetricCards`: 4 thẻ chỉ số KPI quan trọng nhất (Diện tích số hóa, Sản lượng dự kiến, Tỷ lệ Sync, Digital Coverage %).
* `CostChartWidget`: Biểu đồ cột chồng (Stacked Bar Chart) thể hiện chi phí Vật tư / Nhân công / Điện nước.
* `AnomalyAlertPanel`: Danh sách cảnh báo đỏ tự động phát hiện gian lận GPS, nhật ký thiếu bằng chứng, hoặc bón phân vượt định mức.

#### c. Các trạng thái màn hình (Screen States)
* **Loading**: Biểu tượng Pulse / Skeleton Shimmer trên các Widget chỉ số.
* **Error**: Thẻ lỗi đỏ: *"Lỗi kết nối API Dashboard. Vui lòng bấm F5 để tải lại!"*
* **Empty**: *"Trang trại chưa có dữ liệu canh tác. Hãy bắt đầu vẽ ranh giới nông trại tại Bản Đồ Số!"*
* **Offline**: Hiển thị Banner vàng: *"Mất kết nối Server. Đang hiển thị dữ liệu lưu cache gần nhất."*

#### d. Luồng tương tác (Interaction Flow)
1. Nhấp vào thẻ `[CẢNH BÁO BẤT THƯỜNG]` -> Chuyển trực tiếp sang **MH-11** filtered theo danh sách bất thường.
2. Đổi Dropdown `[Chọn Mùa Vụ]` -> Tất cả biểu đồ và KPI cập nhật lại dữ liệu theo Mùa vụ tương ứng.

---

### MH-08: Bản đồ Số Tương tác (Digital Farm Map)

#### a. Wireframe Layout (ASCII)
```
+-------------------------------------------------------------------+
| [Vẽ Polygon] [Thêm Point] [Sửa ranh giới] | LỚP PHỦ: (x) Trạng thái|
+-------------------------------------------+-----------------------+
|                                           | DANH SÁCH KHU VỰC:    |
|   +-----------------------------------+   | [v] Zone A - Dâu tây  |
|   | /=========\                       |   |   |-- Field 01 (1.2ha)|
|   | | Field 01|   /=========\         |   |   |   |-- Bed B01 (🟢) |
|   | \=========/   | Field 02|         |   |   |   |-- Bed B02 (🔴) |
|   |               \=========/         |   |   |-- Field 02 (2.0ha)|
|   |    [📍Vị trí Worker An]           |   | [ ] Zone B - Cà chua  |
|   +-----------------------------------+   +-----------------------+
|                                           | CHI TIẾT THỰC THỂ:    |
|   Bản đồ Vệ tinh Mapbox / Leaflet GL      | Bed B02: Sâu bệnh 🔴  |
|   Tọa độ con trỏ: 11.9405, 108.4582       | [ Báo cáo xử lý ]     |
+-------------------------------------------+-----------------------+
```

#### b. Danh sách UI Components
* `MapCanvas`: Khung chứa bản đồ Mapbox GL / Leaflet rendering lớp nền vệ tinh, mã hóa Polygon/Point màu sắc.
* `DrawingToolbar`: Thanh công cụ vẽ ranh giới đất đai (Draw Polygon, Add Marker, Edit Geometry, Delete).
* `LayerControlPanel`: Bảng bật/tắt các lớp phủ (Lớp chỉ số sức khỏe cây, Lớp trạng thái canh tác, Lớp trí trí công nhân real-time).
* `EntitySidebarTree`: Cây danh sách khu vực đất đai dạng đệ quy bên phải bản đồ.

#### c. Các trạng thái màn hình (Screen States)
* **Loading**: Vòng quay nén Tile Mapbox và tải dữ liệu GeoJSON từ Backend PostGIS.
* **Error**: Thông báo: *"Không thể tải lớp dữ liệu không gian. Kiểm tra Mapbox API Key!"*
* **Empty**: Bản đồ hiển thị góc nhìn toàn quốc, chờ người dùng vẽ Polygon trang trại đầu tiên.
* **Offline**: Sử dụng bản đồ Vector Tile đã cache cục bộ.

#### d. Luồng tương tác (Interaction Flow)
1. Nhấp chọn biểu tượng `[Vẽ Polygon]` -> Click các điểm trên bản đồ để khép góc ranh giới đất -> Nhập tên Thửa/Luống -> Tự động tính Diện tích (m2) và lưu PostGIS Geometry.
2. Nhấp vào 1 Polygon Luống B02 màu đỏ -> Bảng bên phải trượt ra hiển thị nhật ký phát sinh sâu bệnh gần nhất và danh sách bằng chứng ảnh đính kèm.

---

### MH-09: Trình Quản lý Cấu trúc Cây (Entity Tree Manager)

#### a. Wireframe Layout (ASCII)
```
+-------------------------------------------------------------------+
| TÌM KIẾM THỰC THỂ: [ Nhập tên hoặc mã LTREE...        ] [+ Thêm Mới]|
+-----------------------------------+-------------------------------+
| CẤU TRÚC PHÂN CẤP (LTREE TREE)    | THÔNG TIN CHÍ NHÁNH SỐ:       |
| 📂 Farm Dalat (DL)                | Tên thực thể: Thửa Dâu Tây 01 |
|   ├── 📁 Zone A (DL.ZA)           | Mã đường dẫn: DL.ZA.F01       |
|   │   ├── 📁 Field 01 (DL.ZA.F01) | Cấp thực thể: Field (Thửa)    |
|   │   │   ├── 📄 Bed 01           | Diện tích: 12,000 m2          |
|   │   │   └── 📄 Bed 02           | Tọa độ Center: 11.9404,108.45 |
|   │   └── 📁 Field 02             | Số lượng thực thể con: 24 Bed |
|   └── 📁 Zone B (DL.ZB)           |                               |
|                                   | [ Sửa ranh giới ] [ Xóa ]     |
+-----------------------------------+-------------------------------+
```

#### b. Danh sách UI Components
* `TreeNavigator`: Thành phần hiển thị cây phân cấp đệ quy hỗ trợ kéo thả (Drag & Drop) dựa trên PostgreSQL `LTREE`.
* `EntitySearchBox`: Ô tìm kiếm nhanh thực thể tự động gợi ý theo kiểu Full-Text Search.
* `EntityDetailForm`: Form hiển thị và chỉnh sửa thuộc tính của node đang chọn trong cây (Tên, Mã Path, Loại thực thể, Thuộc tính đất).
* `BtnAddEntity`: Button thêm node con cấp tiếp theo vào cây hiện tại.

#### c. Các trạng thái màn hình (Screen States)
* **Loading**: Tree Skeleton mở rộng các nhánh.
* **Error**: *"Không thể di chuyển thực thể. Mã đường dẫn LTREE bị trùng lặp!"*
* **Empty**: *"Chưa có cấu trúc cây. Bấm [+ Thêm Mới] để tạo Trang trại đầu tiên!"*
* **Offline**: Đọc danh sách thực thể từ Local Storage.

#### d. Luồng tương tác (Interaction Flow)
1. Nhấp vào node `Field 01` trên cây -> Cột bên phải lập tức hiển thị thông tin chi tiết và danh sách tất cả các luống `Bed` trực thuộc.
2. Kéo thả `Bed 01` từ `Field 01` sang `Field 02` -> Hệ thống gọi API cập nhật lại thuộc tính `path` LTREE trong cơ sở dữ liệu (`DL.ZA.F01.B01` -> `DL.ZA.F02.B01`).

---

### MH-10: Quản lý Mùa vụ & Khấu trừ Vật tư (Crop Season & Inventory)

#### a. Wireframe Layout (ASCII)
```
+-------------------------------------------------------------------+
| QUẢN LÝ MÙA VỤ & KHO VẬT TƯ                 [+ Tạo Mùa Vụ Mới]    |
+-------------------------------------------------------------------+
| DANH SÁCH MÙA VỤ DANG HOẠT ĐỘNG:                                  |
| 🌾 Mùa Dâu Tây Thu Đông 2026 | Bắt đầu: 01/08/2026 - Dự kiến: 11/2026|
| Tiến độ: [=======================>      ] 75% (Giai đoạn đậu quả)  |
+-------------------------------------------------------------------+
| ĐỐI SOÁT TỰ ĐỘNG KHO VẬT TƯ TỪ NHẬT KÝ CANH TÁC:                   |
| Tên vật tư      | Tồn đầu | Đã khấu trừ (Tự động)| Tồn hiện tại  |
| Phân NPK 16-16-8| 500 kg  | -125.5 kg (42 nhật ký)| 374.5 kg      |
| Thuốc vi sinh EM| 100 L   | -24.0 L   (18 nhật ký)| 76.0 L        |
| Màng phủ nông nghiệp| 50 Cuộn| -12 Cuộn  (03 nhật ký)| 38 Cuộn       |
+-------------------------------------------------------------------+
```

#### b. Danh sách UI Components
* `SeasonProgressCard`: Thẻ hiển thị mùa vụ, ngày bắt đầu, ngày dự kiến thu hoạch và thanh tiến độ phần trăm thời gian.
* `InventoryDeductionTable`: Bảng đối soát kho vật tư có tính năng so sánh Tồn đầu kỳ - Lượng khấu trừ tự động từ các Form nhật ký mobile = Tồn hiện tại.
* `BtnCreateSeason`: Button mở Modal tạo mùa vụ mới, gắn với danh sách Thửa/Luống cụ thể.

#### c. Các trạng thái màn hình (Screen States)
* **Loading**: Shimmer hiệu ứng dòng cho bảng vật tư.
* **Error**: Viền đỏ ô kho: *"Cảnh báo: Tồn kho Phân NPK hiện tại bị âm! Vui lòng kiểm tra lại nhật ký nhập kho!"*
* **Empty**: *"Chưa có mùa vụ nào được thiết lập. Hãy tạo mùa vụ để bắt đầu theo dõi khấu trừ vật tư!"*
* **Offline**: Không hỗ trợ cập nhật kho khi offline ở Web Admin.

#### d. Luồng tương tác (Interaction Flow)
1. Khi công nhân gửi nhật ký bón 2.5 kg NPK tại **MH-04** -> Hệ thống chạy DB Transaction tự động giảm số dư `374.5 kg` xuống `372.0 kg` trên bảng.
2. Nhấp vào con số `-125.5 kg` -> Mở popup danh sách tất cả 42 nhật ký đã sử dụng loại phân bón này kèm tên công nhân thực hiện.

---

### MH-11: Giám sát Nhật ký & Kiểm tra Bằng chứng (Audit & Evidence Stream)

#### a. Wireframe Layout (ASCII)
```
+-------------------------------------------------------------------+
| BẢNG GIÁM SÁT NHẬT KÝ & BẰNG CHỨNG (AUDIT STREAM)                 |
| BỘ LỌC: [ Nông dân v ] [ Loại HĐ v ] [ Trạng thái Bằng chứng v ]  |
+-------------------------------------------------------------------+
| THỜI GIAN  | VỊ TRÍ     | HOẠT ĐỘNG | NGƯỜI THỰC HIỆN| BẰNG CHỨNG|
| 08:15 Hôm nay| Luống B02  | Bón phân  | Ngô Văn An    | 🖼️ [XEM ẢNH]|
| 07:45 Hôm nay| Luống A01  | Tưới nước | Trần Văn Bún  | 🖼️ [XEM ẢNH]|
| 16:30 Qua   | Thửa 02    | Phun thuốc| Ngô Văn An    | ⚠️ [THIẾU] |
+-------------------------------------------------------------------+
| POPUP XEM BẰNG CHỨNG CHI TIẾT (EVIDENCE MODAL):                  |
| +-----------------------------+  Thông tin đối soát:              |
| | [ Ảnh chụp thực tế dâu tây] |  - GPS Ảnh: 11.94041, 108.45831   |
| | Watermark:                  |  - GPS Thực thể: 11.94040,108.4582|
| | 11.94041,108.45831          |  - Độ lệch: 1.2 mét (🟢 HỢP LỆ)  |
| | 2026-09-22 08:15:00         |  - Mạng đẩy: 4G Viettel           |
| +-----------------------------+  [ DUYỆT BẢN GHI ] [ CẢNH BÁO ]   |
+-------------------------------------------------------------------+
```

#### b. Danh sách UI Components
* `AuditFilterBar`: Bộ lọc đa tiêu chí (Nông dân, Ngày thực hiện, Loại hoạt động, Mức độ tin cậy bằng chứng).
* `ActivityStreamTable`: Bảng danh sách nhật ký thời gian thực tự động cuộn (Real-time Auto-refresh).
* `EvidenceModal`: Modal hiển thị ảnh/video độ phân giải cao đính kèm bảng so sánh tọa độ GPS thực tế của ảnh vs Tọa độ niêm phong của thực thể.
* `DataConfidenceBadge`: Nhãn đánh giá độ tin cậy dữ liệu (Xanh: Cao, Vàng: Trung bình, Đỏ: Cảnh báo gian lận).

#### c. Các trạng thái màn hình (Screen States)
* **Loading**: Spinner xoay nhẹ tại từng dòng dữ liệu đang được xác thực.
* **Error**: *"Không thể kết nối dịch vụ đối soát tọa độ GPS!"*
* **Empty**: *"Không có nhật ký nào trùng khớp với bộ lọc!"*
* **Offline**: Yêu cầu kết nối mạng để đối soát bằng chứng.

#### d. Luồng tương tác (Interaction Flow)
1. Nhấp vào nút `🖼️ [XEM ẢNH]` trên bất kỳ dòng nhật ký -> Mở `EvidenceModal`.
2. Hệ thống tự động vẽ một vòng tròn bán kính 10m xung quanh thực thể -> Nếu tọa độ GPS của ảnh nằm ngoài vòng tròn -> Hiện nhãn đỏ `⚠️ VI PHẠM KHOẢNG CÁCH` và tự động gửi thông báo về ứng dụng di động của Quản lý.

---

### MH-12: Quản lý Chi phí & Năng suất (Cost & Analytics)

#### a. Wireframe Layout (ASCII)
```
+-------------------------------------------------------------------+
| PHÂN TÍCH CHI PHÍ & NĂNG SUẤT CANH TÁC                           |
+-----------------------------------+-------------------------------+
| PHÂN BỔ CHI PHÍ THEO LOẠI (VNĐ)   | CHI PHÍ TRÊN MỖI KG THÀNH PHẨM|
| [Biểu đồ Tròn: Allocation]        | - Dâu tây Hana: 42,500 đ/kg   |
| 🔵 Vật tư phân bón (45%)         | - Cà chua Socola: 18,200 đ/kg |
| 🟠 Nhân công công nhật (35%)      | - Dưa lưới T-Net: 28,000 đ/kg |
| 🟢 Điện nước & Vận hành (20%)     +-------------------------------+
|                                   | DỰ BÁO LỢI NHUẬN MÙA VỤ:      |
| Tổng chi phí: 145,000,000 VNĐ     | Doanh thu dự kiến: 320tr VNĐ  |
|                                   | Lợi nhuận ròng:    175tr VNĐ  |
+-----------------------------------+-------------------------------+
```

#### b. Danh sách UI Components
* `CostPieChart`: Biểu đồ tròn thể hiện cơ cấu chi phí sản xuất.
* `UnitCostCards`: Thẻ hiển thị chi phí tính trên đơn vị diện tích (VNĐ/m2) và đơn vị sản lượng (VNĐ/kg).
* `ProfitForecastWidget`: Báo cáo dự báo lợi nhuận ròng dựa trên năng suất dự kiến và giá bán niêm yết trên Sàn chợ.

#### c. Các trạng thái màn hình (Screen States)
* **Loading**: Skeleton hiển thị khung biểu đồ.
* **Error**: *"Không đủ dữ liệu thu hoạch để tính toán chi phí trên mỗi kg!"*
* **Empty**: *"Chưa có dữ liệu chi phí cho mùa vụ này."*
* **Offline**: Không khả dụng offline.

#### d. Luồng tương tác (Interaction Flow)
1. Hover chuột vào miếng bánh `🔵 Vật tư phân bón (45%)` -> Hiện tooltip chi tiết tổng tiền đã chi cho từng mã vật tư.
2. Nhấp vào dòng `Dâu tây Hana` -> Xem chi tiết bảng phân rã chi phí chi tiết từ khâu làm đất đến khi đóng gói.

---

## 4. PHÂN HỆ SÀN CHỢ & TRUY XUẤT NGUỒN GỐC (NGƯỜI TIÊU DÙNG)

---

### MH-13: Trang chủ Chợ Nông Lạc (Marketplace Home)

#### a. Wireframe Layout (ASCII)
```
+-------------------------------------------------------------------+
| NÔNG LẠC MARKET  | [🔍 Tìm nông sản minh bạch...  ] | [🛒 Giỏ hàng]|
+-------------------------------------------------------------------+
| BANNER: NÔNG SẢN MINH BẠCH - TRUY XUẤT NGUỒN GỐC TỪNG CÂY         |
| [ Khám phá các nông trại đạt chứng nhận Digital Twin -> ]          |
+-------------------------------------------------------------------+
| DANH MỤC NÔNG SẢN ĐẠT CHỨNG NHẬN TRUY XUẤT:                       |
| +------------------+  +------------------+  +------------------+  |
| | [Ảnh Dâu Tây]    |  | [Ảnh Cà Chua]    |  | [Ảnh Dưa Lưới]   |  |
| | Dâu tây Hana DL  |  | Cà chua Socola   |  | Dưa lưới T-Net   |  |
| | 120,000 đ/kg     |  | 45,000 đ/kg      |  | 85,000 đ/kg      |  |
| | 🛡️ Live Trace 100%|  | 🛡️ Live Trace 98%|  | 🛡️ Live Trace 95%|  |
| +------------------+  +------------------+  +------------------+  |
+-------------------------------------------------------------------+
```

#### b. Danh sách UI Components
* `SearchBarFullText`: Thanh tìm kiếm Full-Text Search tiếng Việt tự động gợi ý nông sản không dấu/có dấu.
* `HeroBanner`: Banner trượt giới thiệu giá trị minh bạch nông sản từ nền tảng Digital Farm.
* `ProductGridCard`: Thẻ sản phẩm chuẩn E-commerce tích hợp Nhãn bảo chứng **Live Traceability Badge %**.
* `CartQuickView`: Biểu tượng giỏ hàng có đếm số lượng mặt hàng.

#### c. Các trạng thái màn hình (Screen States)
* **Loading**: Grid Skeleton 6 ô sản phẩm.
* **Error**: *"Không thể kết nối máy chủ Sàn chợ. Vui lòng thử lại sau!"*
* **Empty**: *"Không tìm thấy nông sản phù hợp với từ khóa!"*
* **Offline**: Hiển thị trang Offline tùy biến của Next.js Service Worker.

#### d. Luồng tương tác (Interaction Flow)
1. Nhập từ khóa `"dau tay hana"` vào thanh tìm kiếm -> Màn hình tự động lọc và chuyển hướng sang **MH-14**.
2. Nhấp vào bất kỳ thẻ sản phẩm -> Chuyển sang **MH-15** hiển thị chi tiết sản phẩm và nhật ký canh tác.

---

### MH-14: Danh mục Sản phẩm & Bộ lọc (Product Catalog)

#### a. Wireframe Layout (ASCII)
```
+-------------------------------------------------------------------+
| DANH MỤC NÔNG SẢN SẠCH                                            |
+-----------------------------------+-------------------------------+
| BỘ LỌC TÌM KIẾM:                  | KẾT QUẢ TÌM KIẾM (12 Nông sản)|
| 🏡 Nông trại:                     | Sắp xếp: [ Độ tin cậy cao v ] |
|   [x] Nông Lạc Dalat Zone A       | +---------------------------+ |
|   [ ] Nông Lạc Mộc Châu           | | [Ảnh] Dâu tây Hana Hộp 500g| |
| 🏅 Chứng nhận:                    | | Trang trại: Dalat Zone A  | |
|   [x] VietGAP  [ ] Organic        | | Lô thu hoạch: #BATCH-882  | |
| 🛡️ Mức độ tin cậy dữ liệu:        | | 65,000 đ / Hộp            | |
|   (o) > 90% (Bằng chứng đầy đủ)   | | [🛡️ XEM TRUY XUẤT BẰNG CHỨNG]| |
|   ( ) Tất cả                      | +---------------------------+ |
+-----------------------------------+-------------------------------+
```

#### b. Danh sách UI Components
* `FilterSidebar`: Khung bộ lọc đa chiều (Nông trại, Loại chứng nhận, Khoảng giá, Chỉ số tin cậy dữ liệu % Data Confidence).
* `SortDropdown`: Dropdown sắp xếp sản phẩm (Độ tin cậy dữ liệu giảm dần, Giá tăng/giảm, Mới nhất).
* `ProductListItem`: Card sản phẩm hiển thị mã Lô thu hoạch (`Batch ID`) và nút `[🛡️ XEM TRUY XUẤT BẰNG CHỨNG]`.

#### c. Các trạng thái màn hình (Screen States)
* **Loading**: Skeleton các dòng sản phẩm.
* **Error**: *"Lỗi tải danh mục sản phẩm."*
* **Empty**: *"Không có sản phẩm nào đạt chỉ số tin cậy dữ liệu > 90% theo yêu cầu của bạn!"*
* **Offline**: Tải lại từ trang tĩnh đã được lưu Server-Side Rendering (ISR).

#### d. Luồng tương tác (Interaction Flow)
1. Tích chọn `[x] VietGAP` và chọn `(o) > 90% Data Confidence` -> Danh sách bên phải lập tức Re-render các sản phẩm thỏa mãn.

---

### MH-15: Chi tiết Sản phẩm & Widget Truy xuất Live (Product Detail & Live Traceability)

#### a. Wireframe Layout (ASCII)
```
+-------------------------------------------------------------------+
| [<-] DÂU TÂY HANA ĐÀ LẠT - HỘP 500G                               |
+-----------------------------------+-------------------------------+
| THÔNG TIN SẢN PHẨM:               | 🛡️ LIVE TRACEABILITY WIDGET   |
| [ Slide Ảnh Dâu Tây Thực Tế ]     | (NHẬT KÝ SẢN XUẤT THỜI GIAN THỰC)|
| Giá bán: 65,000 đ / Hộp 500g      | Chỉ số tin cậy: [🟢 98.5%]    |
| Xuất xứ: Luống B02, Thửa 01,      | 📍 Vị trí lô đất: 11.9404,108.|
|          Nông Lạc Dalat Zone A    |                               |
| [ MUA NGAY ]  [ THÊM GIỎ HÀNG ]   | TIMELINE CANH TÁC MINH BẠCH:  |
|                                   | o 20/09 - Thu hoạch & Đóng gói|
| COMPLIANCE:                       |   [📷 Xem ảnh chụp lô hàng]   |
| [x] VietGAP Code: VG-2026-882     | o 10/09 - Phun vi sinh EM     |
| [x] 100% Ảnh bằng chứng GPS       |   [📷 Xem ảnh bằng chứng GPS] |
| [x] Kiểm toán bất biến Audit Log  | o 12/08 - Gieo trồng giống F1 |
+-----------------------------------+-------------------------------+
```

#### b. Danh sách UI Components
* `ProductImageGallery`: Slide trình chiếu hình ảnh/video thực tế thu hoạch từ nông trại.
* `LiveTraceabilityWidget`: Widget nhúng độc quyền hiển thị Chỉ số tin cậy dữ liệu, Vị trí lô đất trên bản đồ vệ tinh mini và Timeline nhật ký sản xuất.
* `EvidenceImageViewer`: Lightbox mở rộng xem ảnh bằng chứng gốc kèm mã Watermark tọa độ/thời gian.
* `AddToCartSection`: Bộ chọn số lượng, Giá tiền, Button Mua ngay / Thêm giỏ hàng.

#### c. Các trạng thái màn hình (Screen States)
* **Loading**: Spinner tại Widget Truy xuất nguồn gốc trong khi tải dữ liệu Timeline từ Backend.
* **Error**: Widget hiện thông báo: *"Dữ liệu truy xuất nguồn gốc của lô hàng này đang được cập nhật!"*
* **Empty**: N/A (Sản phẩm luôn đính kèm dữ liệu từ hệ thống).
* **Offline**: Phục vụ nội dung tĩnh chuẩn ISR (Incremental Static Regeneration).

#### d. Luồng tương tác (Interaction Flow)
1. Người dùng nhấp vào dòng `o 10/09 - Phun vi sinh EM` trên Timeline -> Lightbox hiện ảnh nông dân Ngô Văn An đang phun thuốc cùng bản đồ GPS kiểm chứng tại vị trí Luống B02.
2. Nhấp nút `[MUA NGAY]` -> Đưa sản phẩm vào quy trình thanh toán E-commerce.

---

### MH-16: Trang Công khai Truy xuất Nguồn gốc (Public QR Scan Page)

#### a. Wireframe Layout (ASCII)
```
+-----------------------------------+
|          NÔNG LẠC TRACE           |
|   HỆ THỐNG TRUY XUẤT NGUỒN GỐC    |
+-----------------------------------+
| 📦 LÔ HÀNG: #BATCH-DOU-2026-882   |
| Sản phẩm: Dâu tây Hana Đà Lạt     |
| Ngày đóng gói: 21/09/2026         |
| Hạn sử dụng:   26/09/2026         |
+-----------------------------------+
| 🌿 HÀNH TRÌNH TỪ TRANG TRẠI:      |
|                                   |
| [📍 TRANG TRẠI DALAT ZONE A]      |
| Vị trí: Luống B02, Thửa 01        |
| Quản lý: Ngô Văn An               |
|                                   |
| [📸 BẰNG CHỨNG THU HOẠCH]         |
| +-------------------------------+ |
| | [Ảnh thu hoạch thực tế ]      | |
| | Tọa độ: 11.94041, 108.45831   | |
| | Thời gian: 20/09/2026 07:15   | |
| +-------------------------------+ |
|                                   |
| [📋 CHỨNG NHẬN CHẤT LƯỢNG]        |
| - VietGAP số: VG-2026-882         |
| - Kiểm định dư lượng: PASSED      |
+-----------------------------------+
|  [ BÁO CÁO SAI PHẠM / GÓP Ý ]     |
+-----------------------------------+
```

#### b. Danh sách UI Components
* `PublicHeaderBanner`: Header đơn giản tối ưu load cực nhanh trên trình duyệt điện thoại khi quét mã QR tem bao bì.
* `BatchSummaryCard`: Thẻ tóm tắt thông tin Lô hàng, Ngày thu hoạch, Hạn sử dụng.
* `FarmOriginCard`: Bản đồ thu nhỏ và địa chỉ chính xác nơi canh tác ra sản phẩm.
* `HarvestEvidenceGallery`: Trình xem ảnh/video bằng chứng thu hoạch thực tế tại đồng ruộng.
* `QualityCertificateBadge`: Thẻ hiển thị các chứng nhận VietGAP / GlobalGAP / Kết quả test dư lượng thuốc BVTV.

#### c. Các trạng thái màn hình (Screen States)
* **Loading**: Màn hình chờ Skeleton tối giản tải dưới 0.5 giây.
* **Error**: Cảnh báo đỏ: *"Mã QR không hợp lệ hoặc không tồn tại trong hệ thống Nông Lạc Trace!"*
* **Empty**: *"Lô hàng chưa được kích hoạt tem truy xuất!"*
* **Offline**: Hỗ trợ Web App Caching cơ bản.

#### d. Luồng tương tác (Interaction Flow)
1. Người tiêu dùng mua hộp dâu tây tại siêu thị -> Dùng camera điện thoại quét mã QR dán trên tem hộp -> Mở trực tiếp trang Web **MH-16**.
2. Nhấp `[📸 BẰNG CHỨNG THU HOẠCH]` -> Xem ảnh chụp thực tế lúc công nhân hái dâu tây tại vườn kèm GPS đối soát.
3. Nhấp `[BÁO CÁO SAI PHẠM]` -> Mở form góp ý hoặc khiếu nại về chất lượng sản phẩm trực tiếp tới Ban quản lý nông trại.

---

## 5. MA TRẬN TƯƠNG TÁC GIỮA CÁC MÀN HÌNH (SCREEN FLOW MATRIX)

```
[MH-01: Login] ----(Success)----> [MH-02: Tasks Dashboard]
                                         |
                       +-----------------+-----------------+
                       |                                   |
              (Tap Scan Button)                     (Tap Task Item)
                       v                                   v
             [MH-03: Fast Scan]                  [MH-04: 1-Tap Form]
                       |                                   |
             (Confirm Location)                            |
                       +---------------->------------------+
                                                           |
                                                      (Save Log)
                                                           v
                                                 [MH-05: Sync Queue]
                                                           |
                                                     (Sync Success)
                                                           v
                                                [MH-07: Admin Dashboard]
                                                           |
                                      +--------------------+--------------------+
                                      |                                         |
                            (Click Anomaly Alert)                      (Click Map Menu)
                                      v                                         v
                           [MH-11: Audit Stream]                     [MH-08: Farm Map]
                                      |                                         |
                              (View Evidence)                           (Select Entity)
                                      v                                         v
                           [MH-15: Trace Widget] <------------------- [MH-09: Tree Manager]
                                      ^
                                      |
                              (Public QR Scan)
                                      |
                           [MH-16: Public QR Page]
```

---

## 6. QUY CHUẨN THIẾT KẾ UI & HỆ THỐNG DESIGN SYSTEM

* **Bảng màu chủ đạo (Brand Colors)**:
  * Primary Green: `#2E7D32` (Xanh lá nông nghiệp - Nhận diện thương hiệu).
  * Secondary Amber: `#FFA000` (Vàng dâu chín / Cảnh báo cần chú ý).
  * Alert Red: `#D32F2F` (Đỏ vi phạm GPS / Gian lận / Lỗi).
  * Neutral Dark: `#212121` (Đen xám văn bản).
  * Neutral Light: `#F5F5F5` (Xám nền ứng dụng).
* **Typography**:
  * Font hệ thống Mobile: `Roboto` (Android) / `SF Pro` (iOS) - Kích thước chữ tối thiểu 16sp cho công nhân ngoài đồng dễ đọc.
  * Font Web Admin / Sàn chợ: `Inter` / `Be Vietnam Pro` hỗ trợ gõ tiếng Việt hoàn hảo.
* **Component Library**: Tối ưu hóa trên nền thư viện Tailwind CSS, React Native Paper (Mobile) và Shadcn UI (Web Next.js).

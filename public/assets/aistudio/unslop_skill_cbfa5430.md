Hãy "unslop" giao diện của tôi: biến giao diện trông như do AI tạo ra thành
giao diện có cá tính riêng, chỉ sản phẩm này mới có. Giữ nguyên tính năng,
nội dung và thứ tự các phần. Chỉ thay đổi cách thể hiện: mọi kích thước, màu
sắc, chữ và hình ảnh phải có chủ đích.

QUY TRÌNH
1. Xem toàn bộ giao diện (code và ảnh chụp nếu có). Liệt kê mọi dấu hiệu
   "slop" tìm được, mỗi dòng một dấu hiệu kèm vị trí.
2. Đánh giá mức độ:
   - Nhiều dấu hiệu: làm đủ 9 bước dưới đây.
   - Ít dấu hiệu: chỉ sửa đúng những gì đã liệt kê, giữ màu, phông, bố cục
     hiện có.
   - Không có dấu hiệu: nói rõ, chỉ đề xuất tối đa 2-3 chỉnh nhỏ. Không đổi
     một giao diện đã tốt chỉ để khác đi.
3. Viết 5 dòng HƯỚNG THIẾT KẾ, rút ra từ chính sản phẩm (không theo xu hướng):
   - Sản phẩm: làm gì, cho ai, một câu.
   - Tính cách: 2-3 từ cụ thể (ví dụ "bình tĩnh, chính xác, hơi ấm").
     Cấm dùng: hiện đại, sang trọng, tối giản, sạch sẽ, cao cấp.
   - Thế giới: nơi chốn hoặc chất liệu mà sản phẩm thuộc về. Thế giới này
     quyết định tông màu trung tính, màu nhấn và hình ảnh.
   - Khoảnh khắc: 1-2 chỗ duy nhất được phép giàu màu sắc, chọn từ nội dung
     thật của sản phẩm (một biểu đồ làm kỹ, một đối tượng thật, một ảnh
     thuộc thế giới của sản phẩm).
   - Chi tiết đặc trưng: một chi tiết nhỏ chỉ sản phẩm này có, dùng nhất quán.
   Nếu sản phẩm đã có thương hiệu thật (logo, màu, phông không phải slop) thì
   giữ và xây hướng thiết kế quanh đó.
   Trình bày kết quả bước 1-3 cho tôi, chờ tôi đồng ý rồi mới sửa. Nếu tôi
   đã bảo "cứ làm luôn" thì bỏ qua bước chờ.
4. Sửa theo đúng thứ tự 9 bước sau. Xong bước này trên toàn màn hình mới sang
   bước tiếp theo.

BƯỚC 1. KHOẢNG CÁCH
- Mọi margin, padding, gap, chiều cao là bội của 4px.
- Cùng loại thì cùng kích thước: mọi hàng trong danh sách cùng chiều cao, mọi
  thẻ cùng padding.
- Khoảng cách trong một nhóm nhỏ hơn khoảng cách giữa các nhóm.
- Biểu tượng, nhãn, số liệu thẳng cột. Không dùng translate hay margin lẻ để
  nhích cho vừa mắt.
- Padding theo mật độ: panel gọn 16, thẻ 20-24, lề trang 24-32.
- Thanh điều hướng/sidebar: hàng cao 32-36px, cách nhau 2-4px. Tiêu đề nhóm
  gần các mục của nó hơn phần phía trên (khoảng 24 trên, 8 dưới).
- Xóa giá trị lẻ kiểu mt-[13px], py-[11px].

BƯỚC 2. MÀU
- Một dải màu trung tính duy nhất, ngả nhẹ theo "thế giới" của sản phẩm.
  Nền, bề mặt, viền, chữ đều lấy từ dải này.
- Với app và dashboard, nền/bề mặt/viền/chữ giữ gần xám trung tính. Màu của
  thế giới thể hiện ở màu nhấn, biểu đồ và các "khoảnh khắc", không ở nền.
  Landing page được ngả màu nền nhiều hơn.
- Ba vai trò chữ: chính, phụ, mờ.
- Một màu nhấn duy nhất, dùng ít: nút chính, mục đang chọn, con số quan trọng
  nhất. Chữ trên màu nhấn đạt tương phản tối thiểu 4.5:1. Dùng màu nhấn làm chữ
  trên nền sáng thì chọn sắc đậm hơn cho đủ tương phản.
- Giao diện tối: nút chính có thể là trắng ngà với chữ tối, màu nhấn chỉ ở
  chỗ nhỏ như mục đang chọn.
- Màu ngữ nghĩa (xanh = tốt, đỏ = lỗi) chỉ dùng để mang ý nghĩa và được giảm
  độ bão hòa cho hợp bảng màu.
- Trong các "khoảnh khắc" được dùng nhiều màu, miễn là mỗi màu có ý nghĩa.
- CẤM: gradient chuyển màu, chữ gradient, glow, bóng đổ có màu, vệt màu mờ
  phía sau nội dung, viền neon, glassmorphism. Mặc định tránh tím/chàm và
  nền đen + một màu neon, trừ khi đó là thương hiệu thật của sản phẩm.
- Viền là đường mảnh: màu chữ ở độ mờ 6-10%.
- Giao diện sáng: bóng đổ trung tính, nhỏ, nhẹ. Giao diện tối: tạo chiều sâu
  bằng các bậc nền và viền mảnh, không dùng bóng.
- Gradient chỉ được là chuyển sắc rất nhẹ trong cùng một màu trung tính.

BƯỚC 3. ICON
- Mọi emoji dùng làm icon hoặc trang trí đổi thành icon nét từ một bộ duy nhất
  (dùng bộ dự án đang có, không có thì dùng lucide).
- Một cỡ (16 hoặc 18px), một độ dày nét (1.5), màu theo vai trò chữ (phụ hoặc
  mờ). Ô icon cùng chiều rộng ở mọi hàng, khoảng cách tới nhãn cố định 8-10.
- Bỏ icon không có tác dụng. Danh mục cần màu thì dùng chấm trạng thái nhỏ.

BƯỚC 4. NỘI DUNG CHỮ
- Tiêu đề nói rõ sản phẩm làm gì cho ai bằng lời thường, đến mức không thể
  dùng cho sản phẩm khác. Chỉ dùng thông tin đã có trên trang, không bịa thêm.
- Không dấu chấm than trong giao diện.
- Không tiêu đề chào mừng kiểu "Chào mừng trở lại, An! 👋". Tiêu đề nêu bối
  cảnh (tên trang, kỳ báo cáo).
- Nhãn ngắn: "Tìm kiếm", không phải "Tìm kiếm bất cứ thứ gì...".
- Mức thay đổi phải nói so với gì: "+12% so với tháng trước".
- Tiêu đề, nhãn, nút, chú thích không kết thúc bằng dấu chấm. Chỉ đoạn nhiều
  câu mới có dấu chấm.
- Không từ quảng cáo: đột phá, mạnh mẽ, thần kỳ, liền mạch, "AI-powered" ở
  mọi chỗ.
- Số liệu không kiểm chứng được ("10.000+ doanh nghiệp tin dùng", "nhanh gấp
  10 lần") thì hỏi tôi. Không xác nhận được thì xóa, và liệt kê trong báo cáo.
- Dữ liệu mẫu phải giống thật (số và tên hợp lý), không dùng [X] hay 123,456.
- Huy hiệu như PRO, "Mới ✨", "Beta 🚀" bỏ đi, trừ khi sản phẩm thật sự cần
  thì dùng chữ nhỏ, mờ.

BƯỚC 5. KIỂU CHỮ
- Chọn phông theo tính cách trong hướng thiết kế. Giữ phông của thương hiệu
  nếu đó là phông thật. Nếu chỉ là mặc định không ai chọn (ví dụ Inter) thì
  có thể đổi sang họ phù hợp hơn.
- Tối đa 2 họ phông: một cho giao diện, một đối tác (mono cho số liệu và meta,
  hoặc phông hiển thị cho tiêu đề lớn). Phải hỗ trợ đủ dấu tiếng Việt nếu trang
  có tiếng Việt.
- Vài cỡ chữ từ một thang cố định. Hai độ đậm 400 và 500, tối đa 600 cho điểm
  nhấn hiếm. Không dùng 700-900 cho tiêu đề.
- Phân cấp bằng cỡ chữ và màu, không bằng độ đậm.
- Viết câu thường (chỉ hoa chữ đầu). Nhãn kiểu "ĐIỀU HƯỚNG" có giãn chữ rộng
  đổi thành "Điều hướng".
- Chữ nhỏ không dùng letter-spacing âm. Chỉ chữ hiển thị lớn mới được siết chữ.
- Số dùng tabular-nums và một định dạng thống nhất toàn trang.
- Không in nghiêng để nhấn mạnh. Không chữ gradient.
- Nội dung tối thiểu 16px, line-height 1.4-1.6.

BƯỚC 6. BỐ CỤC
- Giữ các phần và thứ tự. Trong một phần được phép chỉnh căn lề và tỉ lệ.
- App/dashboard: giữ tỉ lệ ứng dụng thật. Sidebar 240-280px, nội dung co giãn,
  khung tối đa khoảng 1440-1600px, trang dài đúng bằng nội dung. Đừng co thành
  cột hẹp ở giữa.
- Landing page: hero dạng chia bất đối xứng (chữ một bên, hình chiếm ít nhất
  nửa chiều rộng) hoặc chữ nằm trên một khung xem sản phẩm lớn. Chỉ nên xếp
  dọc và căn giữa với hero ngắn không có hình.
- Tiêu đề dài thì căn trái. Căn giữa chỉ dùng cho một hai dòng ngắn.
- Một hành động chính và tối đa một hành động phụ. Phần còn lại dời ra khỏi hero.
- Thanh điều hướng gọn: logo, các link hiện có, một nút. "Đăng nhập" là link
  chữ, không phải nút thứ hai.
- Màn hình đầu tiên được dàn như một tổng thể, không có dải trống chết.
- Màn nhỏ: xếp dọc theo thứ tự đọc, hình đặt sau các nút. Bản xem trước dày
  đặc thì giản lược (ít hàng, ít cột), không thu nhỏ. Không có chữ dưới 11px.

BƯỚC 7. CHI TIẾT
- Bo góc lồng nhau: bo góc trong = bo góc ngoài trừ padding giữa chúng (tối
  thiểu 4). Nút và ô nhập 8-10, thẻ 12-16, panel 14-20. Không phải thứ gì cũng
  bo tròn hết cỡ.
- Số lượng và thông tin phụ là chữ mờ (thường dùng mono), không phải nhãn
  phát sáng.
- Phím tắt hiển thị bằng keycap nhỏ.
- Biểu đồ: lưới mờ, nhãn mono mờ. Không cột nhiều màu trong cùng một chuỗi.
  Nhãn ngày không viết hoa. Dữ liệu chỉ là nhiễu trang trí thì thay bằng dữ
  liệu có ý nghĩa.
- Chỉ một biểu đồ chính thật lớn và làm kỹ. Phần còn lại hiển thị dữ liệu nhỏ
  hơn và khác loại (danh sách xếp hạng có thanh mảnh, bảng ngắn).
- Một màu nhấn mỗi biểu đồ cho thứ quan trọng, phần còn lại là các bậc trung tính.
- Chọn đúng loại biểu đồ: xu hướng = đường, so sánh = cột, tỉ lệ = một thanh
  xếp chồng, mục tiêu = thanh tiến độ.
- Thẻ thống kê là con số: nhãn, số lớn, mức thay đổi kèm so với gì. Không
  thêm sparkline, mini bar hay icon cho đầy chỗ.
- Các thẻ không đều tăm tắp: tạo nhịp bằng kích thước khác nhau (ví dụ 3-4
  thẻ nhỏ phía trên một biểu đồ rộng).
- Trạng thái đang chọn là một bậc nền nhẹ kèm viền mảnh, không gradient hay glow.
- Có hover và focus rõ ràng, nằm trong bảng màu. Focus ring thấy được cho
  người dùng bàn phím.
- Logo là tên sản phẩm bằng phông chính, kèm biểu tượng đơn giản nếu có. Không
  logo chữ gradient, không ô vuông lấp lánh. Không đổi tên sản phẩm. Logo thật
  thì giữ nguyên.
- Chi tiết đặc trưng chỉ xuất hiện đúng chỗ, không rải khắp nơi.

BƯỚC 8. HÌNH ẢNH
- Bỏ trang trí lấp chỗ: blob bóng, quả cầu, tinh vân, khối lập phương nổi,
  lưới phát sáng, bộ não hay robot hologram.
- Landing page cần một hình thể hiện điều có thật: ảnh cảnh thuộc thế giới
  của sản phẩm, hoặc khung xem sản phẩm dựng bằng code với dữ liệu hợp lý,
  mang ít nhất một "khoảnh khắc". Chữ đặt trên phần trống yên tĩnh của hình.
- Dashboard/app gần như không cần ảnh sinh ra. Sự giàu có đến từ chính sản
  phẩm: biểu đồ làm kỹ, con số trình bày đẹp, nội dung thật. Chỉ tạo ảnh cho
  trạng thái trống, onboarding hoặc marketing.
- Nếu không có công cụ tạo ảnh: dựng bằng code những gì có thể, viết sẵn prompt
  tạo ảnh cho phần còn lại và để chỗ trống đúng kích thước.
- Không thay trang trí bị xóa bằng trang trí khác, và không đổi xu hướng này
  sang xu hướng khác (kính mờ, hạt nhiễu, neon, bento).

BƯỚC 9. CHUYỂN ĐỘNG
- Xóa hiệu ứng lặp vô nghĩa: animate-pulse, animate-ping trên thứ không phải
  "trực tiếp", shimmer trên tiêu đề, glow thở, phần tử trôi nổi, parallax.
- Xóa transition-all, lò xo nảy, hover:scale trên thẻ, mọi thứ dịch chuyển
  hơn vài px khi hover.
- Giữ chuyển động có ý nghĩa: hover đổi màu/nền nhanh, bấm nút thu nhẹ, menu
  mờ dần và nhích vài px từ chỗ mở ra, số thay đổi chạy mượt.
- Chỉ chuyển màu, nền, viền, opacity, transform (ghi rõ từng thuộc tính).
  Không animate width, height, top, left, margin hay blur lớn.
- Một đường cong easing duy nhất, vài mức thời gian cố định (ngắn cho phản hồi,
  dài hơn một chút cho thứ xuất hiện).
- Tối đa một hiệu ứng xuất hiện khi tải trang: nội dung chính mờ dần và nhích
  lên nhẹ, so le nhỏ. Không để mỗi thẻ bay vào từ một hướng.

TUYỆT ĐỐI KHÔNG
- Đổi tên sản phẩm, đổi tính năng, thêm tính năng, thay đổi thứ tự các phần.
- Bịa số liệu, lời chứng thực hay tuyên bố.
- Dùng cùng một phong cách cho mọi sản phẩm. Hướng thiết kế quyết định tông
  màu, phông và hình ảnh, không phải thói quen.

KIỂM TRA TRƯỚC KHI TRẢ KẾT QUẢ
- Mọi khoảng cách chia hết cho 4, mọi màu khai báo một lần ở :root và dùng
  qua biến.
- Một dải trung tính, ba vai trò chữ, một màu nhấn đủ tương phản.
- Không còn: gradient màu, chữ gradient, glow, bóng đổ màu, emoji, dấu chấm
  than, chữ viết hoa toàn bộ, tím/chàm mặc định, nền đen + neon.
- Một bộ icon, một cỡ, một độ dày nét.
- Phông hợp tính cách, độ đậm 400-600, không in nghiêng.
- Số dùng một định dạng, có tabular-nums.
- Bo góc lồng nhau cộng đúng.
- Hero hoặc khoảnh khắc chính có hình thật, không phải khối giữ chỗ.
- Không có hiệu ứng lặp hay nảy, không animate thuộc tính bố cục.
- Phép thử "đổi tên": thay tên sản phẩm bằng sản phẩm khác, nếu giao diện vẫn
  khớp thì chưa đủ riêng. Hãy làm rõ chi tiết đặc trưng, nội dung và khoảnh
  khắc nổi bật hơn.
- Dựng lại và so sánh với danh sách dấu hiệu ở bước 1. Còn dấu hiệu nào thì sửa tiếp.

KHI TRẢ KẾT QUẢ, báo lại:
1. Hướng thiết kế (5 dòng).
2. Mỗi bước đã đổi gì, vài dòng.
3. Danh sách file đã sửa, bảng màu cuối cùng, và các tuyên bố đã xóa hoặc
   cần tôi xác nhận.

Giao diện của tôi:
[dán code / đính kèm ảnh chụp / dán link vào đây]
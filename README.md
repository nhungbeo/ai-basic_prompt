# 🎨 Tạo Mô Tả Hình Ảnh Chi Tiết - Gemini AI

Ứng dụng web sử dụng Google Gemini AI **MIỄN PHÍ** để tạo mô tả hình ảnh chi tiết cho AI Art (Stable Diffusion, Midjourney, DALL-E).

## ✨ Tính năng

- 🎯 **Tạo prompt chuyên nghiệp** - Chuyển ý tưởng đơn giản thành prompt chi tiết
- 🎨 **10 phong cách nghệ thuật** - Realistic, Anime, Fantasy, Cyberpunk, v.v.
- 📊 **4 mức độ chi tiết** - Từ cơ bản đến siêu chi tiết
- 🔄 **Tạo nhiều phiên bản** - 1-5 prompt khác nhau cho cùng ý tưởng
- 📋 **Sao chép dễ dàng** - Copy prompt để sử dụng ngay
- 🎛️ **Tùy chỉnh tỷ lệ** - Hỗ trợ các tỷ lệ khung hình phổ biến
- 💡 **Negative prompt** - Tự động tạo negative prompt
- 🆓 **Hoàn toàn miễn phí** - Sử dụng Gemini API miễn phí
- 📱 **Responsive design** - Hoạt động tốt trên mọi thiết bị

## 🚀 Cài đặt và Chạy

### Yêu cầu
- Node.js 16+ 
- NPM hoặc Yarn
- API key từ [Google AI Studio](https://aistudio.google.com/app/apikey)

### Các bước cài đặt

1. **Clone hoặc tải về dự án**
```bash
# Nếu có git
git clone <repository-url>
cd text-to-image-generator

# Hoặc tải về và giải nén
```

2. **Cài đặt dependencies**
```bash
npm install
```

3. **Chạy ứng dụng**
```bash
npm run dev
```

4. **Mở trình duyệt**
   - Ứng dụng sẽ tự động mở tại `http://localhost:3000`
   - Hoặc mở thủ công địa chỉ trên

## 🔑 Lấy API Key

1. Truy cập [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Đăng nhập với tài khoản Google
3. Tạo API key mới
4. Sao chép và dán vào ứng dụng

## 📖 Hướng dẫn sử dụng

### Cơ bản
1. **Nhập API key** vào trường đầu tiên
2. **Mô tả hình ảnh** bạn muốn tạo (càng chi tiết càng tốt)
3. **Chọn cấu hình** (tỷ lệ, số lượng ảnh, kích thước)
4. **Nhấn "Tạo Hình Ảnh"** và đợi kết quả

### Nâng cao
- **Negative prompt**: Mô tả những gì KHÔNG muốn xuất hiện
- **Guidance Scale**: Độ tuân thủ mô tả (1-20, mặc định 7)
- **Seed**: Số để tái tạo kết quả giống nhau
- **Enhance prompt**: Để AI cải thiện mô tả tự động

### Ví dụ ý tưởng đầu vào
```
Một con mèo dễ thương ngồi trên cỏ
→ Tạo prompt chi tiết cho phong cách Anime

Phong cảnh núi non với thác nước  
→ Tạo prompt chi tiết cho phong cách Fantasy

Robot cầm ván trượt
→ Tạo prompt chi tiết cho phong cách Minimalist

Thành phố tương lai ban đêm
→ Tạo prompt chi tiết cho phong cách Cyberpunk
```

### Kết quả mẫu
Ứng dụng sẽ tạo ra các prompt chuyên nghiệp như:
```
"A cute fluffy orange tabby kitten sitting gracefully on vibrant green grass, soft anime art style, kawaii aesthetic, pastel colors, gentle lighting, detailed fur texture, sparkling eyes, cherry blossom petals floating in the background, studio ghibli inspired, high quality, 4k resolution"

Negative Prompt: "realistic, photographic, dark, scary, aggressive, low quality, blurry"
```

## 🛠️ Công nghệ sử dụng

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Build Tool**: Vite
- **AI API**: Google Gemini API (Imagen 3.0)
- **Package Manager**: NPM

## 📁 Cấu trúc dự án

```
text-to-image-generator/
├── index.html          # Giao diện chính
├── style.css           # Styling và responsive
├── main.js             # Logic ứng dụng
├── package.json        # Dependencies và scripts
├── vite.config.js      # Cấu hình Vite
└── README.md           # Tài liệu này
```

## 🎯 Tính năng nổi bật

### Giao diện thân thiện
- Design hiện đại với gradient và animations
- Responsive hoàn toàn cho mobile/tablet
- Loading states và error handling tốt

### Tối ưu hóa hiệu suất
- Lazy loading cho hình ảnh
- Debounced input validation
- Efficient DOM manipulation

### Trải nghiệm người dùng
- Auto-save API key
- Keyboard shortcuts (Ctrl+Enter để tạo ảnh)
- Copy/download functionality
- Example prompts rotating

## 🔧 Scripts có sẵn

```bash
npm run dev      # Chạy development server
npm run build    # Build cho production
npm run preview  # Preview build locally
```

## 🌐 Deployment GitHub Pages

Dự án được cấu hình tự động deploy lên GitHub Pages.

### Cách thức hoạt động
- GitHub Actions tự động build và deploy khi push lên branch `main`
- App sẽ có thể truy cập tại: `https://[username].github.io/ai-basic_prompt/`

### Yêu cầu setup
1. **Enable GitHub Pages trong repository settings**:
   - Vào `Settings` > `Pages`
   - Chọn `Source`: GitHub Actions
   - Workflow sẽ tự động chạy

2. **Permissions**: Đảm bảo GitHub Actions có quyền deploy
   - Vào `Settings` > `Actions` > `General`
   - Chọn `Read and write permissions`

### Manual deployment
Nếu muốn deploy thủ công:
```bash
npm run build          # Build production
# Sau đó push nội dung thư mục dist/ lên branch gh-pages
```

## 🚨 Lưu ý quan trọng

- **API Key**: Không chia sẻ API key với người khác
- **Chi phí**: Gemini API có thể tính phí theo usage
- **Giới hạn**: Có thể có rate limiting từ Google
- **Nội dung**: Tuân thủ chính sách nội dung của Google

## 🐛 Xử lý lỗi thường gặp

### "API key không hợp lệ"
- Kiểm tra API key đã nhập đúng
- Đảm bảo API key đã được kích hoạt

### "Vượt quá giới hạn"
- Đợi một lúc rồi thử lại
- Kiểm tra quota trong Google Cloud Console

### "Vi phạm chính sách an toàn"
- Thay đổi mô tả tránh nội dung nhạy cảm
- Sử dụng ngôn từ tích cực, phù hợp

### "Lỗi kết nối"
- Kiểm tra internet
- Thử refresh trang

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Hãy:
1. Fork dự án
2. Tạo feature branch
3. Commit changes
4. Push và tạo Pull Request

## 📄 License

Dự án này được phát hành dưới MIT License.

## 🙏 Cảm ơn

- Google AI Team cho Gemini API
- Cộng đồng developers Việt Nam
- Tất cả người dùng và contributors

---

**Phát triển với ❤️ bởi cộng đồng developers Việt Nam**
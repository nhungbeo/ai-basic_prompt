# 🎨 AI Prompt Generator & Image Creator - Gemini AI

Ứng dụng web mạnh mẽ sử dụng Google Gemini AI **MIỄN PHÍ** để tạo prompt chi tiết cho AI Art và Video, đồng thời có khả năng **tạo ảnh trực tiếp** bằng Gemini API.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Gemini](https://img.shields.io/badge/powered%20by-Gemini%20AI-orange.svg)

## ✨ Tính năng nổi bật

### 🖼️ Tạo Prompt Hình Ảnh
- 🎯 **Tạo prompt chuyên nghiệp** - Chuyển ý tưởng đơn giản thành prompt chi tiết
- 🎨 **6 phong cách nghệ thuật** - Realistic, Anime, Digital Art, Fantasy, Cinematic, Minimalist
- 📊 **4 mức độ chi tiết** - Từ cơ bản đến siêu chi tiết
- 🔄 **Tạo nhiều phiên bản** - 1-5 prompt khác nhau cho cùng ý tưởng
- 📋 **Sao chép dễ dàng** - Copy prompt để sử dụng ngay
- 🎛️ **Tùy chỉnh tỷ lệ** - Hỗ trợ các tỷ lệ khung hình phổ biến

### 🎬 Tạo Prompt Video
- 🎥 **Prompt chuyên nghiệp cho AI Video** - Runway, Pika, Sora
- ⚡ **Quick templates** - Camera movements, actions, lighting
- 🎭 **6 phong cách video** - Cinematic, Documentary, Anime, Commercial, Artistic, Realistic
- 📝 **Structured breakdown** - Character, Camera, Scene, Lighting, Motion, Mood, Style

### 🎨 **MỚI! Tạo Ảnh Trực Tiếp**
- 🖼️ **Tích hợp Gemini AI** để tạo ảnh thật từ prompt
- 🔄 **Multiple generation methods** - Native image generation, SVG fallback, detailed description
- 🤖 **Model selection** - Gemini 2.0 Flash, 2.5 Flash, 1.5 Pro/Flash
- 🎨 **Style & quality control** - Photorealistic, Artistic, Anime, Cartoon, etc.
- 💾 **Download & sharing** - Tải ảnh về máy, copy URL, regenerate

### 🔧 Tính năng nâng cao
- 🤖 **Multiple AI Models** - Gemini 2.5 Flash, 2.0 Flash, 1.5 Pro/Flash
- ✏️ **Custom System Prompts** - Tùy chỉnh hoàn toàn cách AI tạo prompt
- ⚙️ **Settings Management** - Lưu và quản lý cài đặt cá nhân
- 📚 **History System** - Lưu lại lịch sử các prompt đã tạo
- 🆓 **Hoàn toàn miễn phí** - Sử dụng Gemini API miễn phí
- 📱 **Responsive design** - Hoạt động mượt mà trên mọi thiết bị

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

### Tạo Prompt Hình Ảnh
1. **Chọn tab "🖼️ Tạo Ảnh"**
2. **Nhập API key** vào phần đầu trang (nếu chưa có)
3. **Nhập ý tưởng** của bạn vào ô mô tả
4. **Chọn phong cách** nghệ thuật mong muốn
5. **Tùy chọn nâng cao** (nếu cần):
   - Mức độ chi tiết
   - Tỷ lệ khung hình
   - Số lượng prompt
   - Model AI
   - Negative prompt
   - Guidance scale & seed
6. **Click "Tạo Mô Tả Hình Ảnh"**
7. **🎨 MỚI**: Click nút "🎨 Tạo Ảnh" bên cạnh prompt để tạo ảnh thật

### Tạo Prompt Video
1. **Chọn tab "🎬 Tạo Video"**
2. **Nhập ý tưởng video** của bạn
3. **Chọn quick templates** (optional): Camera movements, actions
4. **Chọn phong cách video**
5. **Cài đặt nâng cao**:
   - Độ dài video
   - Tỷ lệ khung hình
   - Số lượng prompt
6. **Click "Tạo Mô Tả Video"**

### Test Tính Năng Tạo Ảnh
1. **Mở Advanced Settings** trong tab Tạo Ảnh
2. **Cấu hình**:
   - Model cho tạo ảnh
   - Phong cách mặc định
   - Chất lượng mặc định
3. **Click "🧪 Test Tạo Ảnh"** để kiểm tra

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
- **AI Engine**: Google Gemini API (2.5 Flash, 2.0 Flash, 1.5 Pro/Flash)
- **Image Generation**: Gemini Native API + SVG Fallback
- **Package Manager**: NPM
- **Styling**: CSS Custom Properties, Flexbox, Grid

## 📁 Cấu trúc dự án

```
ai_basic_prompt/
├── index.html              # Giao diện chính
├── main.js                 # Core application logic
├── imageGenerator.js       # 🆕 Image generation module
├── style.css              # Styling và responsive
├── package.json           # Dependencies và scripts
├── package-lock.json      # Lock file
└── README.md              # Tài liệu này
```

## 🎯 Đặc điểm nổi bật

### 🎨 Tạo Ảnh Trực Tiếp với Gemini
- **Native image generation** với Gemini 2.0 Flash
- **SVG fallback** khi không thể tạo ảnh trực tiếp
- **Multiple style options**: Photorealistic, Artistic, Anime, etc.
- **Download & share**: Tải ảnh về máy, copy URL

### 🖥️ Giao diện thân thiện
- Design hiện đại với gradient và animations
- Responsive hoàn toàn cho mobile/tablet
- Loading states và error handling tốt
- Tab-based navigation cho Image & Video

### ⚡ Tối ưu hóa hiệu suất
- Lazy loading cho hình ảnh
- Debounced input validation
- Efficient DOM manipulation
- Background image generation

### 👥 Trải nghiệm người dùng
- Auto-save API key và settings
- Keyboard shortcuts (Ctrl+Enter để generate)
- Copy/download functionality
- History system với reuse capability
- Example prompts rotating

## 🔧 Scripts có sẵn

```bash
npm run dev      # Chạy development server
npm run build    # Build cho production
npm run preview  # Preview build locally
```

## ⚙️ Cấu hình

### Supported Models
- `gemini-1.5-pro` - **Tốt nhất, ổn định nhất**
- `gemini-1.5-flash` - Nhanh và hiệu quả
- `gemini-1.0-pro` - Basic, ổn định

### Style Options
**Image Styles:**
- Photorealistic
- Artistic
- Anime/Manga
- Cartoon
- Minimalist
- Fantasy

**Video Styles:**
- Cinematic
- Documentary
- Anime
- Commercial
- Artistic
- Realistic

## 🚨 Lưu ý quan trọng

- **API Key**: Không chia sẻ API key với người khác
- **Chi phí**: Gemini API có thể tính phí theo usage
- **Giới hạn**: Có thể có rate limiting từ Google
- **Nội dung**: Tuân thủ chính sách nội dung của Google
- **Image Generation**: Tính năng mới, có thể không ổn định 100%

## 🐛 Troubleshooting

### API Key Issues
```
❌ API key không hợp lệ
✅ Solution: Kiểm tra API key tại Google AI Studio
```

### Quota Exceeded
```
❌ Đã vượt quá giới hạn sử dụng API
✅ Solution: Đợi reset quota hoặc upgrade plan
```

### Image Generation Fails
```
❌ Không thể tạo ảnh
✅ Solutions:
- Thử model khác (gemini-2.0-flash-exp recommended)
- Kiểm tra prompt content (avoid restricted content)
- Test với prompt đơn giản trước
```

### Network Issues
```
❌ Lỗi kết nối mạng
✅ Solution: Kiểm tra internet connection và refresh
```

## 📊 Performance Tips

1. **Sử dụng model phù hợp**:
   - `gemini-1.5-flash` cho tốc độ
   - `gemini-1.5-pro` cho chất lượng và tạo ảnh
   - `gemini-1.0-pro` cho ổn định

2. **Optimize prompts**:
   - Ngắn gọn và rõ ràng
   - Sử dụng keywords hiệu quả
   - Tránh mô tả quá phức tạp

3. **Batch processing**:
   - Tạo multiple prompts cùng lúc
   - Sử dụng history để reuse prompts

## 🔄 Updates & Changelog

### Version 1.0.0 (Current)
- ✅ Core prompt generation for images and videos
- ✅ Multiple AI models support
- ✅ **NEW**: Direct image generation with Gemini API
- ✅ Advanced settings and customization
- ✅ History management
- ✅ Responsive design
- ✅ Test functionality for image generation

### Planned Features
- 🔄 Batch image generation
- 🔄 Image editing capabilities
- 🔄 Export to different formats
- 🔄 Collaboration features
- 🔄 API integration with other AI services

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Dự án này được phát hành dưới MIT License.

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) cho powerful AI capabilities
- [Vite](https://vitejs.dev/) cho blazing fast build tool
- Cộng đồng developers Việt Nam
- Tất cả người dùng và contributors

## 📞 Support

- 🐛 **Bug Reports**: GitHub Issues
- 💡 **Feature Requests**: GitHub Discussions
- 📧 **Contact**: your.email@example.com

---

Made with ❤️ using Google Gemini AI

**Happy Prompting! 🎨🚀**
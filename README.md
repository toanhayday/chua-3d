# 🛕 Không Gian Chùa 3D — Tịnh Tâm

Ứng dụng web mô phỏng không gian chùa Việt Nam 3D tương tác, phong cách soft clay, tất cả geometry và âm thanh được sinh procedural — **không cần file asset ngoài** (trừ Three.js).

## 🚀 Chạy nhanh

Yêu cầu: **trình duyệt hiện đại** (Chrome, Edge, Firefox, Safari) hỗ trợ ES modules + importmap.

Do dùng ES modules, **không mở trực tiếp `file://`** — cần chạy qua HTTP server.

### Cách 1 — Python (có sẵn trên Linux/macOS)

```bash
cd chua-3d
python3 -m http.server 8000
# Mở http://localhost:8000
```

### Cách 2 — Node.js

```bash
npx serve .
# hoặc: npx http-server -p 8000
```

### Cách 3 — VS Code

Cài extension **Live Server** → chuột phải `index.html` → **Open with Live Server**.

### Cách 4 — GitHub Pages

1. Push folder này lên repo GitHub.
2. **Settings → Pages → Source: `main` branch, `/ (root)`**.
3. Mở `https://<username>.github.io/<repo>/`.

---

## 📚 Sử dụng CDN (mặc định) hoặc Local libs

Mặc định `index.html` nạp Three.js từ **unpkg CDN** → chạy ngay không cần tải gì.

### Chuyển sang local libs (self-hosted / offline)

**Linux/macOS:**
```bash
chmod +x download-libs.sh
./download-libs.sh
```

**Windows:**
```bat
download-libs.bat
```

Sau đó sửa importmap trong `index.html`:

```html
<script type="importmap">
{
  "imports": {
    "three": "./libs/three.module.js",
    "three/addons/": "./libs/addons/"
  }
}
</script>
```

---

## 🎮 Điều khiển

| Phím | Chức năng |
|------|-----------|
| `W A S D` / phím mũi tên | Di chuyển |
| Chuột trái + kéo | Xoay camera |
| Cuộn chuột | Zoom |
| Click chuột xuống đất | Đi tới điểm đó |
| `E` | Ngồi / Đứng |
| `Space` | Gõ mõ |
| Nút góc phải | Đổi góc nhìn / Teleport / Tắt âm thanh |

---

## ✨ Tính năng

- **Kiến trúc chùa Việt**: sân gạch Bát Tràng, chánh điện gỗ lim, mái cong 2 tầng, tượng Phật ngồi đài sen, lư hương, mõ, chân đèn, hồ sen, đèn đá, cổng tam quan.
- **10 bồ đoàn** xếp 2 hàng, tương tác khi lại gần.
- **Nhân vật** áo tràng lam, animation đi / ngồi kiết già / chắp tay / lạy ngũ thể đầu địa.
- **5 nghi lễ**:
  1. Lạy Phật (1 lạy hoặc nhiều lạy)
  2. Thiền (1/3/5 phút hoặc tự do) — hướng dẫn nhịp thở 4-2-6
  3. Tụng kinh (3 bài) — gõ mõ highlight từng câu
  4. Thắp hương — hệ thống hạt khói procedural
  5. Dâng lễ — 4 loại lễ vật 3D
- **Âm thanh Web Audio API**: chuông chùa (6 họa âm), mõ gỗ, gió môi trường.
- **3 góc nhìn**: third-person, overview, first-person.

---

## 📁 Cấu trúc

```
chua-3d/
├── index.html
├── css/style.css
├── js/
│   ├── state.js        # Shared state + collision + ground height
│   ├── utils.js        # Procedural textures + math helpers
│   ├── audio.js        # Web Audio synthesis
│   ├── world.js        # Scene construction
│   ├── character.js    # Character model + animation + movement
│   ├── rituals.js      # 5 nghi lễ
│   ├── ui.js           # UI bindings + prompts
│   └── main.js         # Bootstrap + render loop
└── libs/               # (tùy chọn) Three.js local
```

## 📜 License

MIT — sử dụng tự do cho mục đích cá nhân và thương mại.
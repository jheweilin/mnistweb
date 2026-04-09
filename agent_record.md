# MNIST 手寫數字辨識網站 - 開發紀錄

## 專案目標

建立一個基於 Next.js 的網站，提供 MNIST 風格的手寫數字畫板，使用者可以在網頁上繪製數字並進行即時辨識。要求頁面美觀。

---

## 開發過程

### 1. 初始化專案

使用 `create-next-app` 建立 Next.js 專案，啟用 TypeScript、Tailwind CSS、App Router、src 目錄結構。

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

### 2. 第一版：TensorFlow.js 前端訓練（失敗）

最初安裝 `@tensorflow/tfjs`，在瀏覽器端建立 CNN 模型，使用合成手寫數字資料進行訓練。

**建立的元件：**
- `DrawingCanvas.tsx` — Canvas 畫板，支援滑鼠與觸控
- `PredictionDisplay.tsx` — 辨識結果與機率分佈顯示
- `TrainingProgress.tsx` — 訓練進度條
- `src/lib/mnist-model.ts` — 模型建立、合成資料訓練、推論

**問題：** 頁面一直卡在「載入模型中...」，TensorFlow.js 體積過大且後端初始化可能卡住。

**嘗試修復：**
- 將 `OffscreenCanvas` 改為 `document.createElement("canvas")` 以提升相容性
- 加上 `await tf.ready()` 確保後端初始化
- 明確安裝 `@tensorflow/tfjs-backend-cpu` 和 `@tensorflow/tfjs-backend-webgl`
- 加入詳細狀態提示與錯誤處理

仍然無法正常載入，使用者反映 TensorFlow.js 太大。

### 3. 第二版：ONNX Runtime Web 前端推論（放棄）

改用 `onnxruntime-web`，從 ONNX Model Zoo 下載預訓練的 MNIST 模型（`mnist-12.onnx`，僅 26KB）。

移除 TensorFlow.js，改用輕量的 ONNX Runtime 在瀏覽器端做推論。但使用者認為模型不需要載入前端。

### 4. 第三版：後端 API 推論（最終方案）

使用者要求前端只負責畫板，模型推論放在後端。

**架構調整：**
- 移除 `onnxruntime-web`，安裝 `onnxruntime-node`
- 建立 API Route：`/api/predict`（POST）
- 前端將畫板圖像縮放為 28x28 灰階，發送至後端 API
- 後端用 `onnxruntime-node` 載入 ONNX 模型推論，回傳結果

### 5. 部署設定

- 綁定 `0.0.0.0:25000`，透過本機 IP `140.134.24.83:25000` 存取
- `next.config.ts` 設定 `allowedDevOrigins`、`serverExternalPackages: ["onnxruntime-node"]`
- 最終關閉開發者模式，使用 `next build` + `next start` 以 production 模式運行

---

## 最終架構

```
前端 (瀏覽器)                          後端 (Next.js Server)
┌─────────────────────┐               ┌──────────────────────────┐
│  Canvas 畫板         │  POST /api/   │  onnxruntime-node        │
│  (280x280)          │  predict      │  載入 mnist-12.onnx      │
│  ↓ 縮放為 28x28     │ ───────────→  │  (26KB 預訓練模型)        │
│  ↓ 灰階正規化 0~1   │               │  ↓                       │
│                     │  ←──────────  │  回傳 digit, confidence, │
│  顯示辨識結果        │  JSON         │  probabilities           │
└─────────────────────┘               └──────────────────────────┘
```

## 最終檔案結構

```
mnistweb/
├── public/
│   └── mnist-12.onnx              # 預訓練 ONNX 模型 (26KB)
├── src/
│   ├── app/
│   │   ├── api/predict/route.ts   # 後端推論 API
│   │   ├── globals.css            # 全域樣式（深色主題、動畫）
│   │   ├── layout.tsx             # 根 Layout
│   │   └── page.tsx               # 主頁面
│   ├── components/
│   │   ├── DrawingCanvas.tsx      # 畫板元件
│   │   └── PredictionDisplay.tsx  # 辨識結果顯示元件
│   └── lib/
│       └── mnist-model.ts         # 前端圖像處理 + API 呼叫
├── next.config.ts
├── package.json
└── tsconfig.json
```

## ONNX 模型資訊

- **來源：** ONNX Model Zoo（`mnist-12.onnx`）
- **大小：** 26KB
- **輸入：** `Input3` — shape `[1, 1, 28, 28]`，float32，灰階像素值 0~1
- **輸出：** `Plus214_Output_0` — shape `[1, 10]`，經 softmax 後為各數字機率

## 遇到的問題與解決

| 問題 | 原因 | 解決方式 |
|------|------|----------|
| TensorFlow.js 卡在載入中 | 套件過大，WebGL/WASM 後端初始化失敗 | 改用 ONNX Runtime |
| Python 3.14 無法安裝 TensorFlow | TF 尚未支援 Python 3.14 | 改用預訓練模型，不在本機訓練 |
| `pip install` 被 PEP 668 阻擋 | macOS Homebrew Python 限制 | 使用 `--break-system-packages` flag |
| Next.js 16 Turbopack 與 webpack config 衝突 | 預設啟用 Turbopack | 改用 `turbopack: {}` 設定 |
| 跨域開發資源被阻擋 | Next.js 安全限制 | 設定 `allowedDevOrigins` |

## 伺服器部署紀錄（2026-04-09）

### 部署環境

- **伺服器：** Ubuntu 24.04 LTS
- **公網 IPv4：** `139.162.47.142`
- **公網 IPv6：** `2400:8901::2000:d1ff:fea3:8ef2`
- **網域：** `yukria.com`（Cloudflare DNS）
- **Node.js：** v22（透過 NodeSource 安裝）
- **反向代理：** Nginx 1.24

### 部署步驟

1. **生成 SSH Key** 並加入 GitHub，clone repo 到 `/root/mnistweb`
2. **加大 Swap**：伺服器只有 ~1GB RAM，`npm install` 會 OOM，新增 2GB swap file（`/swapfile2`）
3. **安裝依賴與建置：**
   ```bash
   npm install
   npm run build
   ```
4. **建立 systemd 服務** `/etc/systemd/system/mnistweb.service`，讓 Next.js 以 production 模式在 port 3000 運行
5. **設定 Nginx 反向代理** `/etc/nginx/sites-available/yukria.com`，監聽 80 port（IPv4 + IPv6），反向代理到 `127.0.0.1:3000`
6. **Cloudflare DNS 設定：**
   - A 記錄 `@` → `139.162.47.142`（Proxied）
   - AAAA 記錄 `@` → `2400:8901::2000:d1ff:fea3:8ef2`（Proxied）
   - SSL/TLS 模式設為 Flexible

### 遇到的問題

| 問題 | 原因 | 解決方式 |
|------|------|----------|
| SSH clone 失敗 | 伺服器無 SSH key | 生成 ed25519 key 並加入 GitHub |
| `npm install` 被 OOM Killed（exit 137） | 伺服器僅 ~1GB RAM + 496MB swap | 新增 2GB swap file `/swapfile2` |
| Cloudflare 回傳 521 錯誤 | Nginx 未監聽 IPv6，Cloudflare 透過 IPv6 連入 | Nginx 加上 `listen [::]:80` |
| 521 仍持續 | Cloudflare SSL 模式為 Full，但伺服器無 SSL 憑證 | 改為 Flexible 模式 |

### 服務管理

```bash
# 查看服務狀態
systemctl status mnistweb

# 重啟服務
systemctl restart mnistweb

# 重啟 Nginx
systemctl restart nginx
```

### 設定檔位置

| 檔案 | 路徑 |
|------|------|
| Next.js 專案 | `/root/mnistweb` |
| systemd 服務 | `/etc/systemd/system/mnistweb.service` |
| Nginx 設定 | `/etc/nginx/sites-available/yukria.com` |
| Swap file | `/swapfile2` |

## 啟動方式

```bash
# Production 模式（已由 systemd 管理，一般不需手動執行）
npm run build
npm run start
```

# 錯題本系統 (Math Mistake Tracker)

這是一個專為中學數學科設計的全棧錯題管理系統，使用 React (Vite) + Tailwind CSS + Firebase (Auth, Firestore, Storage) 開發。

## 系統架構

1. **前端 (React + Tailwind CSS)**:
   - 負責渲染使用者介面，採用 Mobile-First 設計，適合學生在手機上上傳錯題圖片。
   - 使用 `react-router-dom` 進行頁面跳轉，並透過 AuthContext 保護路由。
2. **後端 (Firebase)**:
   - **Authentication**: 使用 Email/Password 進行身份驗證。
   - **Firestore**: 儲存使用者資料 (`users`)、錯題記錄 (`mistakes`) 以及全域設定 (`settings/global`)。
   - **Storage**: 儲存學生上傳的錯題圖片與正確答案圖片。

## 權限與安全規則 (Security Rules)

- **學生**: 只能讀寫自己的錯題記錄，並能查看自己的帳號資訊。
- **教師**: 可查看所有學生的錯題記錄與統計數據。
- **管理員**: 擁有最高權限，可新增帳號、管理系統設定（科目、單元、錯誤類型等）。
- **密碼管理**: 基於純前端環境與 Firebase Client SDK 限制，無法由管理員直接修改他人密碼，因此若學生忘記密碼，建議請學生於登入頁點擊「忘記密碼」透過信箱重設，或由管理員直接刪除重建。初次建檔時會強制開啟 `mustChangePassword` 讓學生初次登入時修改。

## Firebase 設定步驟

系統已整合 Google AI Studio 的 Firebase 自動化設置流程。
如果您需要在本地開發：
1. 確保擁有 Firebase 專案，並開啟 Authentication (Email/Password), Firestore 與 Storage。
2. 將 `firebase-blueprint.json` 裡的 `firestore.rules` 複製到 Firebase Console。
3. 將 `storage.rules` 複製到 Firebase Storage Rules。
4. 於前端替換 `firebase-applet-config.json` 內的配置。

## 部署說明 (Deployment)

1. **Google Sites 嵌入說明**:
   本應用程式為具有登入狀態與後端資料庫的單頁應用程式 (SPA)，**不建議直接匯出為單一 HTML** 嵌入 Google Sites（因為檔案過大且包含許多打包的 JS 與 SDK）。
   **建議做法**：
   - 透過 GitHub Pages 或 Firebase Hosting 進行靜態網站部署。
   - 部署完成後，將網址以 `<iframe>` 的形式嵌入 Google Sites。

2. **GitHub Pages 部署步驟**:
   ```bash
   npm run build
   ```
   將 `dist/` 資料夾的內容上傳至 GitHub 儲存庫，並開啟 GitHub Pages 服務（來源選擇 main 分支）。

## 管理員初始設定

- 如果環境自動化配置完成，系統的第一個使用者 (email: `wongph@twghkywc.edu.hk`) 會在登入時自動獲得 `admin` 權限。
- 登入後，請至「系統設定」加入所需的班級、單元與錯誤類型，再至「帳號管理」建立學生帳號。

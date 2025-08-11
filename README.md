# 時間表管理系統 | Timesheet Management System

一個基於網頁的工時管理應用程式，支援多週工時記錄、自動驗證、CSV匯出匯入等功能。  
*A web-based timesheet management application with multi-week support, automatic validation, and CSV import/export capabilities.*

![Version](https://img.shields.io/badge/version-3.3.4-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Web-orange.svg)

## ✨ 主要特色 | Key Features

- 🗓️ **多週工時管理** - 卡片式介面管理不同週次的工時記錄
- 📊 **智慧型資料驗證** - Admin/Training規則、8小時工時限制等自動驗證
- 🔗 **Zone聯動機制** - 區域選擇自動篩選對應專案和產品模組
- 📤 **CSV匯出匯入** - 支援UTF-8編碼，含正規化和衝突處理
- 🛡️ **TPM驗證工具** - 獨立的合規性檢查儀表板
- 📱 **響應式設計** - 適配桌面、平板、手機各種裝置
- 💾 **本地資料儲存** - 使用localStorage，無需伺服器

## 🚀 快速開始 | Quick Start

### 線上使用 | Online Usage
直接訪問 GitHub Pages 部署版本：
```
https://lisyanggf.github.io/timesheet/
```

### 本地部署 | Local Deployment
```bash
# 克隆專案
git clone https://github.com/lisyanggf/timesheet.git

# 進入目錄
cd timesheet

# 使用任何HTTP伺服器服務靜態檔案
# 例如：Python
python -m http.server 8000

# 或者：Node.js
npx serve .

# 瀏覽器開啟
open http://localhost:8000
```

### 首次使用設定 | Initial Setup
1. 開啟 `index.html`
2. 點擊「基本資料設定」
3. 填寫員工姓名和類型（Internal/Outsource）
4. 點擊「新建」建立第一個工時表

## 📁 專案結構 | Project Structure

```
timesheet/
├── index.html              # 主頁面 - 工時表卡片列表
├── edit.html               # 編輯頁面 - 工時記錄管理
├── tpm-validator.html      # TPM驗證工具
├── app-bundled.js          # 核心應用邏輯（單一檔案）
├── style.css               # 樣式檔案
├── favicon.svg             # 網站圖示
├── test-floating-point.csv # 浮點數精度測試資料
├── test-validation-fix.html # 驗證修復測試頁面
├── *.csv                   # 參考資料檔案
├── docs/                   # 文件目錄
│   ├── user/               # 使用者文件
│   ├── technical/          # 技術文件
│   └── ai-guidance/        # AI助手指引
└── README.md               # 專案說明（本檔案）
```

## 📚 文件導覽 | Documentation

### 📖 使用者文件 | User Documentation
- **[完整使用指南](docs/user/USER_GUIDE.md)** - 詳細的使用說明和功能介紹
- **快速參考** - 常用操作和故障排除

### 🔧 技術文件 | Technical Documentation  
- **[技術指南](docs/technical/TECHNICAL_GUIDE.md)** - 系統架構、API、開發指南
- **程式碼結構** - 詳細的實作說明

### 🤖 AI助手指引 | AI Assistant Guidance
- **[AI助手指南](docs/ai-guidance/AI_ASSISTANT_GUIDE.md)** - AI助手開發指引
- **[Claude Code指引](docs/ai-guidance/CLAUDE.md)** - Claude專用指引
- **[Gemini指引](docs/ai-guidance/GEMINI.md)** - Gemini專用指引

## 🛠️ 技術規格 | Technical Specifications

### 核心技術 | Core Technologies
- **前端**: HTML5, CSS3, JavaScript ES6+
- **資料儲存**: localStorage
- **檔案格式**: CSV (UTF-8)
- **部署**: GitHub Pages

### 瀏覽器支援 | Browser Support
- Chrome 70+ ✅
- Firefox 65+ ✅  
- Safari 12+ ✅
- Edge 79+ ✅

### 系統需求 | System Requirements
- 現代網頁瀏覽器
- JavaScript 啟用
- localStorage 支援
- 1MB+ 可用儲存空間

## 🎯 主要功能 | Main Features

### 📝 工時記錄管理
- 多種活動類型（編程、測試、設計等）
- 自動工時計算（正常+加班=總工時）
- 日期範圍驗證
- 即時表單驗證

### 🔍 資料驗證系統
- **8小時正常工時限制** - 防止錯誤輸入
- **Admin/Training規則** - 自動設定對應Zone/Project
- **週次日期驗證** - 確保資料一致性
- **TPM合規檢查** - 批次驗證工具

### 📊 匯出匯入功能
- **CSV匯出** - UTF-8編碼，支援正規化
- **CSV匯入** - 自動週次分組，衝突處理
- **資料備份** - 定期匯出防止資料遺失

### 🎨 使用者介面
- **響應式設計** - 適配各種螢幕尺寸
- **卡片式佈局** - 直觀的週次管理
- **即時回饋** - 操作狀態即時顯示

## 📈 版本歷程 | Version History

### v3.3.4 (2025-08-11) - Current

**文件更新：**
- 📚 修正 v3.3.3 技術改進說明，準確反映浮點數容錯實作
- 📚 新增 `isFloatEqual` 函數和精度處理機制的詳細說明
- 📚 更新專案結構，包含新增的測試檔案
- 📚 完善浮點數精度問題修復的文件記錄

### v3.3.3 (2025-08-11)

**新增功能：**
- ✅ TPM驗證器新增第11個驗證規則：總工時加總檢查
- ✅ 驗證每一工作列的總工時是否等於正常工時加上加班工時
- ✅ 提供精確的錯誤訊息和行號定位
- ✅ 新增浮點數精度處理機制，解決小數計算誤差問題

**技術改進：**
- 🔧 實作 `isFloatEqual` 函數，使用容錯機制處理浮點數比較
- 🔧 支援4位小數精度（epsilon = 0.0001）的數值比較
- 🔧 針對每個記錄進行獨立驗證
- 🔧 新增測試檔案驗證浮點數處理邏輯

**修復問題：**
- 🐛 修復因JavaScript浮點數精度導致的驗證誤報
- 🐛 解決 0.1 + 0.2 !== 0.3 等經典浮點數比較問題

### v3.3.2 (2025-07-02)
- **🔗 TPM檔案合併工具**: 新增檔案合併功能，支援將兩個已匯出的TPM檔案合併
- **🔍 智能重複檢測**: 自動識別重複記錄，提供三種處理模式
- **📊 即時預覽**: 合併前顯示詳細統計和重複記錄分析
- **📚 完整文件**: 更新所有用戶和技術文件

### v3.2.6 (2025-07-01)
- 🐛 修復匯出按鈕事件處理器缺失問題
- 🐛 解決連續匯出時檔案選擇器閃退問題
- ⚡ 優化CSV下載時序，避免瀏覽器限制

### v3.2.5 (2025-07-01)
- ➕ 新增編輯頁面匯出和新增記錄按鈕功能

### v3.2.4 (2025-07-01)
- 🚀 延遲重複檢查至匯出操作時執行
- 🎨 改善TPM驗證工具使用者體驗

### v3.2.3 (2025-07-01)
- 🎯 完整實作TPM驗證儀表板
- 🔧 修復語法錯誤和程式碼清理

## 🤝 開發指南 | Development Guide

### 本地開發 | Local Development
```bash
# 克隆專案
git clone https://github.com/lisyanggf/timesheet.git
cd timesheet

# 直接用瀏覽器開啟 index.html
# 或使用本地伺服器（推薦）
python -m http.server 8000
```

### 程式碼架構 | Code Architecture
- **單檔部署**: 所有邏輯整合在 `app-bundled.js`
- **模組化設計**: 邏輯分層但不使用ES6模組
- **事件驅動**: 基於DOM事件的互動邏輯

### 貢獻流程 | Contributing
1. Fork 專案
2. 建立功能分支
3. 提交變更
4. 發起 Pull Request

## 📞 支援與回饋 | Support & Feedback

### 問題回報 | Issue Reporting
如遇到問題或需要功能建議，請：
1. 檢查 [使用指南](docs/user/USER_GUIDE.md) 中的常見問題
2. 在 GitHub Issues 中建立新問題
3. 提供詳細的錯誤描述和重現步驟

### 聯絡資訊 | Contact Information
- **GitHub Issues**: [專案問題追蹤](https://github.com/lisyanggf/timesheet/issues)
- **專案維護者**: lisyanggf

## 📄 授權條款 | License

本專案使用 MIT 授權條款。詳見 [LICENSE](LICENSE) 檔案。

```
Copyright (c) 2024 lisyanggf

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

## 🙏 致謝 | Acknowledgments

感謝所有為此專案做出貢獻的開發者和使用者。

---

## 🔗 相關連結 | Related Links

- **[線上演示](https://lisyanggf.github.io/timesheet/)** - 即時體驗系統功能
- **[完整使用指南](docs/user/USER_GUIDE.md)** - 詳細使用說明
- **[技術文件](docs/technical/TECHNICAL_GUIDE.md)** - 開發和部署指南
- **[GitHub專案](https://github.com/lisyanggf/timesheet)** - 原始碼和問題追蹤

---

*最後更新: 2025-08-11 | Version 3.3.4*
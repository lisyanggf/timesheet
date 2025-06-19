# 時間表系統技術實作文件

## 📋 專案概述

本專案實作了一個完整的工時表填寫系統，支援多週管理、CSV 資料載入、全域基本資料設定等功能。

## 🏗️ 系統架構

### 檔案結構
```
timesheet/
├── index.html              # 主頁面 - 工時表列表
├── edit.html               # 編輯頁面 - 工時記錄編輯
├── style.css               # 樣式表
├── app.js                  # 核心邏輯
├── activityType.csv        # 活動類型資料
├── projectcode.csv         # 專案代碼資料
├── productcode.csv         # 產品代碼資料
├── timesheetplan.md        # 原始需求文件
└── implementation-plan.md   # 實作計劃文件
```

### 技術堆疊
- **前端**：HTML5, CSS3, 原生 JavaScript
- **資料儲存**：localStorage
- **資料來源**：CSV 檔案動態載入
- **樣式框架**：無外部依賴，純 CSS 實作

## 🔧 核心功能實作

### 1. 全域基本資料管理

#### 資料結構
```javascript
// localStorage 儲存結構
{
  "globalBasicInfo": {
    "employeeName": "員工姓名",
    "employeeType": "Internal|Outsource"
  }
}
```

#### 關鍵函數
```javascript
// 載入全域基本資料
function loadGlobalBasicInfo()

// 儲存全域基本資料
function saveGlobalBasicInfo(basicInfo)

// 顯示基本資料設定模態框
function showBasicInfoModal()
```

### 2. CSV 資料載入系統

#### CSV 檔案結構

**projectcode.csv**：
```csv
Project,Zone,Charge Code,PM,Content,Zone Helper
```

**productcode.csv**：
```csv
Module,Product,Zone,Product Module
```

**activityType.csv**：
```csv
Activity Type
```

#### 核心載入邏輯
```javascript
// 非同步載入 CSV 檔案
async function loadCSVFile(filename)

// 解析 CSV 文字
function parseCSV(text)

// 載入所有 CSV 資料
async function loadAllCSVData()
```

### 3. Zone 聯動機制

#### 實作流程
1. 使用者選擇 Zone
2. 觸發 `updateProjectDropdown(zone)`
3. 觸發 `updateProductModuleDropdown(zone)`
4. 清空相關欄位

#### 關鍵函數
```javascript
// 根據 Zone 篩選專案
function getProjectsByZone(zone)

// 根據 Zone 篩選產品模組
function getProductModulesByZone(zone)

// 根據專案取得專案經理
function getPMByProject(projectName)
```

### 4. 工時記錄管理

#### 資料結構
```javascript
// localStorage 儲存結構
{
  "timesheets": {
    "2023-W25": [
      {
        "id": "unique-id",
        "name": "從全域基本資料引用",
        "internalOrOutsource": "從全域基本資料引用", 
        "zone": "Customer Portal",
        "project": "專案名稱",
        "productModule": "產品模組",
        "activityType": "Coding",
        "task": "任務描述",
        "regularHours": 8,
        "otHours": 0,
        "ttlHours": 8,
        "date": "2023-06-19",
        "startDate": "2023-06-19",
        "endDate": "2023-06-19",
        "comments": "備註",
        "pm": "專案經理"
      }
    ]
  }
}
```

#### CRUD 操作
```javascript
// 獲取指定週次的工時記錄
function getWeekEntries(weekKey)

// 儲存指定週次的工時記錄
function saveWeekEntries(weekKey, entries)

// 儲存工時記錄
function saveEntry()

// 編輯工時記錄
function editEntry(entryId)

// 刪除工時記錄
function deleteEntry(entryId)
```

### 5. 表單驗證系統

#### 驗證規則
- 必填欄位檢查
- 工時範圍驗證（0-24 小時）
- 日期邏輯驗證
- 基本資料前置檢查

#### 實作方式
```javascript
// 驗證基本資料表單
function validateBasicInfo()

// 驗證工時記錄表單
function validateForm()

// 顯示欄位錯誤訊息
function showFieldError(formField, message)
```

## 🎨 UI/UX 設計

### 響應式設計
- **桌面版**：2 欄佈局，卡片網格顯示
- **平板版**：2 欄卡片佈局
- **手機版**：1 欄垂直佈局

### 視覺元素
- **卡片化設計**：工時表列表使用卡片展示
- **色彩系統**：綠色（成功）、藍色（主要）、橙色（警告）、紅色（錯誤）
- **動畫效果**：懸停、點擊、模態框出現等過渡動畫

### 互動設計
- **即時計算**：正常工時 + 加班工時 = 總工時
- **聯動選擇**：Zone → Project/Product Module → PM
- **模態框**：基本資料設定使用彈出式設計

## 🔄 資料流程

### 初始化流程
1. 頁面載入
2. 檢查當前路徑（首頁/編輯頁）
3. 載入 CSV 資料
4. 載入基本資料
5. 初始化表單和事件監聽器

### 工時記錄建立流程
1. 檢查基本資料是否已設定
2. 選擇 Zone
3. 自動載入 Project 和 Product Module 選項
4. 選擇 Project，自動填入 PM
5. 填寫其他欄位
6. 驗證表單
7. 儲存到 localStorage
8. 更新列表顯示

## 📊 效能考量

### 資料載入優化
- CSV 檔案在頁面初始化時一次性載入
- 使用快取避免重複載入
- 非同步載入不阻塞 UI

### 記憶體管理
- 使用全域變數存儲 CSV 資料
- localStorage 自動管理過期資料
- 避免記憶體洩漏

## 🛠️ 開發工具與部署

### 開發環境
- 使用 Python HTTP Server 進行本地測試
- VSCode 作為主要編輯器
- Chrome DevTools 進行偵錯

### 部署方式
- 支援靜態檔案部署
- 可透過 GitHub Pages 托管
- 無需伺服器端處理

## 🐛 錯誤處理

### CSV 載入錯誤
```javascript
try {
    const response = await fetch(filename);
    const text = await response.text();
    return parseCSV(text);
} catch (error) {
    console.error(`載入 ${filename} 失敗:`, error);
    return [];
}
```

### 表單驗證錯誤
- 即時顯示錯誤訊息
- 紅色邊框標示錯誤欄位
- 滾動到第一個錯誤欄位

### localStorage 錯誤
- 捕捉 QuotaExceededError
- 提供清理建議
- 備用方案處理

## 🔒 資料安全

### 本地儲存安全
- 所有資料存儲在使用者本地
- 無敏感資料傳輸
- 支援資料導出備份

### 輸入驗證
- 前端表單驗證
- 資料類型檢查
- XSS 防護（自動跳脫）

---

*此文件記錄了時間表系統的完整技術實作細節*
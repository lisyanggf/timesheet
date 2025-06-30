# 時間表系統技術實作文件

## 📋 專案概述

本專案實作了一個完整的工時表填寫系統，支援多週管理、CSV 資料載入、全域基本資料設定等功能。

## 🏗️ 系統架構

### 檔案結構
```
timesheet/
├── index.html              # 主頁面 - 工時表卡片列表
├── edit.html               # 編輯頁面 - 工時記錄編輯
├── tpm-validator.html      # TPM 驗證工具儀表板
├── style.css               # 樣式表
├── app-bundled.js          # 完整應用邏輯（單一檔案）
├── activityType.csv        # 活動類型資料
├── projectcode.csv         # 專案代碼資料
├── productcode.csv         # 產品代碼資料
├── CLAUDE.md               # Claude AI 指導文件
├── gemini.md               # Gemini AI 指導文件
├── timesheetplan.md        # 原始需求文件
├── implementation-plan.md   # 實作計劃文件
├── technical-implementation.md # 技術實作文件
├── user-guide-and-features.md # 使用者指南
└── timesheet.md            # 應用說明文件
```

### 技術堆疊
- **前端**：HTML5, CSS3, 原生 JavaScript
- **資料儲存**：localStorage
- **資料來源**：CSV 檔案動態載入
- **樣式框架**：無外部依賴，純 CSS 實作

## 🔧 核心功能實作

### 1. 多週工時表管理

#### 週次鍵值格式
```javascript
// 週次鍵值格式：YYYY-Www
const weekKey = `${year}-W${weekNumber.toString().padStart(2, '0')}`;
// 例如：2024-W25
```

#### 卡片列表功能
- 卡片化展示所有週次工時表
- 支援新建、編輯、刪除、複製操作
- 響應式網格佈局適配各種裝置

### 2. 全域基本資料管理

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
4. **清空 PM 欄位**（重要：PM 需要 Zone + Project 組合）

#### 關鍵函數
```javascript
// 根據 Zone 篩選專案
function getProjectsByZone(zone)

// 根據 Zone 篩選產品模組
function getProductModulesByZone(zone)

// 根據 Zone + Project 取得專案經理
function getPMByZoneAndProject(zone, project)

// Zone 變更事件處理
function handleZoneChange() {
    const pmField = document.getElementById('pm');
    if (pmField) {
        pmField.value = ''; // 清空 PM 欄位
    }
}
```

#### 重要特性
- **PM 查找邏輯**：必須同時考慮 Zone 和 Project，因為不同 Zone 可能有同名專案
- **聯動清空**：Zone 變更時自動清空 PM 欄位，避免資料不一致

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

### 5. CSV 導入/導出功能

#### 導出功能
```javascript
// CSV 導出（支援 UTF-8 編碼）
function exportToCSV()

// 正規化模式（週總工時 > 40 小時時調整）
function normalizeHours(entries)
```

#### 導入功能
```javascript
// CSV 檔案導入
function importFromCSV(file)

// 基本資訊衝突處理
function handleBasicInfoConflict(csvData, localData)

// 顯示選擇對話框
function showBasicInfoChoiceDialog(message, option1, option2, isConfirmDialog)
```

#### 衝突處理機制
- **一致資料**：顯示確認對話框（繼續匯入/取消匯入）
- **衝突資料**：顯示選擇對話框（使用本地資料/使用CSV資料）
- **無取消選項**：衝突時使用者必須選擇其中一個資料來源

### 6. TPM 驗證工具

#### 獨立儀表板（tpm-validator.html）
```javascript
// 驗證規則引擎
function validateTPMRules(data)

// Admin/Training 活動驗證
function validateAdminTrainingRules(entries)

// 8小時正常工時驗證
function validateRegularHoursRule(entries)

// 週總工時驗證
function validateWeeklyTotalHours(entries)
```

#### 驗證規則
- **Admin/Training 限制**：特定規則檢查
- **8小時正常工時**：確保符合標準工時
- **週總工時範圍**：檢查是否在合理範圍內

### 7. 表單驗證系統

#### 驗證規則
- 必填欄位檢查
- 工時範圍驗證（0-24 小時）
- 日期邏輯驗證
- 基本資料前置檢查
- 週內日期範圍驗證

#### 實作方式
```javascript
// 驗證基本資料表單
function validateBasicInfo()

// 驗證工時記錄表單
function validateForm()

// 顯示欄位錯誤訊息
function showFieldError(formField, message)

// 週內日期驗證
function validateDateWithinWeek(date, weekKey)
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
- 單一檔案 `app-bundled.js` 減少 HTTP 請求

### 記憶體管理
- 使用全域變數存儲 CSV 資料
- localStorage 自動管理過期資料
- 避免記憶體洩漏
- 卡片列表虛擬化處理大量週次資料

### 使用者體驗優化
- 即時表單驗證回饋
- 自動計算總工時
- 聯動下拉選單即時更新
- 載入狀態指示器

## 🛠️ 開發工具與部署

### 開發環境
- 使用 Python HTTP Server 進行本地測試
- VSCode 作為主要編輯器
- Chrome DevTools 進行偵錯

### 部署方式
- 支援靜態檔案部署
- 可透過 GitHub Pages 托管
- 無需伺服器端處理
- 單一 JavaScript 檔案設計符合 GitHub Pages 要求

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

### CSV 導入錯誤
- 檔案格式驗證
- 欄位映射檢查
- 基本資訊衝突處理
- 使用者友善的錯誤訊息

## 🔒 資料安全

### 本地儲存安全
- 所有資料存儲在使用者本地
- 無敏感資料傳輸
- 支援資料導出備份

### 輸入驗證
- 前端表單驗證
- 資料類型檢查
- XSS 防護（自動跳脫）

## 🏆 專案完成狀態

### ✅ 100% 完成功能
1. **多週工時表管理** - 卡片列表、CRUD 操作
2. **工時細節編輯** - 13個欄位完整表單
3. **CSV 資料整合** - 動態載入、聯動機制
4. **Zone 聯動系統** - 自動填充 Project/PM
5. **導入/導出功能** - CSV 格式，衝突處理
6. **TPM 驗證工具** - 獨立儀表板，多重驗證規則
7. **表單驗證系統** - 即時驗證、錯誤處理
8. **響應式設計** - 適配各種裝置
9. **本地資料儲存** - localStorage 持久化

### 🔧 技術特色
- **單一檔案架構**：`app-bundled.js` 包含所有功能
- **無外部依賴**：純原生 JavaScript 實作
- **GitHub Pages 相容**：靜態檔案部署
- **使用者體驗優化**：即時回饋、聯動更新

---

*此文件記錄了時間表系統的完整技術實作細節*
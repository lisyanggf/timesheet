# 時間表系統技術文件
*Timesheet Application Technical Documentation*

## 🏗️ 系統架構

### 核心設計理念
- **純前端應用**：無後端伺服器，完全在瀏覽器中運行
- **單檔部署**：所有功能整合於 `app-bundled.js`，適合 GitHub Pages 部署
- **本地持久化**：使用 localStorage 儲存所有資料
- **CSV 整合**：透過 CSV 檔案載入參考資料

### 技術棧
- **前端**：Vanilla HTML5, CSS3, JavaScript ES6+
- **樣式**：CSS Grid, Flexbox, 響應式設計
- **資料**：localStorage, JSON, CSV
- **工具**：Blob API, URL API, FileReader API

## 📁 檔案結構

```
timesheet/
├── index.html              # 主頁面（工時表卡片列表）
├── edit.html               # 編輯頁面（單週工時記錄）
├── tpm-validator.html      # TPM驗證工具頁面
├── app-bundled.js          # 核心應用邏輯（單一檔案）
├── style.css               # 樣式檔案
├── favicon.svg             # 網站圖示
├── projectcode.csv         # 專案參考資料
├── productcode.csv         # 產品模組參考資料
├── activityType.csv        # 活動類型參考資料
└── docs/                   # 文件目錄
    ├── user/               # 使用者文件
    ├── technical/          # 技術文件
    └── ai-guidance/        # AI助手指引
```

## 🗃️ 資料模型

### localStorage 結構

#### 1. 工時表資料 (`timesheets`)
```javascript
{
  "2024-W25": [
    {
      "id": "unique-id",
      "task": "任務描述",
      "zone": "Customer Portal",
      "project": "專案名稱",
      "productModule": "產品模組",
      "activityType": "Coding",
      "regularHours": 8,
      "otHours": 2,
      "ttlHours": 10,
      "date": "2024-06-17",
      "startDate": "2024-06-17",
      "endDate": "2024-06-18",
      "comments": "備註",
      "pm": "專案經理"
    }
  ]
}
```

#### 2. 全域基本資料 (`globalBasicInfo`)
```javascript
{
  "employeeName": "張三",
  "employeeType": "Internal"
}
```

### CSV 資料格式

#### projectcode.csv
```csv
Project,Zone,Charge Code,PM,Content,Zone Helper
專案名稱,Customer Portal,2025-CP001,Evelyn,專案內容描述,Customer Portal
```

#### productcode.csv
```csv
Module,Product,Zone,Product Module
Dashboard,Customer Portal,Customer Portal,Customer Portal Dashboard
```

#### activityType.csv
```csv
Activity Type
UI/UX Design
Architecture Planning
System Design
Coding
Testing / QA
Deployment / Monitoring
Troubleshooting
Requirement Analysis
Admin / Training
Leave
```

## 🔧 核心功能實作

### 週次計算邏輯

```javascript
// 週次格式：YYYY-Www（週日為週首）
const WeekUtils = {
    // 從日期取得週次
    getWeekNumber(date) {
        const d = new Date(date);
        const sunday = new Date(d);
        sunday.setDate(d.getDate() - d.getDay());
        
        const year = sunday.getFullYear();
        const firstDayOfYear = new Date(year, 0, 1);
        const firstSunday = new Date(firstDayOfYear);
        const dayOfWeek = firstDayOfYear.getDay();
        
        if (dayOfWeek !== 0) {
            firstSunday.setDate(1 + (7 - dayOfWeek) % 7);
        }
        
        const diff = sunday.getTime() - firstSunday.getTime();
        const weekNumber = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
        return weekNumber;
    },

    // 從週次取得日期範圍
    getWeekDateRange(weekNumber, year) {
        // 實作週次到日期範圍的轉換
    }
};
```

### Zone 聯動機制

```javascript
// Zone 變更時的處理邏輯
zoneSelect.addEventListener('change', function() {
    const selectedZone = this.value;
    
    // 清空 PM 欄位（重要：不同Zone可能有同名專案）
    const pmField = document.getElementById('pm');
    if (pmField) {
        pmField.value = '';
    }
    
    // 更新專案和產品模組選項
    updateProjectOptions(selectedZone);
    updateProductModuleOptions(selectedZone);
});
```

### Admin / Training 驗證

```javascript
function handleActivityTypeChange(activityType) {
    if (activityType === 'Admin / Training') {
        // 強制設定對應欄位
        document.getElementById('zone').value = 'Admin';
        document.getElementById('project').value = 'Admin';
        document.getElementById('productModule').value = 'Non Product Non Product';
        
        // 鎖定Zone選擇
        document.getElementById('zone').disabled = true;
    } else {
        // 解除Zone鎖定
        document.getElementById('zone').disabled = false;
    }
}
```

### 8小時工時驗證

```javascript
function validateRegularHours(value) {
    const hours = parseFloat(value);
    if (isNaN(hours) || hours < 0) {
        return { isValid: false, message: '正常工時必須為正數', maxValue: '0' };
    }
    if (hours > 8) {
        return { isValid: false, message: '正常工時不能超過8小時！', maxValue: '8' };
    }
    return { isValid: true };
}

// 即時驗證
regularHoursInput.addEventListener('input', function() {
    const validation = validateRegularHours(this.value);
    if (!validation.isValid) {
        alert(validation.message);
        this.value = validation.maxValue;
        this.focus();
    }
    calculateTotalHours();
});
```

### CSV 匯出功能

```javascript
async function exportTimesheet(weekKey) {
    const entries = getWeekEntries(weekKey);
    if (entries.length === 0) {
        await showAlert('該週沒有工時記錄可以匯出');
        return;
    }
    
    // 檢查是否需要正規化（週總工時 > 40小時）
    const totalRegularHours = entries.reduce((sum, entry) => 
        sum + (parseFloat(entry.regularHours) || 0), 0);
    
    let shouldNormalize = false;
    if (totalRegularHours > 40) {
        shouldNormalize = await showConfirm('是否要進行正規化處理？');
    }
    
    const csvContent = generateCSVContent(entries, shouldNormalize);
    const filename = 'timesheet_' + weekKey + '.csv';
    downloadCSVFile(csvContent, filename);
}
```

### 下載時序優化

```javascript
function downloadCSVFile(csvContent, filename) {
    try {
        const BOM = '\uFEFF';  // UTF-8 BOM
        const blob = new Blob([BOM + csvContent], { 
            type: 'text/csv;charset=utf-8;' 
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        
        // 延遲執行避免瀏覽器連續下載限制
        setTimeout(() => {
            link.click();
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
        }, 50);
    } catch (err) {
        console.error('Download error:', err);
    }
}
```

## 🎯 TPM 驗證工具

### 驗證規則實作

```javascript
// Admin/Training 規則驗證
function validateAdminTrainingRules(entries) {
    const violations = [];
    entries.forEach((entry, index) => {
        if (entry.activityType === 'Admin / Training') {
            if (entry.zone !== 'Admin' || 
                entry.project !== 'Admin' || 
                entry.productModule !== 'Non Product Non Product') {
                violations.push({
                    row: index + 1,
                    rule: 'Admin/Training 規則',
                    message: 'Admin/Training活動必須使用Admin區域和專案'
                });
            }
        }
    });
    return violations;
}

// 8小時工時規則驗證
function validateRegularHoursRules(entries) {
    const violations = [];
    entries.forEach((entry, index) => {
        const regularHours = parseFloat(entry.regularHours) || 0;
        if (regularHours > 8) {
            violations.push({
                row: index + 1,
                rule: '8小時工時規則',
                message: `正常工時 ${regularHours} 超過8小時上限`
            });
        }
    });
    return violations;
}
```

### 批次檔案處理

```javascript
async function validateAllFiles() {
    const fileInputs = document.querySelectorAll('.file-input');
    const results = new Map();
    
    for (const input of fileInputs) {
        if (input.files.length > 0) {
            const file = input.files[0];
            try {
                const result = await validateCSVFile(file);
                results.set(file.name, {
                    status: result.violations.length === 0 ? 'pass' : 'fail',
                    violations: result.violations,
                    data: result.data  // 重要：儲存解析的資料
                });
            } catch (error) {
                results.set(file.name, {
                    status: 'error',
                    error: error.message
                });
            }
        }
    }
    
    displayValidationResults(results);
}
```

### 檔案合併功能

TPM驗證工具新增了檔案合併功能，允許將兩個已匯出的TPM檔案合併為一個：

#### 核心實作邏輯

```javascript
// 檔案載入和解析
function handleCombineFileSelection(event, fileType) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsedData = parseCSVContent(e.target.result);
            if (fileType === 'A') {
                combineFileAData = parsedData;
                combineFileAName = file.name;
            } else {
                combineFileBData = parsedData;
                combineFileBName = file.name;
            }
            updateCombinationPreview();
        } catch (error) {
            handleFileLoadError(error, fileType);
        }
    };
    reader.readAsText(file);
}

// 重複記錄檢測算法
function detectDuplicateRecords(fileAData, fileBData) {
    const fileAKeys = new Set();
    fileAData.forEach(entry => {
        fileAKeys.add(generateRecordKey(entry));
    });
    
    const duplicates = [];
    const uniqueFromB = [];
    
    fileBData.forEach(entry => {
        const key = generateRecordKey(entry);
        if (fileAKeys.has(key)) {
            duplicates.push(entry);
        } else {
            uniqueFromB.push(entry);
        }
    });
    
    return { duplicates, uniqueFromB };
}

// 合併策略實作
function performFileCombination(handlingMode) {
    const { duplicates, uniqueFromB } = detectDuplicateRecords(
        combineFileAData, combineFileBData
    );
    
    let finalData = [...combineFileAData]; // 總是包含檔案A
    
    switch (handlingMode) {
        case 'skip':
            // 只加入檔案B的唯一記錄
            finalData.push(...uniqueFromB);
            break;
            
        case 'include':
            // 加入所有檔案B記錄，標記重複
            combineFileBData.forEach(entry => {
                const isDuplicate = duplicates.some(dup => 
                    generateRecordKey(dup) === generateRecordKey(entry)
                );
                if (isDuplicate) {
                    entry.Comments = (entry.Comments || '') + ' [重複記錄-來自檔案B]';
                }
                finalData.push(entry);
            });
            break;
            
        case 'manual':
            // 顯示確認對話框讓用戶選擇
            showDuplicateReviewModal(duplicates, uniqueFromB);
            return;
    }
    
    exportCombinedFile(finalData);
}
```

#### 資料完整性保障

```javascript
// 記錄唯一性鍵值生成
function generateRecordKey(entry) {
    return [
        entry.Name || '',
        entry.Zone || '',
        entry.Project || '',
        entry.Task || '',
        entry.Date || '',
        entry['Regular Hours'] || '',
        entry['OT Hours'] || ''
    ].join('_');
}

// CSV 輸出格式化
function exportCombinedFile(data) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `TPM_Combined_${timestamp}.csv`;
    
    const headers = [
        'Name', 'Zone', 'Project', 'Product Module', 'Activity Type', 'Task',
        'Regular Hours', 'OT Hours', 'TTL_Hours', 'Date', 'Start Date', 'End Date',
        'Comments', 'PM', 'InternalOrOutsource'
    ];
    
    let csvContent = headers.join(',') + '\n';
    
    data.forEach(entry => {
        const row = headers.map(header => {
            let value = entry[header] || '';
            // CSV 轉義處理
            if (typeof value === 'string' && 
                (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                value = '"' + value.replace(/"/g, '""') + '"';
            }
            return value;
        });
        csvContent += row.join(',') + '\n';
    });
    
    downloadCSVFile(csvContent, filename);
}
```

#### UI 狀態管理

```javascript
// 即時預覽更新
function updateCombinationPreview() {
    if (!combineFileAData || !combineFileBData) {
        hidePreview();
        return;
    }
    
    const { duplicates } = detectDuplicateRecords(combineFileAData, combineFileBData);
    const totalRecords = combineFileAData.length + combineFileBData.length;
    const uniqueRecords = totalRecords - duplicates.length;
    
    displayPreviewStats({
        fileACount: combineFileAData.length,
        fileBCount: combineFileBData.length,
        duplicateCount: duplicates.length,
        finalCount: uniqueRecords
    });
    
    enableCombineButton();
}

// 錯誤處理和用戶回饋
function handleFileLoadError(error, fileType) {
    console.error(`檔案 ${fileType} 載入錯誤:`, error);
    alert(`讀取檔案 ${fileType} 時發生錯誤，請確認檔案格式正確`);
    clearFileSelection(fileType);
}
```

#### 功能特色

- **智能重複檢測**：基於多欄位組合的精確比對
- **三種處理模式**：靈活的重複記錄處理策略
- **即時預覽**：合併前的詳細統計預覽
- **資料完整性**：CSV格式完整保持和轉義處理
- **用戶體驗**：清晰的狀態回饋和錯誤處理

## 🔄 事件處理系統

### 頁面初始化

```javascript
document.addEventListener('DOMContentLoaded', function() {
    // 檢查當前頁面類型
    if (window.location.pathname.includes('edit.html')) {
        initEditPage();
    } else if (window.location.pathname.includes('tpm-validator.html')) {
        initTPMValidator();
    } else {
        initHomePage();
    }
});
```

### 編輯頁面事件綁定

```javascript
function initEditPage() {
    // 延遲綁定確保DOM完全載入
    setTimeout(() => {
        // 核心按鈕事件
        bindButton('btn-save-entry', saveEntry);
        bindButton('btn-clear-form', clearForm);
        bindButton('btn-cancel-entry', clearForm);
        bindButton('btn-export-week', handleExportWeek);
        bindButton('btn-add-entry', handleAddEntry);
        
        // 表單欄位事件
        bindZoneChange();
        bindProjectChange();
        bindActivityTypeChange();
        bindHoursCalculation();
    }, 500);
}

function bindButton(id, handler) {
    const btn = document.getElementById(id);
    if (btn) {
        console.log(`${id} button found, adding event listener`);
        btn.addEventListener('click', handler);
    } else {
        console.log(`${id} button not found`);
    }
}
```

## 🛡️ 錯誤處理

### 資料驗證層級

```javascript
// 1. 即時驗證（輸入時）
input.addEventListener('input', validateField);

// 2. 欄位驗證（失去焦點時）
input.addEventListener('blur', validateFieldComplete);

// 3. 表單驗證（提交前）
function validateForm() {
    const errors = [];
    
    // 必填欄位檢查
    if (!document.getElementById('task').value.trim()) {
        errors.push('任務描述為必填項目');
    }
    
    // 業務規則檢查
    const regularHours = parseFloat(document.getElementById('regularHours').value);
    if (regularHours > 8) {
        errors.push('正常工時不能超過8小時！請修正後再儲存。');
        document.getElementById('regularHours').focus();
        return false;
    }
    
    return errors.length === 0;
}
```

### 例外處理模式

```javascript
// 安全的 JSON 解析
function safeJSONParse(data, fallback = {}) {
    try {
        return JSON.parse(data);
    } catch (e) {
        console.warn('Failed to parse JSON data:', e);
        return fallback;
    }
}

// 安全的localStorage操作
function safeLocalStorageGet(key, fallback = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch (e) {
        console.warn(`Failed to get localStorage item ${key}:`, e);
        return fallback;
    }
}
```

## 🎨 UI/UX 設計模式

### 響應式佈局

```css
/* 桌面版 */
.validation-panels {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 20px;
}

/* 平板版 */
@media (max-width: 768px) {
    .validation-panels {
        grid-template-columns: 1fr;
    }
}

/* 手機版 */
@media (max-width: 480px) {
    .timesheet-cards {
        grid-template-columns: 1fr;
    }
}
```

### 狀態指示系統

```css
.status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
}

.status-pending { background-color: #ffc107; }
.status-validating { background-color: #17a2b8; }
.status-pass { background-color: #28a745; }
.status-fail { background-color: #dc3545; }
```

### 載入狀態管理

```javascript
function showLoadingState(element) {
    element.classList.add('loading');
    element.disabled = true;
}

function hideLoadingState(element) {
    element.classList.remove('loading');
    element.disabled = false;
}
```

## 🔧 部署與維護

### GitHub Pages 部署
1. 推送程式碼到 GitHub repository
2. 啟用 GitHub Pages（Settings → Pages）
3. 選擇 source branch（通常是 main）
4. 訪問 `https://username.github.io/repository-name/`

### 版本管理策略
- **主版本**：重大功能更新或架構變更
- **次版本**：新功能添加或重要修復
- **修訂版本**：Bug修復和小改進

### 效能優化
1. **單檔部署**：減少HTTP請求
2. **延遲載入**：非關鍵功能延遲初始化
3. **本地快取**：localStorage減少重複計算
4. **資源壓縮**：CSS/JS最小化

### 相容性考量
- **現代瀏覽器**：Chrome 70+, Firefox 65+, Safari 12+, Edge 79+
- **ES6+ 支援**：箭頭函數、Promise、async/await
- **Web API**：localStorage, Blob, URL, FileReader

## 🧪 測試策略

### 功能測試檢查清單
- [ ] 基本資料設定和讀取
- [ ] 工時記錄 CRUD 操作
- [ ] Zone/Project/PM 聯動機制
- [ ] Admin/Training 規則驗證
- [ ] 8小時工時限制
- [ ] CSV 匯出匯入功能
- [ ] TPM 驗證工具
- [ ] 響應式佈局

### 瀏覽器測試
- [ ] Chrome（桌面/行動）
- [ ] Firefox（桌面/行動）
- [ ] Safari（桌面/行動）
- [ ] Edge（桌面）

### 資料完整性測試
- [ ] localStorage 資料持久性
- [ ] CSV 格式正確性
- [ ] 中文字元處理
- [ ] 大檔案處理能力

## 📋 開發指南

### 程式碼結構
```javascript
// ==================== 資料存取層 ====================
function loadAllTimesheets() { /* ... */ }
function saveAllTimesheets() { /* ... */ }

// ==================== 業務邏輯層 ====================
function validateRegularHours() { /* ... */ }
function handleActivityTypeChange() { /* ... */ }

// ==================== 使用者介面層 ====================
function renderTimesheetCards() { /* ... */ }
function showAlert() { /* ... */ }

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', init);
```

### 命名規範
- **函數**：駝峰命名法（camelCase）
- **變數**：駝峰命名法
- **常數**：大寫蛇形命名法（UPPER_SNAKE_CASE）
- **DOM ID**：kebab-case

### 錯誤處理原則
1. **防禦性程式設計**：假設輸入可能無效
2. **優雅降級**：錯誤不應中斷整個應用
3. **詳細記錄**：console.error 記錄錯誤詳情
4. **使用者友善**：提供清晰的錯誤訊息

---

*此技術文件對應時間表系統 v3.3.0。如需更新或有技術問題，請參考專案儲存庫或聯絡開發團隊。*
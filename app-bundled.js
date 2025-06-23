// ==================== BUNDLED VERSION - NO ES6 MODULES ====================
// Version 2.3 - Combined all modules into single file for GitHub Pages compatibility

console.log('App bundled version 2.3 loading...');

// ==================== localStorage 與資料存取 ====================

// 工時表資料
function loadAllTimesheets() {
    const data = localStorage.getItem('timesheets');
    return data ? JSON.parse(data) : {};
}

function saveAllTimesheets(timesheets) {
    localStorage.setItem('timesheets', JSON.stringify(timesheets));
}

// 全域基本資料
function loadGlobalBasicInfo() {
    const data = localStorage.getItem('globalBasicInfo');
    return data ? JSON.parse(data) : null;
}

function saveGlobalBasicInfo(basicInfo) {
    localStorage.setItem('globalBasicInfo', JSON.stringify(basicInfo));
}

// 取得指定週次的工時記錄
function getWeekEntries(weekKey) {
    const timesheets = loadAllTimesheets();
    const weekData = timesheets[weekKey];
    if (Array.isArray(weekData)) {
        return weekData;
    } else if (weekData && weekData.entries) {
        return weekData.entries;
    }
    return [];
}

// 儲存指定週次的工時記錄
function saveWeekEntries(weekKey, entries) {
    const timesheets = loadAllTimesheets();
    timesheets[weekKey] = entries;
    saveAllTimesheets(timesheets);
}

// ==================== 日期與週次相關工具 ====================

// 格式化日期為 YYYY-MM-DD（本地時間）
function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// 取得本週的週次鍵值
function getThisWeekKey() {
    const today = new Date();
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() - today.getDay() + 1);
    const year = thisMonday.getFullYear();
    const weekNumber = getWeekNumber(thisMonday);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

// 取得上週的週次鍵值
function getLastWeekKey() {
    const today = new Date();
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - today.getDay() - 6);
    const year = lastMonday.getFullYear();
    const weekNumber = getWeekNumber(lastMonday);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

// 計算週數（以週日為週首，YYYY-Www）
function getWeekNumber(date) {
    const d = new Date(date);
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - d.getDay());
    const firstDay = new Date(d.getFullYear(), 0, 1);
    const firstSunday = new Date(firstDay);
    firstSunday.setDate(firstDay.getDate() - firstDay.getDay());
    const diff = sunday - firstSunday;
    const weekNumber = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
    return weekNumber;
}

// 取得週次的日期範圍
function getWeekDateRange(weekNumber, year) {
    const firstDayOfYear = new Date(year, 0, 1);
    const firstSunday = new Date(firstDayOfYear);
    firstSunday.setDate(firstDayOfYear.getDate() - firstDayOfYear.getDay());
    const startDate = new Date(firstSunday);
    startDate.setDate(firstSunday.getDate() + (weekNumber - 1) * 7);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    return {
        start: startDate,
        end: endDate
    };
}

// 從週次鍵值取得日期範圍
function getWeekDateRangeFromKey(weekKey) {
    const [year, week] = weekKey.split('-');
    const weekNumber = parseInt(week.substring(1));
    return getWeekDateRange(weekNumber, year);
}

// 設置日期欄位的限制範圍
function setDateFieldLimits(startDate, endDate) {
    const minDate = formatDate(startDate);
    const maxDate = formatDate(endDate);

    // 設置日期欄位的 min 和 max 屬性
    const dateFields = ['date', 'startDate', 'endDate'];
    dateFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.min = minDate;
            field.max = maxDate;

            // 如果欄位有值但超出範圍，則清空
            if (field.value) {
                const fieldDate = new Date(field.value);
                if (fieldDate < startDate || fieldDate > endDate) {
                    field.value = '';
                }
            }
        }
    });
}

// 驗證日期是否在週範圍內
function validateDateInWeekRange(date, startDate, endDate) {
    if (!date) return true; // 空值允許

    const inputDate = new Date(date);
    return inputDate >= startDate && inputDate <= endDate;
}

// ==================== CSV 資料載入與管理 ====================

// 全域變數儲存 CSV 資料
let projectCodeData = [];
let productCodeData = [];
let activityTypeData = [];

// 改進的 CSV 解析 function，支援引號包圍的欄位，回傳 array of objects
function parseCSV(text) {
    console.log('[parseCSV] called');
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) {
        console.warn('[parseCSV] CSV檔案格式不正確：少於2行');
        return [];
    }
    
    // 解析 CSV 行，支援引號包圍的欄位
    function parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // 雙引號轉義
                    current += '"';
                    i++; // 跳過下一個引號
                } else {
                    // 切換引號狀態
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // 在引號外的逗號才是分隔符
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        // 加入最後一個欄位
        result.push(current.trim());
        return result;
    }
    
    try {
        const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
        console.log('[parseCSV] headers:', headers);
        
        const arr = lines.slice(1).map((line, index) => {
            if (!line.trim()) return null; // 跳過空行
            
            try {
                const values = parseCSVLine(line).map(v => v.replace(/^"|"$/g, '').trim());
                const obj = {};
                
                headers.forEach((h, i) => {
                    const value = values[i] || '';
                    
                    // 數值欄位處理
                    const numericFields = ['Regular Hours', 'OT Hours', 'TTL_Hours', 'Total Hours', '正常工時', '加班工時', '總工時'];
                    const isNumericField = numericFields.includes(h);
                    
                    if (isNumericField) {
                        obj[h] = parseFloat(value) || 0;
                    } else {
                        obj[h] = value;
                    }
                    
                    // 為了相容性，也建立一些常用的標準化欄位名稱
                    if (h === 'Regular Hours' || h === '正常工時') {
                        obj['regularHours'] = parseFloat(value) || 0;
                    } else if (h === 'OT Hours' || h === '加班工時') {
                        obj['otHours'] = parseFloat(value) || 0;
                    } else if (h === 'TTL_Hours' || h === 'Total Hours' || h === '總工時') {
                        obj['ttlHours'] = parseFloat(value) || 0;
                    }
                    
                });
                
                return obj;
            } catch (err) {
                console.error(`[parseCSV] 解析第${index + 2}行時發生錯誤:`, err, '行內容:', line);
                return null;
            }
        }).filter(row => row !== null); // 移除空行和錯誤行
        
        console.log('[parseCSV] result:', arr);
        return arr;
    } catch (err) {
        console.error('[parseCSV] 解析CSV時發生錯誤:', err);
        throw new Error('CSV格式錯誤：' + err.message);
    }
}

// 載入 CSV 檔案
async function loadCSVFile(filename) {
    try {
        const response = await fetch(filename);
        const text = await response.text();
        return parseCSV(text);
    } catch (error) {
        console.error(`載入 ${filename} 失敗:`, error);
        return [];
    }
}

// 載入所有 CSV 資料
async function loadAllCSVData() {
    try {
        projectCodeData = await loadCSVFile('projectcode.csv');
        productCodeData = await loadCSVFile('productcode.csv');
        activityTypeData = await loadCSVFile('activityType.csv');
        
        console.log('CSV 資料載入完成:', {
            projects: projectCodeData.length,
            products: productCodeData.length,
            activities: activityTypeData.length
        });
        
        // 初始化完成後更新選項
        updateProjectOptions();
        updateActivityTypeOptions();
        
    } catch (error) {
        console.error('載入 CSV 資料失敗:', error);
    }
}

// 根據 Zone 篩選專案
function getProjectsByZone(zone) {
    if (!zone || !projectCodeData.length) return [];
    return projectCodeData.filter(project => project.Zone === zone);
}

// 根據專案取得專案經理
function getPMByProject(projectName) {
    const project = projectCodeData.find(p => p.Project === projectName);
    return project ? project.PM : '';
}

// 根據 Zone 篩選產品模組
function getProductModulesByZone(zone) {
    if (!zone || !productCodeData.length) return [];
    return productCodeData.filter(product => product.Zone === zone);
}

// 更新專案選項
function updateProjectOptions() {
    const zoneSelect = document.getElementById('zone');
    
    if (!zoneSelect) return;
    
    // 監聽 Zone 變更
    zoneSelect.addEventListener('change', function() {
        const selectedZone = this.value;
        updateProjectDropdown(selectedZone);
        updateProductModuleDropdown(selectedZone);
        // 清空相關欄位
        const pmField = document.getElementById('pm');
        if (pmField) pmField.value = '';
    });
}

// 更新專案下拉選單
function updateProjectDropdown(zone) {
    const projectField = document.getElementById('project');
    if (!projectField) return;
    
    // 如果是 input 欄位，先將其轉換為 select
    if (projectField.tagName === 'INPUT') {
        const select = document.createElement('select');
        select.id = 'project';
        select.name = 'project';
        select.className = projectField.className;
        projectField.parentNode.replaceChild(select, projectField);
    }
    
    const projectSelect = document.getElementById('project');
    
    // 清空現有選項
    projectSelect.innerHTML = '<option value="">請選擇專案</option>';
    
    if (!zone) return;
    
    // 取得該 Zone 的專案
    const projects = getProjectsByZone(zone);
    
    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.Project;
        option.textContent = `${project.Project} (${project['Charge Code']})`;
        option.dataset.pm = project.PM;
        projectSelect.appendChild(option);
    });
    
    // 移除舊的事件監聽器並添加新的
    projectSelect.replaceWith(projectSelect.cloneNode(true));
    const newProjectSelect = document.getElementById('project');
    
    // 監聽專案選擇變更
    newProjectSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const pmField = document.getElementById('pm');
        if (pmField && selectedOption && selectedOption.dataset.pm) {
            pmField.value = selectedOption.dataset.pm;
            console.log('PM updated via csvModule to:', selectedOption.dataset.pm);
        } else if (pmField) {
            pmField.value = '';
        }
        
        // 也調用edit.html中的handleProjectChange函數（如果存在）
        if (typeof window.handleProjectChange === 'function') {
            window.handleProjectChange();
        }
        
        // 也直接調用updatePMField函數（如果存在）
        if (typeof window.updatePMField === 'function') {
            window.updatePMField();
        }
    });
}

// 更新產品模組下拉選單
function updateProductModuleDropdown(zone) {
    const productModuleField = document.getElementById('productModule');
    if (!productModuleField) return;
    
    // 如果是 input 欄位，先將其轉換為 select
    if (productModuleField.tagName === 'INPUT') {
        const select = document.createElement('select');
        select.id = 'productModule';
        select.name = 'productModule';
        select.className = productModuleField.className;
        productModuleField.parentNode.replaceChild(select, productModuleField);
    }
    
    const productModuleSelect = document.getElementById('productModule');
    
    // 清空現有選項
    productModuleSelect.innerHTML = '<option value="">請選擇產品模組</option>';
    
    if (!zone) return;
    
    // 取得該 Zone 的產品模組
    const productModules = getProductModulesByZone(zone);
    
    productModules.forEach(product => {
        const option = document.createElement('option');
        option.value = product['Product Module'];
        option.textContent = product['Product Module'];
        productModuleSelect.appendChild(option);
    });
}

// 更新活動類型選項
function updateActivityTypeOptions() {
    const activitySelect = document.getElementById('activityType');
    if (!activitySelect || !activityTypeData.length) return;
    
    // 清空現有選項（除了第一個預設選項）
    activitySelect.innerHTML = '<option value="">請選擇活動類型</option>';
    
    activityTypeData.forEach(activity => {
        if (activity['Activity Type']) {
            const option = document.createElement('option');
            option.value = activity['Activity Type'];
            option.textContent = activity['Activity Type'];
            activitySelect.appendChild(option);
        }
    });
}

// 生成CSV內容
function generateCSVContent(entries) {
    // CSV標題行（按照指定格式）
    const headers = [
        'Name',
        'Zone',
        'Project',
        'Product Module',
        'Activity Type',
        'Task',
        'Regular Hours',
        'OT Hours',
        'TTL_Hours',
        'Date',
        'Start Date',
        'End Date',
        'Comments',
        'PM',
        'InternalOrOutsource'
    ];

    // 載入基本資料
    const basicInfo = loadGlobalBasicInfo();
    
    // 轉換資料行
    const dataRows = entries.map(entry => {
        const regularHours = parseFloat(entry.regularHours) || 0;
        const overtimeHours = parseFloat(entry.overtimeHours) || parseFloat(entry.otHours) || 0;
        const totalHours = parseFloat(entry.ttlHours) || (regularHours + overtimeHours);
        
        return [
            basicInfo.employeeName || '',           // Name
            entry.zone || '',                       // Zone
            entry.project || '',                    // Project
            entry.productModule || '',              // Product Module
            entry.activityType || '',               // Activity Type
            entry.task || '',                       // Task
            regularHours,                           // Regular Hours
            overtimeHours,                          // OT Hours
            totalHours,                             // TTL_Hours
            entry.date || '',                       // Date
            entry.startDate || '',                  // Start Date
            entry.endDate || '',                    // End Date
            entry.comments || '',                   // Comments
            entry.pm || '',                         // PM
            basicInfo.employeeType || ''            // InternalOrOutsource
        ];
    });

    // 組合CSV內容
    const csvRows = [headers, ...dataRows];
    
    // 轉換為CSV格式字串
    return csvRows.map(row =>
        row.map(field => {
            // 處理包含逗號或換行的欄位
            const fieldStr = String(field);
            if (fieldStr.includes(',') || fieldStr.includes('\n') || fieldStr.includes('"')) {
                return '"' + fieldStr.replace(/"/g, '""') + '"';
            }
            return fieldStr;
        }).join(',')
    ).join('\n');
}

// 下載CSV檔案
function downloadCSVFile(csvContent, filename) {
    try {
        console.log('[downloadCSVFile] 開始下載', { filename, csvContentSample: csvContent.slice(0, 100) });
        // 添加BOM以支援中文
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        console.log('[downloadCSVFile] Blob created', blob);
        const url = URL.createObjectURL(blob);
        console.log('[downloadCSVFile] Object URL', url);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        // 添加到頁面並觸發下載
        document.body.appendChild(link);
        link.click();
        console.log('[downloadCSVFile] link.click() 已觸發');
        // 清理
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('[downloadCSVFile] 清理完成');
    } catch (err) {
        console.error('[downloadCSVFile] 發生錯誤', err);
    }
}

// ==================== 主要應用程式邏輯 ====================

console.log('App.js initialized and running - Version 2.3 (2025-06-23)');

// 設置日期欄位的限制範圍
function setDateFieldLimits(startDate, endDate) {
    const minDate = formatDate(startDate);
    const maxDate = formatDate(endDate);
    
    // 設置日期欄位的 min 和 max 屬性
    const dateFields = ['date', 'startDate', 'endDate'];
    dateFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.min = minDate;
            field.max = maxDate;
            
            // 如果欄位有值但超出範圍，則清空
            if (field.value) {
                const fieldDate = new Date(field.value);
                if (fieldDate < startDate || fieldDate > endDate) {
                    field.value = '';
                }
            }
        }
    });
}

// Make functions globally available
window.loadAllTimesheets = loadAllTimesheets;
window.saveAllTimesheets = saveAllTimesheets;
window.loadGlobalBasicInfo = loadGlobalBasicInfo;
window.saveGlobalBasicInfo = saveGlobalBasicInfo;
window.loadAllCSVData = loadAllCSVData;
window.generateCSVContent = generateCSVContent;
window.downloadCSVFile = downloadCSVFile;
window.parseCSV = parseCSV;

// Basic button functionality for testing
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - setting up basic event listeners');
    
    const basicInfoBtn = document.getElementById('btn-basic-info');
    if (basicInfoBtn) {
        basicInfoBtn.addEventListener('click', function() {
            alert('基本資料設定功能 - bundled version working!');
        });
    }
    
    const newBtn = document.getElementById('btn-new');
    if (newBtn) {
        newBtn.addEventListener('click', function() {
            alert('新建功能 - bundled version working!');
        });
    }
    
    const importBtn = document.getElementById('btn-import');
    if (importBtn) {
        importBtn.addEventListener('click', function() {
            alert('匯入功能 - bundled version working!');
        });
    }
    
    const clearBtn = document.getElementById('btn-clear-storage');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            if (confirm('確定要清空所有資料嗎？')) {
                localStorage.clear();
                location.reload();
            }
        });
    }
    
    console.log('✅ Bundled version event listeners set up successfully');
});

console.log('✅ Bundled app.js loaded successfully');
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
                    
                    // 欄位名稱對應表，將CSV欄位名稱轉換為系統內部標準欄位名稱
                    const fieldMapping = {
                        'Date': 'date',
                        'Day': 'date',
                        '日期': 'date',
                        'Zone': 'zone',
                        '區域': 'zone',
                        'Activity Type': 'activityType',
                        '活動類型': 'activityType',
                        'Task': 'task',
                        '任務': 'task',
                        'Regular Hours': 'regularHours',
                        '正常工時': 'regularHours',
                        'OT Hours': 'otHours',
                        '加班工時': 'otHours',
                        'TTL_Hours': 'ttlHours',
                        'Total Hours': 'ttlHours',
                        '總工時': 'ttlHours',
                        'Project': 'project',
                        '專案': 'project',
                        'Product Module': 'productModule',
                        '產品模組': 'productModule',
                        'PM': 'pm',
                        '專案經理': 'pm',
                        'Comments': 'comments',
                        '備註': 'comments',
                        'Employee Name': 'employeeName',
                        '員工姓名': 'employeeName',
                        'Employee Type': 'employeeType',
                        '員工類型': 'employeeType'
                    };
                    
                    // 取得標準化的欄位名稱
                    const standardFieldName = fieldMapping[h] || h.toLowerCase().replace(/\s+/g, '');
                    
                    // 處理數字欄位
                    if (standardFieldName === 'regularHours' || standardFieldName === 'otHours' || standardFieldName === 'ttlHours') {
                        obj[standardFieldName] = parseFloat(value) || 0;
                    } else {
                        obj[standardFieldName] = value;
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
// ==================== CSV 資料載入與管理 ====================

// 全域變數儲存 CSV 資料
let projectCodeData = [];
let productCodeData = [];
let activityTypeData = [];

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

// 解析 CSV 文字

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
        } else if (pmField) {
            pmField.value = '';
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

// 啟用正規化模式
function enableNormalizationMode(weekKey) {
    // 儲存正規化狀態到 localStorage
    const normalizationData = {
        weekKey: weekKey,
        enabled: true,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem(`normalization_${weekKey}`, JSON.stringify(normalizationData));
    
    // 更新 UI 顯示正規化模式狀態
    updateNormalizationModeDisplay(weekKey);
}

// 檢查是否啟用正規化模式
function isNormalizationEnabled(weekKey) {
    const data = localStorage.getItem(`normalization_${weekKey}`);
    return data ? JSON.parse(data).enabled : false;
}

// 更新正規化模式顯示
function updateNormalizationModeDisplay(weekKey) {
    const isEnabled = isNormalizationEnabled(weekKey);
    const weekInfoDiv = document.querySelector('.week-info');
    
    // 移除舊的正規化提示
    const existingAlert = weekInfoDiv.querySelector('.normalization-alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    if (isEnabled) {
        // 顯示正規化模式提示
        const alertDiv = document.createElement('div');
        alertDiv.className = 'normalization-alert';
        alertDiv.innerHTML = `
            <div class="alert alert-info">
                <strong>📊 正規化模式已啟用</strong> - 該週工時超過40小時，匯出時將自動進行正規化計算
                <button onclick="disableNormalizationMode('${weekKey}')" class="btn-disable-normalization">停用</button>
            </div>
        `;
        weekInfoDiv.appendChild(alertDiv);
    }
}

// 停用正規化模式
function disableNormalizationMode(weekKey) {
    localStorage.removeItem(`normalization_${weekKey}`);
    updateNormalizationModeDisplay(weekKey);
    showSuccessMessage('正規化模式已停用');
}

// 匯出時進行正規化計算
function performNormalizationForExport(entries) {
    let totalRegularHours = 0;

    // 計算總正常工時
    entries.forEach(entry => {
        totalRegularHours += entry.regularHours || 0;
    });

    if (totalRegularHours > 40) {
        const normalizedEntries = entries.map(entry => {
            const originalHours = entry.regularHours || 0;
            const ratio = 40 / totalRegularHours;
            const newRegularHours = Math.round(originalHours * ratio * 100) / 100;
            // 保存原始工時
            return {
                ...entry,
                _originalHours: originalHours,
                _isNormalized: true,
                regularHours: newRegularHours,
                ttlHours: newRegularHours + (entry.otHours || 0)
            };
        });
        return normalizedEntries;
    }

    return entries; // 不需要正規化
}
// 格式化日期為 YYYY-MM-DD（本地時間）
function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// 從localStorage加載所有工時表數據
function loadAllTimesheets() {
    const data = localStorage.getItem('timesheets');
    return data ? JSON.parse(data) : {};
}

// 保存所有工時表數據到localStorage
function saveAllTimesheets(timesheets) {
    localStorage.setItem('timesheets', JSON.stringify(timesheets));
}

// 獲取指定週數的日期範圍（週日到週六）
function getWeekDateRange(weekNumber, year) {
    // 簡單實現：假設year和weekNumber是有效的
    // 實際應根據ISO週數計算，這裡簡化為從當年第一週的週日開始推算
    // 注意：這只是一個示例，實際的日期計算需要更嚴謹的邏輯
    const firstDayOfYear = new Date(year, 0, 1);
    const firstSunday = new Date(firstDayOfYear);
    // 調整到第一週的週日（假設第一週從1月1日所在週的週日開始）
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

// 計算填寫進度（根據記錄筆數和預期5個工作日？這裡簡化為記錄筆數是否大於0）
function calculateProgress(entries) {
    // 如果有記錄，則認為填寫了，進度100%；否則0
    return entries && entries.length > 0 ? 100 : 0;
}

// 渲染工時表卡片
function renderTimesheetCards() {
    const container = document.getElementById('timesheet-cards');
    container.innerHTML = ''; // 清空容器
    
    const timesheets = loadAllTimesheets();
    
    Object.keys(timesheets).forEach(key => {
        // key格式：YYYY-Www，需檢查合法性
        if (!key || typeof key !== 'string' || !key.includes('-')) return;
        const [year, week] = key.split('-');
        if (!year || !week || week.length < 2) return;
        const weekNumber = parseInt(week.substring(1));
        if (isNaN(weekNumber)) return;
        const weekData = timesheets[key];
        
        // 處理新的資料結構（包含 basicInfo 和 entries）
        let entries = [];
        if (Array.isArray(weekData)) {
            // 舊的資料結構，直接是陣列
            entries = weekData;
        } else if (weekData && weekData.entries) {
            // 新的資料結構，有 basicInfo 和 entries
            entries = weekData.entries;
        }
        
        const dateRange = getWeekDateRange(weekNumber, year);
        const startStr = dateRange.start.toISOString().split('T')[0];
        const endStr = dateRange.end.toISOString().split('T')[0];
        
        const totalHours = entries.reduce((sum, entry) => sum + (entry.ttlHours || entry.TTL_Hours || 0), 0);
        const totalRegularHours = entries.reduce((sum, entry) => sum + (entry.regularHours || 0), 0);
        const totalOtHours = entries.reduce((sum, entry) => sum + (entry.otHours || 0), 0);
        const isComplete = totalHours >= 40;
        
        // 創建卡片元素
        const card = document.createElement('div');
        card.className = 'timesheet-card';
        card.innerHTML = `
            <div class="card-color-bar"></div>
            <div class="status-tag ${isComplete ? 'status-completed' : 'status-inprogress'}"
                 title="${isComplete ? '總工時已達40小時' : '總工時未達40小時'}">
                ${isComplete ? '✓' : '⚠'}
            </div>
            <div class="card-header">
                <div class="week-title">${key}</div>
                <div class="date-range">${startStr} 至 ${endStr}</div>
            </div>
            <div class="stats">
                <div class="stat-item">
                    <div class="stat-value">${entries.length}</div>
                    <div class="stat-label">記錄筆數</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${totalHours}</div>
                    <div class="stat-label">總工時</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${totalRegularHours}</div>
                    <div class="stat-label">總正常工時</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${totalOtHours}</div>
                    <div class="stat-label">總加班工時</div>
                </div>
            </div>
            <div class="card-actions">
                <button class="btn-edit" data-week="${key}">修改</button>
                <button class="btn-copy" data-week="${key}">複製</button>
                <button class="btn-delete" data-week="${key}">刪除</button>
                <button class="btn-export" data-week="${key}">匯出</button>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    // 為卡片上的按鈕添加事件監聽
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            const weekKey = btn.getAttribute('data-week');
            editTimesheet(weekKey);
        });
    });
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const weekKey = btn.getAttribute('data-week');
            deleteTimesheet(weekKey);
        });
    });
    
    document.querySelectorAll('.btn-copy').forEach(btn => {
        btn.addEventListener('click', () => {
            const weekKey = btn.getAttribute('data-week');
            showCopyOptionsModal(weekKey);
        });
    });
    
    document.querySelectorAll('.btn-export').forEach(btn => {
        btn.addEventListener('click', () => {
            const weekKey = btn.getAttribute('data-week');
            exportTimesheet(weekKey);
        });
    });
    
    // 更新上週按鈕顯示狀態
    if (window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
        updateLastWeekButtonDisplay();
    }
}

// 新建工時表 - 顯示週次選擇模態框
function newTimesheet() {
    showWeekSelectionModal();
}

// 顯示週次選擇模態框
function showWeekSelectionModal() {
    const modal = document.getElementById('week-selection-modal');
    const timesheets = loadAllTimesheets();
    
    // 計算上週和本週的週次
    const lastWeekKey = getLastWeekKey();
    const thisWeekKey = getThisWeekKey();
    
    // 更新上週選項資訊
    const lastWeekInfo = document.getElementById('last-week-info');
    const lastWeekStatus = document.getElementById('last-week-status');
    const lastWeekOption = document.getElementById('option-last-week');
    
    if (lastWeekKey) {
        const lastWeekRange = getWeekDateRangeFromKey(lastWeekKey);
        lastWeekInfo.textContent = `${lastWeekKey} (${formatDate(lastWeekRange.start)} - ${formatDate(lastWeekRange.end)})`;
        
        if (timesheets[lastWeekKey]) {
            lastWeekStatus.textContent = '已存在';
            lastWeekStatus.className = 'option-status status-exists';
            // 如果已存在，禁用該選項
            document.getElementById('radio-last-week').disabled = true;
            lastWeekOption.style.opacity = '0.6';
        } else {
            lastWeekStatus.textContent = '可建立';
            lastWeekStatus.className = 'option-status status-new';
            document.getElementById('radio-last-week').disabled = false;
            lastWeekOption.style.opacity = '1';
        }
    } else {
        lastWeekOption.style.display = 'none';
    }
    
    // 更新本週選項資訊
    const thisWeekInfo = document.getElementById('this-week-info');
    const thisWeekStatus = document.getElementById('this-week-status');
    const thisWeekOption = document.getElementById('option-this-week');
    
    if (thisWeekKey) {
        const thisWeekRange = getWeekDateRangeFromKey(thisWeekKey);
        thisWeekInfo.textContent = `${thisWeekKey} (${formatDate(thisWeekRange.start)} - ${formatDate(thisWeekRange.end)})`;
        
        if (timesheets[thisWeekKey]) {
            thisWeekStatus.textContent = '已存在';
            thisWeekStatus.className = 'option-status status-exists';
            // 如果已存在，禁用該選項
            document.getElementById('radio-this-week').disabled = true;
            thisWeekOption.style.opacity = '0.6';
        } else {
            thisWeekStatus.textContent = '可建立';
            thisWeekStatus.className = 'option-status status-new';
            document.getElementById('radio-this-week').disabled = false;
            thisWeekOption.style.opacity = '1';
        }
    } else {
        thisWeekOption.style.display = 'none';
    }
    
    // 重置自訂輸入
    document.getElementById('custom-week-field').value = '';
    document.getElementById('custom-week-input').style.display = 'none';
    
    // 清除選擇
    document.querySelectorAll('input[name="weekOption"]').forEach(radio => {
        radio.checked = false;
    });
    
    // 顯示模態框
    modal.style.display = 'block';
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

// 取得本週的週次鍵值
function getThisWeekKey() {
    const today = new Date();
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() - today.getDay() + 1);
    
    const year = thisMonday.getFullYear();
    const weekNumber = getWeekNumber(thisMonday);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

// 計算週數（ISO 8601）
/**
 * 以週日為週首計算週次（YYYY-Www），週日~週六
 */
function getWeekNumber(date) {
    const d = new Date(date);
    // 找到本週的週日
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - d.getDay());
    // 計算今年第一天的週日
    const firstDay = new Date(d.getFullYear(), 0, 1);
    const firstSunday = new Date(firstDay);
    firstSunday.setDate(firstDay.getDate() - firstDay.getDay());
    // 計算週數
    const diff = sunday - firstSunday;
    const weekNumber = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
    return weekNumber;
}

// 從週次鍵值取得日期範圍
function getWeekDateRangeFromKey(weekKey) {
    const [year, week] = weekKey.split('-');
    const weekNumber = parseInt(week.substring(1));
    return getWeekDateRange(weekNumber, year);
}

// 修改工時表（跳轉到編輯頁面）
function editTimesheet(weekKey) {
    // 跳轉到工時填寫界面
    window.location.href = `edit.html?week=${encodeURIComponent(weekKey)}`;
}

// 刪除工時表
function deleteTimesheet(weekKey) {
    if (confirm(`確定要刪除 ${weekKey} 的工時表嗎？`)) {
        const timesheets = loadAllTimesheets();
        delete timesheets[weekKey];
        saveAllTimesheets(timesheets);
        renderTimesheetCards();
    }
}

// 匯出工時表為CSV檔案
function exportTimesheet(weekKey) {
    try {
        const entries = getWeekEntries(weekKey);
        if (!entries || entries.length === 0) {
            alert('該週次沒有工時記錄可匯出');
            return;
        }

        // 匯出前檢查總正常工時，若超過40小時則提示
        const totalRegularHours = entries.reduce((sum, entry) => sum + (entry.regularHours || 0), 0);
        // 若超過40小時，提示將自動正規化
        if (totalRegularHours > 40) {
            alert('本週正常工時超過40小時，滙出時將自動進行正規化計算。\n\n注意：若下載檔案時選擇覆蓋舊檔，且舊檔正在開啟狀態，下載可能會失敗並顯示「需要下載權限」等錯誤，請先關閉舊檔再下載。');
        }

        let exportEntries = [...entries];

        if (totalRegularHours > 40) {
            exportEntries = performNormalizationForExport(exportEntries);
        }

        // 準備CSV內容
        const csvContent = generateCSVContent(exportEntries, weekKey);

        // 創建並下載檔案
        downloadCSVFile(csvContent, `工時表_${weekKey}.csv`);

        // 顯示成功訊息
        showSuccessMessage(`${weekKey} 工時表已匯出`);

    } catch (error) {
        console.error('匯出失敗:', error);
        alert('匯出失敗，請檢查瀏覽器控制台');
    }
}
// 滙出未經正規化的原始工時
function exportRawTimesheet(weekKey) {
    try {
        const entries = getWeekEntries(weekKey);
        if (!entries || entries.length === 0) {
            alert('該週次沒有工時記錄可匯出');
            return;
        }
        // 直接滙出原始工時資料
        const csvContent = generateCSVContent(entries, weekKey);
        downloadCSVFile(csvContent, `工時表_${weekKey}_原始.csv`);
        showSuccessMessage(`${weekKey} 工時表（原始）已匯出`);
    } catch (error) {
        console.error('原始工時匯出失敗:', error);
        alert('原始工時匯出失敗，請檢查瀏覽器控制台');
    }
}

// 生成CSV內容
function generateCSVContent(entries, weekKey) {
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

// 匯入工時表（暫時只提示）
function importTimesheet() {
    const input = document.getElementById('import-file');
    input.value = ''; // 重置 input，避免同檔案無法重選
    input.onchange = async function (event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (e) {
            const text = e.target.result;
            try {
                console.log('[import] 原始CSV內容:', text);
                
                // 檢查檔案是否為空
                if (!text || text.trim().length === 0) {
                    alert('檔案內容為空，請選擇有效的CSV檔案。');
                    return;
                }
                
                const data = parseCSV(text);
                console.log('[import] parseCSV result:', data);
                
                // 檢查是否成功解析出資料
                if (!data || data.length === 0) {
                    alert('無法從檔案中解析出有效資料，請檢查CSV格式是否正確。');
                    return;
                }
                
                // 強制將 data 轉為 array
                console.log('[import] typeof data:', typeof data, 'Array.isArray:', Array.isArray(data));
                let arr = [];
                if (Array.isArray(data)) {
                    arr = data;
                } else if (typeof data === 'object' && data !== null) {
                    arr = Object.values(data).flat();
                }
                console.log('[import] 轉換後 arr:', arr);
                
                if (arr.length === 0) {
                    alert('檔案中沒有有效的工時記錄。');
                    return;
                }
                let groupedData = {};
                const failedRows = [];
                
                arr.forEach((row, index) => {
                    if (!row) return;
                    
                    // 檢查日期欄位（支援多種可能的欄位名稱）
                    const dateValue = row.Date || row.date || row['日期'] || row.Day;
                    if (!dateValue) {
                        console.warn(`[import] 第${index + 1}筆記錄缺少日期欄位:`, row);
                        failedRows.push(`第${index + 1}筆記錄：缺少日期欄位`);
                        return;
                    }
                    
                    // 改進的日期解析，支援多種格式
                    let dateObj = null;
                    const dateStr = dateValue.toString().trim();
                    
                    // 嘗試多種日期格式
                    const dateFormats = [
                        dateStr, // 原始格式
                        dateStr.replace(/\//g, '-'), // 將 / 替換為 -
                        dateStr.replace(/\./g, '-'), // 將 . 替換為 -
                    ];
                    
                    for (const format of dateFormats) {
                        dateObj = new Date(format);
                        if (!isNaN(dateObj.getTime()) && dateObj.getFullYear() > 1900) {
                            break;
                        }
                        dateObj = null;
                    }
                    
                    if (!dateObj || isNaN(dateObj.getTime())) {
                        console.warn(`[import] 第${index + 1}筆記錄日期格式無效:`, dateValue);
                        failedRows.push(`第${index + 1}筆記錄：日期格式無效 "${dateValue}"`);
                        return;
                    }
                    
                    try {
                        // 正確計算週次
                        const year = dateObj.getFullYear();
                        const weekNumber = getWeekNumber(dateObj);
                        const weekKey = `${year}-W${weekNumber.toString().padStart(2, '0')}`;
                        console.log('[import][分組] Date:', dateValue, 'parsed:', dateObj, 'year:', year, 'weekNumber:', weekNumber, 'weekKey:', weekKey);
                        
                        if (!groupedData[weekKey]) groupedData[weekKey] = [];
                        
                        // 標準化記錄格式，確保日期統一和必要欄位
                        const standardizedRow = { ...row };
                        standardizedRow.date = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD 格式
                        
                        // 確保有唯一的 ID
                        if (!standardizedRow.id) {
                            standardizedRow.id = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                        }
                        
                        // 確保數字欄位有預設值
                        standardizedRow.regularHours = standardizedRow.regularHours || 0;
                        standardizedRow.otHours = standardizedRow.otHours || 0;
                        standardizedRow.ttlHours = standardizedRow.ttlHours || (standardizedRow.regularHours + standardizedRow.otHours);
                        
                        groupedData[weekKey].push(standardizedRow);
                    } catch (err) {
                        console.error(`[import] 處理第${index + 1}筆記錄時發生錯誤:`, err, row);
                        failedRows.push(`第${index + 1}筆記錄：處理時發生錯誤`);
                    }
                });
                
                // 如果有失敗的記錄，顯示警告
                if (failedRows.length > 0) {
                    console.warn('[import] 以下記錄匯入失敗:', failedRows);
                    const proceed = confirm(`有 ${failedRows.length} 筆記錄匯入失敗：\n${failedRows.slice(0, 5).join('\n')}${failedRows.length > 5 ? '\n...' : ''}\n\n是否繼續匯入其他記錄？`);
                    if (!proceed) {
                        alert('匯入已取消');
                        return;
                    }
                }
                console.log('[import] 自動分組週次結果:', groupedData);
                // 合併匯入資料到主 timesheets
                const timesheets = loadAllTimesheets();
                console.log('[import] localStorage timesheets(匯入前):', timesheets);
                const importedWeeks = [];
                for (const weekKey in groupedData) {
                    console.log('[import] 檢查週次', weekKey, groupedData[weekKey]);
                    if (timesheets[weekKey]) {
                        const overwrite = confirm('週次 ' + weekKey + ' 已有資料，是否覆蓋？');
                        console.log('[import] 覆蓋確認', weekKey, overwrite);
                        if (!overwrite) continue;
                    }
                    timesheets[weekKey] = groupedData[weekKey];
                    importedWeeks.push(weekKey);
                    console.log('[import] 已加入週次:', weekKey);
                }
                console.log('[import] importedWeeks:', importedWeeks);
                console.log('[import] localStorage timesheets(匯入後):', timesheets);
                
                if (Object.keys(groupedData).length === 0) {
                    alert('沒有有效的記錄可以匯入。請檢查CSV檔案中的日期格式和資料內容。');
                    return;
                }
                
                saveAllTimesheets(timesheets);
                renderTimesheetCards();
                
                if (importedWeeks.length > 0) {
                    const weekInfoList = importedWeeks.map(weekKey => {
                        try {
                            const range = getWeekDateRangeFromKey(weekKey);
                            const start = range.start.toISOString().split('T')[0];
                            const end = range.end.toISOString().split('T')[0];
                            const recordCount = groupedData[weekKey].length;
                            return `${weekKey} (${start} ~ ${end}) - ${recordCount}筆記錄`;
                        } catch (err) {
                            console.error('[import] 取得週次範圍失敗:', weekKey, err);
                            return `${weekKey} - ${groupedData[weekKey].length}筆記錄`;
                        }
                    });
                    
                    const totalRecords = importedWeeks.reduce((sum, weekKey) => sum + groupedData[weekKey].length, 0);
                    const successMessage = `匯入成功！\n共匯入 ${totalRecords} 筆記錄到 ${importedWeeks.length} 個週次：\n\n${weekInfoList.join('\n')}`;
                    
                    if (failedRows.length > 0) {
                        alert(successMessage + `\n\n注意：有 ${failedRows.length} 筆記錄匯入失敗。`);
                    } else {
                        alert(successMessage);
                    }
                } else {
                    alert('未匯入任何週次資料。所有記錄都被跳過了。');
                }
            } catch (err) {
                console.error('[import] 匯入流程發生錯誤:', err);
                let errorMessage = 'CSV 匯入失敗：\n';
                if (err.message) {
                    errorMessage += err.message;
                } else {
                    errorMessage += '未知錯誤，請檢查瀏覽器控制台獲取更多資訊。';
                }
                alert(errorMessage);
            }
        };
        reader.readAsText(file, 'utf-8');
    };
    input.click();
}

// ==================== 首頁模態框功能 ====================

// 顯示基本資料設定模態框
function showBasicInfoModal() {
    const modal = document.getElementById('basic-info-modal');
    const basicInfo = loadGlobalBasicInfo();
    
    // 載入現有資料
    if (basicInfo) {
        document.getElementById('modal-employeeName').value = basicInfo.employeeName || '';
        document.getElementById('modal-employeeType').value = basicInfo.employeeType || '';
    }
    
    modal.style.display = 'block';
}

// 隱藏基本資料設定模態框
function hideBasicInfoModal() {
    const modal = document.getElementById('basic-info-modal');
    modal.style.display = 'none';
    
    // 清空表單
    document.getElementById('modal-basic-info-form').reset();
}

// 儲存模態框中的基本資料
function saveModalBasicInfo() {
    const employeeName = document.getElementById('modal-employeeName').value.trim();
    const employeeType = document.getElementById('modal-employeeType').value;
    
    if (!employeeName || !employeeType) {
        alert('請填寫所有必填欄位');
        return;
    }
    
    const basicInfo = {
        employeeName: employeeName,
        employeeType: employeeType
    };
    
    saveGlobalBasicInfo(basicInfo);
    hideBasicInfoModal();
    alert('基本資料已儲存成功！（全 App 共用）');
}

// 初始化：頁面加載完成後渲染卡片，並綁定按鈕事件
document.addEventListener('DOMContentLoaded', () => {
    // 檢查是否為首頁
    if (window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
        renderTimesheetCards();
        
        // 綁定全局按鈕事件
        document.getElementById('btn-basic-info').addEventListener('click', showBasicInfoModal);
        document.getElementById('btn-new').addEventListener('click', newTimesheet);
        document.getElementById('btn-import').addEventListener('click', importTimesheet);
        document.getElementById('btn-clear-storage').addEventListener('click', () => {
            if (confirm('確定要清空所有資料嗎？此操作無法還原。')) {
                localStorage.clear();
                renderTimesheetCards();
                alert('localStorage 已清空');
            }
        });
        
        // 綁定基本資料模態框事件
        document.getElementById('btn-save-modal-basic-info').addEventListener('click', saveModalBasicInfo);
        document.getElementById('btn-cancel-modal').addEventListener('click', hideBasicInfoModal);
        document.querySelector('.close').addEventListener('click', hideBasicInfoModal);
        
        // 綁定週次選擇模態框事件
        const weekModal = document.getElementById('week-selection-modal');
        if (weekModal) {
            const weekCloseBtn = weekModal.querySelector('.close');
            const confirmWeekBtn = document.getElementById('btn-confirm-week');
            const cancelWeekBtn = document.getElementById('btn-cancel-week');
            const customRadio = document.getElementById('radio-custom');
            const customInput = document.getElementById('custom-week-input');
            
            if (weekCloseBtn) weekCloseBtn.addEventListener('click', hideWeekSelectionModal);
            if (cancelWeekBtn) cancelWeekBtn.addEventListener('click', hideWeekSelectionModal);
            if (confirmWeekBtn) confirmWeekBtn.addEventListener('click', confirmWeekSelection);
            
            // 監聽自訂選項的選擇
            if (customRadio && customInput) {
                customRadio.addEventListener('change', function() {
                    if (this.checked) {
                        customInput.style.display = 'block';
                    }
                });
            }
            
            // 監聽其他選項的選擇（隱藏自訂輸入）
            document.querySelectorAll('input[name="weekOption"]:not(#radio-custom)').forEach(radio => {
                radio.addEventListener('change', function() {
                    if (this.checked && customInput) {
                        customInput.style.display = 'none';
                    }
                });
            });
        }
        
        // 點擊模態框外部關閉
        window.addEventListener('click', (event) => {
            const basicModal = document.getElementById('basic-info-modal');
            const weekSelectionModal = document.getElementById('week-selection-modal');
            
            if (event.target === basicModal) {
                hideBasicInfoModal();
            } else if (event.target === weekSelectionModal) {
                hideWeekSelectionModal();
            }
        });

        // 設置上週按鈕的文字和顯示狀態
        const lastWeekButton = document.getElementById('btn-last-week');
        if (lastWeekButton) {
            updateLastWeekButtonDisplay();
            // 綁定點擊事件
            lastWeekButton.addEventListener('click', createLastWeekTimesheet);
        }
    }
});

// 更新上週按鈕顯示狀態和文字
function updateLastWeekButtonDisplay() {
    const today = new Date();
    // 更精確的計算：獲取上週一（今天減去今天星期幾再減6天）
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - today.getDay() - 6);
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    
    const button = document.getElementById('btn-last-week');
    const container = document.getElementById('last-week-container');
    
    if (button && container) {
        // 檢查上週是否已存在
        const lastWeekKey = getLastWeekKey();
        const timesheets = loadAllTimesheets();
        
        if (timesheets[lastWeekKey]) {
            // 上週已存在，隱藏按鈕
            container.style.display = 'none';
        } else {
            // 上週不存在，顯示按鈕並設置文字
            container.style.display = 'block';
            button.textContent = `建立上週工時表 (${formatDate(lastMonday)} - ${formatDate(lastSunday)})`;
        }
    }
}

// 建立上週工時表
function createLastWeekTimesheet() {
    const today = new Date();
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - today.getDay() - 6);
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    
    // 生成週次格式 YYYY-Www
    const year = lastMonday.getFullYear();
    const weekNumber = Math.ceil((((lastMonday - new Date(year, 0, 1)) / 86400000) + new Date(year, 0, 1).getDay() + 1) / 7);
    const weekKey = `${year}-W${weekNumber.toString().padStart(2, '0')}`;
    
    const timesheets = loadAllTimesheets();
    if (!timesheets[weekKey]) {
        timesheets[weekKey] = [];
        saveAllTimesheets(timesheets);
    }
    
    // 載入上週工時表
    editTimesheet(weekKey);
    renderTimesheetCards();
}

// ==================== 編輯頁面功能 ====================

// 生成唯一 ID
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 獲取當前編輯的週次
function getCurrentWeekKey() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('week');
}

// ==================== 全域基本資料管理 ====================

// 載入全域基本資料
function loadGlobalBasicInfo() {
    const data = localStorage.getItem('globalBasicInfo');
    return data ? JSON.parse(data) : null;
}

// 儲存全域基本資料
function saveGlobalBasicInfo(basicInfo) {
    localStorage.setItem('globalBasicInfo', JSON.stringify(basicInfo));
}

// ==================== 工時記錄管理 ====================

// 獲取指定週次的工時記錄
function getWeekEntries(weekKey) {
    const timesheets = loadAllTimesheets();
    const weekData = timesheets[weekKey];
    
    // 處理不同的資料結構
    if (Array.isArray(weekData)) {
        // 舊的資料結構，直接是陣列
        return weekData;
    } else if (weekData && weekData.entries) {
        // 新的資料結構，有 entries
        return weekData.entries;
    }
    
    return [];
}

// 儲存指定週次的工時記錄
function saveWeekEntries(weekKey, entries) {
    const timesheets = loadAllTimesheets();
    timesheets[weekKey] = entries; // 直接儲存為陣列，簡化結構
    saveAllTimesheets(timesheets);
}

// 計算總工時
function calculateTotalHours() {
    const regular = parseFloat(document.getElementById('regularHours').value) || 0;
    const ot = parseFloat(document.getElementById('otHours').value) || 0;
    document.getElementById('ttlHours').value = regular + ot;
}

// 驗證基本資料表單
function validateBasicInfo() {
    const requiredFields = ['employeeName', 'employeeType'];
    let isValid = true;
    
    // 清除之前的錯誤狀態
    document.querySelectorAll('#basic-info-form .form-field.error').forEach(field => {
        field.classList.remove('error');
    });
    
    requiredFields.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        const formField = field.closest('.form-field');
        
        if (!field.value.trim()) {
            formField.classList.add('error');
            showFieldError(formField, '此欄位為必填');
            isValid = false;
        }
    });
    
    return isValid;
}

// 驗證工時記錄表單
function validateForm() {
    const requiredFields = ['task', 'zone', 'project', 'activityType', 'regularHours', 'date'];
    let isValid = true;
    
    // 檢查是否已儲存全域基本資料
    const basicInfo = loadGlobalBasicInfo();
    if (!basicInfo) {
        alert('請先填寫並儲存基本資料');
        document.querySelector('.basic-info-container').scrollIntoView({ behavior: 'smooth' });
        return false;
    }
    
    // 清除之前的錯誤狀態
    document.querySelectorAll('#timesheet-form .form-field.error').forEach(field => {
        field.classList.remove('error');
    });
    
    requiredFields.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        const formField = field.closest('.form-field');
        
        if (!field.value.trim()) {
            formField.classList.add('error');
            showFieldError(formField, '此欄位為必填');
            isValid = false;
        }
    });
    
    // 驗證工時範圍
    const regularHours = parseFloat(document.getElementById('regularHours').value);
    const otHours = parseFloat(document.getElementById('otHours').value) || 0;
    
    if (regularHours < 0 || regularHours > 24) {
        const formField = document.getElementById('regularHours').closest('.form-field');
        formField.classList.add('error');
        showFieldError(formField, '正常工時必須在 0-24 小時之間');
        isValid = false;
    }
    
    if (otHours < 0 || otHours > 24) {
        const formField = document.getElementById('otHours').closest('.form-field');
        formField.classList.add('error');
        showFieldError(formField, '加班工時必須在 0-24 小時之間');
        isValid = false;
    }
    
    // 允許正常工時總計超過40小時，僅於匯出時提示正規化
    const weekKey = getCurrentWeekKey();
    const currentEntryId = document.getElementById('entryId').value;
    const entries = getWeekEntries(weekKey);
    
    // 計算除了當前編輯記錄外的其他記錄的正常工時總和
    let totalRegularHours = 0;
    entries.forEach(entry => {
        if (entry.id !== currentEntryId) {
            totalRegularHours += entry.regularHours || 0;
        }
    });
    
    // 加上當前輸入的正常工時
    totalRegularHours += regularHours;
    
    // 不再於此處限制或提示，僅於匯出時處理正規化
    
    // 驗證日期邏輯
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const date = document.getElementById('date').value;
    
    // 獲取當前週的日期範圍（使用已宣告的 weekKey）
    const [year, week] = weekKey.split('-');
    const weekNumber = parseInt(week.substring(1));
    const weekRange = getWeekDateRange(weekNumber, year);
    
    // 驗證主要日期是否在週範圍內
    if (date && !validateDateInWeekRange(date, weekRange.start, weekRange.end)) {
        const formField = document.getElementById('date').closest('.form-field');
        formField.classList.add('error');
        showFieldError(formField, `日期必須在 ${formatDate(weekRange.start)} 至 ${formatDate(weekRange.end)} 範圍內`);
        isValid = false;
    }
    
    // 驗證開始日期是否在週範圍內
    if (startDate && !validateDateInWeekRange(startDate, weekRange.start, weekRange.end)) {
        const formField = document.getElementById('startDate').closest('.form-field');
        formField.classList.add('error');
        showFieldError(formField, `開始日期必須在 ${formatDate(weekRange.start)} 至 ${formatDate(weekRange.end)} 範圍內`);
        isValid = false;
    }
    
    // 驗證結束日期是否在週範圍內
    if (endDate && !validateDateInWeekRange(endDate, weekRange.start, weekRange.end)) {
        const formField = document.getElementById('endDate').closest('.form-field');
        formField.classList.add('error');
        showFieldError(formField, `結束日期必須在 ${formatDate(weekRange.start)} 至 ${formatDate(weekRange.end)} 範圍內`);
        isValid = false;
    }
    
    // 驗證開始日期不能晚於結束日期
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        const formField = document.getElementById('endDate').closest('.form-field');
        formField.classList.add('error');
        showFieldError(formField, '結束日期不能早於開始日期');
        isValid = false;
    }
    
    return isValid;
}

// 顯示欄位錯誤訊息
function showFieldError(formField, message) {
    let errorDiv = formField.querySelector('.error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        formField.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
}

// 清空表單
function clearForm() {
    document.getElementById('timesheet-form').reset();
    document.getElementById('entryId').value = '';
    document.getElementById('ttlHours').value = '';
    
    // 清除錯誤狀態
    document.querySelectorAll('.form-field.error').forEach(field => {
        field.classList.remove('error');
    });
}

// 獲取基本資料
function getBasicInfoData() {
    return {
        employeeName: document.getElementById('employeeName').value.trim(),
        employeeType: document.getElementById('employeeType').value
    };
}

// 填充基本資料
function fillBasicInfo(basicInfo) {
    if (basicInfo) {
        document.getElementById('employeeName').value = basicInfo.employeeName || '';
        document.getElementById('employeeType').value = basicInfo.employeeType || '';
    }
}

// 從表單獲取工時記錄數據
function getFormData() {
    const basicInfo = loadGlobalBasicInfo();
    const originalHours = document.getElementById('originalHours').value;
    
    const data = {
        id: document.getElementById('entryId').value || generateUniqueId(),
        // 從全域基本資料引用
        name: basicInfo ? basicInfo.employeeName : '',
        internalOrOutsource: basicInfo ? basicInfo.employeeType : '',
        // 工時記錄特定欄位
        zone: document.getElementById('zone').value,
        project: document.getElementById('project').value.trim(),
        productModule: document.getElementById('productModule').value.trim(),
        activityType: document.getElementById('activityType').value,
        task: document.getElementById('task').value.trim(),
        regularHours: parseFloat(document.getElementById('regularHours').value) || 0,
        otHours: parseFloat(document.getElementById('otHours').value) || 0,
        ttlHours: parseFloat(document.getElementById('ttlHours').value) || 0,
        date: document.getElementById('date').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        comments: document.getElementById('comments').value.trim(),
        pm: document.getElementById('pm').value.trim()
    };
    
    // 如果有原始工時（正規化模式），則儲存但標記為內部使用
    if (originalHours && parseFloat(originalHours) > 0) {
        data._originalHours = parseFloat(originalHours); // 使用 _ 前綴標記為內部欄位
        data._isNormalized = true;
    }
    
    return data;
}

// 填充工時記錄表單數據
function fillForm(entry) {
    document.getElementById('entryId').value = entry.id;
    document.getElementById('zone').value = entry.zone || '';
    document.getElementById('project').value = entry.project || '';
    document.getElementById('productModule').value = entry.productModule || '';
    document.getElementById('activityType').value = entry.activityType || '';
    document.getElementById('task').value = entry.task || '';
    document.getElementById('regularHours').value = entry.regularHours || '';
    document.getElementById('otHours').value = entry.otHours || 0;
    document.getElementById('ttlHours').value = entry.ttlHours || '';
    document.getElementById('date').value = entry.date || '';
    document.getElementById('startDate').value = entry.startDate || '';
    document.getElementById('endDate').value = entry.endDate || '';
    document.getElementById('comments').value = entry.comments || '';
    document.getElementById('pm').value = entry.pm || '';
    
    // 處理原始工時欄位（正規化模式）
    const originalHoursField = document.getElementById('originalHoursField');
    if (entry._originalHours && entry._isNormalized) {
        document.getElementById('originalHours').value = entry._originalHours;
        originalHoursField.style.display = 'block';
    } else {
        document.getElementById('originalHours').value = '';
        originalHoursField.style.display = 'none';
    }
}

// 儲存基本資料
function saveBasicInfo() {
    if (!validateBasicInfo()) {
        return;
    }
    
    const basicInfoData = getBasicInfoData();
    saveGlobalBasicInfo(basicInfoData);
    
    // 更新 UI 狀態
    const container = document.querySelector('.basic-info-container');
    container.classList.add('basic-info-saved');
    
    showSuccessMessage('基本資料已儲存成功！（全 App 共用）');
}

// 儲存工時記錄
function saveEntry() {
    if (!validateForm()) {
        return;
    }
    
    const weekKey = getCurrentWeekKey();
    if (!weekKey) {
        alert('無效的週次參數');
        return;
    }
    
    const formData = getFormData();
    const entries = getWeekEntries(weekKey);
    
    // 檢查是否為新增或編輯
    const existingIndex = entries.findIndex(entry => entry.id === formData.id);
    
    if (existingIndex !== -1) {
        // 編輯現有記錄
        entries[existingIndex] = formData;
    } else {
        // 新增記錄
        entries.push(formData);
    }
    
    saveWeekEntries(weekKey, entries);
    renderEntriesList();
    clearForm();
    showSuccessMessage('工時記錄已儲存成功！');
}

// 編輯工時記錄
function editEntry(entryId) {
    const weekKey = getCurrentWeekKey();
    const entries = getWeekEntries(weekKey);
    const entry = entries.find(e => e.id === entryId);
    
    if (entry) {
        fillForm(entry);
        // 滾動到表單頂部
        document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
    }
}

// 複製工時記錄
function copyEntry(entryId) {
    const weekKey = getCurrentWeekKey();
    const entries = getWeekEntries(weekKey);
    const entry = entries.find(e => e.id === entryId);
    
    if (entry) {
        // 獲取當週日期範圍
        const [year, week] = weekKey.split('-');
        const weekNumber = parseInt(week.substring(1));
        const weekRange = getWeekDateRange(weekNumber, year);
        
        // 複製記錄資料並更新日期
        const copiedEntry = { ...entry, id: generateUniqueId() };
        
        // 更新日期（如果是單日記錄）
        if (copiedEntry.date) {
            const originalDate = new Date(copiedEntry.date);
            const nextDate = new Date(originalDate);
            nextDate.setDate(originalDate.getDate() + 1);
            
            // 檢查是否超過週範圍
            if (nextDate <= weekRange.end) {
                copiedEntry.date = formatDate(nextDate);
            } else {
                // 如果是週最後一天，則重置為週第一天
                copiedEntry.date = formatDate(weekRange.start);
            }
        }
        
        fillForm(copiedEntry);
        // 滾動到表單頂部
        document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
        showSuccessMessage('工時記錄已複製，日期已自動調整');
    }
}

// 刪除工時記錄
function deleteEntry(entryId) {
    if (!confirm('確定要刪除這筆工時記錄嗎？')) {
        return;
    }
    
    const weekKey = getCurrentWeekKey();
    const entries = getWeekEntries(weekKey);
    const filteredEntries = entries.filter(entry => entry.id !== entryId);
    
    saveWeekEntries(weekKey, filteredEntries);
    renderEntriesList();
    showSuccessMessage('工時記錄已刪除！');
}

// 渲染工時記錄列表
function renderEntriesList() {
    const weekKey = getCurrentWeekKey();
    const entries = getWeekEntries(weekKey);
    const tbody = document.getElementById('entries-tbody');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    let totalHours = 0;
    
    entries.forEach(entry => {
        totalHours += entry.ttlHours || 0;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.date || '-'}</td>
            <td>${entry.zone || '-'}</td>
            <td>${entry.activityType || '-'}</td>
            <td>${entry.task || '-'}</td>
            <td>${entry.regularHours || 0}</td>
            <td>${entry.otHours || 0}</td>
            <td><strong>${entry.ttlHours || 0}</strong></td>
            <td class="entry-actions">
                <button class="btn-edit-entry" onclick="editEntry('${entry.id}')">編輯</button>
                <button class="btn-copy-entry" onclick="copyEntry('${entry.id}')">複製</button>
                <button class="btn-delete-entry" onclick="deleteEntry('${entry.id}')">刪除</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
// 顯示複製選項模態框
function showCopyOptionsModal(sourceWeekKey) {
    // 計算當前週、上週、上上週
    const now = new Date();
    const currentWeekNumber = getWeekNumber(now);
    const currentYear = now.getFullYear();
    const currentWeekKey = currentYear + '-W' + currentWeekNumber.toString().padStart(2, '0');
    
    // 計算上週
    let lastWeekNumber = currentWeekNumber - 1;
    let lastWeekYear = currentYear;
    if (lastWeekNumber < 1) {
        lastWeekYear = currentYear - 1;
        const lastDayOfPreviousYear = new Date(lastWeekYear, 11, 31);
        lastWeekNumber = getWeekNumber(lastDayOfPreviousYear);
    }
    const lastWeekKey = lastWeekYear + '-W' + lastWeekNumber.toString().padStart(2, '0');
    
    // 計算上上週
    let twoWeeksAgoNumber = lastWeekNumber - 1;
    let twoWeeksAgoYear = lastWeekYear;
    if (twoWeeksAgoNumber < 1) {
        twoWeeksAgoYear = lastWeekYear - 1;
        const lastDayOfPreviousYear = new Date(twoWeeksAgoYear, 11, 31);
        twoWeeksAgoNumber = getWeekNumber(lastDayOfPreviousYear);
    }
    const twoWeeksAgoKey = twoWeeksAgoYear + '-W' + twoWeeksAgoNumber.toString().padStart(2, '0');
    
    // 建立選項
    const options = [
        { key: currentWeekKey, label: '本週 (' + currentWeekKey + ')' },
        { key: lastWeekKey, label: '上週 (' + lastWeekKey + ')' },
        { key: twoWeeksAgoKey, label: '上上週 (' + twoWeeksAgoKey + ')' }
    ];
    
    // 過濾掉來源週
    const filteredOptions = options.filter(option => option.key !== sourceWeekKey);
    
    if (filteredOptions.length === 0) {
        alert('沒有可用的複製目標週次。');
        return;
    }
    
    // 建立選項文字
    let optionText = '請選擇要複製到哪一週：\n\n';
    filteredOptions.forEach((option, index) => {
        optionText += (index + 1) + '. ' + option.label + '\n';
    });
    optionText += '\n請輸入選項編號 (1-' + filteredOptions.length + ')：';
    
    const choice = prompt(optionText);
    const choiceIndex = parseInt(choice) - 1;
    
    if (isNaN(choiceIndex) || choiceIndex < 0 || choiceIndex >= filteredOptions.length) {
        alert('無效的選項。');
        return;
    }
    
    const targetWeekKey = filteredOptions[choiceIndex].key;
    copyWeekToTargetWeek(sourceWeekKey, targetWeekKey);
}
    // 更新統計資訊
    document.getElementById('total-entries').textContent = entries.length;
    document.getElementById('total-hours').textContent = totalHours.toFixed(1);
    
    // 如果沒有記錄，顯示提示
    if (entries.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
// 複製指定週的工時記錄到目標週
function copyWeekToTargetWeek(sourceWeekKey, targetWeekKey) {
    const timesheets = loadAllTimesheets();
    
    // 處理來源週資料格式
    let sourceEntries = [];
    const sourceWeekData = timesheets[sourceWeekKey];
    if (Array.isArray(sourceWeekData)) {
        sourceEntries = sourceWeekData;
    } else if (sourceWeekData && sourceWeekData.entries) {
        sourceEntries = sourceWeekData.entries;
    }
    
    if (sourceEntries.length === 0) {
        alert('來源週沒有工時記錄可以複製。');
        return;
    }
    
    // 檢查目標週是否已有資料
    const targetWeekData = timesheets[targetWeekKey];
    let targetEntries = [];
    if (Array.isArray(targetWeekData)) {
        targetEntries = targetWeekData;
    } else if (targetWeekData && targetWeekData.entries) {
        targetEntries = targetWeekData.entries;
    }
    
    if (targetEntries.length > 0) {
        const overwrite = confirm('目標週 (' + targetWeekKey + ') 已有 ' + targetEntries.length + ' 筆工時記錄。\n\n是否要覆蓋這些記錄？');
        if (!overwrite) {
            return;
        }
    }
    
    // 計算日期差異（以週為單位）
    const [sourceYearStr, sourceWeekStr] = sourceWeekKey.split('-');
    const [targetYearStr, targetWeekStr] = targetWeekKey.split('-');
    const sourceYear = parseInt(sourceYearStr);
    const sourceWeek = parseInt(sourceWeekStr.substring(1));
    const targetYear = parseInt(targetYearStr);
    const targetWeek = parseInt(targetWeekStr.substring(1));
    
    // 計算週數差異（簡化計算，假設同年）
    let weekDiff = targetWeek - sourceWeek;
    if (targetYear !== sourceYear) {
        // 跨年計算較複雜，這裡簡化處理
        weekDiff = (targetYear - sourceYear) * 52 + (targetWeek - sourceWeek);
    }
    
    // 複製記錄並調整日期
    const copiedEntries = sourceEntries.map(entry => {
        const currentDate = new Date(entry.date);
        // 調整日期
        const targetDate = new Date(currentDate);
        targetDate.setDate(currentDate.getDate() + (weekDiff * 7));
        
        return {
            ...entry,
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 9), // 生成新的ID
            date: targetDate.toISOString().split('T')[0] // 更新日期為目標週對應日期
        };
    });
    
    // 儲存到目標週
    timesheets[targetWeekKey] = copiedEntries;
    saveAllTimesheets(timesheets);
    
    // 重新渲染卡片
    renderTimesheetCards();
    
    // 顯示成功訊息
    const targetWeekRange = getWeekDateRangeFromKey(targetWeekKey);
    const startDate = targetWeekRange.start.toISOString().split('T')[0];
    const endDate = targetWeekRange.end.toISOString().split('T')[0];
    
    alert('成功複製 ' + copiedEntries.length + ' 筆工時記錄到目標週！\n\n來源週：' + sourceWeekKey + '\n目標週：' + targetWeekKey + '\n日期範圍：' + startDate + ' ~ ' + endDate + '\n\n所有日期已自動調整為目標週對應日期。');
}
            <td colspan="8" style="text-align: center; color: #7f8c8d; padding: 40px;">
                尚無工時記錄，請點擊下方「新增記錄」按鈕開始填寫
            </td>
        `;
        tbody.appendChild(row);
    }
}

// 顯示成功訊息
function showSuccessMessage(message) {
    // 創建或更新成功訊息元素
    let successDiv = document.querySelector('.success-message');
    if (!successDiv) {
        successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        document.querySelector('.form-container').insertBefore(successDiv, document.querySelector('.form-container').firstChild);
    }
    
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    
    // 3秒後自動隱藏
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 3000);
}

// 初始化編輯頁面
async function initEditPage() {
    const weekKey = getCurrentWeekKey();
    if (!weekKey) {
        alert('無效的週次參數');
        window.location.href = 'index.html';
        return;
    }
    
    // 載入 CSV 資料
    await loadAllCSVData();
    
    // 設置週次標題和日期範圍
    document.getElementById('week-title').textContent = weekKey;
    
    // 計算並顯示日期範圍
    const [year, week] = weekKey.split('-');
    const weekNumber = parseInt(week.substring(1));
    const dateRange = getWeekDateRange(weekNumber, year);
    const entries = getWeekEntries(weekKey) || [];
    const totalRegularHours = entries.reduce((sum, entry) => sum + (entry.regularHours || 0), 0);
    const totalOtHours = entries.reduce((sum, entry) => sum + (entry.otHours || 0), 0);
    const totalHours = entries.reduce((sum, entry) => sum + (entry.ttlHours || entry.TTL_Hours || 0), 0);

    // 將統計資訊加在日期區塊同一行
    const dateRangeDiv = document.getElementById('date-range');
    dateRangeDiv.innerHTML =
        `${formatDate(dateRange.start)} 至 ${formatDate(dateRange.end)}
        <span style="color:#444;font-size:1em;">
        總正常工時：${totalRegularHours}
        總加班工時：${totalOtHours}
        總工時：${totalHours}
        </span>`;
    // 設置日期欄位的限制範圍
    setDateFieldLimits(dateRange.start, dateRange.end);
    
    // (已移除正規化模式狀態顯示)
 
    // 載入並顯示全域基本資料
    const basicInfo = loadGlobalBasicInfo();
    if (basicInfo) {
        fillBasicInfo(basicInfo);
        document.querySelector('.basic-info-container').classList.add('basic-info-saved');
    }
    
    // 綁定基本資料表單事件
    document.getElementById('btn-save-basic-info').addEventListener('click', saveBasicInfo);
    
    // 綁定工時記錄表單事件
    document.getElementById('regularHours').addEventListener('input', calculateTotalHours);
    document.getElementById('otHours').addEventListener('input', calculateTotalHours);
    
    // 綁定按鈕事件
    document.getElementById('btn-save-entry').addEventListener('click', saveEntry);
    document.getElementById('btn-cancel-entry').addEventListener('click', clearForm);
    document.getElementById('btn-clear-form').addEventListener('click', clearForm);
    document.getElementById('btn-back').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    // 綁定新增記錄按鈕
    document.getElementById('btn-add-entry').addEventListener('click', () => {
        clearForm();
        document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
    });
    
    
    // 渲染工時記錄列表
    renderEntriesList();
}

// 檢查是否為編輯頁面並初始化
if (window.location.pathname.includes('edit.html')) {
    document.addEventListener('DOMContentLoaded', initEditPage);
}
// 隱藏週次選擇模態框
function hideWeekSelectionModal() {
    const modal = document.getElementById('week-selection-modal');
    modal.style.display = 'none';
}

// 確認週次選擇並建立工時表
function confirmWeekSelection() {
    const selectedOption = document.querySelector('input[name="weekOption"]:checked');
    
    if (!selectedOption) {
        alert('請選擇一個週次選項');
        return;
    }
    
    let weekKey = '';
    
    switch (selectedOption.value) {
        case 'last':
            weekKey = getLastWeekKey();
            break;
        case 'this':
            weekKey = getThisWeekKey();
            break;
        case 'custom':
            const customWeek = document.getElementById('custom-week-field').value.trim();
            if (!customWeek) {
                alert('請輸入自訂週次');
                return;
            }
            
            // 驗證格式
            if (!/^\d{4}-W\d{2}$/.test(customWeek)) {
                alert('週次格式不正確，請使用YYYY-Www格式（例如2024-W25）');
                return;
            }
            
            weekKey = customWeek;
            break;
        default:
            alert('無效的選項');
            return;
    }
    
    if (!weekKey) {
        alert('無法取得週次資訊');
        return;
    }
    
    // 檢查是否已存在
    const timesheets = loadAllTimesheets();
    if (timesheets[weekKey]) {
        alert(`週次 ${weekKey} 已存在`);
        return;
    }
    
    // 創建新的工時表
    timesheets[weekKey] = [];
    saveAllTimesheets(timesheets);
    
    // 隱藏模態框
    hideWeekSelectionModal();
    
    // 重新渲染卡片
    renderTimesheetCards();
    
    // 顯示成功訊息
    showSuccessMessage(`成功建立週次 ${weekKey} 的工時表`);
}

// 顯示成功訊息
function showSuccessMessage(message) {
    // 創建成功訊息元素
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <div class="success-content">
            <span class="success-icon">✓</span>
            <span class="success-text">${message}</span>
        </div>
    `;
    
    // 添加到頁面
    document.body.appendChild(successDiv);
    
    // 3秒後自動移除
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 3000);
}
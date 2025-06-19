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
function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(value => value.trim());
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        data.push(row);
    }
    
    return data;
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
        const normalizedEntries = [...entries];
        let remainingHours = 40; // 可分配的正常工時
        
        // 按比例調整每筆記錄的正常工時
        normalizedEntries.forEach(entry => {
            if (remainingHours > 0 && entry.regularHours > 0) {
                const originalHours = entry.regularHours;
                const allocatedHours = Math.min(remainingHours, originalHours);
                const excessHours = originalHours - allocatedHours;
                
                // 保存原始工時
                entry._originalHours = originalHours;
                entry._isNormalized = true;
                
                // 調整工時
                entry.regularHours = allocatedHours;
                entry.otHours = (entry.otHours || 0) + excessHours;
                entry.ttlHours = entry.regularHours + entry.otHours;
                
                remainingHours -= allocatedHours;
            }
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
        // key格式：YYYY-Www
        const [year, week] = key.split('-');
        const weekNumber = parseInt(week.substring(1));
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
            </div>
            <div class="card-actions">
                <button class="btn-edit" data-week="${key}">修改</button>
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
    
    document.querySelectorAll('.btn-export').forEach(btn => {
        btn.addEventListener('click', () => {
            const weekKey = btn.getAttribute('data-week');
            exportTimesheet(weekKey);
        });
    });
}

// 新建工時表
function newTimesheet() {
    // 提示用戶輸入週次（格式：YYYY-Www）
    const weekInput = prompt('請輸入週次（格式：YYYY-Www，例如2023-W25）:');
    if (!weekInput) return;
    
    // 驗證格式
    if (!/^\d{4}-W\d{2}$/.test(weekInput)) {
        alert('週次格式不正確，請使用YYYY-Www格式（例如2023-W25）');
        return;
    }
    
    const timesheets = loadAllTimesheets();
    if (timesheets[weekInput]) {
        alert('該週次已存在');
        return;
    }
    
    // 創建新的工時表（空數組）
    timesheets[weekInput] = [];
    saveAllTimesheets(timesheets);
    renderTimesheetCards();
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

// 匯出工時表（暫時只提示）
function exportTimesheet(weekKey) {
    alert(`即將匯出 ${weekKey} 的工時表`);
    // 待實現：導出Excel/CSV
}

// 匯入工時表（暫時只提示）
function importTimesheet() {
    alert('即將匯入工時表');
    // 待實現：從CSV導入
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
        
        // 綁定模態框事件
        document.getElementById('btn-save-modal-basic-info').addEventListener('click', saveModalBasicInfo);
        document.getElementById('btn-cancel-modal').addEventListener('click', hideBasicInfoModal);
        document.querySelector('.close').addEventListener('click', hideBasicInfoModal);
        
        // 點擊模態框外部關閉
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('basic-info-modal');
            if (event.target === modal) {
                hideBasicInfoModal();
            }
        });

        // 設置上週按鈕的文字（顯示上週日期範圍）
        const lastWeekButton = document.getElementById('btn-last-week');
        if (lastWeekButton) {
            updateLastWeekButtonText();
            // 綁定點擊事件
            lastWeekButton.addEventListener('click', createLastWeekTimesheet);
        }
    }
});

// 更新上週按鈕文字（顯示日期範圍）
function updateLastWeekButtonText() {
    const today = new Date();
    // 更精確的計算：獲取上週一（今天減去今天星期幾再減6天）
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - today.getDay() - 6);
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    
    const button = document.getElementById('btn-last-week');
    if (button) {
        button.textContent = `上週工時表 (${formatDate(lastMonday)} - ${formatDate(lastSunday)})`;
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
    
    // 驗證該週正常工時總計不得超過40小時
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
    
    if (totalRegularHours > 40) {
        const shouldNormalize = confirm(
            `該週正常工時總計 ${totalRegularHours} 小時，超過 40 小時限制。\n\n` +
            `是否開啟正規化模式？\n` +
            `- 確定：自動調整為40小時正常工時，超出部分轉為加班工時\n` +
            `- 取消：保持原有設定但無法儲存`
        );
        
        if (shouldNormalize) {
            // 啟用正規化模式 - 只標記狀態，不立即調整工時
            enableNormalizationMode(weekKey);
            showSuccessMessage('正規化模式已啟用，匯出時將自動進行正規化計算');
        } else {
            const formField = document.getElementById('regularHours').closest('.form-field');
            formField.classList.add('error');
            showFieldError(formField, `該週正常工時總計 ${totalRegularHours} 小時，不得超過 40 小時`);
            isValid = false;
        }
    }
    
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
        // 複製記錄資料但清除 ID 和日期相關欄位
        const copiedEntry = {
            ...entry,
            id: '', // 清空 ID，儲存時會產生新的
            date: '', // 清空日期，讓使用者重新選擇
            startDate: '', // 清空開始日期
            endDate: '' // 清空結束日期
        };
        
        fillForm(copiedEntry);
        // 滾動到表單頂部
        document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
        showSuccessMessage('工時記錄已複製，請修改日期後儲存');
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
    
    // 更新統計資訊
    document.getElementById('total-entries').textContent = entries.length;
    document.getElementById('total-hours').textContent = totalHours.toFixed(1);
    
    // 如果沒有記錄，顯示提示
    if (entries.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
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
    document.getElementById('date-range').textContent =
        `${formatDate(dateRange.start)} 至 ${formatDate(dateRange.end)}`;
    
    // 設置日期欄位的限制範圍
    setDateFieldLimits(dateRange.start, dateRange.end);
    
    // 檢查並顯示正規化模式狀態
    updateNormalizationModeDisplay(weekKey);
    
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
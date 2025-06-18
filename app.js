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
        const entries = timesheets[key];
        
        const dateRange = getWeekDateRange(weekNumber, year);
        const startStr = dateRange.start.toISOString().split('T')[0];
        const endStr = dateRange.end.toISOString().split('T')[0];
        
        const progress = calculateProgress(entries);
        
        // 創建卡片元素
        const card = document.createElement('div');
        card.className = 'timesheet-card';
        card.innerHTML = `
            <div class="card-color-bar"></div>
            <div class="status-tag ${progress === 100 ? 'status-completed' : 'status-inprogress'}">
                ${progress === 100 ? '✓' : '⚠'}
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
                    <div class="stat-value">${entries.reduce((sum, entry) => sum + (entry.TTL_Hours || 0), 0)}</div>
                    <div class="stat-label">總工時</div>
                </div>
            </div>
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
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

// 修改工時表（暫時只跳轉到一個提示）
function editTimesheet(weekKey) {
    alert(`即將編輯 ${weekKey} 的工時表`);
    // 待實現：跳轉到工時填寫界面
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

// 初始化：頁面加載完成後渲染卡片，並綁定按鈕事件
document.addEventListener('DOMContentLoaded', () => {
    renderTimesheetCards();
    
    // 綁定全局按鈕事件
    document.getElementById('btn-new').addEventListener('click', newTimesheet);
    document.getElementById('btn-import').addEventListener('click', importTimesheet);
});
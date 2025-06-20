// ==================== UI 與訊息顯示相關 ====================

// Import required modules
import { loadAllTimesheets, saveAllTimesheets } from './storageModule.js';
import { getWeekNumber, getWeekDateRangeFromKey, getWeekDateRange, getLastWeekKey, formatDate } from './dateModule.js';

// 渲染工時表卡片
export function renderTimesheetCards() {
    const container = document.getElementById('timesheet-cards');
    container.innerHTML = '';
    const timesheets = loadAllTimesheets();

    Object.keys(timesheets).forEach(key => {
        if (!key || typeof key !== 'string' || !key.includes('-')) return;
        const [year, week] = key.split('-');
        if (!year || !week || week.length < 2) return;
        const weekNumber = parseInt(week.substring(1));
        if (isNaN(weekNumber)) return;
        const weekData = timesheets[key];
        let entries = [];
        if (Array.isArray(weekData)) {
            entries = weekData;
        } else if (weekData && weekData.entries) {
            entries = weekData.entries;
        }
        const dateRange = getWeekDateRange(weekNumber, year);
        const startStr = dateRange.start.toISOString().split('T')[0];
        const endStr = dateRange.end.toISOString().split('T')[0];
        const totalHours = entries.reduce((sum, entry) => sum + (entry.ttlHours || entry.TTL_Hours || 0), 0);
        const totalRegularHours = entries.reduce((sum, entry) => sum + (entry.regularHours || 0), 0);
        const totalOtHours = entries.reduce((sum, entry) => sum + (entry.otHours || 0), 0);
        const isComplete = totalHours >= 40;
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

    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            const weekKey = btn.getAttribute('data-week');
            // Navigate to edit page
            window.location.href = `edit.html?week=${encodeURIComponent(weekKey)}`;
        });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const weekKey = btn.getAttribute('data-week');
            if (confirm(`確定要刪除 ${weekKey} 的工時表嗎？`)) {
                const timesheets = loadAllTimesheets();
                delete timesheets[weekKey];
                saveAllTimesheets(timesheets);
                renderTimesheetCards();
            }
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
            window.exportTimesheet(weekKey);
        });
    });

    if (window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
        updateLastWeekButtonDisplay();
    }
}

// 顯示週次選擇模態框
export function showWeekSelectionModal() {
    // ...（從 app.js 對應內容複製，略）
}

// 顯示複製選項模態框
export function showCopyOptionsModal(sourceWeekKey) {
    console.log('Inside showCopyOptionsModal function, sourceWeekKey:', sourceWeekKey);
    
    // 計算當前週、上週、上上週
    const now = new Date();
    console.log('Current Date:', now);
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
    
    console.log('Calculated week keys: currentWeekKey=', currentWeekKey, 'lastWeekKey=', lastWeekKey, 'twoWeeksAgoKey=', twoWeeksAgoKey);
    
    // 取得來源週的工時記錄數量
    const timesheets = loadAllTimesheets();
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
    
    // 判斷來源週相對於現在的時間描述
    let sourceDescription;
    if (sourceWeekKey === currentWeekKey) {
        sourceDescription = '本週工時表';
    } else if (sourceWeekKey === lastWeekKey) {
        sourceDescription = '上週工時表';
    } else if (sourceWeekKey === twoWeeksAgoKey) {
        sourceDescription = '上上週工時表';
    } else {
        // 顯示週數和起迄日期
        const sourceWeekRange = getWeekDateRangeFromKey(sourceWeekKey);
        const sourceStartDate = sourceWeekRange.start.toISOString().split('T')[0];
        const sourceEndDate = sourceWeekRange.end.toISOString().split('T')[0];
        sourceDescription = `${sourceWeekKey} 工時表 (${sourceStartDate} ~ ${sourceEndDate})`;
    }
    
    // 更新模態視窗標題以包含來源週資訊
    document.querySelector('#copy-options-modal .modal-header h3').textContent =
        `複製 ${sourceDescription} 到哪一週？`;
    
    // 更新模態視窗中的目標週次資訊
    const currentWeekRange = getWeekDateRangeFromKey(currentWeekKey);
    const lastWeekRange = getWeekDateRangeFromKey(lastWeekKey);
    
    document.getElementById('copy-current-week-info').textContent =
        `${currentWeekKey} (${currentWeekRange.start.toISOString().split('T')[0]} ~ ${currentWeekRange.end.toISOString().split('T')[0]})`;
    document.getElementById('copy-last-week-info').textContent =
        `${lastWeekKey} (${lastWeekRange.start.toISOString().split('T')[0]} ~ ${lastWeekRange.end.toISOString().split('T')[0]})`;
    
    // 顯示模態視窗
    document.getElementById('copy-options-modal').style.display = 'block';
    
    // 綁定按鈕事件
    document.getElementById('copy-btn-current').onclick = function() {
        handleCopySelection(sourceWeekKey, currentWeekKey);
    };
    
    document.getElementById('copy-btn-last').onclick = function() {
        handleCopySelection(sourceWeekKey, lastWeekKey);
    };
    
    document.getElementById('copy-btn-custom').onclick = function() {
        document.getElementById('copy-custom-week-input').style.display = 'block';
        document.getElementById('copy-custom-week-field').focus();
    };
    
    document.getElementById('copy-btn-custom-confirm').onclick = function() {
        const customWeekKey = document.getElementById('copy-custom-week-field').value.trim().toUpperCase();
        if (!customWeekKey) {
            alert('請輸入週次。');
            return;
        }
        
        const weekKeyPattern = /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/;
        if (!weekKeyPattern.test(customWeekKey)) {
            alert('無效的週次格式。請使用 YYYY-WNN 格式。');
            return;
        }
        
        handleCopySelection(sourceWeekKey, customWeekKey);
    };
    
    document.getElementById('copy-btn-custom-cancel').onclick = function() {
        document.getElementById('copy-custom-week-input').style.display = 'none';
        document.getElementById('copy-custom-week-field').value = '';
    };
    
    document.getElementById('copy-btn-cancel').onclick = function() {
        closeCopyModal();
    };
}

// 關閉複製模態視窗
export function closeCopyModal() {
    document.getElementById('copy-options-modal').style.display = 'none';
    document.getElementById('copy-custom-week-input').style.display = 'none';
    document.getElementById('copy-custom-week-field').value = '';
}

// 處理複製選擇
export function handleCopySelection(sourceWeekKey, targetWeekKey) {
    // 顯示確認對話框
    const sourceWeekRange = getWeekDateRangeFromKey(sourceWeekKey);
    const targetWeekRange = getWeekDateRangeFromKey(targetWeekKey);
    const sourceStartDate = sourceWeekRange.start.toISOString().split('T')[0];
    const sourceEndDate = sourceWeekRange.end.toISOString().split('T')[0];
    const targetStartDate = targetWeekRange.start.toISOString().split('T')[0];
    const targetEndDate = targetWeekRange.end.toISOString().split('T')[0];
    
    // 取得來源週的工時記錄數量
    const timesheets = loadAllTimesheets();
    let sourceEntries = [];
    const sourceWeekData = timesheets[sourceWeekKey];
    if (Array.isArray(sourceWeekData)) {
        sourceEntries = sourceWeekData;
    } else if (sourceWeekData && sourceWeekData.entries) {
        sourceEntries = sourceWeekData.entries;
    }
    
    const confirmMessage = `確認要複製工時記錄嗎？\n\n` +
                           `來源週：${sourceWeekKey}\n` +
                           `日期範圍：${sourceStartDate} ~ ${sourceEndDate}\n` +
                           `記錄筆數：${sourceEntries.length} 筆\n\n` +
                           `目標週：${targetWeekKey}\n` +
                           `日期範圍：${targetStartDate} ~ ${targetEndDate}\n\n` +
                           `所有日期將自動調整為目標週對應日期。`;
    
    if (confirm(confirmMessage)) {
        copyWeekToTargetWeek(sourceWeekKey, targetWeekKey);
        closeCopyModal();
    }
}

// 複製週工時
export function copyWeekToTargetWeek(sourceWeekKey, targetWeekKey) {
    try {
        const timesheets = loadAllTimesheets();
        
        // 獲取來源週的工時記錄
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
        
        // 計算目標週的日期範圍
        const sourceWeekRange = getWeekDateRangeFromKey(sourceWeekKey);
        const targetWeekRange = getWeekDateRangeFromKey(targetWeekKey);
        
        // 計算日期偏移天數
        const dayOffset = Math.floor((targetWeekRange.start - sourceWeekRange.start) / (1000 * 60 * 60 * 24));
        
        // 複製並調整日期
        const copiedEntries = sourceEntries.map(entry => {
            const newEntry = { ...entry };
            
            // 生成新的唯一ID
            newEntry.id = Date.now().toString(36) + Math.random().toString(36).substring(2);
            
            // 調整日期
            if (newEntry.date) {
                const originalDate = new Date(newEntry.date);
                const newDate = new Date(originalDate);
                newDate.setDate(originalDate.getDate() + dayOffset);
                newEntry.date = newDate.toISOString().split('T')[0];
            }
            
            if (newEntry.startDate) {
                const originalStartDate = new Date(newEntry.startDate);
                const newStartDate = new Date(originalStartDate);
                newStartDate.setDate(originalStartDate.getDate() + dayOffset);
                newEntry.startDate = newStartDate.toISOString().split('T')[0];
            }
            
            if (newEntry.endDate) {
                const originalEndDate = new Date(newEntry.endDate);
                const newEndDate = new Date(originalEndDate);
                newEndDate.setDate(originalEndDate.getDate() + dayOffset);
                newEntry.endDate = newEndDate.toISOString().split('T')[0];
            }
            
            return newEntry;
        });
        
        // 檢查目標週是否已存在
        if (timesheets[targetWeekKey]) {
            const proceed = confirm(`目標週 ${targetWeekKey} 已有工時記錄，是否要覆蓋？`);
            if (!proceed) {
                return;
            }
        }
        
        // 儲存到目標週
        timesheets[targetWeekKey] = copiedEntries;
        saveAllTimesheets(timesheets);
        
        // 重新渲染卡片
        renderTimesheetCards();
        
        showSuccessMessage(`成功複製 ${sourceEntries.length} 筆工時記錄從 ${sourceWeekKey} 到 ${targetWeekKey}！`);
        
    } catch (error) {
        console.error('複製週工時失敗:', error);
        alert('複製失敗，請檢查瀏覽器控制台');
    }
}

// 更新上週按鈕顯示狀態和文字
export function updateLastWeekButtonDisplay() {
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

// 新建上週工時表
export function createLastWeekTimesheet() {
    const today = new Date();
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - today.getDay() - 6);
    
    // 生成週次格式 YYYY-Www
    const year = lastMonday.getFullYear();
    const weekNumber = getWeekNumber(lastMonday);
    const weekKey = `${year}-W${weekNumber.toString().padStart(2, '0')}`;
    
    const timesheets = loadAllTimesheets();
    if (!timesheets[weekKey]) {
        timesheets[weekKey] = [];
        saveAllTimesheets(timesheets);
    }
    
    // 載入上週工時表
    window.location.href = `edit.html?week=${encodeURIComponent(weekKey)}`;
    renderTimesheetCards();
}

// 顯示成功訊息
export function showSuccessMessage(message) {
    // 創建成功訊息元素
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 10000;
        font-size: 14px;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // 添加到頁面
    document.body.appendChild(messageDiv);
    
    // 3秒後自動移除
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 3000);
}

// 隱藏週次選擇模態框
export function hideWeekSelectionModal() {
    const modal = document.getElementById('week-selection-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}
// ==================== COMPLETE BUNDLED VERSION - NO ES6 MODULES ====================
// Version 2.4 - Complete functionality without ES6 modules for GitHub Pages

console.log('App complete bundled version 2.7 loading - Cache fixed...');

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

// ==================== UI 與卡片渲染 ====================

// 渲染工時表卡片
function renderTimesheetCards() {
    const container = document.getElementById('timesheet-cards');
    if (!container) return;
    
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
        
        // Create elements without innerHTML to avoid CSP issues
        const colorBar = document.createElement('div');
        colorBar.className = 'card-color-bar';
        
        const statusTag = document.createElement('div');
        statusTag.className = `status-tag ${isComplete ? 'status-completed' : 'status-inprogress'}`;
        statusTag.title = isComplete ? '總工時已達40小時' : '總工時未達40小時';
        statusTag.textContent = isComplete ? '✓' : '⚠';
        
        const header = document.createElement('div');
        header.className = 'card-header';
        
        const weekTitle = document.createElement('div');
        weekTitle.className = 'week-title';
        weekTitle.textContent = key;
        
        const dateRangeElement = document.createElement('div');
        dateRangeElement.className = 'date-range';
        dateRangeElement.textContent = `${startStr} 至 ${endStr}`;
        
        header.appendChild(weekTitle);
        header.appendChild(dateRangeElement);
        
        const stats = document.createElement('div');
        stats.className = 'stats';
        
        const statsData = [
            { value: entries.length, label: '記錄筆數' },
            { value: totalHours, label: '總工時' },
            { value: totalRegularHours, label: '總正常工時' },
            { value: totalOtHours, label: '總加班工時' }
        ];
        
        statsData.forEach(stat => {
            const statItem = document.createElement('div');
            statItem.className = 'stat-item';
            
            const statValue = document.createElement('div');
            statValue.className = 'stat-value';
            statValue.textContent = stat.value;
            
            const statLabel = document.createElement('div');
            statLabel.className = 'stat-label';
            statLabel.textContent = stat.label;
            
            statItem.appendChild(statValue);
            statItem.appendChild(statLabel);
            stats.appendChild(statItem);
        });
        
        const actions = document.createElement('div');
        actions.className = 'card-actions';
        
        const buttons = [
            { class: 'btn-edit', text: '修改' },
            { class: 'btn-copy', text: '複製' },
            { class: 'btn-delete', text: '刪除' },
            { class: 'btn-export', text: '匯出' }
        ];
        
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = btn.class;
            button.textContent = btn.text;
            button.setAttribute('data-week', key);
            actions.appendChild(button);
        });
        
        card.appendChild(colorBar);
        card.appendChild(statusTag);
        card.appendChild(header);
        card.appendChild(stats);
        card.appendChild(actions);
        container.appendChild(card);
    });

    // 重新綁定卡片按鈕事件
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

    // 更新上週按鈕顯示
    updateLastWeekButtonDisplay();
}

// ==================== 基本功能 ====================

// 新建工時表
function newTimesheet() {
    showWeekSelectionModal();
}

// 編輯工時表
function editTimesheet(weekKey) {
    window.location.href = `edit.html?week=${encodeURIComponent(weekKey)}`;
}

// 刪除工時表
function deleteTimesheet(weekKey) {
    if (confirm(`確定要刪除 ${weekKey} 的工時表嗎？`)) {
        const timesheets = loadAllTimesheets();
        delete timesheets[weekKey];
        saveAllTimesheets(timesheets);
        renderTimesheetCards();
        showSuccessMessage(`已刪除 ${weekKey} 的工時表`);
    }
}

// 匯出工時表
function exportTimesheet(weekKey) {
    const entries = getWeekEntries(weekKey);
    if (entries.length === 0) {
        alert('該週沒有工時記錄可以匯出');
        return;
    }
    
    const csvContent = generateCSVContent(entries);
    const filename = `timesheet_${weekKey}.csv`;
    downloadCSVFile(csvContent, filename);
}

// 顯示成功訊息
function showSuccessMessage(message) {
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
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 3000);
}

// ==================== 模態框功能 ====================

// 顯示基本資料設定模態框
function showBasicInfoModal() {
    const modal = document.getElementById('basic-info-modal');
    modal.style.display = 'block';
    
    // 載入現有資料
    const basicInfo = loadGlobalBasicInfo();
    if (basicInfo) {
        document.getElementById('modal-employeeName').value = basicInfo.employeeName || '';
        document.getElementById('modal-employeeType').value = basicInfo.employeeType || '';
    }
}

// 隱藏基本資料設定模態框
function hideBasicInfoModal() {
    const modal = document.getElementById('basic-info-modal');
    modal.style.display = 'none';
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
    showSuccessMessage('基本資料已儲存成功！');
}

// 顯示週次選擇模態框
function showWeekSelectionModal() {
    const modal = document.getElementById('week-selection-modal');
    modal.style.display = 'block';
    
    // 更新週次資訊
    const thisWeekKey = getThisWeekKey();
    const lastWeekKey = getLastWeekKey();
    const thisWeekRange = getWeekDateRangeFromKey(thisWeekKey);
    const lastWeekRange = getWeekDateRangeFromKey(lastWeekKey);
    
    document.getElementById('this-week-info').textContent = 
        `${thisWeekKey} (${thisWeekRange.start.toISOString().split('T')[0]} ~ ${thisWeekRange.end.toISOString().split('T')[0]})`;
    document.getElementById('last-week-info').textContent = 
        `${lastWeekKey} (${lastWeekRange.start.toISOString().split('T')[0]} ~ ${lastWeekRange.end.toISOString().split('T')[0]})`;
    
    // 檢查是否已存在
    const timesheets = loadAllTimesheets();
    document.getElementById('this-week-status').textContent = timesheets[thisWeekKey] ? '（已存在）' : '';
    document.getElementById('last-week-status').textContent = timesheets[lastWeekKey] ? '（已存在）' : '';
}

// 隱藏週次選擇模態框
function hideWeekSelectionModal() {
    const modal = document.getElementById('week-selection-modal');
    modal.style.display = 'none';
    document.getElementById('custom-week-input').style.display = 'none';
}

// 確認週次選擇
function confirmWeekSelection() {
    const selectedOption = document.querySelector('input[name="weekOption"]:checked');
    if (!selectedOption) {
        alert('請選擇要建立的週次');
        return;
    }
    
    let weekKey;
    if (selectedOption.value === 'this') {
        weekKey = getThisWeekKey();
    } else if (selectedOption.value === 'last') {
        weekKey = getLastWeekKey();
    } else if (selectedOption.value === 'custom') {
        weekKey = document.getElementById('custom-week-field').value.trim().toUpperCase();
        if (!weekKey) {
            alert('請輸入週次');
            return;
        }
        
        const weekKeyPattern = /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/;
        if (!weekKeyPattern.test(weekKey)) {
            alert('無效的週次格式。請使用 YYYY-WNN 格式。');
            return;
        }
    }
    
    // 檢查是否已存在
    const timesheets = loadAllTimesheets();
    if (timesheets[weekKey] && timesheets[weekKey].length > 0) {
        if (!confirm(`週次 ${weekKey} 已有工時記錄，是否繼續編輯？`)) {
            return;
        }
    } else {
        // 建立新的空工時表
        timesheets[weekKey] = [];
        saveAllTimesheets(timesheets);
    }
    
    hideWeekSelectionModal();
    editTimesheet(weekKey);
}

// ==================== 上週按鈕功能 ====================

// 更新上週按鈕顯示狀態和文字
function updateLastWeekButtonDisplay() {
    const today = new Date();
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - today.getDay() - 6);
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    
    const button = document.getElementById('btn-last-week');
    const container = document.getElementById('last-week-container');
    
    if (button && container) {
        const lastWeekKey = getLastWeekKey();
        const timesheets = loadAllTimesheets();
        
        if (timesheets[lastWeekKey]) {
            container.style.display = 'none';
        } else {
            container.style.display = 'block';
            button.textContent = `建立上週工時表 (${formatDate(lastMonday)} - ${formatDate(lastSunday)})`;
        }
    }
}

// 建立上週工時表
function createLastWeekTimesheet() {
    const lastWeekKey = getLastWeekKey();
    const timesheets = loadAllTimesheets();
    
    if (!timesheets[lastWeekKey]) {
        timesheets[lastWeekKey] = [];
        saveAllTimesheets(timesheets);
    }
    
    editTimesheet(lastWeekKey);
}

// ==================== CSV 和匯入功能 ====================

// 簡化的 CSV 解析
function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const obj = {};
        headers.forEach((h, i) => {
            obj[h] = values[i] || '';
        });
        return obj;
    });
}

// 生成CSV內容
function generateCSVContent(entries) {
    const headers = [
        'Name', 'Zone', 'Project', 'Product Module', 'Activity Type', 'Task',
        'Regular Hours', 'OT Hours', 'TTL_Hours', 'Date', 'Start Date', 'End Date',
        'Comments', 'PM', 'InternalOrOutsource'
    ];

    const basicInfo = loadGlobalBasicInfo() || {};
    
    const dataRows = entries.map(entry => [
        basicInfo.employeeName || '',
        entry.zone || '',
        entry.project || '',
        entry.productModule || '',
        entry.activityType || '',
        entry.task || '',
        entry.regularHours || 0,
        entry.otHours || 0,
        entry.ttlHours || 0,
        entry.date || '',
        entry.startDate || '',
        entry.endDate || '',
        entry.comments || '',
        entry.pm || '',
        basicInfo.employeeType || ''
    ]);

    const csvRows = [headers, ...dataRows];
    return csvRows.map(row =>
        row.map(field => {
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
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error('Download error:', err);
    }
}

// 匯入工時表
function importTimesheet() {
    const input = document.getElementById('import-file');
    input.click();
}

// ==================== 複製模態框功能 ====================

// 顯示複製選項模態框
function showCopyOptionsModal(sourceWeekKey) {
    // 簡化版本，暫時用 prompt 替代
    const targetWeek = prompt(`請輸入要複製到的週次 (例如: 2024-W25):`);
    if (targetWeek) {
        const timesheets = loadAllTimesheets();
        const sourceEntries = getWeekEntries(sourceWeekKey);
        if (sourceEntries.length > 0) {
            timesheets[targetWeek] = [...sourceEntries];
            saveAllTimesheets(timesheets);
            renderTimesheetCards();
            showSuccessMessage(`已複製到 ${targetWeek}`);
        }
    }
}

// 關閉複製模態框
function closeCopyModal() {
    // 簡化版本
}

// ==================== 全域函數設定 ====================

// 將函數設為全域可用
window.exportTimesheet = exportTimesheet;
window.closeCopyModal = closeCopyModal;
window.createLastWeekTimesheet = createLastWeekTimesheet;

// ==================== 初始化 ====================

console.log('App.js initialized and running - Version 2.7 (2025-06-23) - Cache fixed');

// 主要初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - setting up complete event listeners');
    
    // 檢查是否為首頁
    if (window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
        // 渲染卡片
        renderTimesheetCards();
        
        // 綁定主要按鈕事件
        const basicInfoBtn = document.getElementById('btn-basic-info');
        console.log('Basic info button found:', !!basicInfoBtn);
        if (basicInfoBtn) {
            console.log('Adding event listener to basic info button');
            basicInfoBtn.addEventListener('click', function() {
                console.log('Basic info button clicked!');
                showBasicInfoModal();
            });
        }
        
        const newBtn = document.getElementById('btn-new');
        console.log('New button found:', !!newBtn);
        if (newBtn) {
            console.log('Adding event listener to new button');
            newBtn.addEventListener('click', function() {
                console.log('New button clicked!');
                newTimesheet();
            });
        }
        
        const importBtn = document.getElementById('btn-import');
        console.log('Import button found:', !!importBtn);
        if (importBtn) {
            console.log('Adding event listener to import button');
            importBtn.addEventListener('click', function() {
                console.log('Import button clicked!');
                importTimesheet();
            });
        }
        
        const clearBtn = document.getElementById('btn-clear-storage');
        console.log('Clear button found:', !!clearBtn);
        if (clearBtn) {
            console.log('Adding event listener to clear button');
            clearBtn.addEventListener('click', function() {
                console.log('Clear button clicked!');
                if (confirm('確定要清空所有資料嗎？此操作無法還原。')) {
                    localStorage.clear();
                    renderTimesheetCards();
                    showSuccessMessage('資料已清空');
                }
            });
        }
        
        // 綁定基本資料模態框事件
        const saveModalBtn = document.getElementById('btn-save-modal-basic-info');
        if (saveModalBtn) {
            saveModalBtn.addEventListener('click', saveModalBasicInfo);
        }
        
        const cancelModalBtn = document.getElementById('btn-cancel-modal');
        if (cancelModalBtn) {
            cancelModalBtn.addEventListener('click', hideBasicInfoModal);
        }
        
        const closeBtn = document.querySelector('#basic-info-modal .close');
        if (closeBtn) {
            closeBtn.addEventListener('click', hideBasicInfoModal);
        }
        
        // 綁定週次選擇模態框事件
        const confirmWeekBtn = document.getElementById('btn-confirm-week');
        if (confirmWeekBtn) {
            confirmWeekBtn.addEventListener('click', confirmWeekSelection);
        }
        
        const cancelWeekBtn = document.getElementById('btn-cancel-week');
        if (cancelWeekBtn) {
            cancelWeekBtn.addEventListener('click', hideWeekSelectionModal);
        }
        
        const customRadio = document.getElementById('radio-custom');
        const customInput = document.getElementById('custom-week-input');
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
        
        // 設置上週按鈕
        const lastWeekButton = document.getElementById('btn-last-week');
        console.log('Last week button found:', !!lastWeekButton);
        if (lastWeekButton) {
            console.log('Adding event listener to last week button');
            lastWeekButton.addEventListener('click', function() {
                console.log('Last week button clicked!');
                createLastWeekTimesheet();
            });
        }
        
        // 綁定檔案輸入事件
        const fileInput = document.getElementById('import-file');
        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        try {
                            const csvData = parseCSV(e.target.result);
                            if (csvData.length > 0) {
                                // 簡化匯入：將所有資料放到當前週
                                const currentWeek = getThisWeekKey();
                                const timesheets = loadAllTimesheets();
                                timesheets[currentWeek] = csvData;
                                saveAllTimesheets(timesheets);
                                renderTimesheetCards();
                                showSuccessMessage(`已匯入 ${csvData.length} 筆資料到 ${currentWeek}`);
                            }
                        } catch (error) {
                            alert('CSV 檔案格式錯誤');
                        }
                    };
                    reader.readAsText(file);
                }
                e.target.value = '';
            });
        }
        
        console.log('✅ All event listeners set up successfully');
    }
});

console.log('✅ Complete bundled app.js loaded successfully');
// ==================== COMPLETE BUNDLED VERSION - NO ES6 MODULES ====================
// Version 2.12.1 - Complete functionality without ES6 modules for GitHub Pages


// ==================== localStorage 與資料存取 ====================

// 工時表資料
function loadAllTimesheets() {
    try {
        const data = localStorage.getItem('timesheets');
        if (!data) return {};
        // Safe JSON parsing to avoid eval
        return JSON.parse(data);
    } catch (e) {
        console.warn('Failed to parse timesheets data:', e);
        return {};
    }
}

function saveAllTimesheets(timesheets) {
    localStorage.setItem('timesheets', JSON.stringify(timesheets));
}

// 全域基本資料
function loadGlobalBasicInfo() {
    try {
        const data = localStorage.getItem('globalBasicInfo');
        if (!data) return null;
        // Safe JSON parsing to avoid eval
        return JSON.parse(data);
    } catch (e) {
        console.warn('Failed to parse basic info data:', e);
        return null;
    }
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
    return y + '-' + m + '-' + d;
}

// 取得本週的週次鍵值
function getThisWeekKey() {
    const today = new Date();
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() - today.getDay() + 1);
    const year = thisMonday.getFullYear();
    const weekNumber = getWeekNumber(thisMonday);
    return year + '-W' + weekNumber.toString().padStart(2, '0');
}

// 從日期取得週次鍵值
function getWeekKeyFromDate(date) {
    const monday = new Date(date);
    monday.setDate(date.getDate() - date.getDay() + 1);
    const year = monday.getFullYear();
    const weekNumber = getWeekNumber(monday);
    return year + '-W' + weekNumber.toString().padStart(2, '0');
}

// 檢測CSV資料的來源週次
function detectSourceWeekFromCSV(csvData) {
    const dates = csvData
        .map(entry => entry.Date)
        .filter(date => date && date.trim())
        .map(dateStr => new Date(dateStr))
        .filter(date => !isNaN(date.getTime()));
    
    if (dates.length === 0) return null;
    
    // Get the week key from the first valid date
    return getWeekKeyFromDate(dates[0]);
}

// 計算兩個週次間的日期偏移量
function getWeekOffset(sourceWeekKey, targetWeekKey) {
    const sourceRange = getWeekDateRangeFromKey(sourceWeekKey);
    const targetRange = getWeekDateRangeFromKey(targetWeekKey);
    
    // Calculate the difference in days between the Monday of each week
    const diffInMs = targetRange.start.getTime() - sourceRange.start.getTime();
    const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
    
    return diffInDays;
}

// 根據偏移量調整日期
function shiftDateByOffset(dateStr, offsetDays) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + offsetDays);
    return formatDate(date);
}

// 從CSV資料中提取基本資料
function extractBasicInfoFromCSV(csvData) {
    if (csvData.length === 0) return null;
    
    const firstEntry = csvData[0];
    console.log('Extracting basic info from first entry:', firstEntry);
    
    // Try different field name variations
    const employeeName = firstEntry.Name || firstEntry.name || firstEntry['Employee Name'] || firstEntry.employeeName || '';
    const employeeType = firstEntry.InternalOrOutsource || firstEntry.employeeType || firstEntry['Internal/Outsource'] || firstEntry['Employee Type'] || '';
    
    console.log('Extracted basic info:', { employeeName, employeeType });
    
    return {
        employeeName: employeeName.trim(),
        employeeType: employeeType.trim()
    };
}

// 顯示基本資料選擇對話框
function showBasicInfoChoiceDialog(message, localData, csvData) {
    return new Promise((resolve) => {
        // 創建對話框元素
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            width: 90%;
        `;

        dialog.innerHTML = `
            <h3 style="margin-top: 0; color: #333;">基本資料選擇</h3>
            <p style="margin-bottom: 20px; line-height: 1.5;">${message}</p>
            
            <div style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px;">
                <button id="choice-local" style="
                    padding: 15px;
                    border: 2px solid #007bff;
                    background: #f8f9fa;
                    border-radius: 5px;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.2s;
                " onmouseover="this.style.background='#e7f3ff'" onmouseout="this.style.background='#f8f9fa'">
                    <strong>使用本地資料</strong><br>
                    <span style="color: #666; font-size: 14px;">${localData}</span>
                </button>
                
                <button id="choice-csv" style="
                    padding: 15px;
                    border: 2px solid #28a745;
                    background: #f8f9fa;
                    border-radius: 5px;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.2s;
                " onmouseover="this.style.background='#e8f5e8'" onmouseout="this.style.background='#f8f9fa'">
                    <strong>使用CSV資料</strong><br>
                    <span style="color: #666; font-size: 14px;">${csvData}</span>
                </button>
            </div>
            
            <div style="text-align: right;">
                <button id="choice-cancel" style="
                    padding: 8px 16px;
                    border: 1px solid #6c757d;
                    background: #f8f9fa;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-left: 10px;
                ">取消匯入</button>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // 綁定事件
        document.getElementById('choice-local').onclick = () => {
            document.body.removeChild(overlay);
            resolve(1);
        };

        document.getElementById('choice-csv').onclick = () => {
            document.body.removeChild(overlay);
            resolve(2);
        };

        document.getElementById('choice-cancel').onclick = () => {
            document.body.removeChild(overlay);
            resolve(3);
        };

        // 點擊背景關閉
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
                resolve(3);
            }
        };
    });
}

// 顯示三選項對話框（用於匯入模式選擇）
function showThreeChoiceDialog(message, option1, option2, option3) {
    const choice = prompt(
        `${message}\n\n` +
        `請輸入選項號碼：\n` +
        `1. ${option1}\n` +
        `2. ${option2}\n` +
        `3. ${option3}\n\n` +
        `請輸入 1、2 或 3：`
    );
    
    if (choice === '1') return 1;
    if (choice === '2') return 2;
    if (choice === '3') return 3;
    return null; // 取消或無效輸入
}

// 處理基本資料匯入邏輯
async function handleBasicInfoImport(csvBasicInfo) {
    if (!csvBasicInfo || (!csvBasicInfo.employeeName && !csvBasicInfo.employeeType)) {
        return true; // No basic info in CSV, continue with import
    }
    
    const currentBasicInfo = loadGlobalBasicInfo() || {};
    const currentName = currentBasicInfo.employeeName || '';
    const currentType = currentBasicInfo.employeeType || '';
    
    const csvName = csvBasicInfo.employeeName || '';
    const csvType = csvBasicInfo.employeeType || '';
    
    // Case 1: Current basic info is empty - auto import from CSV
    if (!currentName && !currentType) {
        if (csvName || csvType) {
            const newBasicInfo = {
                employeeName: csvName || currentName,
                employeeType: csvType || currentType
            };
            saveGlobalBasicInfo(newBasicInfo);
            showSuccessMessage(`已自動匯入基本資料：${csvName || '(無姓名)'} - ${csvType || '(無類型)'}`);
        }
        return true;
    }
    
    // Case 2: Check for conflicts
    const nameConflict = csvName && currentName && csvName !== currentName;
    const typeConflict = csvType && currentType && csvType !== currentType;
    
    if (nameConflict || typeConflict) {
        const conflictMessage = '發現基本資料不一致，請選擇要使用的基本資料：';
        const localDataDisplay = `${currentName || '(空)'} - ${currentType || '(空)'}`;
        const csvDataDisplay = `${csvName || '(空)'} - ${csvType || '(空)'}`;
        
        const choice = await showBasicInfoChoiceDialog(
            conflictMessage,
            localDataDisplay,
            csvDataDisplay
        );
        
        if (choice === 1) {
            // 使用本地資料
            showSuccessMessage(`繼續使用本地基本資料：${currentName || '(無姓名)'} - ${currentType || '(無類型)'}`);
            return true;
        } else if (choice === 2) {
            // 使用CSV資料
            const newBasicInfo = {
                employeeName: csvName || currentName,
                employeeType: csvType || currentType
            };
            saveGlobalBasicInfo(newBasicInfo);
            showSuccessMessage(`已更新為CSV基本資料：${csvName || '(無姓名)'} - ${csvType || '(無類型)'}`);
            return true;
        } else {
            // 取消匯入
            return false;
        }
    }
    
    // Case 3: No conflicts or CSV has empty fields - fill in missing data
    if (csvName && !currentName) {
        currentBasicInfo.employeeName = csvName;
        saveGlobalBasicInfo(currentBasicInfo);
        showSuccessMessage(`已補充員工姓名：${csvName}`);
    }
    if (csvType && !currentType) {
        currentBasicInfo.employeeType = csvType;
        saveGlobalBasicInfo(currentBasicInfo);
        showSuccessMessage(`已補充員工類型：${csvType}`);
    }
    
    return true;
}

// 取得上週的週次鍵值
function getLastWeekKey() {
    const today = new Date();
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - today.getDay() - 6);
    const year = lastMonday.getFullYear();
    const weekNumber = getWeekNumber(lastMonday);
    return year + '-W' + weekNumber.toString().padStart(2, '0');
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
        const totalHours = entries.reduce((sum, entry) => {
            const hours = entry.ttlHours || entry.TTL_Hours || entry['TTL_Hours'] || 0;
            return sum + (parseFloat(hours) || 0);
        }, 0);
        const totalRegularHours = entries.reduce((sum, entry) => {
            const hours = entry.regularHours || entry['Regular Hours'] || 0;
            return sum + (parseFloat(hours) || 0);
        }, 0);
        const totalOtHours = entries.reduce((sum, entry) => {
            const hours = entry.otHours || entry['OT Hours'] || 0;
            return sum + (parseFloat(hours) || 0);
        }, 0);
        const isComplete = totalHours >= 40;
        const card = document.createElement('div');
        card.className = 'timesheet-card';
        
        // Create elements without innerHTML to avoid CSP issues
        const colorBar = document.createElement('div');
        colorBar.className = 'card-color-bar';
        
        const statusTag = document.createElement('div');
        statusTag.className = 'status-tag ' + (isComplete ? 'status-completed' : 'status-inprogress');
        statusTag.title = isComplete ? '總工時已達40小時' : '總工時未達40小時';
        statusTag.textContent = isComplete ? '✓' : '⚠';
        
        const header = document.createElement('div');
        header.className = 'card-header';
        
        const weekTitle = document.createElement('div');
        weekTitle.className = 'week-title';
        weekTitle.textContent = key;
        
        const dateRangeElement = document.createElement('div');
        dateRangeElement.className = 'date-range';
        dateRangeElement.textContent = startStr + ' 至 ' + endStr;
        
        header.appendChild(weekTitle);
        header.appendChild(dateRangeElement);
        
        const stats = document.createElement('div');
        stats.className = 'stats';
        
        const statsData = [
            { value: entries.length, label: '記錄筆數' },
            { value: Math.round(totalHours * 10) / 10, label: '總工時' },
            { value: Math.round(totalRegularHours * 10) / 10, label: '總正常工時' },
            { value: Math.round(totalOtHours * 10) / 10, label: '總加班工時' }
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
    window.location.href = 'edit.html?week=' + encodeURIComponent(weekKey);
}

// 刪除工時表
function deleteTimesheet(weekKey) {
    if (confirm('確定要刪除 ' + weekKey + ' 的工時表嗎？')) {
        const timesheets = loadAllTimesheets();
        delete timesheets[weekKey];
        saveAllTimesheets(timesheets);
        renderTimesheetCards();
        showSuccessMessage('已刪除 ' + weekKey + ' 的工時表');
    }
}

// 匯出工時表
async function exportTimesheet(weekKey) {
    const entries = getWeekEntries(weekKey);
    if (entries.length === 0) {
        alert('該週沒有工時記錄可以匯出');
        return;
    }
    
    // 檢查是否需要正規化
    const totalRegularHours = entries.reduce((sum, entry) => {
        const hours = parseFloat(entry.regularHours) || 0;
        return sum + hours;
    }, 0);
    
    let shouldNormalize = false;
    
    if (totalRegularHours > 40) {
        const message = `此週正常工時總計 ${totalRegularHours} 小時，超過40小時。\n\n` +
                       `是否要進行正規化處理？\n` +
                       `• 確定：將正常工時調整為40小時，超出部分轉為加班工時\n` +
                       `• 取消：按原始工時匯出`;
        
        shouldNormalize = confirm(message);
    }
    
    const csvContent = generateCSVContent(entries, shouldNormalize);
    const filename = 'timesheet_' + weekKey + '.csv';
    downloadCSVFile(csvContent, filename);
    
    // 顯示匯出結果訊息
    if (totalRegularHours > 40) {
        if (shouldNormalize) {
            showSuccessMessage(`已匯出並正規化 ${weekKey} 工時表（正常工時調整為40小時）`);
        } else {
            showSuccessMessage(`已匯出 ${weekKey} 工時表（按原始工時：${totalRegularHours}小時）`);
        }
    } else {
        showSuccessMessage(`已匯出 ${weekKey} 工時表`);
    }
}

// 顯示成功訊息
function showSuccessMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.right = '20px';
    messageDiv.style.background = '#4CAF50';
    messageDiv.style.color = 'white';
    messageDiv.style.padding = '15px 20px';
    messageDiv.style.borderRadius = '5px';
    messageDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    messageDiv.style.zIndex = '10000';
    messageDiv.style.fontSize = '14px';
    messageDiv.style.maxWidth = '300px';
    messageDiv.style.wordWrap = 'break-word';
    
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
    
    // Reset modal state
    modal.removeAttribute('data-mode');
    const modalTitle = modal.querySelector('h3');
    if (modalTitle) {
        modalTitle.textContent = '選擇要建立的週次';
    }
    
    // Clear any radio button selections
    const radioButtons = modal.querySelectorAll('input[name="weekOption"]');
    radioButtons.forEach(radio => radio.checked = false);
    
    // Clear custom week input
    const customWeekField = document.getElementById('custom-week-field');
    if (customWeekField) {
        customWeekField.value = '';
    }
}

// 確認週次選擇
function confirmWeekSelection() {
    const modal = document.getElementById('week-selection-modal');
    const isImportMode = modal.getAttribute('data-mode') === 'import';
    
    const selectedOption = document.querySelector('input[name="weekOption"]:checked');
    if (!selectedOption) {
        alert(isImportMode ? '請選擇匯入目標週次' : '請選擇要建立的週次');
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
    
    hideWeekSelectionModal();
    
    if (isImportMode) {
        // Store target week and trigger file picker
        window.importTargetWeek = weekKey;
        const input = document.getElementById('import-file');
        input.click();
    } else {
        // Original new timesheet logic
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
        editTimesheet(weekKey);
    }
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
    console.log('Raw CSV text length:', text.length);
    console.log('First 200 chars:', text.substring(0, 200));
    
    // Remove BOM if present
    text = text.replace(/^\uFEFF/, '');
    console.log('After BOM removal, first 200 chars:', text.substring(0, 200));
    
    const lines = text.trim().split(/\r?\n/);
    console.log('Total lines:', lines.length);
    
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    console.log('Headers found:', headers);
    
    return lines.slice(1).map((line, index) => {
        console.log(`Processing line ${index + 1}:`, line);
        
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        console.log('Values extracted:', values);
        
        const obj = {};
        headers.forEach((h, i) => {
            obj[h] = values[i] || '';
        });
        
        console.log('Initial object after header mapping:', obj);
        
        // Convert date format from YYYY/M/D to YYYY-MM-DD
        if (obj.Date && obj.Date.includes('/')) {
            const parts = obj.Date.split('/');
            if (parts.length === 3) {
                const year = parts[0];
                const month = parts[1].padStart(2, '0');
                const day = parts[2].padStart(2, '0');
                const newDate = `${year}-${month}-${day}`;
                console.log(`Date conversion: ${obj.Date} -> ${newDate}`);
                obj.Date = newDate;
                obj.date = newDate; // Also set the internal field
            }
        }
        
        // Normalize field names for internal use
        const fieldMapping = {
            'Regular Hours': 'regularHours',
            'OT Hours': 'otHours',
            'TTL_Hours': 'ttlHours',
            'Zone': 'zone',
            'Project': 'project',
            'Product Module': 'productModule',
            'Activity Type': 'activityType',
            'Task': 'task',
            'Date': 'date',
            'Start Date': 'startDate',
            'End Date': 'endDate',
            'Comments': 'comments',
            'PM': 'pm',
            'Name': 'name',
            'InternalOrOutsource': 'employeeType'
        };
        
        console.log('Applying field mappings...');
        // Apply field mappings
        Object.keys(fieldMapping).forEach(csvField => {
            if (obj[csvField] !== undefined) {
                const internalField = fieldMapping[csvField];
                const originalValue = obj[csvField];
                
                if (csvField.includes('Hours')) {
                    obj[internalField] = parseFloat(originalValue) || 0;
                } else {
                    // For non-hour fields, preserve the value
                    obj[internalField] = originalValue;
                }
                
                console.log(`Field mapping: ${csvField} (${originalValue}) -> ${internalField} (${obj[internalField]})`);
            } else {
                console.log(`Field ${csvField} not found in CSV data`);
            }
        });
        
        console.log('Final parsed object:', obj);
        return obj;
    });
}

// 生成CSV內容
function generateCSVContent(entries, shouldNormalize = false) {
    const headers = [
        'Name', 'Zone', 'Project', 'Product Module', 'Activity Type', 'Task',
        'Regular Hours', 'OT Hours', 'TTL_Hours', 'Date', 'Start Date', 'End Date',
        'Comments', 'PM', 'InternalOrOutsource'
    ];

    const basicInfo = loadGlobalBasicInfo() || {};
    
    // 只有在用戶選擇時才進行正規化
    const finalEntries = shouldNormalize ? normalizeWorkHours(entries) : entries;
    
    const dataRows = finalEntries.map(entry => [
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

// 正規化工時：如果正常工時超過40小時，按比例分攤到各項目
function normalizeWorkHours(entries) {
    // 計算總正常工時
    const totalRegularHours = entries.reduce((sum, entry) => {
        const hours = parseFloat(entry.regularHours) || 0;
        return sum + hours;
    }, 0);
    
    console.log(`Total regular hours before normalization: ${totalRegularHours}`);
    
    // 如果總正常工時不超過40小時，不需要正規化
    if (totalRegularHours <= 40) {
        console.log('No normalization needed (≤40 hours)');
        return entries.map(entry => ({ ...entry })); // 回傳複本
    }
    
    // 需要正規化：按比例分攤
    console.log('Normalizing work hours (>40 hours)');
    const normalizationRatio = 40 / totalRegularHours;
    const excessHours = totalRegularHours - 40;
    
    const normalizedEntries = entries.map(entry => {
        const originalRegularHours = parseFloat(entry.regularHours) || 0;
        const originalOtHours = parseFloat(entry.otHours) || 0;
        
        if (originalRegularHours === 0) {
            // 如果原本正常工時為0，不需要調整
            return { ...entry };
        }
        
        // 計算正規化後的正常工時
        const normalizedRegularHours = Math.round((originalRegularHours * normalizationRatio) * 100) / 100;
        
        // 計算需要轉為加班的工時
        const hoursBecomeOT = originalRegularHours - normalizedRegularHours;
        
        // 更新加班工時
        const newOtHours = originalOtHours + hoursBecomeOT;
        const newTotalHours = normalizedRegularHours + newOtHours;
        
        console.log(`Entry normalization: ${originalRegularHours}h regular -> ${normalizedRegularHours}h regular + ${hoursBecomeOT}h to OT`);
        
        return {
            ...entry,
            regularHours: normalizedRegularHours,
            otHours: Math.round(newOtHours * 100) / 100,
            ttlHours: Math.round(newTotalHours * 100) / 100,
            originalHours: originalRegularHours // 保存原始工時供參考
        };
    });
    
    // 檢查正規化後的總計，如果不到40小時，將差額加到最後一筆有正常工時的記錄
    const normalizedTotal = normalizedEntries.reduce((sum, entry) => sum + (parseFloat(entry.regularHours) || 0), 0);
    const roundedTotal = Math.round(normalizedTotal * 100) / 100;
    
    if (roundedTotal < 40) {
        const difference = Math.round((40 - roundedTotal) * 100) / 100;
        console.log(`Normalization shortfall: ${difference} hours, adding to last entry`);
        
        // 找到最後一筆有正常工時的記錄
        for (let i = normalizedEntries.length - 1; i >= 0; i--) {
            if (parseFloat(normalizedEntries[i].regularHours) > 0) {
                const currentRegular = parseFloat(normalizedEntries[i].regularHours);
                const currentOT = parseFloat(normalizedEntries[i].otHours);
                const adjustedRegular = Math.round((currentRegular + difference) * 100) / 100;
                const adjustedOT = Math.round((currentOT - difference) * 100) / 100;
                
                normalizedEntries[i].regularHours = adjustedRegular;
                normalizedEntries[i].otHours = adjustedOT;
                normalizedEntries[i].ttlHours = Math.round((adjustedRegular + adjustedOT) * 100) / 100;
                
                console.log(`Adjusted last entry: +${difference}h regular, -${difference}h OT`);
                break;
            }
        }
    }
    
    // 驗證最終結果
    const finalTotal = normalizedEntries.reduce((sum, entry) => sum + (parseFloat(entry.regularHours) || 0), 0);
    console.log(`Final total regular hours: ${Math.round(finalTotal * 100) / 100} (target: 40)`);
    
    return normalizedEntries;
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
    // Show week selection modal for import
    showImportWeekSelectionModal();
}

// 顯示匯入週次選擇模態框
function showImportWeekSelectionModal() {
    const modal = document.getElementById('week-selection-modal');
    modal.style.display = 'block';
    
    // Update modal title for import
    const modalTitle = modal.querySelector('h3');
    if (modalTitle) {
        modalTitle.textContent = '選擇匯入目標週次';
    }
    
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
    
    // Mark as import mode
    modal.setAttribute('data-mode', 'import');
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

// ==================== CSV 載入功能 ====================

// CSV 載入函數（用於編輯頁面的下拉選單）
async function fetchCSV(path) {
    try {
        const res = await fetch(path);
        const text = await res.text();
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        return lines.slice(1).map(line => {
            const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
            const obj = {};
            headers.forEach((h, i) => obj[h] = cols[i] || '');
            return obj;
        });
    } catch (error) {
        console.error('Error fetching CSV:', path, error);
        return [];
    }
}

// 初始化項目和產品選單
async function initProjectAndProductSelect(projectValue, productValue) {
    console.log('initProjectAndProductSelect called with:', projectValue, productValue);
    
    const selectedZone = document.getElementById('zone')?.value;
    console.log('Selected zone:', selectedZone);
    
    // 專案名稱（根據Zone過濾）
    let projectList = [];
    if (selectedZone) {
        const allProjects = await fetchCSV('projectcode.csv');
        console.log('All projects loaded:', allProjects.length);
        projectList = allProjects.filter(p => p.Zone === selectedZone);
        console.log('Filtered projects for zone', selectedZone, ':', projectList);
    } else {
        projectList = await fetchCSV('projectcode.csv');
    }
    
    const projectSelect = document.getElementById('project');
    if (projectSelect) {
        if (selectedZone) {
            projectSelect.innerHTML = '<option value="">請選擇專案</option>' +
                projectList.map(p => `<option value="${p.Project}">${p.Project}</option>`).join('');
            projectSelect.disabled = false;
        } else {
            projectSelect.innerHTML = '<option value="">點擊選擇區域</option>';
            projectSelect.disabled = true;
        }
        if (projectValue && projectList.some(p => p.Project === projectValue)) {
            projectSelect.value = projectValue;
        }
    }
    
    // 產品模組（根據Zone過濾）
    let productList = [];
    if (selectedZone) {
        const allProducts = await fetchCSV('productcode.csv');
        console.log('All products loaded:', allProducts.length);
        productList = allProducts.filter(p => p.Zone === selectedZone);
        console.log('Filtered products for zone', selectedZone, ':', productList);
    } else {
        productList = await fetchCSV('productcode.csv');
    }
    
    const productSelect = document.getElementById('productModule');
    if (productSelect) {
        if (selectedZone) {
            productSelect.innerHTML = '<option value="">請選擇產品模組</option>' +
                productList.map(p => `<option value="${p['Product Module']}">${p['Product Module']}</option>`).join('');
            productSelect.disabled = false;
        } else {
            productSelect.innerHTML = '<option value="">點擊選擇區域</option>';
            productSelect.disabled = true;
        }
        if (productValue && productList.some(p => p['Product Module'] === productValue)) {
            productSelect.value = productValue;
        }
    }
    
    // 更新PM欄位
    updatePMField();
}

// 更新PM欄位函數
async function updatePMField() {
    const selectedProject = document.getElementById('project')?.value;
    const pmField = document.getElementById('pm');
    
    console.log('updatePMField called, selectedProject:', selectedProject);
    
    if (selectedProject && pmField) {
        const projectList = await fetchCSV('projectcode.csv');
        const project = projectList.find(p => p.Project === selectedProject);
        console.log('Found project:', project);
        if (project && project.PM) {
            pmField.value = project.PM;
            console.log('PM field updated to:', project.PM);
        } else {
            pmField.value = '';
            console.log('PM field cleared (no PM found)');
        }
    }
}

// ==================== 編輯頁面功能 ====================

// 編輯單個記錄
function editEntry(entryId) {
    const params = new URLSearchParams(window.location.search);
    const weekKey = params.get('week');
    if (!weekKey) return;
    
    const timesheets = loadAllTimesheets();
    const entries = timesheets[weekKey] || [];
    const entry = entries.find(e => e.id == entryId);
    
    if (entry) {
        fillForm(entry);
        document.getElementById('entryId').value = entryId;
        
        // 自動聚焦到第一個輸入欄位（任務描述）並捲動畫面
        setTimeout(() => {
            const firstInput = document.getElementById('task');
            if (firstInput) {
                // 先捲動到任務輸入框位置
                firstInput.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
                
                // 然後聚焦和選取文字
                setTimeout(() => {
                    firstInput.focus();
                    firstInput.select(); // 選取所有文字，方便用戶修改
                    console.log('Auto-focused and scrolled to task field for editing');
                }, 300);
            }
        }, 100);
    }
}

// 複製單個記錄
function copyEntry(entryId) {
    const params = new URLSearchParams(window.location.search);
    const weekKey = params.get('week');
    if (!weekKey) return;
    
    const timesheets = loadAllTimesheets();
    const entries = timesheets[weekKey] || [];
    const entry = entries.find(e => e.id == entryId);
    
    if (entry) {
        const newEntry = { ...entry };
        delete newEntry.id; // Remove ID so it gets a new one
        
        // 智能日期調整：週一到週四加一天，週五到週日保持原日期
        if (newEntry.date || newEntry.Date) {
            const currentDate = new Date(newEntry.date || newEntry.Date);
            if (!isNaN(currentDate.getTime())) {
                const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
                
                // 只有週一(1)到週四(4)才加一天，避免跳到需要核準的週六日
                if (dayOfWeek >= 1 && dayOfWeek <= 4) {
                    const nextDate = new Date(currentDate);
                    nextDate.setDate(currentDate.getDate() + 1);
                    
                    // 檢查加一天後是否仍在同一週內
                    const currentWeekKey = getWeekKeyFromDate(currentDate);
                    const nextWeekKey = getWeekKeyFromDate(nextDate);
                    
                    if (currentWeekKey === nextWeekKey) {
                        // 仍在同一週內，可以加一天
                        const newDateStr = formatDate(nextDate);
                        
                        // 更新兩個可能的日期欄位
                        if (newEntry.date) newEntry.date = newDateStr;
                        if (newEntry.Date) newEntry.Date = newDateStr;
                        
                        const dayNames = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
                        console.log(`Date adjusted for copy: ${formatDate(currentDate)}(${dayNames[dayOfWeek]}) -> ${newDateStr}(${dayNames[nextDate.getDay()]})`);
                    } else {
                        // 加一天會跨週，保持原日期
                        console.log(`Date kept same (would cross week): ${formatDate(currentDate)}`);
                    }
                } else {
                    const dayNames = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
                    console.log(`Date kept same (${dayNames[dayOfWeek]} - avoid weekend): ${formatDate(currentDate)}`);
                }
            }
        }
        
        fillForm(newEntry);
        document.getElementById('entryId').value = ''; // Clear ID for new entry
        
        // 自動聚焦到第一個輸入欄位（任務描述）並捲動畫面
        setTimeout(() => {
            const firstInput = document.getElementById('task');
            if (firstInput) {
                // 先捲動到任務輸入框位置
                firstInput.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
                
                // 然後聚焦和選取文字
                setTimeout(() => {
                    firstInput.focus();
                    firstInput.select(); // 選取所有文字，方便用戶修改
                    console.log('Auto-focused and scrolled to task field for copying');
                }, 300);
            }
        }, 100);
    }
}

// 刪除單個記錄
function deleteEntry(entryId) {
    console.log('deleteEntry called with entryId:', entryId);
    
    if (confirm('確定要刪除這筆記錄嗎？')) {
        const params = new URLSearchParams(window.location.search);
        const weekKey = params.get('week');
        console.log('weekKey:', weekKey);
        
        if (!weekKey) {
            console.error('No weekKey found');
            return;
        }
        
        const timesheets = loadAllTimesheets();
        const entries = timesheets[weekKey] || [];
        console.log('Before delete - entries count:', entries.length);
        console.log('Looking for entryId:', entryId, 'Type:', typeof entryId);
        
        // Use strict comparison and handle both string and number IDs
        const updatedEntries = entries.filter(e => {
            console.log('Entry ID:', e.id, 'Type:', typeof e.id, 'Match:', e.id === entryId || e.id == entryId);
            return e.id !== entryId && e.id != entryId;
        });
        
        console.log('After delete - entries count:', updatedEntries.length);
        
        timesheets[weekKey] = updatedEntries;
        saveAllTimesheets(timesheets);
        
        // Re-render the table
        renderEntriesTable();
        showSuccessMessage('記錄已刪除');
    }
}

// 填充表單
function fillForm(entry) {
    if (!entry) return;
    
    const fields = ['task', 'activityType', 'zone', 'project', 'productModule', 'pm', 
                   'regularHours', 'otHours', 'ttlHours', 'date', 'startDate', 'endDate', 'comments'];
    
    fields.forEach(field => {
        const element = document.getElementById(field);
        if (element && entry[field] !== undefined) {
            element.value = entry[field];
        }
    });
    
    // 触发Zone变更以更新项目和产品选单
    if (entry.zone && window.initProjectAndProductSelect) {
        setTimeout(() => {
            window.initProjectAndProductSelect(entry.project, entry.productModule);
        }, 100);
    }
}

// 保存記錄
function saveEntry() {
    console.log('saveEntry called');
    
    const params = new URLSearchParams(window.location.search);
    const weekKey = params.get('week');
    if (!weekKey) {
        alert('無法取得週次資訊');
        return;
    }
    
    // 取得表單資料
    const formData = getFormData();
    if (!formData) {
        return; // 驗證失敗
    }
    
    const timesheets = loadAllTimesheets();
    const entries = timesheets[weekKey] || [];
    const entryId = document.getElementById('entryId').value;
    
    if (entryId) {
        // 編輯現有記錄
        const index = entries.findIndex(e => e.id == entryId);
        if (index !== -1) {
            entries[index] = { ...formData, id: entryId };
            console.log('Updated existing entry:', entries[index]);
        }
    } else {
        // 新增記錄
        const newEntry = { ...formData, id: Date.now().toString() };
        entries.push(newEntry);
        console.log('Added new entry:', newEntry);
    }
    
    timesheets[weekKey] = entries;
    saveAllTimesheets(timesheets);
    
    // 重新渲染表格
    renderEntriesTable();
    
    // 清空表單
    clearForm();
    
    showSuccessMessage('記錄已儲存');
}

// 取得表單資料
function getFormData() {
    const form = document.getElementById('timesheet-form');
    if (!form) return null;
    
    // 基本驗證
    const requiredFields = ['task', 'activityType', 'zone', 'project', 'productModule', 'regularHours', 'date'];
    for (const field of requiredFields) {
        const element = document.getElementById(field);
        if (!element || !element.value.trim()) {
            alert(`請填寫 ${element?.labels[0]?.textContent || field}`);
            element?.focus();
            return null;
        }
    }
    
    // 收集數據
    const regularHours = parseFloat(document.getElementById('regularHours').value) || 0;
    const otHours = parseFloat(document.getElementById('otHours').value) || 0;
    const ttlHours = regularHours + otHours;
    
    // 更新總工時顯示
    const ttlElement = document.getElementById('ttlHours');
    if (ttlElement) {
        ttlElement.value = ttlHours;
    }
    
    return {
        task: document.getElementById('task').value.trim(),
        activityType: document.getElementById('activityType').value,
        zone: document.getElementById('zone').value,
        project: document.getElementById('project').value,
        productModule: document.getElementById('productModule').value,
        pm: document.getElementById('pm').value.trim(),
        regularHours: regularHours,
        otHours: otHours,
        ttlHours: ttlHours,
        date: document.getElementById('date').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        comments: document.getElementById('comments').value.trim()
    };
}

// 清空表單
function clearForm() {
    const form = document.getElementById('timesheet-form');
    if (form) {
        form.reset();
        document.getElementById('entryId').value = '';
        
        // 重置下拉選單
        const projectSelect = document.getElementById('project');
        const productSelect = document.getElementById('productModule');
        if (projectSelect) {
            projectSelect.innerHTML = '<option value="">點擊選擇區域</option>';
            projectSelect.disabled = true;
        }
        if (productSelect) {
            productSelect.innerHTML = '<option value="">點擊選擇區域</option>';
            productSelect.disabled = true;
        }
    }
}

// 載入基本資料到編輯頁面表單
function loadBasicInfoToEditForm() {
    const basicInfo = loadGlobalBasicInfo();
    console.log('Loading basic info to edit form:', basicInfo);
    
    const employeeNameInput = document.getElementById('employeeName');
    const employeeTypeSelect = document.getElementById('employeeType');
    
    if (basicInfo) {
        if (employeeNameInput) {
            employeeNameInput.value = basicInfo.employeeName || '';
        }
        if (employeeTypeSelect) {
            employeeTypeSelect.value = basicInfo.employeeType || '';
        }
        console.log('Basic info loaded to edit form');
    } else {
        console.log('No basic info found');
        if (employeeNameInput) employeeNameInput.value = '';
        if (employeeTypeSelect) employeeTypeSelect.value = '';
    }
}

// 從編輯頁面表單保存基本資料
function saveBasicInfoFromEditForm() {
    const employeeNameInput = document.getElementById('employeeName');
    const employeeTypeSelect = document.getElementById('employeeType');
    
    if (!employeeNameInput || !employeeTypeSelect) {
        alert('找不到基本資料表單欄位');
        return;
    }
    
    const employeeName = employeeNameInput.value.trim();
    const employeeType = employeeTypeSelect.value;
    
    if (!employeeName || !employeeType) {
        alert('請填寫完整的基本資料');
        return;
    }
    
    const basicInfo = {
        employeeName: employeeName,
        employeeType: employeeType
    };
    
    saveGlobalBasicInfo(basicInfo);
    console.log('Basic info saved from edit form:', basicInfo);
    showSuccessMessage('基本資料已儲存');
}

// 渲染記錄表格
function renderEntriesTable() {
    const params = new URLSearchParams(window.location.search);
    const weekKey = params.get('week');
    if (!weekKey) return;
    
    const timesheets = loadAllTimesheets();
    const entries = timesheets[weekKey] || [];
    const tbody = document.getElementById('entries-tbody');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    entries.forEach(entry => {
        console.log('Rendering entry:', entry); // Debug log
        
        const row = document.createElement('tr');
        
        // Use multiple field name variants to ensure compatibility
        const dateValue = entry.date || entry.Date || '';
        const zoneValue = entry.zone || entry.Zone || '';
        const activityValue = entry.activityType || entry['Activity Type'] || '';
        const taskValue = entry.task || entry.Task || '';
        const regularValue = entry.regularHours || entry['Regular Hours'] || 0;
        const otValue = entry.otHours || entry['OT Hours'] || 0;
        const ttlValue = entry.ttlHours || entry.TTL_Hours || entry['TTL_Hours'] || 0;
        
        row.innerHTML = `
            <td>${dateValue}</td>
            <td>${zoneValue}</td>
            <td>${activityValue}</td>
            <td>${taskValue}</td>
            <td>${regularValue}</td>
            <td>${otValue}</td>
            <td>${ttlValue}</td>
            <td class="actions">
                <button class="btn-edit-entry" data-entry-id="${entry.id}">修改</button>
                <button class="btn-copy-entry" data-entry-id="${entry.id}">複製</button>
                <button class="btn-delete-entry" data-entry-id="${entry.id}">刪除</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Update summary
    const totalEntries = entries.length;
    const totalHours = entries.reduce((sum, entry) => {
        const hours = entry.ttlHours || entry.TTL_Hours || entry['TTL_Hours'] || 0;
        return sum + (parseFloat(hours) || 0);
    }, 0);
    
    const totalEntriesElement = document.getElementById('total-entries');
    const totalHoursElement = document.getElementById('total-hours');
    
    if (totalEntriesElement) totalEntriesElement.textContent = totalEntries;
    if (totalHoursElement) totalHoursElement.textContent = Math.round(totalHours * 10) / 10;
    
    // Add event delegation for action buttons
    setupTableEventDelegation();
}

// 設置表格事件委托
function setupTableEventDelegation() {
    const tbody = document.getElementById('entries-tbody');
    if (!tbody) return;
    
    // Remove existing listeners to avoid duplicates
    tbody.removeEventListener('click', handleTableButtonClick);
    
    // Add event delegation
    tbody.addEventListener('click', handleTableButtonClick);
}

// 處理表格按鈕點擊事件
function handleTableButtonClick(event) {
    const target = event.target;
    console.log('Table button click detected:', target);
    
    if (!target.matches('button')) {
        console.log('Not a button, ignoring');
        return;
    }
    
    const entryId = target.getAttribute('data-entry-id');
    console.log('Button clicked - Class:', target.className, 'entryId:', entryId);
    
    if (!entryId) {
        console.error('No entryId found on button');
        return;
    }
    
    if (target.classList.contains('btn-edit-entry')) {
        console.log('Calling editEntry');
        editEntry(entryId);
    } else if (target.classList.contains('btn-copy-entry')) {
        console.log('Calling copyEntry');
        copyEntry(entryId);
    } else if (target.classList.contains('btn-delete-entry')) {
        console.log('Calling deleteEntry');
        deleteEntry(entryId);
    } else {
        console.log('Unknown button type');
    }
}

// ==================== 全域函數設定 ====================

// 將函數設為全域可用
window.exportTimesheet = exportTimesheet;
window.closeCopyModal = closeCopyModal;
window.createLastWeekTimesheet = createLastWeekTimesheet;
window.editEntry = editEntry;
window.copyEntry = copyEntry;
window.deleteEntry = deleteEntry;
window.renderEntriesTable = renderEntriesTable;
window.setupTableEventDelegation = setupTableEventDelegation;
window.handleTableButtonClick = handleTableButtonClick;
window.fetchCSV = fetchCSV;
window.initProjectAndProductSelect = initProjectAndProductSelect;
window.updatePMField = updatePMField;

// ==================== 初始化 ====================

console.log('App.js initialized and running - Version 2.12.1 (2025-06-23) - Path fixed');

// 主要初始化
document.addEventListener('DOMContentLoaded', function() {
    
    // 檢查是否為編輯頁面
    if (window.location.pathname.includes('edit.html')) {
        // 編輯頁面初始化
        console.log('Edit page detected, initializing...');
        if (typeof renderEntriesTable === 'function') {
            renderEntriesTable();
        }
        
        // 載入基本資料到編輯頁面表單
        loadBasicInfoToEditForm();
        
        // 添加編輯頁面事件支持
        setTimeout(() => {
            // 返回列表按鈕事件
            const backBtn = document.getElementById('btn-back');
            if (backBtn) {
                console.log('Back button found, adding event listener');
                backBtn.addEventListener('click', function() {
                    console.log('Back button clicked - returning to main page');
                    // 返回到主頁面
                    window.location.href = 'index.html';
                });
            } else {
                console.log('Back button not found');
            }
            
            // Zone變更事件
            const zoneSelect = document.getElementById('zone');
            if (zoneSelect) {
                console.log('Zone select found, adding event listener');
                zoneSelect.addEventListener('change', function() {
                    console.log('Zone changed to:', this.value);
                    // 触发项目和产品选单更新
                    if (window.initProjectAndProductSelect) {
                        console.log('Calling initProjectAndProductSelect after zone change');
                        window.initProjectAndProductSelect();
                    } else if (typeof handleZoneChange === 'function') {
                        console.log('Calling handleZoneChange');
                        handleZoneChange();
                    } else {
                        console.log('No zone change handler found');
                    }
                });
            } else {
                console.log('Zone select not found');
            }
            
            // 項目變更事件
            const projectSelect = document.getElementById('project');
            if (projectSelect) {
                console.log('Project select found, adding event listener');
                projectSelect.addEventListener('change', function() {
                    console.log('Project changed to:', this.value);
                    if (window.updatePMField) {
                        window.updatePMField();
                    }
                });
            }
            
            // 工時計算事件
            const regularHoursInput = document.getElementById('regularHours');
            const otHoursInput = document.getElementById('otHours');
            const ttlHoursInput = document.getElementById('ttlHours');
            
            function calculateTotalHours() {
                const regular = parseFloat(regularHoursInput?.value) || 0;
                const ot = parseFloat(otHoursInput?.value) || 0;
                const total = regular + ot;
                if (ttlHoursInput) {
                    ttlHoursInput.value = total;
                }
            }
            
            if (regularHoursInput) {
                regularHoursInput.addEventListener('input', calculateTotalHours);
            }
            if (otHoursInput) {
                otHoursInput.addEventListener('input', calculateTotalHours);
            }
            
            // 保存按鈕事件
            const saveBtn = document.getElementById('btn-save-entry');
            if (saveBtn) {
                console.log('Save button found, adding event listener');
                saveBtn.addEventListener('click', function() {
                    console.log('Save button clicked');
                    saveEntry();
                });
            } else {
                console.log('Save button not found');
            }
            
            // 清空表單按鈕事件
            const clearBtn = document.getElementById('btn-clear-form');
            if (clearBtn) {
                console.log('Clear form button found, adding event listener');
                clearBtn.addEventListener('click', function() {
                    console.log('Clear form button clicked');
                    clearForm();
                });
            }
            
            // 取消按鈕事件
            const cancelBtn = document.getElementById('btn-cancel-entry');
            if (cancelBtn) {
                console.log('Cancel button found, adding event listener');
                cancelBtn.addEventListener('click', function() {
                    console.log('Cancel button clicked');
                    clearForm();
                });
            }
            
            // 編輯頁面基本資料保存按鈕事件
            const basicInfoSaveBtn = document.getElementById('btn-save-basic-info');
            if (basicInfoSaveBtn) {
                console.log('Edit page basic info save button found, adding event listener');
                basicInfoSaveBtn.addEventListener('click', function() {
                    console.log('Edit page basic info save button clicked');
                    saveBasicInfoFromEditForm();
                });
            }
        }, 500);
        
        return;
    }
    
    // 檢查是否為首頁
    console.log('Current pathname:', window.location.pathname);
    console.log('Is homepage check:', window.location.pathname === '/' || window.location.pathname.includes('index.html') || window.location.pathname.includes('timesheet'));
    if (window.location.pathname === '/' || window.location.pathname.includes('index.html') || window.location.pathname.includes('timesheet')) {
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
                    reader.onload = async function(e) {
                        try {
                            const csvData = parseCSV(e.target.result);
                            if (csvData.length > 0) {
                                // Handle basic info from CSV
                                const csvBasicInfo = extractBasicInfoFromCSV(csvData);
                                const shouldContinue = await handleBasicInfoImport(csvBasicInfo);
                                if (!shouldContinue) {
                                    return; // User cancelled import
                                }
                                
                                // Use selected target week or default to last week
                                const targetWeekKey = window.importTargetWeek || getLastWeekKey();
                                const sourceWeekKey = detectSourceWeekFromCSV(csvData);
                                const timesheets = loadAllTimesheets();
                                
                                let updatedData;
                                if (sourceWeekKey && sourceWeekKey !== targetWeekKey) {
                                    // Calculate week offset and shift dates
                                    const weekOffset = getWeekOffset(sourceWeekKey, targetWeekKey);
                                    updatedData = csvData.map((entry, index) => {
                                        const newEntry = { ...entry };
                                        if (newEntry.Date) {
                                            newEntry.Date = shiftDateByOffset(newEntry.Date, weekOffset);
                                        }
                                        // Add unique ID for each entry
                                        newEntry.id = Date.now() + '_' + index;
                                        return newEntry;
                                    });
                                } else {
                                    // No date shifting needed, but still add IDs
                                    updatedData = csvData.map((entry, index) => {
                                        const newEntry = { ...entry };
                                        newEntry.id = Date.now() + '_' + index;
                                        return newEntry;
                                    });
                                }
                                
                                // Check if target week already has data
                                const existingEntries = timesheets[targetWeekKey] || [];
                                let finalEntries = [];
                                let successMessage = '';
                                
                                if (existingEntries.length > 0) {
                                    // Ask user whether to append, overwrite, or cancel
                                    const conflictMessage = `目標週次 ${targetWeekKey} 已有 ${existingEntries.length} 筆記錄。\n請選擇匯入方式：`;
                                    
                                    const choice = showThreeChoiceDialog(
                                        conflictMessage,
                                        `附加模式（保留現有 ${existingEntries.length} 筆，新增 ${updatedData.length} 筆）`,
                                        `覆寫模式（刪除現有記錄，替換為 ${updatedData.length} 筆新記錄）`,
                                        '取消匯入'
                                    );
                                    
                                    if (choice === 1) {
                                        // Append mode - keep existing and add new
                                        finalEntries = existingEntries.concat(updatedData);
                                        successMessage = `已附加 ${updatedData.length} 筆記錄到 ${targetWeekKey}（原有 ${existingEntries.length} 筆）`;
                                    } else if (choice === 2) {
                                        // Overwrite mode - replace all
                                        finalEntries = updatedData;
                                        successMessage = `已覆寫 ${targetWeekKey} 的記錄（${updatedData.length} 筆新記錄）`;
                                    } else {
                                        // Cancel import
                                        return;
                                    }
                                } else {
                                    // No existing data, just import
                                    finalEntries = updatedData;
                                    const sourceInfo = sourceWeekKey ? ` (來源: ${sourceWeekKey})` : '';
                                    successMessage = `已匯入 ${updatedData.length} 筆資料到 ${targetWeekKey}${sourceInfo}`;
                                }
                                
                                // Import to target week
                                timesheets[targetWeekKey] = finalEntries;
                                
                                saveAllTimesheets(timesheets);
                                renderTimesheetCards();
                                showSuccessMessage(successMessage);
                                
                                // Clear the target week selection
                                window.importTargetWeek = null;
                            }
                        } catch (error) {
                            console.error('CSV import error:', error);
                            alert('CSV 檔案格式錯誤: ' + error.message);
                        }
                    };
                    reader.readAsText(file);
                }
                e.target.value = '';
            });
        }
        
        console.log('✅ All event listeners set up successfully');
    } else {
        console.log('❌ Not on homepage, skipping button setup');
        console.log('Current URL:', window.location.href);
        
        // Fallback: Set up everything for GitHub Pages
        console.log('🔄 Setting up fallback with full functionality...');
        
        // Render cards first
        renderTimesheetCards();
        
        // Set up all main buttons
        const basicInfoBtn = document.getElementById('btn-basic-info');
        if (basicInfoBtn) {
            basicInfoBtn.addEventListener('click', function() {
                showBasicInfoModal();
            });
        }
        
        const newBtn = document.getElementById('btn-new');
        if (newBtn) {
            newBtn.addEventListener('click', function() {
                newTimesheet();
            });
        }
        
        const importBtn = document.getElementById('btn-import');
        if (importBtn) {
            importBtn.addEventListener('click', function() {
                importTimesheet();
            });
        }
        
        const clearBtn = document.getElementById('btn-clear-storage');
        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                if (confirm('確定要清空所有資料嗎？此操作無法還原。')) {
                    localStorage.clear();
                    renderTimesheetCards();
                    showSuccessMessage('資料已清空');
                }
            });
        }
        
        // Set up modal buttons
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
        
        // Set up week selection modal
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
        
        // Set up last week button
        const lastWeekButton = document.getElementById('btn-last-week');
        if (lastWeekButton) {
            lastWeekButton.addEventListener('click', function() {
                createLastWeekTimesheet();
            });
        }
        
        // Set up file input
        const fileInput = document.getElementById('import-file');
        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = async function(e) {
                        try {
                            const csvData = parseCSV(e.target.result);
                            if (csvData.length > 0) {
                                // Handle basic info from CSV
                                const csvBasicInfo = extractBasicInfoFromCSV(csvData);
                                const shouldContinue = await handleBasicInfoImport(csvBasicInfo);
                                if (!shouldContinue) {
                                    return; // User cancelled import
                                }
                                
                                // Use selected target week or default to last week
                                const targetWeekKey = window.importTargetWeek || getLastWeekKey();
                                const sourceWeekKey = detectSourceWeekFromCSV(csvData);
                                const timesheets = loadAllTimesheets();
                                
                                let updatedData;
                                if (sourceWeekKey && sourceWeekKey !== targetWeekKey) {
                                    // Calculate week offset and shift dates
                                    const weekOffset = getWeekOffset(sourceWeekKey, targetWeekKey);
                                    updatedData = csvData.map((entry, index) => {
                                        const newEntry = { ...entry };
                                        if (newEntry.Date) {
                                            newEntry.Date = shiftDateByOffset(newEntry.Date, weekOffset);
                                        }
                                        // Add unique ID for each entry
                                        newEntry.id = Date.now() + '_' + index;
                                        return newEntry;
                                    });
                                } else {
                                    // No date shifting needed, but still add IDs
                                    updatedData = csvData.map((entry, index) => {
                                        const newEntry = { ...entry };
                                        newEntry.id = Date.now() + '_' + index;
                                        return newEntry;
                                    });
                                }
                                
                                // Check if target week already has data
                                const existingEntries = timesheets[targetWeekKey] || [];
                                let finalEntries = [];
                                let successMessage = '';
                                
                                if (existingEntries.length > 0) {
                                    // Ask user whether to append, overwrite, or cancel
                                    const conflictMessage = `目標週次 ${targetWeekKey} 已有 ${existingEntries.length} 筆記錄。\n請選擇匯入方式：`;
                                    
                                    const choice = showThreeChoiceDialog(
                                        conflictMessage,
                                        `附加模式（保留現有 ${existingEntries.length} 筆，新增 ${updatedData.length} 筆）`,
                                        `覆寫模式（刪除現有記錄，替換為 ${updatedData.length} 筆新記錄）`,
                                        '取消匯入'
                                    );
                                    
                                    if (choice === 1) {
                                        // Append mode - keep existing and add new
                                        finalEntries = existingEntries.concat(updatedData);
                                        successMessage = `已附加 ${updatedData.length} 筆記錄到 ${targetWeekKey}（原有 ${existingEntries.length} 筆）`;
                                    } else if (choice === 2) {
                                        // Overwrite mode - replace all
                                        finalEntries = updatedData;
                                        successMessage = `已覆寫 ${targetWeekKey} 的記錄（${updatedData.length} 筆新記錄）`;
                                    } else {
                                        // Cancel import
                                        return;
                                    }
                                } else {
                                    // No existing data, just import
                                    finalEntries = updatedData;
                                    const sourceInfo = sourceWeekKey ? ` (來源: ${sourceWeekKey})` : '';
                                    successMessage = `已匯入 ${updatedData.length} 筆資料到 ${targetWeekKey}${sourceInfo}`;
                                }
                                
                                // Import to target week
                                timesheets[targetWeekKey] = finalEntries;
                                
                                saveAllTimesheets(timesheets);
                                renderTimesheetCards();
                                showSuccessMessage(successMessage);
                                
                                // Clear the target week selection
                                window.importTargetWeek = null;
                            }
                        } catch (error) {
                            console.error('CSV import error:', error);
                            alert('CSV 檔案格式錯誤: ' + error.message);
                        }
                    };
                    reader.readAsText(file);
                }
                e.target.value = '';
            });
        }
    }
});

// Debug function for console testing
window.debugProductCodes = async function() {
    console.log('=== DEBUG PRODUCT CODES (BUNDLED VERSION) ===');
    
    try {
        const allProducts = await fetchCSV('productcode.csv');
        console.log('Total products loaded:', allProducts.length);
        
        const erpProducts = allProducts.filter(p => p.Zone === 'ERP');
        console.log('ERP products count:', erpProducts.length);
        
        console.log('All ERP products:');
        erpProducts.forEach((p, i) => {
            console.log(`${i+1}. Module: "${p.Module}" | Product Module: "${p['Product Module']}"`);
        });
        
        const a2a = erpProducts.find(p => p.Module && p.Module.includes('A2A'));
        const b2b = erpProducts.find(p => p.Module && p.Module.includes('B2B'));
        
        console.log('A2A found:', a2a ? 'YES' : 'NO');
        console.log('B2B found:', b2b ? 'YES' : 'NO');
        
        if (a2a) console.log('A2A data:', a2a);
        if (b2b) console.log('B2B data:', b2b);
        
        return { total: allProducts.length, erp: erpProducts.length, a2a: !!a2a, b2b: !!b2b };
    } catch (error) {
        console.error('Error loading product codes:', error);
        return { error: error.message };
    }
};


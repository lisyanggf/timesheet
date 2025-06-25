import { loadAllTimesheets, saveAllTimesheets, loadGlobalBasicInfo, saveGlobalBasicInfo, getWeekEntries, saveWeekEntries } from '/timesheet/modules/storageModule.js';
import { loadAllCSVData, generateCSVContent, downloadCSVFile, parseCSV } from '/timesheet/modules/csvModule.js';
import { getWeekNumber, getWeekDateRangeFromKey, formatDate, getWeekDateRange, getLastWeekKey, getThisWeekKey } from '/timesheet/modules/dateModule.js';
import {
    showSuccessMessage,
    showCopyOptionsModal,
    closeCopyModal,
    customConfirm,
    showImportTargetWeekModal,
    closeImportTargetWeekModal
} from '/timesheet/modules/uiModule.js';

console.log('App.js initialized and running - Version 2.12.6 (2025-06-25)');
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
                <button onclick="window.disableNormalizationMode('${weekKey}')" class="btn-disable-normalization">停用</button>
            </div>
        `;
        weekInfoDiv.appendChild(alertDiv);
    }
}

// 停用正規化模式
window.disableNormalizationMode = function(weekKey) {
    localStorage.removeItem(`normalization_${weekKey}`);
    updateNormalizationModeDisplay(weekKey);
    showSuccessMessage('正規化模式已停用');
};

// 使複製模態框關閉函數全局可用
window.closeCopyModal = closeCopyModal;

// 匯出時進行正規化計算
function performNormalizationForExport(entries) {
    let totalRegularHours = 0;

    // 計算總正常工時
    entries.forEach(entry => {
        totalRegularHours += entry.regularHours || 0;
    });

    if (totalRegularHours > 40) {
        const ratio = 40 / totalRegularHours;
        let normalizedSum = 0;
        
        const normalizedEntries = entries.map((entry) => {
            const originalHours = entry.regularHours || 0;
            let newRegularHours = Math.round(originalHours * ratio * 100) / 100;
            normalizedSum += newRegularHours;
            
            return {
                ...entry,
                _originalHours: originalHours,
                _isNormalized: true,
                regularHours: newRegularHours,
                ttlHours: newRegularHours + (entry.otHours || 0)
            };
        });
        
        // 修正四捨五入造成的誤差，將差額加到最後一筆記錄
        const difference = 40 - normalizedSum;
        if (difference !== 0 && normalizedEntries.length > 0) {
            const lastEntry = normalizedEntries[normalizedEntries.length - 1];
            lastEntry.regularHours = Math.round((lastEntry.regularHours + difference) * 100) / 100;
            lastEntry.ttlHours = lastEntry.regularHours + (lastEntry.otHours || 0);
            console.log(`正規化修正: 將差額 ${difference} 加到最後一筆記錄，確保總時數為40小時`);
        }
        
        return normalizedEntries;
    }

    return entries; // 不需要正規化
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
console.log('Attempting to call showCopyOptionsModal with weekKey:', weekKey);
            showCopyOptionsModal(weekKey);
        });
    });
    
    document.querySelectorAll('.btn-export').forEach(btn => {
        btn.addEventListener('click', () => {
            const weekKey = btn.getAttribute('data-week');
            window.exportTimesheet(weekKey);
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
window.exportTimesheet = function(weekKey) {
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
        const csvContent = generateCSVContent(exportEntries);

        // 創建並下載檔案
        downloadCSVFile(csvContent, `工時表_${weekKey}.csv`);

        // 顯示成功訊息
        showSuccessMessage(`${weekKey} 工時表已匯出`);

    } catch (error) {
        console.error('匯出失敗:', error);
        alert('匯出失敗，請檢查瀏覽器控制台');
    }
};
// 滙出未經正規化的原始工時
function exportRawTimesheet(weekKey) {
    try {
        const entries = getWeekEntries(weekKey);
        if (!entries || entries.length === 0) {
            alert('該週次沒有工時記錄可匯出');
            return;
        }
        // 直接滙出原始工時資料
        const csvContent = generateCSVContent(entries);
        downloadCSVFile(csvContent, `工時表_${weekKey}_原始.csv`);
        showSuccessMessage(`${weekKey} 工時表（原始）已匯出`);
    } catch (error) {
        console.error('原始工時匯出失敗:', error);
        alert('原始工時匯出失敗，請檢查瀏覽器控制台');
    }
}

// 匯入工時表 - 第二步：執行帶有日期偏移的匯入
window.importWithDateOffset = async function(csvData, targetWeekKey) {
    try {
        console.log('[import] 開始帶有日期偏移的匯入:', { csvData, targetWeekKey });
        
        // 檢查全域基本資料
        let globalBasicInfo = loadGlobalBasicInfo();
        let shouldCreateBasicInfo = false;
        
        if (!globalBasicInfo || !globalBasicInfo.employeeName) {
            // 嘗試從CSV中提取基本資料
            const firstRowWithName = csvData.find(row => {
                const name = row.Name || row.name || row['姓名'] || '';
                return name.trim() !== '';
            });
            
            if (!firstRowWithName) {
                alert('無法從CSV檔案中找到員工姓名，請確保 CSV 檔案包含 Name 欄位或先手動設定基本資料。');
                return;
            }
            
            const extractedName = (firstRowWithName.Name || firstRowWithName.name || firstRowWithName['姓名'] || '').trim();
            const extractedType = (firstRowWithName.InternalOrOutsource || firstRowWithName.internalOrOutsource || firstRowWithName['內部外包'] || 'Internal').trim();
            
            const proceed = await customConfirm(
                `ℹ️ 尚未設定全域基本資料\n\n` +
                `系統將為您代入以下基本資料（從CSV檔案提取）：\n\n` +
                `📝 員工姓名：${extractedName}\n` +
                `🏢 員工類型：${extractedType}\n\n` +
                `✓ 代入後將自動儲存為全域基本資料（全 App 共用）\n` +
                `✓ 所有工時記錄將使用這些資料\n\n` +
                `是否同意代入並繼續滙入？`,
                '設定基本資料'
            );
            
            if (!proceed) {
                alert('滙入已取消。您可以先手動設定基本資料或確保CSV檔案包含正確的員工資料。');
                return;
            }
            
            // 創建全域基本資料
            globalBasicInfo = {
                employeeName: extractedName,
                employeeType: extractedType
            };
            shouldCreateBasicInfo = true;
        }
        
        // 檢查CSV中的員工姓名是否與全域設定一致
        const csvEmployeeNames = new Set();
        csvData.forEach(row => {
            const name = row.Name || row.name || row['姓名'] || '';
            if (name.trim()) {
                csvEmployeeNames.add(name.trim());
            }
        });
        
        if (csvEmployeeNames.size > 0) {
            const globalName = globalBasicInfo.employeeName.trim();
            const differentNames = Array.from(csvEmployeeNames).filter(name => name !== globalName);
            
            if (differentNames.length > 0) {
                const namesList = differentNames.join('、');
                const proceed = await customConfirm(
                    `警告：CSV檔案中的員工姓名與全域設定不一致！\n\n` +
                    `全域設定：${globalName}\n` +
                    `CSV中發現：${namesList}\n\n` +
                    `滙入後，所有記錄的員工姓名將統一使用全域設定「${globalName}」。\n\n` +
                    `是否繼續滙入？`,
                    '姓名不一致警告'
                );
                
                if (!proceed) {
                    alert('滙入已取消。請檢查CSV檔案中的員工姓名或更新全域基本資料設定。');
                    return;
                }
            }
        }
        
        // 檢測來源週
        let sourceWeekKey = null;
        
        // 從CSV數據中找到第一個有效日期來確定來源週
        for (const row of csvData) {
            const dateValue = row.Date || row.date || row['日期'] || row.Day;
            if (dateValue) {
                const dateStr = dateValue.toString().trim();
                const dateFormats = [
                    dateStr,
                    dateStr.replace(/\//g, '-'),
                    dateStr.replace(/\./g, '-')
                ];
                
                for (const format of dateFormats) {
                    const dateObj = new Date(format);
                    if (!isNaN(dateObj.getTime()) && dateObj.getFullYear() > 1900) {
                        const year = dateObj.getFullYear();
                        const weekNumber = getWeekNumber(dateObj);
                        sourceWeekKey = `${year}-W${weekNumber.toString().padStart(2, '0')}`;
                        break;
                    }
                }
                if (sourceWeekKey) break;
            }
        }
        
        // 計算來源週和目標週的範圍（用於星期對齊）
        let sourceWeekRange = null;
        let targetWeekRange = null;
        
        if (sourceWeekKey && sourceWeekKey !== targetWeekKey) {
            sourceWeekRange = getWeekDateRangeFromKey(sourceWeekKey);
            targetWeekRange = getWeekDateRangeFromKey(targetWeekKey);
            console.log(`[import] 週次對齊: ${sourceWeekKey} -> ${targetWeekKey}`);
            console.log(`[import] 來源週範圍: ${sourceWeekRange.start.toISOString().split('T')[0]} (${sourceWeekRange.start.getMonth()+1}月) ~ ${sourceWeekRange.end.toISOString().split('T')[0]} (${sourceWeekRange.end.getMonth()+1}月)`);
            console.log(`[import] 目標週範圍: ${targetWeekRange.start.toISOString().split('T')[0]} (${targetWeekRange.start.getMonth()+1}月) ~ ${targetWeekRange.end.toISOString().split('T')[0]} (${targetWeekRange.end.getMonth()+1}月)`);
            
            // 檢查是否跨月
            const isSourceCrossMonth = sourceWeekRange.start.getMonth() !== sourceWeekRange.end.getMonth();
            const isTargetCrossMonth = targetWeekRange.start.getMonth() !== targetWeekRange.end.getMonth();
            if (isSourceCrossMonth || isTargetCrossMonth) {
                console.log(`[import] 跨月處理: 來源週跨月=${isSourceCrossMonth}, 目標週跨月=${isTargetCrossMonth}`);
            }
        }
        
        // 處理CSV數據並應用日期偏移
        const processedEntries = [];
        const failedRows = [];
        
        // 日期對齊處理函數（基於週起始日期偏移）
        const alignDateToTargetWeek = (originalDateValue, fieldName) => {
            if (!originalDateValue) return null;
            
            // 解析日期
            let dateObj = null;
            const dateStr = originalDateValue.toString().trim();
            const dateFormats = [
                dateStr,
                dateStr.replace(/\//g, '-'),
                dateStr.replace(/\./g, '-')
            ];
            
            for (const format of dateFormats) {
                dateObj = new Date(format);
                if (!isNaN(dateObj.getTime()) && dateObj.getFullYear() > 1900) {
                    break;
                }
                dateObj = null;
            }
            
            if (!dateObj || isNaN(dateObj.getTime())) {
                return null;
            }
            
            // 應用日期偏移（基於週起始日期差異）
            if (sourceWeekRange && targetWeekRange) {
                // 保存原始日期信息用於日誌
                const originalDateStr = dateObj.toISOString().split('T')[0];
                
                // 計算來源週和目標週的起始日期差異（以天為單位）
                const sourceStart = new Date(sourceWeekRange.start);
                const targetStart = new Date(targetWeekRange.start);
                const daysDifference = Math.round((targetStart.getTime() - sourceStart.getTime()) / (1000 * 60 * 60 * 24));
                
                // 計算目標日期：原始日期 + 週起始日期差異
                const targetDate = new Date(dateObj);
                targetDate.setDate(dateObj.getDate() + daysDifference);
                
                const resultDateStr = targetDate.toISOString().split('T')[0];
                
                console.log(`[import] ${fieldName}週起始對齊: ${originalDateStr} + ${daysDifference}天 -> ${resultDateStr}`);
                console.log(`[import] 來源週起始: ${sourceStart.toISOString().split('T')[0]}, 目標週起始: ${targetStart.toISOString().split('T')[0]}`);
                
                // 檢查是否跨月
                if (originalDateStr.split('-')[1] !== resultDateStr.split('-')[1]) {
                    console.log(`[import] ${fieldName}跨月處理: ${originalDateStr.split('-')[1]}月 -> ${resultDateStr.split('-')[1]}月`);
                }
                
                return targetDate;
            }
            
            return dateObj;
        };
        
        csvData.forEach((row, index) => {
            if (!row) return;
            
            // 處理主要日期欄位
            const primaryDateValue = row.Date || row.date || row['日期'] || row.Day;
            if (!primaryDateValue) {
                console.warn(`[import] 第${index + 1}筆記錄缺少主要日期欄位:`, row);
                failedRows.push(`第${index + 1}筆記錄：缺少主要日期欄位`);
                return;
            }
            
            // 對齊三個日期欄位
            const alignedDate = alignDateToTargetWeek(primaryDateValue, '主日期');
            const alignedStartDate = alignDateToTargetWeek(row.StartDate || row.startDate || row['開始日期'] || primaryDateValue, '開始日期');
            const alignedEndDate = alignDateToTargetWeek(row.EndDate || row.endDate || row['結束日期'] || primaryDateValue, '結束日期');
            
            if (!alignedDate) {
                console.warn(`[import] 第${index + 1}筆記錄主要日期格式無效:`, primaryDateValue);
                failedRows.push(`第${index + 1}筆記錄：主要日期格式無效 "${primaryDateValue}"`);
                return;
            }
            
            // 建立記錄物件
            const entry = {
                id: Date.now().toString(36) + Math.random().toString(36).substring(2) + index,
                task: row.Task || row.task || row['任務描述'] || row['Task Description'] || '',
                zone: row.Zone || row.zone || row['專案區域'] || '',
                projectCode: row.ProjectCode || row.projectCode || row['專案編號'] || row['Project Code'] || '',
                productModule: row.ProductModule || row.productModule || row['產品模組'] || row['Product Module'] || '',
                activityType: row.ActivityType || row.activityType || row['活動類型'] || row['Activity Type'] || '',
                ttlHours: parseFloat(row.TTL_Hours || row.ttlHours || row['總工時'] || 0) || 0,
                regularHours: parseFloat(row.RegularHours || row.regularHours || row['正常工時'] || 0) || 0,
                otHours: parseFloat(row.OTHours || row.otHours || row['加班工時'] || 0) || 0,
                date: alignedDate.toISOString().split('T')[0],
                startDate: (alignedStartDate || alignedDate).toISOString().split('T')[0],
                endDate: (alignedEndDate || alignedDate).toISOString().split('T')[0],
                employeeName: globalBasicInfo.employeeName,
                internalOrOutsource: globalBasicInfo.employeeType
            };
            
            processedEntries.push(entry);
            console.log(`[import] 成功處理第${index + 1}筆記錄:`, entry);
        });
        
        if (processedEntries.length === 0) {
            let errorMessage = '沒有成功處理任何記錄。';
            if (failedRows.length > 0) {
                errorMessage += '\n\n失敗原因：\n' + failedRows.join('\n');
            }
            alert(errorMessage);
            return;
        }
        
        // 儲存基本資料（如果需要）
        if (shouldCreateBasicInfo) {
            saveGlobalBasicInfo(globalBasicInfo);
            console.log('[import] 已儲存全域基本資料:', globalBasicInfo);
        }
        
        // 合併到目標週
        const allTimesheets = loadAllTimesheets();
        if (allTimesheets[targetWeekKey]) {
            // 目標週已存在，合併記錄
            const proceed = await customConfirm(
                `目標週 ${targetWeekKey} 已有工時記錄，是否要合併匯入？\n\n` +
                `現有記錄：${allTimesheets[targetWeekKey].length} 筆\n` +
                `即將匯入：${processedEntries.length} 筆`,
                '合併確認'
            );
            
            if (!proceed) {
                alert('匯入已取消。');
                return;
            }
            
            allTimesheets[targetWeekKey] = allTimesheets[targetWeekKey].concat(processedEntries);
        } else {
            // 新週次
            allTimesheets[targetWeekKey] = processedEntries;
        }
        
        // 儲存更新後的資料
        saveAllTimesheets(allTimesheets);
        
        // 重新載入卡片
        if (typeof renderTimesheetCards === 'function') {
            renderTimesheetCards();
        } else if (typeof window.renderTimesheetCards === 'function') {
            window.renderTimesheetCards();
        }
        
        // 顯示成功訊息
        let successMessage = `✅ 匯入成功！\n\n`;
        successMessage += `目標週次：${targetWeekKey}\n`;
        successMessage += `成功匯入：${processedEntries.length} 筆記錄\n`;
        
        if (sourceWeekKey && sourceWeekKey !== targetWeekKey) {
            successMessage += `來源週次：${sourceWeekKey}\n`;
            successMessage += `日期對齊：按星期對應調整\n`;
        }
        
        if (failedRows.length > 0) {
            successMessage += `\n⚠️ ${failedRows.length} 筆記錄匯入失敗：\n${failedRows.join('\n')}`;
        }
        
        alert(successMessage);
        
    } catch (error) {
        console.error('[import] 匯入過程中發生錯誤:', error);
        alert('❌ 匯入失敗：\n\n' + (error.message || '請檢查瀏覽器控制台獲取更多資訊。'));
    }
};

// 匯入工時表 - 第一步：解析CSV並顯示週次選擇
async function importTimesheet() {
    const input = document.getElementById('import-file');
    input.value = ''; // 重置 input，避免同檔案無法重選
    input.onchange = async function (event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async function (e) {
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
                
                // 將解析後的資料保存到全局變量，供後續使用
                window.pendingImportData = data;
                
                // 顯示目標週選擇模態框
                showImportTargetWeekModal(data);
                
            } catch (error) {
                console.error('[import] CSV解析錯誤:', error);
                alert('❌ CSV檔案解析失敗：\n\n' + (error.message || '請檢查檔案格式是否正確。'));
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
    alert('基本資料儲存成功！');
}

// 新增工時表
function newTimesheet() {
    const modal = document.getElementById('week-selection-modal');
    modal.style.display = 'block';
    
    // 載入週次選項資訊...
    updateWeekOptions();
}

// 儲存基本資料（舊版函數）
function saveBasicInfo() {
    const employeeName = document.getElementById('employeeName').value.trim();
    const employeeType = document.getElementById('employeeType').value;
    
    if (!employeeName || !employeeType) {
        alert('請填寫所有必填欄位');
        return;
    }
    
    const basicInfo = {
        employeeName: employeeName,
        employeeType: employeeType
    };
    
    saveGlobalBasicInfo(basicInfo);
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
                        return;
                    }
                    
                    // 創建全域基本資料
                    globalBasicInfo = {
                        employeeName: extractedName,
                        employeeType: extractedType
                    };
                    shouldCreateBasicInfo = true;
                }
                
                // 檢查CSV中的員工姓名是否與全域設定一致
                const csvEmployeeNames = new Set();
                data.forEach(row => {
                    const name = row.Name || row.name || row['姓名'] || '';
                    if (name.trim()) {
                        csvEmployeeNames.add(name.trim());
                    }
                });
                
                if (csvEmployeeNames.size > 0) {
                    const globalName = globalBasicInfo.employeeName.trim();
                    const differentNames = Array.from(csvEmployeeNames).filter(name => name !== globalName);
                    
                    if (differentNames.length > 0) {
                        const namesList = differentNames.join('、');
                        const proceed = await customConfirm(
                            `警告：CSV檔案中的員工姓名與全域設定不一致！\n\n` +
                            `全域設定：${globalName}\n` +
                            `CSV中發現：${namesList}\n\n` +
                            `滙入後，所有記錄的員工姓名將統一使用全域設定「${globalName}」。\n\n` +
                            `是否繼續滙入？`,
                            '姓名不一致警告'
                        );
                        
                        if (!proceed) {
                            alert('滙入已取消。請檢查CSV檔案中的員工姓名或更新全域基本資料設定。');
                            return;
                        }
                    }
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
                        const standardizedRow = {
                            // 基本識別
                            id: row.id || (Date.now() + '-' + Math.random().toString(36).substring(2, 11)),
                            
                            // 日期相關
                            date: dateObj.toISOString().split('T')[0], // YYYY-MM-DD 格式
                            startDate: row['Start Date'] || row.startDate || row['開始日期'] || '',
                            endDate: row['End Date'] || row.endDate || row['結束日期'] || '',
                            
                            // 員工資料（使用全域設定）
                            name: globalBasicInfo.employeeName || '',
                            internalOrOutsource: globalBasicInfo.employeeType || '',
                            
                            // 專案資料
                            zone: row.Zone || row.zone || row['區域'] || '',
                            project: row.Project || row.project || row['專案'] || '',
                            productModule: row['Product Module'] || row.productModule || row['產品模組'] || '',
                            activityType: row['Activity Type'] || row.activityType || row['活動類型'] || '',
                            task: row.Task || row.task || row['任務'] || '',
                            pm: row.PM || row.pm || row['專案經理'] || '',
                            
                            // 工時資料
                            regularHours: parseFloat(row['Regular Hours'] || row.regularHours || row['正常工時'] || 0),
                            otHours: parseFloat(row['OT Hours'] || row.otHours || row['加班工時'] || 0),
                            ttlHours: parseFloat(row.TTL_Hours || row.ttlHours || row['總工時'] || 0),
                            
                            // 備註
                            comments: row.Comments || row.comments || row['備註'] || ''
                        };
                        
                        // 如果沒有總工時，則計算
                        if (!standardizedRow.ttlHours || standardizedRow.ttlHours === 0) {
                            standardizedRow.ttlHours = standardizedRow.regularHours + standardizedRow.otHours;
                        }
                        
                        // 記錄處理後的資料到分組中
                        groupedData[weekKey].push(standardizedRow);
                        console.log(`[import] 成功處理記錄 ${index + 1}:`, standardizedRow);
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
                
                // 儲存全域基本資料（如果是從CSV提取的）
                if (shouldCreateBasicInfo) {
                    saveGlobalBasicInfo(globalBasicInfo);
                    console.log('[import] 已儲存全域基本資料:', globalBasicInfo);
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
                    let successMessage = `匯入成功！\n共匯入 ${totalRecords} 筆記錄到 ${importedWeeks.length} 個週次：\n\n${weekInfoList.join('\n')}`;
                    
                    // 如果有創建基本資料，則加入提示
                    if (shouldCreateBasicInfo) {
                        successMessage += `\n\nℹ️ 已自動儲存全域基本資料：\n員工姓名：${globalBasicInfo.employeeName}\n員工類型：${globalBasicInfo.employeeType}`;
                    }
                    
                    if (failedRows.length > 0) {
                        alert(successMessage + `\n\n⚠️ 注意：有 ${failedRows.length} 筆記錄匯入失敗。`);
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
    
    console.log('updateLastWeekButtonDisplay called:', { button: !!button, container: !!container });
    
    if (button && container) {
        // 檢查上週是否已存在
        const lastWeekKey = getLastWeekKey();
        const timesheets = loadAllTimesheets();
        
        console.log('Checking last week:', { lastWeekKey, exists: !!timesheets[lastWeekKey], allWeeks: Object.keys(timesheets) });
        
        if (timesheets[lastWeekKey]) {
            // 上週已存在，隱藏按鈕
            console.log('Last week exists, hiding button');
            container.style.display = 'none';
        } else {
            // 上週不存在，顯示按鈕並設置文字
            console.log('Last week does not exist, showing button');
            container.style.display = 'block';
            button.textContent = `建立上週工時表 (${formatDate(lastMonday)} - ${formatDate(lastSunday)})`;
        }
    } else {
        console.log('Button or container not found');
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
    const weekNumber = getWeekNumber(lastMonday);
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
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// 獲取當前編輯的週次
function getCurrentWeekKey() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('week');
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
    
    // 先設定Zone
    document.getElementById('zone').value = entry.zone || '';
    
    // 其他基本欄位
    document.getElementById('activityType').value = entry.activityType || '';
    document.getElementById('task').value = entry.task || '';
    document.getElementById('regularHours').value = entry.regularHours || '';
    document.getElementById('otHours').value = entry.otHours || 0;
    document.getElementById('ttlHours').value = entry.ttlHours || '';
    document.getElementById('date').value = entry.date || '';
    document.getElementById('startDate').value = entry.startDate || '';
    document.getElementById('endDate').value = entry.endDate || '';
    document.getElementById('comments').value = entry.comments || '';
    
    // 在edit.html中重新初始化專案和產品模組下拉選單（根據Zone）
    if (window.location.pathname.includes('edit.html') && typeof window.initProjectAndProductSelect === 'function') {
        // 使用setTimeout確保在DOM更新後執行
        setTimeout(() => {
            window.initProjectAndProductSelect(entry.project, entry.productModule).then(() => {
                // 初始化完成後設定PM
                document.getElementById('pm').value = entry.pm || '';
            });
        }, 100);
    } else {
        // 如果不在edit.html或沒有initProjectAndProductSelect函數，直接設定
        document.getElementById('project').value = entry.project || '';
        document.getElementById('productModule').value = entry.productModule || '';
        document.getElementById('pm').value = entry.pm || '';
    }
    
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

// Make these functions globally accessible for onclick handlers
window.editEntry = function(entryId) {
    const weekKey = getCurrentWeekKey();
    const entries = getWeekEntries(weekKey);
    const entry = entries.find(e => e.id === entryId);
    
    if (entry) {
        fillForm(entry);
        // 滾動到表單頂部
        document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
    }
};

window.copyEntry = function(entryId) {
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
};

window.deleteEntry = function(entryId) {
    if (!confirm('確定要刪除這筆工時記錄嗎？')) {
        return;
    }
    
    const weekKey = getCurrentWeekKey();
    const entries = getWeekEntries(weekKey);
    const filteredEntries = entries.filter(entry => entry.id !== entryId);
    
    saveWeekEntries(weekKey, filteredEntries);
    renderEntriesList();
    showSuccessMessage('工時記錄已刪除！');
};

// 渲染工時記錄列表
function renderEntriesList() {
    const weekKey = getCurrentWeekKey();
    const entries = getWeekEntries(weekKey);
    const tbody = document.getElementById('entries-tbody');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    let entryTotalHours = 0;
    
    entries.forEach(entry => {
        entryTotalHours += entry.ttlHours || 0;
        
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
    
    
    // Update the page statistics display if on edit page
    updatePageStatistics();

    function updatePageStatistics() {
        if (window.location.pathname.includes('edit.html')) {
            const weekKey = getCurrentWeekKey();
            if (weekKey) {
                const currentEntries = getWeekEntries(weekKey) || [];
                const totalRegularHours = currentEntries.reduce((sum, entry) => sum + (entry.regularHours || 0), 0);
                const totalOtHours = currentEntries.reduce((sum, entry) => sum + (entry.otHours || 0), 0);
                const totalHours = currentEntries.reduce((sum, entry) => sum + (entry.ttlHours || 0), 0);
                
                const dateRangeDiv = document.getElementById('date-range');
                if (dateRangeDiv) {
                    const currentText = dateRangeDiv.innerHTML.split('<span')[0];
                    dateRangeDiv.innerHTML = currentText + 
                        `<span style="color:#444;font-size:1em;">
                        總正常工時：${totalRegularHours}
                        總加班工時：${totalOtHours}
                        總工時：${totalHours}
                        </span>`;
                }
            }
        }
    }
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


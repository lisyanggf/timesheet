// ==================== CSV 資料載入與管理 ====================

import { loadGlobalBasicInfo } from './storageModule.js';

// 全域變數儲存 CSV 資料
let projectCodeData = [];
let productCodeData = [];
let activityTypeData = [];

// 改進的 CSV 解析 function，支援引號包圍的欄位，回傳 array of objects
export function parseCSV(text) {
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
                    
                    // 對於CSV檔案，我們保持原始欄位名稱不變，不做轉換
                    // 這樣可以確保projectcode.csv和productcode.csv中的Zone、Project等欄位能正確使用
                    
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
export async function loadCSVFile(filename) {
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
export async function loadAllCSVData() {
    try {
        projectCodeData = await loadCSVFile('projectcode.csv');
        productCodeData = await loadCSVFile('productcode.csv');
        activityTypeData = await loadCSVFile('activityType.csv');
        
        console.log('CSV 資料載入完成:', {
            projects: projectCodeData.length,
            products: productCodeData.length,
            activities: activityTypeData.length
        });
        
        // Debug: Check if problematic entries are loaded
        const a2aInData = productCodeData.find(p => p.Module && p.Module.includes('A2A Integration'));
        const b2bInData = productCodeData.find(p => p.Module && p.Module.includes('B2B Integration'));
        console.log('[loadAllCSVData] A2A Integration in productCodeData:', a2aInData ? 'YES' : 'NO');
        console.log('[loadAllCSVData] B2B Integration in productCodeData:', b2bInData ? 'YES' : 'NO');
        
        if (a2aInData) console.log('[loadAllCSVData] A2A data:', a2aInData);
        if (b2bInData) console.log('[loadAllCSVData] B2B data:', b2bInData);
        
        // 初始化完成後更新選項
        updateProjectOptions();
        updateActivityTypeOptions();
        
    } catch (error) {
        console.error('載入 CSV 資料失敗:', error);
    }
}

// 根據 Zone 篩選專案
export function getProjectsByZone(zone) {
    if (!zone || !projectCodeData.length) return [];
    return projectCodeData.filter(project => project.Zone === zone);
}

// 根據專案和區域取得專案經理
export function getPMByProject(projectName, zoneName = null) {
    if (!projectName) return '';
    
    // 如果有提供區域，同時以專案和區域來查找
    if (zoneName) {
        const project = projectCodeData.find(p => p.Project === projectName && p.Zone === zoneName);
        return project ? project.PM : '';
    }
    
    // 如果沒有提供區域，使用原有邏輯（向後相容）
    const project = projectCodeData.find(p => p.Project === projectName);
    return project ? project.PM : '';
}

// 根據 Zone 篩選產品模組
export function getProductModulesByZone(zone) {
    if (!zone || !productCodeData.length) {
        console.log('[getProductModulesByZone] Early return - zone:', zone, 'productCodeData.length:', productCodeData.length);
        return [];
    }
    
    const filtered = productCodeData.filter(product => product.Zone === zone);
    console.log(`[getProductModulesByZone] Zone: "${zone}", Total products: ${productCodeData.length}, Filtered: ${filtered.length}`);
    
    // Debug: Check for specific problematic entries
    const a2aProduct = filtered.find(p => p.Module && p.Module.includes('A2A Integration'));
    const b2bProduct = filtered.find(p => p.Module && p.Module.includes('B2B Integration'));
    console.log('[getProductModulesByZone] A2A Integration found:', a2aProduct ? 'YES' : 'NO');
    console.log('[getProductModulesByZone] B2B Integration found:', b2bProduct ? 'YES' : 'NO');
    
    if (a2aProduct) console.log('[getProductModulesByZone] A2A data:', a2aProduct);
    if (b2bProduct) console.log('[getProductModulesByZone] B2B data:', b2bProduct);
    
    return filtered;
}

// 更新專案選項
export function updateProjectOptions() {
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
export function updateProjectDropdown(zone) {
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
        const zoneField = document.getElementById('zone');
        
        if (pmField && selectedOption && selectedOption.dataset.pm) {
            pmField.value = selectedOption.dataset.pm;
            console.log('PM updated via csvModule to:', selectedOption.dataset.pm);
        } else if (pmField) {
            // 使用更新後的getPMByProject函數，傳入zone和project
            const selectedProject = this.value;
            const selectedZone = zoneField ? zoneField.value : null;
            const pm = getPMByProject(selectedProject, selectedZone);
            pmField.value = pm;
            console.log('PM updated via getPMByProject to:', pm);
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
export function updateProductModuleDropdown(zone) {
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
    
    console.log(`[updateProductModuleDropdown] Zone: "${zone}", Products to add: ${productModules.length}`);
    
    productModules.forEach((product, index) => {
        const option = document.createElement('option');
        const productModuleValue = product['Product Module'];
        
        console.log(`[updateProductModuleDropdown] Adding option ${index + 1}: "${productModuleValue}"`);
        
        // Check for problematic entries
        if (productModuleValue && (productModuleValue.includes('A2A Integration') || productModuleValue.includes('B2B Integration'))) {
            console.log(`[updateProductModuleDropdown] *** Adding problematic entry: "${productModuleValue}"`);
        }
        
        option.value = productModuleValue;
        option.textContent = productModuleValue;
        productModuleSelect.appendChild(option);
    });
    
    console.log(`[updateProductModuleDropdown] Final dropdown has ${productModuleSelect.options.length} options`);
    
    // Debug: List all options in the dropdown
    for (let i = 0; i < productModuleSelect.options.length; i++) {
        const option = productModuleSelect.options[i];
        if (option.value && (option.value.includes('A2A Integration') || option.value.includes('B2B Integration'))) {
            console.log(`[updateProductModuleDropdown] *** Dropdown contains: "${option.value}"`);
        }
    }
}

// 更新活動類型選項
export function updateActivityTypeOptions() {
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
export function generateCSVContent(entries) {
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
export function downloadCSVFile(csvContent, filename) {
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
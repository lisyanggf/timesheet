// ==================== CSV 資料載入與管理 ====================

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

// 根據專案取得專案經理
export function getPMByProject(projectName) {
    const project = projectCodeData.find(p => p.Project === projectName);
    return project ? project.PM : '';
}

// 根據 Zone 篩選產品模組
export function getProductModulesByZone(zone) {
    if (!zone || !productCodeData.length) return [];
    return productCodeData.filter(product => product.Zone === zone);
}


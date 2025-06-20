// ==================== localStorage 與資料存取 ====================

// 工時表資料
export function loadAllTimesheets() {
    const data = localStorage.getItem('timesheets');
    return data ? JSON.parse(data) : {};
}

export function saveAllTimesheets(timesheets) {
    localStorage.setItem('timesheets', JSON.stringify(timesheets));
}

// 全域基本資料
export function loadGlobalBasicInfo() {
    const data = localStorage.getItem('globalBasicInfo');
    return data ? JSON.parse(data) : null;
}

export function saveGlobalBasicInfo(basicInfo) {
    localStorage.setItem('globalBasicInfo', JSON.stringify(basicInfo));
}

// 取得指定週次的工時記錄
export function getWeekEntries(weekKey) {
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
export function saveWeekEntries(weekKey, entries) {
    const timesheets = loadAllTimesheets();
    timesheets[weekKey] = entries;
    saveAllTimesheets(timesheets);
}
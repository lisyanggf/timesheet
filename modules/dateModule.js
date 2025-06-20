// ==================== 日期與週次相關工具 ====================

// 格式化日期為 YYYY-MM-DD（本地時間）
export function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// 取得本週的週次鍵值
export function getThisWeekKey() {
    const today = new Date();
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() - today.getDay() + 1);
    const year = thisMonday.getFullYear();
    const weekNumber = getWeekNumber(thisMonday);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

// 取得上週的週次鍵值
export function getLastWeekKey() {
    const today = new Date();
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - today.getDay() - 6);
    const year = lastMonday.getFullYear();
    const weekNumber = getWeekNumber(lastMonday);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

// 計算週數（以週日為週首，YYYY-Www）
export function getWeekNumber(date) {
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
export function getWeekDateRange(weekNumber, year) {
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
export function getWeekDateRangeFromKey(weekKey) {
    const [year, week] = weekKey.split('-');
    const weekNumber = parseInt(week.substring(1));
    return getWeekDateRange(weekNumber, year);
}

// 設置日期欄位的限制範圍
export function setDateFieldLimits(startDate, endDate) {
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
export function validateDateInWeekRange(date, startDate, endDate) {
    if (!date) return true; // 空值允許

    const inputDate = new Date(date);
    return inputDate >= startDate && inputDate <= endDate;
}
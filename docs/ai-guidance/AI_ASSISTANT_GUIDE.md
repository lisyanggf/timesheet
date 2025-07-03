# AI Assistant Guide for Timesheet Application
*Guidance for AI assistants working with this codebase*

## Overview

This document provides guidance for AI assistants (Claude Code, Gemini, etc.) when working with the Chinese timesheet management web application. The application is built with vanilla HTML, CSS, and JavaScript, focusing on simplicity and browser compatibility.

## Quick Reference

### Current Version
- **Version**: 3.3.2 (2025-07-02)
- **Architecture**: Frontend-only, bundled JavaScript
- **Data Storage**: localStorage
- **Deployment**: GitHub Pages compatible

### Key Files
- `index.html` - Main dashboard with timesheet cards
- `edit.html` - Timesheet editing interface  
- `tpm-validator.html` - TPM validation dashboard
- `app-bundled.js` - Complete application logic (single bundled file)
- `style.css` - Application styling
- CSV files: `projectcode.csv`, `productcode.csv`, `activityType.csv`

## Important Development Guidelines

### 1. File Modification Policy
- **ALWAYS prefer editing existing files** over creating new ones
- **NEVER create new documentation files** unless explicitly requested
- **Focus on the bundled architecture** - all functionality is in `app-bundled.js`

### 2. Code Structure Understanding
```javascript
// The application follows this structure in app-bundled.js:
// ==================== localStorage 與資料存取 ====================
// ==================== 日期與週次相關工具 ====================
// ==================== 業務邏輯函數 ====================
// ==================== UI渲染與事件處理 ====================
// ==================== 初始化 ====================
```

### 3. Critical Data Patterns

#### Week Key Format
```javascript
const weekKey = `${year}-W${weekNumber.toString().padStart(2, '0')}`;
// Example: "2024-W25"
```

#### Zone and PM Relationship
**CRITICAL**: PM lookup requires both Zone AND Project because projects with the same name can exist across different zones.

```javascript
// When zone changes, PM field must be cleared
zoneSelect.addEventListener('change', function() {
    const pmField = document.getElementById('pm');
    if (pmField) {
        pmField.value = ''; // Clear PM when zone changes
    }
});
```

#### Admin/Training Validation Rules
```javascript
if (activityType === 'Admin / Training') {
    // Must use these exact values:
    zone = 'Admin';
    project = 'Admin'; 
    productModule = 'Non Product Non Product';
}
```

### 4. Event Handler Patterns

#### Edit Page Button Binding
```javascript
// Always use setTimeout to ensure DOM is ready
setTimeout(() => {
    const btn = document.getElementById('button-id');
    if (btn) {
        console.log('Button found, adding event listener');
        btn.addEventListener('click', handlerFunction);
    } else {
        console.log('Button not found');
    }
}, 500);
```

#### Common Missing Handlers to Check
- `btn-export-week` - Export current week functionality
- `btn-add-entry` - Add new timesheet entry
- `btn-save-entry` - Save timesheet entry
- `btn-clear-form` - Clear form data

### 5. Validation Rules Implementation

#### Regular Hours Limitation (8-hour rule)
```javascript
function validateRegularHours(value) {
    const hours = parseFloat(value);
    if (hours > 8) {
        return { 
            isValid: false, 
            message: '正常工時不能超過8小時！', 
            maxValue: '8' 
        };
    }
    return { isValid: true };
}
```

#### Form Submission Protection
```javascript
// Always validate before saving
if (regularHours > 8) {
    alert('正常工時不能超過8小時！請修正後再儲存。');
    document.getElementById('regularHours').focus();
    return false;
}
```

### 6. CSV Import/Export Handling

#### Download Timing Fix
```javascript
// Use delays to prevent browser blocking consecutive downloads
function downloadCSVFile(csvContent, filename) {
    // ... blob creation ...
    
    setTimeout(() => {
        link.click();
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    }, 50);
}
```

#### Basic Info Conflict Resolution
```javascript
// For consistent data - confirmation dialog
const choice = await showBasicInfoChoiceDialog(
    'Basic data is consistent, continue import?',
    'Continue Import',
    'Cancel Import',
    true // isConfirmDialog = true
);

// For inconsistent data - selection dialog (no cancel option)
const choice = await showBasicInfoChoiceDialog(
    'Data conflict detected, choose which to use:',
    localDataDisplay,
    csvDataDisplay,
    false // isConfirmDialog = false
);
```

### 7. TPM Validation Implementation

#### File Processing Pattern
```javascript
async function validateCSVFile(file) {
    // Parse CSV
    const entries = parseCSVContent(content);
    
    // Validate rules
    const violations = [
        ...validateAdminTrainingRules(entries),
        ...validateRegularHoursRules(entries),
        ...validateWeeklyTotalHours(entries)
    ];
    
    // IMPORTANT: Return data for later use
    return {
        violations: violations,
        data: entries  // Store parsed data
    };
}
```

## Common Issues and Solutions

### 1. Event Handlers Not Working
**Problem**: Buttons don't respond to clicks
**Solution**: Check if event listeners are properly bound in the setTimeout block

### 2. Zone/Project/PM Issues  
**Problem**: PM field doesn't update or gets incorrect values
**Solution**: Ensure Zone is selected first, then Project, and verify PM clearing logic

### 3. CSV Download Problems
**Problem**: File selector flickers or downloads fail
**Solution**: Use the timing delays in downloadCSVFile function

### 4. Validation Not Working
**Problem**: Form accepts invalid data
**Solution**: Check both real-time and form submission validation

### 5. TPM Export Shows Zero Records
**Problem**: Export functionality returns empty results
**Solution**: Ensure parsed CSV data is stored in validationFiles Map with data field

## Version Management

### Version Increment Requests
When user requests "進小版" or "進個小版":
1. Update version in `app-bundled.js` console.log statement
2. Update version in `docs/user/USER_GUIDE.md`
3. Update version in `docs/technical/TECHNICAL_GUIDE.md`

### Current Version Pattern
```javascript
console.log('App.js initialized and running - Version 3.3.2 (2025-07-02T00:00:00Z)');
```

## Testing Checklist

Before marking any changes as complete, verify:
- [ ] All buttons have event listeners
- [ ] Zone changes clear PM field
- [ ] Admin/Training rules are enforced
- [ ] Regular hours validation works (8-hour limit)
- [ ] CSV export/import functions properly
- [ ] TPM validation processes files correctly
- [ ] Version numbers are consistent across files

## Debugging Tips

### Console Logging Strategy
The application uses extensive console logging. Look for these patterns:
```javascript
console.log('Button found, adding event listener');
console.log('Button not found');
console.log('Zone changed to:', this.value);
```

### Common Console Messages
- "App.js initialized and running - Version X.X.X"
- "Edit page detected, initializing edit functionality"
- Various button found/not found messages
- Zone/Project change notifications

### Browser Developer Tools
1. Check Console for error messages
2. Inspect Network tab for CSV file loading
3. Use Application tab to examine localStorage data
4. Verify event listeners in Elements tab

## Communication Guidelines

### Response Format
- Keep responses concise and focused
- Address the specific issue reported
- Update version numbers when requested
- Provide clear status updates

### User Interaction Patterns
Users often request:
- "進小版" - Increment minor version
- Bug reports with specific symptoms
- Feature additions or modifications
- Git operations (commit, push)

---

*This guide is maintained for timesheet application v3.3.2. Update this document when significant architectural changes are made.*
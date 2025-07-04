# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

## Overview

This is a Chinese timesheet management web application built with vanilla HTML, CSS, and JavaScript. It allows employees to create weekly timesheets, manage work hours, and export data to CSV format. The application uses localStorage for data persistence and supports multi-week management.

## Architecture

### Core Structure
- **Frontend-only application**: No backend server, runs entirely in the browser
- **Bundled JavaScript**: All functionality is consolidated into a single bundled file for GitHub Pages compatibility
- **Data persistence**: Uses localStorage to store timesheet data and global employee information
- **CSV integration**: Loads reference data from CSV files (project codes, product codes, activity types)

### Key Files
- `index.html` - Main dashboard showing all timesheet cards
- `edit.html` - Timesheet editing interface for individual weeks
- `tpm-validator.html` - TPM validation tool dashboard
- `app-bundled.js` - Complete application logic in a single bundled file (no ES6 modules for GitHub Pages compatibility)
- `style.css` - Application styling
- CSV data files: `projectcode.csv`, `productcode.csv`, `activityType.csv`

### Data Model
- **Week Keys**: Format `YYYY-Www` (e.g., "2024-W25")
- **Timesheet Entries**: Array of work records per week
- **Global Basic Info**: Employee name and type (Internal/Outsource) shared across all weeks
- **CSV Reference Data**: Project codes, product codes, activity types

### Zone and Project Relationship
- **Zone Selection Impact**: When zone is changed, the PM field is automatically cleared
- **PM Lookup Logic**: PM lookup requires both Zone and Project to be considered together, as there can be projects with the same name across different zones
- **Cascading Updates**: Zone changes trigger updates to Project and Product Module dropdowns, and clear the PM field

### Basic Info Import Handling
- **Data Consistency Check**: When importing CSV files, the system compares CSV basic info with existing local data
- **Consistent Data**: If data matches, shows confirmation dialog with "Continue Import" and "Cancel Import" options
- **Inconsistent Data**: If data conflicts, shows selection dialog with only two options:
  - "Use Local Data" - Keep current system data  
  - "Use CSV Data" - Replace with imported data
  - No cancel option - user must choose one of the two data sources
- **User Experience**: Clean interface with only relevant buttons visible

## Development Commands

Since this is a frontend-only application, there are no build commands. The application runs directly in a web browser by opening `index.html`.

### Testing
- Open `index.html` in a web browser
- Use browser developer tools for debugging
- Check browser console for JavaScript errors

### CSV Data Files
The application expects these CSV files in the root directory:
- `projectcode.csv` - Project reference data
- `productcode.csv` - Product module reference data  
- `activityType.csv` - Activity type reference data

## Key Features

### Multi-week Management
- Dashboard shows cards for all created timesheets
- Each week is identified by `YYYY-Www` format
- Supports creating, editing, deleting, and copying weeks

### Work Hour Tracking
- 13 fields per timesheet entry including task, zone, project, hours, dates
- Automatic total hour calculation (regular + overtime)
- Date validation within week boundaries
- Normalization mode for weeks exceeding 40 regular hours

### Data Import/Export
- CSV export functionality with proper UTF-8 encoding
- CSV import with automatic week grouping and conflict resolution
- Normalization calculations for export (weeks > 40 hours)
- Basic info conflict handling with user choice dialogs

### TPM Validation Tool
- Independent validation dashboard (`tpm-validator.html`)
- Admin/Training activity validation rules
- 8-hour regular hours validation
- Weekly total hours validation
- Batch processing for multiple CSV files
- Detailed validation reports

### Localization
- Interface is in Traditional Chinese
- Date formats follow YYYY-MM-DD standard
- Week calculation starts from Sunday

## Common Development Patterns

### Bundled Application Structure
All functionality is contained within `app-bundled.js` - no module imports needed.

### localStorage Operations
```javascript
const data = loadAllTimesheets(); // Load all timesheet data
saveAllTimesheets(data); // Save all timesheet data
```

### Week Key Generation
```javascript
const weekKey = `${year}-W${weekNumber.toString().padStart(2, '0')}`;
```

### Date Calculations
The application uses a Sunday-to-Saturday week system. Week numbers are calculated from the first Sunday of the year.

### Zone and PM Field Management
When implementing zone/project/PM relationships:
```javascript
// Zone change automatically clears PM field
zoneSelect.addEventListener('change', function() {
    const pmField = document.getElementById('pm');
    if (pmField) {
        pmField.value = ''; // Clear PM when zone changes
    }
});
```

**Important**: PM lookup must consider both Zone AND Project because projects with the same name can exist across different zones.

### Basic Info Import Dialog Patterns
When implementing basic info conflict handling:
```javascript
// For consistent data - confirmation dialog
const choice = await showBasicInfoChoiceDialog(
    'Basic data is consistent, continue import?',
    'Continue Import',
    'Cancel Import',
    true // isConfirmDialog = true
);

// For inconsistent data - selection dialog  
const choice = await showBasicInfoChoiceDialog(
    'Data conflict detected, choose which to use:',
    localDataDisplay,
    csvDataDisplay,
    false // isConfirmDialog = false
);
```

**Return Values**: 
- `1` = First option selected (Continue/Use Local)
- `2` = Second option selected (Cancel/Use CSV)

**Note**: For inconsistent data dialogs, only options 1 and 2 are available (no cancel option).

### TPM Validation Patterns
When implementing TPM validation features:
```javascript
// Validate Admin/Training rules
function validateAdminTrainingRules(entries) {
    return entries.filter(entry => {
        if (entry.activityType === 'Admin / Training') {
            return entry.zone === 'Admin' && 
                   entry.project === 'Admin' && 
                   entry.productModule === 'Non Product Non Product';
        }
        return true;
    });
}

// Validate regular hours (max 8 per entry)
function validateRegularHours(entries) {
    return entries.filter(entry => entry.regularHours <= 8);
}

// Validate weekly total hours
function validateWeeklyTotalHours(entries) {
    const totalHours = entries.reduce((sum, entry) => sum + entry.ttlHours, 0);
    return totalHours >= 0 && totalHours <= 168; // Max hours in a week
}
```

## Error Handling

The application includes validation for:
- Date ranges within week boundaries
- Required form fields
- Hour limits (0-24 range for OT, 0-8 range for regular hours)
- CSV import data integrity and basic info conflicts
- Week key format validation
- Admin/Training activity consistency
- PM field dependency on Zone + Project combination
- TPM compliance rules

## Browser Compatibility

Requires modern browsers with support for:
- ES6 modules
- localStorage
- Blob API for CSV downloads
- Modern CSS features (Grid, Flexbox)
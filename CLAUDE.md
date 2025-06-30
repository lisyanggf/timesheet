# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- `app-bundled.js` - Complete application logic in a single bundled file (no ES6 modules for GitHub Pages compatibility)

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
- **Inconsistent Data**: If data conflicts, shows selection dialog with three options:
  - "Use Local Data" - Keep current system data and continue import
  - "Use CSV Data" - Replace with imported data and continue import
  - "Cancel Import" - Cancel the import operation entirely
- **User Experience**: Always provide cancel option to give users full control over import process

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
- CSV import with automatic week grouping
- Normalization calculations for export

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

**Important**: PM lookup must consider both Zone AND Project because projects with the same name can exist across different zones. For example:
- ERP zone + "Maintenance" project → PM: "barry"  
- Customer Portal zone + "Maintenance" project → PM: might be different
The lookup uses: `projectList.find(p => p.Zone === selectedZone && p.Project === selectedProject)`

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

// For inconsistent data - selection dialog with cancel option
const choice = await showThreeChoiceDialog(
    'Data conflict detected, choose which to use:',
    'Use Local Data',
    'Use CSV Data', 
    'Cancel Import'
);
```

**Return Values**: 
- `1` = First option selected (Continue/Use Local)
- `2` = Second option selected (Use CSV)
- `3` = Third option selected (Cancel Import)

**Note**: For both consistent and inconsistent data dialogs, a cancel option is always available to give users full control.

## Error Handling

The application includes validation for:
- Date ranges within week boundaries
- Required form fields
- Hour limits (0-24 range)
- CSV import data integrity
- Week key format validation

## Browser Compatibility

Requires modern browsers with support for:
- ES6 modules
- localStorage
- Blob API for CSV downloads
- Modern CSS features (Grid, Flexbox)
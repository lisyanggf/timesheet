# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Chinese timesheet management web application built with vanilla HTML, CSS, and JavaScript. It allows employees to create weekly timesheets, manage work hours, and export data to CSV format. The application uses localStorage for data persistence and supports multi-week management.

## Architecture

### Core Structure
- **Frontend-only application**: No backend server, runs entirely in the browser
- **Modular JavaScript**: Core functionality is split across multiple ES6 modules in the `modules/` directory
- **Data persistence**: Uses localStorage to store timesheet data and global employee information
- **CSV integration**: Loads reference data from CSV files (project codes, product codes, activity types)

### Key Files
- `index.html` - Main dashboard showing all timesheet cards
- `edit.html` - Timesheet editing interface for individual weeks
- `app.js` - Main application logic and entry points
- `modules/` - Modular JavaScript files:
  - `storageModule.js` - localStorage operations
  - `csvModule.js` - CSV data loading and parsing
  - `dateModule.js` - Date calculations and week number logic
  - `formModule.js` - Form validation and data handling
  - `uiModule.js` - UI operations and modal management

### Data Model
- **Week Keys**: Format `YYYY-Www` (e.g., "2024-W25")
- **Timesheet Entries**: Array of work records per week
- **Global Basic Info**: Employee name and type (Internal/Outsource) shared across all weeks
- **CSV Reference Data**: Project codes, product codes, activity types

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

### Module Imports
```javascript
import { functionName } from './modules/moduleName.js';
```

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
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Timesheet Management System** - A pure frontend web application for managing weekly timesheets with automatic validation, CSV import/export, and local storage persistence. Currently at version 3.3.3.

## Architecture

### Pure Frontend Design
- **No backend server** - Runs entirely in browser
- **Single-file deployment** - All logic in `app-bundled.js` (no ES6 modules)
- **localStorage persistence** - All data stored client-side
- **Static hosting** - Designed for GitHub Pages deployment

### Core Files
- `index.html` - Main page with timesheet card list
- `edit.html` - Weekly timesheet editing interface
- `tpm-validator.html` - TPM validation dashboard (11 validation rules)
- `app-bundled.js` - All application logic bundled in single file
- `style.css` - Responsive CSS with Grid/Flexbox
- CSV files - Reference data (projects, products, activities)

## Key Development Patterns

### Data Storage Structure
```javascript
// localStorage keys:
'timesheets' -> { "2024-W25": [...entries] }
'globalBasicInfo' -> { employeeName, employeeType }
```

### Week Calculation (Sunday-based)
- Format: `YYYY-Www` (e.g., "2024-W25")
- Week starts Sunday, ends Saturday
- First week starts on first Sunday of year

### Zone-Project-PM Linkage
1. Zone selection filters available projects/products
2. Project selection auto-fills PM field
3. Admin/Training activities have special validation rules

## Testing & Validation

### No Package.json - Pure Static Site
This is a static HTML/JS/CSS application with no build process:
- Open `index.html` directly in browser for testing
- Use local HTTP server for production-like testing: `python -m http.server 8000`

### Validation Rules (TPM Validator)
1. Employee name required
2. Employee type (Internal/Outsource) required  
3. Zone required for each entry
4. Project required for each entry
5. Product module required for each entry
6. Activity type required for each entry
7. Valid date within week range
8. Regular hours ≤ 8
9. Admin/Training zone-project consistency
10. Total weekly hours = 40 (with normalization option)
11. Total hours = regular + overtime for each row

## CSV Import/Export

### Export Features
- UTF-8 encoding with BOM for Excel compatibility
- Normalization mode for >40 hour weeks
- Filename: `工時表_YYYY-Www.csv`

### Import Flow (app-bundled.js)
1. **Entry Point**: `btn-import` click → `importTimesheet()` (line 1593)
2. **File Selection**: `import-file` input change event (line 2743)
3. **CSV Parsing**: `parseCSV()` function (line 1382) - handles BOM, line parsing
4. **Date Detection**: `detectSourceWeekFromCSV()` (line 162) - finds source week
5. **Date Shifting**: `shiftDateByOffset()` (line 193) - adjusts dates for target week
6. **Conflict Resolution**: Shows dialog for overwrite/append/cancel (line 2807)

### Import Validation (app-bundled.js)
- `validateRegularHours()` (line 1842) - Max 8 hours for regular time
- `validateZoneChange()` (line 1906) - Admin/Training special rules
- Basic field validation during form submission

### TPM Validator (tpm-validator.html) - 11 Validation Rules
Located in lines 620-920, validates:
1. **Required Fields** (line 610) - Employee, Zone, Project, Product, Activity
2. **Date Format** (line 668) - Strict YYYY/MM/DD format
3. **Regular Hours** (line 696) - Max 8 hours, no negative
4. **Zone/Project** (line 717) - Valid combination from projectcode.csv
5. **Zone/Product** (line 741) - Valid combination from productcode.csv
6. **Project/PM Mapping** (line 765) - Correct PM for project
7. **Admin/Training** (line 792) - Must use Admin zone/project
8. **Activity Type** (line 822) - Valid from activityType.csv
9. **Numeric Fields** (line 845) - Valid numbers for hours
10. **Weekly Total** (line 875) - Exactly 40 regular hours/week
11. **Total Calculation** (line 899) - Total = Regular + OT hours

## Browser APIs Used
- localStorage for persistence
- FileReader API for CSV import
- Blob + URL.createObjectURL for CSV export
- No external dependencies or frameworks

## Common Tasks

### Adding New Validation Rule
1. Edit validation logic in `app-bundled.js`
2. Update TPM validator in `tpm-validator.html`
3. Test with sample CSV data

### Modifying Zone/Project Data
1. Update relevant CSV files (projectcode.csv, productcode.csv)
2. Refresh page to reload CSV data
3. Verify zone-project linkage still works

### Debugging Data Issues
```javascript
// Check localStorage in browser console:
JSON.parse(localStorage.getItem('timesheets'))
JSON.parse(localStorage.getItem('globalBasicInfo'))
```

## Deployment

### GitHub Pages
1. Push changes to main branch
2. Site auto-deploys to: `https://[username].github.io/timesheet/`

### Local Testing
```bash
# Any static server works:
python -m http.server 8000
# or
npx serve .
```

## Important Behaviors

### Admin/Training Special Rules
- Zone must be "Admin"
- Project must be "Admin / Training"
- Automatically enforced on selection

### Week Total Normalization
- When week total >40 hours, export offers normalization
- Adjusts regular hours proportionally
- Preserves overtime hours

### Date Alignment
- All dates auto-align to selected week range
- Import shifts dates to match target week
- Validation prevents out-of-range dates
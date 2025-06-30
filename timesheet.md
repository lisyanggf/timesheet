# Timesheet Application User Guide

## Overview

This timesheet management application allows employees to create weekly timesheets, manage work hours, and export data to CSV format. The application runs entirely in the browser and uses localStorage for data persistence.

## Key Features

- **Multi-week Management**: Create and manage timesheets for different weeks with card-based interface
- **Data Validation**: Automatic field validation and data consistency checks
- **CSV Import/Export**: Import existing data and export timesheets to CSV format with conflict resolution
- **Zone-based Filtering**: Project and product options are filtered based on selected zone
- **Activity Type Validation**: Special handling for Admin/Training activities
- **TPM Validation Tool**: Independent validation dashboard for timesheet compliance
- **PM Lookup System**: Automatic PM assignment based on Zone + Project combination
- **Basic Info Management**: Global employee information shared across all timesheets

## Data Validation Rules

### Regular Hours Limitation

**Regular hours cannot exceed 8 hours per entry.**

#### Validation Behavior
- **Real-time validation**: As you type in the regular hours field, the system monitors the value
- **Automatic correction**: If you enter more than 8 hours, the system will:
  - Show an alert: "正常工時不能超過8小時！" (Regular hours cannot exceed 8 hours!)
  - Automatically reset the value to 8 hours
  - Refocus the field for correction
  - Recalculate total hours automatically

#### Form Submission Protection
- **Pre-save validation**: Before saving any timesheet entry, the system validates regular hours
- **Save prevention**: If regular hours exceed 8, the save operation is blocked with the message: "正常工時不能超過8小時！請修正後再儲存。"
- **Field focus**: The system automatically focuses on the regular hours field for correction

#### Overtime Hours
- **No limit on OT hours**: Overtime hours can be any value as they represent additional work beyond regular hours
- **Total calculation**: Total hours = Regular hours (max 8) + OT hours (unlimited)

### Admin / Training Activity Rule

When you select **"Admin / Training"** as the activity type, the system will automatically enforce the following data consistency rules:

#### Automatic Field Setting
- **Zone**: Automatically set to "Admin"
- **Project**: Automatically set to "Admin"  
- **Product Module**: Automatically set to "Non Product Non Product"

#### Restrictions
- **Zone Lock**: Once "Admin / Training" is selected, you cannot change the Zone to anything other than "Admin"
- **Warning Message**: If you attempt to change the zone, you'll see this message:
  ```
  當活動類型為「Admin / Training」時，區域必須為「Admin」。
  如需變更區域，請先選擇其他活動類型。
  ```

#### How to Change Zone for Admin/Training Entries
1. First change the **Activity Type** to something other than "Admin / Training"
2. Then you can freely change the **Zone** to your desired value
3. Update **Project** and **Product Module** as needed for the new zone

### Data Consistency Benefits
This validation ensures that:
- ✅ All Admin/Training activities are properly categorized
- ✅ Reporting and analytics remain accurate
- ✅ Data export maintains consistency across different weeks
- ✅ No manual errors in zone/project/product assignment for admin activities

## General Usage Guidelines

### Creating a New Timesheet Entry
1. Select the appropriate **Activity Type** from the dropdown
2. Choose **Zone** (automatically set for Admin/Training)
3. Select **Project** (filtered by zone)
4. Choose **Product Module** (filtered by zone)
5. Enter work hours (Regular Hours and OT Hours)
6. Specify work dates
7. Add task description and comments

### Working with Different Zones
- **ERP**: Enterprise Resource Planning related activities
- **Customer Portal**: Customer-facing portal development
- **Admin**: Administrative tasks, training, and non-project activities
- **OA**: Office Automation systems

### CSV Import/Export
- **Export**: Use the "匯出本週" button to download timesheet data in UTF-8 encoded CSV format
- **Import**: Use the "匯入" function to load existing CSV data with automatic week grouping
- **Format**: The system handles CSV files with proper comma escaping for complex product names
- **Conflict Resolution**: When importing data with different basic info, system provides choice dialogs:
  - Consistent data: Confirmation dialog (Continue Import / Cancel Import)
  - Conflicting data: Selection dialog (Use Local Data / Use CSV Data) - no cancel option
- **Normalization**: Export includes normalization for weeks exceeding 40 regular hours

### Data Persistence
- All timesheet data is stored locally in your browser using localStorage
- Data persists between sessions and browser restarts
- Global basic info (employee name, type) is shared across all timesheets
- Use the export function to backup your data regularly
- Clear storage option available for data reset

### PM Lookup System
- **Zone + Project Dependency**: PM field is automatically populated based on both Zone and Project selection
- **Automatic Clearing**: When Zone changes, PM field is automatically cleared to ensure data consistency
- **Critical Note**: PM lookup must consider both Zone AND Project because projects with the same name can exist across different zones
- **Sequential Selection**: Always select Zone first, then Project, to get the correct PM assignment

### TPM Validation Tool
Access the independent TPM validation dashboard at `tpm-validator.html` for:
- **Admin/Training Validation**: Ensures compliance with Admin/Training activity rules
- **8-Hour Regular Hours Rule**: Validates that regular hours don't exceed 8 hours per entry
- **Weekly Total Hours Check**: Verifies total weekly hours are within acceptable ranges
- **Batch Processing**: Validate multiple CSV files simultaneously
- **Detailed Reports**: Get comprehensive validation results with specific rule violations

## Troubleshooting

### Common Issues

**Q: I can't change the zone after selecting Admin/Training**
A: This is expected behavior. Change the activity type first, then change the zone.

**Q: Product dropdown is empty when I select ERP zone**
A: Make sure the CSV files are properly loaded. Check the browser console for any loading errors.

**Q: CSV import shows parsing errors**
A: Ensure your CSV file uses proper quoting for fields containing commas, especially product names.

**Q: My timesheet data disappeared**
A: Data is stored locally. If you cleared browser data or switched browsers, the data may be lost. Always export your data regularly as backup.

**Q: PM field doesn't populate after selecting Project**
A: Ensure you have selected both Zone and Project. PM lookup requires both fields. If Zone was changed, the PM field is automatically cleared.

**Q: CSV import shows basic info conflict dialog**
A: This is normal when importing data with different employee information. Choose either "Use Local Data" to keep your current info or "Use CSV Data" to adopt the imported information.

**Q: TPM validation fails**
A: Check the specific validation rules in the TPM validator dashboard. Common issues include Admin/Training activities not using the correct zone/project combination or regular hours exceeding 8 hours.

### Browser Compatibility
- Requires modern browsers with ES6 support
- localStorage support required
- JavaScript must be enabled

## Version Information

This documentation is for Timesheet Application v3.2.3 which includes:
- Admin/Training activity validation feature
- Unified YYYY/MM/DD date format
- CSV import/export with conflict resolution
- TPM validation dashboard
- Zone/Project/PM lookup system
- Multi-week card-based management
- Global basic info management

## File Structure

The application consists of:
- `index.html` - Main dashboard with timesheet cards
- `edit.html` - Timesheet editing interface
- `tpm-validator.html` - TPM validation tool
- `app-bundled.js` - Complete application logic
- `style.css` - Application styling
- CSV data files: `projectcode.csv`, `productcode.csv`, `activityType.csv`

For technical support or feature requests, please contact your system administrator.
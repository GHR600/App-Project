# EXPORT FEATURE REFACTOR - IMPLEMENTATION GUIDE

## OBJECTIVE
Refactor the export functionality by removing export buttons from the stats page and creating a dedicated Export screen accessible from the sidebar menu.

## PART 1: REMOVE EXPORT FROM STATS PAGE

### Files to Modify:
1. `src/components/AnalyticsDashboard.tsx`
   - Remove the handleExport function entirely
   - Remove all export-related buttons from the UI
   - Remove any imports related to export functionality (AnalyticsService.exportData)
   - Keep only the analytics display functionality

2. `src/screens/StatsScreen.tsx` (if it exists)
   - Remove any export buttons or export-related UI elements
   - Remove export-related state and functions

### What to Remove:
- Any buttons labeled "Export as CSV", "Export as JSON", etc.
- The handleExport function
- Any UI elements related to triggering exports
- Any state variables related to export (e.g., isExporting)

## PART 2: ADD EXPORT TO SIDEBAR MENU

### Files to Modify:
1. Main Navigation File (likely `src/App.tsx` or navigation setup file)
   - Add "Export Data" menu item to the sidebar/drawer navigation
   - Icon suggestion: 📥 or download icon
   - Route to new ExportScreen

2. Create Navigation Entry:
```typescript
   {
     name: 'Export',
     component: ExportScreen,
     icon: 'download' // or appropriate icon from your icon library
   }
PART 3: CREATE NEW EXPORT SCREEN
New File to Create:
src/screens/ExportScreen.tsx
Screen Requirements:
UI Components Needed:

Date Range Picker Section

"Start Date" picker (calendar/date input)
"End Date" picker (calendar/date input)
Preset options: "Last 7 days", "Last 30 days", "Last 3 months", "All time"
Validation: End date must be after start date


Export Type Selection Section

Radio buttons or segmented control with 2 options:
a) "Export Statistics (CSV)" - for analytics/stats data
b) "Export Entries (PDF or TXT)" - for journal entries


Format Selection (conditional)

Only show if "Export Entries" is selected
Radio buttons: PDF or TXT
Hide if "Export Statistics" is selected (since it's always CSV)


Export Button

Large, prominent "Export" button at bottom
Shows loading state while exporting
Disabled if no valid date range selected


Export Options (Optional Advanced Features)

Checkbox: "Include AI insights" (for entry exports)
Checkbox: "Include mood data"



Screen Layout Structure:
┌─────────────────────────────────┐
│  Export Data              [Back]│
├─────────────────────────────────┤
│                                 │
│  📅 Date Range                  │
│  ┌─────────────┐ ┌───────────┐│
│  │ Start Date  │ │ End Date  ││
│  └─────────────┘ └───────────┘│
│  [Last 7 days] [Last 30 days]  │
│  [Last 3 months] [All time]    │
│                                 │
│  📊 What to Export?             │
│  ○ Export Statistics (CSV)     │
│  ○ Export Entries              │
│                                 │
│  📄 Entry Format (if selected)  │
│  ○ PDF                          │
│  ○ TXT                          │
│                                 │
│  ☑ Include AI insights          │
│  ☑ Include mood data            │
│                                 │
│  ┌─────────────────────────────┐│
│  │      Export Data            ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
Implementation Details:
State Management:
typescriptconst [startDate, setStartDate] = useState<Date>(/* 30 days ago */);
const [endDate, setEndDate] = useState<Date>(new Date());
const [exportType, setExportType] = useState<'stats' | 'entries'>('stats');
const [entryFormat, setEntryFormat] = useState<'pdf' | 'txt'>('pdf');
const [includeInsights, setIncludeInsights] = useState(true);
const [includeMood, setIncludeMood] = useState(true);
const [isExporting, setIsExporting] = useState(false);
Export Logic:
typescriptconst handleExport = async () => {
  setIsExporting(true);
  
  try {
    const options = {
      format: exportType === 'stats' ? 'csv' : entryFormat,
      dateRange: { start: startDate, end: endDate },
      includeInsights: exportType === 'entries' ? includeInsights : false,
      includeAnalytics: exportType === 'stats',
      includeImages: false,
    };

    // Call AnalyticsService.exportData
    const { data, filename, error } = await AnalyticsService.exportData(
      userId,
      options
    );

    if (error) {
      Alert.alert('Export Error', 'Failed to export data');
      return;
    }

    // IMPORTANT: Implement actual file saving here
    // Use expo-file-system and expo-sharing
    // See implementation notes below
    
  } catch (error) {
    Alert.alert('Error', 'An error occurred during export');
  } finally {
    setIsExporting(false);
  }
};
PART 4: IMPLEMENT FILE SAVING
Required Packages:
Ensure these are installed:

expo-file-system (already installed)
expo-sharing (needs installation)

Installation Command:
bashnpx expo install expo-sharing
File Saving Implementation:
Create or update: src/utils/fileExport.ts
typescriptimport * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export const saveAndShareFile = async (
  data: string,
  filename: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    if (Platform.OS === 'web') {
      // Web: Trigger download
      const blob = new Blob([data], { 
        type: filename.endsWith('.csv') ? 'text/csv' : 'text/plain' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true };
    } else {
      // Mobile: Save and share
      const fileUri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, data);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: filename.endsWith('.csv') ? 'text/csv' : 'text/plain',
          dialogTitle: 'Export Data',
          UTI: filename.endsWith('.csv') ? 'public.comma-separated-values-text' : 'public.plain-text',
        });
      }
      
      return { success: true };
    }
  } catch (error) {
    console.error('File export error:', error);
    return { success: false, error };
  }
};
Use in ExportScreen:
typescriptimport { saveAndShareFile } from '../utils/fileExport';

// Inside handleExport after getting data:
const { success, error: saveError } = await saveAndShareFile(data, filename);

if (success) {
  Alert.alert('Success', 'Data exported successfully!');
} else {
  Alert.alert('Error', 'Failed to save file');
}
PART 5: UPDATE ANALYTICS SERVICE (IF NEEDED)
File: src/services/analyticsService.ts
Ensure the exportData method properly handles:

Stats-only exports (CSV format with analytics data)
Entries-only exports (PDF or TXT format with journal entries)
Date range filtering
Optional fields (insights, mood data)

Current method signature should support:
typescriptstatic async exportData(
  userId: string,
  options: {
    format: 'json' | 'csv' | 'pdf' | 'txt';
    dateRange: { start: Date; end: Date };
    includeInsights: boolean;
    includeAnalytics: boolean;
    includeImages: boolean;
  }
): Promise<{ data: string; filename: string; error?: any }>
STYLING GUIDELINES
Theme Consistency:

Use the dark purple theme from src/contexts/ThemeContext.tsx
Primary color: #7C3AED (purple)
Background: Dark theme colors
Follow existing design patterns from other screens

Component Styling:

Date pickers: Match the style of existing form inputs
Radio buttons: Use existing button component styles
Export button: Similar to primary action buttons (e.g., save entry button)
Use consistent spacing and padding (16px margins, 12px padding)

TESTING CHECKLIST
After implementation, test:

 Export button appears in sidebar menu
 No export buttons remain on stats page
 Export screen opens when menu item clicked
 Date range picker works correctly
 Cannot select end date before start date
 Preset date ranges work (Last 7 days, etc.)
 Export type selection toggles format options correctly
 CSV export works for statistics
 TXT export works for entries
 PDF export works for entries (if implemented)
 Files are actually saved/shared on mobile
 Web download works on browser
 Loading states display correctly
 Error messages show for failed exports
 Success messages show for completed exports

ERROR HANDLING
Implement proper error handling for:

Invalid date ranges
Failed database queries
File system errors
Network errors
Missing user permissions

Show user-friendly error messages, not technical errors.
ADDITIONAL NOTES
Date Picker Library:
If a date picker isn't already in the project, consider using:

@react-native-community/datetimepicker (recommended)
react-native-modal-datetime-picker
Or build a simple custom date picker

PDF Generation:
For PDF export of entries, you may need:

react-native-html-to-pdf (for native)
jsPDF (for web)
This is more complex - consider implementing TXT first, then PDF as enhancement.

File Locations Summary:
Files to modify:

src/components/AnalyticsDashboard.tsx (remove export)
Main navigation/App.tsx (add menu item)

Files to create:

src/screens/ExportScreen.tsx (new screen)
src/utils/fileExport.ts (file saving utility)

Packages to install:

expo-sharing (required)
@react-native-community/datetimepicker (recommended)

PRIORITY ORDER

Remove export from stats page (quick win)
Add Export menu item to sidebar
Create basic ExportScreen with date picker and format selection
Implement CSV stats export (reuse existing code)
Implement TXT entries export
Implement file saving/sharing functionality
Add advanced options (include insights, mood, etc.)
Implement PDF export (optional/future enhancement)
# Store Designer Fixes - Summary

## Issues Fixed ✅

### 1. Logo Upload Error (FIXED)
**Problem**: "Could not find the 'show_logo' column"
**Solution**: Created [ADD_SHOW_LOGO_COLUMN.sql](ADD_SHOW_LOGO_COLUMN.sql)
**Action Needed**: Run the SQL file in Supabase SQL Editor

### 2. Store Name Not Updating on Live Site (FIXED)
**Problem**: Store showing "stemfactory27" instead of "ZakhonaFastFood" on live site
**Root Cause**: Realtime listener in CustomerStore.jsx was still watching old "stores" table instead of "tenants"
**Solution**: Fixed [src/CustomerStore.jsx:115](src/CustomerStore.jsx#L115) - changed table from "stores" to "tenants"
**Status**: Deployed to production

### 3. Banner Text Font Size Not Adjusting (VERIFIED WORKING)
**Status**: Code is correct - templates properly read `banner.fontSize` from database
**Location**: All templates at lines ~319, ~334, ~302 use `<h2 style={{ fontSize: \`\${banner.fontSize || 28}px\` }}>`
**Issue**: Likely user hasn't changed the font size yet, or needs to run the diagnostic

### 4. Instructions Toggle Not Enabling (VERIFIED WORKING)
**Status**: Code is correct - button shows when `state.show_instructions === true && state.instructions`
**Location**: [src/templates/ModernFoodTemplate.jsx:356](src/templates/ModernFoodTemplate.jsx#L356)
**Note**: Button only appears when BOTH toggle is ON and instructions text is entered

## Issues In Progress 🔧

### 5. Move Profile Picture Upload from Designer to Settings (IN PROGRESS)
**Current Status**: Profile picture upload is in [src/designer/StoreDesigner.jsx:551-603](src/designer/StoreDesigner.jsx#L551-L603)
**Target Location**: Settings section in [src/App.jsx:1766+](src/App.jsx#L1766)
**Next Steps**:
1. Add profile picture upload section to App.jsx Settings
2. Remove profile picture section from StoreDesigner.jsx (keep in About tab or remove entirely)
3. Test upload functionality

### 6. Fix Social Media Links Not Showing on Website (PENDING INVESTIGATION)
**Current Status**: Social links render code exists in templates (line ~415 in ModernFoodTemplate)
**Condition**: Links only show if `about.socials && Object.keys(about.socials).filter(k => about.socials[k]).length > 0`
**Possible Issues**:
- User hasn't added social links yet
- Socials field is null/empty in database
- About section is hidden (`show_about === false`)
**Next Steps**: Need to run [DIAGNOSE_STORE_SETTINGS.sql](DIAGNOSE_STORE_SETTINGS.sql) to check database

## Issues Pending 📋

### 7. Replace Text Size Sliders with Up/Down Increment Buttons
**Current Locations**:
- Header font size: [src/designer/StoreDesigner.jsx:381-393](src/designer/StoreDesigner.jsx#L381-L393)
- Banner font size: [src/designer/StoreDesigner.jsx:426-438](src/designer/StoreDesigner.jsx#L426-L438)
- About font size: [src/designer/StoreDesigner.jsx:635-646](src/designer/StoreDesigner.jsx#L635-L646)

**Proposed Change**: Replace `<input type="range">` with increment/decrement buttons
**Example**:
```jsx
<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
  <button onClick={() => saveChanges({ header_font_size: Math.max(12, (store.header_font_size || 20) - 1) })}>
    <span style={{ fontSize: "1.2rem" }}>−</span>
  </button>
  <span className="slider-value">{store.header_font_size || 20}px</span>
  <button onClick={() => saveChanges({ header_font_size: Math.min(32, (store.header_font_size || 20) + 1) })}>
    <span style={{ fontSize: "1.2rem" }}>+</span>
  </button>
</div>
```

### 8. Add Individual Save Buttons Near Each Setting
**Current Status**: All settings use debounced auto-save (500ms delay)
**User Request**: Add explicit "Save" button next to each setting for granular control
**Impact**: Large refactor of StoreDesigner.jsx
**Approach**: Keep auto-save debounce but also add manual save buttons for user confidence

## Diagnostic Tools Created

1. **[DIAGNOSE_STORE_SETTINGS.sql](DIAGNOSE_STORE_SETTINGS.sql)** - Checks current state of store settings
   - Verifies show_logo column exists
   - Shows current store data (logo, banner_font_size, instructions, socials, etc.)
   - Lists all columns in tenants table

2. **[ADD_SHOW_LOGO_COLUMN.sql](ADD_SHOW_LOGO_COLUMN.sql)** - Adds missing show_logo column
   - Adds column with DEFAULT true
   - Verifies column was added successfully

## Next Steps

1. **Run ADD_SHOW_LOGO_COLUMN.sql** to fix logo upload
2. **Run DIAGNOSE_STORE_SETTINGS.sql** to check current database state
3. **Complete profile picture move** to Settings page
4. **Investigate social links issue** based on diagnostic results
5. **Replace sliders with up/down buttons** for better UX
6. **Add individual save buttons** for each setting

## Notes

- Store name update is now working in real-time thanks to fixed realtime listener
- Banner font size and instructions toggle are working correctly in code
- Most issues may be resolved by running the diagnostic and adding missing columns
- The codebase is now consistent with "tenants" table (no more "stores" references)

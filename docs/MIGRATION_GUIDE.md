# Database Migration Guide: Unified Entry System with Tags

## Overview

This migration unifies the journal entries and notes into a single entry system with flexible tags, removing the old `entry_type` field and replacing it with a `tags` array.

## What Changed

### Before (Old System)
- Separate `entry_type` field: `'journal' | 'note'`
- Hard-coded distinction between journals and notes
- Limited flexibility for categorization

### After (New System)
- Unified entry model with optional `tags: string[]`
- Flexible tagging system (e.g., `['journal']`, `['note']`, `['work', 'personal']`)
- Same table structure, more flexible data model

## Database Changes

### 1. Schema Changes

**Added Column:**
```sql
ALTER TABLE journal_entries
ADD COLUMN tags TEXT[] DEFAULT '{}';
```

**Added Index:**
```sql
CREATE INDEX idx_journal_entries_tags ON journal_entries USING GIN(tags);
```

### 2. Data Migration

The migration automatically converts existing entries:

- **Entries with `mood_rating`** → Tagged as `['journal']`
- **Entries without `mood_rating`** → Tagged as `['note']`

## TypeScript Interface Changes

### Before
```typescript
interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  mood_rating?: number;
  entry_type: 'journal' | 'note';  // ❌ Removed
  title?: string;
  created_at: string;
  updated_at: string;
}
```

### After
```typescript
interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  mood_rating?: number;
  tags?: string[];  // ✅ Added - flexible tagging
  title?: string;
  created_at: string;
  updated_at: string;
}
```

## Migration Steps

### Step 1: Apply Database Migrations

Run the SQL migrations in Supabase dashboard or via CLI:

```bash
# Migration 1: Add tags column
supabase db push supabase/migrations/20250101000000_add_tags_to_journal_entries.sql

# Migration 2: Convert entry_type to tags
supabase db push supabase/migrations/20250101000001_migrate_entry_type_to_tags.sql
```

### Step 2: Run TypeScript Migration Script (Optional)

If you need to run the migration from your application:

```bash
npx ts-node scripts/migrate-entries-to-tags.ts
```

This script:
- ✅ Fetches all entries
- ✅ Determines appropriate tags based on `mood_rating`
- ✅ Updates entries in batches
- ✅ Provides detailed progress reporting

### Step 3: Update Your Code

The TypeScript interfaces have been updated. Key changes:

1. **Remove `entry_type` references**
   ```typescript
   // ❌ Old
   if (entry.entry_type === 'journal') { }

   // ✅ New
   if (entry.tags?.includes('journal')) { }
   ```

2. **Use tags for categorization**
   ```typescript
   // ✅ New way
   const isJournal = entry.tags?.includes('journal');
   const isNote = entry.tags?.includes('note');
   const isWork = entry.tags?.includes('work');
   ```

3. **Creating entries with tags**
   ```typescript
   // ✅ New way
   await createEntry({
     content: 'My journal entry',
     tags: ['journal', 'personal'],
     mood_rating: 5
   });
   ```

## New Features Enabled

### 1. Multiple Tags Per Entry
```typescript
tags: ['journal', 'work', 'important']
```

### 2. Custom Categorization
```typescript
tags: ['personal', 'reflection', 'goals']
```

### 3. Filtering by Tags
```typescript
// Find all work-related entries
const workEntries = entries.filter(e =>
  e.tags?.includes('work')
);

// Find entries with multiple tags
const importantWorkEntries = entries.filter(e =>
  e.tags?.includes('work') && e.tags?.includes('important')
);
```

## Rollback Plan

If you need to rollback:

```sql
-- Remove tags column
ALTER TABLE journal_entries DROP COLUMN IF EXISTS tags;

-- Remove index
DROP INDEX IF EXISTS idx_journal_entries_tags;
```

Note: This will lose all tag data. Make sure to backup before rollback.

## Testing

After migration, verify:

1. **All entries have appropriate tags:**
   ```sql
   SELECT id, tags, mood_rating
   FROM journal_entries
   WHERE tags IS NULL OR tags = '{}';
   ```

2. **Tag distribution:**
   ```sql
   SELECT unnest(tags) as tag, COUNT(*)
   FROM journal_entries
   GROUP BY tag;
   ```

3. **Application functionality:**
   - Create new entries with tags
   - Edit existing entries
   - Filter by tags
   - Display entries correctly

## Support

If you encounter issues:

1. Check migration logs for errors
2. Verify database schema matches expected state
3. Review TypeScript type errors
4. Test with a small subset of data first

## Files Modified

- `src/types/index.ts` - Updated JournalEntry interface
- `src/config/supabase.ts` - Updated DatabaseJournalEntry interface
- `src/services/entryService.ts` - Updated service methods
- `src/components/DayCard.tsx` - Updated to use tags
- `supabase/migrations/*.sql` - Database migrations
- `scripts/migrate-entries-to-tags.ts` - Migration script

## Summary

This migration provides:
- ✅ More flexible entry categorization
- ✅ Support for multiple tags per entry
- ✅ Backward compatibility (journal/note tags)
- ✅ Clean, unified data model
- ✅ Better scalability for future features

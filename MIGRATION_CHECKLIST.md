# Migration Checklist: Unified Entry System with Tags

Use this checklist to ensure a smooth migration from the old entry_type system to the new tags-based system.

## Pre-Migration

### Backup
- [ ] Create database backup
- [ ] Export current entries to CSV/JSON
- [ ] Document current entry counts by type

### Preparation
- [ ] Review `MIGRATION_GUIDE.md`
- [ ] Review `docs/tags-usage-guide.md`
- [ ] Test migration on development/staging database first
- [ ] Notify team members of upcoming changes

## Database Migration

### Step 1: Add Tags Column
- [ ] Run migration: `20250101000000_add_tags_to_journal_entries.sql`
- [ ] Verify column added: `\d journal_entries` (PostgreSQL)
- [ ] Verify index created: Check `idx_journal_entries_tags`

### Step 2: Migrate Data
- [ ] Run migration: `20250101000001_migrate_entry_type_to_tags.sql`
- [ ] Verify all entries have tags
- [ ] Check tag distribution

### Verification Queries
```sql
-- Check entries without tags
SELECT COUNT(*) FROM journal_entries WHERE tags IS NULL OR tags = '{}';
-- Expected: 0

-- Check tag distribution
SELECT unnest(tags) as tag, COUNT(*)
FROM journal_entries
GROUP BY tag
ORDER BY COUNT(*) DESC;

-- Sample entries with tags
SELECT id, title, mood_rating, tags
FROM journal_entries
LIMIT 10;
```

## Code Deployment

### TypeScript Updates
- [x] Updated `src/types/index.ts`
- [x] Updated `src/config/supabase.ts`
- [x] Updated `src/services/entryService.ts`
- [x] Updated `src/services/journalService.ts`
- [x] Updated `src/components/DayCard.tsx`

### Build & Test
- [ ] Run TypeScript compiler: `npx tsc --noEmit`
- [ ] Run tests (if available)
- [ ] Build application successfully

### Deployment
- [ ] Deploy updated application code
- [ ] Monitor error logs
- [ ] Test key features:
  - [ ] Create new journal entry
  - [ ] Create new note
  - [ ] Edit existing entry
  - [ ] View entries list
  - [ ] Filter entries
  - [ ] Tags display correctly

## Post-Migration

### Verification
- [ ] All entries have appropriate tags
- [ ] No TypeScript errors
- [ ] UI displays tags correctly
- [ ] Create/edit/delete operations work
- [ ] Performance is acceptable (check indexes)

### User Testing
- [ ] Create new journal entry with mood
  - [ ] Verify auto-tagged as 'journal'
- [ ] Create new entry without mood
  - [ ] Verify auto-tagged as 'note'
- [ ] Edit entry and add custom tags
  - [ ] Verify tags saved correctly
- [ ] Filter entries by tag
  - [ ] Verify filtering works

### Monitoring
- [ ] Monitor database queries
- [ ] Check application logs for errors
- [ ] Monitor performance metrics
- [ ] Collect user feedback

## Rollback Plan (If Needed)

### Emergency Rollback
- [ ] Revert application code to previous version
- [ ] Document issues encountered
- [ ] Plan fixes before retry

### Database Rollback (Use with Caution)
```sql
-- WARNING: This removes all tags
ALTER TABLE journal_entries DROP COLUMN IF EXISTS tags;
DROP INDEX IF EXISTS idx_journal_entries_tags;
```

## Success Criteria

All checkboxes must be ✅ before considering migration complete:

- [ ] Database schema updated successfully
- [ ] All entries migrated with tags
- [ ] No data loss occurred
- [ ] Application builds without errors
- [ ] All tests passing
- [ ] UI functions correctly
- [ ] Performance acceptable
- [ ] No critical bugs reported
- [ ] Team informed of changes
- [ ] Documentation updated

## Additional Notes

### Timeline
- **Preparation**: 1-2 hours
- **Database Migration**: 15-30 minutes
- **Code Deployment**: 30-60 minutes
- **Testing**: 1-2 hours
- **Total**: 3-5 hours

### Risk Level
- **Low**: Backward compatible, non-breaking changes
- **Data Loss Risk**: Very low (only adding new column)
- **Rollback Difficulty**: Easy (just column removal)

### Support Resources
- `MIGRATION_GUIDE.md` - Detailed guide
- `docs/tags-usage-guide.md` - Developer reference
- `MIGRATION_SUMMARY.md` - Quick overview
- `scripts/migrate-entries-to-tags.ts` - Migration script

## Team Signoffs

- [ ] **Developer**: Migration code reviewed
- [ ] **QA**: Testing plan approved
- [ ] **DevOps**: Deployment plan reviewed
- [ ] **Product**: Feature requirements met

## Post-Migration Cleanup (Optional)

After successful migration and testing:

- [ ] Remove old migration scripts from active codebase
- [ ] Archive backup files
- [ ] Update API documentation
- [ ] Update user documentation
- [ ] Announce new features to users

---

**Migration Status**: [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Rolled Back

**Migration Date**: _________________

**Performed By**: _________________

**Sign-off**: _________________

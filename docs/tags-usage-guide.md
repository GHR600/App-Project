# Tags System Usage Guide

## Overview

The app now uses a flexible tags system instead of the old `entry_type` field. This allows for better categorization and filtering of entries.

## Quick Reference

### Creating Entries with Tags

```typescript
// Journal entry
const journalEntry = await JournalService.createEntry(userId, {
  content: 'Today was amazing!',
  moodRating: 5,
  title: 'Great Day',
  tags: ['journal']  // Optional - will be inferred if not provided
});

// Note entry
const noteEntry = await JournalService.createEntry(userId, {
  content: 'Remember to buy groceries',
  title: 'Shopping List',
  tags: ['note', 'personal']
});

// Work journal
const workEntry = await JournalService.createEntry(userId, {
  content: 'Completed the database migration',
  moodRating: 4,
  tags: ['journal', 'work', 'achievement']
});
```

### Checking Entry Types

```typescript
// Check if entry is a journal
const isJournal = entry.tags?.includes('journal');

// Check if entry is a note
const isNote = entry.tags?.includes('note');

// Check for custom tags
const isWork = entry.tags?.includes('work');
const isImportant = entry.tags?.includes('important');
```

### Filtering Entries by Tags

```typescript
// Get all journal entries
const journals = entries.filter(e => e.tags?.includes('journal'));

// Get all notes
const notes = entries.filter(e => e.tags?.includes('note'));

// Get work-related entries
const workEntries = entries.filter(e => e.tags?.includes('work'));

// Get entries with multiple tags (AND logic)
const importantWorkJournals = entries.filter(e =>
  e.tags?.includes('journal') &&
  e.tags?.includes('work') &&
  e.tags?.includes('important')
);

// Get entries with any of the tags (OR logic)
const personalOrWork = entries.filter(e =>
  e.tags?.includes('personal') || e.tags?.includes('work')
);
```

### Updating Entry Tags

```typescript
// Add a tag to an entry
const updatedTags = [...entry.tags || [], 'important'];
await JournalService.updateEntry(userId, entryId, {
  tags: updatedTags
});

// Remove a tag from an entry
const updatedTags = (entry.tags || []).filter(tag => tag !== 'work');
await JournalService.updateEntry(userId, entryId, {
  tags: updatedTags
});

// Replace all tags
await JournalService.updateEntry(userId, entryId, {
  tags: ['journal', 'personal', 'reflection']
});
```

## Recommended Tags

### Built-in Tags
- `journal` - Main journal entries (usually with mood ratings)
- `note` - Quick notes or reminders

### Suggested Custom Tags
- `work` - Work-related entries
- `personal` - Personal reflections
- `goal` - Goals and aspirations
- `gratitude` - Gratitude entries
- `achievement` - Accomplishments
- `reflection` - Deep reflections
- `idea` - Ideas and brainstorms
- `important` - Important entries
- `draft` - Draft entries
- `favorite` - Favorite entries

## Database Queries

### SQL Examples

```sql
-- Find all entries with 'journal' tag
SELECT * FROM journal_entries
WHERE 'journal' = ANY(tags);

-- Find entries with multiple tags
SELECT * FROM journal_entries
WHERE tags @> ARRAY['work', 'important'];

-- Count entries by tag
SELECT unnest(tags) as tag, COUNT(*)
FROM journal_entries
GROUP BY tag
ORDER BY COUNT(*) DESC;

-- Find entries without any tags
SELECT * FROM journal_entries
WHERE tags IS NULL OR tags = '{}';
```

### Supabase Queries

```typescript
// Find entries with specific tag
const { data } = await supabase
  .from('journal_entries')
  .select('*')
  .contains('tags', ['journal']);

// Find entries with any of the tags
const { data } = await supabase
  .from('journal_entries')
  .select('*')
  .or('tags.cs.{journal},tags.cs.{note}');

// Find entries with all specified tags
const { data } = await supabase
  .from('journal_entries')
  .select('*')
  .contains('tags', ['work', 'important']);
```

## UI Components

### Displaying Tags

```typescript
// In a component
const TagsList = ({ entry }: { entry: JournalEntry }) => {
  if (!entry.tags || entry.tags.length === 0) {
    return null;
  }

  return (
    <View style={styles.tagsContainer}>
      {entry.tags.map(tag => (
        <View key={tag} style={styles.tag}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      ))}
    </View>
  );
};
```

### Tag Icons

```typescript
const getTagIcon = (tag: string): string => {
  const icons: Record<string, string> = {
    journal: '📝',
    note: '🗒️',
    work: '💼',
    personal: '👤',
    goal: '🎯',
    gratitude: '🙏',
    achievement: '🏆',
    reflection: '💭',
    idea: '💡',
    important: '⭐',
    draft: '📄',
    favorite: '❤️',
  };
  return icons[tag] || '🏷️';
};
```

## Best Practices

1. **Be Consistent**: Use lowercase tags for consistency
2. **Keep it Simple**: Don't over-tag entries
3. **Use Conventions**: Stick to the recommended tags when possible
4. **Document Custom Tags**: If you add new tags, document their purpose
5. **Validate Tags**: Ensure tags are strings and not empty

## Migration Notes

- Old `journal` type → `['journal']` tag
- Old `note` type → `['note']` tag
- Empty tags array is valid (equivalent to no tags)
- Tags are optional - entries without tags are valid

## Example Use Cases

### Personal Journal System
```typescript
// Morning journal
tags: ['journal', 'morning', 'routine']

// Evening reflection
tags: ['journal', 'evening', 'reflection']

// Gratitude entry
tags: ['journal', 'gratitude']
```

### Work Journal System
```typescript
// Daily standup notes
tags: ['note', 'work', 'standup']

// Project reflections
tags: ['journal', 'work', 'project']

// Meeting notes
tags: ['note', 'work', 'meeting']
```

### Mixed System
```typescript
// Important work achievement
tags: ['journal', 'work', 'achievement', 'important']

// Personal goal setting
tags: ['journal', 'personal', 'goal']

// Quick reminder
tags: ['note', 'reminder']
```

## Summary

The tags system provides:
- ✅ Flexible categorization
- ✅ Multiple tags per entry
- ✅ Easy filtering and searching
- ✅ Backward compatibility
- ✅ Extensibility for future features

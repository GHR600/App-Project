/**
 * Migration Script: Convert entry_type to tags
 *
 * This script migrates existing journal entries from the old entry_type system
 * to the new tags-based system.
 *
 * Usage:
 *   npx ts-node scripts/migrate-entries-to-tags.ts
 */

import { supabase } from '../src/services/supabaseClient';

interface LegacyEntry {
  id: string;
  user_id: string;
  entry_type?: 'journal' | 'note';
  mood_rating?: number;
  tags?: string[];
}

async function migrateEntriesToTags() {
  console.log('🚀 Starting migration: entry_type → tags');
  console.log('================================================');

  try {
    // Step 1: Fetch all entries
    console.log('\n📥 Fetching all entries...');
    const { data: entries, error: fetchError } = await supabase
      .from('journal_entries')
      .select('id, user_id, mood_rating, tags');

    if (fetchError) {
      console.error('❌ Error fetching entries:', fetchError);
      return;
    }

    if (!entries || entries.length === 0) {
      console.log('ℹ️  No entries found to migrate');
      return;
    }

    console.log(`✅ Found ${entries.length} entries`);

    // Step 2: Process entries and determine tags
    const entriesToUpdate: { id: string; tags: string[] }[] = [];

    for (const entry of entries) {
      const currentTags = entry.tags || [];
      let newTags = [...currentTags];

      // Logic: If entry has a mood_rating, it's a journal entry
      // Otherwise, treat it as a note
      if (entry.mood_rating !== null && entry.mood_rating !== undefined) {
        if (!newTags.includes('journal')) {
          newTags.push('journal');
        }
      } else {
        if (!newTags.includes('note')) {
          newTags.push('note');
        }
      }

      // Only update if tags have changed
      if (JSON.stringify(currentTags.sort()) !== JSON.stringify(newTags.sort())) {
        entriesToUpdate.push({ id: entry.id, tags: newTags });
      }
    }

    console.log(`\n📝 Entries to update: ${entriesToUpdate.length}`);

    if (entriesToUpdate.length === 0) {
      console.log('✅ All entries already have appropriate tags!');
      return;
    }

    // Step 3: Update entries in batches
    console.log('\n🔄 Updating entries...');
    let successCount = 0;
    let errorCount = 0;

    for (const entry of entriesToUpdate) {
      const { error: updateError } = await supabase
        .from('journal_entries')
        .update({ tags: entry.tags })
        .eq('id', entry.id);

      if (updateError) {
        console.error(`❌ Error updating entry ${entry.id}:`, updateError);
        errorCount++;
      } else {
        successCount++;
      }
    }

    // Step 4: Report results
    console.log('\n================================================');
    console.log('📊 Migration Results:');
    console.log(`   ✅ Successfully updated: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📈 Total processed: ${entriesToUpdate.length}`);
    console.log('================================================\n');

    if (errorCount === 0) {
      console.log('🎉 Migration completed successfully!');
    } else {
      console.log('⚠️  Migration completed with errors. Please review.');
    }

  } catch (error) {
    console.error('❌ Unexpected error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  migrateEntriesToTags()
    .then(() => {
      console.log('\n✨ Migration script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

export { migrateEntriesToTags };

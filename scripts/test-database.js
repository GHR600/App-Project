#!/usr/bin/env node
/**
 * Detailed Supabase Database Test
 * Tests specific tables and queries
 */

const { createClient } = require('@supabase/supabase-js');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}`)
};

async function main() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║          Supabase Database Test                    ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════╝${colors.reset}`);

  // Load environment
  require('dotenv').config({ path: require('path').join(__dirname, '.env') });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    log.error('Supabase credentials not found');
    process.exit(1);
  }

  log.info(`Connecting to: ${supabaseUrl}`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test 1: Check users table
  log.section('📋 Testing users table...');
  try {
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) {
      log.error(`Users table error: ${error.message}`);
    } else {
      log.success(`Users table accessible (${count || 0} records)`);
    }
  } catch (e) {
    log.error(`Users table test failed: ${e.message}`);
  }

  // Test 2: Check journal_entries table
  log.section('📝 Testing journal_entries table...');
  try {
    const { data, error, count } = await supabase
      .from('journal_entries')
      .select('*', { count: 'exact', head: true });

    if (error) {
      log.error(`Journal entries table error: ${error.message}`);
    } else {
      log.success(`Journal entries table accessible (${count || 0} records)`);
    }
  } catch (e) {
    log.error(`Journal entries table test failed: ${e.message}`);
  }

  // Test 3: Check ai_style column in users table
  log.section('🤖 Testing ai_style column...');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, ai_style')
      .limit(1);

    if (error) {
      if (error.message.includes('column "ai_style" does not exist')) {
        log.error('ai_style column not found - migration needs to be run');
        log.info('Run: npx supabase db push');
      } else {
        log.error(`ai_style column test error: ${error.message}`);
      }
    } else {
      log.success('ai_style column exists and is accessible');
      if (data && data.length > 0) {
        log.info(`Sample value: ${data[0].ai_style || 'null (default will be used)'}`);
      }
    }
  } catch (e) {
    log.error(`ai_style column test failed: ${e.message}`);
  }

  // Test 4: Test subscription_status column
  log.section('💳 Testing subscription_status column...');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, subscription_status')
      .limit(1);

    if (error) {
      log.error(`subscription_status column error: ${error.message}`);
    } else {
      log.success('subscription_status column exists and is accessible');
      if (data && data.length > 0) {
        log.info(`Sample value: ${data[0].subscription_status || 'null'}`);
      }
    }
  } catch (e) {
    log.error(`subscription_status test failed: ${e.message}`);
  }

  // Test 5: List all tables
  log.section('📊 Listing all tables...');
  try {
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (error) {
      log.error(`Table listing error: ${error.message}`);
    } else if (tables && tables.length > 0) {
      log.success(`Found ${tables.length} tables:`);
      tables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    } else {
      log.error('No tables found');
    }
  } catch (e) {
    log.error(`Table listing failed: ${e.message}`);
  }

  log.section('✨ Database test complete');
}

main().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});

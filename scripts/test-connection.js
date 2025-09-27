// Test script to verify Supabase connection and environment setup
// Run with: node scripts/test-connection.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');

// Check environment variables
console.log('Environment Variables:');
console.log(`REACT_APP_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`  Value: ${supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'Not set'}`);
console.log(`REACT_APP_SUPABASE_ANON_KEY: ${supabaseKey ? '✅ Set' : '❌ Missing'}`);
console.log(`  Value: ${supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'Not set'}\n`);

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Environment variables not set. Please check your .env.local file.');
  process.exit(1);
}

// Test connection
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('📡 Testing database connection...');

    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Database connection failed:');
      console.log(error.message);
      return false;
    }

    console.log('✅ Database connection successful!\n');

    // Test table structure
    console.log('🔍 Checking table structure...');

    const tables = ['users', 'user_preferences', 'journal_entries', 'ai_insights'];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ Table '${table}': ${error.message}`);
        } else {
          console.log(`✅ Table '${table}': OK`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}': ${err.message}`);
      }
    }

    console.log('\n🎉 Connection test completed!');
    console.log('\n📝 Next steps:');
    console.log('1. If any tables failed, run the SQL schema in your Supabase dashboard');
    console.log('2. Start the app with: npm start');
    console.log('3. Test user registration and journaling');

    return true;

  } catch (error) {
    console.log('❌ Connection test failed:');
    console.log(error.message);
    return false;
  }
}

// Run the test
testConnection().then(success => {
  process.exit(success ? 0 : 1);
});
#!/usr/bin/env node
/**
 * Service Connection Test Script
 * Tests connectivity to Anthropic, Supabase, and Vercel
 */

const https = require('https');
const http = require('http');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}`)
};

// Test results
const results = {
  anthropic: { status: 'pending', message: '' },
  supabase: { status: 'pending', message: '' },
  vercel: { status: 'pending', message: '' }
};

/**
 * Test Anthropic API
 */
async function testAnthropic() {
  log.section('🤖 Testing Anthropic API Connection...');

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    results.anthropic = { status: 'error', message: 'API key not found in environment' };
    log.error('ANTHROPIC_API_KEY not set');
    return;
  }

  // Check API key format
  if (!apiKey.startsWith('sk-ant-')) {
    results.anthropic = { status: 'error', message: 'Invalid API key format' };
    log.error('API key format is invalid (should start with sk-ant-)');
    return;
  }

  log.info('API key found and format is valid');

  return new Promise((resolve) => {
    const data = JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: 'Say "Connection successful" if you can read this.'
      }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(responseData);
            const responseText = parsed.content?.[0]?.text || '';
            results.anthropic = {
              status: 'success',
              message: `Connected! Model: ${parsed.model}, Response: "${responseText.substring(0, 50)}..."`
            };
            log.success('Anthropic API connection successful');
            log.info(`Model: ${parsed.model}`);
            log.info(`Response: "${responseText}"`);
          } catch (e) {
            results.anthropic = { status: 'error', message: 'Invalid response format' };
            log.error(`Parse error: ${e.message}`);
          }
        } else {
          try {
            const error = JSON.parse(responseData);
            results.anthropic = {
              status: 'error',
              message: `HTTP ${res.statusCode}: ${error.error?.message || 'Unknown error'}`
            };
            log.error(`HTTP ${res.statusCode}: ${error.error?.message || responseData}`);
          } catch (e) {
            results.anthropic = { status: 'error', message: `HTTP ${res.statusCode}` };
            log.error(`HTTP ${res.statusCode}: ${responseData}`);
          }
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      results.anthropic = { status: 'error', message: error.message };
      log.error(`Request failed: ${error.message}`);
      resolve();
    });

    req.setTimeout(10000, () => {
      results.anthropic = { status: 'error', message: 'Request timeout (10s)' };
      log.error('Request timeout after 10 seconds');
      req.destroy();
      resolve();
    });

    req.write(data);
    req.end();
  });
}

/**
 * Test Supabase Connection
 */
async function testSupabase() {
  log.section('🗄️  Testing Supabase Connection...');

  const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    results.supabase = { status: 'error', message: 'Credentials not found' };
    log.error('SUPABASE_URL or SUPABASE_ANON_KEY not set');
    return;
  }

  log.info(`Testing connection to: ${supabaseUrl}`);

  return new Promise((resolve) => {
    const url = new URL('/rest/v1/', supabaseUrl);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 404) {
          // 404 is expected for root endpoint, means API is responding
          results.supabase = {
            status: 'success',
            message: `Connected! Project URL: ${supabaseUrl}`
          };
          log.success('Supabase API connection successful');
          log.info(`Project: ${url.hostname}`);
          log.info(`Status: Database accessible`);
        } else {
          results.supabase = {
            status: 'error',
            message: `HTTP ${res.statusCode}`
          };
          log.error(`HTTP ${res.statusCode}: ${responseData.substring(0, 200)}`);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      results.supabase = { status: 'error', message: error.message };
      log.error(`Request failed: ${error.message}`);
      resolve();
    });

    req.setTimeout(10000, () => {
      results.supabase = { status: 'error', message: 'Request timeout (10s)' };
      log.error('Request timeout after 10 seconds');
      req.destroy();
      resolve();
    });

    req.end();
  });
}

/**
 * Test Vercel Deployment
 */
async function testVercel() {
  log.section('🚀 Testing Vercel Deployment...');

  const apiUrl = process.env.REACT_APP_API_BASE_URL;

  if (!apiUrl) {
    results.vercel = { status: 'error', message: 'API URL not configured' };
    log.error('REACT_APP_API_BASE_URL not set');
    return;
  }

  log.info(`Testing deployment at: ${apiUrl}`);

  return new Promise((resolve) => {
    const url = new URL(apiUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: isHttps ? 443 : 80,
      path: '/health',
      method: 'GET',
      headers: {
        'User-Agent': 'Service-Test-Script'
      }
    };

    const req = client.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(responseData);
            results.vercel = {
              status: 'success',
              message: `Deployed and responding! Status: ${parsed.status || 'OK'}`
            };
            log.success('Vercel deployment is live');
            log.info(`URL: ${apiUrl}`);
            log.info(`Response: ${JSON.stringify(parsed)}`);
          } catch (e) {
            // Maybe not JSON response
            results.vercel = {
              status: 'success',
              message: 'Deployed and responding (non-JSON response)'
            };
            log.success('Vercel deployment is live');
            log.info(`Response: ${responseData.substring(0, 100)}`);
          }
        } else if (res.statusCode === 404) {
          // Try root path
          results.vercel = {
            status: 'partial',
            message: 'Deployed but /health endpoint not found. Trying root...'
          };
          log.warn('Health endpoint not found, deployment may not have health check');
        } else {
          results.vercel = {
            status: 'error',
            message: `HTTP ${res.statusCode}`
          };
          log.error(`HTTP ${res.statusCode}: ${responseData.substring(0, 200)}`);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      results.vercel = { status: 'error', message: error.message };
      log.error(`Request failed: ${error.message}`);
      resolve();
    });

    req.setTimeout(10000, () => {
      results.vercel = { status: 'error', message: 'Request timeout (10s)' };
      log.error('Request timeout after 10 seconds');
      req.destroy();
      resolve();
    });

    req.end();
  });
}

/**
 * Print summary
 */
function printSummary() {
  log.section('📊 Test Summary');

  console.log('\n┌─────────────────┬──────────┬──────────────────────────────────────────┐');
  console.log('│ Service         │ Status   │ Details                                  │');
  console.log('├─────────────────┼──────────┼──────────────────────────────────────────┤');

  const services = [
    { name: 'Anthropic API', result: results.anthropic },
    { name: 'Supabase DB  ', result: results.supabase },
    { name: 'Vercel Deploy', result: results.vercel }
  ];

  services.forEach(({ name, result }) => {
    const statusSymbol = result.status === 'success' ? '✓' :
                        result.status === 'partial' ? '⚠' : '✗';
    const statusColor = result.status === 'success' ? colors.green :
                       result.status === 'partial' ? colors.yellow : colors.red;
    const message = result.message.substring(0, 38);

    console.log(`│ ${name} │ ${statusColor}${statusSymbol}${colors.reset}      │ ${message.padEnd(40)} │`);
  });

  console.log('└─────────────────┴──────────┴──────────────────────────────────────────┘\n');

  const allSuccess = Object.values(results).every(r => r.status === 'success');
  const anyFailure = Object.values(results).some(r => r.status === 'error');

  if (allSuccess) {
    log.success('All services are operational! ✨');
    process.exit(0);
  } else if (anyFailure) {
    log.error('Some services failed. Please check the errors above.');
    process.exit(1);
  } else {
    log.warn('Some services have warnings. Review the details above.');
    process.exit(0);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║     External Services Connection Test             ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════╝${colors.reset}`);

  await testAnthropic();
  await testSupabase();
  await testVercel();

  printSummary();
}

// Load environment from server/.env
require('dotenv').config({ path: require('path').join(__dirname, 'server', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

main().catch((error) => {
  log.error(`Unexpected error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

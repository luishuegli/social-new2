#!/usr/bin/env node

/**
 * Test script for The Compass social engine
 * Tests the complete flow from onboarding to discovery
 */

const BASE_URL = 'http://localhost:3000';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, endpoint, options = {}) {
  try {
    log(`\n📍 Testing: ${name}`, 'blue');
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await response.json().catch(() => null);
    
    if (response.ok) {
      log(`  ✅ Success: ${response.status}`, 'green');
      if (data) {
        log(`  📦 Response: ${JSON.stringify(data, null, 2).substring(0, 200)}...`, 'magenta');
      }
      return { success: true, data };
    } else {
      log(`  ❌ Failed: ${response.status} ${response.statusText}`, 'red');
      if (data) {
        log(`  ⚠️ Error: ${JSON.stringify(data)}`, 'yellow');
      }
      return { success: false, error: data };
    }
  } catch (error) {
    log(`  💥 Exception: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('\n========================================', 'blue');
  log('🧭 CONNECTION HUB - SYSTEM VERIFICATION', 'blue');
  log('========================================', 'blue');

  let allTestsPassed = true;

  // Test 1: Check interests are seeded
  log('\n📚 CHECKING INTERESTS COLLECTION', 'yellow');
  const interestsResult = await testEndpoint(
    'Get Interests',
    '/api/seed-interests'
  );
  
  if (interestsResult.success && interestsResult.data.count > 0) {
    log(`  ✨ Found ${interestsResult.data.count} interests in database`, 'green');
  } else {
    log('  ⚠️ No interests found. Seeding now...', 'yellow');
    const seedResult = await testEndpoint(
      'Seed Interests',
      '/api/seed-interests',
      { method: 'POST' }
    );
    if (!seedResult.success) allTestsPassed = false;
  }

  // Test 2: Check Vector Initialization endpoint
  log('\n🔢 CHECKING VECTOR INITIALIZATION ENDPOINT', 'yellow');
  const vectorInitResult = await testEndpoint(
    'Vector Init Status (unauthenticated)',
    '/api/compass/initialize-vector'
  );
  
  if (vectorInitResult.error) {
    log('  ✅ Correctly requires authentication', 'green');
  } else {
    log('  ⚠️ Should require authentication!', 'red');
    allTestsPassed = false;
  }

  // Test 3: Check Discovery endpoint
  log('\n🎯 CHECKING DISCOVERY ENDPOINT', 'yellow');
  const discoveryResult = await testEndpoint(
    'Discovery (unauthenticated)',
    '/api/compass/discover',
    { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {}
    }
  );
  
  if (discoveryResult.error) {
    log('  ✅ Correctly requires authentication', 'green');
  } else {
    log('  ⚠️ Should require authentication!', 'red');
    allTestsPassed = false;
  }

  // Test 4: Check Swipe Log endpoint
  log('\n💳 CHECKING SWIPE LOG ENDPOINT', 'yellow');
  const swipeResult = await testEndpoint(
    'Log Swipe (unauthenticated)',
    '/api/compass/log-swipe',
    { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        targetId: 'test-user',
        action: 'connect'
      }
    }
  );
  
  if (swipeResult.error) {
    log('  ✅ Correctly requires authentication', 'green');
  } else {
    log('  ⚠️ Should require authentication!', 'red');
    allTestsPassed = false;
  }

  // Test 5: Check if Connection Hub page loads
  log('\n🌐 CHECKING CONNECTION HUB PAGE', 'yellow');
  const compassPageResult = await testEndpoint(
    'Connection Hub Page',
    '/compass'
  );
  
  if (compassPageResult.success) {
    log('  ✅ Connection Hub page loads successfully', 'green');
  } else {
    log('  ❌ Connection Hub page failed to load', 'red');
    allTestsPassed = false;
  }

  // Test 6: Check if Onboarding page loads
  log('\n🚀 CHECKING ONBOARDING PAGE', 'yellow');
  const onboardingResult = await testEndpoint(
    'Onboarding Page',
    '/onboarding'
  );
  
  if (onboardingResult.success) {
    log('  ✅ Onboarding page loads successfully', 'green');
  } else {
    log('  ❌ Onboarding page failed to load', 'red');
    allTestsPassed = false;
  }

  // Summary
  log('\n========================================', 'blue');
  if (allTestsPassed) {
    log('✅ ALL TESTS PASSED - CONNECTION HUB IS READY!', 'green');
    log('\n📋 NEXT STEPS:', 'yellow');
    log('1. Navigate to http://localhost:3000/onboarding', 'blue');
    log('2. Complete user registration and Connection Hub setup', 'blue');
    log('3. Visit http://localhost:3000/compass to start discovering', 'blue');
    log('4. Deploy Cloud Functions: firebase deploy --only functions', 'blue');
    log('5. Deploy Firestore indexes: firebase deploy --only firestore:indexes', 'blue');
  } else {
    log('⚠️ SOME TESTS FAILED - REVIEW THE ERRORS ABOVE', 'red');
  }
  log('========================================\n', 'blue');
}

// Run the tests
runTests().catch(error => {
  log(`\n💥 Fatal error: ${error.message}`, 'red');
  process.exit(1);
});

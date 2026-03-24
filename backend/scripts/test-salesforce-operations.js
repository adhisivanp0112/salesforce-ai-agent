#!/usr/bin/env node

/**
 * Comprehensive Salesforce Operations Test Suite
 * Tests all CRUD operations and AI handler functionality
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';
const TEST_PROVIDER = 'groq'; // Using Groq as default

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(emoji, color, message) {
  console.log(`${emoji} ${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log('✅', colors.green, message);
}

function logError(message) {
  log('❌', colors.red, message);
}

function logInfo(message) {
  log('ℹ️ ', colors.blue, message);
}

function logTest(message) {
  log('🧪', colors.cyan, message);
}

let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0
};

let createdRecordIds = {
  case: null,
  contact: null,
  account: null
};

async function makeRequest(endpoint, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

async function makeGetRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: endpoint,
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// Test 1: Health Check
async function testHealthCheck() {
  logTest('TEST 1: Health Check');
  console.log('─'.repeat(60));
  
  try {
    const response = await makeGetRequest('/health');
    if (response.status === 'ok') {
      logSuccess('Backend is healthy');
      logInfo(`Connected to org: ${response.org}`);
      logInfo(`Username: ${response.username}`);
      testResults.passed++;
    } else {
      throw new Error('Health check failed');
    }
  } catch (error) {
    logError(`Health check failed: ${error.message}`);
    testResults.failed++;
  }
  console.log('');
}

// Test 2: Create Case Record
async function testCreateCase() {
  logTest('TEST 2: Create Case Record');
  console.log('─'.repeat(60));
  
  try {
    const result = await makeRequest('/api/salesforce/ai-prompt', {
      prompt: 'Create a case with subject "Test Case from Automated Tests"',
      provider: TEST_PROVIDER
    });
    
    if (result.success) {
      // Extract Case ID from message
      const idMatch = result.message.match(/\*\*ID:\*\*\s+([a-zA-Z0-9]{15,18})/);
      if (idMatch) {
        createdRecordIds.case = idMatch[1];
        logSuccess('Case created successfully');
        logInfo(`Case ID: ${createdRecordIds.case}`);
        testResults.passed++;
      } else {
        throw new Error('Could not extract Case ID from response');
      }
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    logError(`Create Case failed: ${error.message}`);
    testResults.failed++;
  }
  console.log('');
}

// Test 3: Create Contact Record
async function testCreateContact() {
  logTest('TEST 3: Create Contact Record');
  console.log('─'.repeat(60));
  
  try {
    const result = await makeRequest('/api/salesforce/ai-prompt', {
      prompt: 'Create a contact with FirstName "Test" and LastName "Contact" and email test@example.com',
      provider: TEST_PROVIDER
    });
    
    if (result.success) {
      const idMatch = result.message.match(/\*\*ID:\*\*\s+([a-zA-Z0-9]{15,18})/);
      if (idMatch) {
        createdRecordIds.contact = idMatch[1];
        logSuccess('Contact created successfully');
        logInfo(`Contact ID: ${createdRecordIds.contact}`);
        testResults.passed++;
      } else {
        throw new Error('Could not extract Contact ID from response');
      }
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    logError(`Create Contact failed: ${error.message}`);
    testResults.failed++;
  }
  console.log('');
}

// Test 4: Create Contact and Link to Case
async function testCreateAndLink() {
  logTest('TEST 4: Create Contact and Link to Case');
  console.log('─'.repeat(60));
  
  if (!createdRecordIds.case) {
    log('⚠️ ', colors.yellow, 'Skipping: No Case ID available (Test 2 may have failed)');
    testResults.warnings++;
    console.log('');
    return;
  }
  
  try {
    const result = await makeRequest('/api/salesforce/ai-prompt', {
      prompt: `Create a contact and link with ${createdRecordIds.case} case record`,
      provider: TEST_PROVIDER
    });
    
    if (result.success) {
      logSuccess('Contact created and linked to Case');
      logInfo('CREATE_AND_LINK operation successful');
      testResults.passed++;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    logError(`CREATE_AND_LINK failed: ${error.message}`);
    testResults.failed++;
  }
  console.log('');
}

// Test 5: Query Cases
async function testQueryCases() {
  logTest('TEST 5: Query Cases');
  console.log('─'.repeat(60));
  
  try {
    const result = await makeRequest('/api/salesforce/ai-prompt', {
      prompt: 'Show me 5 cases',
      provider: TEST_PROVIDER
    });
    
    if (result.success) {
      logSuccess('Query executed successfully');
      logInfo('Retrieved case records from Salesforce');
      testResults.passed++;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    logError(`Query failed: ${error.message}`);
    testResults.failed++;
  }
  console.log('');
}

// Test 6: Update Case
async function testUpdateCase() {
  logTest('TEST 6: Update Case Record');
  console.log('─'.repeat(60));
  
  if (!createdRecordIds.case) {
    log('⚠️ ', colors.yellow, 'Skipping: No Case ID available');
    testResults.warnings++;
    console.log('');
    return;
  }
  
  try {
    const result = await makeRequest('/api/salesforce/ai-prompt', {
      prompt: `Update case ${createdRecordIds.case} status to Closed`,
      provider: TEST_PROVIDER
    });
    
    if (result.success) {
      logSuccess('Case updated successfully');
      logInfo(`Updated Case ${createdRecordIds.case} to Closed`);
      testResults.passed++;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    logError(`Update Case failed: ${error.message}`);
    testResults.failed++;
  }
  console.log('');
}

// Test 7: Delete Contact (Cleanup)
async function testDeleteContact() {
  logTest('TEST 7: Delete Contact (Cleanup)');
  console.log('─'.repeat(60));
  
  if (!createdRecordIds.contact) {
    log('⚠️ ', colors.yellow, 'Skipping: No Contact ID available');
    testResults.warnings++;
    console.log('');
    return;
  }
  
  try {
    const result = await makeRequest('/api/salesforce/ai-prompt', {
      prompt: `Delete contact ${createdRecordIds.contact}`,
      provider: TEST_PROVIDER
    });
    
    if (result.success) {
      logSuccess('Contact deleted successfully');
      logInfo(`Deleted Contact ${createdRecordIds.contact}`);
      testResults.passed++;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    logError(`Delete Contact failed: ${error.message}`);
    testResults.failed++;
  }
  console.log('');
}

// Test 8: Describe Object
async function testDescribeObject() {
  logTest('TEST 8: Describe Case Object');
  console.log('─'.repeat(60));
  
  try {
    const result = await makeRequest('/api/salesforce/ai-prompt', {
      prompt: 'Describe Case object',
      provider: TEST_PROVIDER
    });
    
    if (result.success) {
      logSuccess('Object description retrieved');
      logInfo('Case object metadata accessed');
      testResults.passed++;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    logError(`Describe Object failed: ${error.message}`);
    testResults.failed++;
  }
  console.log('');
}

// Main test runner
async function runAllTests() {
  console.log('');
  console.log('═'.repeat(60));
  console.log(`${colors.bright}${colors.cyan}🧪 SALESFORCE OPERATIONS TEST SUITE${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}   Testing AI Handler + Salesforce Integration${colors.reset}`);
  console.log('═'.repeat(60));
  console.log('');
  
  await testHealthCheck();
  await testCreateCase();
  await testCreateContact();
  await testCreateAndLink();
  await testQueryCases();
  await testUpdateCase();
  await testDeleteContact();
  await testDescribeObject();
  
  // Summary
  console.log('═'.repeat(60));
  console.log(`${colors.bright}TEST SUMMARY${colors.reset}`);
  console.log('═'.repeat(60));
  logSuccess(`Passed: ${testResults.passed}`);
  if (testResults.failed > 0) {
    logError(`Failed: ${testResults.failed}`);
  }
  if (testResults.warnings > 0) {
    log('⚠️ ', colors.yellow, `Warnings: ${testResults.warnings}`);
  }
  
  const total = testResults.passed + testResults.failed + testResults.warnings;
  const successRate = ((testResults.passed / total) * 100).toFixed(1);
  console.log('');
  console.log(`${colors.bright}Success Rate: ${successRate}%${colors.reset}`);
  console.log('═'.repeat(60));
  console.log('');
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  logError(`Test suite crashed: ${error.message}`);
  console.error(error);
  process.exit(1);
});

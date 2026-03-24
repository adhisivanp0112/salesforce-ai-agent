const express = require('express');
const cors = require('cors');
const { spawn, exec } = require('child_process');
const dotenv = require('dotenv');
const jsforce = require('jsforce');
const { promisify } = require('util');

const execPromise = promisify(exec);

// Load environment variables FIRST before requiring db.js
dotenv.config();

// Now require modules that need env vars
const db = require('./db');
// Use Universal AI Handler for all providers
const UniversalAIHandler = require('./universalAIHandler');

// Very small fallback for common prompts when AI providers are unavailable (e.g., Gemini quota=0).
// This is intentionally conservative: it only handles "create case" with an extracted subject.
function tryDeterministicFallback(prompt) {
  const p = (prompt || '').trim();
  if (!p) return null;

  // Basic intent detection
  const looksLikeCreateCase =
    /\bcreate\b/i.test(p) && /\bcase\b/i.test(p) && /\brecord\b/i.test(p);

  if (!looksLikeCreateCase) return null;

  // Extract subject:
  // - "with <subject> subject"
  // - "subject: <subject>"
  // - "subject <subject>"
  let subject = null;

  const mWithSubject = p.match(/\bwith\s+(.+?)\s+subject\b/i);
  if (mWithSubject && mWithSubject[1]) subject = mWithSubject[1].trim();

  if (!subject) {
    const mSubjectColon = p.match(/\bsubject\s*:\s*(.+)$/i);
    if (mSubjectColon && mSubjectColon[1]) subject = mSubjectColon[1].trim();
  }

  if (!subject) {
    const mSubjectWord = p.match(/\bsubject\s+(.+)$/i);
    if (mSubjectWord && mSubjectWord[1]) subject = mSubjectWord[1].trim();
  }

  if (!subject) return null;

  // Safety trim
  subject = subject.replace(/^["']|["']$/g, '').trim();
  if (!subject) return null;

  return {
    action: 'CREATE_CASE',
    data: {
      Subject: subject,
      Description: `Created via fallback (AI unavailable). Original prompt: "${p}"`,
      Origin: 'Web',
      Priority: 'Medium',
    },
  };
}

// Helper function to initialize the correct AI handler
function initializeAIHandler(sfConnection) {
  const aiProviderRaw = process.env.AI_PROVIDER || 'groq';
  const aiProvider = aiProviderRaw.toLowerCase();
  
  console.log(`🚀 Initializing Universal AI Handler for ${aiProvider.toUpperCase()}...`);
  return new UniversalAIHandler(sfConnection);
}

const app = express();
const PORT = process.env.PORT || 3001;
const SF_ORG_ALIAS = process.env.SF_ORG_ALIAS || 'myverbis';

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Salesforce Connection Manager
class SalesforceConnection {
  constructor() {
    this.conn = null;
    this.orgInfo = null;
  }

  async initialize() {
    try {
      // Check which authentication method to use
      const usePasswordAuth = process.env.SF_USE_PASSWORD_AUTH === 'true';
      
      if (usePasswordAuth) {
        return await this.initializeWithPassword();
      } else {
        return await this.initializeWithCLI();
      }
    } catch (error) {
      console.error('❌ Failed to connect to Salesforce:', error.message);
      throw error;
    }
  }

  async initializeWithCLI() {
    console.log(`🔐 Authenticating with Salesforce org via CLI: ${SF_ORG_ALIAS}`);
    
    // Get org info using SF CLI
    const { stdout } = await execPromise(`sf org display --target-org ${SF_ORG_ALIAS} --json`);
    const orgData = JSON.parse(stdout);
    
    if (orgData.status !== 0) {
      throw new Error(`Failed to get org info: ${orgData.message}`);
    }

    this.orgInfo = orgData.result;
    
    // Create jsforce connection
    this.conn = new jsforce.Connection({
      instanceUrl: this.orgInfo.instanceUrl,
      accessToken: this.orgInfo.accessToken
    });

    console.log(`✅ Connected to Salesforce org: ${this.orgInfo.username}`);
    console.log(`   Instance: ${this.orgInfo.instanceUrl}`);
    
    return true;
  }

  async initializeWithPassword() {
    console.log('🔐 Authenticating with Salesforce using Username/Password...');
    
    const username = process.env.SF_USERNAME;
    const password = process.env.SF_PASSWORD;
    const securityToken = process.env.SF_SECURITY_TOKEN || '';
    const loginUrl = process.env.SF_LOGIN_URL || 'https://login.salesforce.com';
    
    if (!username || !password) {
      throw new Error('SF_USERNAME and SF_PASSWORD must be set in .env file');
    }

    // Create jsforce connection
    this.conn = new jsforce.Connection({
      loginUrl: loginUrl
    });

    // Login with username, password + security token
    const userInfo = await this.conn.login(username, password + securityToken);
    
    this.orgInfo = {
      username: username,
      instanceUrl: this.conn.instanceUrl,
      accessToken: this.conn.accessToken,
      userId: userInfo.id,
      organizationId: userInfo.organizationId
    };

    console.log(`✅ Connected to Salesforce org: ${username}`);
    console.log(`   Instance: ${this.conn.instanceUrl}`);
    console.log(`   User ID: ${userInfo.id}`);
    
    return true;
  }

  async ensureConnection() {
    if (!this.conn || !this.orgInfo) {
      await this.initialize();
    }
    return this.conn;
  }

  async query(soql) {
    const conn = await this.ensureConnection();
    return await conn.query(soql);
  }

  async create(objectType, data) {
    const conn = await this.ensureConnection();
    return await conn.sobject(objectType).create(data);
  }

  async update(objectType, recordId, data) {
    const conn = await this.ensureConnection();
    return await conn.sobject(objectType).update({
      Id: recordId,
      ...data
    });
  }

  async delete(objectType, recordId) {
    const conn = await this.ensureConnection();
    return await conn.sobject(objectType).delete(recordId);
  }

  async getOrgInfo() {
    if (!this.orgInfo) {
      await this.initialize();
    }
    return this.orgInfo;
  }
}

// Initialize Salesforce connection
const sfConnection = new SalesforceConnection();

// Initialize AI Handler
let aiHandler;

// Initialize connection and database on startup
Promise.all([
  sfConnection.initialize(),
  process.env.USE_DATABASE === 'true' ? db.testConnection().then(() => db.setupDatabase()) : Promise.resolve()
]).then(() => {
  aiHandler = initializeAIHandler(sfConnection);
  console.log('✅ AI Handler initialized successfully');
}).catch(err => {
  console.error('Failed to initialize:', err);
  // Continue without database if it fails
  if (!aiHandler) {
    aiHandler = initializeAIHandler(sfConnection);
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const orgInfo = await sfConnection.getOrgInfo();
    res.json({ 
      status: 'ok', 
      message: 'Salesforce Admin Backend is running',
      org: SF_ORG_ALIAS,
      username: orgInfo.username
    });
  } catch (error) {
    res.json({
      status: 'error',
      message: error.message,
      org: SF_ORG_ALIAS
    });
  }
});

// List available tools (for compatibility)
app.get('/api/salesforce/tools', (req, res) => {
  res.json({
    tools: [
      { name: 'create_record', description: 'Create Salesforce records' },
      { name: 'query', description: 'Execute SOQL queries' },
      { name: 'update_record', description: 'Update Salesforce records' },
      { name: 'delete_record', description: 'Delete Salesforce records' }
    ]
  });
});

// Create Salesforce Case
app.post('/api/salesforce/case', async (req, res) => {
  try {
    console.log('Creating case:', req.body);
    
    const result = await sfConnection.create('Case', req.body);
    
    console.log('Case created:', result);
    res.json({
      success: true,
      id: result.id,
      result: result
    });
  } catch (error) {
    console.error('Error creating case:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.toString()
    });
  }
});

// Quick login using SF CLI (for scratch orgs)
app.post('/api/salesforce/quick-login', async (req, res) => {
  try {
    console.log('⚡ Quick login attempt using SF CLI...');
    
    // Use the existing SF CLI authentication
    await sfConnection.initialize();
    
    // Initialize AI Handler with SF CLI connection
    aiHandler = initializeAIHandler(sfConnection);
    console.log('✅ AI Handler initialized with SF CLI connection');
    
    res.json({
      success: true,
      userInfo: {
        username: sfConnection.orgInfo.username,
        instanceUrl: sfConnection.orgInfo.instanceUrl,
        userId: sfConnection.orgInfo.userId || 'Unknown',
        organizationId: sfConnection.orgInfo.organizationId || 'Unknown'
      }
    });
  } catch (error) {
    console.error('❌ Quick login failed:', error.message);
    res.status(401).json({
      success: false,
      error: 'SF CLI authentication failed. Please ensure you are logged in via SF CLI or use manual login below.'
    });
  }
});

// Login endpoint for UI-based authentication
app.post('/api/salesforce/login', async (req, res) => {
  try {
    const { username, password, securityToken, loginUrl } = req.body;
    
    console.log('🔐 Login attempt for:', username);
    console.log('   Security Token provided:', securityToken ? 'Yes' : 'No');
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Create new jsforce connection
    const conn = new jsforce.Connection({
      loginUrl: loginUrl || 'https://login.salesforce.com'
    });

    // Login with username, password + security token (only if provided and not empty)
    const token = securityToken && securityToken.trim() ? securityToken.trim() : '';
    const fullPassword = password + token;
    
    console.log('   Attempting login...');
    const userInfo = await conn.login(username, fullPassword);
    
    // Store connection in global sfConnection
    sfConnection.conn = conn;
    sfConnection.orgInfo = {
      username: username,
      instanceUrl: conn.instanceUrl,
      accessToken: conn.accessToken,
      userId: userInfo.id,
      organizationId: userInfo.organizationId
    };

    // Initialize AI Handler with new connection
    aiHandler = initializeAIHandler(sfConnection);
    console.log('✅ AI Handler initialized with new connection');

    console.log(`✅ Login successful for: ${username}`);
    console.log(`   Instance: ${conn.instanceUrl}`);
    
    res.json({
      success: true,
      userInfo: {
        username: username,
        instanceUrl: conn.instanceUrl,
        userId: userInfo.id,
        organizationId: userInfo.organizationId
      }
    });
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    
    let errorMessage = 'Authentication failed';
    
    if (error.message.includes('INVALID_LOGIN')) {
      errorMessage = 'Invalid username, password, or security token';
    } else if (error.message.includes('UNKNOWN_EXCEPTION')) {
      errorMessage = 'Unknown error. Please check your credentials and try again.';
    } else {
      errorMessage = error.message;
    }
    
    res.status(401).json({
      success: false,
      error: errorMessage
    });
  }
});

// Execute SOQL Query
app.post('/api/salesforce/query', async (req, res) => {
  try {
    const { query } = req.body;
    console.log('Executing query:', query);
    
    const result = await sfConnection.query(query);
    
    console.log(`Query returned ${result.records?.length || 0} records`);
    res.json({
      success: true,
      records: result.records,
      totalSize: result.totalSize,
      done: result.done
    });
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.toString()
    });
  }
});

// Update Salesforce Record
app.patch('/api/salesforce/record/:objectType/:recordId', async (req, res) => {
  try {
    const { objectType, recordId } = req.params;
    console.log(`Updating ${objectType} record ${recordId}:`, req.body);
    
    const result = await sfConnection.update(objectType, recordId, req.body);
    
    console.log('Record updated:', result);
    res.json({
      success: true,
      result: result
    });
  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).json({ 
      error: error.message 
    });
  }
});

// Delete Salesforce Record
app.delete('/api/salesforce/record/:objectType/:recordId', async (req, res) => {
  try {
    const { objectType, recordId } = req.params;
    console.log(`Deleting ${objectType} record ${recordId}`);
    
    const result = await sfConnection.delete(objectType, recordId);
    
    console.log('Record deleted:', result);
    res.json({
      success: true,
      result: result
    });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ 
      error: error.message 
    });
  }
});

// Get Org Info
app.get('/api/salesforce/org-info', async (req, res) => {
  try {
    console.log('Fetching org info...');
    
    // Query organization info
    const orgQuery = await sfConnection.query('SELECT Id, Name, OrganizationType, TrialExpirationDate, InstanceName FROM Organization LIMIT 1');
    
    console.log('Org info retrieved:', orgQuery.records[0]?.Name);
    res.json({
      success: true,
      result: orgQuery.records[0] || {}
    });
  } catch (error) {
    console.error('Error getting org info:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      details: error.toString()
    });
  }
});

// Describe Salesforce Object - Get all fields and metadata
app.get('/api/salesforce/describe/:objectName', async (req, res) => {
  try {
    const { objectName } = req.params;
    console.log(`🔍 Describing Salesforce object: ${objectName}`);
    
    const description = await sfConnection.conn.describe(objectName);
    
    // Extract field information
    const fields = description.fields.map(field => ({
      name: field.name,
      label: field.label,
      type: field.type,
      length: field.length,
      required: !field.nillable,
      custom: field.custom,
      updateable: field.updateable,
      createable: field.createable,
      picklistValues: field.picklistValues || []
    }));
    
    // Separate custom and standard fields
    const customFields = fields.filter(f => f.custom);
    const standardFields = fields.filter(f => !f.custom);
    
    console.log(`✅ Found ${fields.length} fields (${customFields.length} custom, ${standardFields.length} standard)`);
    
    res.json({
      success: true,
      result: {
        objectName: objectName,
        label: description.label,
        labelPlural: description.labelPlural,
        custom: description.custom,
        totalFields: fields.length,
        customFieldsCount: customFields.length,
        standardFieldsCount: standardFields.length,
        fields: fields,
        customFields: customFields,
        standardFields: standardFields,
        keyPrefix: description.keyPrefix,
        createable: description.createable,
        updateable: description.updateable,
        deletable: description.deletable,
        queryable: description.queryable
      }
    });
  } catch (error) {
    console.error('Error describing object:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      message: `Failed to describe object '${req.params.objectName}'. Please check the object name and ensure it exists in your org.`
    });
  }
});

// List all Salesforce Objects
app.get('/api/salesforce/objects', async (req, res) => {
  try {
    console.log('🔍 Fetching all Salesforce objects...');
    
    const { customOnly = false, standardOnly = false } = req.query;
    
    const globalDescribe = await sfConnection.conn.describeGlobal();
    
    let objects = globalDescribe.sobjects.map(obj => ({
      name: obj.name,
      label: obj.label,
      labelPlural: obj.labelPlural,
      custom: obj.custom,
      keyPrefix: obj.keyPrefix,
      createable: obj.createable,
      updateable: obj.updateable,
      deletable: obj.deletable,
      queryable: obj.queryable
    }));
    
    // Filter based on query parameters
    if (customOnly === 'true') {
      objects = objects.filter(obj => obj.custom);
    } else if (standardOnly === 'true') {
      objects = objects.filter(obj => !obj.custom);
    }
    
    // Sort by name
    objects.sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`✅ Found ${objects.length} objects`);
    
    res.json({
      success: true,
      result: {
        totalObjects: objects.length,
        objects: objects
      }
    });
  } catch (error) {
    console.error('Error listing objects:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// List Authenticated Orgs
app.get('/api/salesforce/orgs', async (req, res) => {
  try {
    console.log('Listing authenticated orgs');
    
    const { stdout } = await execPromise('sf org list --json');
    const orgData = JSON.parse(stdout);
    
    console.log('Orgs:', orgData);
    res.json({
      success: true,
      result: orgData.result
    });
  } catch (error) {
    console.error('Error listing orgs:', error);
    res.status(500).json({ 
      error: error.message 
    });
  }
});

// Deploy Metadata (using SF CLI)
app.post('/api/salesforce/deploy', async (req, res) => {
  try {
    const { sourcePath } = req.body;
    console.log('Deploying metadata from:', sourcePath);
    
    const { stdout } = await execPromise(`sf project deploy start --source-dir ${sourcePath} --target-org ${SF_ORG_ALIAS} --json`);
    const result = JSON.parse(stdout);
    
    console.log('Deployment result:', result);
    res.json({
      success: true,
      result: result.result
    });
  } catch (error) {
    console.error('Error deploying metadata:', error);
    res.status(500).json({ 
      error: error.message 
    });
  }
});

// Get available AI providers
app.get('/api/ai/providers', (req, res) => {
  res.json({
    success: true,
    providers: [
      {
        id: 'groq',
        name: 'Groq',
        description: 'Fast, free AI inference',
        free: true,
        signupUrl: 'https://console.groq.com/keys',
        models: [
          { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B (Best)' },
          { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Newest)' },
          { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
          { id: 'gemma2-9b-it', name: 'Gemma 2 9B' }
        ]
      },
      {
        id: 'openai',
        name: 'ChatGPT (OpenAI)',
        description: 'High quality AI by OpenAI',
        free: false,
        signupUrl: 'https://platform.openai.com/api-keys',
        models: [
          { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Cheapest)' },
          { id: 'gpt-4o', name: 'GPT-4o (Best)' },
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Fastest)' }
        ]
      },
      {
        id: 'anthropic',
        name: 'Claude (Anthropic)',
        description: 'Advanced AI assistant',
        free: false,
        signupUrl: 'https://console.anthropic.com/',
        models: [
          { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Best)' },
          { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Fastest)' }
        ]
      },
      {
        id: 'gemini',
        name: 'Google Gemini',
        description: 'Google AI (legacy handler)',
        free: true,
        signupUrl: 'https://aistudio.google.com/app/apikey',
        models: [
          { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
          { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
        ]
      },
      {
        id: 'mistral',
        name: 'Mistral AI',
        description: 'European AI platform',
        free: false,
        signupUrl: 'https://console.mistral.ai/',
        models: [
          { id: 'mistral-small-latest', name: 'Mistral Small' },
          { id: 'mistral-large-latest', name: 'Mistral Large' }
        ]
      },
      {
        id: 'perplexity',
        name: 'Perplexity AI',
        description: 'AI with web search',
        free: false,
        signupUrl: 'https://www.perplexity.ai/settings/api',
        models: [
          { id: 'llama-3.1-sonar-small-128k-online', name: 'Sonar Small (Online)' },
          { id: 'llama-3.1-sonar-large-128k-online', name: 'Sonar Large (Online)' }
        ]
      },
      {
        id: 'xai',
        name: 'Grok (xAI)',
        description: 'Elon Musk\'s AI (Coming Soon)',
        free: false,
        signupUrl: 'https://x.ai/',
        models: [],
        comingSoon: true
      }
    ]
  });
});

// Helper function to get API key for a provider
function getProviderApiKey(providerName) {
  // First, try to get from API_PROVIDERS JSON array
  if (process.env.API_PROVIDERS) {
    try {
      const providers = JSON.parse(process.env.API_PROVIDERS);
      const providerConfig = providers.find(p => p.provider.toLowerCase() === providerName.toLowerCase());
      if (providerConfig && providerConfig.key) {
        console.log(`✅ Found API key for ${providerName} in API_PROVIDERS array`);
        return providerConfig.key;
      }
    } catch (error) {
      console.warn('⚠️  Failed to parse API_PROVIDERS JSON:', error.message);
    }
  }
  
  // Fallback to individual environment variables
  const providerKeyMap = {
    'groq': process.env.GROQ_API_KEY,
    'openai': process.env.OPENAI_API_KEY,
    'anthropic': process.env.ANTHROPIC_API_KEY,
    'xai': process.env.XAI_API_KEY,
    'cohere': process.env.COHERE_API_KEY
  };
  
  const key = providerKeyMap[providerName.toLowerCase()];
  if (key) {
    console.log(`✅ Found API key for ${providerName} in individual env variables`);
  }
  return key;
}

// AI Prompt Handler - Natural Language to Salesforce (with dynamic provider support)
app.post('/api/salesforce/ai-prompt', async (req, res) => {
  try {
    const { prompt, conversationId, aiProvider, apiKey, provider } = req.body;
    
    console.log('📥 Received request:', { provider, aiProvider, hasApiKey: !!apiKey });
    
    if (!prompt || prompt.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Please provide a prompt'
      });
    }

    // ALWAYS use provider from UI dropdown if available
    let handlerToUse = null;
    let providerToUse = provider || aiProvider; // Support both 'provider' (new) and 'aiProvider' (legacy)
    
    console.log('🎯 Provider to use:', providerToUse);
    
    // If provider is specified, get API key from env variables or API_PROVIDERS array
    if (providerToUse) {
      const providerKey = getProviderApiKey(providerToUse);
      
      if (!providerKey) {
        return res.status(400).json({
          success: false,
          error: `API key for provider '${providerToUse}' not found. Please add it to API_PROVIDERS array or ${providerToUse.toUpperCase()}_API_KEY in your .env file.`
        });
      }
      
      console.log(`🔄 Using dynamic AI provider: ${providerToUse}`);
      
      // Store original env values
      const originalProvider = process.env.AI_PROVIDER;
      const originalKey = process.env.AI_API_KEY;
      
      // Temporarily set env for the handler
      process.env.AI_PROVIDER = providerToUse;
      process.env.AI_API_KEY = providerKey;
      
      // Create handler with selected provider
      handlerToUse = new UniversalAIHandler(sfConnection);
      
      // Restore original env
      process.env.AI_PROVIDER = originalProvider;
      process.env.AI_API_KEY = originalKey;
    } else if (aiProvider && apiKey) {
      // Legacy support for UI-provided API keys
      console.log(`🔄 Using dynamic AI provider (legacy): ${aiProvider}`);
      process.env.AI_PROVIDER = aiProvider;
      process.env.AI_API_KEY = apiKey;
      
      handlerToUse = new UniversalAIHandler(sfConnection);
      
      // Restore original env
      process.env.AI_PROVIDER = process.env.AI_PROVIDER_ORIGINAL || 'groq';
      process.env.AI_API_KEY = process.env.AI_API_KEY_ORIGINAL || '';
    } else {
      // No provider specified - use default aiHandler
      console.log('⚠️  No provider specified from UI, using default handler');
      handlerToUse = aiHandler;
    }

    if (!handlerToUse) {
      return res.status(503).json({
        success: false,
        error: 'AI Handler not initialized. Please wait and try again.'
      });
    }

    console.log('🤖 AI Prompt received:', prompt);
    if (conversationId) {
      console.log('📝 Conversation ID:', conversationId);
    }
    if (providerToUse) {
      console.log('🤖 Provider:', providerToUse);
    }
    
    const result = await handlerToUse.processPrompt(prompt, conversationId);

    // If the AI provider is unavailable (e.g. Gemini quota=0), try a minimal deterministic fallback.
    if (
      result &&
      result.success === false &&
      (result.rateLimitError ||
        (typeof result.message === 'string' &&
          result.message.toLowerCase().includes('rate limit')))
    ) {
      const fallback = tryDeterministicFallback(prompt);
      if (fallback && fallback.action === 'CREATE_CASE') {
        console.log('🛟 AI unavailable; using deterministic fallback to CREATE_CASE');
        const createResult = await sfConnection.create('Case', fallback.data);
        return res.json({
          success: true,
          action: 'create_case',
          message: `✅ Case created (fallback mode).\n\n- ID: ${createResult.id}\n- Subject: ${fallback.data.Subject}`,
          result: { id: createResult.id, ...fallback.data },
          fallback: true,
        });
      }
    }
    
    console.log('🤖 AI Response:', result);
    res.json(result);
  } catch (error) {
    console.error('Error processing AI prompt:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      details: error.toString()
    });
  }
});

// Database API endpoints (if database is enabled)
app.get('/api/database/stats', async (req, res) => {
  try {
    if (process.env.USE_DATABASE !== 'true') {
      return res.status(503).json({
        success: false,
        message: 'Database is not enabled'
      });
    }
    
    const stats = await db.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/database/conversations', async (req, res) => {
  try {
    if (process.env.USE_DATABASE !== 'true') {
      return res.status(503).json({
        success: false,
        message: 'Database is not enabled'
      });
    }
    
    const conversations = await db.getConversations();
    res.json({ success: true, conversations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/database/conversation/:id', async (req, res) => {
  try {
    if (process.env.USE_DATABASE !== 'true') {
      return res.status(503).json({
        success: false,
        message: 'Database is not enabled'
      });
    }
    
    const history = await db.getConversationHistory(req.params.id);
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Load all conversations with messages for history restore
app.get('/api/database/load-history', async (req, res) => {
  try {
    if (process.env.USE_DATABASE !== 'true') {
      return res.status(503).json({
        success: false,
        message: 'Database is not enabled'
      });
    }
    
    // Get all conversations
    const conversations = await db.getConversations();
    
    // Get messages for each conversation
    const conversationsWithMessages = await Promise.all(
      conversations.map(async (conv) => {
        const dbMessages = await db.getConversationHistory(conv.id, 100);
        
        // Convert database messages to UI format
        // Each DB row has both user_prompt and ai_response
        const messages = [];
        dbMessages.forEach(msg => {
          if (msg.user_prompt) {
            messages.push({
              id: msg.id * 2 - 1,
              type: 'user',
              content: msg.user_prompt,
              timestamp: msg.created_at,
              role: 'user'
            });
          }
          if (msg.ai_response) {
            messages.push({
              id: msg.id * 2,
              type: 'assistant',
              content: msg.ai_response,
              timestamp: msg.updated_at || msg.created_at,
              role: 'assistant'
            });
          }
        });
        
        // Generate a better title from the first message if title is generic
        let conversationTitle = conv.title;
        if (!conversationTitle || conversationTitle === 'Conversation' || conversationTitle === 'New Conversation') {
          if (messages.length > 0 && messages[0].content) {
            // Use first 40 characters of the first message as title
            conversationTitle = messages[0].content.substring(0, 40) + (messages[0].content.length > 40 ? '...' : '');
          } else {
            conversationTitle = 'Conversation';
          }
        }
        
        return {
          id: conv.id,
          title: conversationTitle,
          messages: messages
        };
      })
    );
    
    // Filter out conversations with no messages
    const validConversations = conversationsWithMessages.filter(conv => conv.messages.length > 0);
    
    res.json({ success: true, conversations: validConversations });
  } catch (error) {
    console.error('Error loading history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete conversation from database
app.delete('/api/database/conversation/:id', async (req, res) => {
  try {
    if (process.env.USE_DATABASE !== 'true') {
      return res.status(503).json({
        success: false,
        message: 'Database is not enabled'
      });
    }
    
    const conversationId = req.params.id;
    console.log(`🗑️  Deleting conversation: ${conversationId}`);
    
    // Delete from database (will cascade delete chat_history due to foreign key)
    await db.deleteConversation(conversationId);
    
    console.log(`✅ Conversation ${conversationId} deleted from database`);
    res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
${'='.repeat(60)}`);
  console.log(`🚀 Salesforce Admin Backend Server Running`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`🔧 Salesforce Org: ${SF_ORG_ALIAS}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`${'='.repeat(60)}\n`);
  console.log(`Available endpoints:`);
  console.log(`  GET  /health`);
  console.log(`  GET  /api/salesforce/tools`);
  console.log(`  GET  /api/salesforce/orgs`);
  console.log(`  POST /api/salesforce/case`);
  console.log(`  POST /api/salesforce/query`);
  console.log(`  POST /api/salesforce/deploy`);
  console.log(`  PATCH /api/salesforce/record/:objectType/:recordId`);
  console.log(`  DELETE /api/salesforce/record/:objectType/:recordId`);
  console.log(`\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});


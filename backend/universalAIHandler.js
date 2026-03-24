const fetch = require('node-fetch');

/**
 * Universal AI Handler - Works with ANY AI Provider!
 * 
 * Just set in .env:
 *   AI_PROVIDER=groq  (or gemini, openai, anthropic, etc.)
 *   AI_API_KEY=your_key_here
 * 
 * Supported providers:
 * - groq (FREE, FAST - Recommended!)
 * - openai (ChatGPT)
 * - anthropic (Claude)
 * - gemini (Google)
 * - mistral
 * - perplexity
 */
class UniversalAIHandler {
  constructor(sfConnection) {
    this.sfConnection = sfConnection;
    this.provider = (process.env.AI_PROVIDER || 'groq').toLowerCase();
    
    // Check for provider-specific API key first, then fallback to generic AI_API_KEY
    const providerKeyMap = {
      groq: process.env.GROQ_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      gemini: process.env.GOOGLE_API_KEY,
      mistral: process.env.MISTRAL_API_KEY,
      perplexity: process.env.PERPLEXITY_API_KEY
    };
    
    this.apiKey = providerKeyMap[this.provider] || process.env.AI_API_KEY;
    
    // Provider configurations
    this.configs = {
      groq: {
        url: 'https://api.groq.com/openai/v1/chat/completions',
        model: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
        format: 'openai'
      },
      openai: {
        url: 'https://api.openai.com/v1/chat/completions',
        model: process.env.AI_MODEL || 'gpt-4o-mini',
        format: 'openai'
      },
      anthropic: {
        url: 'https://api.anthropic.com/v1/messages',
        model: process.env.AI_MODEL || 'claude-3-5-sonnet-20241022',
        format: 'anthropic'
      },
      mistral: {
        url: 'https://api.mistral.ai/v1/chat/completions',
        model: process.env.AI_MODEL || 'mistral-small-latest',
        format: 'openai'
      },
      perplexity: {
        url: 'https://api.perplexity.ai/chat/completions',
        model: process.env.AI_MODEL || 'llama-3.1-sonar-small-128k-online',
        format: 'openai'
      }
    };
    
    if (!this.apiKey) {
      console.warn('⚠️  AI_API_KEY not found in environment variables');
      console.warn(`   Set AI_API_KEY in .env for ${this.provider}`);
    }
    
    const config = this.configs[this.provider];
    if (!config) {
      console.warn(`⚠️  Unknown provider: ${this.provider}, defaulting to groq`);
      this.provider = 'groq';
    }
    
    console.log(`🤖 Universal AI Handler initialized`);
    console.log(`   Provider: ${this.provider.toUpperCase()}`);
    console.log(`   Model: ${this.configs[this.provider].model}`);
    console.log(`   API: ${this.configs[this.provider].url}`);
  }

  async processPrompt(userPrompt, conversationId = null, previousError = null, retryCount = 0) {
    const MAX_RETRIES = 2;

    try {
      console.log(`🧠 Processing with ${this.provider.toUpperCase()} (attempt ${retryCount + 1}):`, userPrompt);

      // If this is a retry, add error context
      let errorContext = '';
      if (previousError && retryCount > 0) {
        errorContext = `\n\nPREVIOUS ATTEMPT FAILED:\n${previousError}\n\nPlease fix the issue and retry with corrected parameters.`;
        console.log('🔄 Retrying with error context:', previousError);
      }

      const systemPrompt = `You are a Salesforce AI assistant. Convert user requests into JSON actions.

Available actions:
1. CREATE_CASE - Create a new case
2. CREATE_LEAD - Create a new lead
3. CREATE_RECORD - Create any Salesforce record
4. CREATE_AND_LINK - Create a record and link it to another record (e.g., create Contact and link to Case)
5. QUERY - Query Salesforce data using SOQL
6. UPDATE - Update existing records
7. DELETE - Delete records
8. DESCRIBE_OBJECT - Get object metadata
9. LIST_OBJECTS - List all Salesforce objects

LANGUAGE-SPECIFIC CONTENT RULES:
When user requests content in a specific language (e.g., "Italian description", "French subject"):
1. Generate the actual content IN THAT LANGUAGE - do NOT just mention the language
2. Examples:
   - "Italian description" → Write description text in Italian
   - "French subject" → Write subject text in French
   - "German description about support" → Write support description in German
3. Be creative and generate meaningful content in the requested language

EXAMPLES:
- User: "Create case with Hello subject and Italian description"
  Response: {"action":"CREATE_CASE","data":{"Subject":"Hello","Description":"Questo è un caso di supporto. Siamo qui per aiutarti.","Origin":"Web","Priority":"Medium"}}

- User: "Create case with French description about billing"
  Response: {"action":"CREATE_CASE","data":{"Subject":"Billing Issue","Description":"Nous avons reçu votre demande concernant un problème de facturation.","Origin":"Web","Priority":"High"}}

CRITICAL QUERY RULES:
1. **Custom Objects**: Use EXACT API name with __c suffix
   - Example: "VerbisCase" → use "verbis__VerbisCaseSettings__c"
   - Namespace prefix pattern: namespace__ObjectName__c

2. **Field Selection**:
   - ALWAYS include Id field
   - Include Name field for custom objects
   - Use EXACT field API names with __c for custom fields

3. **Common Object Fields**:
   - Case: Id, CaseNumber, Subject, Status, Priority, Origin, Description
   - Contact: Id, Name, Email, Phone, AccountId
   - Custom objects: Id, Name, CreatedDate, LastModifiedDate

4. **Understanding Intent**:
   - "Show me", "Get all", "List" = Query/SELECT
   - Default limit: 10 records
   - If user says "all", use limit: 100

RESPOND ONLY with JSON:
{
  "action": "ACTION_NAME",
  "data": { ...fields... }
}

For CREATE_CASE:
{"action":"CREATE_CASE","data":{"Subject":"...","Description":"...","Origin":"Web/Email/Phone","Priority":"Low/Medium/High"}}

For CREATE_RECORD (any object including Contact, Account, Lead, etc.):
{"action":"CREATE_RECORD","data":{"objectType":"Contact","FirstName":"John","LastName":"Doe","Email":"john@example.com"}}

CRITICAL: For CREATE_RECORD, the data object MUST have:
- "objectType" field (NOT "objectName")
- Fields at root level (NOT nested under "fields")
Example CORRECT: {"action":"CREATE_RECORD","data":{"objectType":"Contact","FirstName":"John","LastName":"Doe"}}
Example WRONG: {"action":"CREATE_RECORD","data":{"objectName":"Contact","fields":{"FirstName":"John"}}}

For CREATE_RECORD with relationship (linking Contact to Account):
{"action":"CREATE_RECORD","data":{"objectType":"Contact","FirstName":"John","LastName":"Doe","Email":"john@example.com","AccountId":"001..."}}

For CREATE_AND_LINK (create and link in one operation):
{"action":"CREATE_AND_LINK","data":{"createObject":"Contact","createData":{"FirstName":"New","LastName":"Contact"},"linkToObject":"Case","linkToRecordId":"500...","linkField":"ContactId"}}

RELATIONSHIP FIELD RULES:
1. To link Contact to Case: Update the Case's "ContactId" field (Contact doesn't have CaseId field)
2. To link Contact to Account: Use "AccountId" field on Contact
3. To link Case to Contact: Use "ContactId" field on Case
4. To link Case to Account: Use "AccountId" field on Case
5. For custom relationships: Use the exact API name ending in __c

IMPORTANT: When user says "Create contact and link with case [ID]", use CREATE_AND_LINK action to do both in one operation.

For QUERY:
{"action":"QUERY","data":{"query":"SELECT Id, Name FROM Object WHERE... LIMIT 10"}}

For UPDATE:
{"action":"UPDATE","data":{"objectType":"Case","recordId":"500...","fields":{"Status":"Closed"}}}

For DELETE:
{"action":"DELETE","data":{"objectType":"Case","recordId":"500..."}}
IMPORTANT: For DELETE, you MUST provide both objectType AND recordId. The recordId should be a valid 15 or 18 character Salesforce ID (starts with 500 for Case, 003 for Contact, 001 for Account, etc.)

For DESCRIBE_OBJECT:
{"action":"DESCRIBE_OBJECT","data":{"objectName":"Case"}}

For LIST_OBJECTS:
{"action":"LIST_OBJECTS","data":{}}

PRACTICAL EXAMPLES:
1. "Create a contact and link with case 500Pw00000RocDsIAJ":
   MUST USE: {"action":"CREATE_AND_LINK","data":{"createObject":"Contact","createData":{"FirstName":"New","LastName":"Contact"},"linkToObject":"Case","linkToRecordId":"500Pw00000RocDsIAJ","linkField":"ContactId"}}
   DO NOT USE: CREATE_RECORD for this - it won't link automatically!

2. "Create a contact named Sarah with email sarah@test.com":
   {"action":"CREATE_RECORD","data":{"objectType":"Contact","FirstName":"Sarah","LastName":"Smith","Email":"sarah@test.com"}}

3. "Create a contact" (without details):
   {"action":"CREATE_RECORD","data":{"objectType":"Contact","FirstName":"New","LastName":"Contact"}}

4. "Create a case":
   {"action":"CREATE_CASE","data":{"Subject":"New Issue","Description":"Case description","Origin":"Web","Priority":"Medium"}}

5. "Create an account named Acme Corp":
   {"action":"CREATE_RECORD","data":{"objectType":"Account","Name":"Acme Corp"}}

6. "Link contact 003xxx to case 500xxx":
   {"action":"UPDATE","data":{"objectType":"Case","recordId":"500xxx","fields":{"ContactId":"003xxx"}}}

Remember: Use CREATE_AND_LINK for "create X and link to Y" requests to handle both operations automatically.${errorContext}`;

      const response = await this.callAI(systemPrompt, userPrompt);
      console.log('🤖 AI Response:', response);

      // Parse JSON from response
      let actionData;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        actionData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(response);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        if (retryCount < MAX_RETRIES) {
          return await this.processPrompt(userPrompt, conversationId, `Parse failed: ${response}`, retryCount + 1);
        }
        return {
          success: false,
          message: '❌ Could not understand the request. Please rephrase.',
          aiResponse: response
        };
      }

      // Validate and execute
      if (!actionData.action) {
        if (retryCount < MAX_RETRIES) {
          return await this.processPrompt(userPrompt, conversationId, 'Missing action field', retryCount + 1);
        }
        return {
          success: false,
          message: '❌ Could not determine the action.',
          aiResponse: response
        };
      }

      console.log(`🎯 Action: ${actionData.action}`);
      console.log(`📋 Data received:`, JSON.stringify(actionData.data, null, 2));

      // Fix common format issues from AI responses
      if (actionData.action === 'CREATE_RECORD' && actionData.data) {
        // Smart detection: If prompt mentions "link" and data has CaseId/AccountId, convert to CREATE_AND_LINK
        const promptLower = userPrompt.toLowerCase();
        if ((promptLower.includes('link') || promptLower.includes('connect')) && actionData.data) {
          // Check if AI included a relationship ID in the data (like CaseId)
          const caseIdMatch = actionData.data.CaseId || (promptLower.match(/case\s+([a-z0-9]{15,18})/i) || [])[1];
          const accountIdMatch = actionData.data.AccountId;
          
          if (caseIdMatch && actionData.data.objectType === 'Contact') {
            console.log('🔄 Auto-converting CREATE_RECORD → CREATE_AND_LINK (Contact + Case)');
            const { objectType, CaseId, ...contactFields } = actionData.data;
            actionData.action = 'CREATE_AND_LINK';
            actionData.data = {
              createObject: 'Contact',
              createData: contactFields,
              linkToObject: 'Case',
              linkToRecordId: caseIdMatch,
              linkField: 'ContactId'
            };
            console.log(`✅ Converted to CREATE_AND_LINK:`, JSON.stringify(actionData.data, null, 2));
          }
        }
        
        // Fix 1: Convert objectName to objectType
        if (actionData.data.objectName && !actionData.data.objectType) {
          console.log('⚠️ Converting objectName → objectType');
          actionData.data.objectType = actionData.data.objectName;
          delete actionData.data.objectName;
        }
        
        // Fix 2: Flatten fields if nested
        if (actionData.data.fields && typeof actionData.data.fields === 'object') {
          console.log('⚠️ Flattening nested fields');
          const { fields, objectType, ...rest } = actionData.data;
          actionData.data = { objectType: objectType || actionData.data.objectType, ...fields, ...rest };
        }
        
        console.log(`✅ Corrected data:`, JSON.stringify(actionData.data, null, 2));
      }

      // Execute the action
      const result = await this.executeAction(actionData.action, actionData.data, response);
      return result;

    } catch (error) {
      console.error('❌ Error:', error);
      if (retryCount < MAX_RETRIES) {
        return await this.processPrompt(userPrompt, conversationId, error.message, retryCount + 1);
      }
      return {
        success: false,
        message: `❌ Error: ${error.message}`,
        error: error.toString()
      };
    }
  }

  async callAI(systemPrompt, userPrompt) {
    const config = this.configs[this.provider];
    
    if (config.format === 'openai') {
      // OpenAI-compatible format (Groq, OpenAI, Mistral, Perplexity)
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${this.provider} API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
      
    } else if (config.format === 'anthropic') {
      // Anthropic Claude format
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 500,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userPrompt }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.content[0].text;
    }
    
    throw new Error(`Unsupported provider format: ${config.format}`);
  }

  async executeAction(action, data, aiResponse) {
    const actionMap = {
      // Standard actions
      'CREATE_CASE': () => this.createRecord('Case', data),
      'CREATE_LEAD': () => this.createRecord('Lead', data),
      'CREATE_RECORD': () => this.createRecord(data.objectType, data),
      'CREATE_AND_LINK': () => this.createAndLink(data),
      'EXECUTE_QUERY': () => this.executeQuery(data),
      'UPDATE_RECORD': () => this.updateRecord(data),
      'UPDATE': () => this.updateRecord(data),
      'DELETE_RECORD': () => this.deleteRecord(data),
      'DELETE': () => this.deleteRecord(data),
      'DESCRIBE_OBJECT': () => this.describeObject(data),
      'LIST_OBJECTS': () => this.listObjects(data),
      // Alternative action names (for compatibility)
      'QUERY': () => this.executeQuery(data),
      'CREATE': () => this.createRecord(data.objectType || 'Case', data)
    };

    const handler = actionMap[action.toUpperCase()];
    if (!handler) {
      return {
        success: false,
        message: `❌ Unknown action: ${action}. Available: CREATE_CASE, QUERY, UPDATE, DELETE, DESCRIBE_OBJECT, LIST_OBJECTS`,
        aiResponse
      };
    }

    try {
      const result = await handler();
      return {
        ...result,
        aiResponse
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Action execution failed: ${error.message}`,
        error: error.message,
        aiResponse
      };
    }
  }

  // Salesforce operations (same as before)
  async createRecord(objectType, data) {
    try {
      // Validate objectType
      if (!objectType || objectType === 'undefined') {
        return {
          success: false,
          message: `❌ Invalid objectType: "${objectType}". Please specify a valid Salesforce object (e.g., Contact, Account, Case).`,
          error: 'Missing or invalid objectType'
        };
      }
      
      console.log(`📝 Creating ${objectType}:`, data);
      
      // Remove objectType from data before sending to Salesforce
      const { objectType: _unused, ...cleanData } = data;
      
      const result = await this.sfConnection.conn.sobject(objectType).create(cleanData);
      
      return {
        success: true,
        message: `✅ ${objectType} created successfully!\n\n**ID:** ${result.id}`,
        result: { id: result.id, ...cleanData }
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to create ${objectType}: ${error.message}`,
        error: error.message
      };
    }
  }

  async createAndLink(data) {
    try {
      // Validate required fields
      const { createObject, createData, linkToObject, linkToRecordId, linkField } = data;
      
      if (!createObject || !createData || !linkToObject || !linkToRecordId || !linkField) {
        return {
          success: false,
          message: `❌ CREATE_AND_LINK requires: createObject, createData, linkToObject, linkToRecordId, linkField`,
          error: 'Missing required fields for CREATE_AND_LINK'
        };
      }

      console.log(`🔗 CREATE_AND_LINK: Creating ${createObject} and linking to ${linkToObject} ${linkToRecordId}`);
      
      // Step 1: Create the record
      const createResult = await this.createRecord(createObject, createData);
      
      if (!createResult.success) {
        return createResult; // Return the error from create
      }
      
      const createdRecordId = createResult.result.id;
      console.log(`✅ Created ${createObject} with ID: ${createdRecordId}`);
      
      // Step 2: Link by updating the target record
      const updateData = {
        objectType: linkToObject,
        recordId: linkToRecordId,
        fields: { [linkField]: createdRecordId }
      };
      
      console.log(`🔗 Linking: Updating ${linkToObject} ${linkToRecordId} with ${linkField}=${createdRecordId}`);
      const updateResult = await this.updateRecord(updateData);
      
      if (!updateResult.success) {
        return {
          success: false,
          message: `⚠️ ${createObject} created (ID: ${createdRecordId}) but linking failed: ${updateResult.message}`,
          error: updateResult.error,
          partialSuccess: { createdRecordId }
        };
      }
      
      return {
        success: true,
        message: `✅ ${createObject} created and linked to ${linkToObject}!\n\n**${createObject} ID:** ${createdRecordId}\n**Linked to ${linkToObject}:** ${linkToRecordId}`,
        result: {
          createdRecordId,
          linkedToRecordId: linkToRecordId,
          linkField
        }
      };
      
    } catch (error) {
      return {
        success: false,
        message: `❌ CREATE_AND_LINK failed: ${error.message}`,
        error: error.message
      };
    }
  }

  async executeQuery(data) {
    try {
      // Support both 'query' and SOQL object format
      let soql;
      if (data.query) {
        soql = data.query;
      } else if (data.object) {
        // Build SOQL from object format (from gemini handler)
        const fields = data.fields || ['Id', 'Name'];
        const conditions = data.conditions ? ` WHERE ${data.conditions}` : '';
        const limit = data.limit ? ` LIMIT ${data.limit}` : ' LIMIT 10';
        soql = `SELECT ${fields.join(', ')} FROM ${data.object}${conditions}${limit}`;
      } else {
        throw new Error('Query requires either "query" string or "object" with "fields"');
      }
      
      console.log('🔍 Executing SOQL:', soql);
      const result = await this.sfConnection.conn.query(soql);
      
      return {
        success: true,
        message: `✅ Query executed: ${result.totalSize} record(s) found`,
        result: {
          totalSize: result.totalSize,
          records: result.records
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Query failed: ${error.message}`,
        error: error.message
      };
    }
  }

  async updateRecord(data) {
    try {
      const { objectType, recordId, fields } = data;
      console.log(`🔄 Updating ${objectType} ${recordId}:`, fields);
      
      await this.sfConnection.conn.sobject(objectType).update({
        Id: recordId,
        ...fields
      });
      
      return {
        success: true,
        message: `✅ ${objectType} updated successfully!`,
        result: { id: recordId, ...fields }
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Update failed: ${error.message}`,
        error: error.message
      };
    }
  }

  async deleteRecord(data) {
    try {
      const { objectType, recordId, object } = data;
      const objType = objectType || object;
      
      if (!objType || !recordId) {
        throw new Error('Both objectType and recordId are required for delete operations');
      }
      
      console.log(`🗑️ Deleting ${objType} record: ${recordId}`);
      
      // Use JSForce destroy method which handles Salesforce REST API correctly
      const result = await this.sfConnection.conn.sobject(objType).destroy(recordId);
      
      if (!result.success) {
        throw new Error(`Salesforce delete failed: ${result.errors ? JSON.stringify(result.errors) : 'Unknown error'}`);
      }
      
      return {
        success: true,
        message: `✅ ${objType} record deleted successfully! (ID: ${recordId})`,
        result: { id: recordId, objectType: objType }
      };
    } catch (error) {
      console.error('Delete error:', error);
      
      // Better error messages for common issues
      let errorMsg = error.message;
      if (errorMsg.includes('not allowed')) {
        errorMsg = `The object type may not support delete operations, or you may not have permission to delete this record.`;
      } else if (errorMsg.includes('ENTITY_IS_DELETED')) {
        errorMsg = `Record is already deleted.`;
      } else if (errorMsg.includes('INVALID_ID')) {
        errorMsg = `Invalid record ID format.`;
      }
      
      return {
        success: false,
        message: `❌ Delete failed: ${errorMsg}`,
        error: error.message
      };
    }
  }

  async describeObject(data) {
    try {
      const { objectName } = data;
      console.log(`🔍 Describing: ${objectName}`);
      
      const description = await this.sfConnection.conn.sobject(objectName).describe();
      const fields = description.fields.map(f => ({
        name: f.name,
        label: f.label,
        type: f.type,
        custom: f.custom
      }));
      
      const customFields = fields.filter(f => f.custom);
      
      return {
        success: true,
        message: `📋 ${description.label} (${description.name})\n\n` +
                 `Total Fields: ${fields.length}\n` +
                 `Custom Fields: ${customFields.length}`,
        result: {
          objectName: description.name,
          label: description.label,
          fields,
          customFields
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Describe failed: ${error.message}`,
        error: error.message
      };
    }
  }

  async listObjects(data) {
    try {
      const { customOnly, standardOnly } = data || {};
      console.log('🔍 Listing objects...');
      
      const globalDescribe = await this.sfConnection.conn.describeGlobal();
      let objects = globalDescribe.sobjects.map(obj => ({
        name: obj.name,
        label: obj.label,
        custom: obj.custom
      }));
      
      if (customOnly) objects = objects.filter(obj => obj.custom);
      if (standardOnly) objects = objects.filter(obj => !obj.custom);
      
      return {
        success: true,
        message: `✅ Found ${objects.length} object(s)`,
        result: { totalObjects: objects.length, objects }
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ List failed: ${error.message}`,
        error: error.message
      };
    }
  }
}

module.exports = UniversalAIHandler;

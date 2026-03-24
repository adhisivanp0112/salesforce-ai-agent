const { Pool } = require('pg');

// Database configuration
const dbConfig = {
  user: process.env.DB_USER || 'admin',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'salesforce_chat',
  password: process.env.DB_PASSWORD || 'admin123',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create connection pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

// Test database connection
const testConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected successfully at:', result.rows[0].now);
    
    // Check if pgvector extension is installed
    const vectorCheck = await client.query(
      "SELECT * FROM pg_extension WHERE extname = 'vector'"
    );
    
    if (vectorCheck.rows.length > 0) {
      console.log('✅ pgvector extension is installed');
    } else {
      console.warn('⚠️  pgvector extension not found');
    }
    
    return true;
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    console.error('   Make sure PostgreSQL is running: docker-compose up -d');
    return false;
  } finally {
    if (client) client.release();
  }
};

// Setup database tables (if not using init-db.sql)
const setupDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log('🔧 Setting up database tables...');
    
    // Try to enable pgvector extension (skip if not available)
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');
      console.log('✅ pgvector extension enabled');
    } catch (extErr) {
      console.log('⚠️  pgvector extension not available (vector search disabled)');
    }

    // Create the conversations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        message_count INTEGER DEFAULT 0
      );
    `);

    // Create the chat_history table (without embedding column)
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id SERIAL PRIMARY KEY,
        conversation_id VARCHAR(255) REFERENCES conversations(id) ON DELETE CASCADE,
        user_prompt TEXT NOT NULL,
        ai_response TEXT,
        action_type VARCHAR(50),
        result_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_conversation_id ON chat_history(conversation_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_created_at ON chat_history(created_at DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);
    `);

    // Skip embedding index (pgvector not available)

    console.log('✅ Database tables and indexes created successfully');
    
  } catch (err) {
    console.error('❌ Error setting up database:', err.message);
    throw err;
  } finally {
    client.release();
  }
};

// Database helper functions
const dbHelpers = {
  // Save a new conversation
  async createConversation(id, title) {
    const query = `
      INSERT INTO conversations (id, title, message_count)
      VALUES ($1, $2, 0)
      RETURNING *;
    `;
    const result = await pool.query(query, [id, title]);
    return result.rows[0];
  },

  // Update conversation title
  async updateConversationTitle(id, title) {
    const query = `
      UPDATE conversations 
      SET title = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `;
    const result = await pool.query(query, [title, id]);
    return result.rows[0];
  },

  // Get all conversations
  async getConversations() {
    const query = `
      SELECT * FROM conversations 
      ORDER BY updated_at DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  // Save chat message
  async saveChatMessage(conversationId, userPrompt, embedding = null) {
    // Auto-create conversation if it doesn't exist
    // Use first 50 chars of prompt as title
    const title = userPrompt.substring(0, 50) + (userPrompt.length > 50 ? '...' : '');
    await pool.query(`
      INSERT INTO conversations (id, title, message_count)
      VALUES ($1, $2, 0)
      ON CONFLICT (id) DO UPDATE SET title = CASE 
        WHEN conversations.title = 'Conversation' OR conversations.title = 'New Conversation' 
        THEN EXCLUDED.title 
        ELSE conversations.title 
      END
    `, [conversationId, title]);
    
    const query = `
      INSERT INTO chat_history (conversation_id, user_prompt)
      VALUES ($1, $2)
      RETURNING id;
    `;
    const result = await pool.query(query, [conversationId, userPrompt]);
    
    // Update conversation message count
    await pool.query(`
      UPDATE conversations 
      SET message_count = message_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [conversationId]);
    
    return result.rows[0].id;
  },

  // Update chat message with AI response
  async updateChatResponse(chatId, aiResponse, actionType = null, resultData = null) {
    const query = `
      UPDATE chat_history 
      SET ai_response = $1, action_type = $2, result_data = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *;
    `;
    const result = await pool.query(query, [aiResponse, actionType, resultData, chatId]);
    return result.rows[0];
  },

  // Get conversation history
  async getConversationHistory(conversationId, limit = 50) {
    const query = `
      SELECT * FROM chat_history 
      WHERE conversation_id = $1 
      ORDER BY created_at ASC
      LIMIT $2;
    `;
    const result = await pool.query(query, [conversationId, limit]);
    return result.rows;
  },

  // Semantic search using pgvector (disabled - requires pgvector extension)
  async semanticSearch(embedding, limit = 5) {
    console.log('⚠️  Semantic search disabled - pgvector extension not installed');
    return [];
  },

  // Delete conversation and its messages
  async deleteConversation(id) {
    // Delete chat_history first
    await pool.query(`DELETE FROM chat_history WHERE conversation_id = $1`, [id]);
    // Then delete conversation
    await pool.query(`DELETE FROM conversations WHERE id = $1`, [id]);
  },

  // Get database statistics
  async getStats() {
    const conversationsCount = await pool.query('SELECT COUNT(*) FROM conversations');
    const messagesCount = await pool.query('SELECT COUNT(*) FROM chat_history');
    
    return {
      conversations: parseInt(conversationsCount.rows[0].count),
      messages: parseInt(messagesCount.rows[0].count),
      embeddings: 0 // pgvector disabled
    };
  }
};

module.exports = {
  pool,
  testConnection,
  setupDatabase,
  ...dbHelpers
};


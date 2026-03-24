-- Initialize database with pgvector extension and tables

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create chat_history table to store all conversations
CREATE TABLE IF NOT EXISTS chat_history (
    id SERIAL PRIMARY KEY,
    conversation_id VARCHAR(255),
    user_prompt TEXT NOT NULL,
    ai_response TEXT,
    action_type VARCHAR(50),
    result_data JSONB,
    embedding vector(768),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on conversation_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_conversation_id ON chat_history(conversation_id);

-- Create index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_created_at ON chat_history(created_at DESC);

-- Create index on embedding for similarity search (using cosine distance)
CREATE INDEX IF NOT EXISTS idx_embedding ON chat_history USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Create conversations table to store conversation metadata
CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    message_count INTEGER DEFAULT 0
);

-- Create index on conversations updated_at
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_chat_history_updated_at BEFORE UPDATE ON chat_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional - for testing)
INSERT INTO conversations (id, title, message_count) 
VALUES 
    ('sample-conv-1', 'Sample Conversation', 0)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE chat_history IS 'Stores all chat messages with AI responses and embeddings for semantic search';
COMMENT ON TABLE conversations IS 'Stores conversation metadata and titles';
COMMENT ON COLUMN chat_history.embedding IS 'Vector embedding of user prompt for semantic similarity search';
COMMENT ON COLUMN chat_history.action_type IS 'Type of Salesforce action: query, create, update, delete, etc.';
COMMENT ON COLUMN chat_history.result_data IS 'JSON data containing Salesforce operation results';


# 📊 Database Setup Guide - pgvector & pgAdmin

This guide will help you set up PostgreSQL with pgvector extension and pgAdmin for storing chat history with semantic search capabilities.

## 🎯 What You Get

- **PostgreSQL Database** with pgvector extension for vector embeddings
- **pgAdmin** web interface for database management
- **Automatic chat history storage** with semantic search
- **Conversation persistence** across sessions
- **Similar query detection** using AI embeddings

## 📋 Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ 
- Salesforce Admin App already set up

## 🚀 Quick Start

### Step 1: Start Database Services

```bash
cd backend
docker-compose up -d
```

This will start:
- **PostgreSQL** on port 5432 with pgvector
- **pgAdmin** on port 5050 for database management

### Step 2: Configure Environment

Edit `backend/.env` and set:

```bash
# Enable database storage
USE_DATABASE=true

# Database connection (defaults match docker-compose)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=salesforce_chat
DB_USER=admin
DB_PASSWORD=admin123
```

### Step 3: Install Dependencies

```bash
cd backend
npm install
```

This will install the `pg` (PostgreSQL) package.

### Step 4: Restart Backend

```bash
# Stop the current backend (Ctrl+C)
# Then start it again
npm start
```

You should see:
```
✅ Database connected successfully
✅ pgvector extension is installed
🔧 Setting up database tables...
✅ Database tables and indexes created successfully
```

## 🗄️ Database Schema

### Tables Created

#### 1. `conversations`
Stores conversation metadata:
- `id` - Unique conversation identifier
- `title` - Conversation title
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `message_count` - Number of messages

#### 2. `chat_history`
Stores all chat messages:
- `id` - Auto-incrementing primary key
- `conversation_id` - Links to conversations table
- `user_prompt` - User's input text
- `ai_response` - AI's response
- `action_type` - Salesforce action (query, create, update, delete)
- `result_data` - JSON data from Salesforce operation
- `embedding` - Vector embedding (768 dimensions) for semantic search
- `created_at` - Message timestamp
- `updated_at` - Last update timestamp

### Indexes

- Conversation ID index for fast lookups
- Timestamp index for sorting
- **pgvector index** for similarity search using cosine distance

## 🔍 Using pgAdmin

### Access pgAdmin

1. Open browser: http://localhost:5050
2. Login credentials:
   - Email: `admin@salesforce.com`
   - Password: `admin123`

### Connect to Database

1. Click "Add New Server"
2. **General tab**:
   - Name: `Salesforce Admin DB`
3. **Connection tab**:
   - Host: `postgres` (or `localhost` if connecting from host machine)
   - Port: `5432`
   - Database: `salesforce_chat`
   - Username: `admin`
   - Password: `admin123`
4. Click "Save"

### Useful Queries

#### View all conversations
```sql
SELECT * FROM conversations 
ORDER BY updated_at DESC;
```

#### View chat history for a conversation
```sql
SELECT * FROM chat_history 
WHERE conversation_id = 'your-conversation-id'
ORDER BY created_at ASC;
```

#### Count messages by action type
```sql
SELECT action_type, COUNT(*) 
FROM chat_history 
GROUP BY action_type;
```

#### Find similar queries using vector search
```sql
SELECT 
    user_prompt, 
    ai_response,
    1 - (embedding <=> '[your-embedding-vector]') as similarity
FROM chat_history
WHERE embedding IS NOT NULL
ORDER BY embedding <=> '[your-embedding-vector]'
LIMIT 5;
```

## 📊 API Endpoints for Database

### Get Database Statistics
```bash
GET http://localhost:3001/api/database/stats
```

Response:
```json
{
  "success": true,
  "stats": {
    "conversations": 10,
    "messages": 150,
    "embeddings": 145
  }
}
```

### Get All Conversations
```bash
GET http://localhost:3001/api/database/conversations
```

### Get Conversation History
```bash
GET http://localhost:3001/api/database/conversation/:id
```

## 🔧 Database Management

### View Logs
```bash
docker-compose logs -f postgres
```

### Stop Database
```bash
docker-compose down
```

### Stop and Remove Data
```bash
docker-compose down -v
```
**Warning**: This deletes all stored data!

### Backup Database
```bash
docker exec salesforce_admin_db pg_dump -U admin salesforce_chat > backup.sql
```

### Restore Database
```bash
docker exec -i salesforce_admin_db psql -U admin salesforce_chat < backup.sql
```

### Restart Database
```bash
docker-compose restart
```

## 🧪 Testing Database Connection

### From Backend
```bash
cd backend
node -e "const db = require('./db'); db.testConnection().then(() => process.exit(0));"
```

### From psql Command Line
```bash
docker exec -it salesforce_admin_db psql -U admin -d salesforce_chat
```

Then run:
```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
\dt
\d chat_history
```

## 🐛 Troubleshooting

### Database won't start
```bash
# Check if port 5432 is already in use
lsof -i :5432

# If something is using it, stop it or change DB_PORT in docker-compose.yml
```

### pgAdmin won't connect
```bash
# Make sure database is running
docker ps | grep postgres

# Check database logs
docker-compose logs postgres
```

### App can't connect to database
1. Verify `USE_DATABASE=true` in `.env`
2. Check database is running: `docker ps`
3. Verify connection settings match `docker-compose.yml`
4. Look for errors in backend console

### Reset everything
```bash
# Stop all containers and remove volumes
docker-compose down -v

# Remove containers
docker-compose rm -f

# Start fresh
docker-compose up -d

# Wait 10 seconds for initialization
sleep 10

# Restart backend
cd .. && pkill -f "node server-improved" && cd backend && npm start
```

## 📈 Performance Tips

### Monitor Database Size
```sql
SELECT 
    pg_size_pretty(pg_database_size('salesforce_chat')) as db_size;
```

### Optimize Indexes
```sql
-- Rebuild pgvector index if you have many records
DROP INDEX IF EXISTS idx_embedding;
CREATE INDEX idx_embedding ON chat_history 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);
```

### Clean Old Data
```sql
-- Delete conversations older than 30 days
DELETE FROM conversations 
WHERE created_at < NOW() - INTERVAL '30 days';
```

## 🔐 Security Notes

**For Production:**

1. Change default passwords in `docker-compose.yml`
2. Use environment variables for sensitive data
3. Enable SSL for PostgreSQL connections
4. Restrict pgAdmin access with firewall rules
5. Regular backups of database

## 🎓 Learning Resources

- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pgAdmin Documentation](https://www.pgadmin.org/docs/)
- [Vector Similarity Search](https://www.postgresql.org/docs/current/functions-array.html)

## ✅ Next Steps

Once database is running:
1. The app will automatically save all conversations
2. View data in pgAdmin
3. Use semantic search to find similar queries
4. Export conversation history for analysis

Enjoy your enhanced Salesforce Admin App with persistent storage! 🎉


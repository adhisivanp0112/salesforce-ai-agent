# ✅ pgvector & pgAdmin Setup Complete!

Your Salesforce Admin App now has **optional database storage** with semantic search capabilities using PostgreSQL and pgvector.

## 🎉 What Was Added

### 1. **Database Files**
- ✅ `backend/docker-compose.yml` - PostgreSQL + pgAdmin containers
- ✅ `backend/db.js` - Database connection and helper functions
- ✅ `backend/init-db.sql` - Database schema with pgvector extension
- ✅ `start-database.sh` - Quick start script for database

### 2. **Updated Files**
- ✅ `backend/geminiAIHandler.js` - Added database integration for chat history
- ✅ `backend/server-improved.js` - Added database endpoints and initialization
- ✅ `backend/package.json` - Added `pg` (PostgreSQL) dependency
- ✅ `backend/env.example` - Added database configuration options
- ✅ `README.md` - Added database information
- ✅ `DATABASE_SETUP.md` - Comprehensive database guide

### 3. **Features**
- ✅ Persistent chat history storage
- ✅ Vector embeddings for semantic search (768 dimensions)
- ✅ pgAdmin web interface for database management
- ✅ Automatic conversation tracking
- ✅ Similar query detection
- ✅ Database statistics API endpoints

## 🚀 Quick Start (3 Steps)

### Step 1: Start Database
```bash
./start-database.sh
```

Or manually:
```bash
cd backend
docker-compose up -d
```

### Step 2: Enable Database in Backend
Edit `backend/.env`:
```bash
USE_DATABASE=true
```

### Step 3: Install Dependencies & Restart
```bash
cd backend
npm install
# Then restart your backend server
```

## 📊 Access Services

### PostgreSQL Database
- **Host**: localhost
- **Port**: 5432
- **Database**: salesforce_chat
- **Username**: admin
- **Password**: admin123

### pgAdmin Web Interface
- **URL**: http://localhost:5050
- **Email**: admin@salesforce.com
- **Password**: admin123

## 🗄️ Database Schema

### Tables
1. **conversations** - Stores conversation metadata
   - id, title, created_at, updated_at, message_count

2. **chat_history** - Stores all messages with AI embeddings
   - id, conversation_id, user_prompt, ai_response
   - action_type, result_data (JSON)
   - embedding (vector 768 dimensions)
   - created_at, updated_at

### Indexes
- Conversation ID (fast lookups)
- Timestamps (sorting)
- **pgvector IVFFlat** (similarity search using cosine distance)

## 🔌 New API Endpoints

### Database Statistics
```bash
GET http://localhost:3001/api/database/stats
```

### All Conversations
```bash
GET http://localhost:3001/api/database/conversations
```

### Conversation History
```bash
GET http://localhost:3001/api/database/conversation/:id
```

## 💡 How It Works

1. **User sends a message** → Saved to database with conversation ID
2. **AI generates embedding** → 768-dimensional vector using text-embedding-004
3. **AI processes request** → Executes Salesforce operation
4. **Response saved** → Stored with action type and results
5. **Semantic search** → Find similar past queries using vector similarity

## 🧪 Testing

### Test Database Connection
```bash
cd backend
node -e "const db = require('./db'); db.testConnection().then(() => process.exit(0));"
```

### Query Database Directly
```bash
docker exec -it salesforce_admin_db psql -U admin -d salesforce_chat
```

SQL Commands:
```sql
-- View all conversations
SELECT * FROM conversations ORDER BY updated_at DESC;

-- View recent messages
SELECT * FROM chat_history ORDER BY created_at DESC LIMIT 10;

-- Count by action type
SELECT action_type, COUNT(*) FROM chat_history GROUP BY action_type;
```

## 🔧 Management Commands

### View Logs
```bash
cd backend
docker-compose logs -f
```

### Stop Database
```bash
cd backend
docker-compose down
```

### Restart Database
```bash
cd backend
docker-compose restart
```

### Backup Database
```bash
docker exec salesforce_admin_db pg_dump -U admin salesforce_chat > backup.sql
```

### Reset Database (WARNING: Deletes all data)
```bash
cd backend
docker-compose down -v
docker-compose up -d
```

## 🎯 Use Cases

### 1. **Conversation History**
All your chats are saved and can be retrieved later

### 2. **Semantic Search**
Find similar past queries:
```javascript
const similar = await db.semanticSearch(embedding, 5);
// Returns 5 most similar queries with similarity scores
```

### 3. **Analytics**
Query your Salesforce usage patterns:
```sql
SELECT 
    action_type, 
    COUNT(*) as count,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_response_time
FROM chat_history 
GROUP BY action_type;
```

### 4. **Data Export**
Export conversations for training or analysis

## 📖 Documentation

- **Full Setup Guide**: [DATABASE_SETUP.md](./DATABASE_SETUP.md)
- **Main README**: [README.md](./README.md)
- **Troubleshooting**: See DATABASE_SETUP.md § Troubleshooting

## 🔐 Security Notes

**Current setup is for development only!**

For production:
1. Change default passwords in `docker-compose.yml`
2. Use strong passwords and store in environment variables
3. Enable SSL for PostgreSQL
4. Restrict pgAdmin access
5. Set up regular automated backups
6. Use Docker secrets for sensitive data

## ⚙️ Configuration Options

In `backend/.env`:

```bash
# Enable/disable database (works without it)
USE_DATABASE=true  # false or true

# Database connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=salesforce_chat
DB_USER=admin
DB_PASSWORD=admin123
```

## 🎓 Benefits

### With Database Enabled:
- ✅ Chat history persists across sessions
- ✅ Semantic search finds similar queries
- ✅ Analytics on your Salesforce usage
- ✅ Export data for reporting
- ✅ Training data for custom AI models

### Without Database (Default):
- ✅ App works normally
- ✅ Faster startup
- ✅ No Docker required
- ✅ Simpler deployment

## 🌟 Next Steps

1. **Test it out**: Start the database and enable it
2. **Explore pgAdmin**: Browse your chat history visually
3. **Query analytics**: See what Salesforce operations you use most
4. **Semantic search**: Find similar past queries
5. **Customize**: Modify schema in `init-db.sql` for your needs

## ❓ Questions?

- See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed guide
- Check troubleshooting section
- Review pgvector documentation: https://github.com/pgvector/pgvector

---

**Happy coding! 🚀**

Your Salesforce Admin App is now enterprise-ready with optional persistent storage and semantic search capabilities powered by pgvector!


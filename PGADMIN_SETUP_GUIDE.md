# 🔧 pgAdmin Setup Guide - View Your Chat History Data

Complete guide to set up pgAdmin desktop application and view all stored conversation data.

## 📋 Prerequisites

- ✅ pgAdmin installed on your computer
- ✅ PostgreSQL database running (see setup below)
- ✅ Backend configured with `USE_DATABASE=true`

---

## 🚀 Step 1: Start PostgreSQL Database

You have two options to run PostgreSQL:

### **Option A: Using Docker (Recommended)**

If you have Docker Desktop installed:

```bash
# Navigate to backend directory
cd /Users/home/Desktop/salesforce-admin-app/backend

# Start PostgreSQL with Docker
docker compose up -d postgres
```

This starts PostgreSQL on `localhost:5432`

### **Option B: Using Local PostgreSQL**

If you have PostgreSQL installed locally:

```bash
# Start PostgreSQL service (macOS with Homebrew)
brew services start postgresql@14

# Or using pg_ctl
pg_ctl -D /usr/local/var/postgres start
```

---

## 🔌 Step 2: Configure pgAdmin Connection

### **Open pgAdmin Desktop Application**

1. Launch **pgAdmin** from your Applications folder
2. You may be prompted to set a master password (choose something secure)

### **Create New Server Connection**

1. **Right-click** on "Servers" in the left sidebar
2. Select **"Register" → "Server..."**

### **Configure General Tab**

- **Name**: `Salesforce Admin Database`
- **Server Group**: `Servers` (default)
- **Comments**: `Chat history with vector embeddings`

### **Configure Connection Tab**

Enter these details:

| Field | Value |
|-------|-------|
| **Host name/address** | `localhost` |
| **Port** | `5432` |
| **Maintenance database** | `salesforce_chat` |
| **Username** | `admin` |
| **Password** | `admin123` |
| **Save password?** | ✅ Check this box |

### **Advanced Tab (Optional)**

- **DB restriction**: `salesforce_chat` (to only show this database)

### **Click "Save"**

pgAdmin will now connect to your database!

---

## 📊 Step 3: Browse Your Data

### **Navigate to Your Tables**

In the left sidebar (Browser), expand:

```
Servers
  └── Salesforce Admin Database
      └── Databases
          └── salesforce_chat
              └── Schemas
                  └── public
                      └── Tables
```

You should see:
- 📋 `chat_history` - All messages with AI responses
- 💬 `conversations` - Conversation metadata

### **View Table Data**

**Right-click** on a table → **"View/Edit Data"** → **"All Rows"**

Or use the Query Tool (see Step 4)

---

## 🔍 Step 4: Query Your Data

### **Open Query Tool**

1. Click on `salesforce_chat` database
2. Click **Tools** → **Query Tool** (or press F5)
3. Enter SQL queries and click the **▶ Play** button

### **Useful Queries**

#### **View All Conversations**
```sql
SELECT 
    id,
    title,
    message_count,
    created_at,
    updated_at
FROM conversations 
ORDER BY updated_at DESC;
```

#### **View All Chat Messages**
```sql
SELECT 
    id,
    conversation_id,
    user_prompt,
    ai_response,
    action_type,
    created_at
FROM chat_history 
ORDER BY created_at DESC
LIMIT 50;
```

#### **View Recent Conversations with Message Counts**
```sql
SELECT 
    c.title,
    c.message_count,
    c.created_at,
    COUNT(ch.id) as actual_messages
FROM conversations c
LEFT JOIN chat_history ch ON c.id = ch.conversation_id
GROUP BY c.id, c.title, c.message_count, c.created_at
ORDER BY c.updated_at DESC;
```

#### **Search Messages by Content**
```sql
SELECT 
    user_prompt,
    ai_response,
    action_type,
    created_at
FROM chat_history
WHERE user_prompt ILIKE '%case%'  -- Search for 'case'
ORDER BY created_at DESC;
```

#### **Count Actions by Type**
```sql
SELECT 
    action_type,
    COUNT(*) as count
FROM chat_history
WHERE action_type IS NOT NULL
GROUP BY action_type
ORDER BY count DESC;
```

#### **View Messages with Embeddings**
```sql
SELECT 
    id,
    user_prompt,
    CASE 
        WHEN embedding IS NOT NULL THEN '✅ Has embedding'
        ELSE '❌ No embedding'
    END as embedding_status
FROM chat_history
ORDER BY created_at DESC;
```

#### **Database Statistics**
```sql
SELECT 
    (SELECT COUNT(*) FROM conversations) as total_conversations,
    (SELECT COUNT(*) FROM chat_history) as total_messages,
    (SELECT COUNT(*) FROM chat_history WHERE embedding IS NOT NULL) as messages_with_embeddings,
    (SELECT COUNT(*) FROM chat_history WHERE action_type = 'query') as query_actions,
    (SELECT COUNT(*) FROM chat_history WHERE action_type = 'create_case') as create_actions;
```

---

## 🎨 Step 5: Visualize Data

### **Create a Dashboard**

1. Right-click on `salesforce_chat` → **Dashboard**
2. View:
   - Database size
   - Table sizes
   - Active connections
   - Server activity

### **View Table Structure**

Right-click on a table → **Properties** → **Columns**

See all fields including:
- `embedding` (vector 768) - AI embeddings
- `result_data` (jsonb) - Salesforce operation results
- Indexes and constraints

### **Export Data**

1. Right-click on table → **Import/Export Data**
2. Choose format: CSV, JSON, etc.
3. Export for analysis in Excel, Python, etc.

---

## 🔧 Step 6: Advanced Features

### **Vector Search Queries**

Find similar messages using pgvector:

```sql
-- First, get an embedding vector from a message
SELECT embedding 
FROM chat_history 
WHERE id = 1;

-- Then use it to find similar messages
-- Replace [embedding_values] with actual vector
SELECT 
    user_prompt,
    ai_response,
    1 - (embedding <=> '[0.1,0.2,...]'::vector) as similarity
FROM chat_history
WHERE embedding IS NOT NULL
ORDER BY embedding <=> '[0.1,0.2,...]'::vector
LIMIT 5;
```

### **JSON Data Queries**

Query the `result_data` JSONB field:

```sql
SELECT 
    user_prompt,
    result_data->>'id' as record_id,
    result_data->'records' as records
FROM chat_history
WHERE action_type = 'query'
  AND result_data IS NOT NULL;
```

### **Time-Based Analysis**

```sql
SELECT 
    DATE(created_at) as date,
    COUNT(*) as messages_per_day
FROM chat_history
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 🐛 Troubleshooting

### **Can't Connect to Database**

**Error**: "Could not connect to server"

**Solutions**:

1. **Check if PostgreSQL is running**:
   ```bash
   lsof -i :5432
   # Or
   docker ps | grep postgres
   ```

2. **Start PostgreSQL**:
   ```bash
   cd backend
   docker compose up -d postgres
   ```

3. **Verify database exists**:
   ```bash
   docker exec -it salesforce_admin_db psql -U admin -l
   ```

### **Wrong Password**

**Error**: "FATAL: password authentication failed"

**Default credentials**:
- Username: `admin`
- Password: `admin123`

Check your `.env` file or `docker-compose.yml` for actual credentials.

### **Database Doesn't Exist**

**Error**: "database 'salesforce_chat' does not exist"

**Solution**: Run initialization:
```bash
cd backend
node -e "const db = require('./db'); db.setupDatabase().then(() => process.exit(0));"
```

### **Tables Are Empty**

Make sure:
1. `USE_DATABASE=true` in `backend/.env`
2. Backend server is running and connected
3. You've sent some chat messages in the app

### **pgVector Extension Not Found**

**Error**: "type 'vector' does not exist"

**Solution**:
```sql
-- Run in Query Tool
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## 📸 Visual Guide

### **Connection Screen**

When registering server, your screen should look like:

```
┌─────────────────────────────────────┐
│ General  Connection  SSL  Advanced  │
├─────────────────────────────────────┤
│ Host:     localhost                 │
│ Port:     5432                      │
│ Database: salesforce_chat           │
│ Username: admin                     │
│ Password: ••••••••••                │
│ ☑ Save password                     │
└─────────────────────────────────────┘
```

### **Browser Tree Structure**

```
📁 Servers
  └── 🖥️ Salesforce Admin Database
      └── 📚 Databases (1)
          └── 🗄️ salesforce_chat
              ├── 📊 Schemas (1)
              │   └── 📁 public
              │       ├── 📋 Tables (2)
              │       │   ├── chat_history
              │       │   └── conversations
              │       ├── 🔍 Indexes
              │       └── ⚡ Extensions
              │           └── vector
              └── 🔐 Login/Group Roles
```

---

## 🎓 Tips & Best Practices

### **Performance**

1. **Use LIMIT** when querying large tables:
   ```sql
   SELECT * FROM chat_history LIMIT 100;
   ```

2. **Index usage** - Check execution plans:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM chat_history WHERE conversation_id = '123';
   ```

3. **Vacuum regularly** (maintenance):
   ```sql
   VACUUM ANALYZE chat_history;
   ```

### **Security**

1. **Change default password** in production
2. **Use SSL** for remote connections
3. **Restrict access** with firewall rules
4. **Backup regularly**:
   ```bash
   pg_dump -U admin salesforce_chat > backup.sql
   ```

### **Data Management**

1. **Archive old data**:
   ```sql
   DELETE FROM chat_history 
   WHERE created_at < NOW() - INTERVAL '90 days';
   ```

2. **Monitor size**:
   ```sql
   SELECT 
       pg_size_pretty(pg_database_size('salesforce_chat')) as size;
   ```

---

## 📱 Quick Reference Card

| Task | Action |
|------|--------|
| **Connect** | Servers → Register → Server |
| **View Data** | Right-click table → View/Edit Data → All Rows |
| **Run Query** | Tools → Query Tool (F5) |
| **Export** | Right-click table → Import/Export |
| **Refresh** | Right-click → Refresh (or F5) |
| **New Query** | Tools → Query Tool → New Query |
| **Execute** | Click ▶ Play button or F5 |

---

## 🔗 Related Documentation

- **Database Schema**: See `backend/init-db.sql`
- **Full Setup**: See `DATABASE_SETUP.md`
- **API Endpoints**: See `README.md`

---

## ✅ Verification Checklist

After setup, verify:

- [ ] pgAdmin connects successfully
- [ ] Can see `conversations` table
- [ ] Can see `chat_history` table
- [ ] Tables have data (after using the app)
- [ ] `vector` extension is installed
- [ ] Indexes are created
- [ ] Can run queries successfully

---

## 🎯 Next Steps

1. **Browse your data** in pgAdmin
2. **Run sample queries** to explore chat history
3. **Export data** for analysis
4. **Set up automated backups**
5. **Create custom queries** for your needs

**Enjoy exploring your Salesforce chat data!** 🚀

---

## 💡 Need Help?

- **pgAdmin Docs**: https://www.pgadmin.org/docs/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **pgvector**: https://github.com/pgvector/pgvector
- **Your App Docs**: See `DATABASE_SETUP.md`


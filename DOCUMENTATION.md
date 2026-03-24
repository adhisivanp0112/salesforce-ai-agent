# 📚 Salesforce AI Agent - Complete Documentation

**Last Updated:** March 24, 2026  
**Version:** 2.0

---

## 📖 Table of Contents

1. [Quick Start](#quick-start)
2. [AI Provider Configuration](#ai-provider-configuration)
3. [Salesforce Authentication](#salesforce-authentication)
4. [Database Setup](#database-setup)
5. [Available AI Providers](#available-ai-providers)
6. [Features & Capabilities](#features--capabilities)
7. [Troubleshooting](#troubleshooting)
8. [Testing & Validation](#testing--validation)

---

## 🚀 Quick Start

### Prerequisites
- ✅ Node.js 18+
- ✅ npm
- ✅ Salesforce CLI (`sf --version`)
- ✅ Authenticated Salesforce Org
- ✅ At least one AI provider API key

### Installation (3 Steps)

#### Step 1: Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

#### Step 2: Configure Environment
```bash
cd backend
cp env.example .env
nano .env  # Edit with your settings
```

**Minimum configuration:**
```env
# Salesforce
SF_ORG_ALIAS=your-org-alias

# AI Provider (choose one)
GROQ_API_KEY=gsk_your_groq_key_here

# Backend
PORT=3001
FRONTEND_URL=http://localhost:3000
```

#### Step 3: Start Application
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm start
```

Open: **http://localhost:3000**

---

## 🤖 AI Provider Configuration

### Two Configuration Methods

#### **Method 1: JSON Array Format (Centralized)**
All API keys in one place:

```env
API_PROVIDERS=[{"provider":"groq","key":"gsk_abc123"},{"provider":"openai","key":"sk-xyz789"}]
```

**Advantages:**
- ✅ All credentials in one place
- ✅ Easy to backup
- ✅ Simple copy/paste

**Important:** Must be on ONE LINE (no line breaks!)

#### **Method 2: Individual Variables (Traditional)**
Separate environment variables:

```env
GROQ_API_KEY=gsk_your_groq_key_here
OPENAI_API_KEY=sk-your_openai_key_here
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key_here
XAI_API_KEY=xai-your_xai_key_here
COHERE_API_KEY=your_cohere_key_here
```

**Advantages:**
- ✅ Easier to read
- ✅ Standard .env practice
- ✅ Easy to comment out individual providers

### Priority Order
If both methods are configured:
1. **API_PROVIDERS array** (higher priority)
2. **Individual variables** (fallback)

### Provider Selection in UI
Users can select their preferred AI provider from a dropdown in the chat interface. The selection is saved in browser localStorage.

---

## 🔐 Salesforce Authentication

### Method 1: SF CLI Authentication (Development)

**Advantages:**
- Easy setup for development
- Auto-refreshes tokens
- No security token needed
- Works with scratch orgs

**Setup:**
```bash
# Authenticate
sf org login web --alias myorg

# Configure .env
SF_USE_PASSWORD_AUTH=false
SF_ORG_ALIAS=myorg
```

### Method 2: Username/Password Authentication (Production)

**Advantages:**
- No SF CLI needed
- Works on any server
- Better for production deployment

**Setup:**

1. **Get Security Token:**
   - Login to Salesforce
   - Setup → Reset My Security Token
   - Check email for token

2. **Configure .env:**
```env
SF_USE_PASSWORD_AUTH=true
SF_USERNAME=your-username@example.com
SF_PASSWORD=YourPassword123
SF_SECURITY_TOKEN=AbC123XyZ789Token
SF_LOGIN_URL=https://login.salesforce.com  # or https://test.salesforce.com for sandbox
```

3. **Restart Backend**

### Switching Between Methods
Just change `SF_USE_PASSWORD_AUTH` in `.env` and restart backend.

---

## 🗄️ Database Setup

### Optional PostgreSQL with pgvector

Store chat history with semantic search capabilities.

#### Quick Setup

**Step 1: Start Database**
```bash
cd backend
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- pgAdmin on port 5050

**Step 2: Configure Environment**
```env
USE_DATABASE=true
DB_HOST=localhost
DB_PORT=5432
DB_NAME=salesforce_chat
DB_USER=admin
DB_PASSWORD=admin123
```

**Step 3: Install Dependencies & Restart**
```bash
cd backend
npm install
npm start
```

### Database Features
- ✅ Persistent chat history
- ✅ Vector embeddings (768 dimensions)
- ✅ Semantic search
- ✅ Conversation tracking
- ✅ pgAdmin web interface

### Access pgAdmin
- **URL:** http://localhost:5050
- **Email:** admin@salesforce.com
- **Password:** admin123

### Database Schema

**Tables:**
1. **conversations** - Conversation metadata
   - id, title, created_at, updated_at, message_count

2. **chat_history** - All messages with AI embeddings
   - id, conversation_id, user_prompt, ai_response
   - action_type, result_data (JSON)
   - embedding (vector 768)
   - created_at, updated_at

### Useful SQL Queries

**View all conversations:**
```sql
SELECT * FROM conversations ORDER BY updated_at DESC;
```

**View chat history:**
```sql
SELECT * FROM chat_history 
WHERE conversation_id = 'your-conversation-id'
ORDER BY created_at ASC;
```

**Count actions by type:**
```sql
SELECT action_type, COUNT(*) 
FROM chat_history 
GROUP BY action_type;
```

---

## 🌐 Available AI Providers

### Supported Providers

| Provider | ID | Free | Speed | Get API Key |
|----------|----|----|-------|-------------|
| **Groq** | `groq` | ✅ Yes | ⚡⚡⚡⚡⚡ | https://console.groq.com/keys |
| **OpenAI** | `openai` | ❌ Paid | ⚡⚡⚡⚡ | https://platform.openai.com/api-keys |
| **Claude** | `anthropic` | ❌ Paid | ⚡⚡⚡⚡ | https://console.anthropic.com/ |
| **Gemini** | `gemini` | ✅ Limited | ⚡⚡⚡ | https://aistudio.google.com/app/apikey |
| **Grok** | `xai` | ❌ Paid | ⚡⚡⚡⚡ | https://x.ai/ |
| **Cohere** | `cohere` | ❌ Paid | ⚡⚡⚡ | https://dashboard.cohere.com/api-keys |
| **Mistral** | `mistral` | ❌ Paid | ⚡⚡⚡ | https://console.mistral.ai/ |
| **Perplexity** | `perplexity` | ❌ Paid | ⚡⚡⚡⚡ | https://www.perplexity.ai/settings/api |
| **Hugging Face** | `inference` | ✅ Yes | ⚡⚡⚡ | https://huggingface.co/settings/tokens |

### Recommended Models

**Groq (Default):**
- `llama-3.1-70b-versatile` (best quality)
- `llama-3.3-70b-versatile` (newest)
- `mixtral-8x7b-32768` (alternative)

**OpenAI:**
- `gpt-4o` (best quality)
- `gpt-4o-mini` (cost-effective)
- `gpt-3.5-turbo` (fastest)

**Anthropic:**
- `claude-3-5-sonnet-20241022` (best)
- `claude-3-5-haiku-20241022` (fastest)

**Hugging Face (Salesforce Operations):**
- `Salesforce/xLAM-2-1b-fc-r` (recommended)
- `Salesforce/xLAM-1b-fc-r` (faster)

### Cost Comparison

| Provider | Free Tier | Cost (Paid) | Best For |
|----------|-----------|-------------|----------|
| **Groq** | Generous | Free | Development & Testing |
| **Gemini** | 15 RPM, 1500/day | Free | Testing |
| **OpenAI** | $5 credit | $0.15-$15/1M tokens | Production |
| **Anthropic** | None | $3-$15/1M tokens | Complex tasks |
| **Hugging Face** | Generous | Free | Salesforce operations |

### Recommendation

**For Development:**
- 🥇 Groq (free, fastest)
- 🥈 Hugging Face (free, good for Salesforce)

**For Production:**
- 🥇 Groq (still free, very fast)
- 🥈 OpenAI (best quality, reliable)
- 🥉 Anthropic (excellent for complex tasks)

---

## ✨ Features & Capabilities

### Salesforce Operations

**Create Operations:**
- Create Cases, Leads, Contacts, Accounts
- Link records (e.g., Contact to Case)
- Multi-step operations

**Query Operations:**
- Execute SOQL queries
- List all objects
- Describe objects
- Get custom fields

**Update Operations:**
- Update any record
- Bulk updates
- Status changes

**Delete Operations:**
- Delete records
- Cleanup operations

### AI Features

**Dynamic Provider Selection:**
- Switch between providers in UI
- Provider dropdown in chat interface
- Persistent selection across sessions

**Intelligent Format Correction:**
- Handles different AI response formats
- Auto-converts legacy formats
- No manual intervention needed

**Multi-Step Operations:**
- CREATE_AND_LINK (create and link records)
- Automatic relationship handling
- Transaction-like behavior

**Semantic Search (with Database):**
- Find similar past queries
- Vector-based similarity
- 768-dimensional embeddings

### User Interface

**Chat Interface:**
- Modern, responsive design
- Provider selection dropdown
- Real-time responses
- Conversation history

**Settings Modal:**
- Configure AI providers
- Enter API keys
- Select models
- View current configuration

**Conversation Management:**
- New conversations
- Load history
- Search conversations
- Delete conversations

---

## 🐛 Troubleshooting

### Common Issues

#### "API key not found"
**Solution:**
1. Check `.env` file exists in backend folder
2. Verify API key is set correctly (no quotes)
3. Restart backend after changing `.env`

#### "Rate limit exceeded"
**Solution:**
1. Wait 1-2 minutes
2. Switch to different provider
3. Upgrade to paid tier
4. Check quota at provider's dashboard

#### "Session expired or invalid" (Salesforce)
**Solution:**
- **CLI auth:** Run `sf org login web --alias myorg` again
- **Password auth:** Restart backend to get new session

#### "Database connection failed"
**Solution:**
1. Check if PostgreSQL is running: `docker ps`
2. Verify connection settings in `.env`
3. Restart database: `docker-compose restart`

#### "Model is loading" (Hugging Face)
**Solution:**
- Wait 30-60 seconds for model to warm up
- Try again
- First request always takes longer

#### Backend won't start
**Solution:**
```bash
# Check Salesforce CLI
sf --version

# Check org authentication
sf org list

# Verify API key
cat backend/.env | grep API_KEY

# Reinstall dependencies
cd backend
rm -rf node_modules
npm install
```

#### Frontend won't start
**Solution:**
```bash
# Check for port conflicts
lsof -ti:3000

# Reinstall dependencies
cd frontend
rm -rf node_modules
npm install
```

### Rate Limits by Provider

**Gemini Free Tier:**
- 15 requests per minute
- 1,500 requests per day
- Resets at midnight Pacific Time

**Groq Free Tier:**
- Much more generous
- No daily limits
- Recommended for development

**Hugging Face Free Tier:**
- Rate limits vary by model
- Wait a few seconds between requests
- Consider Pro account for higher limits

### Security Best Practices

1. **Never commit .env to git** (already in .gitignore)
2. **Use strong passwords** for production
3. **Rotate security tokens** regularly
4. **Use dedicated integration user** for production
5. **Restrict IP ranges** if possible
6. **Monitor login history** in Salesforce Setup
7. **Change default database passwords** in production

---

## 🧪 Testing & Validation

### Test Commands

**Backend Health Check:**
```bash
curl http://localhost:3001/api/health
```

**Test AI Prompt:**
```bash
curl -X POST http://localhost:3001/api/salesforce/ai-prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a case with subject Test", "provider": "groq"}'
```

**Database Connection:**
```bash
cd backend
node -e "const db = require('./db'); db.testConnection().then(() => process.exit(0));"
```

### Sample Test Prompts

**Create Operations:**
- "Create a case with subject 'Test Case' and high priority"
- "Create a lead with name John Doe and email john@test.com"
- "Create a contact and link with case 500xxx"

**Query Operations:**
- "Show me all cases"
- "List all custom objects"
- "Describe the Case object"
- "Fetch all custom fields in the Case object"

**Update Operations:**
- "Update case 500xxx status to Closed"
- "Update lead 00Qxxx email to newemail@test.com"

**Delete Operations:**
- "Delete contact 003xxx"
- "Delete case 500xxx"

### Validation Results

**Test Summary (Feb 4, 2026):**
- Total Tests: 8
- Passed: ✅ 8 (100%)
- Failed: ❌ 0 (0%)
- Success Rate: **100%**

**Validated Operations:**
- ✅ Create Case
- ✅ Create Contact
- ✅ Create and Link Records
- ✅ Query Records
- ✅ Update Records
- ✅ Delete Records
- ✅ Describe Objects
- ✅ Multi-step Operations

---

## 📊 Architecture

### System Flow

```
User Input (Frontend)
    ↓
Provider Selection
    ↓
Backend API
    ↓
Universal AI Handler
    ↓
Selected AI Provider
    ↓
Salesforce Operations (jsforce)
    ↓
Database Storage (optional)
    ↓
Response to User
```

### Components

**Frontend (React):**
- AIAssistant component
- Provider dropdown
- Chat interface
- Settings modal

**Backend (Node.js/Express):**
- Universal AI Handler
- Provider-specific handlers
- Salesforce connection (jsforce)
- Database integration (optional)

**Database (PostgreSQL + pgvector):**
- Chat history storage
- Vector embeddings
- Semantic search

**Salesforce:**
- CRUD operations
- SOQL queries
- Object metadata

---

## 🎯 Next Steps

### For Development:
1. Get a Groq API key (free, fast)
2. Configure `.env` with Salesforce credentials
3. Start backend and frontend
4. Test with simple prompts
5. Explore different AI providers

### For Production:
1. Choose production AI provider (Groq or OpenAI recommended)
2. Set up username/password Salesforce auth
3. Configure database for chat history
4. Change default database passwords
5. Set up monitoring and logging
6. Deploy to production server

### Optional Enhancements:
1. Enable database for chat history
2. Set up pgAdmin for data visualization
3. Configure multiple AI providers
4. Implement custom models
5. Add user authentication
6. Set up automated backups

---

## 📚 Additional Resources

**Salesforce:**
- [Salesforce Developer Docs](https://developer.salesforce.com)
- [SOQL Reference](https://developer.salesforce.com/docs/atlas.en-us.soql_sosl.meta/soql_sosl/)
- [jsforce Documentation](https://jsforce.github.io/)

**AI Providers:**
- [Groq Documentation](https://console.groq.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Anthropic Documentation](https://docs.anthropic.com/)
- [Hugging Face Inference API](https://huggingface.co/docs/api-inference)

**Database:**
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [pgAdmin Documentation](https://www.pgadmin.org/docs/)

**Development:**
- [React Documentation](https://react.dev)
- [Node.js Documentation](https://nodejs.org)
- [Express.js Guide](https://expressjs.com/)

---

## 🎉 Summary

This Salesforce AI Agent provides:

- ✅ **Universal AI Integration** - Works with 8+ AI providers
- ✅ **Dynamic Provider Selection** - Switch providers in UI
- ✅ **Flexible Authentication** - CLI or username/password
- ✅ **Optional Database** - PostgreSQL with semantic search
- ✅ **Complete CRUD Operations** - Create, read, update, delete
- ✅ **Intelligent Processing** - Multi-step operations
- ✅ **Production Ready** - 100% test success rate
- ✅ **Free Options Available** - Groq and Hugging Face

**Ready to use for both development and production!** 🚀

---

**For questions or issues, check the troubleshooting section or review the specific setup guides for each feature.**

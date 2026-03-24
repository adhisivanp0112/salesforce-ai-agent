# Salesforce Admin App

A full-stack application to interact with Salesforce using natural language powered by Google Gemini AI.

## Architecture

```
React Frontend (Port 3000) → Node.js Backend (Port 3001) → Salesforce API (via jsforce)
                                    ↓
                            Google Gemini AI (Natural Language Processing)
```

## Features

- ✅ Natural language interface for Salesforce operations
- ✅ AI-powered chat assistant (Adhi) using Google Gemini
- ✅ Create, query, update, and delete Salesforce records
- ✅ Multi-conversation support with search
- ✅ Dark/Light mode toggle
- ✅ Authentication via Salesforce CLI or username/password
- ✅ **Optional**: PostgreSQL database with pgvector for chat history storage
- ✅ **Optional**: Semantic search using AI embeddings
- ✅ **Optional**: pgAdmin for database management

## Prerequisites

- Node.js 18+ installed
- Salesforce CLI installed (`npm install -g @salesforce/cli`)
- Authenticated Salesforce org (`sf org login web --alias myorg`)

## Setup Instructions

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Configure Backend

Create `backend/.env` file (copy from `backend/env.example`) and configure:

```bash
SF_ORG_ALIAS=myorg
PORT=3001
GOOGLE_API_KEY=your_google_gemini_api_key
FRONTEND_URL=http://localhost:3000

# Optional: For direct username/password auth instead of CLI
SF_USE_PASSWORD_AUTH=false
SF_USERNAME=your@email.com
SF_PASSWORD=yourpassword
SF_SECURITY_TOKEN=yoursecuritytoken

# Optional: Enable database for chat history storage
USE_DATABASE=false  # Set to 'true' to enable
DB_HOST=localhost
DB_PORT=5432
DB_NAME=salesforce_chat
DB_USER=admin
DB_PASSWORD=admin123
```

Get your Google Gemini API key from: https://aistudio.google.com/app/apikey

### 2a. (Optional) Setup Database with pgvector

If you want to store chat history with semantic search:

```bash
cd backend
docker-compose up -d  # Starts PostgreSQL and pgAdmin
```

Then set `USE_DATABASE=true` in `.env`

**See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed database setup instructions.**

Access pgAdmin at http://localhost:5050 (admin@salesforce.com / admin123)

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4. Run the Application

**Terminal 1 - Start Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm start
```

The app will open at `http://localhost:3000`

## Project Structure

```
salesforce-admin-app/
├── backend/                      # Node.js Express server
│   ├── server-improved.js       # Main server file with jsforce
│   ├── geminiAIHandler.js       # AI handler for natural language
│   ├── db.js                    # Database connection and helpers
│   ├── init-db.sql              # Database initialization script
│   ├── docker-compose.yml       # PostgreSQL + pgAdmin setup
│   ├── package.json
│   └── .env                     # Configuration
├── frontend/                     # React application
│   ├── public/
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── AIAssistant.js  # Main chat interface
│   │   │   ├── LoginPage.js    # Authentication
│   │   │   └── AdhiLogo.js     # Logo component
│   │   ├── services/           # API service layer
│   │   ├── styles/             # CSS files
│   │   ├── App.js              # Main app component
│   │   └── index.js            # Entry point
│   └── package.json
├── setup.sh                     # Setup script
├── start-backend.sh            # Backend startup script
├── start-frontend.sh           # Frontend startup script
├── DATABASE_SETUP.md           # Detailed database guide
└── README.md
```

## API Endpoints

### Backend API (http://localhost:3001)

- `GET /health` - Health check
- `POST /api/salesforce/login` - Login with username/password
- `POST /api/salesforce/quick-login` - Quick login using SF CLI
- `POST /api/salesforce/ai-prompt` - Natural language AI interface
- `POST /api/salesforce/case` - Create a case
- `POST /api/salesforce/query` - Execute SOQL query
- `PATCH /api/salesforce/record/:objectType/:recordId` - Update a record
- `DELETE /api/salesforce/record/:objectType/:recordId` - Delete a record
- `GET /api/salesforce/org-info` - Get organization information
- `GET /api/salesforce/orgs` - List authenticated orgs (via CLI)
- `GET /api/database/stats` - Get database statistics (if enabled)
- `GET /api/database/conversations` - Get all conversations (if enabled)
- `GET /api/database/conversation/:id` - Get conversation history (if enabled)

## Usage Examples

### Using Natural Language (AI Assistant)

Simply type natural language commands in the chat interface:

- "Create a case with subject Login Issue and high priority"
- "Show me all open cases"
- "Delete the last created case"
- "Update case 500xxx with status closed"
- "Find all accounts created this month"

### Direct API Usage

#### Create a Case

```javascript
const caseData = {
  Subject: 'Website Issue',
  Description: 'User cannot login',
  Priority: 'High',
  Origin: 'Web'
};

await fetch('http://localhost:3001/api/salesforce/case', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(caseData)
});
```

#### Query Records

```javascript
const query = 'SELECT Id, Subject, Status FROM Case LIMIT 10';

await fetch('http://localhost:3001/api/salesforce/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query })
});
```

## Troubleshooting

### Google Gemini API Rate Limits (429 Error)
If you see `[429 Too Many Requests] Resource exhausted`:
- **Quick fix**: Wait 1-2 minutes before trying again
- **Full guide**: See [RATE_LIMIT_GUIDE.md](./RATE_LIMIT_GUIDE.md) for comprehensive solutions
- **API Key**: Get yours at https://aistudio.google.com/app/apikey
- **Upgrade**: Consider paid tier for higher limits (1000 RPM vs 15 RPM free)

### Authentication Issues
- **SF CLI**: Ensure Salesforce CLI is installed: `sf --version`
- Check if you're authenticated: `sf org list`
- Login if needed: `sf org login web --alias myorg`
- **Username/Password**: Make sure security token is correct and no extra spaces in .env
- **Invalid Login**: Check username, password, and security token combination

### CORS Issues
- Backend has CORS enabled for `http://localhost:3000`
- Update `server-improved.js` if using different origin

### Port Already in Use
- Change ports in `.env` (backend) and update frontend API URL
- Kill existing processes: `lsof -ti:3001 | xargs kill` (backend) or `lsof -ti:3000 | xargs kill` (frontend)

### Database Connection Issues
- Ensure Docker is running: `docker ps`
- Check if PostgreSQL is running: `docker-compose ps`
- Verify `USE_DATABASE=true` in `.env`
- See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for troubleshooting

## Next Steps

1. **Enable database storage** - Follow [DATABASE_SETUP.md](./DATABASE_SETUP.md) to set up PostgreSQL + pgvector
2. Customize the AI prompts in `backend/geminiAIHandler.js`
3. Add more Salesforce object support (Accounts, Contacts, Opportunities, etc.)
4. Implement semantic search for similar queries
5. Deploy to your company domain
6. Add role-based access control
7. Set up automated backups for chat history

## Resources

- [Google Gemini API](https://ai.google.dev/)
- [jsforce Documentation](https://jsforce.github.io/)
- [Salesforce REST API](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/)
- [Salesforce CLI Documentation](https://developer.salesforce.com/tools/salesforcecli)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Optional Features

### 📊 Database & Semantic Search

Want to store chat history and enable semantic search? See **[DATABASE_SETUP.md](./DATABASE_SETUP.md)**

Features when enabled:
- Persistent chat history across sessions
- Semantic search to find similar past queries
- pgAdmin web interface for data management
- Vector embeddings for AI-powered search
- Export conversation data for analysis


# 🚀 Quick Start Guide

## Prerequisites Check

Before starting, ensure you have:

- ✅ **Node.js 18+** installed (`node --version`)
- ✅ **npm** installed (`npm --version`)
- ✅ **Salesforce CLI** installed (`sf --version`)
- ✅ **Authenticated Salesforce Org** (`sf org list`)
- ✅ **Google Gemini API Key** (get free at https://aistudio.google.com/app/apikey)

## Installation

### Option 1: Automated Setup (Recommended)

Run the setup script:

```bash
cd /Users/home/Desktop/salesforce-admin-app
./setup.sh
```

This will:
- Install all backend dependencies
- Install all frontend dependencies
- Verify Salesforce CLI installation

### Option 2: Manual Setup

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## Salesforce Authentication

If you haven't authenticated with your Salesforce org yet:

```bash
# Login to your Salesforce org
sf org login web --alias myorg

# Verify authentication
sf org list

# Set as default (optional)
sf config set target-org myorg
```

**Important:** Configure `backend/.env` with your settings:

```bash
# Copy the example file
cd backend
cp env.example .env

# Edit .env and set:
SF_ORG_ALIAS=your-org-alias-here
GOOGLE_API_KEY=your_google_api_key_here
```

### Get Your Google API Key

1. Visit: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it in `backend/.env`

**Free tier limits:**
- 15 requests per minute
- 1,500 requests per day
- Sufficient for development and testing

### Test Your API Key

Before running the app, verify your API key works:

```bash
cd backend
npm run check-api
```

If you see rate limit errors (429), see [RATE_LIMIT_GUIDE.md](./RATE_LIMIT_GUIDE.md)

## Running the Application

You need TWO terminal windows:

### Terminal 1 - Backend Server

```bash
cd /Users/home/Desktop/salesforce-admin-app
./start-backend.sh
```

Or manually:

```bash
cd backend
npm start
```

Wait until you see:
```
🚀 Salesforce Admin Backend Server Running
📍 Server URL: http://localhost:3001
```

### Terminal 2 - Frontend Server

```bash
cd /Users/home/Desktop/salesforce-admin-app
./start-frontend.sh
```

Or manually:

```bash
cd frontend
npm start
```

The app will automatically open at **http://localhost:3000**

## Testing the Application

### 1. Check Org Info Tab
- Click on "🏢 Org Info" tab
- Verify your org connection is shown
- Should show "✅ Online" status

### 2. Create a Test Case
- Click on "🎫 Create Case" tab
- Fill in:
  - Subject: "Test Case from React App"
  - Description: "Testing MCP integration"
  - Priority: "Medium"
- Click "📝 Create Case"
- You should see: "✅ Case created successfully!"

### 3. Query Records
- Click on "🔍 Query Data" tab
- Use the default query or modify it
- Click "▶️ Execute Query"
- View results in the table

## Architecture

```
┌─────────────────────────────────────────┐
│   React Frontend (localhost:3000)       │
│   - Beautiful UI                         │
│   - Case Creator                         │
│   - Query Executor                       │
└──────────────┬──────────────────────────┘
               │ HTTP/REST API
               ▼
┌─────────────────────────────────────────┐
│   Node.js Backend (localhost:3001)      │
│   - Express Server                       │
│   - MCP Client                          │
└──────────────┬──────────────────────────┘
               │ MCP Protocol
               ▼
┌─────────────────────────────────────────┐
│   @salesforce/mcp Server                │
│   - Official Salesforce MCP Server      │
│   - Same as Cursor AI uses              │
└──────────────┬──────────────────────────┘
               │ Salesforce APIs
               ▼
┌─────────────────────────────────────────┐
│   Your Salesforce Org                   │
└─────────────────────────────────────────┘
```

## Available Features

### ✅ Implemented
- Create Salesforce Cases
- Execute SOQL queries
- View query results in table
- List authenticated orgs
- Health check monitoring
- Sample queries
- Responsive design

### 🔜 Coming Soon (You can add)
- Update records
- Delete records
- Deploy metadata
- Bulk operations
- Record details view
- Custom object support
- File uploads
- Report generation

## Troubleshooting

### Google API Rate Limit Error (429)

If you see `[429 Too Many Requests] Resource exhausted`:

**Quick Fix:**
```bash
# Wait 1-2 minutes, then try again
# The free tier has 15 requests per minute limit
```

**Check Your Quota:**
```bash
cd backend
npm run check-api
```

**Full Solutions:** See [RATE_LIMIT_GUIDE.md](./RATE_LIMIT_GUIDE.md) for:
- Getting a new API key
- Understanding quotas
- Upgrading to paid tier
- Fallback to pattern-matching AI

### Backend won't start

```bash
# Check if Salesforce CLI is installed
sf --version

# Check if org is authenticated
sf org list

# Verify API key is configured
cd backend
cat .env | grep GOOGLE_API_KEY

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Frontend won't start

```bash
# Check for port conflicts
lsof -ti:3000

# Reinstall dependencies
cd frontend
rm -rf node_modules
npm install
```

### "MCP Server Error"

1. Verify Salesforce org authentication:
   ```bash
   sf org list
   sf org login web --alias myorg
   ```

2. Check backend/.env has correct org alias:
   ```bash
   SF_ORG_ALIAS=myorg
   ```

3. Restart backend server

### CORS Errors

- Ensure backend is running on port 3001
- Ensure frontend is running on port 3000
- Check backend/.env has `FRONTEND_URL=http://localhost:3000`

### "Cannot create Case"

1. Check if your Salesforce org allows Case creation
2. Verify required fields in your org's Case object
3. Check backend terminal for detailed error messages

## Project Structure

```
salesforce-admin-app/
├── README.md              # Full documentation
├── QUICK_START.md         # This file
├── setup.sh              # Automated setup script
├── start-backend.sh      # Start backend
├── start-frontend.sh     # Start frontend
│
├── backend/              # Node.js Express server
│   ├── server.js         # Main server with MCP client
│   ├── package.json      # Dependencies
│   └── .env             # Configuration
│
└── frontend/            # React application
    ├── public/          # Static files
    ├── src/
    │   ├── components/  # React components
    │   │   ├── CaseCreator.js
    │   │   ├── QueryExecutor.js
    │   │   └── OrgInfo.js
    │   ├── services/    # API service layer
    │   │   └── salesforceService.js
    │   ├── styles/      # CSS files
    │   ├── App.js       # Main app
    │   └── index.js     # Entry point
    └── package.json
```

## Next Steps

1. **Customize UI**: Edit components in `frontend/src/components/`
2. **Add Features**: Add new endpoints in `backend/server.js`
3. **Deploy**: Deploy to your company domain
4. **Authentication**: Add user authentication
5. **Monitoring**: Add logging and analytics

## Useful Commands

```bash
# Backend
cd backend
npm start                 # Start server
npm run dev              # Start with auto-reload (if nodemon installed)
npm run check-api        # Check Google API key and quota

# Frontend
cd frontend
npm start                 # Start dev server
npm run build            # Build for production

# Salesforce CLI
sf org list              # List authenticated orgs
sf org login web         # Login to Salesforce
sf org open              # Open org in browser
sf project deploy start  # Deploy metadata

# Google API
# Check quota: https://aistudio.google.com/app/apikey
# Get new key: https://aistudio.google.com/app/apikey
```

## Support

- **Salesforce MCP Server**: https://github.com/salesforcecli/mcp
- **Salesforce Developer Docs**: https://developer.salesforce.com
- **React Documentation**: https://react.dev
- **Node.js Documentation**: https://nodejs.org

## Happy Coding! 🎉

You now have a fully functional Salesforce admin app with MCP integration, just like Cursor AI uses!

Feel free to modify, extend, and deploy to your company domain.


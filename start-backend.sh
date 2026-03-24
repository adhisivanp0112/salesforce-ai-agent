#!/bin/bash

# Start Backend Server
echo "🚀 Starting Salesforce Admin Backend..."
cd "$(dirname "$0")/backend"
node server-improved.js


# cd /Users/home/Desktop/salesforce-admin-app && bash start-backend.sh
# lsof -i :3001 
# kill 55622
# lsof -i :3000
# kill 44374
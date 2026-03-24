#!/bin/bash

# Salesforce Admin App Setup Script
echo "========================================="
echo "  Salesforce Admin App Setup"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"

# Check if Salesforce CLI is installed
if ! command -v sf &> /dev/null; then
    echo -e "${YELLOW}⚠️  Salesforce CLI not found${NC}"
    echo "Installing Salesforce CLI..."
    npm install -g @salesforce/cli
else
    echo -e "${GREEN}✅ Salesforce CLI found: $(sf --version | head -1)${NC}"
fi

echo ""
echo "========================================="
echo "  Installing Backend Dependencies"
echo "========================================="
cd backend
npm install
echo -e "${GREEN}✅ Backend dependencies installed${NC}"

echo ""
echo "========================================="
echo "  Installing Frontend Dependencies"
echo "========================================="
cd ../frontend
npm install
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"

cd ..

echo ""
echo "========================================="
echo "  Setup Complete! 🎉"
echo "========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Authenticate with your Salesforce org:"
echo -e "   ${YELLOW}sf org login web --alias myorg${NC}"
echo ""
echo "2. Update backend/.env with your org alias if different from 'myorg'"
echo ""
echo "3. Start the backend server (Terminal 1):"
echo -e "   ${YELLOW}cd backend && npm start${NC}"
echo ""
echo "4. Start the frontend (Terminal 2):"
echo -e "   ${YELLOW}cd frontend && npm start${NC}"
echo ""
echo "5. Open http://localhost:3000 in your browser"
echo ""
echo "========================================="


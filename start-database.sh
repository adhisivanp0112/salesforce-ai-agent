#!/bin/bash

# Start PostgreSQL and pgAdmin with Docker Compose
echo "🚀 Starting PostgreSQL database with pgvector and pgAdmin..."
cd "$(dirname "$0")/backend"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Start services
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for database to initialize..."
sleep 5

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅ Database services started successfully!"
    echo ""
    echo "📊 PostgreSQL:"
    echo "   Host: localhost"
    echo "   Port: 5432"
    echo "   Database: salesforce_chat"
    echo "   Username: admin"
    echo "   Password: admin123"
    echo ""
    echo "🔧 pgAdmin:"
    echo "   URL: http://localhost:5050"
    echo "   Email: admin@salesforce.com"
    echo "   Password: admin123"
    echo ""
    echo "💡 Next steps:"
    echo "   1. Set USE_DATABASE=true in backend/.env"
    echo "   2. Restart your backend server"
    echo "   3. Access pgAdmin at http://localhost:5050"
    echo ""
    echo "📖 For more details, see DATABASE_SETUP.md"
else
    echo "❌ Failed to start database services"
    echo "   Check logs with: docker-compose logs"
    exit 1
fi


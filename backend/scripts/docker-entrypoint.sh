#!/bin/bash

# =============================================================================
# Docker Entrypoint Script for TrueCheckIA Backend
# =============================================================================

set -e

echo "🚀 Starting TrueCheckIA Backend..."

# Function to wait for database
wait_for_db() {
    echo "📦 Waiting for database connection..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if npx prisma db push --accept-data-loss 2>/dev/null; then
            echo "✅ Database is ready!"
            break
        else
            echo "⏳ Database not ready yet (attempt $attempt/$max_attempts)..."
            sleep 2
            attempt=$((attempt + 1))
        fi
    done
    
    if [ $attempt -gt $max_attempts ]; then
        echo "❌ Failed to connect to database after $max_attempts attempts"
        exit 1
    fi
}

# Function to run database migrations
run_migrations() {
    echo "🔄 Running database migrations..."
    if npx prisma migrate deploy; then
        echo "✅ Migrations completed successfully!"
    else
        echo "⚠️ Migrations failed, attempting to push schema..."
        npx prisma db push
    fi
}

# Function to seed database if needed
seed_database() {
    if [ "$SEED_DATABASE" = "true" ]; then
        echo "🌱 Seeding database..."
        npm run prisma:seed || echo "⚠️ Seeding failed, continuing..."
    fi
}

# Function to validate environment
validate_environment() {
    echo "🔍 Validating environment..."
    
    # Check required environment variables
    local required_vars=("DATABASE_URL" "JWT_SECRET")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        echo "❌ Missing required environment variables: ${missing_vars[*]}"
        exit 1
    fi
    
    echo "✅ Environment validation passed!"
}

# Function to setup logging
setup_logging() {
    echo "📝 Setting up logging..."
    mkdir -p logs
    touch logs/app.log
    echo "✅ Logging setup complete!"
}

# Main startup sequence
main() {
    echo "🏁 Starting TrueCheckIA Backend initialization..."
    
    # Validate environment
    validate_environment
    
    # Setup logging
    setup_logging
    
    # Wait for database
    wait_for_db
    
    # Run migrations
    run_migrations
    
    # Seed database if requested
    seed_database
    
    echo "🎉 Initialization complete! Starting application..."
    
    # Start the Node.js application
    exec node dist/server.js
}

# Trap signals for graceful shutdown
trap 'echo "🛑 Received shutdown signal, stopping..."; exit 0' SIGINT SIGTERM

# Run main function
main "$@"
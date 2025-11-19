#!/bin/bash
set -euo pipefail

echo "Running Pact contract tests..."

# Install dependencies
npm install --save-dev @pact-foundation/pact

# Run consumer tests
for service in ProductCatalog OrderService PaymentGateway InventoryManager CustomerService NotificationHub; do
    echo "Testing contracts for $service..."
    
    # Run consumer tests
    npm run test:pact:consumer -- --service="$service"
    
    # Publish pacts to broker
    npx pact-broker publish pacts \
        --consumer-app-version="$BUILD_BUILDID" \
        --broker-base-url="$PACT_BROKER_URL" \
        --broker-token="$PACT_BROKER_TOKEN"
done

# Verify provider contracts
npm run test:pact:provider

echo "Pact contract tests completed"
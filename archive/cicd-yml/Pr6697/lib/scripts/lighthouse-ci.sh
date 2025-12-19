#!/bin/bash
set -euo pipefail

# Install Lighthouse CI
npm install -g @lhci/cli

# Build the application
npm run build

# Start a local server
npx serve -s build -p 3000 &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Run Lighthouse CI
lhci autorun \
    --collect.url=http://localhost:3000 \
    --assert.preset=lighthouse:recommended \
    --assert.assertions.categories:performance=90 \
    --assert.assertions.categories:accessibility=95 \
    --assert.assertions.categories:best-practices=90 \
    --assert.assertions.categories:seo=90

# Kill the server
kill $SERVER_PID

echo "Lighthouse CI validation completed"
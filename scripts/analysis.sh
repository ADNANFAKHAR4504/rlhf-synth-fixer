#!/bin/bash
set -e

DOCKER_IMAGE="motoserver/moto:latest"
DOCKER_PORT="5001"
SCRIPT_PATH=""
SCRIPT_TYPE=""

# Cleanup function to ensure moto-server container is stopped
cleanup() {
  echo "Cleaning up Moto server Docker container..."
  docker stop moto-server 2>/dev/null || echo "Container already stopped or not found"
  echo "✅ Cleanup completed"
}

# Set trap to run cleanup on script exit (success or failure)
trap cleanup EXIT

echo "=== IaC Analysis Job ==="

# Start Moto server using Docker
echo "Starting Moto server with Docker..."
docker run --rm -d -p $DOCKER_PORT:5000 --name moto-server $DOCKER_IMAGE

# Function to check server readiness
check_server_ready() {
  for i in {1..30}; do
    if curl -s http://127.0.0.1:$DOCKER_PORT/ >/dev/null 2>&1; then
      echo "✅ Moto server is ready (attempt $i)"
      return 0
    else
      echo "⏳ Waiting for Moto server... (attempt $i/30)"
      sleep 1
    fi
  done
  return 1
}

# Wait for server to be ready
echo "Waiting for Moto server to start..."
if ! check_server_ready; then
  echo "❌ Moto server failed to start!"
  docker logs moto-server || echo "No container logs found"
  docker ps -a --filter name=moto-server || echo "No container found"
  exit 1
fi

echo "✅ Moto server started successfully using Docker"

# Check for analysis script
if [ -f "lib/analyse.py" ]; then
  SCRIPT_PATH="lib/analyse.py"
  SCRIPT_TYPE="python"
elif [ -f "lib/analyse.sh" ]; then
  SCRIPT_PATH="lib/analyse.sh"
  SCRIPT_TYPE="shell"
else
  echo "❌ No analysis script found (lib/analyse.py or lib/analyse.sh)"
  exit 1
fi

echo "Found analysis script: $SCRIPT_PATH (type: $SCRIPT_TYPE)"

# Verify server is still running
if ! curl -s http://127.0.0.1:$DOCKER_PORT/ >/dev/null 2>&1; then
  echo "❌ Moto server is not responding before tests!"
  docker logs moto-server || echo "No container logs found"
  docker ps -a --filter name=moto-server || echo "No container found"
  exit 1
fi
echo "✅ Moto server is responsive"

# Set environment variables for tests to connect to moto server
export AWS_ENDPOINT_URL="http://127.0.0.1:$DOCKER_PORT"
export AWS_ACCESS_KEY_ID="testing"
export AWS_SECRET_ACCESS_KEY="testing"
export AWS_DEFAULT_REGION="us-east-1"

# Run tests
echo "Running analysis tests..."
python -m pytest tests/test-analysis-*.py -v --tb=short --no-cov

# Run analysis script
echo "Running analysis script: $SCRIPT_PATH"
if [ "$SCRIPT_TYPE" = "python" ]; then
  AWS_ENDPOINT_URL="http://127.0.0.1:$DOCKER_PORT" python "$SCRIPT_PATH" 2>&1 | tee "lib/analysis-results.txt"
else
  chmod +x "$SCRIPT_PATH"
  AWS_ENDPOINT_URL="http://127.0.0.1:$DOCKER_PORT" bash "$SCRIPT_PATH" 2>&1 | tee "lib/analysis-results.txt"
fi

echo "✅ Analysis completed. Output saved to lib/analysis-results.txt"
echo "=== Analysis job completed successfully ==="


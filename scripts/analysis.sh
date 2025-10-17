#!/bin/bash
set -e

echo "=== IaC Analysis Job ==="

# Start Moto server using Docker
echo "Starting Moto server with Docker..."
docker run --rm -d -p 5000:5000 --name moto-server motoserver/moto:latest

# Wait for server to be ready
echo "Waiting for Moto server to start..."
for i in {1..30}; do
  if curl -s http://127.0.0.1:5000/ >/dev/null 2>&1; then
    echo "✅ Moto server is ready (attempt $i)"
    break
  else
    echo "⏳ Waiting for Moto server... (attempt $i/30)"
    sleep 1
  fi
done

# Verify server is actually running
if ! curl -s http://127.0.0.1:5000/ >/dev/null 2>&1; then
  echo "❌ Moto server failed to start!"
  echo "Docker container logs:"
  docker logs moto-server || echo "No container logs found"
  echo "Docker container status:"
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
  docker stop moto-server || echo "Container already stopped"
  exit 1
fi

echo "Found analysis script: $SCRIPT_PATH (type: $SCRIPT_TYPE)"

# Run tests
echo "Verifying Moto server is still running..."
if ! curl -s http://127.0.0.1:5000/ >/dev/null 2>&1; then
  echo "❌ Moto server is not responding before tests!"
  echo "Docker container logs:"
  docker logs moto-server || echo "No container logs found"
  echo "Docker container status:"
  docker ps -a --filter name=moto-server || echo "No container found"
  docker stop moto-server || echo "Container already stopped"
  exit 1
fi
echo "✅ Moto server is responsive"

echo "Running analysis tests..."
python -m pytest test/test-analysis-*.py -v --tb=short --no-cov

# Run analysis script
echo "Running analysis script: $SCRIPT_PATH"
if [ "$SCRIPT_TYPE" = "python" ]; then
  python "$SCRIPT_PATH" 2>&1 | tee "lib/analysis-results.txt"
else
  chmod +x "$SCRIPT_PATH"
  bash "$SCRIPT_PATH" 2>&1 | tee "lib/analysis-results.txt"
fi

echo "✅ Analysis completed. Output saved to lib/analysis-results.txt"

# Stop Moto server
echo "Stopping Moto server Docker container..."
docker stop moto-server || echo "Container already stopped or not found"
echo "✅ Moto server stopped"

echo "=== Analysis job completed successfully ==="


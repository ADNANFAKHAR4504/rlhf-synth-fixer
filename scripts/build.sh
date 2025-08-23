#!/bin/bash
set -e

echo "🔨 Running Build..."

# Read platform information to handle platform-specific builds if needed
if [ -f "metadata.json" ]; then
  PLATFORM=$(jq -r '.platform // "unknown"' metadata.json)
  LANGUAGE=$(jq -r '.language // "unknown"' metadata.json)
  echo "Project: platform=$PLATFORM, language=$LANGUAGE"
fi

# CDKTF Go preparation happens once during build to warm caches and generate .gen
if [ "$PLATFORM" = "cdktf" ] && [ "$LANGUAGE" = "go" ]; then
  echo "🔧 Preparing CDKTF Go (one-time in build)..."
  bash ./scripts/cdktf-go-prepare.sh
fi

# Build the project based on language
if [ "$LANGUAGE" = "java" ]; then
  echo "Building Java project with Gradle..."
  echo "Current working directory: $(pwd)"
  echo "Gradle wrapper: $(ls -la gradlew)"
  
  # Make sure gradlew is executable
  chmod +x ./gradlew
  
  # Run with explicit working directory and clear task specification
  # Use 'assemble' instead of 'build' to avoid running tests during build stage
  ./gradlew assemble --build-cache --parallel --no-daemon
  echo "✅ Java build completed successfully"
elif [ "$LANGUAGE" != "py" ]; then
  echo "Building project..."
  npm run build
  echo "✅ Build completed successfully"
else
  echo "⏭️ Skipping build for Python project (language=$LANGUAGE)"
fi
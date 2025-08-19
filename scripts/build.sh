#!/bin/bash
set -e

echo "🔨 Running Build..."

# Read platform information to handle platform-specific builds if needed
if [ -f "metadata.json" ]; then
  PLATFORM=$(jq -r '.platform // "unknown"' metadata.json)
  LANGUAGE=$(jq -r '.language // "unknown"' metadata.json)
  echo "Project: platform=$PLATFORM, language=$LANGUAGE"
fi

# Build the project based on language
if [ "$LANGUAGE" = "java" ]; then
  echo "Building Java project with Gradle..."
  ./gradlew build --build-cache --parallel --info
  echo "✅ Java build completed successfully"
elif [ "$LANGUAGE" != "py" ]; then
  echo "Building project..."
  npm run build
  echo "✅ Build completed successfully"
else
  echo "⏭️ Skipping build for Python project (language=$LANGUAGE)"
fi
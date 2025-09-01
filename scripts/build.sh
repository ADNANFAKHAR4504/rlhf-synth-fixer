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
case "$LANGUAGE" in
  java)
    echo "⚡ Building Java project with Gradle..."
    chmod +x ./gradlew
    ./gradlew assemble \
      --build-cache \
      --parallel \
      --max-workers=$(nproc) \
      --no-daemon
    echo "✅ Java build completed successfully"
    ;;

  py)
    echo "⏭️ Skipping build for Python project (language=$LANGUAGE)"
    ;;

  *)
    echo "📦 Running generic build (npm)..."
    npm run build
    echo "✅ Build completed successfully"
    ;;
esac
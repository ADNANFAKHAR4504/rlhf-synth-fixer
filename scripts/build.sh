#!/bin/bash
set -e

echo "🔨 Running Build..."

# Read platform information to handle platform-specific builds if needed
if [ -f "metadata.json" ]; then
  PLATFORM=$(jq -r '.platform // "unknown"' metadata.json)
  LANGUAGE=$(jq -r '.language // "unknown"' metadata.json)
  echo "Project: platform=$PLATFORM, language=$LANGUAGE"
fi

# CDKTF preparation happens once during build to warm caches and generate .gen
if [ "$PLATFORM" = "cdktf" ]; then
  if [ "$LANGUAGE" = "go" ]; then
    echo "🔧 Preparing CDKTF Go (one-time in build)..."
    bash ./scripts/cdktf-go-prepare.sh
  elif [[ "$LANGUAGE" =~ ^(ts|js)$ ]]; then
    # Ensure provider bindings are generated for TypeScript/JavaScript
    if [ ! -d ".gen" ] || [ -z "$(ls -A .gen 2>/dev/null)" ]; then
      echo "🔧 Generating CDKTF provider bindings..."
      npx cdktf get
    else
      echo "✅ CDKTF provider bindings already exist"
    fi
  fi
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
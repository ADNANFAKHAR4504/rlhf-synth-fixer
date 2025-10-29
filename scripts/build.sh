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

  py|python)
    if [ "$PLATFORM" = "analysis" ]; then
      echo "✅ Analysis platform detected, validating analysis script exists..."
      if [ -f "lib/analyse.py" ]; then
        echo "✅ Found lib/analyse.py"
        # Verify it's valid Python
        python -m py_compile lib/analyse.py || {
          echo "❌ lib/analyse.py has syntax errors"
          exit 1
        }
        echo "✅ lib/analyse.py is valid Python"
      else
        echo "❌ No analysis script found (lib/analyse.py)"
        exit 1
      fi
    else
      echo "⏭️ Skipping build for Python project (language=$LANGUAGE)"
    fi
    ;;

  *)
    echo "📦 Running generic build (npm)..."
    npm run build
    echo "✅ Build completed successfully"
    ;;
esac
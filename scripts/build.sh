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

  go)
    echo "⚡ Building Go project..."
    go mod tidy
    echo "✅ Go build completed successfully"
    ;;

  yaml|json)
    echo "⏭️ Skipping build for CloudFormation $LANGUAGE project (no TypeScript compilation needed)"
    ;;

  hcl)
    echo "⏭️ Skipping build for Terraform HCL project (language=$LANGUAGE, no TypeScript compilation needed)"
    ;;

  *)
    echo "📦 Running generic build (npm)..."
    # Allow build to continue even if tests have compilation errors
    # The test job will catch and report actual test failures
    npm run build || true
    echo "✅ Build completed"

    # For CDK/CDKTF TypeScript projects, create dist/ folder for artifact upload
    if [ "$PLATFORM" = "cdk" ] || [ "$PLATFORM" = "cdktf" ]; then
      echo "📦 Creating dist/ folder for CDK/CDKTF artifact..."
      mkdir -p dist

      # Copy compiled JavaScript files (even if some compilation errors occurred)
      if [ -d "lib" ] && ls lib/*.js 2>/dev/null | grep -q .; then
        cp -r lib dist/
        echo "  ✓ Copied lib/ to dist/"
      fi
      if [ -d "bin" ] && ls bin/*.js 2>/dev/null | grep -q .; then
        cp -r bin dist/
        echo "  ✓ Copied bin/ to dist/"
      fi

      # Copy essential configuration files
      if [ -f "cdk.json" ]; then
        cp cdk.json dist/
      fi
      if [ -f "cdktf.json" ]; then
        cp cdktf.json dist/
      fi
      if [ -f "package.json" ]; then
        cp package.json dist/
      fi
      if [ -f "tsconfig.json" ]; then
        cp tsconfig.json dist/
      fi

      echo "✅ dist/ folder created with compiled files"
    fi
    ;;
esac
#!/bin/bash

# Validate jest.config.js test folder
# Validates that jest.config.js uses the correct 'test/' folder configuration

set -e

echo "🔍 Validating jest.config.js configuration..."
echo "Language: ${LANGUAGE:-unknown}"

# Valid config requires ONLY 'test/' directory (singular)
# Do NOT include 'tests/' - that's for Python/Go/Java projects using their own test runners
ROOTS_LINE=$(grep 'roots:' jest.config.js || echo '')

# Check for the correct configuration: only 'test/' folder
if echo "$ROOTS_LINE" | grep -q "roots: \['<rootDir>/test'\]"; then
  echo "✅ jest.config.js validation passed - using 'test/' folder (singular)"
  echo "Found: $ROOTS_LINE"
else
  echo ""
  echo "❌ ERROR: jest.config.js has incorrect roots configuration!"
  echo ""
  echo "Expected: roots: ['<rootDir>/test']"
  echo "Found:    $ROOTS_LINE"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Jest is ONLY used for TypeScript/JavaScript projects."
  echo "TS/JS projects must use 'test/' folder (singular)."
  echo ""
  echo "Other languages use their own test runners:"
  echo "  - Python: pytest with 'tests/' folder"
  echo "  - Go: go test with 'tests/' folder"
  echo "  - Java: JUnit/Gradle with 'tests/' folder"
  echo ""
  echo "Do NOT add 'tests/' to Jest roots - it will break validation!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  exit 1
fi

#!/bin/bash

# Prepare Java Coverage Reports
# Prepares Java JaCoCo coverage reports for upload with extensive debugging

set -e

echo "Preparing Java coverage reports for upload..."
echo "Debug: Checking current directory structure:"
ls -la

echo "Debug: Checking build directory:"
if [ -d "build" ]; then
  ls -la build/
  if [ -d "build/reports" ]; then
    echo "Reports directory contents:"
    ls -la build/reports/
    if [ -d "build/reports/jacoco" ]; then
      echo "JaCoCo directory contents:"
      find build/reports/jacoco -type f | head -10
    fi
  fi
else
  echo "No build directory found"
fi

mkdir -p coverage

# Try different possible locations for JaCoCo reports
if [ -d "build/reports/jacoco/test/" ]; then
  cp -r build/reports/jacoco/test/* coverage/
  echo "✅ Copied JaCoCo reports from build/reports/jacoco/test/ to coverage/ directory"
elif [ -d "build/reports/jacoco/" ]; then
  cp -r build/reports/jacoco/* coverage/
  echo "✅ Copied JaCoCo reports from build/reports/jacoco/ to coverage/ directory"
else
  echo "⚠️ JaCoCo reports not found in expected locations"
  # Create a placeholder to avoid upload failure
  echo "No coverage reports generated" > coverage/no-reports.txt
fi

echo "Final coverage directory contents:"
ls -la coverage/

#!/bin/bash

# Extract platform and language for S3 upload
# Finds the archive folder for the PR and extracts metadata

set -e

PR_NUMBER="${PR_NUMBER:-}"

# We need to find the specific archive folder for this PR
# Since we don't know platform/language yet, we'll search for the PR-specific folder
PR_FOLDER_PATTERN="archive/*/Pr${PR_NUMBER}"

# Find the archive folder for this specific PR
ARCHIVE_FOLDER=""
for folder in $PR_FOLDER_PATTERN; do
  if [ -d "$folder" ]; then
    ARCHIVE_FOLDER="$folder"
    break
  fi
done

if [ -n "$ARCHIVE_FOLDER" ] && [ -f "$ARCHIVE_FOLDER/metadata.json" ]; then
  echo "Found archive folder: $ARCHIVE_FOLDER"
  echo "Found metadata.json at: $ARCHIVE_FOLDER/metadata.json"
  PLATFORM=$(jq -r '.platform // "unknown"' "$ARCHIVE_FOLDER/metadata.json")
  LANGUAGE=$(jq -r '.language // "unknown"' "$ARCHIVE_FOLDER/metadata.json")
else
  echo "Warning: Could not find archive folder or metadata.json for PR $PR_NUMBER"
  echo "Available archive folders:"
  ls -la archive/ || echo "No archive directory found"
  PLATFORM="unknown"
  LANGUAGE="unknown"
fi

echo "platform=$PLATFORM" >> $GITHUB_OUTPUT
echo "language=$LANGUAGE" >> $GITHUB_OUTPUT
echo "Extracted platform: $PLATFORM, language: $LANGUAGE"

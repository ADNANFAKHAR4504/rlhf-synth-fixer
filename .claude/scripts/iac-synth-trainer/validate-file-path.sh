#!/bin/bash
# Validate that file is in allowed directory before modification
set -e

FILE_TO_MODIFY="$1"

if [ -z "$FILE_TO_MODIFY" ]; then
  echo "Usage: $0 <file_path>"
  exit 1
fi

# Allowed directories and files
if [[ "$FILE_TO_MODIFY" == lib/* ]] || \
   [[ "$FILE_TO_MODIFY" == bin/* ]] || \
   [[ "$FILE_TO_MODIFY" == test/* ]] || \
   [[ "$FILE_TO_MODIFY" == tests/* ]] || \
   [[ "$FILE_TO_MODIFY" == "metadata.json" ]] || \
   [[ "$FILE_TO_MODIFY" == "package.json" ]] || \
   [[ "$FILE_TO_MODIFY" == "package-lock.json" ]] || \
   [[ "$FILE_TO_MODIFY" == "cdk.json" ]] || \
   [[ "$FILE_TO_MODIFY" == "cdktf.json" ]] || \
   [[ "$FILE_TO_MODIFY" == "Pulumi.yaml" ]] || \
   [[ "$FILE_TO_MODIFY" == "tap.py" ]] || \
   [[ "$FILE_TO_MODIFY" == "tap.go" ]] || \
   [[ "$FILE_TO_MODIFY" == "setup.js" ]] || \
   [[ "$FILE_TO_MODIFY" == "Pipfile" ]] || \
   [[ "$FILE_TO_MODIFY" == "Pipfile.lock" ]] || \
   [[ "$FILE_TO_MODIFY" == "build.gradle" ]] || \
   [[ "$FILE_TO_MODIFY" == "pom.xml" ]]; then
  echo "✅ File in allowed directory: ${FILE_TO_MODIFY}"
  exit 0
else
  echo "❌ FORBIDDEN: Cannot modify ${FILE_TO_MODIFY}"
  echo "Only lib/, bin/, test/, tests/ and specific root files allowed"
  echo "Allowed root files: metadata.json, package.json, package-lock.json,"
  echo "  cdk.json, cdktf.json, Pulumi.yaml, tap.py, tap.go, setup.js,"
  echo "  Pipfile, Pipfile.lock, build.gradle, pom.xml"
  exit 1
fi

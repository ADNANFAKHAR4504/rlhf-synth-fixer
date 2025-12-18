#!/bin/bash

set -e

ALLOWED_FOLDERS=("bin" "lib" "test" "tests" "cli" "scripts" ".github")
ALLOWED_FILES=(
  "package.json"
  "package-lock.json"
  "cdk.json"
  "tap.py"
  "tap.go"
  "cdktf.json"
  "Pulumi.yaml"
  "metadata.json"
  "go.mod"
  "go.sum"
  "docker-compose.yml"
  "docker-compose.yaml"
  ".dockerignore"
  "Dockerfile"
  "Makefile"
  "README.md"
  "requirements.txt"
  "Pipfile"
  "Pipfile.lock"
  "pom.xml"
  "build.gradle"
  "settings.gradle"
  ".gitignore"
  ".editorconfig"
  "tsconfig.json"
  "jest.config.js"
  "jest.config.ts"
  ".eslintrc.js"
  ".eslintrc.json"
  ".prettierrc"
  "setup.py"
  "pyproject.toml"
)

echo "Checking PR file changes..."

changed_files=$(git diff --name-only origin/main...HEAD)

if [ -z "$changed_files" ]; then
  echo "No changed files detected"
  exit 0
fi

invalid_files=()

while IFS= read -r file; do
  valid=false

  for folder in "${ALLOWED_FOLDERS[@]}"; do
    if [[ "$file" == "$folder/"* ]]; then
      valid=true
      break
    fi
  done

  if [ "$valid" = false ]; then
    for allowed_file in "${ALLOWED_FILES[@]}"; do
      if [[ "$file" == "$allowed_file" ]]; then
        valid=true
        break
      fi
    done
  fi

  if [ "$valid" = false ]; then
    invalid_files+=("$file")
  fi
done <<< "$changed_files"

if [ ${#invalid_files[@]} -gt 0 ]; then
  echo "ERROR: Found files outside allowed directories/files:"
  printf '  - %s\n' "${invalid_files[@]}"
  echo ""
  echo "Allowed folders: ${ALLOWED_FOLDERS[*]}"
  echo "Allowed files: ${ALLOWED_FILES[*]}"
  exit 1
fi

echo "All changed files are in allowed locations"
exit 0

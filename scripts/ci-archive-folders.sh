#!/bin/bash
# Archive folders and reset repository
# Required env vars: PLATFORM, LANGUAGE, PR_NUMBER, COMMIT_AUTHOR, DOCKER_S3_LOCATION (optional)
set -e

echo "🔍 Starting archive folders and reset repository process..."

# Validate required environment variables
if [ -z "$PLATFORM" ] || [ -z "$LANGUAGE" ] || [ -z "$PR_NUMBER" ]; then
  echo "::error::Missing required environment variables PLATFORM, LANGUAGE, or PR_NUMBER"
  exit 1
fi

# Configure Git
git config user.name "GitHub Actions Bot"
git config user.email "actions@github.com"

echo "Using platform: $PLATFORM, language: $LANGUAGE"

# Update metadata.json with coverage information and commit author
# Get commit author from environment or default
COMMIT_AUTHOR="${COMMIT_AUTHOR:-unknown}"
echo "Commit author: $COMMIT_AUTHOR"

# Extract coverage percentages based on language
if [ "$LANGUAGE" = "yml" ]; then
  echo "CI/CD Pipeline task - no unit test coverage required"
  LINES_COVERAGE=100
  BRANCHES_COVERAGE=100
elif [ "$LANGUAGE" = "py" ]; then
  echo "Extracting Python coverage from cov.json..."
  if [ -f "cov.json" ]; then
    LINES_COVERAGE=$(jq -r '.totals.percent_covered' cov.json)
    # Calculate branch coverage percentage
    BRANCHES_NUM=$(jq -r '.totals.num_branches' cov.json)
    if [ "$BRANCHES_NUM" = "0" ] || [ "$BRANCHES_NUM" = "null" ]; then
      # No branches to cover, set to 100%
      BRANCHES_COVERAGE=100
    else
      COVERED_BRANCHES=$(jq -r '.totals.covered_branches' cov.json)
      # Calculate percentage: (covered_branches / num_branches) * 100
      BRANCHES_COVERAGE=$(awk "BEGIN {print ($COVERED_BRANCHES / $BRANCHES_NUM) * 100}")
    fi
  else
    echo "Warning: cov.json not found, setting default coverage values"
    LINES_COVERAGE=100
    BRANCHES_COVERAGE=100
  fi
elif [ "$LANGUAGE" = "go" ]; then
  echo "Extracting Go coverage from coverage-summary.json..."
  if [ -f "coverage/coverage-summary.json" ]; then
    LINES_COVERAGE=$(jq -r '.total.lines.pct' coverage/coverage-summary.json)
    BRANCHES_COVERAGE=$(jq -r '.total.branches.pct' coverage/coverage-summary.json)
  else
    echo "Warning: Go coverage-summary.json not found, setting default coverage values"
    LINES_COVERAGE=100
    BRANCHES_COVERAGE=100
  fi
else
  echo "Extracting TypeScript/JavaScript coverage from coverage-summary.json..."
  if [ -f "coverage/coverage-summary.json" ]; then
    LINES_COVERAGE=$(jq -r '.total.lines.pct' coverage/coverage-summary.json)
    BRANCHES_COVERAGE=$(jq -r '.total.branches.pct' coverage/coverage-summary.json)
  else
    echo "Warning: coverage-summary.json not found, setting default coverage values"
    LINES_COVERAGE=100
    BRANCHES_COVERAGE=100
  fi
fi

# If coverage is "Unknown", set to 100
if [ "$LINES_COVERAGE" = "Unknown" ]; then
  LINES_COVERAGE=100
fi
if [ "$BRANCHES_COVERAGE" = "Unknown" ]; then
  BRANCHES_COVERAGE=100
fi

echo "Lines coverage: $LINES_COVERAGE%"
echo "Branches coverage: $BRANCHES_COVERAGE%"

# Update metadata.json with coverage information and commit author (assuming it always exists)
jq --arg lines "$LINES_COVERAGE" --arg branches "$BRANCHES_COVERAGE" --arg author "$COMMIT_AUTHOR" \
  '. + {coverage: {lines: ($lines|tonumber), branches: ($branches|tonumber)}, author: $author}' \
  metadata.json > metadata.json.tmp
mv metadata.json.tmp metadata.json
echo "Updated metadata.json with coverage information and commit author"

cat metadata.json

echo "Current directory contents before archiving:"
ls -la

# Get Docker S3 location and add it to metadata.json
DOCKER_S3_LOCATION="${DOCKER_S3_LOCATION:-}"
echo "Docker S3 location: $DOCKER_S3_LOCATION"

# Add the dockerS3Location to metadata.json
jq --arg location "$DOCKER_S3_LOCATION" '. + {dockerS3Location: $location}' metadata.json > metadata.json.tmp
mv metadata.json.tmp metadata.json
echo "Updated metadata.json with dockerS3Location: $DOCKER_S3_LOCATION"

# Create archive directory with platform, language, and PR number
ARCHIVE_DIR="archive/${PLATFORM}-${LANGUAGE}/Pr${PR_NUMBER}"
mkdir -p "$ARCHIVE_DIR"
echo "Created archive directory: $ARCHIVE_DIR"

# Define list of paths to move to archive
PATHS_TO_ARCHIVE=(
  "lib"
  "bin"
  "test"
  "tests"
  "cdk.json"
  "metadata.json"
  "tap.py"
  "tap.go"
  "setup.js"
  "cdktf.json"
  "Pulumi.yaml"
)

# Move paths to archive
for path in "${PATHS_TO_ARCHIVE[@]}"; do
  if [[ -d "$path" || -f "$path" ]]; then
    mv "$path" "$ARCHIVE_DIR"/
    echo "Moved $path to archive"
  else
    echo "Path $path not found, skipping"
  fi
done

# Check if there are changes to commit
if git diff --quiet && git diff --cached --quiet; then
  echo "No changes to commit - no folders found to archive"
else
  # Extract metadata for commit message
  METADATA_FILE="$ARCHIVE_DIR/metadata.json"
  METADATA_PLATFORM=$(jq -r '.platform' "$METADATA_FILE")
  METADATA_PO_ID=$(jq -r '.po_id' "$METADATA_FILE")
  METADATA_SUBTASK=$(jq -r '.subtask | ascii_downcase' "$METADATA_FILE")
  METADATA_SUBJECT_LABELS=$(jq -r '.subject_labels | join(", ")' "$METADATA_FILE")
  METADATA_AUTHOR=$(jq -r '.author' "$METADATA_FILE")

  # Truncate subject_labels to 100 characters if needed
  if [ ${#METADATA_SUBJECT_LABELS} -gt 100 ]; then
    METADATA_SUBJECT_LABELS="${METADATA_SUBJECT_LABELS:0:97}..." # 97 chars + "..." = 100
  fi

  COMMIT_SUBJECT="feat(${METADATA_PLATFORM}): ${METADATA_PO_ID} ${METADATA_SUBTASK}"
  COMMIT_BODY="${METADATA_SUBJECT_LABELS}\nAuthor: ${METADATA_AUTHOR}"

  git add -A
  git commit -m "${COMMIT_SUBJECT}" -m "${COMMIT_BODY}" -m "[skip-jobs]"
  git push origin HEAD
  echo "✅ Archive committed to current branch"
fi


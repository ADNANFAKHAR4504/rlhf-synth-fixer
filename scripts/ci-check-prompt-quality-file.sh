#!/bin/bash

# Check if prompt quality review file exists
# Sets output variable for conditional execution of subsequent steps

set -e

if [ -f .claude/prompts/claude-prompt-quality-review.md ]; then
  echo "file_exists=true" >> $GITHUB_OUTPUT
  echo "✅ Prompt quality review file found"
else
  echo "file_exists=false" >> $GITHUB_OUTPUT
  echo "⚠️ Prompt quality review file not found - skipping this check"
  echo "This is expected for PRs created before this feature was merged to main"
fi

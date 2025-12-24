#!/bin/bash

# Prepare Claude prompt for prompt quality review
# Reads the prompt file and exports it as an environment variable

set -e

PROMPT=$(cat .claude/prompts/claude-prompt-quality-review.md)
{
  echo 'CLAUDE_PROMPT<<PROMPT_EOF'
  echo "$PROMPT"
  echo 'PROMPT_EOF'
} >> $GITHUB_ENV

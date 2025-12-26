#!/bin/bash
# Check for critical issues in Claude review
# Required env vars: GH_TOKEN, GITHUB_REPOSITORY, PR_NUMBER, GITHUB_SERVER_URL, GITHUB_RUN_ID, GITHUB_OUTPUT
set -e

echo "🔍 Checking for critical validation failures in Claude review..."

# Validate required environment variables
if [ -z "$GITHUB_REPOSITORY" ] || [ -z "$PR_NUMBER" ]; then
  echo "::error::Missing required environment variables GITHUB_REPOSITORY or PR_NUMBER"
  exit 1
fi

# Fetch all PR comments with timestamps, sorted by creation time
# Only check the MOST RECENT Claude review comment (identified by review markers)
gh api \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "/repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments" \
  --jq 'sort_by(.created_at) | reverse | .[].body' > all_comments_sorted.txt

# Find the most recent Claude review comment (contains review markers)
# Claude reviews contain specific markers like "metadata.json Validation", "SCORE:", etc.
CLAUDE_COMMENT=""
while IFS= read -r -d '' comment || [[ -n "$comment" ]]; do
  if echo "$comment" | grep -qE "(metadata\.json Validation|Code Review Summary|Training Quality|SCORE:[0-9]+|## 📋)"; then
    CLAUDE_COMMENT="$comment"
    break
  fi
done < <(gh api \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "/repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments" \
  --jq 'sort_by(.created_at) | reverse | .[] | .body + "\u0000"')

if [ -z "$CLAUDE_COMMENT" ]; then
  echo "⚠️ No Claude review comment found with expected markers"
  echo "Checking all recent comments as fallback..."
  # Fallback: use the most recent comment
  CLAUDE_COMMENT=$(gh api \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "/repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments" \
    --jq 'sort_by(.created_at) | reverse | .[0].body // empty')
fi

if [ -z "$CLAUDE_COMMENT" ]; then
  echo "⚠️ No comments found on PR"
  echo "critical_issues_found=false" >> "$GITHUB_OUTPUT"
  exit 0
fi

# Save the most recent Claude comment for checking
echo "$CLAUDE_COMMENT" > latest_claude_comment.txt
echo "📝 Checking Claude's review comment ($(echo "$CLAUDE_COMMENT" | wc -c) bytes)"

# ============================================================
# LOCALSTACK MIGRATION DETECTION
# LocalStack migrations have adjusted review criteria
# ============================================================

IS_LOCALSTACK_MIGRATION=false

# Check branch name for LocalStack indicators
BRANCH_NAME=$(gh api \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "/repos/${GITHUB_REPOSITORY}/pulls/${PR_NUMBER}" \
  --jq '.head.ref // empty' 2>/dev/null || echo "")

if [[ "$BRANCH_NAME" == ls-* ]] || [[ "$BRANCH_NAME" == *localstack* ]] || [[ "$BRANCH_NAME" == *LS-* ]]; then
  IS_LOCALSTACK_MIGRATION=true
  echo "🔧 LocalStack migration detected (branch: $BRANCH_NAME) - applying adjusted criteria"
fi

# ============================================================
# IMPROVED ERROR DETECTION WITH CLEAR, USER-FRIENDLY MESSAGES
# Each issue type has: detection, explanation, and fix steps
# ============================================================

CRITICAL_FOUND=false
ISSUE_TYPE=""
ISSUE_QUOTE=""

# Helper function to build clear error message
build_error_output() {
  local issue_type="$1"
  local quote="$2"
  local what_happened="$3"
  local why_matters="$4"
  local how_to_fix="$5"
  
  echo ""
  echo "════════════════════════════════════════════════════════════════"
  echo "❌ CLAUDE REVIEW FAILED"
  echo "════════════════════════════════════════════════════════════════"
  echo ""
  echo "WHAT HAPPENED:"
  echo "  $what_happened"
  echo ""
  echo "FROM CLAUDE'S REVIEW:"
  echo "  \"$quote\""
  echo ""
  echo "WHY THIS MATTERS:"
  echo "  $why_matters"
  echo ""
  echo "HOW TO FIX:"
  echo "$how_to_fix"
  echo ""
  echo "════════════════════════════════════════════════════════════════"
}

# -------------------------------------------------------------------
# CHECK 1: Metadata validation failed
# -------------------------------------------------------------------
if grep -qE "Metadata validation FAILED|❌.*[Mm]etadata|❌.*[Vv]alidation.*FAILED" latest_claude_comment.txt; then
  CRITICAL_FOUND=true
  ISSUE_TYPE="metadata_validation"
  ISSUE_QUOTE=$(grep -oE ".*[Mm]etadata validation FAILED.*|❌.*[Mm]etadata.*|❌.*[Vv]alidation.*" latest_claude_comment.txt | head -1 | cut -c1-150)
  
  build_error_output \
    "Metadata Validation Failed" \
    "$ISSUE_QUOTE" \
    "Your metadata.json file has errors that need to be fixed." \
    "The metadata.json file tells the system how to process your PR. Invalid values will cause the pipeline to fail." \
    "  1. Open metadata.json in your project root
  2. Check for these common issues:
     - platform: must be one of: cdk, cdktf, cfn, tf, pulumi, cicd, analysis
     - language: must match your platform (e.g., ts for CDK, hcl for Terraform)
     - subtask: must be an exact match from the allowed list
     - subject_labels: must be an array, not a string
  3. Run: bash .claude/scripts/validate-metadata.sh metadata.json
  4. Fix any errors shown, then push your changes"

# -------------------------------------------------------------------
# CHECK 2: Security issue - credentials in code
# -------------------------------------------------------------------
elif grep -qiE "HARDCODED SECRETS FOUND|❌.*hardcoded.*secret|❌.*credential|❌.*password|❌.*api.?key" latest_claude_comment.txt; then
  CRITICAL_FOUND=true
  ISSUE_TYPE="hardcoded_credentials"
  ISSUE_QUOTE=$(grep -oiE ".*HARDCODED SECRETS FOUND.*|.*❌.*hardcoded.*|.*❌.*credential.*|.*❌.*password.*|.*❌.*api.?key.*" latest_claude_comment.txt | head -1 | cut -c1-150)
  
  build_error_output \
    "Security Issue - Credentials in Code" \
    "$ISSUE_QUOTE" \
    "Claude found passwords, API keys, or AWS credentials written directly in your code." \
    "Credentials in code are a security risk. They can be exposed if code is shared or pushed to a repository." \
    "  1. Find the file mentioned in Claude's review above
  2. Remove the hardcoded credentials
  3. Replace with environment variables:
     BEFORE: const apiKey = \"sk-abc123...\"
     AFTER:  const apiKey = process.env.API_KEY
  4. Or use AWS Secrets Manager for sensitive values
  5. Push your changes"

# -------------------------------------------------------------------
# CHECK 3: AI-generated content in PROMPT files
# Note: Pattern must not match positive messages like "no emojis" or "✅ No hardcoded secrets, no emojis"
# -------------------------------------------------------------------
elif grep -qiE "❌.*emojis? found|❌.*ai-generated|CRITICAL:.*emoji|emojis? detected|emojis? in PROMPT" latest_claude_comment.txt && ! grep -qiE "no emojis|✅.*no.*emojis" latest_claude_comment.txt; then
  CRITICAL_FOUND=true
  ISSUE_TYPE="ai_generated_content"
  ISSUE_QUOTE=$(grep -oiE ".*❌.*emojis? found.*|.*❌.*ai-generated.*|.*emojis? detected.*|.*emojis? in PROMPT.*" latest_claude_comment.txt | head -1 | cut -c1-150)
  
  build_error_output \
    "AI-Generated Content Detected" \
    "$ISSUE_QUOTE" \
    "Your PROMPT.md file contains emojis or patterns that indicate it was written by AI." \
    "PROMPT.md files must be human-written. AI-generated prompts reduce training data quality." \
    "  1. Open lib/PROMPT.md
  2. Remove ALL emojis (🚀, 💡, ✨, 📝, etc.)
  3. Remove AI-style formatting like:
     - Excessive bullet points
     - \"Let's\" or \"I'll help you\" phrases
     - Overly structured headings
  4. Rewrite in natural, conversational language
  5. Push your changes"

# -------------------------------------------------------------------
# CHECK 4: Platform/language mismatch
# -------------------------------------------------------------------
elif grep -qiE "❌.*platform.*mismatch|❌.*language.*mismatch|platform.*language.*invalid" latest_claude_comment.txt; then
  CRITICAL_FOUND=true
  ISSUE_TYPE="platform_mismatch"
  ISSUE_QUOTE=$(grep -oiE ".*❌.*platform.*|.*❌.*language.*|.*mismatch.*" latest_claude_comment.txt | head -1 | cut -c1-150)
  
  build_error_output \
    "Platform/Language Mismatch" \
    "$ISSUE_QUOTE" \
    "Your metadata.json says one thing, but your code is written differently." \
    "The platform and language in metadata.json must match your actual code files." \
    "  1. Check your metadata.json platform and language fields
  2. Verify they match your code:
     - CDK TypeScript: platform=cdk, language=ts
     - Terraform: platform=tf, language=hcl
     - CloudFormation: platform=cfn, language=yaml
     - Pulumi Python: platform=pulumi, language=py
     - Pulumi Go: platform=pulumi, language=go
  3. Update metadata.json to match your actual code
  4. Push your changes"

# -------------------------------------------------------------------
# CHECK 5: BLOCKED status
# -------------------------------------------------------------------
elif grep -q "BLOCKED:" latest_claude_comment.txt; then
  CRITICAL_FOUND=true
  ISSUE_TYPE="blocked"
  ISSUE_QUOTE=$(grep -o "BLOCKED:.*" latest_claude_comment.txt | head -1 | cut -c1-150)
  
  build_error_output \
    "PR Blocked" \
    "$ISSUE_QUOTE" \
    "Claude has blocked this PR due to issues that must be resolved." \
    "Blocked PRs cannot proceed until the specified issues are fixed." \
    "  1. Read Claude's full review comment above
  2. Address each issue mentioned after 'BLOCKED:'
  3. Push your fixes"

# -------------------------------------------------------------------
# CHECK 6: Missing required files
# -------------------------------------------------------------------
elif grep -qiE "❌.*missing|❌.*not found|❌.*required.*file" latest_claude_comment.txt; then
  CRITICAL_FOUND=true
  ISSUE_TYPE="missing_files"
  ISSUE_QUOTE=$(grep -oiE ".*❌.*missing.*|.*❌.*not found.*|.*❌.*required.*file.*" latest_claude_comment.txt | head -1 | cut -c1-150)
  
  build_error_output \
    "Missing Required Files" \
    "$ISSUE_QUOTE" \
    "Your PR is missing one or more required files." \
    "Certain files are required for the review process to complete." \
    "  1. Check which files are missing from Claude's review
  2. Required files typically include:
     - lib/PROMPT.md (the task prompt)
     - lib/MODEL_RESPONSE.md (AI model's response)
     - lib/IDEAL_RESPONSE.md (expected correct response)
     - lib/MODEL_FAILURES.md (analysis of model errors)
  3. Create the missing files in the lib/ directory
  4. Push your changes"

# -------------------------------------------------------------------
# CHECK 7: SCORE:0 (Claude's deliberate failure signal)
# -------------------------------------------------------------------
elif grep -qE "^SCORE:0$|SCORE:0[^0-9]" latest_claude_comment.txt; then
  CRITICAL_FOUND=true
  ISSUE_TYPE="score_zero"
  # Try to find the reason Claude gave score 0
  ISSUE_QUOTE=$(grep -B5 "SCORE:0" latest_claude_comment.txt | grep -iE "issue|error|fail|problem|missing|invalid" | head -1 | cut -c1-150)
  if [ -z "$ISSUE_QUOTE" ]; then
    ISSUE_QUOTE="SCORE:0 - Claude found critical issues requiring fixes"
  fi
  
  build_error_output \
    "Review Score: 0/10" \
    "$ISSUE_QUOTE" \
    "Claude gave your PR a score of 0, indicating critical issues." \
    "A score of 0 means the PR has fundamental problems that must be fixed." \
    "  1. Read Claude's FULL review comment above carefully
  2. Look for sections marked with ❌ or 'Issues'
  3. Fix ALL identified problems
  4. Push your changes for a new review"

# -------------------------------------------------------------------
# CHECK 8: Explicit CRITICAL marker
# -------------------------------------------------------------------
elif grep -qE "❌ CRITICAL:|❌.*CRITICAL|CRITICAL.*❌" latest_claude_comment.txt; then
  CRITICAL_FOUND=true
  ISSUE_TYPE="critical_marker"
  ISSUE_QUOTE=$(grep -oE ".*❌.*CRITICAL.*|.*CRITICAL.*❌.*" latest_claude_comment.txt | head -1 | cut -c1-150)
  
  build_error_output \
    "Critical Issue Found" \
    "$ISSUE_QUOTE" \
    "Claude marked a critical issue that blocks this PR." \
    "Critical issues must be resolved before the PR can proceed." \
    "  1. Read Claude's review comment above
  2. Find the section marked CRITICAL
  3. Follow Claude's instructions to fix the issue
  4. Push your changes"

# -------------------------------------------------------------------
# CHECK 9: Claude explicitly requested failure
# -------------------------------------------------------------------
elif grep -q "Exit with code 1 to fail the job" latest_claude_comment.txt; then
  CRITICAL_FOUND=true
  ISSUE_TYPE="explicit_failure"
  ISSUE_QUOTE=$(grep -B3 "Exit with code 1" latest_claude_comment.txt | head -1 | cut -c1-150)
  
  build_error_output \
    "Review Failed" \
    "$ISSUE_QUOTE" \
    "Claude determined this PR should not proceed in its current state." \
    "The review found issues that require your attention." \
    "  1. Read Claude's full review comment above
  2. Address all issues mentioned
  3. Push your fixes"
fi

# -------------------------------------------------------------------
# LOCALSTACK MIGRATION: Downgrade certain issues to warnings
# -------------------------------------------------------------------
if [ "$IS_LOCALSTACK_MIGRATION" = true ] && [ "$CRITICAL_FOUND" = true ]; then
  echo "🔧 LocalStack migration: Evaluating if issue should be downgraded..."
  
  # Check if the Claude review mentions LocalStack compatibility
  HAS_LOCALSTACK_DOCS=false
  if grep -qiE "LocalStack Compatibility|localstack.*adjustment|localstack.*limitation" latest_claude_comment.txt; then
    HAS_LOCALSTACK_DOCS=true
    echo "✅ LocalStack compatibility is documented in the review"
  fi
  
  # Issues that can be downgraded for LocalStack migrations with proper documentation
  case "$ISSUE_TYPE" in
    missing_files)
      # Check if it's about missing services (not actual file structure)
      if echo "$ISSUE_QUOTE" | grep -qiE "service|CloudFront|Route53|WAF|EKS|AppSync|Cognito"; then
        if [ "$HAS_LOCALSTACK_DOCS" = true ]; then
          echo "⚠️ Missing services warning downgraded - LocalStack compatibility documented"
          CRITICAL_FOUND=false
        fi
      fi
      ;;
    score_zero)
      # Check if score 0 was given due to LocalStack limitations being misunderstood
      if grep -qiE "missing.*services|unsupported.*feature|localstack" latest_claude_comment.txt; then
        if [ "$HAS_LOCALSTACK_DOCS" = true ]; then
          echo "⚠️ Score 0 may be due to LocalStack limitations - check if properly documented"
          # Don't auto-downgrade score 0, but add context
          echo "Note: This appears to be a LocalStack migration. If the low score is due to unsupported services,"
          echo "ensure MODEL_FAILURES.md has a 'LocalStack Compatibility Adjustments' table."
        fi
      fi
      ;;
    blocked)
      # Check if blocked due to LocalStack limitations
      if echo "$ISSUE_QUOTE" | grep -qiE "service|CloudFront|Route53|WAF|EKS|NAT Gateway"; then
        if [ "$HAS_LOCALSTACK_DOCS" = true ]; then
          echo "⚠️ BLOCKED status may be due to LocalStack limitations - reviewing..."
          echo "Note: Ensure MODEL_FAILURES.md documents these as intentional LocalStack adaptations"
        fi
      fi
      ;;
  esac
  
  if [ "$CRITICAL_FOUND" = false ]; then
    echo "✅ Issue downgraded for LocalStack migration - proceeding with adjusted criteria"
  fi
fi

# -------------------------------------------------------------------
# POST RESULT
# -------------------------------------------------------------------
if [ "$CRITICAL_FOUND" = true ]; then
  # Build user-friendly PR comment based on issue type
  case "$ISSUE_TYPE" in
    metadata_validation)
      FIX_STEPS="1. Open \`metadata.json\` in your project root
2. Run the validation script: \`bash .claude/scripts/validate-metadata.sh metadata.json\`
3. Fix the errors shown by the script
4. Common fixes:
   - Ensure \`platform\` is one of: cdk, cdktf, cfn, tf, pulumi, cicd, analysis
   - Ensure \`language\` matches your platform
   - Ensure \`subject_labels\` is an array: \`[\"Label Name\"]\`
5. Push your changes"
      ;;
    hardcoded_credentials)
      FIX_STEPS="1. Find the file mentioned in Claude's review
2. Remove hardcoded credentials (passwords, API keys, AWS keys)
3. Replace with environment variables:
   \`\`\`
   // Before
   const apiKey = \"sk-abc123...\";
   
   // After  
   const apiKey = process.env.API_KEY;
   \`\`\`
4. Or use AWS Secrets Manager for sensitive values
5. Push your changes"
      ;;
    ai_generated_content)
      FIX_STEPS="1. Open \`lib/PROMPT.md\`
2. Remove ALL emojis (🚀, 💡, ✨, 📝, ✅, ❌, etc.)
3. Remove AI-style writing patterns
4. Rewrite in natural, human language
5. Push your changes"
      ;;
    platform_mismatch)
      FIX_STEPS="1. Check your \`metadata.json\` platform and language
2. Verify they match your actual code:
   - CDK + TypeScript → \`platform: cdk, language: ts\`
   - Terraform → \`platform: tf, language: hcl\`
   - CloudFormation → \`platform: cfn, language: yaml\`
3. Update metadata.json accordingly
4. Push your changes"
      ;;
    missing_files)
      FIX_STEPS="1. Create missing files in the \`lib/\` directory:
   - \`lib/PROMPT.md\` - The task prompt
   - \`lib/MODEL_RESPONSE.md\` - AI model's response
   - \`lib/IDEAL_RESPONSE.md\` - Expected correct response
   - \`lib/MODEL_FAILURES.md\` - Analysis of model errors
2. Push your changes"
      ;;
    *)
      FIX_STEPS="1. Read Claude's full review comment above
2. Address all issues marked with ❌
3. Push your fixes"
      ;;
  esac
  
  FAILURE_COMMENT="## ❌ Claude Review Failed

**What happened:** Claude's review found issues that need to be fixed before this PR can proceed.

**Issue found:**
> $ISSUE_QUOTE

---

### How to Fix

$FIX_STEPS

---

📖 **Need more details?** Read Claude's full review comment above for specific information.

🔗 **CI Run:** [${GITHUB_RUN_ID}](${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID})"
  
  gh pr comment "$PR_NUMBER" --body "$FAILURE_COMMENT" || echo "⚠️ Failed to post failure comment"
  
  echo "critical_issues_found=true" >> "$GITHUB_OUTPUT"
  exit 1
else
  echo "✅ No critical issues found in Claude's review"
  echo "critical_issues_found=false" >> "$GITHUB_OUTPUT"
fi


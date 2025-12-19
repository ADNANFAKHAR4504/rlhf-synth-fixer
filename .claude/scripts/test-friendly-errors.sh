#!/bin/bash
# Test script to demonstrate the improved user-friendly error messages
# Shows how different failure scenarios will look to users

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Helper function to build clear error message (same as in CI)
build_error_output() {
  local quote="$1"
  local what_happened="$2"
  local why_matters="$3"
  local how_to_fix="$4"
  
  echo ""
  echo "════════════════════════════════════════════════════════════════"
  echo -e "${RED}❌ CLAUDE REVIEW FAILED${NC}"
  echo "════════════════════════════════════════════════════════════════"
  echo ""
  echo -e "${CYAN}WHAT HAPPENED:${NC}"
  echo "  $what_happened"
  echo ""
  echo -e "${CYAN}FROM CLAUDE'S REVIEW:${NC}"
  echo "  \"$quote\""
  echo ""
  echo -e "${CYAN}WHY THIS MATTERS:${NC}"
  echo "  $why_matters"
  echo ""
  echo -e "${CYAN}HOW TO FIX:${NC}"
  echo -e "$how_to_fix"
  echo ""
  echo "════════════════════════════════════════════════════════════════"
}

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║        USER-FRIENDLY ERROR MESSAGES - DEMONSTRATION                           ║"
echo "║                                                                               ║"
echo "║  These examples show what users will see when different issues occur          ║"
echo "╚═══════════════════════════════════════════════════════════════════════════════╝"

# ============================================================================
# EXAMPLE 1: Metadata Validation Failed
# ============================================================================
echo ""
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}EXAMPLE 1: Metadata Validation Failed${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

build_error_output \
  "❌ Metadata validation FAILED with 2 error(s): Missing field 'subtask', Invalid platform 'terraform'" \
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

echo ""
echo -e "${YELLOW}PR COMMENT THAT WILL BE POSTED:${NC}"
echo "────────────────────────────────────────────────────────────────"
cat << 'EOF'
## ❌ Claude Review Failed

**What happened:** Claude's review found issues that need to be fixed before this PR can proceed.

**Issue found:**
> ❌ Metadata validation FAILED with 2 error(s): Missing field 'subtask', Invalid platform 'terraform'

---

### How to Fix

1. Open `metadata.json` in your project root
2. Run the validation script: `bash .claude/scripts/validate-metadata.sh metadata.json`
3. Fix the errors shown by the script
4. Common fixes:
   - Ensure `platform` is one of: cdk, cdktf, cfn, tf, pulumi, cicd, analysis
   - Ensure `language` matches your platform
   - Ensure `subject_labels` is an array: `["Label Name"]`
5. Push your changes

---

📖 **Need more details?** Read Claude's full review comment above for specific information.
EOF
echo "────────────────────────────────────────────────────────────────"

# ============================================================================
# EXAMPLE 2: Security Issue - Credentials in Code
# ============================================================================
echo ""
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}EXAMPLE 2: Security Issue - Credentials Found in Code${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

build_error_output \
  "❌ hardcoded secrets detected in lib/stack.ts - Found AWS access key AKIAIOSFODNN7EXAMPLE on line 45" \
  "Claude found passwords, API keys, or AWS credentials written directly in your code." \
  "Credentials in code are a security risk. They can be exposed if code is shared or pushed to a repository." \
  "  1. Find the file mentioned in Claude's review above
  2. Remove the hardcoded credentials
  3. Replace with environment variables:
     BEFORE: const apiKey = \"sk-abc123...\"
     AFTER:  const apiKey = process.env.API_KEY
  4. Or use AWS Secrets Manager for sensitive values
  5. Push your changes"

echo ""
echo -e "${YELLOW}PR COMMENT THAT WILL BE POSTED:${NC}"
echo "────────────────────────────────────────────────────────────────"
cat << 'EOF'
## ❌ Claude Review Failed

**What happened:** Claude's review found issues that need to be fixed before this PR can proceed.

**Issue found:**
> ❌ hardcoded secrets detected in lib/stack.ts - Found AWS access key AKIAIOSFODNN7EXAMPLE on line 45

---

### How to Fix

1. Find the file mentioned in Claude's review
2. Remove hardcoded credentials (passwords, API keys, AWS keys)
3. Replace with environment variables:
   ```
   // Before
   const apiKey = "sk-abc123...";
   
   // After  
   const apiKey = process.env.API_KEY;
   ```
4. Or use AWS Secrets Manager for sensitive values
5. Push your changes

---

📖 **Need more details?** Read Claude's full review comment above for specific information.
EOF
echo "────────────────────────────────────────────────────────────────"

# ============================================================================
# EXAMPLE 3: AI-Generated Content in PROMPT
# ============================================================================
echo ""
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}EXAMPLE 3: AI-Generated Content Detected${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

build_error_output \
  "❌ Emojis found in PROMPT.md files - detected 🚀, 💡, ✨ on lines 5, 12, 18" \
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

echo ""
echo -e "${YELLOW}PR COMMENT THAT WILL BE POSTED:${NC}"
echo "────────────────────────────────────────────────────────────────"
cat << 'EOF'
## ❌ Claude Review Failed

**What happened:** Claude's review found issues that need to be fixed before this PR can proceed.

**Issue found:**
> ❌ Emojis found in PROMPT.md files - detected 🚀, 💡, ✨ on lines 5, 12, 18

---

### How to Fix

1. Open `lib/PROMPT.md`
2. Remove ALL emojis (🚀, 💡, ✨, 📝, ✅, ❌, etc.)
3. Remove AI-style writing patterns
4. Rewrite in natural, human language
5. Push your changes

---

📖 **Need more details?** Read Claude's full review comment above for specific information.
EOF
echo "────────────────────────────────────────────────────────────────"

# ============================================================================
# EXAMPLE 4: Missing Required Files
# ============================================================================
echo ""
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}EXAMPLE 4: Missing Required Files${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

build_error_output \
  "❌ lib/IDEAL_RESPONSE.md not found - this file is required for all submissions" \
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

echo ""
echo -e "${YELLOW}PR COMMENT THAT WILL BE POSTED:${NC}"
echo "────────────────────────────────────────────────────────────────"
cat << 'EOF'
## ❌ Claude Review Failed

**What happened:** Claude's review found issues that need to be fixed before this PR can proceed.

**Issue found:**
> ❌ lib/IDEAL_RESPONSE.md not found - this file is required for all submissions

---

### How to Fix

1. Create missing files in the `lib/` directory:
   - `lib/PROMPT.md` - The task prompt
   - `lib/MODEL_RESPONSE.md` - AI model's response
   - `lib/IDEAL_RESPONSE.md` - Expected correct response
   - `lib/MODEL_FAILURES.md` - Analysis of model errors
2. Push your changes

---

📖 **Need more details?** Read Claude's full review comment above for specific information.
EOF
echo "────────────────────────────────────────────────────────────────"

# ============================================================================
# EXAMPLE 5: Score Zero
# ============================================================================
echo ""
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}EXAMPLE 5: Score 0/10 - Critical Issues${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

build_error_output \
  "SCORE:0 - Implementation has fundamental issues: no error handling, missing tests, incorrect AWS configuration" \
  "Claude gave your PR a score of 0, indicating critical issues." \
  "A score of 0 means the PR has fundamental problems that must be fixed." \
  "  1. Read Claude's FULL review comment above carefully
  2. Look for sections marked with ❌ or 'Issues'
  3. Fix ALL identified problems
  4. Push your changes for a new review"

echo ""
echo -e "${YELLOW}PR COMMENT THAT WILL BE POSTED:${NC}"
echo "────────────────────────────────────────────────────────────────"
cat << 'EOF'
## ❌ Claude Review Failed

**What happened:** Claude's review found issues that need to be fixed before this PR can proceed.

**Issue found:**
> SCORE:0 - Implementation has fundamental issues: no error handling, missing tests, incorrect AWS configuration

---

### How to Fix

1. Read Claude's full review comment above
2. Address all issues marked with ❌
3. Push your fixes

---

📖 **Need more details?** Read Claude's full review comment above for specific information.
EOF
echo "────────────────────────────────────────────────────────────────"

# ============================================================================
# EXAMPLE 6: PASSING CASE (No Error)
# ============================================================================
echo ""
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}EXAMPLE 6: PASSING CASE - What Success Looks Like${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo ""
echo "📝 Claude's review comment mentions:"
echo "  - \"No hardcoded secrets detected\""
echo "  - \"No emojis found in prompt files\""
echo "  - \"Metadata validation PASSED\""
echo "  - \"SCORE:9\""
echo ""
echo -e "${GREEN}✅ No critical issues found in Claude's review${NC}"
echo ""
echo -e "${GREEN}The job passes successfully - no PR comment is posted for successful reviews.${NC}"

echo ""
echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║                         DEMONSTRATION COMPLETE                                ║"
echo "║                                                                               ║"
echo "║  These are the new user-friendly error messages that will appear             ║"
echo "║  when Claude review fails. Each message clearly explains:                    ║"
echo "║    • WHAT happened                                                           ║"
echo "║    • WHY it matters                                                          ║"
echo "║    • HOW to fix it step-by-step                                             ║"
echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
echo ""


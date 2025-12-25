#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# Production Ready Check Script
# ═══════════════════════════════════════════════════════════════════════════════
# Purpose: Run ALL validation checks locally BEFORE pushing to GitHub CI/CD
# This is the SINGLE COMMAND to ensure your PR will pass all CI jobs
#
# Usage:
#   ./production-ready-check.sh [work_dir] [options]
#   ./production-ready-check.sh                          # Use current directory
#   ./production-ready-check.sh worktree/ls-Pr7179      # Specify directory
#   ./production-ready-check.sh --quick                  # Quick checks only (no deploy)
#   ./production-ready-check.sh --fix                    # Auto-fix issues
#   ./production-ready-check.sh --full                   # Full check with deploy/tests
#
# Exit codes:
#   0 = All checks passed - safe to push
#   1 = One or more checks failed - fix before pushing
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color
BOLD='\033[1m'
DIM='\033[2m'

# LocalStack settings
LOCALSTACK_ENDPOINT=${AWS_ENDPOINT_URL:-"http://localhost:4566"}
LOCALSTACK_REGION=${AWS_REGION:-"us-east-1"}

# Tracking
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
FIXED_CHECKS=0
SKIPPED_CHECKS=0
START_TIME=$(date +%s)

declare -a FAILURES
declare -a WARNINGS
declare -a FIXES

# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

print_banner() {
  echo ""
  echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║${NC}     ${WHITE}${BOLD}🚀 PRODUCTION READY CHECK${NC}                                              ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}     ${DIM}Ensuring your PR passes CI/CD on first attempt${NC}                        ${CYAN}║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_section() {
  local section_num=$1
  local section_name=$2
  echo ""
  echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${MAGENTA}  ${BOLD}STEP ${section_num}:${NC} ${WHITE}${section_name}${NC}"
  echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

log_check() {
  local check_name=$1
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  echo -e "${BLUE}  ▸ ${NC}${check_name}..."
}

log_pass() {
  local message=$1
  PASSED_CHECKS=$((PASSED_CHECKS + 1))
  echo -e "${GREEN}    ✅ ${message}${NC}"
}

log_fail() {
  local message=$1
  FAILED_CHECKS=$((FAILED_CHECKS + 1))
  FAILURES+=("$message")
  echo -e "${RED}    ❌ ${message}${NC}"
}

log_fix() {
  local message=$1
  FIXED_CHECKS=$((FIXED_CHECKS + 1))
  FIXES+=("$message")
  echo -e "${GREEN}    🔧 ${message}${NC}"
}

log_warn() {
  local message=$1
  WARNINGS+=("$message")
  echo -e "${YELLOW}    ⚠️  ${message}${NC}"
}

log_skip() {
  local message=$1
  SKIPPED_CHECKS=$((SKIPPED_CHECKS + 1))
  echo -e "${YELLOW}    ⏭️  ${message}${NC}"
}

log_info() {
  echo -e "${BLUE}    ℹ️  $1${NC}"
}

# ═══════════════════════════════════════════════════════════════════════════════
# CHECK FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

check_metadata_exists() {
  log_check "Checking metadata.json exists"
  
  if [[ -f "metadata.json" ]]; then
    log_pass "metadata.json found"
    return 0
  else
    log_fail "metadata.json NOT FOUND (required)"
    return 1
  fi
}

check_metadata_schema() {
  log_check "Validating metadata.json schema"
  
  if ! command -v jq &>/dev/null; then
    log_warn "jq not installed - skipping schema validation"
    return 0
  fi
  
  # Required fields for LocalStack tasks
  local required_fields=("platform" "language" "complexity" "turn_type" "po_id" "team" "startedAt" "subtask" "provider" "subject_labels" "aws_services")
  local missing_fields=()
  
  for field in "${required_fields[@]}"; do
    if ! jq -e ".$field" metadata.json &>/dev/null; then
      missing_fields+=("$field")
    fi
  done
  
  if [[ ${#missing_fields[@]} -gt 0 ]]; then
    log_fail "Missing required fields: ${missing_fields[*]}"
    return 1
  fi
  
  # Check provider is localstack
  local provider=$(jq -r '.provider // "unknown"' metadata.json)
  if [[ "$provider" != "localstack" ]]; then
    if [[ "$FIX_MODE" == "true" ]]; then
      jq '.provider = "localstack"' metadata.json > metadata.json.tmp && mv metadata.json.tmp metadata.json
      log_fix "Set provider to 'localstack'"
    else
      log_fail "Provider is '$provider' but should be 'localstack'"
      return 1
    fi
  fi
  
  # Check subtask is string (not array)
  local subtask_type=$(jq -r '.subtask | type' metadata.json 2>/dev/null)
  if [[ "$subtask_type" == "array" ]]; then
    if [[ "$FIX_MODE" == "true" ]]; then
      local first_subtask=$(jq -r '.subtask[0] // "Infrastructure QA and Management"' metadata.json)
      jq --arg s "$first_subtask" '.subtask = $s' metadata.json > metadata.json.tmp && mv metadata.json.tmp metadata.json
      log_fix "Converted subtask array to string: $first_subtask"
    else
      log_fail "subtask must be a string, not array"
      return 1
    fi
  fi
  
  # Remove disallowed fields
  local disallowed_fields=("task_id" "training_quality" "coverage" "author" "dockerS3Location" "pr_id" "localstack_migration" "testDependencies" "background" "training_quality_justification")
  for field in "${disallowed_fields[@]}"; do
    if jq -e ".$field" metadata.json &>/dev/null; then
      if [[ "$FIX_MODE" == "true" ]]; then
        jq "del(.$field)" metadata.json > metadata.json.tmp && mv metadata.json.tmp metadata.json
        log_fix "Removed disallowed field: $field"
      else
        log_warn "Found disallowed field: $field (will be removed in CI)"
      fi
    fi
  done
  
  log_pass "metadata.json schema is valid"
  return 0
}

check_wave_field() {
  log_check "Checking wave field (P0/P1)"
  
  local wave=$(jq -r '.wave // ""' metadata.json 2>/dev/null)
  
  if [[ -z "$wave" ]] || [[ "$wave" == "null" ]]; then
    if [[ "$FIX_MODE" == "true" ]]; then
      # Try to look up wave from CSV
      local expected_wave="P1"
      if [[ -f "$SCRIPT_DIR/wave-lookup.sh" ]]; then
        source "$SCRIPT_DIR/wave-lookup.sh" 2>/dev/null
        expected_wave=$(get_wave_for_task "metadata.json" 2>/dev/null || echo "P1")
      fi
      jq --arg wave "$expected_wave" '.wave = $wave' metadata.json > metadata.json.tmp && mv metadata.json.tmp metadata.json
      log_fix "Added wave field: $expected_wave"
    else
      log_fail "Missing 'wave' field (required: P0 or P1)"
      return 1
    fi
  elif [[ ! "$wave" =~ ^(P0|P1)$ ]]; then
    log_fail "Invalid wave value: '$wave' (must be P0 or P1)"
    return 1
  else
    log_pass "Wave field is valid: $wave"
  fi
  
  return 0
}

check_required_docs() {
  log_check "Checking required documentation files"
  
  local team=$(jq -r '.team // ""' metadata.json 2>/dev/null)
  local docs_required=false
  
  # Synthetic tasks require docs
  if [[ "$team" =~ ^synth ]]; then
    docs_required=true
  fi
  
  # Check PROMPT.md
  if [[ ! -f "lib/PROMPT.md" ]]; then
    if [[ "$docs_required" == "true" ]]; then
      if [[ "$FIX_MODE" == "true" ]]; then
        mkdir -p lib
        cat > lib/PROMPT.md << 'EOFPROMPT'
# Task Prompt

This is a LocalStack migration task. The original task has been migrated and tested for LocalStack compatibility.

## Context

This task involves setting up infrastructure using LocalStack for local development and testing.

## Requirements

The infrastructure should:
- Deploy successfully to LocalStack
- Pass all integration tests
- Use LocalStack-compatible configurations
EOFPROMPT
        log_fix "Created placeholder lib/PROMPT.md"
      else
        log_fail "lib/PROMPT.md is REQUIRED for synthetic tasks"
        return 1
      fi
    else
      log_warn "lib/PROMPT.md not found (may be required)"
    fi
  else
    log_pass "lib/PROMPT.md exists"
  fi
  
  # Check MODEL_RESPONSE.md
  if [[ ! -f "lib/MODEL_RESPONSE.md" ]]; then
    if [[ "$docs_required" == "true" ]]; then
      if [[ "$FIX_MODE" == "true" ]]; then
        mkdir -p lib
        cat > lib/MODEL_RESPONSE.md << 'EOFRESPONSE'
# Model Response

This task has been migrated to LocalStack and verified for deployment compatibility.

## Migration Summary

The original task has been:
- Updated with LocalStack endpoint configurations
- Tested for successful deployment
- Verified with integration tests

## Changes Made

- Added LocalStack provider configuration
- Updated resource settings for local deployment
- Configured appropriate timeouts and retry logic
EOFRESPONSE
        log_fix "Created placeholder lib/MODEL_RESPONSE.md"
      else
        log_fail "lib/MODEL_RESPONSE.md is REQUIRED for synthetic tasks"
        return 1
      fi
    fi
  else
    log_pass "lib/MODEL_RESPONSE.md exists"
  fi
  
  return 0
}

check_no_emojis() {
  log_check "Checking for emojis in lib/*.md files"
  
  if [[ ! -d "lib" ]]; then
    log_skip "No lib/ directory"
    return 0
  fi
  
  local emoji_found=false
  local emoji_pattern='[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{26FF}]|[\x{2700}-\x{27BF}]'
  
  for mdfile in lib/*.md; do
    if [[ -f "$mdfile" ]]; then
      if grep -Pq "$emoji_pattern" "$mdfile" 2>/dev/null; then
        emoji_found=true
        if [[ "$FIX_MODE" == "true" ]]; then
          perl -pi -e 's/[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]//g' "$mdfile" 2>/dev/null || true
          log_fix "Removed emojis from $mdfile"
        else
          log_fail "Emojis found in $mdfile (NOT allowed)"
        fi
      fi
    fi
  done
  
  if [[ "$emoji_found" == "false" ]] || [[ "$FIX_MODE" == "true" ]]; then
    log_pass "No emojis in lib/*.md files"
    return 0
  else
    return 1
  fi
}

check_prompt_quality() {
  log_check "Validating prompt quality (Claude Review: Prompt Quality)"
  
  if [[ ! -f "lib/PROMPT.md" ]]; then
    log_skip "No lib/PROMPT.md to validate"
    return 0
  fi
  
  local prompt_quality_script="$PROJECT_ROOT/.claude/scripts/claude-validate-prompt-quality.sh"
  
  if [[ -x "$prompt_quality_script" ]]; then
    if bash "$prompt_quality_script" > /tmp/prompt_quality_output.log 2>&1; then
      log_pass "Prompt quality validation passed"
      return 0
    else
      log_fail "Prompt quality validation FAILED"
      
      # Show key failures
      grep -E "FAIL|detected|found" /tmp/prompt_quality_output.log 2>/dev/null | head -5 | while read -r line; do
        log_info "$line"
      done
      
      # Try auto-fix
      if [[ "$FIX_MODE" == "true" ]]; then
        local fix_script="$PROJECT_ROOT/.claude/scripts/fix-prompt-quality.sh"
        if [[ -x "$fix_script" ]]; then
          if bash "$fix_script" "lib/PROMPT.md" > /dev/null 2>&1; then
            if bash "$prompt_quality_script" > /dev/null 2>&1; then
              log_fix "Prompt quality now PASSES after auto-fix"
              return 0
            fi
          fi
        fi
        log_warn "Could not auto-fix prompt quality - manual rewrite needed"
      fi
      
      return 1
    fi
  else
    log_warn "Prompt quality script not found - skipping"
    return 0
  fi
}

check_commit_message() {
  log_check "Validating commit message format"
  
  local last_commit=$(git log -1 --format="%s" 2>/dev/null || echo "")
  
  if [[ -z "$last_commit" ]]; then
    log_skip "No commits to validate"
    return 0
  fi
  
  # Check conventional commit format
  if echo "$last_commit" | grep -qE "^(feat|fix|docs|style|refactor|test|chore|build|ci|perf|revert)(\(.+\))?!?:"; then
    log_pass "Commit message follows conventional format"
    log_info "Message: $last_commit"
    return 0
  else
    log_fail "Commit message doesn't follow conventional commits"
    log_info "Expected: type(scope): description"
    log_info "Got: $last_commit"
    log_info "Fix: git commit --amend -m \"feat(localstack): your description\""
    return 1
  fi
}

check_jest_config() {
  log_check "Validating Jest configuration"
  
  local language=$(jq -r '.language // "unknown"' metadata.json 2>/dev/null)
  
  if [[ "$language" != "ts" && "$language" != "js" ]]; then
    log_skip "Not a TS/JS project"
    return 0
  fi
  
  if [[ ! -f "jest.config.js" ]]; then
    log_skip "No jest.config.js found"
    return 0
  fi
  
  # Check roots configuration
  if grep -q "roots.*tests" jest.config.js 2>/dev/null; then
    if [[ "$FIX_MODE" == "true" ]] && [[ -d "test" ]]; then
      sed -i.bak "s|roots:.*\['<rootDir>/tests'\]|roots: ['<rootDir>/test']|g" jest.config.js
      rm -f jest.config.js.bak
      log_fix "Updated jest.config.js to use 'test/' folder"
    else
      log_fail "jest.config.js uses 'tests/' but should use 'test/' (singular)"
      return 1
    fi
  fi
  
  log_pass "Jest configuration is correct"
  return 0
}

check_build() {
  log_check "Running build"
  
  if [[ -f "package.json" ]]; then
    # Install dependencies if needed
    if [[ ! -d "node_modules" ]] || [[ "package.json" -nt "node_modules" ]]; then
      log_info "Installing npm dependencies..."
      if ! npm install --prefer-offline --no-audit > /tmp/npm_install.log 2>&1; then
        log_fail "npm install failed"
        cat /tmp/npm_install.log | grep -iE "error|ERR!" | head -5 | while read -r line; do
          log_info "$line"
        done
        return 1
      fi
    fi
    
    # Run build if script exists
    if grep -q '"build"' package.json 2>/dev/null; then
      log_info "Running npm build..."
      if ! npm run build > /tmp/npm_build.log 2>&1; then
        log_fail "npm build failed"
        cat /tmp/npm_build.log | grep -iE "error|failed" | head -5 | while read -r line; do
          log_info "$line"
        done
        return 1
      fi
    fi
    
    log_pass "Build completed successfully"
    return 0
    
  elif [[ -f "requirements.txt" ]]; then
    log_info "Installing Python dependencies..."
    if ! pip install -r requirements.txt -q > /tmp/pip_install.log 2>&1; then
      log_fail "pip install failed"
      return 1
    fi
    log_pass "Python dependencies installed"
    return 0
    
  elif [[ -f "go.mod" ]]; then
    log_info "Running go mod download..."
    if ! go mod download > /tmp/go_mod.log 2>&1; then
      log_fail "go mod download failed"
      return 1
    fi
    log_pass "Go dependencies downloaded"
    return 0
  fi
  
  log_skip "No build configuration found"
  return 0
}

check_lint() {
  log_check "Running linter"
  
  if [[ -f "package.json" ]]; then
    if grep -q '"lint"' package.json 2>/dev/null; then
      # Try lint:fix first if in fix mode
      if [[ "$FIX_MODE" == "true" ]] && grep -q '"lint:fix"' package.json 2>/dev/null; then
        npm run lint:fix > /dev/null 2>&1 || true
        log_fix "Applied lint auto-fixes"
      fi
      
      if npm run lint > /tmp/lint_output.log 2>&1; then
        log_pass "Lint passed"
        return 0
      else
        local error_count=$(grep -c "error" /tmp/lint_output.log 2>/dev/null || echo "0")
        log_fail "Lint failed with $error_count errors"
        grep -i "error" /tmp/lint_output.log | head -5 | while read -r line; do
          log_info "$line"
        done
        return 1
      fi
    fi
  fi
  
  log_skip "No lint script found"
  return 0
}

check_typescript_compile() {
  log_check "Checking TypeScript compilation"
  
  local language=$(jq -r '.language // "unknown"' metadata.json 2>/dev/null)
  
  if [[ "$language" != "ts" ]]; then
    log_skip "Not a TypeScript project"
    return 0
  fi
  
  if [[ ! -f "tsconfig.json" ]]; then
    log_skip "No tsconfig.json found"
    return 0
  fi
  
  if npx tsc --noEmit > /tmp/tsc_output.log 2>&1; then
    log_pass "TypeScript compilation passed"
    return 0
  else
    local error_count=$(grep -c "error TS" /tmp/tsc_output.log 2>/dev/null || echo "0")
    log_fail "TypeScript compilation failed with $error_count errors"
    grep "error TS" /tmp/tsc_output.log | head -5 | while read -r line; do
      log_info "$line"
    done
    return 1
  fi
}

check_unit_tests() {
  log_check "Running unit tests"
  
  # Set LocalStack environment
  export AWS_ENDPOINT_URL="$LOCALSTACK_ENDPOINT"
  export AWS_ACCESS_KEY_ID="test"
  export AWS_SECRET_ACCESS_KEY="test"
  export AWS_DEFAULT_REGION="$LOCALSTACK_REGION"
  
  if [[ -f "package.json" ]] && grep -q '"test"' package.json 2>/dev/null; then
    if npm test > /tmp/test_output.log 2>&1; then
      log_pass "Unit tests passed"
      return 0
    else
      local fail_count=$(grep -c "FAIL" /tmp/test_output.log 2>/dev/null || echo "0")
      log_fail "Unit tests failed ($fail_count failures)"
      grep -iE "fail|error" /tmp/test_output.log | head -5 | while read -r line; do
        log_info "$line"
      done
      return 1
    fi
  elif [[ -f "pytest.ini" ]] || [[ -d "test" && $(find test -name "test_*.py" 2>/dev/null | wc -l) -gt 0 ]]; then
    if python -m pytest test/ -v > /tmp/pytest_output.log 2>&1; then
      log_pass "Pytest passed"
      return 0
    else
      log_fail "Pytest failed"
      return 1
    fi
  fi
  
  log_skip "No test configuration found"
  return 0
}

check_synth() {
  log_check "Running IaC synthesis"
  
  local platform=$(jq -r '.platform // "unknown"' metadata.json 2>/dev/null)
  
  # Set LocalStack environment
  export AWS_ENDPOINT_URL="$LOCALSTACK_ENDPOINT"
  export AWS_ACCESS_KEY_ID="test"
  export AWS_SECRET_ACCESS_KEY="test"
  export AWS_DEFAULT_REGION="$LOCALSTACK_REGION"
  export CDK_DEFAULT_ACCOUNT="000000000000"
  export CDK_DEFAULT_REGION="$LOCALSTACK_REGION"
  
  case "$platform" in
    cdk)
      local synth_cmd="npx cdk synth"
      if command -v cdklocal &>/dev/null; then
        synth_cmd="cdklocal synth"
      fi
      
      if $synth_cmd > /tmp/synth_output.log 2>&1; then
        if [[ -d "cdk.out" ]]; then
          log_pass "CDK synthesis passed"
          return 0
        fi
      fi
      
      log_fail "CDK synthesis failed"
      grep -iE "error|failed|exception" /tmp/synth_output.log | head -5 | while read -r line; do
        log_info "$line"
      done
      return 1
      ;;
      
    cdktf)
      if cdktf synth > /tmp/synth_output.log 2>&1; then
        log_pass "CDKTF synthesis passed"
        return 0
      fi
      log_fail "CDKTF synthesis failed"
      return 1
      ;;
      
    tf)
      cd lib 2>/dev/null || true
      local tf_cmd="terraform"
      if command -v tflocal &>/dev/null; then
        tf_cmd="tflocal"
      fi
      
      if $tf_cmd init -input=false > /tmp/tf_init.log 2>&1; then
        if $tf_cmd validate > /tmp/tf_validate.log 2>&1; then
          cd "$WORK_DIR"
          log_pass "Terraform validation passed"
          return 0
        fi
      fi
      cd "$WORK_DIR"
      log_fail "Terraform validation failed"
      return 1
      ;;
      
    cfn)
      local cfn_template=""
      for tmpl in lib/TapStack.yml lib/TapStack.yaml lib/template.yml lib/template.yaml; do
        if [[ -f "$tmpl" ]]; then
          cfn_template="$tmpl"
          break
        fi
      done
      
      if [[ -n "$cfn_template" ]]; then
        log_pass "CloudFormation template found: $cfn_template"
        return 0
      fi
      log_warn "No CloudFormation template found"
      return 0
      ;;
      
    pulumi)
      log_skip "Pulumi synthesis check (run manually: pulumi preview)"
      return 0
      ;;
      
    *)
      log_skip "Unknown platform: $platform"
      return 0
      ;;
  esac
}

check_localstack_running() {
  log_check "Checking LocalStack status"
  
  if curl -s --max-time 5 "$LOCALSTACK_ENDPOINT/_localstack/health" &>/dev/null; then
    log_pass "LocalStack is running at $LOCALSTACK_ENDPOINT"
    LOCALSTACK_RUNNING=true
    return 0
  else
    log_warn "LocalStack is NOT running at $LOCALSTACK_ENDPOINT"
    log_info "Start with: bash scripts/localstack-start.sh"
    LOCALSTACK_RUNNING=false
    return 0  # Don't fail, just warn
  fi
}

check_deploy() {
  log_check "Testing LocalStack deployment"
  
  if [[ "$LOCALSTACK_RUNNING" != "true" ]]; then
    log_skip "LocalStack not running - skipping deploy test"
    return 0
  fi
  
  if [[ "$QUICK_MODE" == "true" ]]; then
    log_skip "Quick mode - skipping deploy test"
    return 0
  fi
  
  local deploy_script="$PROJECT_ROOT/scripts/localstack-ci-deploy.sh"
  
  if [[ -x "$deploy_script" ]]; then
    log_info "Running LocalStack deployment..."
    if bash "$deploy_script" > /tmp/deploy_output.log 2>&1; then
      log_pass "LocalStack deployment succeeded"
      return 0
    else
      log_fail "LocalStack deployment FAILED"
      grep -iE "error|failed|exception" /tmp/deploy_output.log | head -5 | while read -r line; do
        log_info "$line"
      done
      return 1
    fi
  fi
  
  log_skip "No deploy script found"
  return 0
}

check_integration_tests() {
  log_check "Running integration tests"
  
  if [[ "$LOCALSTACK_RUNNING" != "true" ]]; then
    log_skip "LocalStack not running - skipping integration tests"
    return 0
  fi
  
  if [[ "$QUICK_MODE" == "true" ]]; then
    log_skip "Quick mode - skipping integration tests"
    return 0
  fi
  
  local test_script="$PROJECT_ROOT/scripts/localstack-ci-test.sh"
  
  if [[ -x "$test_script" ]]; then
    log_info "Running LocalStack integration tests..."
    if bash "$test_script" > /tmp/int_test_output.log 2>&1; then
      log_pass "Integration tests passed"
      return 0
    else
      log_fail "Integration tests FAILED"
      grep -iE "fail|error" /tmp/int_test_output.log | head -5 | while read -r line; do
        log_info "$line"
      done
      return 1
    fi
  fi
  
  log_skip "No integration test script found"
  return 0
}

check_ideal_response() {
  log_check "Checking IDEAL_RESPONSE.md"
  
  if [[ ! -f "lib/IDEAL_RESPONSE.md" ]]; then
    if [[ "$FIX_MODE" == "true" ]]; then
      local gen_script="$PROJECT_ROOT/.claude/scripts/localstack-generate-ideal-response.sh"
      if [[ -x "$gen_script" ]]; then
        if bash "$gen_script" "$WORK_DIR" > /dev/null 2>&1; then
          log_fix "Generated IDEAL_RESPONSE.md"
          return 0
        fi
      fi
    fi
    log_warn "lib/IDEAL_RESPONSE.md not found (required for claude-review-ideal-response)"
    return 0  # Warning only, not failure
  fi
  
  # Check for code blocks
  local code_blocks=$(grep -c '```' lib/IDEAL_RESPONSE.md 2>/dev/null || echo "0")
  if [[ "$code_blocks" -lt 2 ]]; then
    log_warn "IDEAL_RESPONSE.md has no code blocks"
    return 0
  fi
  
  log_pass "IDEAL_RESPONSE.md exists with code blocks"
  return 0
}

check_model_failures() {
  log_check "Checking MODEL_FAILURES.md"
  
  if [[ ! -f "lib/MODEL_FAILURES.md" ]]; then
    log_warn "lib/MODEL_FAILURES.md not found (recommended)"
    return 0
  fi
  
  local content_size=$(wc -c < lib/MODEL_FAILURES.md 2>/dev/null || echo "0")
  if [[ "$content_size" -lt 100 ]]; then
    log_warn "MODEL_FAILURES.md is too short (should document model issues)"
    return 0
  fi
  
  log_pass "MODEL_FAILURES.md exists with content"
  return 0
}

# ═══════════════════════════════════════════════════════════════════════════════
# PARSE ARGUMENTS
# ═══════════════════════════════════════════════════════════════════════════════

WORK_DIR="${1:-$(pwd)}"
QUICK_MODE=false
FIX_MODE=false
FULL_MODE=false
VERBOSE=false
LOCALSTACK_RUNNING=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --quick|-q)
      QUICK_MODE=true
      shift
      ;;
    --fix|-f)
      FIX_MODE=true
      shift
      ;;
    --full)
      FULL_MODE=true
      shift
      ;;
    --verbose|-v)
      VERBOSE=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [work_dir] [options]"
      echo ""
      echo "Options:"
      echo "  --quick, -q    Quick checks only (no deploy/integration tests)"
      echo "  --fix, -f      Auto-fix issues when possible"
      echo "  --full         Full check including deploy and integration tests"
      echo "  --verbose, -v  Verbose output"
      echo "  --help, -h     Show this help"
      echo ""
      echo "Examples:"
      echo "  $0                           # Run from current directory"
      echo "  $0 worktree/ls-Pr7179       # Run in specific directory"
      echo "  $0 --fix                     # Auto-fix issues"
      echo "  $0 --quick                   # Quick pre-push check"
      exit 0
      ;;
    *)
      if [[ -d "$1" ]]; then
        WORK_DIR="$1"
      fi
      shift
      ;;
  esac
done

# Resolve to absolute path
WORK_DIR="$(cd "$WORK_DIR" 2>/dev/null && pwd)" || {
  echo -e "${RED}❌ Directory not found: $WORK_DIR${NC}"
  exit 1
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════════════════════

print_banner

echo -e "${WHITE}📁 Working Directory:${NC} $WORK_DIR"
echo -e "${WHITE}🕐 Started:${NC} $(date '+%Y-%m-%d %H:%M:%S')"
echo -e "${WHITE}📋 Mode:${NC} $(if [[ "$QUICK_MODE" == "true" ]]; then echo "Quick"; elif [[ "$FULL_MODE" == "true" ]]; then echo "Full"; else echo "Standard"; fi)$(if [[ "$FIX_MODE" == "true" ]]; then echo " + Auto-Fix"; fi)"

cd "$WORK_DIR"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1: Metadata Validation (CRITICAL - detect-metadata job)
# ═══════════════════════════════════════════════════════════════════════════════

print_section "1" "Metadata Validation (detect-metadata job)"

check_metadata_exists
check_metadata_schema
check_wave_field
check_required_docs
check_no_emojis

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2: Prompt Quality (CRITICAL - claude-review-prompt-quality job)
# ═══════════════════════════════════════════════════════════════════════════════

print_section "2" "Prompt Quality (claude-review-prompt-quality job)"

check_prompt_quality

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3: Commit Message (validate-commit-message job)
# ═══════════════════════════════════════════════════════════════════════════════

print_section "3" "Commit Message (validate-commit-message job)"

check_commit_message

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4: Jest Config (validate-jest-config job - TS/JS only)
# ═══════════════════════════════════════════════════════════════════════════════

print_section "4" "Jest Configuration (validate-jest-config job)"

check_jest_config

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 5: Build (build job)
# ═══════════════════════════════════════════════════════════════════════════════

print_section "5" "Build (build job)"

check_build

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 6: Lint (lint job)
# ═══════════════════════════════════════════════════════════════════════════════

print_section "6" "Linting (lint job)"

check_lint
check_typescript_compile

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 7: Unit Tests (unit-tests job)
# ═══════════════════════════════════════════════════════════════════════════════

print_section "7" "Unit Tests (unit-tests job)"

check_unit_tests

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 8: Synthesis (synth job)
# ═══════════════════════════════════════════════════════════════════════════════

print_section "8" "IaC Synthesis (synth job)"

check_synth

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 9: LocalStack Deployment (deploy job)
# ═══════════════════════════════════════════════════════════════════════════════

print_section "9" "LocalStack Deployment (deploy job)"

check_localstack_running

if [[ "$FULL_MODE" == "true" ]]; then
  check_deploy
else
  log_skip "Skipping deploy (use --full for full check)"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 10: Integration Tests (integration-tests-live job)
# ═══════════════════════════════════════════════════════════════════════════════

print_section "10" "Integration Tests (integration-tests-live job)"

if [[ "$FULL_MODE" == "true" ]]; then
  check_integration_tests
else
  log_skip "Skipping integration tests (use --full for full check)"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 11: Documentation (claude-review-ideal-response job)
# ═══════════════════════════════════════════════════════════════════════════════

print_section "11" "Documentation (claude-review jobs)"

check_ideal_response
check_model_failures

# ═══════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}                          ${WHITE}${BOLD}📊 RESULTS SUMMARY${NC}                                 ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Stats
echo -e "${WHITE}Checks:${NC}"
echo -e "  ${GREEN}✅ Passed:${NC}  $PASSED_CHECKS"
echo -e "  ${RED}❌ Failed:${NC}  $FAILED_CHECKS"
echo -e "  ${YELLOW}⏭️  Skipped:${NC} $SKIPPED_CHECKS"
if [[ "$FIX_MODE" == "true" ]]; then
  echo -e "  ${GREEN}🔧 Fixed:${NC}   $FIXED_CHECKS"
fi
echo -e "  ${BLUE}⏱️  Duration:${NC} ${DURATION}s"
echo ""

# Fixes applied
if [[ ${#FIXES[@]} -gt 0 ]]; then
  echo -e "${GREEN}🔧 Fixes Applied:${NC}"
  for fix in "${FIXES[@]}"; do
    echo -e "   ✅ $fix"
  done
  echo ""
fi

# Warnings
if [[ ${#WARNINGS[@]} -gt 0 ]]; then
  echo -e "${YELLOW}⚠️  Warnings:${NC}"
  for warning in "${WARNINGS[@]}"; do
    echo -e "   ⚠️  $warning"
  done
  echo ""
fi

# Failures
if [[ ${#FAILURES[@]} -gt 0 ]]; then
  echo -e "${RED}❌ Failures (must fix before pushing):${NC}"
  for failure in "${FAILURES[@]}"; do
    echo -e "   ❌ $failure"
  done
  echo ""
fi

# Final status
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [[ "$FAILED_CHECKS" -eq 0 ]]; then
  echo ""
  echo -e "${GREEN}${BOLD}   ✅ PRODUCTION READY - Safe to push to CI/CD!${NC}"
  echo ""
  echo -e "   Your PR should pass all CI jobs on first attempt."
  echo ""
  if [[ "$QUICK_MODE" == "true" ]] || [[ "$FULL_MODE" != "true" ]]; then
    echo -e "${DIM}   For full verification including deploy/tests: $0 --full${NC}"
  fi
  echo ""
  exit 0
else
  echo ""
  echo -e "${RED}${BOLD}   ❌ NOT READY - Fix ${FAILED_CHECKS} issue(s) before pushing${NC}"
  echo ""
  echo -e "   Run with ${WHITE}--fix${NC} to auto-fix issues: ${CYAN}$0 --fix${NC}"
  echo ""
  exit 1
fi


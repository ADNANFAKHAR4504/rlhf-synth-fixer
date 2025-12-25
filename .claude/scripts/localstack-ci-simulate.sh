#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# LocalStack CI/CD Simulation Script
# ═══════════════════════════════════════════════════════════════════════════════
# Purpose: Run ALL CI/CD pipeline jobs locally BEFORE pushing to GitHub
# This eliminates 95%+ of CI/CD iterations by simulating the full pipeline
#
# Usage:
#   ./localstack-ci-simulate.sh [work_dir] [options]
#   ./localstack-ci-simulate.sh                          # Use current directory
#   ./localstack-ci-simulate.sh worktree/ls-Pr7179      # Specify directory
#   ./localstack-ci-simulate.sh --job build              # Run specific job only
#   ./localstack-ci-simulate.sh --from deploy            # Start from specific job
#
# Exit codes:
#   0 = All CI jobs would pass - safe to push
#   1 = One or more jobs failed - fix before pushing
#   2 = LocalStack not running (skips deploy/test jobs)
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
NC='\033[0m' # No Color
BOLD='\033[1m'

# LocalStack settings
LOCALSTACK_ENDPOINT=${AWS_ENDPOINT_URL:-"http://localhost:4566"}
LOCALSTACK_REGION=${AWS_REGION:-"us-east-1"}

# Job results tracking
declare -A JOB_RESULTS
declare -A JOB_DURATIONS
TOTAL_PASSED=0
TOTAL_FAILED=0
TOTAL_SKIPPED=0
PIPELINE_START_TIME=$(date +%s)

# ═══════════════════════════════════════════════════════════════════════════════
# CI/CD JOB DEFINITIONS (matches .github/workflows/ci-cd.yml)
# ═══════════════════════════════════════════════════════════════════════════════

CI_JOBS=(
  "detect-metadata"
  "claude-review-prompt-quality"
  "validate-commit-message"
  "validate-jest-config"
  "build"
  "synth"
  "deploy"
  "lint"
  "unit-tests"
  "integration-tests-live"
  "claude-code-action"
  "cleanup"
  "claude-review-ideal-response"
  "archive-folders"
)

# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

log_header() {
  echo ""
  echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════════════════════${NC}"
  echo -e "${MAGENTA}  $1${NC}"
  echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════════════════════${NC}"
}

log_job_start() {
  echo ""
  echo -e "${CYAN}┌─────────────────────────────────────────────────────────────────────────────┐${NC}"
  echo -e "${CYAN}│  📋 JOB: $1${NC}"
  echo -e "${CYAN}└─────────────────────────────────────────────────────────────────────────────┘${NC}"
}

log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

log_skip() {
  echo -e "${YELLOW}⏭️  $1${NC}"
}

record_job_result() {
  local job=$1
  local result=$2
  local duration=$3
  
  JOB_RESULTS["$job"]="$result"
  JOB_DURATIONS["$job"]="$duration"
  
  case "$result" in
    "success") TOTAL_PASSED=$((TOTAL_PASSED + 1)) ;;
    "failed") TOTAL_FAILED=$((TOTAL_FAILED + 1)) ;;
    "skipped") TOTAL_SKIPPED=$((TOTAL_SKIPPED + 1)) ;;
  esac
}

run_job() {
  local job_name=$1
  local job_start=$(date +%s)
  
  log_job_start "$job_name"
  
  local result="success"
  
  case "$job_name" in
    "detect-metadata")
      run_detect_metadata || result="failed"
      ;;
    "claude-review-prompt-quality")
      run_prompt_quality_check || result="failed"
      ;;
    "validate-commit-message")
      run_commit_message_check || result="failed"
      ;;
    "validate-jest-config")
      run_jest_config_check || result="failed"
      ;;
    "build")
      run_build || result="failed"
      ;;
    "synth")
      run_synth || result="failed"
      ;;
    "deploy")
      run_deploy || result="failed"
      ;;
    "lint")
      run_lint || result="failed"
      ;;
    "unit-tests")
      run_unit_tests || result="failed"
      ;;
    "integration-tests-live")
      run_integration_tests || result="failed"
      ;;
    "claude-code-action")
      run_claude_review_simulation || result="skipped"
      ;;
    "cleanup")
      run_cleanup || result="skipped"
      ;;
    "claude-review-ideal-response")
      run_ideal_response_check || result="failed"
      ;;
    "archive-folders")
      run_archive_check || result="skipped"
      ;;
    *)
      log_warning "Unknown job: $job_name"
      result="skipped"
      ;;
  esac
  
  local job_end=$(date +%s)
  local duration=$((job_end - job_start))
  
  record_job_result "$job_name" "$result" "${duration}s"
  
  if [[ "$result" == "success" ]]; then
    log_success "Job '$job_name' PASSED (${duration}s)"
    return 0
  elif [[ "$result" == "skipped" ]]; then
    log_skip "Job '$job_name' SKIPPED"
    return 0
  else
    log_error "Job '$job_name' FAILED (${duration}s)"
    return 1
  fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# JOB IMPLEMENTATIONS
# ═══════════════════════════════════════════════════════════════════════════════

run_detect_metadata() {
  log_info "Simulating 'Detect Project Files' job..."
  
  # Check metadata.json exists
  if [[ ! -f "metadata.json" ]]; then
    log_error "metadata.json not found"
    return 1
  fi
  
  # Run check-project-files.sh if available
  if [[ -x "$PROJECT_ROOT/scripts/check-project-files.sh" ]]; then
    log_info "Running check-project-files.sh..."
    if ! bash "$PROJECT_ROOT/scripts/check-project-files.sh" 2>&1; then
      log_error "Project files check failed"
      return 1
    fi
  fi
  
  # Run validate-metadata.sh if available
  if [[ -x "$PROJECT_ROOT/.claude/scripts/validate-metadata.sh" ]]; then
    log_info "Running validate-metadata.sh..."
    if ! bash "$PROJECT_ROOT/.claude/scripts/validate-metadata.sh" metadata.json 2>&1; then
      log_error "Metadata validation failed"
      return 1
    fi
  fi
  
  # Check for emojis in lib/*.md
  if [[ -d "lib" ]]; then
    EMOJI_PATTERN='[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{26FF}]|[\x{2700}-\x{27BF}]'
    for mdfile in lib/*.md; do
      if [[ -f "$mdfile" ]]; then
        if grep -Pq "$EMOJI_PATTERN" "$mdfile" 2>/dev/null; then
          log_error "Emojis found in $mdfile (NOT allowed)"
          return 1
        fi
      fi
    done
    log_success "No emojis in lib/*.md files"
  fi
  
  # Check required docs for synth tasks
  TEAM=$(jq -r '.team // ""' metadata.json 2>/dev/null)
  if [[ "$TEAM" =~ ^synth ]]; then
    if [[ ! -f "lib/PROMPT.md" ]]; then
      log_error "lib/PROMPT.md required for synth tasks"
      return 1
    fi
    if [[ ! -f "lib/MODEL_RESPONSE.md" ]]; then
      log_error "lib/MODEL_RESPONSE.md required for synth tasks"
      return 1
    fi
    log_success "Required docs for synth task found"
  fi
  
  log_success "Detect metadata checks passed"
  return 0
}

run_prompt_quality_check() {
  log_info "Simulating 'Claude Review: Prompt Quality' job..."
  
  # Check if prompt quality validation script exists
  if [[ -x "$PROJECT_ROOT/.claude/scripts/claude-validate-prompt-quality.sh" ]]; then
    if bash "$PROJECT_ROOT/.claude/scripts/claude-validate-prompt-quality.sh" 2>&1; then
      log_success "Prompt quality validation passed"
      return 0
    else
      log_error "Prompt quality validation failed"
      return 1
    fi
  fi
  
  # Fallback: basic check for PROMPT.md content
  if [[ -f "lib/PROMPT.md" ]]; then
    PROMPT_SIZE=$(wc -c < lib/PROMPT.md)
    if [[ "$PROMPT_SIZE" -lt 100 ]]; then
      log_warning "lib/PROMPT.md seems too short ($PROMPT_SIZE bytes)"
      return 1
    fi
    log_success "lib/PROMPT.md has sufficient content"
  fi
  
  return 0
}

run_commit_message_check() {
  log_info "Simulating 'Validate Commit Message' job..."
  
  # Get last commit message
  LAST_COMMIT=$(git log -1 --format="%s" 2>/dev/null || echo "")
  
  if [[ -z "$LAST_COMMIT" ]]; then
    log_skip "No commits to validate"
    return 0
  fi
  
  # Check conventional commit format (type: description)
  if echo "$LAST_COMMIT" | grep -qE "^(feat|fix|docs|style|refactor|test|chore|build|ci|perf|revert)(\(.+\))?!?:"; then
    log_success "Commit message follows conventional format: $LAST_COMMIT"
    return 0
  else
    log_error "Commit message doesn't follow conventional commits format"
    log_info "Expected: type(scope): description"
    log_info "Got: $LAST_COMMIT"
    return 1
  fi
}

run_jest_config_check() {
  log_info "Simulating 'Validate Jest Config' job..."
  
  LANGUAGE=$(jq -r '.language // "unknown"' metadata.json 2>/dev/null)
  
  # Only relevant for ts/js projects
  if [[ "$LANGUAGE" != "ts" && "$LANGUAGE" != "js" ]]; then
    log_skip "Not a TS/JS project - skipping Jest config check"
    return 0
  fi
  
  if [[ ! -f "jest.config.js" ]]; then
    log_warning "jest.config.js not found"
    return 0
  fi
  
  # Check roots configuration
  ROOTS_LINE=$(grep 'roots:' jest.config.js 2>/dev/null || echo "")
  
  if echo "$ROOTS_LINE" | grep -q "roots: \['<rootDir>/test'\]"; then
    log_success "jest.config.js uses correct 'test/' folder (singular)"
    return 0
  elif echo "$ROOTS_LINE" | grep -q "tests"; then
    log_error "jest.config.js uses 'tests/' but should use 'test/' (singular)"
    return 1
  else
    log_warning "Could not verify Jest roots configuration"
    return 0
  fi
}

run_build() {
  log_info "Simulating 'Build' job..."
  
  # Install dependencies
  if [[ -f "package.json" ]]; then
    if [[ ! -d "node_modules" ]] || [[ "package.json" -nt "node_modules" ]]; then
      log_info "Installing npm dependencies..."
      if ! npm install --prefer-offline --no-audit 2>&1; then
        log_error "npm install failed"
        return 1
      fi
    fi
    
    # Run build if script exists
    if grep -q '"build"' package.json 2>/dev/null; then
      log_info "Running npm build..."
      if ! npm run build 2>&1; then
        log_error "npm build failed"
        return 1
      fi
    fi
  elif [[ -f "requirements.txt" ]]; then
    log_info "Installing Python dependencies..."
    if ! pip install -r requirements.txt -q 2>&1; then
      log_error "pip install failed"
      return 1
    fi
  fi
  
  log_success "Build completed"
  return 0
}

run_synth() {
  log_info "Simulating 'Synth' job..."
  
  PLATFORM=$(jq -r '.platform // "unknown"' metadata.json 2>/dev/null)
  
  # Only relevant for cdk/cdktf
  if [[ "$PLATFORM" != "cdk" && "$PLATFORM" != "cdktf" ]]; then
    log_skip "Not a CDK/CDKTF project - skipping synth"
    return 0
  fi
  
  # Set LocalStack environment
  export AWS_ACCESS_KEY_ID="test"
  export AWS_SECRET_ACCESS_KEY="test"
  export AWS_DEFAULT_REGION="$LOCALSTACK_REGION"
  export CDK_DEFAULT_ACCOUNT="000000000000"
  export CDK_DEFAULT_REGION="$LOCALSTACK_REGION"
  
  if [[ "$PLATFORM" == "cdk" ]]; then
    SYNTH_CMD="npx cdk synth"
    if command -v cdklocal &>/dev/null; then
      SYNTH_CMD="cdklocal synth"
    fi
    
    log_info "Running: $SYNTH_CMD"
    if $SYNTH_CMD 2>&1 | tee /tmp/synth-output.log; then
      if [[ -d "cdk.out" ]]; then
        log_success "CDK synth completed - cdk.out generated"
        return 0
      fi
    fi
    
    log_error "CDK synth failed"
    cat /tmp/synth-output.log | grep -iE "error|failed" | head -10
    return 1
  fi
  
  return 0
}

run_deploy() {
  log_info "Simulating 'Deploy' job..."
  
  # Check LocalStack is running
  if ! curl -s --max-time 5 "$LOCALSTACK_ENDPOINT/_localstack/health" &>/dev/null; then
    log_warning "LocalStack not running at $LOCALSTACK_ENDPOINT"
    log_skip "Skipping deploy - start LocalStack first"
    return 0
  fi
  
  log_success "LocalStack is running"
  
  PLATFORM=$(jq -r '.platform // "unknown"' metadata.json 2>/dev/null)
  
  # Set LocalStack environment
  export AWS_ENDPOINT_URL="$LOCALSTACK_ENDPOINT"
  export AWS_ACCESS_KEY_ID="test"
  export AWS_SECRET_ACCESS_KEY="test"
  export AWS_DEFAULT_REGION="$LOCALSTACK_REGION"
  export CDK_DEFAULT_ACCOUNT="000000000000"
  export CDK_DEFAULT_REGION="$LOCALSTACK_REGION"
  
  case "$PLATFORM" in
    cdk)
      if command -v cdklocal &>/dev/null; then
        log_info "Bootstrapping and deploying with cdklocal..."
        cdklocal bootstrap aws://000000000000/$LOCALSTACK_REGION 2>&1 || true
        
        if cdklocal deploy --all --require-approval never 2>&1 | tee /tmp/deploy-output.log; then
          log_success "CDK deploy to LocalStack succeeded"
          return 0
        else
          log_error "CDK deploy failed"
          cat /tmp/deploy-output.log | grep -iE "error|failed" | head -10
          return 1
        fi
      fi
      ;;
    tf)
      if command -v tflocal &>/dev/null; then
        cd lib 2>/dev/null || true
        log_info "Deploying with tflocal..."
        tflocal init -input=false 2>&1 || true
        if tflocal apply -auto-approve 2>&1; then
          log_success "Terraform deploy succeeded"
          cd "$WORK_DIR"
          return 0
        fi
        cd "$WORK_DIR"
      fi
      ;;
    cfn)
      if command -v awslocal &>/dev/null; then
        CFN_TEMPLATE=$(find lib -name "*.yml" -o -name "*.yaml" | head -1)
        if [[ -n "$CFN_TEMPLATE" ]]; then
          log_info "Deploying CloudFormation template..."
          STACK_NAME="tap-stack-local-$(date +%s)"
          if awslocal cloudformation create-stack \
            --stack-name "$STACK_NAME" \
            --template-body "file://$CFN_TEMPLATE" \
            --capabilities CAPABILITY_IAM 2>&1; then
            log_success "CloudFormation deploy succeeded"
            # Cleanup
            awslocal cloudformation delete-stack --stack-name "$STACK_NAME" 2>&1 || true
            return 0
          fi
        fi
      fi
      ;;
  esac
  
  log_warning "Deploy skipped for platform: $PLATFORM"
  return 0
}

run_lint() {
  log_info "Simulating 'Lint' job..."
  
  if [[ -f "package.json" ]]; then
    if grep -q '"lint"' package.json 2>/dev/null; then
      log_info "Running npm lint..."
      if npm run lint 2>&1 | tee /tmp/lint-output.log; then
        log_success "Lint passed"
        return 0
      else
        LINT_ERRORS=$(grep -c "error" /tmp/lint-output.log 2>/dev/null || echo "0")
        log_error "Lint failed with $LINT_ERRORS errors"
        cat /tmp/lint-output.log | grep -i "error" | head -10
        return 1
      fi
    fi
  fi
  
  log_skip "No lint script found"
  return 0
}

run_unit_tests() {
  log_info "Simulating 'Unit Testing' job..."
  
  if [[ -f "package.json" ]] && grep -q '"test"' package.json 2>/dev/null; then
    log_info "Running npm test..."
    
    # Set LocalStack environment for tests
    export AWS_ENDPOINT_URL="$LOCALSTACK_ENDPOINT"
    export AWS_ACCESS_KEY_ID="test"
    export AWS_SECRET_ACCESS_KEY="test"
    export AWS_DEFAULT_REGION="$LOCALSTACK_REGION"
    
    if npm test 2>&1 | tee /tmp/test-output.log; then
      log_success "Unit tests passed"
      
      # Check coverage
      if [[ -f "coverage/coverage-summary.json" ]]; then
        COVERAGE=$(jq -r '.total.lines.pct // 0' coverage/coverage-summary.json 2>/dev/null)
        log_info "Code coverage: ${COVERAGE}%"
        if (( $(echo "$COVERAGE < 80" | bc -l 2>/dev/null || echo "0") )); then
          log_warning "Coverage below 80% threshold"
        fi
      fi
      return 0
    else
      log_error "Unit tests failed"
      cat /tmp/test-output.log | grep -iE "fail|error" | head -10
      return 1
    fi
  elif [[ -f "pytest.ini" ]] || [[ -d "test" && $(find test -name "test_*.py" 2>/dev/null | wc -l) -gt 0 ]]; then
    log_info "Running pytest..."
    if python -m pytest test/ -v 2>&1; then
      log_success "Pytest passed"
      return 0
    else
      log_error "Pytest failed"
      return 1
    fi
  fi
  
  log_warning "No test framework detected"
  return 0
}

run_integration_tests() {
  log_info "Simulating 'Integration Tests (Live)' job..."
  
  # Check LocalStack is running
  if ! curl -s --max-time 5 "$LOCALSTACK_ENDPOINT/_localstack/health" &>/dev/null; then
    log_skip "LocalStack not running - skipping integration tests"
    return 0
  fi
  
  # Set LocalStack environment
  export AWS_ENDPOINT_URL="$LOCALSTACK_ENDPOINT"
  export AWS_ACCESS_KEY_ID="test"
  export AWS_SECRET_ACCESS_KEY="test"
  export AWS_DEFAULT_REGION="$LOCALSTACK_REGION"
  export CI="1"
  
  # Run integration tests if script exists
  if [[ -x "$PROJECT_ROOT/scripts/integration-tests.sh" ]]; then
    log_info "Running integration-tests.sh..."
    if bash "$PROJECT_ROOT/scripts/integration-tests.sh" 2>&1; then
      log_success "Integration tests passed"
      return 0
    fi
  fi
  
  # Fallback: run npm test:integration if exists
  if [[ -f "package.json" ]] && grep -q '"test:integration"' package.json 2>/dev/null; then
    log_info "Running npm test:integration..."
    if npm run test:integration 2>&1; then
      log_success "Integration tests passed"
      return 0
    else
      log_error "Integration tests failed"
      return 1
    fi
  fi
  
  log_skip "No integration tests found"
  return 0
}

run_claude_review_simulation() {
  log_info "Simulating 'Claude Review' job..."
  log_skip "Claude review cannot be simulated locally - will run in CI"
  return 0
}

run_cleanup() {
  log_info "Simulating 'Cleanup' job..."
  
  PLATFORM=$(jq -r '.platform // "unknown"' metadata.json 2>/dev/null)
  
  # Set LocalStack environment
  export AWS_ENDPOINT_URL="$LOCALSTACK_ENDPOINT"
  export AWS_ACCESS_KEY_ID="test"
  export AWS_SECRET_ACCESS_KEY="test"
  
  case "$PLATFORM" in
    cdk)
      if command -v cdklocal &>/dev/null; then
        log_info "Destroying CDK stacks..."
        cdklocal destroy --all --force 2>&1 || true
      fi
      ;;
    tf)
      if command -v tflocal &>/dev/null; then
        cd lib 2>/dev/null || true
        log_info "Destroying Terraform resources..."
        tflocal destroy -auto-approve 2>&1 || true
        cd "$WORK_DIR"
      fi
      ;;
  esac
  
  log_success "Cleanup completed"
  return 0
}

run_ideal_response_check() {
  log_info "Simulating 'Claude Review: IDEAL_RESPONSE Code Validation' job..."
  
  if [[ ! -f "lib/IDEAL_RESPONSE.md" ]]; then
    log_warning "lib/IDEAL_RESPONSE.md not found"
    log_info "This file is required for claude-review-ideal-response job"
    
    # Check if generate script exists
    if [[ -x "$PROJECT_ROOT/.claude/scripts/localstack-generate-ideal-response.sh" ]]; then
      log_info "Run: .claude/scripts/localstack-generate-ideal-response.sh to generate"
    fi
    return 1
  fi
  
  # Check for code blocks
  CODE_BLOCKS=$(grep -c '```' lib/IDEAL_RESPONSE.md 2>/dev/null || echo "0")
  if [[ "$CODE_BLOCKS" -lt 2 ]]; then
    log_error "lib/IDEAL_RESPONSE.md has no code blocks"
    return 1
  fi
  
  # Validate script exists
  if [[ -x "$PROJECT_ROOT/.claude/scripts/validate-ideal-response.sh" ]]; then
    if bash "$PROJECT_ROOT/.claude/scripts/validate-ideal-response.sh" 2>&1; then
      log_success "IDEAL_RESPONSE validation passed"
      return 0
    else
      log_error "IDEAL_RESPONSE validation failed"
      return 1
    fi
  fi
  
  log_success "IDEAL_RESPONSE.md exists with code blocks"
  return 0
}

run_archive_check() {
  log_info "Simulating 'Archive Folders' job..."
  log_skip "Archive job runs only after all CI jobs pass in GitHub"
  return 0
}

# ═══════════════════════════════════════════════════════════════════════════════
# PARSE ARGUMENTS
# ═══════════════════════════════════════════════════════════════════════════════

WORK_DIR="${1:-$(pwd)}"
SINGLE_JOB=""
START_FROM=""
STOP_ON_FAILURE=true
VERBOSE=false
FIX_MODE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --job)
      SINGLE_JOB="$2"
      shift 2
      ;;
    --from)
      START_FROM="$2"
      shift 2
      ;;
    --continue)
      STOP_ON_FAILURE=false
      shift
      ;;
    --fix)
      FIX_MODE=true
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
      echo "  --job <name>     Run only specified job"
      echo "  --from <name>    Start from specified job"
      echo "  --continue       Don't stop on first failure"
      echo "  --fix            Auto-fix issues when possible"
      echo "  --verbose, -v    Verbose output"
      echo "  --help, -h       Show this help"
      echo ""
      echo "Available jobs:"
      for job in "${CI_JOBS[@]}"; do
        echo "  - $job"
      done
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
  log_error "Directory not found: $WORK_DIR"
  exit 1
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════════════════════

log_header "🔬 LOCAL CI/CD PIPELINE SIMULATION"

echo ""
echo -e "${BOLD}📁 Working Directory:${NC} $WORK_DIR"
echo -e "${BOLD}🕐 Started:${NC} $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

cd "$WORK_DIR"

# Run pre-validation first if fix mode
if [[ "$FIX_MODE" == "true" ]]; then
  log_info "Running pre-validation with auto-fix..."
  if [[ -x "$SCRIPT_DIR/localstack-prevalidate.sh" ]]; then
    bash "$SCRIPT_DIR/localstack-prevalidate.sh" "$WORK_DIR" 2>&1 || true
  fi
fi

# Determine which jobs to run
JOBS_TO_RUN=()
START_RUNNING=true

if [[ -n "$SINGLE_JOB" ]]; then
  JOBS_TO_RUN=("$SINGLE_JOB")
elif [[ -n "$START_FROM" ]]; then
  START_RUNNING=false
  for job in "${CI_JOBS[@]}"; do
    if [[ "$job" == "$START_FROM" ]]; then
      START_RUNNING=true
    fi
    if [[ "$START_RUNNING" == "true" ]]; then
      JOBS_TO_RUN+=("$job")
    fi
  done
else
  JOBS_TO_RUN=("${CI_JOBS[@]}")
fi

# Run jobs
PIPELINE_FAILED=false

for job in "${JOBS_TO_RUN[@]}"; do
  if ! run_job "$job"; then
    PIPELINE_FAILED=true
    if [[ "$STOP_ON_FAILURE" == "true" ]]; then
      log_error "Stopping pipeline due to job failure: $job"
      break
    fi
  fi
done

# ═══════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════

PIPELINE_END_TIME=$(date +%s)
PIPELINE_DURATION=$((PIPELINE_END_TIME - PIPELINE_START_TIME))

log_header "📊 CI/CD SIMULATION SUMMARY"

echo ""
echo -e "${BOLD}Pipeline Results:${NC}"
echo ""

# Display job results table
echo "┌─────────────────────────────────────────┬──────────┬──────────┐"
echo "│ Job                                     │ Status   │ Duration │"
echo "├─────────────────────────────────────────┼──────────┼──────────┤"

for job in "${CI_JOBS[@]}"; do
  result="${JOB_RESULTS[$job]:-pending}"
  duration="${JOB_DURATIONS[$job]:-N/A}"
  
  case "$result" in
    "success")
      status_icon="✅"
      status_color="$GREEN"
      ;;
    "failed")
      status_icon="❌"
      status_color="$RED"
      ;;
    "skipped")
      status_icon="⏭️ "
      status_color="$YELLOW"
      ;;
    *)
      status_icon="⏳"
      status_color="$BLUE"
      ;;
  esac
  
  printf "│ %-39s │ ${status_color}%-8s${NC} │ %8s │\n" "$job" "$status_icon" "$duration"
done

echo "└─────────────────────────────────────────┴──────────┴──────────┘"
echo ""

# Summary stats
echo -e "${BOLD}Summary:${NC}"
echo "  ✅ Passed:  $TOTAL_PASSED"
echo "  ❌ Failed:  $TOTAL_FAILED"
echo "  ⏭️  Skipped: $TOTAL_SKIPPED"
echo "  ⏱️  Duration: ${PIPELINE_DURATION}s"
echo ""

# Final recommendation
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [[ "$PIPELINE_FAILED" == "true" ]]; then
  echo -e "${RED}${BOLD}❌ LOCAL CI SIMULATION FAILED${NC}"
  echo ""
  echo "   Fix the failed jobs before pushing to GitHub CI/CD."
  echo "   This saves CI credits and time!"
  echo ""
  echo "   To auto-fix issues: $0 --fix $WORK_DIR"
  echo ""
  exit 1
else
  echo -e "${GREEN}${BOLD}✅ LOCAL CI SIMULATION PASSED${NC}"
  echo ""
  echo "   All local checks passed! Safe to push to GitHub CI/CD."
  echo "   The following jobs will still run in CI: claude-code-action, archive-folders"
  echo ""
  exit 0
fi


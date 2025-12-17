#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# LocalStack Migration - Initialization Script
# ═══════════════════════════════════════════════════════════════════════════
# Validates the environment and prerequisites for LocalStack migration.
#
# Usage: ./localstack-init.sh [--skip-reset]
#
# Options:
#   --skip-reset  Skip LocalStack state reset (for parallel execution)
#
# Exit codes:
#   0 - Environment ready
#   1 - Missing prerequisites
#   3 - LocalStack not running
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/localstack-common.sh"

# Setup error handling
setup_error_handling

# ═══════════════════════════════════════════════════════════════════════════
# PARSE ARGUMENTS
# ═══════════════════════════════════════════════════════════════════════════
SKIP_RESET=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-reset|--no-reset)
      SKIP_RESET=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [--skip-reset]"
      echo ""
      echo "Options:"
      echo "  --skip-reset  Skip LocalStack state reset (for parallel execution)"
      exit 0
      ;;
    *)
      shift
      ;;
  esac
done

# ═══════════════════════════════════════════════════════════════════════════
# MAIN INITIALIZATION
# ═══════════════════════════════════════════════════════════════════════════

log_header "🚀 LOCALSTACK MIGRATION - INITIALIZATION"

cd "$PROJECT_ROOT"

# Check required tools
log_section "Checking Prerequisites"

MISSING_TOOLS=()

for tool in jq curl; do
  if ! require_command "$tool"; then
    MISSING_TOOLS+=("$tool")
  fi
done

# awslocal is required
if ! command -v awslocal &> /dev/null; then
  MISSING_TOOLS+=("awslocal")
  log_warn "awslocal not found"
  echo "  💡 Install with: pip install awscli-local"
fi

if [ ${#MISSING_TOOLS[@]} -gt 0 ]; then
  log_error "Missing required tools: ${MISSING_TOOLS[*]}"
  exit 1
fi

log_success "Required tools available: jq, curl, awslocal"

# Check LocalStack
log_section "Checking LocalStack"

if ! check_localstack; then
  exit 3
fi

# Check GitHub CLI (optional but needed for PR creation)
log_section "Checking GitHub CLI (optional)"

if check_github_cli 2>/dev/null; then
  export GITHUB_CLI_AVAILABLE=true
else
  export GITHUB_CLI_AVAILABLE=false
  log_warn "GitHub CLI not available - PR creation will be skipped"
fi

# Initialize migration log
log_section "Initializing Migration Log"

mkdir -p "$(dirname "$MIGRATION_LOG")"

if [ ! -f "$MIGRATION_LOG" ]; then
  cat > "$MIGRATION_LOG" << 'EOFLOG'
{
  "created_at": "",
  "migrations": [],
  "summary": {
    "total_attempted": 0,
    "successful": 0,
    "failed": 0
  }
}
EOFLOG
  # Set creation timestamp
  jq --arg ts "$(date -Iseconds)" '.created_at = $ts' "$MIGRATION_LOG" > "${MIGRATION_LOG}.tmp"
  mv "${MIGRATION_LOG}.tmp" "$MIGRATION_LOG"
  log_success "Created migration log: $MIGRATION_LOG"
else
  log_info "Migration log exists: $MIGRATION_LOG"
fi

# Reset LocalStack state (unless skipped)
log_section "LocalStack State Management"

if [ "$SKIP_RESET" = true ]; then
  log_info "Skipping LocalStack state reset (parallel mode)"
else
  log_info "Resetting LocalStack state..."
  if curl -s -X POST "${LOCALSTACK_ENDPOINT}/_localstack/state/reset" > /dev/null 2>&1; then
    log_success "LocalStack state reset complete"
  else
    log_warn "LocalStack state reset not available (continuing anyway)"
  fi
fi

# Output summary
log_header "✅ INITIALIZATION COMPLETE"

echo "  Project Root:     $PROJECT_ROOT"
echo "  LocalStack:       $LOCALSTACK_ENDPOINT (v${LOCALSTACK_VERSION:-unknown})"
echo "  GitHub Repo:      $GITHUB_REPO"
echo "  Migration Log:    $MIGRATION_LOG"
echo "  Parallel Mode:    $([ "$SKIP_RESET" = true ] && echo "Yes" || echo "No")"
echo "  GitHub CLI:       $([ "${GITHUB_CLI_AVAILABLE:-false}" = true ] && echo "Available" || echo "Not available")"
echo ""

# Export status for caller
export LOCALSTACK_READY=true
export SKIP_RESET


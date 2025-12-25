#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# CI/CD Wave Validation Script
# ═══════════════════════════════════════════════════════════════════════════
# This script validates that the wave field in metadata.json matches
# the authoritative P0.csv and P1.csv reference files.
#
# For LocalStack migration tasks, the wave MUST match the original task's
# wave assignment to ensure proper prioritization.
#
# Usage:
#   ./scripts/ci-validate-wave.sh
#
# Environment variables:
#   WAVE_VALIDATION_STRICT - If "true", fail on missing wave (default: false)
#   WAVE_VALIDATION_SKIP   - If "true", skip validation entirely (default: false)
#
# Exit codes:
#   0 - Validation passed (or skipped for non-LocalStack tasks)
#   1 - Validation failed (wave mismatch or missing)
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source wave lookup utilities
WAVE_LOOKUP_SCRIPT="$PROJECT_ROOT/.claude/scripts/wave-lookup.sh"
if [ -f "$WAVE_LOOKUP_SCRIPT" ]; then
  source "$WAVE_LOOKUP_SCRIPT"
else
  echo "❌ Wave lookup script not found at $WAVE_LOOKUP_SCRIPT"
  exit 1
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
METADATA_FILE="$PROJECT_ROOT/metadata.json"
STRICT_MODE="${WAVE_VALIDATION_STRICT:-false}"
SKIP_VALIDATION="${WAVE_VALIDATION_SKIP:-false}"

# ═══════════════════════════════════════════════════════════════════════════
# FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

log_info() {
  echo -e "${BLUE}ℹ️  $*${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $*${NC}"
}

log_warn() {
  echo -e "${YELLOW}⚠️  $*${NC}"
}

log_error() {
  echo -e "${RED}❌ $*${NC}" >&2
}

log_header() {
  echo ""
  echo -e "${BOLD}═══════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}$*${NC}"
  echo -e "${BOLD}═══════════════════════════════════════════════════${NC}"
  echo ""
}

# ═══════════════════════════════════════════════════════════════════════════
# MAIN VALIDATION
# ═══════════════════════════════════════════════════════════════════════════

log_header "🌊 Wave Validation"

# Check if validation should be skipped
if [ "$SKIP_VALIDATION" = "true" ]; then
  log_info "Wave validation skipped (WAVE_VALIDATION_SKIP=true)"
  exit 0
fi

# Check if metadata.json exists
if [ ! -f "$METADATA_FILE" ]; then
  log_warn "metadata.json not found - skipping wave validation"
  exit 0
fi

# Check if this is a LocalStack task
PROVIDER=$(jq -r '.provider // "unknown"' "$METADATA_FILE" 2>/dev/null || echo "unknown")

if [ "$PROVIDER" != "localstack" ]; then
  log_info "Not a LocalStack task (provider: $PROVIDER) - skipping wave validation"
  exit 0
fi

log_info "Validating wave for LocalStack task..."

# Get the current wave from metadata.json
ACTUAL_WAVE=$(jq -r '.wave // ""' "$METADATA_FILE" 2>/dev/null || echo "")

if [ -z "$ACTUAL_WAVE" ] || [ "$ACTUAL_WAVE" = "null" ]; then
  log_error "Wave field is missing from metadata.json"
  if [ "$STRICT_MODE" = "true" ]; then
    exit 1
  else
    log_warn "Continuing without wave (non-strict mode)"
    exit 0
  fi
fi

log_info "Current wave in metadata.json: $ACTUAL_WAVE"

# Get migration information
MIGRATED_PR=$(jq -r '.migrated_from.pr // ""' "$METADATA_FILE" 2>/dev/null || echo "")
MIGRATED_PO_ID=$(jq -r '.migrated_from.po_id // ""' "$METADATA_FILE" 2>/dev/null || echo "")
PO_ID=$(jq -r '.po_id // ""' "$METADATA_FILE" 2>/dev/null || echo "")

echo ""
echo "Migration Information:"
echo "  PO_ID:              $PO_ID"
if [ -n "$MIGRATED_PR" ] && [ "$MIGRATED_PR" != "null" ]; then
  echo "  migrated_from.pr:   $MIGRATED_PR"
fi
if [ -n "$MIGRATED_PO_ID" ] && [ "$MIGRATED_PO_ID" != "null" ]; then
  echo "  migrated_from.po_id: $MIGRATED_PO_ID"
fi
echo ""

# Try to look up the expected wave
EXPECTED_WAVE=""

# First try migrated_from.pr
if [ -n "$MIGRATED_PR" ] && [ "$MIGRATED_PR" != "null" ]; then
  log_info "Looking up wave for migrated PR: $MIGRATED_PR"
  EXPECTED_WAVE=$(get_wave_for_pr "$MIGRATED_PR" 2>/dev/null || echo "")
fi

# If not found, try migrated_from.po_id
if [ -z "$EXPECTED_WAVE" ] && [ -n "$MIGRATED_PO_ID" ] && [ "$MIGRATED_PO_ID" != "null" ]; then
  log_info "Looking up wave for migrated PO_ID: $MIGRATED_PO_ID"
  EXPECTED_WAVE=$(get_wave_for_po_id "$MIGRATED_PO_ID" 2>/dev/null || echo "")
fi

# If not found, try po_id (stripping LS- prefix)
if [ -z "$EXPECTED_WAVE" ] && [ -n "$PO_ID" ]; then
  ORIGINAL_PO_ID="${PO_ID#LS-}"
  log_info "Looking up wave for PO_ID: $ORIGINAL_PO_ID"
  EXPECTED_WAVE=$(get_wave_for_po_id "$ORIGINAL_PO_ID" 2>/dev/null || echo "")
fi

# Check validation result
if [ -z "$EXPECTED_WAVE" ]; then
  log_warn "Task not found in P0.csv or P1.csv - cannot validate wave"
  log_info "This may be a new task not yet in the wave reference files"
  echo ""
  echo "Current wave '$ACTUAL_WAVE' will be used (not validated)"
  exit 0
fi

log_info "Expected wave from CSV: $EXPECTED_WAVE"
echo ""

# Compare waves
if [ "$ACTUAL_WAVE" = "$EXPECTED_WAVE" ]; then
  log_success "Wave validation PASSED"
  echo ""
  echo "  ✅ Wave '$ACTUAL_WAVE' matches expected wave from CSV reference"
  echo ""
  exit 0
else
  log_error "Wave validation FAILED"
  echo ""
  echo "  ❌ Wave mismatch detected!"
  echo ""
  echo "  Actual wave in metadata.json:   $ACTUAL_WAVE"
  echo "  Expected wave from CSV:         $EXPECTED_WAVE"
  echo ""
  echo "  📋 To fix this issue:"
  echo "     1. Update metadata.json with the correct wave: \"wave\": \"$EXPECTED_WAVE\""
  echo "     2. Or run: jq '.wave = \"$EXPECTED_WAVE\"' metadata.json > tmp.json && mv tmp.json metadata.json"
  echo ""
  echo "  📚 Reference files:"
  echo "     P0 tasks: .claude/docs/references/P0.csv"
  echo "     P1 tasks: .claude/docs/references/P1.csv"
  echo ""
  exit 1
fi


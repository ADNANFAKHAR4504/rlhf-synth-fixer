#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# Wave Lookup Utility - P0/P1 Wave Determination for LocalStack Migrations
# ═══════════════════════════════════════════════════════════════════════════
# This script provides utilities to look up the correct wave (P0 or P1) for
# a given PR or PO_ID from the authoritative P0.csv and P1.csv reference files.
#
# The P0.csv and P1.csv files are located at:
#   .claude/docs/references/P0.csv
#   .claude/docs/references/P1.csv
#
# Usage:
#   # Source this script for functions
#   source .claude/scripts/wave-lookup.sh
#
#   # Get wave for a PR number
#   WAVE=$(get_wave_for_pr "Pr1234")
#
#   # Get wave for a PO_ID
#   WAVE=$(get_wave_for_po_id "291234")
#
#   # Validate metadata.json wave against CSV files
#   validate_wave_for_pr "Pr1234" "/path/to/metadata.json"
#
# Exit codes:
#   0 - Success / Wave found
#   1 - PR not found in any wave list
#   2 - Wave mismatch (for validation)
# ═══════════════════════════════════════════════════════════════════════════

# Get script directory and project root
WAVE_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WAVE_PROJECT_ROOT="$(cd "$WAVE_SCRIPT_DIR/../.." && pwd)"

# CSV file paths
P0_CSV="${WAVE_PROJECT_ROOT}/.claude/docs/references/P0.csv"
P1_CSV="${WAVE_PROJECT_ROOT}/.claude/docs/references/P1.csv"

# Colors for output (if not already defined)
if [ -z "${NC:-}" ]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  BLUE='\033[0;34m'
  NC='\033[0m'
fi

# ═══════════════════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

# Normalize PR number to format "Pr1234"
normalize_pr() {
  local input="$1"
  # Remove # prefix, Pr prefix, or just a number
  local num="${input#Pr}"
  num="${num#\#}"
  num="${num#pr}"
  echo "Pr${num}"
}

# Extract PR number from s3Location JSON in CSV
# Example: {"Bucket": "...", "Key": "cdktf-ts/Pr2061/metadata.json"} -> Pr2061
extract_pr_from_s3location() {
  local s3location="$1"
  # Extract the PR number from the Key path
  echo "$s3location" | grep -oE 'Pr[0-9]+' | head -1
}

# ═══════════════════════════════════════════════════════════════════════════
# WAVE LOOKUP FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

# Check if PR exists in a CSV file
# Usage: pr_in_csv "Pr1234" "/path/to/file.csv"
pr_in_csv() {
  local pr="$1"
  local csv_file="$2"
  
  if [ ! -f "$csv_file" ]; then
    return 1
  fi
  
  # Search for the PR in s3Location column (contains "Key": "platform/PrXXXX/metadata.json")
  # The s3Location column contains JSON with the PR number in the Key path
  grep -q "/${pr}/" "$csv_file" 2>/dev/null
}

# Check if PO_ID exists in a CSV file
# Usage: po_id_in_csv "291234" "/path/to/file.csv"
po_id_in_csv() {
  local po_id="$1"
  local csv_file="$2"
  
  if [ ! -f "$csv_file" ]; then
    return 1
  fi
  
  # Search for the po_id in the CSV (it's one of the columns)
  # The po_id column contains values like "291234" or "trainr97"
  grep -q ",$po_id," "$csv_file" 2>/dev/null || grep -q "^$po_id," "$csv_file" 2>/dev/null
}

# Get wave for a PR number
# Returns: "P0", "P1", or empty string if not found
# Usage: get_wave_for_pr "Pr1234"
get_wave_for_pr() {
  local pr="$(normalize_pr "$1")"
  
  # Check P0 first
  if pr_in_csv "$pr" "$P0_CSV"; then
    echo "P0"
    return 0
  fi
  
  # Check P1
  if pr_in_csv "$pr" "$P1_CSV"; then
    echo "P1"
    return 0
  fi
  
  # Not found in either
  return 1
}

# Get wave for a PO_ID
# Returns: "P0", "P1", or empty string if not found
# Usage: get_wave_for_po_id "291234"
get_wave_for_po_id() {
  local po_id="$1"
  
  # Check P0 first
  if po_id_in_csv "$po_id" "$P0_CSV"; then
    echo "P0"
    return 0
  fi
  
  # Check P1
  if po_id_in_csv "$po_id" "$P1_CSV"; then
    echo "P1"
    return 0
  fi
  
  # Not found in either
  return 1
}

# Get wave with fallback - tries PR first, then PO_ID from migrated_from
# Usage: get_wave_for_task "/path/to/metadata.json"
get_wave_for_task() {
  local metadata_file="$1"
  local wave=""
  
  if [ ! -f "$metadata_file" ]; then
    echo ""
    return 1
  fi
  
  # First try to get wave from migrated_from.pr if it exists
  local migrated_pr=$(jq -r '.migrated_from.pr // ""' "$metadata_file" 2>/dev/null)
  if [ -n "$migrated_pr" ] && [ "$migrated_pr" != "null" ]; then
    wave=$(get_wave_for_pr "$migrated_pr")
    if [ -n "$wave" ]; then
      echo "$wave"
      return 0
    fi
  fi
  
  # Try to get wave from migrated_from.po_id
  local migrated_po_id=$(jq -r '.migrated_from.po_id // ""' "$metadata_file" 2>/dev/null)
  if [ -n "$migrated_po_id" ] && [ "$migrated_po_id" != "null" ]; then
    wave=$(get_wave_for_po_id "$migrated_po_id")
    if [ -n "$wave" ]; then
      echo "$wave"
      return 0
    fi
  fi
  
  # Try to get wave from po_id (stripping LS- prefix if present)
  local po_id=$(jq -r '.po_id // ""' "$metadata_file" 2>/dev/null)
  if [ -n "$po_id" ] && [ "$po_id" != "null" ]; then
    # Strip LS- prefix if present
    po_id="${po_id#LS-}"
    wave=$(get_wave_for_po_id "$po_id")
    if [ -n "$wave" ]; then
      echo "$wave"
      return 0
    fi
  fi
  
  # Not found
  return 1
}

# Validate that metadata.json has correct wave for the task
# Returns: 0 if valid, 1 if not found, 2 if mismatch
# Usage: validate_wave_for_task "/path/to/metadata.json"
validate_wave_for_task() {
  local metadata_file="$1"
  local verbose="${2:-false}"
  
  if [ ! -f "$metadata_file" ]; then
    if [ "$verbose" = "true" ]; then
      echo -e "${RED}❌ Metadata file not found: $metadata_file${NC}" >&2
    fi
    return 1
  fi
  
  # Get the expected wave from CSV files
  local expected_wave=$(get_wave_for_task "$metadata_file")
  
  if [ -z "$expected_wave" ]; then
    if [ "$verbose" = "true" ]; then
      echo -e "${YELLOW}⚠️  Task not found in P0.csv or P1.csv - wave cannot be validated${NC}" >&2
    fi
    return 1
  fi
  
  # Get the actual wave from metadata.json
  local actual_wave=$(jq -r '.wave // ""' "$metadata_file" 2>/dev/null)
  
  if [ -z "$actual_wave" ] || [ "$actual_wave" = "null" ]; then
    if [ "$verbose" = "true" ]; then
      echo -e "${RED}❌ Wave field missing in metadata.json (expected: $expected_wave)${NC}" >&2
    fi
    return 2
  fi
  
  # Compare waves
  if [ "$actual_wave" = "$expected_wave" ]; then
    if [ "$verbose" = "true" ]; then
      echo -e "${GREEN}✅ Wave is correct: $actual_wave${NC}"
    fi
    return 0
  else
    if [ "$verbose" = "true" ]; then
      echo -e "${RED}❌ Wave mismatch: metadata has '$actual_wave', expected '$expected_wave'${NC}" >&2
    fi
    return 2
  fi
}

# ═══════════════════════════════════════════════════════════════════════════
# CLI MODE - Run as standalone script
# ═══════════════════════════════════════════════════════════════════════════

# If script is run directly (not sourced), provide CLI functionality
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  
  show_usage() {
    echo "Usage: $0 <command> [args]"
    echo ""
    echo "Commands:"
    echo "  lookup-pr <pr_number>        Get wave for a PR number (e.g., Pr1234)"
    echo "  lookup-po-id <po_id>         Get wave for a PO_ID (e.g., 291234)"
    echo "  lookup-task <metadata.json>  Get wave for a task from metadata file"
    echo "  validate <metadata.json>     Validate wave in metadata.json against CSV"
    echo "  list-p0                      List all P0 PRs"
    echo "  list-p1                      List all P1 PRs"
    echo "  stats                        Show statistics"
    echo ""
    echo "Examples:"
    echo "  $0 lookup-pr Pr2061"
    echo "  $0 validate metadata.json"
    echo ""
  }
  
  case "${1:-}" in
    lookup-pr)
      if [ -z "${2:-}" ]; then
        echo "Error: PR number required" >&2
        exit 1
      fi
      wave=$(get_wave_for_pr "$2")
      if [ -n "$wave" ]; then
        echo "$wave"
      else
        echo "Not found" >&2
        exit 1
      fi
      ;;
      
    lookup-po-id)
      if [ -z "${2:-}" ]; then
        echo "Error: PO_ID required" >&2
        exit 1
      fi
      wave=$(get_wave_for_po_id "$2")
      if [ -n "$wave" ]; then
        echo "$wave"
      else
        echo "Not found" >&2
        exit 1
      fi
      ;;
      
    lookup-task)
      if [ -z "${2:-}" ]; then
        echo "Error: metadata.json path required" >&2
        exit 1
      fi
      wave=$(get_wave_for_task "$2")
      if [ -n "$wave" ]; then
        echo "$wave"
      else
        echo "Not found" >&2
        exit 1
      fi
      ;;
      
    validate)
      if [ -z "${2:-}" ]; then
        echo "Error: metadata.json path required" >&2
        exit 1
      fi
      validate_wave_for_task "$2" true
      exit $?
      ;;
      
    list-p0)
      if [ -f "$P0_CSV" ]; then
        echo "P0 Tasks (from $P0_CSV):"
        grep -oE '/Pr[0-9]+/' "$P0_CSV" | sed 's/\///g' | sort -u
        echo ""
        echo "Total: $(grep -oE '/Pr[0-9]+/' "$P0_CSV" | sort -u | wc -l | tr -d ' ') PRs"
      else
        echo "P0.csv not found at $P0_CSV" >&2
        exit 1
      fi
      ;;
      
    list-p1)
      if [ -f "$P1_CSV" ]; then
        echo "P1 Tasks (from $P1_CSV):"
        grep -oE '/Pr[0-9]+/' "$P1_CSV" | sed 's/\///g' | sort -u
        echo ""
        echo "Total: $(grep -oE '/Pr[0-9]+/' "$P1_CSV" | sort -u | wc -l | tr -d ' ') PRs"
      else
        echo "P1.csv not found at $P1_CSV" >&2
        exit 1
      fi
      ;;
      
    stats)
      echo "Wave Reference Statistics"
      echo "========================="
      if [ -f "$P0_CSV" ]; then
        P0_COUNT=$(grep -oE '/Pr[0-9]+/' "$P0_CSV" | sort -u | wc -l | tr -d ' ')
        echo "P0 Tasks: $P0_COUNT"
      else
        echo "P0.csv: Not found"
      fi
      if [ -f "$P1_CSV" ]; then
        P1_COUNT=$(grep -oE '/Pr[0-9]+/' "$P1_CSV" | sort -u | wc -l | tr -d ' ')
        echo "P1 Tasks: $P1_COUNT"
      else
        echo "P1.csv: Not found"
      fi
      echo ""
      echo "CSV Locations:"
      echo "  P0: $P0_CSV"
      echo "  P1: $P1_CSV"
      ;;
      
    -h|--help|help)
      show_usage
      ;;
      
    "")
      show_usage
      exit 1
      ;;
      
    *)
      echo "Unknown command: $1" >&2
      show_usage
      exit 1
      ;;
  esac
fi


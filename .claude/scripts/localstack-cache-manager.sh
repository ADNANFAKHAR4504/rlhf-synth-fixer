#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# LocalStack Cache Manager
# ═══════════════════════════════════════════════════════════════════════════════
# Purpose: Manage NPM, CDK, and dependency caches for fast parallel execution
#
# Features:
#   - Shared NPM cache across all agents
#   - CDK asset caching
#   - Pre-installed common dependencies
#   - Cache invalidation and cleanup
#
# Usage:
#   source ./localstack-cache-manager.sh  # Source for functions
#   ./localstack-cache-manager.sh setup   # Initial setup
#   ./localstack-cache-manager.sh warm    # Warm up caches
#   ./localstack-cache-manager.sh clean   # Clean old caches
#   ./localstack-cache-manager.sh status  # Show cache status
#
# Environment Variables (set these before sourcing):
#   CACHE_ROOT - Base directory for caches (default: .claude/cache)
#   NPM_CACHE_ENABLED - Enable NPM caching (default: true)
#   CDK_CACHE_ENABLED - Enable CDK caching (default: true)
# ═══════════════════════════════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Cache directories
CACHE_ROOT="${CACHE_ROOT:-$PROJECT_ROOT/.claude/cache}"
NPM_CACHE_DIR="${NPM_CACHE_DIR:-$CACHE_ROOT/npm}"
CDK_CACHE_DIR="${CDK_CACHE_DIR:-$CACHE_ROOT/cdk}"
TEMPLATE_CACHE_DIR="${TEMPLATE_CACHE_DIR:-$CACHE_ROOT/templates}"
FIX_PATTERN_CACHE="${FIX_PATTERN_CACHE:-$CACHE_ROOT/fix-patterns}"

# Feature flags
NPM_CACHE_ENABLED="${NPM_CACHE_ENABLED:-true}"
CDK_CACHE_ENABLED="${CDK_CACHE_ENABLED:-true}"

# Cache settings
CACHE_MAX_AGE_DAYS=7
CACHE_MAX_SIZE_GB=5

# Common dependencies to pre-cache
COMMON_NPM_DEPS=(
  "aws-cdk-lib@latest"
  "aws-cdk@latest"
  "constructs@latest"
  "@aws-sdk/client-s3@latest"
  "@aws-sdk/client-dynamodb@latest"
  "@aws-sdk/client-lambda@latest"
  "@aws-sdk/client-sqs@latest"
  "@aws-sdk/client-sns@latest"
  "@aws-sdk/client-cloudformation@latest"
  "@aws-sdk/client-iam@latest"
  "@aws-sdk/client-kms@latest"
  "typescript@latest"
  "jest@latest"
  "@types/jest@latest"
  "@types/node@latest"
  "ts-jest@latest"
  "ts-node@latest"
  "esbuild@latest"
  "aws-cdk-local@latest"
)

# Colors (only if terminal)
if [[ -t 1 ]]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  BLUE='\033[0;34m'
  NC='\033[0m'
else
  RED=''
  GREEN=''
  YELLOW=''
  BLUE=''
  NC=''
fi

# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

cache_log_info() {
  echo -e "${BLUE}[CACHE] ℹ️  $1${NC}"
}

cache_log_success() {
  echo -e "${GREEN}[CACHE] ✅ $1${NC}"
}

cache_log_warning() {
  echo -e "${YELLOW}[CACHE] ⚠️  $1${NC}"
}

cache_log_error() {
  echo -e "${RED}[CACHE] ❌ $1${NC}"
}

# ═══════════════════════════════════════════════════════════════════════════════
# CACHE INITIALIZATION
# ═══════════════════════════════════════════════════════════════════════════════

init_cache_dirs() {
  mkdir -p "$NPM_CACHE_DIR"
  mkdir -p "$CDK_CACHE_DIR"
  mkdir -p "$TEMPLATE_CACHE_DIR"
  mkdir -p "$FIX_PATTERN_CACHE"
}

# ═══════════════════════════════════════════════════════════════════════════════
# NPM CACHE MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

setup_npm_cache_env() {
  if [[ "$NPM_CACHE_ENABLED" != "true" ]]; then
    return 0
  fi
  
  init_cache_dirs
  
  # Set npm cache location
  export npm_config_cache="$NPM_CACHE_DIR"
  
  # Optimize npm for caching
  export npm_config_prefer_offline=true
  export npm_config_audit=false
  export npm_config_fund=false
  export npm_config_update_notifier=false
  
  # Also configure via npmrc if in a worktree
  if [[ -f "package.json" ]] && [[ ! -f ".npmrc" ]]; then
    cat > .npmrc << EOF
cache=$NPM_CACHE_DIR
prefer-offline=true
audit=false
fund=false
update-notifier=false
EOF
  fi
}

warm_npm_cache() {
  if [[ "$NPM_CACHE_ENABLED" != "true" ]]; then
    cache_log_info "NPM caching disabled"
    return 0
  fi
  
  cache_log_info "Warming NPM cache with common dependencies..."
  
  init_cache_dirs
  
  # Create temp directory for warming
  local temp_dir
  temp_dir=$(mktemp -d)
  cd "$temp_dir"
  
  # Create minimal package.json
  cat > package.json << 'EOF'
{
  "name": "cache-warmup",
  "version": "1.0.0",
  "private": true,
  "dependencies": {}
}
EOF
  
  # Install each dependency to populate cache
  local count=0
  local total=${#COMMON_NPM_DEPS[@]}
  
  for dep in "${COMMON_NPM_DEPS[@]}"; do
    count=$((count + 1))
    cache_log_info "Caching ($count/$total): $dep"
    
    # Use npm pack to cache without installing
    npm pack "$dep" --cache "$NPM_CACHE_DIR" 2>/dev/null || {
      # Fallback: install to cache
      npm install "$dep" --cache "$NPM_CACHE_DIR" --prefer-offline 2>/dev/null || true
    }
  done
  
  # Cleanup
  cd "$PROJECT_ROOT"
  rm -rf "$temp_dir"
  
  cache_log_success "NPM cache warmed with $total dependencies"
}

# Fast npm install using cache
cached_npm_install() {
  local work_dir="${1:-.}"
  
  setup_npm_cache_env
  
  cd "$work_dir"
  
  if [[ ! -f "package.json" ]]; then
    cache_log_warning "No package.json found in $work_dir"
    return 1
  fi
  
  # Check if node_modules exists and is up to date
  if [[ -d "node_modules" ]] && [[ "package.json" -ot "node_modules" ]]; then
    cache_log_info "node_modules up to date (using cached)"
    return 0
  fi
  
  cache_log_info "Running npm install with cache..."
  
  # Use npm ci if lock file exists, otherwise npm install
  if [[ -f "package-lock.json" ]]; then
    npm ci --cache "$NPM_CACHE_DIR" --prefer-offline --no-audit 2>&1 || \
    npm install --cache "$NPM_CACHE_DIR" --prefer-offline --no-audit 2>&1
  else
    npm install --cache "$NPM_CACHE_DIR" --prefer-offline --no-audit 2>&1
  fi
  
  local exit_code=$?
  
  if [[ $exit_code -eq 0 ]]; then
    cache_log_success "npm install completed (using cache)"
  else
    cache_log_error "npm install failed"
  fi
  
  return $exit_code
}

# ═══════════════════════════════════════════════════════════════════════════════
# CDK CACHE MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

setup_cdk_cache_env() {
  if [[ "$CDK_CACHE_ENABLED" != "true" ]]; then
    return 0
  fi
  
  init_cache_dirs
  
  # Set CDK home for caching
  export CDK_HOME="$CDK_CACHE_DIR"
  
  # CDK asset caching
  export CDK_ASSET_STAGING="$CDK_CACHE_DIR/assets"
  mkdir -p "$CDK_ASSET_STAGING"
}

# ═══════════════════════════════════════════════════════════════════════════════
# FIX PATTERN CACHING
# ═══════════════════════════════════════════════════════════════════════════════

cache_successful_fix() {
  local platform="$1"
  local language="$2"
  local fix_type="$3"
  local fix_content="$4"
  
  init_cache_dirs
  
  local cache_key="${platform}-${language}-${fix_type}"
  local cache_file="$FIX_PATTERN_CACHE/${cache_key}.json"
  
  # Create or update cache entry
  local timestamp
  timestamp=$(date -Iseconds)
  
  cat > "$cache_file" << EOF
{
  "platform": "$platform",
  "language": "$language",
  "fix_type": "$fix_type",
  "cached_at": "$timestamp",
  "success_count": 1,
  "content": $(echo "$fix_content" | jq -Rs .)
}
EOF
  
  cache_log_info "Cached fix pattern: $cache_key"
}

get_cached_fix() {
  local platform="$1"
  local language="$2"
  local fix_type="$3"
  
  local cache_key="${platform}-${language}-${fix_type}"
  local cache_file="$FIX_PATTERN_CACHE/${cache_key}.json"
  
  if [[ -f "$cache_file" ]]; then
    jq -r '.content // empty' "$cache_file" 2>/dev/null
    return 0
  fi
  
  return 1
}

# ═══════════════════════════════════════════════════════════════════════════════
# CACHE CLEANUP
# ═══════════════════════════════════════════════════════════════════════════════

clean_old_cache() {
  cache_log_info "Cleaning caches older than ${CACHE_MAX_AGE_DAYS} days..."
  
  # Clean old npm cache entries
  if [[ -d "$NPM_CACHE_DIR" ]]; then
    find "$NPM_CACHE_DIR" -type f -mtime "+${CACHE_MAX_AGE_DAYS}" -delete 2>/dev/null || true
  fi
  
  # Clean old CDK cache
  if [[ -d "$CDK_CACHE_DIR/assets" ]]; then
    find "$CDK_CACHE_DIR/assets" -type f -mtime "+${CACHE_MAX_AGE_DAYS}" -delete 2>/dev/null || true
  fi
  
  # Clean old fix patterns
  if [[ -d "$FIX_PATTERN_CACHE" ]]; then
    find "$FIX_PATTERN_CACHE" -type f -mtime "+${CACHE_MAX_AGE_DAYS}" -delete 2>/dev/null || true
  fi
  
  cache_log_success "Cache cleanup complete"
}

clean_all_cache() {
  cache_log_warning "Cleaning ALL caches..."
  
  rm -rf "$NPM_CACHE_DIR"/* 2>/dev/null || true
  rm -rf "$CDK_CACHE_DIR"/* 2>/dev/null || true
  rm -rf "$FIX_PATTERN_CACHE"/* 2>/dev/null || true
  
  cache_log_success "All caches cleared"
}

# ═══════════════════════════════════════════════════════════════════════════════
# CACHE STATUS
# ═══════════════════════════════════════════════════════════════════════════════

show_cache_status() {
  echo ""
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo "📦 CACHE STATUS"
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo ""
  
  echo "Cache Root: $CACHE_ROOT"
  echo ""
  
  # NPM Cache
  echo "NPM Cache ($NPM_CACHE_DIR):"
  if [[ -d "$NPM_CACHE_DIR" ]]; then
    local npm_size
    npm_size=$(du -sh "$NPM_CACHE_DIR" 2>/dev/null | cut -f1 || echo "0")
    local npm_files
    npm_files=$(find "$NPM_CACHE_DIR" -type f 2>/dev/null | wc -l | tr -d ' ')
    echo "  Size:  $npm_size"
    echo "  Files: $npm_files"
    echo "  Status: ${GREEN}✅ Active${NC}"
  else
    echo "  Status: ${YELLOW}⚠️ Not initialized${NC}"
  fi
  echo ""
  
  # CDK Cache
  echo "CDK Cache ($CDK_CACHE_DIR):"
  if [[ -d "$CDK_CACHE_DIR" ]]; then
    local cdk_size
    cdk_size=$(du -sh "$CDK_CACHE_DIR" 2>/dev/null | cut -f1 || echo "0")
    echo "  Size:  $cdk_size"
    echo "  Status: ${GREEN}✅ Active${NC}"
  else
    echo "  Status: ${YELLOW}⚠️ Not initialized${NC}"
  fi
  echo ""
  
  # Fix Pattern Cache
  echo "Fix Pattern Cache ($FIX_PATTERN_CACHE):"
  if [[ -d "$FIX_PATTERN_CACHE" ]]; then
    local fix_count
    fix_count=$(find "$FIX_PATTERN_CACHE" -name "*.json" 2>/dev/null | wc -l | tr -d ' ')
    echo "  Cached Patterns: $fix_count"
    
    if [[ $fix_count -gt 0 ]]; then
      echo "  Patterns:"
      find "$FIX_PATTERN_CACHE" -name "*.json" -exec basename {} .json \; 2>/dev/null | \
        head -10 | while read -r pattern; do
          echo "    - $pattern"
        done
    fi
  else
    echo "  Status: ${YELLOW}⚠️ Not initialized${NC}"
  fi
  echo ""
  
  echo "═══════════════════════════════════════════════════════════════════════════════"
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN (when run directly)
# ═══════════════════════════════════════════════════════════════════════════════

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  command="${1:-help}"
  
  case "$command" in
    setup)
      cache_log_info "Setting up caches..."
      init_cache_dirs
      setup_npm_cache_env
      setup_cdk_cache_env
      cache_log_success "Cache setup complete"
      ;;
    warm)
      warm_npm_cache
      ;;
    clean)
      if [[ "${2:-}" == "--all" ]]; then
        clean_all_cache
      else
        clean_old_cache
      fi
      ;;
    status)
      show_cache_status
      ;;
    install)
      # Run cached npm install in specified directory
      cached_npm_install "${2:-.}"
      ;;
    help|--help|-h)
      echo "LocalStack Cache Manager"
      echo ""
      echo "Usage: $0 <command> [options]"
      echo ""
      echo "Commands:"
      echo "  setup              Initialize cache directories"
      echo "  warm               Pre-cache common dependencies"
      echo "  clean              Clean old cache entries"
      echo "  clean --all        Clean ALL cache entries"
      echo "  status             Show cache status"
      echo "  install [dir]      Run cached npm install"
      echo "  help               Show this help"
      echo ""
      echo "Environment Variables:"
      echo "  CACHE_ROOT         Base cache directory"
      echo "  NPM_CACHE_ENABLED  Enable NPM caching (true/false)"
      echo "  CDK_CACHE_ENABLED  Enable CDK caching (true/false)"
      echo ""
      ;;
    *)
      cache_log_error "Unknown command: $command"
      echo "Run '$0 help' for usage"
      exit 1
      ;;
  esac
fi


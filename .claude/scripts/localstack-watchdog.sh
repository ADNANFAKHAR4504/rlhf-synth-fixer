#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# LocalStack Watchdog & Warmup Script
# ═══════════════════════════════════════════════════════════════════════════════
# Purpose: Keep LocalStack running, warm, and pre-bootstrapped for 20 concurrent agents
#
# Features:
#   - Persistent LocalStack daemon management
#   - Pre-bootstrapped CDK environment
#   - Health monitoring with auto-restart
#   - NPM/dependency cache warmup
#   - Resource monitoring for high concurrency
#
# Usage:
#   ./localstack-watchdog.sh start         # Start LocalStack daemon with watchdog
#   ./localstack-watchdog.sh stop          # Stop LocalStack daemon
#   ./localstack-watchdog.sh status        # Check status
#   ./localstack-watchdog.sh warmup        # Pre-bootstrap and warm caches
#   ./localstack-watchdog.sh monitor       # Run continuous monitoring (foreground)
#   ./localstack-watchdog.sh health        # Quick health check
#
# Exit codes:
#   0 = Success
#   1 = LocalStack not running
#   2 = Health check failed
#   3 = Resource constraints
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_FILE="$PROJECT_ROOT/.claude/config/localstack.yaml"

# LocalStack settings
LOCALSTACK_ENDPOINT="${AWS_ENDPOINT_URL:-http://localhost:4566}"
LOCALSTACK_REGION="${AWS_DEFAULT_REGION:-us-east-1}"
LOCALSTACK_ACCOUNT="000000000000"

# Watchdog settings
HEALTH_CHECK_INTERVAL=30
AUTO_RESTART=true
PRE_BOOTSTRAP=true
PERSISTENCE_MODE=true

# Cache directories
NPM_CACHE_DIR="${NPM_CACHE_DIR:-$PROJECT_ROOT/.claude/cache/npm}"
CDK_CACHE_DIR="${CDK_CACHE_DIR:-$PROJECT_ROOT/.claude/cache/cdk}"
BOOTSTRAP_CACHE="$PROJECT_ROOT/.claude/cache/bootstrap-status.json"

# Watchdog state
WATCHDOG_PID_FILE="/tmp/localstack-watchdog.pid"
WATCHDOG_LOG="/tmp/localstack-watchdog.log"

# Resource thresholds for 20 concurrent agents
MIN_FREE_MEMORY_MB=4096
MIN_FREE_DISK_GB=10
MAX_CPU_PERCENT=85

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

log_info() {
  echo -e "${BLUE}[$(date '+%H:%M:%S')] ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}[$(date '+%H:%M:%S')] ✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}[$(date '+%H:%M:%S')] ❌ $1${NC}"
}

log_debug() {
  if [[ "${VERBOSE:-false}" == "true" ]]; then
    echo -e "${CYAN}[$(date '+%H:%M:%S')] 🔍 $1${NC}"
  fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# RESOURCE MONITORING
# ═══════════════════════════════════════════════════════════════════════════════

check_system_resources() {
  local issues=0
  
  # Check free memory
  local free_memory_mb
  if [[ "$(uname)" == "Darwin" ]]; then
    # macOS
    free_memory_mb=$(vm_stat | awk '/Pages free/ {free=$3} /Pages inactive/ {inactive=$3} END {print int((free+inactive)*4096/1024/1024)}' 2>/dev/null || echo "8192")
  else
    # Linux
    free_memory_mb=$(free -m | awk '/^Mem:/ {print $7}' 2>/dev/null || echo "8192")
  fi
  
  if [[ "$free_memory_mb" -lt "$MIN_FREE_MEMORY_MB" ]]; then
    log_warning "Low memory: ${free_memory_mb}MB free (recommended: ${MIN_FREE_MEMORY_MB}MB for 20 agents)"
    issues=$((issues + 1))
  else
    log_debug "Memory OK: ${free_memory_mb}MB free"
  fi
  
  # Check disk space
  local free_disk_gb
  free_disk_gb=$(df -BG "$PROJECT_ROOT" 2>/dev/null | awk 'NR==2 {gsub("G",""); print $4}' || echo "100")
  
  if [[ "$free_disk_gb" -lt "$MIN_FREE_DISK_GB" ]]; then
    log_warning "Low disk space: ${free_disk_gb}GB free (recommended: ${MIN_FREE_DISK_GB}GB)"
    issues=$((issues + 1))
  else
    log_debug "Disk OK: ${free_disk_gb}GB free"
  fi
  
  # Check CPU load
  local cpu_percent
  if [[ "$(uname)" == "Darwin" ]]; then
    cpu_percent=$(ps -A -o %cpu | awk '{s+=$1} END {print int(s)}' 2>/dev/null || echo "0")
  else
    cpu_percent=$(top -bn1 | grep "Cpu(s)" | awk '{print int($2)}' 2>/dev/null || echo "0")
  fi
  
  if [[ "$cpu_percent" -gt "$MAX_CPU_PERCENT" ]]; then
    log_warning "High CPU usage: ${cpu_percent}% (threshold: ${MAX_CPU_PERCENT}%)"
    issues=$((issues + 1))
  else
    log_debug "CPU OK: ${cpu_percent}%"
  fi
  
  return $issues
}

# ═══════════════════════════════════════════════════════════════════════════════
# LOCALSTACK MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

check_localstack_health() {
  local timeout=${1:-5}
  
  if curl -s --max-time "$timeout" "$LOCALSTACK_ENDPOINT/_localstack/health" &>/dev/null; then
    return 0
  else
    return 1
  fi
}

get_localstack_services() {
  curl -s --max-time 5 "$LOCALSTACK_ENDPOINT/_localstack/health" 2>/dev/null | \
    jq -r '.services | to_entries | map(select(.value == "running" or .value == "available")) | .[].key' 2>/dev/null | \
    tr '\n' ' ' || echo "unknown"
}

start_localstack() {
  log_info "Starting LocalStack..."
  
  # Check if already running
  if check_localstack_health 2; then
    log_success "LocalStack is already running"
    return 0
  fi
  
  # Prepare environment for persistence
  local env_opts=""
  if [[ "$PERSISTENCE_MODE" == "true" ]]; then
    env_opts="PERSISTENCE=1"
  fi
  
  # Start LocalStack with optimized settings for 20 agents
  export LOCALSTACK_DOCKER_FLAGS="-e EAGER_SERVICE_LOADING=1 -e LAMBDA_EXECUTOR=local"
  
  if command -v localstack &>/dev/null; then
    if [[ "$PERSISTENCE_MODE" == "true" ]]; then
      PERSISTENCE=1 localstack start -d 2>/dev/null || localstack start -d
    else
      localstack start -d
    fi
  elif command -v docker &>/dev/null; then
    docker run -d \
      --name localstack_main \
      -p 4566:4566 \
      -p 4510-4559:4510-4559 \
      -e DEBUG=0 \
      -e EAGER_SERVICE_LOADING=1 \
      -e LAMBDA_EXECUTOR=local \
      ${PERSISTENCE_MODE:+-e PERSISTENCE=1} \
      -v /var/run/docker.sock:/var/run/docker.sock \
      -v "${PROJECT_ROOT}/.localstack:/var/lib/localstack" \
      localstack/localstack:latest 2>/dev/null || true
  else
    log_error "Neither localstack CLI nor docker found"
    return 1
  fi
  
  # Wait for LocalStack to be ready
  log_info "Waiting for LocalStack to be ready..."
  local retries=30
  while [[ $retries -gt 0 ]]; do
    if check_localstack_health 2; then
      log_success "LocalStack is ready!"
      return 0
    fi
    sleep 2
    retries=$((retries - 1))
  done
  
  log_error "LocalStack failed to start within timeout"
  return 1
}

stop_localstack() {
  log_info "Stopping LocalStack..."
  
  if command -v localstack &>/dev/null; then
    localstack stop 2>/dev/null || true
  fi
  
  # Also try docker
  docker stop localstack_main 2>/dev/null || true
  docker rm localstack_main 2>/dev/null || true
  
  log_success "LocalStack stopped"
}

restart_localstack() {
  log_info "Restarting LocalStack..."
  stop_localstack
  sleep 2
  start_localstack
}

# ═══════════════════════════════════════════════════════════════════════════════
# CDK BOOTSTRAP MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

check_bootstrap_status() {
  # Check if CDK is bootstrapped in LocalStack
  if ! check_localstack_health 2; then
    return 1
  fi
  
  # Check for CDK bootstrap stack
  local stacks
  stacks=$(awslocal cloudformation list-stacks --stack-status-filter CREATE_COMPLETE 2>/dev/null | \
    jq -r '.StackSummaries[].StackName' 2>/dev/null || echo "")
  
  if echo "$stacks" | grep -q "CDKToolkit"; then
    return 0
  else
    return 1
  fi
}

bootstrap_cdk() {
  log_info "Bootstrapping CDK for LocalStack..."
  
  if ! check_localstack_health 5; then
    log_error "LocalStack not running - cannot bootstrap"
    return 1
  fi
  
  # Set environment
  export AWS_ACCESS_KEY_ID=test
  export AWS_SECRET_ACCESS_KEY=test
  export AWS_DEFAULT_REGION="$LOCALSTACK_REGION"
  export AWS_ENDPOINT_URL="$LOCALSTACK_ENDPOINT"
  export CDK_DEFAULT_ACCOUNT="$LOCALSTACK_ACCOUNT"
  export CDK_DEFAULT_REGION="$LOCALSTACK_REGION"
  
  # Check if already bootstrapped
  if check_bootstrap_status; then
    log_success "CDK already bootstrapped"
    return 0
  fi
  
  # Run bootstrap
  if command -v cdklocal &>/dev/null; then
    cdklocal bootstrap "aws://${LOCALSTACK_ACCOUNT}/${LOCALSTACK_REGION}" 2>&1 | head -20
  elif command -v npx &>/dev/null; then
    npx aws-cdk-local bootstrap "aws://${LOCALSTACK_ACCOUNT}/${LOCALSTACK_REGION}" 2>&1 | head -20
  else
    log_warning "cdklocal not found - skipping bootstrap"
    return 0
  fi
  
  if check_bootstrap_status; then
    log_success "CDK bootstrap complete"
    
    # Save bootstrap status
    mkdir -p "$(dirname "$BOOTSTRAP_CACHE")"
    echo "{\"bootstrapped\": true, \"timestamp\": \"$(date -Iseconds)\", \"account\": \"$LOCALSTACK_ACCOUNT\", \"region\": \"$LOCALSTACK_REGION\"}" > "$BOOTSTRAP_CACHE"
    
    return 0
  else
    log_warning "CDK bootstrap may have failed - continuing anyway"
    return 0
  fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# CACHE WARMUP
# ═══════════════════════════════════════════════════════════════════════════════

setup_npm_cache() {
  log_info "Setting up NPM cache for 20 concurrent agents..."
  
  mkdir -p "$NPM_CACHE_DIR"
  
  # Configure npm to use shared cache
  npm config set cache "$NPM_CACHE_DIR" 2>/dev/null || true
  
  # Pre-install common dependencies
  log_info "Pre-caching common dependencies..."
  
  local common_deps=(
    "aws-cdk-lib"
    "aws-cdk"
    "constructs"
    "@aws-sdk/client-s3"
    "@aws-sdk/client-dynamodb"
    "@aws-sdk/client-lambda"
    "@aws-sdk/client-sqs"
    "@aws-sdk/client-sns"
    "@aws-sdk/client-iam"
    "typescript"
    "jest"
    "@types/jest"
    "@types/node"
    "ts-jest"
    "ts-node"
    "esbuild"
  )
  
  cd /tmp
  
  # Create a temporary package.json to cache dependencies
  cat > package.json << 'EOF'
{
  "name": "cache-warmup",
  "version": "1.0.0",
  "private": true
}
EOF
  
  for dep in "${common_deps[@]}"; do
    log_debug "Caching: $dep"
    npm pack "$dep" --cache "$NPM_CACHE_DIR" 2>/dev/null || true
  done
  
  rm -f package.json package-lock.json *.tgz 2>/dev/null || true
  
  cd "$PROJECT_ROOT"
  
  log_success "NPM cache ready at $NPM_CACHE_DIR"
}

setup_cdk_cache() {
  log_info "Setting up CDK cache..."
  
  mkdir -p "$CDK_CACHE_DIR"
  
  # Set CDK cache environment
  export CDK_HOME="$CDK_CACHE_DIR"
  
  log_success "CDK cache ready at $CDK_CACHE_DIR"
}

# ═══════════════════════════════════════════════════════════════════════════════
# WARMUP - PREPARE FOR 20 CONCURRENT AGENTS
# ═══════════════════════════════════════════════════════════════════════════════

warmup() {
  echo ""
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo "🔥 LOCALSTACK WARMUP FOR 20 CONCURRENT AGENTS"
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo ""
  
  # 1. Check system resources
  log_info "Checking system resources..."
  if ! check_system_resources; then
    log_warning "System resources below recommended levels for 20 agents"
  else
    log_success "System resources OK"
  fi
  echo ""
  
  # 2. Start LocalStack
  log_info "Ensuring LocalStack is running..."
  if ! start_localstack; then
    log_error "Failed to start LocalStack"
    return 1
  fi
  echo ""
  
  # 3. Bootstrap CDK
  if [[ "$PRE_BOOTSTRAP" == "true" ]]; then
    log_info "Pre-bootstrapping CDK..."
    bootstrap_cdk || true
    echo ""
  fi
  
  # 4. Setup caches
  log_info "Setting up dependency caches..."
  setup_npm_cache
  setup_cdk_cache
  echo ""
  
  # 5. Create essential AWS resources for tests
  log_info "Pre-creating common LocalStack resources..."
  
  # Create default S3 bucket for testing
  awslocal s3 mb s3://localstack-warmup-bucket 2>/dev/null || true
  
  # Create default DynamoDB table for testing
  awslocal dynamodb create-table \
    --table-name localstack-warmup-table \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST 2>/dev/null || true
  
  # Create default SQS queue
  awslocal sqs create-queue --queue-name localstack-warmup-queue 2>/dev/null || true
  
  # Create default SNS topic
  awslocal sns create-topic --name localstack-warmup-topic 2>/dev/null || true
  
  log_success "Common resources pre-created"
  echo ""
  
  # Summary
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo "✅ WARMUP COMPLETE"
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo ""
  echo "LocalStack is now ready for 20 concurrent agents!"
  echo ""
  echo "Quick tips for maximum performance:"
  echo "  • Use --no-reset flag with localstack-migrate"
  echo "  • Run batch fixes with: localstack-batch-fix.sh -j 20 PR1 PR2 ..."
  echo "  • Monitor with: ./localstack-watchdog.sh monitor"
  echo ""
  
  return 0
}

# ═══════════════════════════════════════════════════════════════════════════════
# MONITORING LOOP
# ═══════════════════════════════════════════════════════════════════════════════

monitor_loop() {
  echo ""
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo "👁️  LOCALSTACK WATCHDOG MONITOR"
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo ""
  echo "Monitoring LocalStack health every ${HEALTH_CHECK_INTERVAL}s"
  echo "Press Ctrl+C to stop"
  echo ""
  
  local consecutive_failures=0
  local max_failures=3
  
  while true; do
    # Check system resources
    if ! check_system_resources 2>/dev/null; then
      log_warning "Resource constraints detected"
    fi
    
    # Check LocalStack health
    if check_localstack_health 5; then
      local services
      services=$(get_localstack_services)
      log_success "LocalStack healthy - Services: $services"
      consecutive_failures=0
    else
      consecutive_failures=$((consecutive_failures + 1))
      log_error "LocalStack health check failed ($consecutive_failures/$max_failures)"
      
      if [[ "$AUTO_RESTART" == "true" ]] && [[ $consecutive_failures -ge $max_failures ]]; then
        log_warning "Auto-restarting LocalStack..."
        restart_localstack
        consecutive_failures=0
        
        # Re-bootstrap after restart
        if [[ "$PRE_BOOTSTRAP" == "true" ]]; then
          sleep 5
          bootstrap_cdk || true
        fi
      fi
    fi
    
    # Check bootstrap status
    if [[ "$PRE_BOOTSTRAP" == "true" ]] && ! check_bootstrap_status 2>/dev/null; then
      log_warning "CDK bootstrap not found - re-bootstrapping..."
      bootstrap_cdk || true
    fi
    
    sleep "$HEALTH_CHECK_INTERVAL"
  done
}

# ═══════════════════════════════════════════════════════════════════════════════
# STATUS CHECK
# ═══════════════════════════════════════════════════════════════════════════════

show_status() {
  echo ""
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo "📊 LOCALSTACK STATUS"
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo ""
  
  # LocalStack status
  echo "LocalStack:"
  if check_localstack_health 5; then
    echo -e "  Status:   ${GREEN}✅ Running${NC}"
    echo "  Endpoint: $LOCALSTACK_ENDPOINT"
    
    local services
    services=$(get_localstack_services)
    echo "  Services: $services"
    
    # Get version
    local version
    version=$(curl -s "$LOCALSTACK_ENDPOINT/_localstack/info" 2>/dev/null | jq -r '.version // "unknown"' 2>/dev/null || echo "unknown")
    echo "  Version:  $version"
  else
    echo -e "  Status:   ${RED}❌ Not Running${NC}"
  fi
  echo ""
  
  # CDK Bootstrap status
  echo "CDK Bootstrap:"
  if check_bootstrap_status 2>/dev/null; then
    echo -e "  Status:   ${GREEN}✅ Bootstrapped${NC}"
    if [[ -f "$BOOTSTRAP_CACHE" ]]; then
      local bootstrap_time
      bootstrap_time=$(jq -r '.timestamp // "unknown"' "$BOOTSTRAP_CACHE" 2>/dev/null || echo "unknown")
      echo "  Last:     $bootstrap_time"
    fi
  else
    echo -e "  Status:   ${YELLOW}⚠️ Not Bootstrapped${NC}"
  fi
  echo ""
  
  # Cache status
  echo "Caches:"
  if [[ -d "$NPM_CACHE_DIR" ]]; then
    local npm_cache_size
    npm_cache_size=$(du -sh "$NPM_CACHE_DIR" 2>/dev/null | cut -f1 || echo "0")
    echo "  NPM:      $NPM_CACHE_DIR ($npm_cache_size)"
  else
    echo "  NPM:      Not configured"
  fi
  
  if [[ -d "$CDK_CACHE_DIR" ]]; then
    local cdk_cache_size
    cdk_cache_size=$(du -sh "$CDK_CACHE_DIR" 2>/dev/null | cut -f1 || echo "0")
    echo "  CDK:      $CDK_CACHE_DIR ($cdk_cache_size)"
  else
    echo "  CDK:      Not configured"
  fi
  echo ""
  
  # System resources
  echo "System Resources:"
  check_system_resources 2>/dev/null || true
  echo ""
  
  # Watchdog status
  echo "Watchdog:"
  if [[ -f "$WATCHDOG_PID_FILE" ]]; then
    local watchdog_pid
    watchdog_pid=$(cat "$WATCHDOG_PID_FILE")
    if kill -0 "$watchdog_pid" 2>/dev/null; then
      echo -e "  Status:   ${GREEN}✅ Running (PID: $watchdog_pid)${NC}"
    else
      echo -e "  Status:   ${YELLOW}⚠️ Stale PID file${NC}"
    fi
  else
    echo -e "  Status:   ${YELLOW}⚠️ Not Running${NC}"
  fi
  echo ""
  
  echo "═══════════════════════════════════════════════════════════════════════════════"
}

# ═══════════════════════════════════════════════════════════════════════════════
# QUICK HEALTH CHECK
# ═══════════════════════════════════════════════════════════════════════════════

quick_health() {
  if check_localstack_health 5; then
    echo -e "${GREEN}✅ LocalStack is healthy${NC}"
    return 0
  else
    echo -e "${RED}❌ LocalStack is not healthy${NC}"
    return 1
  fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

main() {
  local command="${1:-help}"
  
  case "$command" in
    start)
      start_localstack
      if [[ "$PRE_BOOTSTRAP" == "true" ]]; then
        sleep 3
        bootstrap_cdk || true
      fi
      ;;
    stop)
      stop_localstack
      ;;
    restart)
      restart_localstack
      if [[ "$PRE_BOOTSTRAP" == "true" ]]; then
        sleep 3
        bootstrap_cdk || true
      fi
      ;;
    status)
      show_status
      ;;
    health)
      quick_health
      ;;
    warmup)
      warmup
      ;;
    bootstrap)
      bootstrap_cdk
      ;;
    monitor)
      monitor_loop
      ;;
    cache)
      setup_npm_cache
      setup_cdk_cache
      ;;
    help|--help|-h)
      echo "LocalStack Watchdog & Warmup Script"
      echo ""
      echo "Usage: $0 <command>"
      echo ""
      echo "Commands:"
      echo "  start     Start LocalStack daemon with pre-bootstrap"
      echo "  stop      Stop LocalStack daemon"
      echo "  restart   Restart LocalStack daemon"
      echo "  status    Show detailed status"
      echo "  health    Quick health check"
      echo "  warmup    Full warmup for 20 concurrent agents"
      echo "  bootstrap Bootstrap CDK for LocalStack"
      echo "  cache     Setup NPM and CDK caches"
      echo "  monitor   Run continuous monitoring (foreground)"
      echo "  help      Show this help"
      echo ""
      echo "For 20 concurrent agents, run:"
      echo "  $0 warmup"
      echo ""
      ;;
    *)
      log_error "Unknown command: $command"
      echo "Run '$0 help' for usage"
      exit 1
      ;;
  esac
}

main "$@"


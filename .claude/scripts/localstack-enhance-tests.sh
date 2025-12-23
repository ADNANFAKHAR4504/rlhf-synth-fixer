#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# LocalStack Test Enhancement Script (Enhancement #9)
# ═══════════════════════════════════════════════════════════════════════════════
# Purpose: Auto-enhance integration tests for LocalStack compatibility
#
# Usage:
#   ./localstack-enhance-tests.sh <task_path>
#   ./localstack-enhance-tests.sh ./worktree/localstack-Pr7179
#   ./localstack-enhance-tests.sh --analyze <task_path>    # Analysis only
#   ./localstack-enhance-tests.sh --fix <task_path>        # Apply fixes
#
# Exit codes:
#   0 = Success / No changes needed
#   1 = Changes applied
#   2 = Error
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Timeout settings
DEFAULT_TIMEOUT=30000
DEPLOYMENT_TIMEOUT=60000
API_TIMEOUT=10000

# Retry settings
MAX_RETRIES=3
RETRY_DELAY=1000

# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

log_header() {
  echo ""
  echo -e "${BOLD}${CYAN}$1${NC}"
  echo -e "${CYAN}$(printf '═%.0s' {1..60})${NC}"
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

log_fix() {
  echo -e "${GREEN}🔧 $1${NC}"
}

# Detect test framework
detect_test_framework() {
  local task_path="$1"
  
  if [[ -f "$task_path/package.json" ]]; then
    if grep -q '"jest"' "$task_path/package.json" 2>/dev/null; then
      echo "jest"
      return
    fi
    if grep -q '"mocha"' "$task_path/package.json" 2>/dev/null; then
      echo "mocha"
      return
    fi
  fi
  
  if [[ -f "$task_path/pytest.ini" ]] || [[ -f "$task_path/pyproject.toml" ]]; then
    if grep -q 'pytest' "$task_path/pyproject.toml" 2>/dev/null; then
      echo "pytest"
      return
    fi
  fi
  
  if [[ -d "$task_path/tests" ]] && ls "$task_path/tests"/*.py &>/dev/null; then
    echo "pytest"
    return
  fi
  
  if [[ -f "$task_path/go.mod" ]]; then
    echo "go-test"
    return
  fi
  
  echo "unknown"
}

# Detect language
detect_language() {
  local task_path="$1"
  
  if [[ -f "$task_path/tsconfig.json" ]]; then
    echo "typescript"
  elif [[ -f "$task_path/package.json" ]]; then
    echo "javascript"
  elif [[ -f "$task_path/Pipfile" ]] || [[ -f "$task_path/requirements.txt" ]]; then
    echo "python"
  elif [[ -f "$task_path/go.mod" ]]; then
    echo "go"
  else
    echo "unknown"
  fi
}

# Find test files
find_test_files() {
  local task_path="$1"
  local language="$2"
  
  case "$language" in
    typescript|javascript)
      find "$task_path" -type f \( -name "*.test.ts" -o -name "*.test.js" -o -name "*.int.test.ts" -o -name "*.int.test.js" \) 2>/dev/null
      ;;
    python)
      find "$task_path" -type f -name "test_*.py" -o -name "*_test.py" 2>/dev/null
      ;;
    go)
      find "$task_path" -type f -name "*_test.go" 2>/dev/null
      ;;
  esac
}

# Check if file has LocalStack configuration
has_localstack_config() {
  local file="$1"
  
  if grep -qE "(localhost:4566|LOCALSTACK|localstack|forcePathStyle|s3ForcePathStyle)" "$file" 2>/dev/null; then
    return 0
  fi
  return 1
}

# Check if file has retry logic
has_retry_logic() {
  local file="$1"
  
  if grep -qE "(retry|withRetry|retryable|maxRetries)" "$file" 2>/dev/null; then
    return 0
  fi
  return 1
}

# Check if file has proper timeouts
has_proper_timeouts() {
  local file="$1"
  
  if grep -qE "(timeout.*[0-9]{4,}|jest\.setTimeout)" "$file" 2>/dev/null; then
    return 0
  fi
  return 1
}

# Check if file has cleanup hooks
has_cleanup_hooks() {
  local file="$1"
  
  if grep -qE "(afterAll|afterEach|teardown|cleanup)" "$file" 2>/dev/null; then
    return 0
  fi
  return 1
}

# ═══════════════════════════════════════════════════════════════════════════════
# TEST ENHANCEMENT CODE SNIPPETS
# ═══════════════════════════════════════════════════════════════════════════════

# TypeScript/JavaScript LocalStack config
TS_LOCALSTACK_CONFIG='
// LocalStack configuration
const isLocalStack = process.env.LOCALSTACK_HOSTNAME || process.env.AWS_ENDPOINT_URL;
const localstackEndpoint = isLocalStack ? "http://localhost:4566" : undefined;

const getLocalStackConfig = () => ({
  endpoint: localstackEndpoint,
  region: "us-east-1",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
  forcePathStyle: true, // Required for S3 on LocalStack
});
'

# TypeScript/JavaScript retry helper
TS_RETRY_HELPER='
// Retry helper for flaky LocalStack operations
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`Retry ${i + 1}/${maxRetries} after error:`, (error as Error).message);
      await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
    }
  }
  throw new Error("Max retries exceeded");
}
'

# TypeScript/JavaScript setup hook
TS_SETUP_HOOK='
// LocalStack test setup
beforeAll(async () => {
  // Increase timeout for LocalStack operations
  jest.setTimeout(60000);
  
  // Wait for LocalStack to be ready
  const maxRetries = 10;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch("http://localhost:4566/_localstack/health");
      if (response.ok) {
        console.log("LocalStack is ready");
        break;
      }
    } catch (e) {
      if (i === maxRetries - 1) {
        throw new Error("LocalStack not ready after " + maxRetries + " attempts");
      }
      console.log(`Waiting for LocalStack... (${i + 1}/${maxRetries})`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
});
'

# TypeScript/JavaScript cleanup hook
TS_CLEANUP_HOOK='
// LocalStack test cleanup
afterAll(async () => {
  // Clean up any test resources
  try {
    // Add cleanup code here if needed
    console.log("Test cleanup completed");
  } catch (e) {
    console.warn("Cleanup warning:", (e as Error).message);
  }
});
'

# Python LocalStack config
PY_LOCALSTACK_CONFIG='
# LocalStack configuration
import os
import boto3
from botocore.config import Config

IS_LOCALSTACK = os.environ.get("LOCALSTACK_HOSTNAME") or os.environ.get("AWS_ENDPOINT_URL")
LOCALSTACK_ENDPOINT = "http://localhost:4566" if IS_LOCALSTACK else None

def get_localstack_client(service_name: str):
    """Get boto3 client configured for LocalStack."""
    config = Config(
        retries={"max_attempts": 3, "mode": "standard"}
    )
    return boto3.client(
        service_name,
        endpoint_url=LOCALSTACK_ENDPOINT,
        region_name="us-east-1",
        aws_access_key_id="test",
        aws_secret_access_key="test",
        config=config,
    )

def get_localstack_resource(service_name: str):
    """Get boto3 resource configured for LocalStack."""
    return boto3.resource(
        service_name,
        endpoint_url=LOCALSTACK_ENDPOINT,
        region_name="us-east-1",
        aws_access_key_id="test",
        aws_secret_access_key="test",
    )
'

# Python retry decorator
PY_RETRY_DECORATOR='
# Retry decorator for flaky operations
import time
from functools import wraps

def with_retry(max_retries: int = 3, delay: float = 1.0, backoff: float = 2.0):
    """Decorator to retry a function on failure."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_error = None
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_error = e
                    if attempt < max_retries - 1:
                        sleep_time = delay * (backoff ** attempt)
                        print(f"Retry {attempt + 1}/{max_retries} after {sleep_time}s: {e}")
                        time.sleep(sleep_time)
            raise last_error
        return wrapper
    return decorator
'

# Python setup fixture
PY_SETUP_FIXTURE='
# LocalStack test fixtures
import pytest
import requests
import time

@pytest.fixture(scope="session", autouse=True)
def wait_for_localstack():
    """Wait for LocalStack to be ready before running tests."""
    max_retries = 10
    for i in range(max_retries):
        try:
            response = requests.get("http://localhost:4566/_localstack/health", timeout=5)
            if response.ok:
                print("LocalStack is ready")
                break
        except Exception as e:
            if i == max_retries - 1:
                pytest.fail(f"LocalStack not ready after {max_retries} attempts")
            print(f"Waiting for LocalStack... ({i + 1}/{max_retries})")
            time.sleep(2)
    yield
    # Cleanup after all tests
    print("Test session completed")
'

# ═══════════════════════════════════════════════════════════════════════════════
# ANALYSIS FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

analyze_test_file() {
  local file="$1"
  local issues=()
  
  # Check for LocalStack config
  if ! has_localstack_config "$file"; then
    issues+=("missing_localstack_config")
  fi
  
  # Check for retry logic
  if ! has_retry_logic "$file"; then
    issues+=("missing_retry_logic")
  fi
  
  # Check for proper timeouts
  if ! has_proper_timeouts "$file"; then
    issues+=("missing_timeouts")
  fi
  
  # Check for cleanup hooks
  if ! has_cleanup_hooks "$file"; then
    issues+=("missing_cleanup")
  fi
  
  echo "${issues[@]}"
}

analyze_all_tests() {
  local task_path="$1"
  local language=$(detect_language "$task_path")
  local framework=$(detect_test_framework "$task_path")
  
  log_header "🔍 Test Analysis"
  echo ""
  log_info "Language: $language"
  log_info "Framework: $framework"
  echo ""
  
  local test_files=$(find_test_files "$task_path" "$language")
  local total_files=0
  local files_with_issues=0
  
  if [[ -z "$test_files" ]]; then
    log_warning "No test files found"
    return 0
  fi
  
  echo -e "${BOLD}Test Files:${NC}"
  echo ""
  
  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    total_files=$((total_files + 1))
    
    local relative_path="${file#$task_path/}"
    local issues=$(analyze_test_file "$file")
    
    if [[ -n "$issues" ]]; then
      files_with_issues=$((files_with_issues + 1))
      echo -e "  ${YELLOW}⚠️${NC}  $relative_path"
      for issue in $issues; do
        case "$issue" in
          "missing_localstack_config")
            echo -e "      ${RED}•${NC} Missing LocalStack endpoint configuration"
            ;;
          "missing_retry_logic")
            echo -e "      ${RED}•${NC} Missing retry logic for flaky operations"
            ;;
          "missing_timeouts")
            echo -e "      ${RED}•${NC} Missing proper timeouts (should be 30s+)"
            ;;
          "missing_cleanup")
            echo -e "      ${RED}•${NC} Missing cleanup hooks (afterAll/afterEach)"
            ;;
        esac
      done
    else
      echo -e "  ${GREEN}✅${NC} $relative_path"
    fi
  done <<< "$test_files"
  
  echo ""
  echo -e "${BOLD}Summary:${NC}"
  echo "  Total test files: $total_files"
  echo "  Files with issues: $files_with_issues"
  
  if [[ $files_with_issues -gt 0 ]]; then
    echo ""
    echo -e "${YELLOW}Run with --fix to apply automatic enhancements${NC}"
    return 1
  else
    log_success "All test files have LocalStack enhancements"
    return 0
  fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# FIX FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

# Create test helper file for TypeScript/JavaScript
create_ts_test_helper() {
  local task_path="$1"
  local test_dir="$task_path/test"
  
  [[ ! -d "$test_dir" ]] && test_dir="$task_path/tests"
  [[ ! -d "$test_dir" ]] && mkdir -p "$task_path/test" && test_dir="$task_path/test"
  
  local helper_file="$test_dir/localstack-helpers.ts"
  
  if [[ -f "$helper_file" ]]; then
    log_info "Helper file already exists: $helper_file"
    return 0
  fi
  
  log_fix "Creating test helper: $helper_file"
  
  cat > "$helper_file" << 'EOF'
/**
 * LocalStack Test Helpers
 * Auto-generated by localstack-enhance-tests.sh
 */

// LocalStack configuration
export const isLocalStack = process.env.LOCALSTACK_HOSTNAME || process.env.AWS_ENDPOINT_URL;
export const localstackEndpoint = isLocalStack ? "http://localhost:4566" : undefined;

/**
 * Get AWS client configuration for LocalStack
 */
export const getLocalStackConfig = () => ({
  endpoint: localstackEndpoint,
  region: "us-east-1",
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
  forcePathStyle: true, // Required for S3 on LocalStack
});

/**
 * Retry helper for flaky LocalStack operations
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`Retry ${i + 1}/${maxRetries} after error:`, (error as Error).message);
      await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
    }
  }
  throw new Error("Max retries exceeded");
}

/**
 * Wait for LocalStack to be healthy
 */
export async function waitForLocalStack(maxRetries = 10): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch("http://localhost:4566/_localstack/health");
      if (response.ok) {
        console.log("LocalStack is ready");
        return;
      }
    } catch (e) {
      if (i === maxRetries - 1) {
        throw new Error(`LocalStack not ready after ${maxRetries} attempts`);
      }
      console.log(`Waiting for LocalStack... (${i + 1}/${maxRetries})`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

/**
 * Common test timeouts for LocalStack
 */
export const TIMEOUTS = {
  DEFAULT: 30000,
  DEPLOYMENT: 60000,
  API_CALL: 10000,
};
EOF

  log_success "Created: $helper_file"
}

# Create test helper file for Python
create_py_test_helper() {
  local task_path="$1"
  local test_dir="$task_path/tests"
  
  [[ ! -d "$test_dir" ]] && test_dir="$task_path/test"
  [[ ! -d "$test_dir" ]] && mkdir -p "$task_path/tests" && test_dir="$task_path/tests"
  
  local helper_file="$test_dir/localstack_helpers.py"
  
  if [[ -f "$helper_file" ]]; then
    log_info "Helper file already exists: $helper_file"
    return 0
  fi
  
  log_fix "Creating test helper: $helper_file"
  
  cat > "$helper_file" << 'EOF'
"""
LocalStack Test Helpers
Auto-generated by localstack-enhance-tests.sh
"""

import os
import time
from functools import wraps
from typing import Any, Callable, TypeVar

import boto3
import requests
from botocore.config import Config

# Type variable for generic return type
T = TypeVar('T')

# LocalStack configuration
IS_LOCALSTACK = os.environ.get("LOCALSTACK_HOSTNAME") or os.environ.get("AWS_ENDPOINT_URL")
LOCALSTACK_ENDPOINT = "http://localhost:4566" if IS_LOCALSTACK else None


def get_localstack_client(service_name: str):
    """Get boto3 client configured for LocalStack."""
    config = Config(
        retries={"max_attempts": 3, "mode": "standard"}
    )
    return boto3.client(
        service_name,
        endpoint_url=LOCALSTACK_ENDPOINT,
        region_name="us-east-1",
        aws_access_key_id="test",
        aws_secret_access_key="test",
        config=config,
    )


def get_localstack_resource(service_name: str):
    """Get boto3 resource configured for LocalStack."""
    return boto3.resource(
        service_name,
        endpoint_url=LOCALSTACK_ENDPOINT,
        region_name="us-east-1",
        aws_access_key_id="test",
        aws_secret_access_key="test",
    )


def with_retry(
    max_retries: int = 3,
    delay: float = 1.0,
    backoff: float = 2.0
) -> Callable[[Callable[..., T]], Callable[..., T]]:
    """Decorator to retry a function on failure."""
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            last_error: Exception = Exception("Unknown error")
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_error = e
                    if attempt < max_retries - 1:
                        sleep_time = delay * (backoff ** attempt)
                        print(f"Retry {attempt + 1}/{max_retries} after {sleep_time}s: {e}")
                        time.sleep(sleep_time)
            raise last_error
        return wrapper
    return decorator


def wait_for_localstack(max_retries: int = 10) -> None:
    """Wait for LocalStack to be healthy."""
    for i in range(max_retries):
        try:
            response = requests.get(
                "http://localhost:4566/_localstack/health",
                timeout=5
            )
            if response.ok:
                print("LocalStack is ready")
                return
        except Exception as e:
            if i == max_retries - 1:
                raise RuntimeError(f"LocalStack not ready after {max_retries} attempts")
            print(f"Waiting for LocalStack... ({i + 1}/{max_retries})")
            time.sleep(2)


# Common test timeouts (in seconds)
class TIMEOUTS:
    DEFAULT = 30
    DEPLOYMENT = 60
    API_CALL = 10
EOF

  log_success "Created: $helper_file"
}

# Create conftest.py for pytest
create_py_conftest() {
  local task_path="$1"
  local test_dir="$task_path/tests"
  
  [[ ! -d "$test_dir" ]] && test_dir="$task_path/test"
  [[ ! -d "$test_dir" ]] && return 0
  
  local conftest_file="$test_dir/conftest.py"
  
  # Check if conftest already has LocalStack setup
  if [[ -f "$conftest_file" ]] && grep -q "localstack" "$conftest_file" 2>/dev/null; then
    log_info "conftest.py already has LocalStack configuration"
    return 0
  fi
  
  log_fix "Updating conftest.py with LocalStack fixtures"
  
  local fixture_code='
# LocalStack fixtures (auto-generated)
import pytest
from .localstack_helpers import wait_for_localstack

@pytest.fixture(scope="session", autouse=True)
def localstack_ready():
    """Wait for LocalStack to be ready before running tests."""
    wait_for_localstack(max_retries=10)
    yield
    print("Test session completed")
'

  if [[ -f "$conftest_file" ]]; then
    # Append to existing file
    echo "$fixture_code" >> "$conftest_file"
  else
    # Create new file
    cat > "$conftest_file" << 'EOF'
"""
Pytest configuration and fixtures
Auto-generated by localstack-enhance-tests.sh
"""
EOF
    echo "$fixture_code" >> "$conftest_file"
  fi
  
  log_success "Updated: $conftest_file"
}

# Update jest.config.js with proper timeouts
update_jest_config() {
  local task_path="$1"
  local jest_config="$task_path/jest.config.js"
  
  if [[ ! -f "$jest_config" ]]; then
    log_info "No jest.config.js found"
    return 0
  fi
  
  # Check if testTimeout is already set
  if grep -q "testTimeout" "$jest_config" 2>/dev/null; then
    log_info "jest.config.js already has testTimeout"
    return 0
  fi
  
  log_fix "Updating jest.config.js with LocalStack timeouts"
  
  # Add testTimeout if not present
  if grep -q "module.exports" "$jest_config"; then
    sed -i '' 's/module.exports = {/module.exports = {\n  testTimeout: 60000, \/\/ LocalStack needs longer timeouts/' "$jest_config" 2>/dev/null || \
    sed -i 's/module.exports = {/module.exports = {\n  testTimeout: 60000, \/\/ LocalStack needs longer timeouts/' "$jest_config"
    log_success "Updated: $jest_config"
  fi
}

apply_fixes() {
  local task_path="$1"
  local language=$(detect_language "$task_path")
  local changes_made=0
  
  log_header "🔧 Applying Test Enhancements"
  echo ""
  log_info "Language: $language"
  echo ""
  
  case "$language" in
    typescript|javascript)
      create_ts_test_helper "$task_path" && changes_made=1
      update_jest_config "$task_path" && changes_made=1
      ;;
    python)
      create_py_test_helper "$task_path" && changes_made=1
      create_py_conftest "$task_path" && changes_made=1
      ;;
    go)
      log_warning "Go test enhancement not yet implemented"
      ;;
    *)
      log_warning "Unknown language - no automatic fixes available"
      ;;
  esac
  
  if [[ $changes_made -gt 0 ]]; then
    echo ""
    log_success "Test enhancements applied"
    echo ""
    echo -e "${BOLD}Next steps:${NC}"
    echo "  1. Import the helper functions in your test files"
    echo "  2. Use withRetry() for flaky operations"
    echo "  3. Use getLocalStackConfig() for AWS clients"
    return 1
  else
    log_info "No changes needed"
    return 0
  fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════════════════════

MODE="analyze"
TASK_PATH=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --analyze|-a)
      MODE="analyze"
      shift
      ;;
    --fix|-f)
      MODE="fix"
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS] <task_path>"
      echo ""
      echo "Options:"
      echo "  --analyze, -a   Analyze test files (default)"
      echo "  --fix, -f       Apply automatic enhancements"
      echo "  --help, -h      Show this help"
      echo ""
      echo "Examples:"
      echo "  $0 ./worktree/localstack-Pr7179"
      echo "  $0 --fix ./worktree/localstack-Pr7179"
      exit 0
      ;;
    *)
      TASK_PATH="$1"
      shift
      ;;
  esac
done

if [[ -z "$TASK_PATH" ]]; then
  echo "Usage: $0 [OPTIONS] <task_path>"
  exit 2
fi

if [[ ! -d "$TASK_PATH" ]]; then
  log_error "Directory not found: $TASK_PATH"
  exit 2
fi

case "$MODE" in
  "analyze")
    analyze_all_tests "$TASK_PATH"
    ;;
  "fix")
    apply_fixes "$TASK_PATH"
    ;;
esac


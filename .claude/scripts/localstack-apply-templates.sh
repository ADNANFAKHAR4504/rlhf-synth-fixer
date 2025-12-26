#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# LocalStack Fix Templates Applicator
# ═══════════════════════════════════════════════════════════════════════════════
# Purpose: Automatically apply fix templates based on platform, language, and errors
#
# Features:
#   - Auto-detect platform and language
#   - Apply relevant templates from .claude/templates/localstack-fixes/
#   - Smart template selection based on detected services
#   - Batch application of multiple fixes
#
# Usage:
#   ./localstack-apply-templates.sh <work_dir>           # Auto-detect and apply
#   ./localstack-apply-templates.sh <work_dir> --all     # Apply all applicable templates
#   ./localstack-apply-templates.sh <work_dir> --list    # List available templates
#   ./localstack-apply-templates.sh <work_dir> --check   # Check which templates would apply
#
# Exit codes:
#   0 = Success
#   1 = No templates applied
#   2 = Error
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TEMPLATES_DIR="$PROJECT_ROOT/.claude/templates/localstack-fixes"

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
  echo -e "${BLUE}[TEMPLATE] ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}[TEMPLATE] ✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}[TEMPLATE] ⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}[TEMPLATE] ❌ $1${NC}"
}

# ═══════════════════════════════════════════════════════════════════════════════
# PLATFORM/LANGUAGE DETECTION
# ═══════════════════════════════════════════════════════════════════════════════

detect_platform() {
  local work_dir="$1"
  
  if [[ -f "$work_dir/metadata.json" ]]; then
    jq -r '.platform // "unknown"' "$work_dir/metadata.json" 2>/dev/null
    return
  fi
  
  if [[ -f "$work_dir/cdk.json" ]]; then
    echo "cdk"
  elif [[ -f "$work_dir/Pulumi.yaml" ]]; then
    echo "pulumi"
  elif [[ -f "$work_dir/lib/main.tf" ]] || [[ -f "$work_dir/main.tf" ]]; then
    echo "tf"
  elif [[ -f "$work_dir/lib/TapStack.yml" ]] || [[ -f "$work_dir/lib/TapStack.yaml" ]]; then
    echo "cfn"
  else
    echo "unknown"
  fi
}

detect_language() {
  local work_dir="$1"
  
  if [[ -f "$work_dir/metadata.json" ]]; then
    jq -r '.language // "unknown"' "$work_dir/metadata.json" 2>/dev/null
    return
  fi
  
  if [[ -f "$work_dir/package.json" ]]; then
    if grep -q '"typescript"' "$work_dir/package.json" 2>/dev/null; then
      echo "ts"
    else
      echo "js"
    fi
  elif [[ -f "$work_dir/requirements.txt" ]] || [[ -f "$work_dir/pyproject.toml" ]]; then
    echo "py"
  elif [[ -f "$work_dir/go.mod" ]]; then
    echo "go"
  elif [[ -f "$work_dir/pom.xml" ]]; then
    echo "java"
  else
    echo "unknown"
  fi
}

detect_services() {
  local work_dir="$1"
  local services=()
  
  # Check metadata.json first
  if [[ -f "$work_dir/metadata.json" ]]; then
    local meta_services
    meta_services=$(jq -r '.aws_services[]? // empty' "$work_dir/metadata.json" 2>/dev/null | tr '[:upper:]' '[:lower:]')
    if [[ -n "$meta_services" ]]; then
      echo "$meta_services"
      return
    fi
  fi
  
  # Scan source files
  local source_dir="$work_dir/lib"
  [[ ! -d "$source_dir" ]] && source_dir="$work_dir"
  
  # Check for S3
  if grep -rq -E 'Bucket|s3\.|aws_s3' "$source_dir" 2>/dev/null; then
    services+=("s3")
  fi
  
  # Check for DynamoDB
  if grep -rq -E 'Table|dynamodb\.|aws_dynamodb' "$source_dir" 2>/dev/null; then
    services+=("dynamodb")
  fi
  
  # Check for Lambda
  if grep -rq -E 'Function|lambda\.|aws_lambda' "$source_dir" 2>/dev/null; then
    services+=("lambda")
  fi
  
  # Check for SQS
  if grep -rq -E 'Queue|sqs\.|aws_sqs' "$source_dir" 2>/dev/null; then
    services+=("sqs")
  fi
  
  # Check for SNS
  if grep -rq -E 'Topic|sns\.|aws_sns' "$source_dir" 2>/dev/null; then
    services+=("sns")
  fi
  
  # Check for API Gateway
  if grep -rq -E 'RestApi|HttpApi|apigateway|aws_api_gateway' "$source_dir" 2>/dev/null; then
    services+=("apigateway")
  fi
  
  # Check for IAM
  if grep -rq -E 'Role|Policy|iam\.|aws_iam' "$source_dir" 2>/dev/null; then
    services+=("iam")
  fi
  
  # Check for KMS
  if grep -rq -E 'Key|kms\.|aws_kms|encryption' "$source_dir" 2>/dev/null; then
    services+=("kms")
  fi
  
  printf '%s\n' "${services[@]}"
}

# ═══════════════════════════════════════════════════════════════════════════════
# TEMPLATE MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

list_templates() {
  echo ""
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo "📋 AVAILABLE FIX TEMPLATES"
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo ""
  
  if [[ ! -d "$TEMPLATES_DIR" ]]; then
    log_warning "Templates directory not found: $TEMPLATES_DIR"
    return 1
  fi
  
  echo "Directory: $TEMPLATES_DIR"
  echo ""
  
  for template in "$TEMPLATES_DIR"/*; do
    if [[ -f "$template" ]]; then
      local name
      name=$(basename "$template")
      local desc=""
      
      # Extract description from first comment line
      if [[ "$name" == *.ts ]] || [[ "$name" == *.js ]]; then
        desc=$(head -5 "$template" | grep -E '^\s*\*' | head -1 | sed 's/.*\* //' || echo "")
      elif [[ "$name" == *.tf ]]; then
        desc=$(head -3 "$template" | grep -E '^#' | head -1 | sed 's/# //' || echo "")
      elif [[ "$name" == *.yaml ]] || [[ "$name" == *.yml ]]; then
        desc=$(head -3 "$template" | grep -E '^#' | head -1 | sed 's/# //' || echo "")
      fi
      
      echo "  📄 $name"
      [[ -n "$desc" ]] && echo "     $desc"
    fi
  done
  
  echo ""
}

get_applicable_templates() {
  local work_dir="$1"
  local platform="$2"
  local language="$3"
  
  local templates=()
  
  # Platform-language specific templates
  case "${platform}-${language}" in
    cdk-ts)
      templates+=("cdk-ts-endpoint.ts" "cdk-ts-s3-bucket.ts")
      ;;
    cdk-py)
      templates+=("cdk-py-endpoint.py" "cdk-py-s3-bucket.py")
      ;;
    tf-hcl)
      templates+=("tf-hcl-provider.tf")
      ;;
    cfn-yaml)
      templates+=("cfn-yaml-parameters.yaml")
      ;;
    cfn-json)
      templates+=("cfn-json-parameters.json")
      ;;
    pulumi-ts)
      templates+=("pulumi-ts-config.ts")
      ;;
    pulumi-py)
      templates+=("pulumi-py-config.py")
      ;;
  esac
  
  # Filter to only existing templates
  for tmpl in "${templates[@]}"; do
    if [[ -f "$TEMPLATES_DIR/$tmpl" ]]; then
      echo "$tmpl"
    fi
  done
}

# ═══════════════════════════════════════════════════════════════════════════════
# TEMPLATE APPLICATION
# ═══════════════════════════════════════════════════════════════════════════════

apply_cdk_ts_endpoint() {
  local work_dir="$1"
  local lib_dir="$work_dir/lib"
  
  [[ ! -d "$lib_dir" ]] && mkdir -p "$lib_dir"
  
  local target_file="$lib_dir/localstack-config.ts"
  
  if [[ ! -f "$target_file" ]]; then
    log_info "Creating $target_file..."
    cp "$TEMPLATES_DIR/cdk-ts-endpoint.ts" "$target_file"
    log_success "Applied cdk-ts-endpoint template"
    return 0
  else
    log_info "LocalStack config already exists"
    return 0
  fi
}

apply_cdk_ts_s3_bucket() {
  local work_dir="$1"
  local lib_dir="$work_dir/lib"
  
  [[ ! -d "$lib_dir" ]] && mkdir -p "$lib_dir"
  
  # Check if S3 is used
  if ! grep -rq -E 'Bucket|s3\.' "$lib_dir" 2>/dev/null; then
    log_info "S3 not detected - skipping s3-bucket template"
    return 0
  fi
  
  local target_file="$lib_dir/localstack-s3-helper.ts"
  
  if [[ ! -f "$target_file" ]]; then
    log_info "Creating $target_file..."
    cp "$TEMPLATES_DIR/cdk-ts-s3-bucket.ts" "$target_file"
    log_success "Applied cdk-ts-s3-bucket template"
    return 0
  fi
}

apply_tf_provider() {
  local work_dir="$1"
  local lib_dir="$work_dir/lib"
  
  [[ ! -d "$lib_dir" ]] && lib_dir="$work_dir"
  
  # Check if provider.tf or main.tf has LocalStack config
  local has_localstack=false
  for tf_file in "$lib_dir"/*.tf; do
    if [[ -f "$tf_file" ]] && grep -q 'localhost:4566\|localstack' "$tf_file" 2>/dev/null; then
      has_localstack=true
      break
    fi
  done
  
  if [[ "$has_localstack" == "false" ]]; then
    local target_file="$lib_dir/localstack-provider.tf"
    log_info "Creating $target_file..."
    cp "$TEMPLATES_DIR/tf-hcl-provider.tf" "$target_file"
    log_success "Applied tf-hcl-provider template"
  else
    log_info "LocalStack provider already configured"
  fi
}

apply_cfn_parameters() {
  local work_dir="$1"
  local lib_dir="$work_dir/lib"
  
  [[ ! -d "$lib_dir" ]] && lib_dir="$work_dir"
  
  # Find CFN template
  local cfn_template=""
  for tmpl in "$lib_dir"/TapStack.yml "$lib_dir"/TapStack.yaml "$lib_dir"/template.yml "$lib_dir"/template.yaml; do
    if [[ -f "$tmpl" ]]; then
      cfn_template="$tmpl"
      break
    fi
  done
  
  if [[ -z "$cfn_template" ]]; then
    log_warning "No CloudFormation template found"
    return 1
  fi
  
  # Check if LocalStack parameters exist
  if grep -q 'IsLocalStack\|LocalStackEndpoint' "$cfn_template" 2>/dev/null; then
    log_info "LocalStack parameters already configured"
    return 0
  fi
  
  # Insert parameters at the beginning of Parameters section
  log_info "Adding LocalStack parameters to $cfn_template..."
  
  # This is a simplified version - full implementation would use yq
  if command -v yq &>/dev/null; then
    # Create backup
    cp "$cfn_template" "${cfn_template}.bak"
    
    # Add parameters using yq
    yq -i '.Parameters.IsLocalStack = {"Type": "String", "Default": "false", "AllowedValues": ["true", "false"]}' "$cfn_template" 2>/dev/null || true
    
    log_success "Applied cfn-yaml-parameters template"
  else
    log_warning "yq not installed - manual parameter addition may be needed"
  fi
}

apply_pulumi_config() {
  local work_dir="$1"
  local lib_dir="$work_dir/lib"
  
  [[ ! -d "$lib_dir" ]] && lib_dir="$work_dir"
  
  # Check for existing LocalStack config
  if grep -rq 'localhost:4566\|localstack' "$lib_dir"/*.ts 2>/dev/null; then
    log_info "LocalStack config already present"
    return 0
  fi
  
  local target_file="$lib_dir/localstack-config.ts"
  
  if [[ ! -f "$target_file" ]]; then
    log_info "Creating $target_file..."
    cp "$TEMPLATES_DIR/pulumi-ts-config.ts" "$target_file"
    log_success "Applied pulumi-ts-config template"
  fi
}

apply_template() {
  local work_dir="$1"
  local template="$2"
  local platform="$3"
  local language="$4"
  
  log_info "Applying template: $template"
  
  case "$template" in
    cdk-ts-endpoint.ts)
      apply_cdk_ts_endpoint "$work_dir"
      ;;
    cdk-ts-s3-bucket.ts)
      apply_cdk_ts_s3_bucket "$work_dir"
      ;;
    tf-hcl-provider.tf)
      apply_tf_provider "$work_dir"
      ;;
    cfn-yaml-parameters.yaml)
      apply_cfn_parameters "$work_dir"
      ;;
    pulumi-ts-config.ts)
      apply_pulumi_config "$work_dir"
      ;;
    *)
      log_warning "No applicator for template: $template"
      return 1
      ;;
  esac
}

# ═══════════════════════════════════════════════════════════════════════════════
# INLINE FIX APPLICATION (Direct code modifications)
# ═══════════════════════════════════════════════════════════════════════════════

apply_removal_policy_fixes() {
  local work_dir="$1"
  local platform="$2"
  local language="$3"
  
  if [[ "$platform" != "cdk" ]]; then
    return 0
  fi
  
  log_info "Applying RemovalPolicy.DESTROY fixes..."
  
  local lib_dir="$work_dir/lib"
  [[ ! -d "$lib_dir" ]] && return 0
  
  local fixed=0
  
  for ts_file in "$lib_dir"/*.ts; do
    [[ ! -f "$ts_file" ]] && continue
    
    # Check if RemovalPolicy import exists
    if grep -q 'RemovalPolicy' "$ts_file" 2>/dev/null; then
      # Replace RETAIN with DESTROY for LocalStack
      if grep -q 'RemovalPolicy.RETAIN' "$ts_file" 2>/dev/null; then
        sed -i.bak 's/RemovalPolicy.RETAIN/RemovalPolicy.DESTROY/g' "$ts_file"
        rm -f "${ts_file}.bak"
        fixed=$((fixed + 1))
      fi
    fi
    
    # Add removalPolicy: cdk.RemovalPolicy.DESTROY to resources that don't have it
    # This is a simplified check - full implementation would be more sophisticated
  done
  
  if [[ $fixed -gt 0 ]]; then
    log_success "Fixed RemovalPolicy in $fixed files"
  fi
}

apply_s3_path_style_fixes() {
  local work_dir="$1"
  local platform="$2"
  local language="$3"
  
  log_info "Checking S3 path-style access..."
  
  local test_dir="$work_dir/test"
  [[ ! -d "$test_dir" ]] && return 0
  
  local fixed=0
  
  for test_file in "$test_dir"/*.ts "$test_dir"/*.js; do
    [[ ! -f "$test_file" ]] && continue
    
    # Check for S3Client without forcePathStyle
    if grep -q 'S3Client' "$test_file" 2>/dev/null; then
      if ! grep -q 'forcePathStyle.*true' "$test_file" 2>/dev/null; then
        log_warning "S3Client may need forcePathStyle: true in $test_file"
        fixed=$((fixed + 1))
      fi
    fi
  done
  
  if [[ $fixed -gt 0 ]]; then
    log_info "Found $fixed files that may need S3 path-style fixes"
  fi
}

apply_test_endpoint_fixes() {
  local work_dir="$1"
  
  local test_dir="$work_dir/test"
  [[ ! -d "$test_dir" ]] && return 0
  
  log_info "Checking test endpoint configuration..."
  
  local fixed=0
  
  for test_file in "$test_dir"/*.ts "$test_dir"/*.js; do
    [[ ! -f "$test_file" ]] && continue
    
    # Check if test has LocalStack endpoint
    if grep -qE '@aws-sdk|aws-sdk' "$test_file" 2>/dev/null; then
      if ! grep -q 'localhost:4566\|AWS_ENDPOINT_URL\|LOCALSTACK' "$test_file" 2>/dev/null; then
        log_warning "Test may need LocalStack endpoint: $test_file"
        fixed=$((fixed + 1))
      fi
    fi
  done
  
  if [[ $fixed -gt 0 ]]; then
    log_info "Found $fixed test files that may need endpoint configuration"
  fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# BATCH APPLICATION
# ═══════════════════════════════════════════════════════════════════════════════

apply_all_fixes() {
  local work_dir="$1"
  
  echo ""
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo "🔧 APPLYING ALL FIX TEMPLATES"
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo ""
  
  # Detect environment
  local platform
  platform=$(detect_platform "$work_dir")
  local language
  language=$(detect_language "$work_dir")
  local services
  services=$(detect_services "$work_dir")
  
  log_info "Platform: $platform"
  log_info "Language: $language"
  log_info "Services: $services"
  echo ""
  
  # Get applicable templates
  local templates
  templates=$(get_applicable_templates "$work_dir" "$platform" "$language")
  
  if [[ -z "$templates" ]]; then
    log_warning "No applicable templates found for $platform-$language"
  else
    log_info "Applying templates..."
    echo ""
    
    while IFS= read -r template; do
      [[ -z "$template" ]] && continue
      apply_template "$work_dir" "$template" "$platform" "$language"
    done <<< "$templates"
  fi
  
  echo ""
  
  # Apply inline fixes
  log_info "Applying inline fixes..."
  apply_removal_policy_fixes "$work_dir" "$platform" "$language"
  apply_s3_path_style_fixes "$work_dir" "$platform" "$language"
  apply_test_endpoint_fixes "$work_dir"
  
  echo ""
  log_success "Template application complete"
  echo ""
}

check_applicable() {
  local work_dir="$1"
  
  echo ""
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo "🔍 CHECKING APPLICABLE TEMPLATES"
  echo "═══════════════════════════════════════════════════════════════════════════════"
  echo ""
  
  local platform
  platform=$(detect_platform "$work_dir")
  local language
  language=$(detect_language "$work_dir")
  local services
  services=$(detect_services "$work_dir")
  
  echo "Detected:"
  echo "  Platform: $platform"
  echo "  Language: $language"
  echo "  Services: $(echo "$services" | tr '\n' ' ')"
  echo ""
  
  echo "Applicable Templates:"
  local templates
  templates=$(get_applicable_templates "$work_dir" "$platform" "$language")
  
  if [[ -z "$templates" ]]; then
    echo "  (none found for $platform-$language)"
  else
    while IFS= read -r template; do
      [[ -z "$template" ]] && continue
      echo "  ✓ $template"
    done <<< "$templates"
  fi
  echo ""
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

main() {
  local work_dir="${1:-.}"
  local action="${2:-apply}"
  
  # Resolve work directory
  work_dir="$(cd "$work_dir" 2>/dev/null && pwd)" || {
    log_error "Directory not found: $work_dir"
    exit 2
  }
  
  case "$action" in
    --list|-l)
      list_templates
      ;;
    --check|-c)
      check_applicable "$work_dir"
      ;;
    --all|-a|apply)
      apply_all_fixes "$work_dir"
      ;;
    --help|-h|help)
      echo "LocalStack Fix Templates Applicator"
      echo ""
      echo "Usage: $0 <work_dir> [options]"
      echo ""
      echo "Options:"
      echo "  --all, -a    Apply all applicable templates (default)"
      echo "  --list, -l   List available templates"
      echo "  --check, -c  Check which templates would apply"
      echo "  --help, -h   Show this help"
      echo ""
      ;;
    *)
      # Default: apply all
      apply_all_fixes "$work_dir"
      ;;
  esac
}

main "$@"


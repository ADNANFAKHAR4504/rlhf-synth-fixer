#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# LocalStack Quick Compatibility Check
# ═══════════════════════════════════════════════════════════════════════════
# Quickly checks if a task is compatible with LocalStack Community Edition.
# Runs in ~10 seconds - use before starting any migration to avoid wasted time.
#
# Usage: ./localstack-quick-check.sh <task_path>
#
# Exit codes:
#   0 - Compatible (proceed with migration)
#   1 - Incompatible (uses Pro-only services - skip)
#   2 - Error (invalid input)
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ═══════════════════════════════════════════════════════════════════════════
# PRO-ONLY SERVICES (require LocalStack Pro - skip these tasks)
# ═══════════════════════════════════════════════════════════════════════════
PRO_ONLY_SERVICES=(
  "eks"
  "appsync"
  "amplify"
  "sagemaker"
  "cognito-idp"
  "cognito"
  "iot"
  "iotanalytics"
  "mediaconvert"
  "medialive"
  "neptune"
  "docdb"
  "documentdb"
  "msk"
  "kafka"
  "emr"
  "glue"
  "athena"
  "redshift"
  "quicksight"
  "lex"
  "polly"
  "transcribe"
  "translate"
  "comprehend"
  "rekognition"
  "personalize"
  "forecast"
  "frauddetector"
  "kendra"
  "healthlake"
  "lookout"
  "panorama"
)

# ═══════════════════════════════════════════════════════════════════════════
# HIGH COMPATIBILITY SERVICES (should work well)
# ═══════════════════════════════════════════════════════════════════════════
HIGH_COMPAT_SERVICES=(
  "s3"
  "dynamodb"
  "sqs"
  "sns"
  "iam"
  "kms"
  "cloudwatch"
  "logs"
  "secretsmanager"
  "ssm"
  "eventbridge"
  "events"
  "cloudformation"
)

# ═══════════════════════════════════════════════════════════════════════════
# MEDIUM COMPATIBILITY SERVICES (may need adjustments)
# ═══════════════════════════════════════════════════════════════════════════
MEDIUM_COMPAT_SERVICES=(
  "lambda"
  "apigateway"
  "api-gateway"
  "stepfunctions"
  "step-functions"
  "kinesis"
  "firehose"
  "ec2"
  "ecs"
  "ecr"
  "route53"
  "acm"
  "waf"
  "cloudfront"
)

# ═══════════════════════════════════════════════════════════════════════════
# PARSE ARGUMENTS
# ═══════════════════════════════════════════════════════════════════════════

TASK_PATH="${1:-}"
QUIET_MODE="${2:-false}"

if [[ -z "$TASK_PATH" ]]; then
  echo "Usage: $0 <task_path> [--quiet]"
  echo ""
  echo "Quickly checks if a task is compatible with LocalStack Community."
  echo "Returns exit code 0 if compatible, 1 if not."
  exit 2
fi

if [[ "$TASK_PATH" == "--help" ]] || [[ "$TASK_PATH" == "-h" ]]; then
  echo "LocalStack Quick Compatibility Check"
  echo ""
  echo "Usage: $0 <task_path> [--quiet]"
  echo ""
  echo "Options:"
  echo "  --quiet    Only output result (compatible/incompatible)"
  echo ""
  echo "Exit codes:"
  echo "  0 - Compatible (proceed with migration)"
  echo "  1 - Incompatible (uses Pro-only services)"
  echo "  2 - Error"
  exit 0
fi

if [[ "$2" == "--quiet" ]] || [[ "$2" == "-q" ]]; then
  QUIET_MODE="true"
fi

# ═══════════════════════════════════════════════════════════════════════════
# FIND METADATA FILE
# ═══════════════════════════════════════════════════════════════════════════

METADATA_FILE=""
if [[ -f "$TASK_PATH/metadata.json" ]]; then
  METADATA_FILE="$TASK_PATH/metadata.json"
elif [[ -f "$TASK_PATH" ]] && [[ "$TASK_PATH" == *"metadata.json" ]]; then
  METADATA_FILE="$TASK_PATH"
else
  echo -e "${RED}❌ No metadata.json found in: $TASK_PATH${NC}"
  exit 2
fi

# ═══════════════════════════════════════════════════════════════════════════
# EXTRACT SERVICES
# ═══════════════════════════════════════════════════════════════════════════

# Get AWS services from metadata
AWS_SERVICES=$(jq -r '.aws_services // [] | .[]' "$METADATA_FILE" 2>/dev/null | tr '[:upper:]' '[:lower:]' || echo "")

# Also scan source files for service imports
TASK_DIR=$(dirname "$METADATA_FILE")
SOURCE_SERVICES=""
if [[ -d "$TASK_DIR/lib" ]]; then
  # Scan for AWS service references in code
  SOURCE_SERVICES=$(grep -rh -E "aws-cdk-lib/(aws-[a-z0-9-]+)|@aws-cdk/(aws-[a-z0-9-]+)|aws\.[a-z]+\.|boto3\.client\(['\"]([a-z0-9-]+)" "$TASK_DIR/lib" 2>/dev/null | \
    grep -oE "aws-[a-z0-9-]+|['\"][a-z0-9-]+['\"]" | \
    sed "s/aws-//g; s/['\"]//g" | \
    tr '[:upper:]' '[:lower:]' | \
    sort -u || echo "")
fi

# Combine and deduplicate
ALL_SERVICES=$(echo -e "$AWS_SERVICES\n$SOURCE_SERVICES" | grep -v '^$' | sort -u)

# ═══════════════════════════════════════════════════════════════════════════
# CHECK COMPATIBILITY
# ═══════════════════════════════════════════════════════════════════════════

PRO_ONLY_FOUND=()
HIGH_COMPAT_FOUND=()
MEDIUM_COMPAT_FOUND=()
UNKNOWN_FOUND=()

for service in $ALL_SERVICES; do
  service_lower=$(echo "$service" | tr '[:upper:]' '[:lower:]')
  
  # Check Pro-only
  for pro_service in "${PRO_ONLY_SERVICES[@]}"; do
    if [[ "$service_lower" == *"$pro_service"* ]]; then
      PRO_ONLY_FOUND+=("$service")
      continue 2
    fi
  done
  
  # Check high compatibility
  for high_service in "${HIGH_COMPAT_SERVICES[@]}"; do
    if [[ "$service_lower" == *"$high_service"* ]]; then
      HIGH_COMPAT_FOUND+=("$service")
      continue 2
    fi
  done
  
  # Check medium compatibility
  for medium_service in "${MEDIUM_COMPAT_SERVICES[@]}"; do
    if [[ "$service_lower" == *"$medium_service"* ]]; then
      MEDIUM_COMPAT_FOUND+=("$service")
      continue 2
    fi
  done
  
  # Unknown service
  UNKNOWN_FOUND+=("$service")
done

# ═══════════════════════════════════════════════════════════════════════════
# OUTPUT RESULTS
# ═══════════════════════════════════════════════════════════════════════════

if [[ "$QUIET_MODE" == "true" ]]; then
  if [[ ${#PRO_ONLY_FOUND[@]} -gt 0 ]]; then
    echo "INCOMPATIBLE"
    exit 1
  else
    echo "COMPATIBLE"
    exit 0
  fi
fi

# Verbose output
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  LOCALSTACK COMPATIBILITY CHECK${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Task: ${YELLOW}$TASK_PATH${NC}"
echo ""

# Show services found
if [[ ${#HIGH_COMPAT_FOUND[@]} -gt 0 ]]; then
  echo -e "${GREEN}  ✅ High Compatibility:${NC} ${HIGH_COMPAT_FOUND[*]}"
fi

if [[ ${#MEDIUM_COMPAT_FOUND[@]} -gt 0 ]]; then
  echo -e "${YELLOW}  ⚠️  Medium Compatibility:${NC} ${MEDIUM_COMPAT_FOUND[*]}"
fi

if [[ ${#UNKNOWN_FOUND[@]} -gt 0 ]]; then
  echo -e "${YELLOW}  ❓ Unknown:${NC} ${UNKNOWN_FOUND[*]}"
fi

if [[ ${#PRO_ONLY_FOUND[@]} -gt 0 ]]; then
  echo -e "${RED}  ❌ Pro-Only (BLOCKER):${NC} ${PRO_ONLY_FOUND[*]}"
fi

echo ""

# Final verdict
if [[ ${#PRO_ONLY_FOUND[@]} -gt 0 ]]; then
  echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${RED}  ❌ INCOMPATIBLE - SKIP THIS TASK${NC}"
  echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "  This task uses Pro-only services: ${PRO_ONLY_FOUND[*]}"
  echo -e "  These services are not available in LocalStack Community Edition."
  echo ""
  echo -e "  Options:"
  echo -e "    1. Skip this task"
  echo -e "    2. Get LocalStack Pro license"
  echo -e "    3. Refactor to use alternative services"
  echo ""
  exit 1
else
  echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}  ✅ COMPATIBLE - PROCEED WITH MIGRATION${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
  echo ""
  
  # Estimate migration complexity
  COMPLEXITY="Low"
  if [[ ${#MEDIUM_COMPAT_FOUND[@]} -gt 2 ]]; then
    COMPLEXITY="Medium"
  fi
  if [[ ${#UNKNOWN_FOUND[@]} -gt 0 ]]; then
    COMPLEXITY="Medium"
  fi
  
  echo -e "  Estimated Complexity: ${COMPLEXITY}"
  echo -e "  Estimated Time: 15-30 minutes"
  echo ""
  exit 0
fi


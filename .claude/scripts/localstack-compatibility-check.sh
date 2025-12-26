#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# LocalStack Compatibility Check Script (Enhancement #3)
# ═══════════════════════════════════════════════════════════════════════════════
# Purpose: Assess migration feasibility before starting the actual migration
#
# Usage:
#   ./localstack-compatibility-check.sh <task_path>
#   ./localstack-compatibility-check.sh ./archive/cdk-ts/Pr7179
#   ./localstack-compatibility-check.sh Pr7179
#
# Exit codes:
#   0 = High compatibility (80%+)
#   1 = Medium compatibility (60-79%)
#   2 = Low compatibility (40-59%)
#   3 = Very low compatibility (<40%)
#   4 = Invalid input
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
MAGENTA='\033[0;35m'
NC='\033[0m'
BOLD='\033[1m'

# Service compatibility levels
declare -A SERVICE_COMPAT
SERVICE_COMPAT=(
  # High compatibility
  ["s3"]="high"
  ["dynamodb"]="high"
  ["sqs"]="high"
  ["sns"]="high"
  ["iam"]="high"
  ["kms"]="high"
  ["cloudwatch"]="high"
  ["logs"]="high"
  ["secretsmanager"]="high"
  ["ssm"]="high"
  ["eventbridge"]="high"
  ["events"]="high"
  # Medium compatibility
  ["lambda"]="medium"
  ["apigateway"]="medium"
  ["stepfunctions"]="medium"
  ["kinesis"]="medium"
  ["cloudformation"]="medium"
  # Low compatibility
  ["ecs"]="low"
  ["rds"]="low"
  ["ec2"]="low"
  ["elasticache"]="low"
  ["elasticsearch"]="low"
  # Pro only
  ["eks"]="pro_only"
  ["appsync"]="pro_only"
  ["amplify"]="pro_only"
  ["sagemaker"]="pro_only"
  ["cognito-idp"]="pro_only"
  ["cognito"]="pro_only"
)

# Scoring
SCORE_HIGH=0
SCORE_MEDIUM=-10
SCORE_LOW=-25
SCORE_PRO_ONLY=-50

# Platform scores
declare -A PLATFORM_SCORES
PLATFORM_SCORES=(
  ["cfn-yaml"]=10
  ["cfn-json"]=10
  ["cdk-ts"]=5
  ["cdk-py"]=5
  ["cdk-go"]=0
  ["cdk-java"]=0
  ["tf-hcl"]=0
  ["pulumi-ts"]=-5
  ["pulumi-py"]=-5
  ["pulumi-go"]=-10
)

# Complexity scores
declare -A COMPLEXITY_SCORES
COMPLEXITY_SCORES=(
  ["medium"]=0
  ["hard"]=-10
  ["expert"]=-20
)

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

# Detect services from source code
detect_services() {
  local task_path="$1"
  local detected_services=()
  
  # S3
  if grep -rqE "(new.*Bucket|s3\.Bucket|aws_s3|S3Bucket|BucketName)" "$task_path/lib" 2>/dev/null; then
    detected_services+=("s3")
  fi
  
  # DynamoDB
  if grep -rqE "(new.*Table|dynamodb\.Table|aws_dynamodb|DynamoDBTable|TableName)" "$task_path/lib" 2>/dev/null; then
    detected_services+=("dynamodb")
  fi
  
  # Lambda
  if grep -rqE "(new.*Function|lambda\.Function|aws_lambda|LambdaFunction|FunctionName)" "$task_path/lib" 2>/dev/null; then
    detected_services+=("lambda")
  fi
  
  # SQS
  if grep -rqE "(new.*Queue|sqs\.Queue|aws_sqs|SQSQueue|QueueName)" "$task_path/lib" 2>/dev/null; then
    detected_services+=("sqs")
  fi
  
  # SNS
  if grep -rqE "(new.*Topic|sns\.Topic|aws_sns|SNSTopic|TopicArn)" "$task_path/lib" 2>/dev/null; then
    detected_services+=("sns")
  fi
  
  # API Gateway
  if grep -rqE "(RestApi|HttpApi|apigateway|aws_api_gateway|ApiGateway)" "$task_path/lib" 2>/dev/null; then
    detected_services+=("apigateway")
  fi
  
  # Step Functions
  if grep -rqE "(StateMachine|stepfunctions|aws_sfn|StepFunctions)" "$task_path/lib" 2>/dev/null; then
    detected_services+=("stepfunctions")
  fi
  
  # EventBridge
  if grep -rqE "(Rule|eventbridge|events\.Rule|aws_events|EventBridge)" "$task_path/lib" 2>/dev/null; then
    detected_services+=("eventbridge")
  fi
  
  # KMS
  if grep -rqE "(kms\.Key|aws_kms|KMSKey|encryptionKey)" "$task_path/lib" 2>/dev/null; then
    detected_services+=("kms")
  fi
  
  # IAM
  if grep -rqE "(iam\.Role|iam\.Policy|aws_iam|IAMRole|PolicyDocument)" "$task_path/lib" 2>/dev/null; then
    detected_services+=("iam")
  fi
  
  # CloudWatch
  if grep -rqE "(cloudwatch|Alarm|Dashboard|Metric|aws_cloudwatch)" "$task_path/lib" 2>/dev/null; then
    detected_services+=("cloudwatch")
  fi
  
  # Secrets Manager
  if grep -rqE "(secretsmanager|Secret|aws_secretsmanager)" "$task_path/lib" 2>/dev/null; then
    detected_services+=("secretsmanager")
  fi
  
  # SSM
  if grep -rqE "(ssm\.StringParameter|aws_ssm|SSMParameter)" "$task_path/lib" 2>/dev/null; then
    detected_services+=("ssm")
  fi
  
  # Kinesis
  if grep -rqE "(kinesis\.Stream|aws_kinesis|KinesisStream)" "$task_path/lib" 2>/dev/null; then
    detected_services+=("kinesis")
  fi
  
  # ECS
  if grep -rqE "(ecs\.Cluster|ecs\.Service|aws_ecs|ECSCluster)" "$task_path/lib" 2>/dev/null; then
    detected_services+=("ecs")
  fi
  
  # RDS
  if grep -rqE "(rds\.DatabaseInstance|aws_rds|RDSInstance)" "$task_path/lib" 2>/dev/null; then
    detected_services+=("rds")
  fi
  
  # EC2
  if grep -rqE "(ec2\.Instance|aws_instance|EC2Instance|VPC|Subnet)" "$task_path/lib" 2>/dev/null; then
    detected_services+=("ec2")
  fi
  
  # EKS (Pro only)
  if grep -rqE "(eks\.Cluster|aws_eks|EKSCluster)" "$task_path/lib" 2>/dev/null; then
    detected_services+=("eks")
  fi
  
  # AppSync (Pro only)
  if grep -rqE "(appsync|GraphqlApi|aws_appsync)" "$task_path/lib" 2>/dev/null; then
    detected_services+=("appsync")
  fi
  
  # Amplify (Pro only)
  if grep -rqE "(amplify|aws_amplify|AmplifyApp)" "$task_path/lib" 2>/dev/null; then
    detected_services+=("amplify")
  fi
  
  # Cognito (Pro only / Limited)
  if grep -rqE "(cognito|UserPool|aws_cognito)" "$task_path/lib" 2>/dev/null; then
    detected_services+=("cognito")
  fi
  
  # SageMaker (Pro only)
  if grep -rqE "(sagemaker|aws_sagemaker|SageMakerEndpoint)" "$task_path/lib" 2>/dev/null; then
    detected_services+=("sagemaker")
  fi
  
  echo "${detected_services[@]}"
}

# Get platform from metadata or path
get_platform() {
  local task_path="$1"
  local platform=""
  local language=""
  
  # Try to read from metadata.json
  if [[ -f "$task_path/metadata.json" ]]; then
    platform=$(jq -r '.platform // ""' "$task_path/metadata.json" 2>/dev/null || echo "")
    language=$(jq -r '.language // ""' "$task_path/metadata.json" 2>/dev/null || echo "")
    
    if [[ -n "$platform" && -n "$language" ]]; then
      echo "$platform-$language"
      return
    fi
  fi
  
  # Infer from path
  if [[ "$task_path" == *"cdk-ts"* ]]; then
    echo "cdk-ts"
  elif [[ "$task_path" == *"cdk-py"* ]]; then
    echo "cdk-py"
  elif [[ "$task_path" == *"cdk-go"* ]]; then
    echo "cdk-go"
  elif [[ "$task_path" == *"cdk-java"* ]]; then
    echo "cdk-java"
  elif [[ "$task_path" == *"cfn-yaml"* ]]; then
    echo "cfn-yaml"
  elif [[ "$task_path" == *"cfn-json"* ]]; then
    echo "cfn-json"
  elif [[ "$task_path" == *"tf-hcl"* ]]; then
    echo "tf-hcl"
  elif [[ "$task_path" == *"pulumi-ts"* ]]; then
    echo "pulumi-ts"
  elif [[ "$task_path" == *"pulumi-py"* ]]; then
    echo "pulumi-py"
  elif [[ "$task_path" == *"pulumi-go"* ]]; then
    echo "pulumi-go"
  else
    echo "unknown"
  fi
}

# Get complexity from metadata
get_complexity() {
  local task_path="$1"
  
  if [[ -f "$task_path/metadata.json" ]]; then
    jq -r '.complexity // "medium"' "$task_path/metadata.json" 2>/dev/null || echo "medium"
  else
    echo "medium"
  fi
}

# Calculate score
calculate_score() {
  local base_score=100
  local services=("$@")
  local score=$base_score
  
  for service in "${services[@]}"; do
    local compat="${SERVICE_COMPAT[$service]:-unknown}"
    case "$compat" in
      "high")
        score=$((score + SCORE_HIGH))
        ;;
      "medium")
        score=$((score + SCORE_MEDIUM))
        ;;
      "low")
        score=$((score + SCORE_LOW))
        ;;
      "pro_only")
        score=$((score + SCORE_PRO_ONLY))
        ;;
    esac
  done
  
  echo $score
}

# Predict fixes needed
predict_fixes() {
  local task_path="$1"
  local services=("${@:2}")
  local fixes=()
  
  # Always needed
  fixes+=("endpoint_config")
  fixes+=("metadata_fix")
  
  # S3 related
  if [[ " ${services[*]} " =~ " s3 " ]]; then
    fixes+=("s3_path_style")
  fi
  
  # Always for LocalStack
  fixes+=("removal_policy")
  
  # If tests exist
  if [[ -d "$task_path/test" ]] || [[ -d "$task_path/tests" ]]; then
    fixes+=("test_config")
    fixes+=("jest_config")
  fi
  
  # TypeScript projects
  if [[ -f "$task_path/tsconfig.json" ]]; then
    fixes+=("typescript_fix")
    fixes+=("lint_fix")
  fi
  
  echo "${fixes[@]}"
}

# Estimate time
estimate_time() {
  local num_fixes=$1
  local num_low_compat=$2
  local num_medium_compat=$3
  
  local base_time=5
  local time=$((base_time + num_fixes * 2 + num_low_compat * 3 + num_medium_compat * 1))
  
  if [[ $time -lt 5 ]]; then
    echo "5-10 minutes"
  elif [[ $time -lt 10 ]]; then
    echo "10-15 minutes"
  elif [[ $time -lt 20 ]]; then
    echo "15-25 minutes"
  else
    echo "25+ minutes"
  fi
}

# Get recommendation
get_recommendation() {
  local score=$1
  
  if [[ $score -ge 80 ]]; then
    echo -e "${GREEN}RECOMMENDED${NC} - High success probability"
  elif [[ $score -ge 60 ]]; then
    echo -e "${YELLOW}PROCEED WITH CAUTION${NC} - May require manual fixes"
  elif [[ $score -ge 40 ]]; then
    echo -e "${YELLOW}RISKY${NC} - Consider simpler alternatives"
  else
    echo -e "${RED}NOT RECOMMENDED${NC} - Likely to fail due to unsupported services"
  fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════════════════════

# Parse arguments
TASK_PATH="${1:-}"
JSON_OUTPUT=false

if [[ "$TASK_PATH" == "--json" ]]; then
  JSON_OUTPUT=true
  TASK_PATH="${2:-}"
fi

if [[ -z "$TASK_PATH" ]]; then
  echo "Usage: $0 [--json] <task_path>"
  echo ""
  echo "Examples:"
  echo "  $0 ./archive/cdk-ts/Pr7179"
  echo "  $0 Pr7179"
  echo "  $0 --json ./archive/cdk-ts/Pr7179"
  exit 4
fi

# Resolve task path
if [[ ! -d "$TASK_PATH" ]]; then
  # Try to find in archive
  PR_NUM="${TASK_PATH#Pr}"
  PR_NUM="${PR_NUM#\#}"
  
  FOUND_PATH=$(find "$PROJECT_ROOT/archive" -type d -name "*Pr${PR_NUM}*" 2>/dev/null | head -1)
  
  if [[ -n "$FOUND_PATH" ]]; then
    TASK_PATH="$FOUND_PATH"
  else
    log_error "Task not found: $TASK_PATH"
    exit 4
  fi
fi

# Get task ID from path
TASK_ID=$(basename "$TASK_PATH")

# Detect platform
PLATFORM=$(get_platform "$TASK_PATH")

# Detect complexity
COMPLEXITY=$(get_complexity "$TASK_PATH")

# Detect services
SERVICES_STRING=$(detect_services "$TASK_PATH")
read -ra SERVICES <<< "$SERVICES_STRING"

# Categorize services
HIGH_COMPAT=()
MEDIUM_COMPAT=()
LOW_COMPAT=()
PRO_ONLY=()

for service in "${SERVICES[@]}"; do
  compat="${SERVICE_COMPAT[$service]:-unknown}"
  case "$compat" in
    "high") HIGH_COMPAT+=("$service") ;;
    "medium") MEDIUM_COMPAT+=("$service") ;;
    "low") LOW_COMPAT+=("$service") ;;
    "pro_only") PRO_ONLY+=("$service") ;;
  esac
done

# Calculate base score from services
SERVICE_SCORE=$(calculate_score "${SERVICES[@]}")

# Add platform bonus/penalty
PLATFORM_SCORE=${PLATFORM_SCORES[$PLATFORM]:-0}

# Add complexity bonus/penalty
COMPLEXITY_SCORE=${COMPLEXITY_SCORES[$COMPLEXITY]:-0}

# Calculate final score
FINAL_SCORE=$((SERVICE_SCORE + PLATFORM_SCORE + COMPLEXITY_SCORE))

# Clamp score to 0-100
if [[ $FINAL_SCORE -gt 100 ]]; then
  FINAL_SCORE=100
elif [[ $FINAL_SCORE -lt 0 ]]; then
  FINAL_SCORE=0
fi

# Calculate probability
if [[ $FINAL_SCORE -ge 80 ]]; then
  PROBABILITY=$((85 + (FINAL_SCORE - 80) / 2))
elif [[ $FINAL_SCORE -ge 60 ]]; then
  PROBABILITY=$((65 + (FINAL_SCORE - 60)))
elif [[ $FINAL_SCORE -ge 40 ]]; then
  PROBABILITY=$((40 + (FINAL_SCORE - 40)))
else
  PROBABILITY=$((FINAL_SCORE))
fi

# Predict fixes
FIXES_STRING=$(predict_fixes "$TASK_PATH" "${SERVICES[@]}")
read -ra PREDICTED_FIXES <<< "$FIXES_STRING"

# Estimate time
ESTIMATED_TIME=$(estimate_time ${#PREDICTED_FIXES[@]} ${#LOW_COMPAT[@]} ${#MEDIUM_COMPAT[@]})

# Get recommendation
RECOMMENDATION=$(get_recommendation $FINAL_SCORE)

# ═══════════════════════════════════════════════════════════════════════════════
# OUTPUT
# ═══════════════════════════════════════════════════════════════════════════════

if [[ "$JSON_OUTPUT" == "true" ]]; then
  # JSON output
  cat << EOF
{
  "task_id": "$TASK_ID",
  "platform": "$PLATFORM",
  "complexity": "$COMPLEXITY",
  "score": $FINAL_SCORE,
  "probability": $PROBABILITY,
  "services": {
    "high_compatibility": $(printf '%s\n' "${HIGH_COMPAT[@]:-}" | jq -R . | jq -s .),
    "medium_compatibility": $(printf '%s\n' "${MEDIUM_COMPAT[@]:-}" | jq -R . | jq -s .),
    "low_compatibility": $(printf '%s\n' "${LOW_COMPAT[@]:-}" | jq -R . | jq -s .),
    "pro_only": $(printf '%s\n' "${PRO_ONLY[@]:-}" | jq -R . | jq -s .)
  },
  "predicted_fixes": $(printf '%s\n' "${PREDICTED_FIXES[@]}" | jq -R . | jq -s .),
  "estimated_time": "$ESTIMATED_TIME",
  "recommendation": "$(echo "$RECOMMENDATION" | sed 's/\x1b\[[0-9;]*m//g')"
}
EOF
else
  # Human-readable output
  echo ""
  echo -e "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}${CYAN}📊 MIGRATION COMPATIBILITY CHECK${NC}"
  echo -e "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "Task: ${BOLD}$TASK_ID${NC} (${PLATFORM})"
  echo -e "Complexity: ${COMPLEXITY}"
  echo ""
  
  # Score display with color
  if [[ $FINAL_SCORE -ge 80 ]]; then
    echo -e "Compatibility Score: ${BOLD}${GREEN}$FINAL_SCORE/100${NC}"
  elif [[ $FINAL_SCORE -ge 60 ]]; then
    echo -e "Compatibility Score: ${BOLD}${YELLOW}$FINAL_SCORE/100${NC}"
  elif [[ $FINAL_SCORE -ge 40 ]]; then
    echo -e "Compatibility Score: ${BOLD}${YELLOW}$FINAL_SCORE/100${NC}"
  else
    echo -e "Compatibility Score: ${BOLD}${RED}$FINAL_SCORE/100${NC}"
  fi
  echo ""
  
  # Services section
  if [[ ${#HIGH_COMPAT[@]} -gt 0 ]]; then
    echo -e "${GREEN}✅ High Compatibility Services:${NC}"
    for svc in "${HIGH_COMPAT[@]}"; do
      echo -e "   - $svc"
    done
    echo ""
  fi
  
  if [[ ${#MEDIUM_COMPAT[@]} -gt 0 ]]; then
    echo -e "${YELLOW}⚠️  Medium Compatibility Services:${NC}"
    for svc in "${MEDIUM_COMPAT[@]}"; do
      echo -e "   - $svc"
    done
    echo ""
  fi
  
  if [[ ${#LOW_COMPAT[@]} -gt 0 ]]; then
    echo -e "${YELLOW}⚠️  Low Compatibility Services (Limited Support):${NC}"
    for svc in "${LOW_COMPAT[@]}"; do
      echo -e "   - $svc"
    done
    echo ""
  fi
  
  if [[ ${#PRO_ONLY[@]} -gt 0 ]]; then
    echo -e "${RED}❌ Pro-Only Services (Not Supported in Community):${NC}"
    for svc in "${PRO_ONLY[@]}"; do
      echo -e "   - $svc"
    done
    echo ""
  fi
  
  # Predicted fixes
  echo -e "${BLUE}📋 Predicted Fixes Needed:${NC}"
  for fix in "${PREDICTED_FIXES[@]}"; do
    echo -e "   - $fix"
  done
  echo ""
  
  # Estimates
  echo -e "⏱️  Estimated Time: ${BOLD}$ESTIMATED_TIME${NC}"
  echo -e "🎯 Success Probability: ${BOLD}$PROBABILITY%${NC}"
  echo ""
  
  # Recommendation
  echo -e "Recommendation: $RECOMMENDATION"
  echo ""
  echo -e "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
fi

# Exit with appropriate code
if [[ $FINAL_SCORE -ge 80 ]]; then
  exit 0
elif [[ $FINAL_SCORE -ge 60 ]]; then
  exit 1
elif [[ $FINAL_SCORE -ge 40 ]]; then
  exit 2
else
  exit 3
fi


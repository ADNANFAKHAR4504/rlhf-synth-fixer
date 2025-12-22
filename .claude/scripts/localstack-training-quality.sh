#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# LocalStack Training Quality Assessment Script
# Analyzes a task directory and suggests fixes to achieve score 9+
# ═══════════════════════════════════════════════════════════════════════════

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

WORK_DIR="${1:-.}"
TARGET_SCORE=9
BASE_SCORE=8

# LocalStack high-compatibility services
HIGH_COMPAT_SERVICES=(s3 dynamodb sqs sns iam kms cloudwatch logs secretsmanager ssm eventbridge events)
MEDIUM_COMPAT_SERVICES=(lambda apigateway stepfunctions kinesis cloudformation)
LOW_COMPAT_SERVICES=(ecs rds ec2 elasticache elasticsearch)
PRO_ONLY_SERVICES=(eks appsync amplify sagemaker cognito-idp)

# ═══════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

print_header() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${BLUE}━━━ $1 ━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_opportunity() {
    echo -e "${YELLOW}📈 $1${NC}"
}

# ═══════════════════════════════════════════════════════════════════════════
# SERVICE DETECTION
# ═══════════════════════════════════════════════════════════════════════════

detect_services() {
    local dir="$1"
    local services=()

    # Check lib/ directory for service usage
    if [[ -d "$dir/lib" ]]; then
        local files=$(find "$dir/lib" -type f \( -name "*.ts" -o -name "*.py" -o -name "*.tf" -o -name "*.yml" -o -name "*.yaml" \) 2>/dev/null)

        for file in $files; do
            # S3
            if grep -qiE "s3\.|Bucket|aws-s3|aws_s3" "$file" 2>/dev/null; then
                services+=("s3")
            fi
            # DynamoDB
            if grep -qiE "dynamodb|Table\(|aws-dynamodb|aws_dynamodb" "$file" 2>/dev/null; then
                services+=("dynamodb")
            fi
            # Lambda
            if grep -qiE "lambda\.|Function\(|aws-lambda|aws_lambda" "$file" 2>/dev/null; then
                services+=("lambda")
            fi
            # SQS
            if grep -qiE "sqs\.|Queue\(|aws-sqs|aws_sqs" "$file" 2>/dev/null; then
                services+=("sqs")
            fi
            # SNS
            if grep -qiE "sns\.|Topic\(|aws-sns|aws_sns" "$file" 2>/dev/null; then
                services+=("sns")
            fi
            # API Gateway
            if grep -qiE "apigateway|RestApi|aws-apigateway" "$file" 2>/dev/null; then
                services+=("apigateway")
            fi
            # EventBridge
            if grep -qiE "eventbridge|events\.|EventBus|Rule\(" "$file" 2>/dev/null; then
                services+=("eventbridge")
            fi
            # Step Functions
            if grep -qiE "stepfunctions|StateMachine|aws-stepfunctions" "$file" 2>/dev/null; then
                services+=("stepfunctions")
            fi
            # KMS
            if grep -qiE "kms\.|Key\(|aws-kms|aws_kms" "$file" 2>/dev/null; then
                services+=("kms")
            fi
            # IAM
            if grep -qiE "iam\.|Role\(|Policy\(|aws-iam" "$file" 2>/dev/null; then
                services+=("iam")
            fi
            # CloudWatch
            if grep -qiE "cloudwatch|Alarm\(|Dashboard\(|aws-cloudwatch" "$file" 2>/dev/null; then
                services+=("cloudwatch")
            fi
            # SecretsManager
            if grep -qiE "secretsmanager|Secret\(|aws-secretsmanager" "$file" 2>/dev/null; then
                services+=("secretsmanager")
            fi
            # ECS
            if grep -qiE "ecs\.|Cluster\(|aws-ecs" "$file" 2>/dev/null; then
                services+=("ecs")
            fi
            # RDS
            if grep -qiE "rds\.|DatabaseInstance|aws-rds" "$file" 2>/dev/null; then
                services+=("rds")
            fi
            # EKS
            if grep -qiE "eks\.|aws-eks" "$file" 2>/dev/null; then
                services+=("eks")
            fi
            # AppSync
            if grep -qiE "appsync|GraphqlApi|aws-appsync" "$file" 2>/dev/null; then
                services+=("appsync")
            fi
        done
    fi

    # Remove duplicates and return
    echo "${services[@]}" | tr ' ' '\n' | sort -u | tr '\n' ' '
}

# ═══════════════════════════════════════════════════════════════════════════
# CATEGORY A FIX DETECTION
# ═══════════════════════════════════════════════════════════════════════════

check_kms_encryption() {
    local dir="$1"
    local has_kms=false
    local opportunities=()

    if [[ -d "$dir/lib" ]]; then
        local files=$(find "$dir/lib" -type f \( -name "*.ts" -o -name "*.py" \) 2>/dev/null)

        for file in $files; do
            # Check if KMS is used
            if grep -qiE "encryptionKey|encryption.*KMS|kms\.Key|CUSTOMER_MANAGED" "$file" 2>/dev/null; then
                has_kms=true
            fi

            # Check for unencrypted S3
            if grep -qiE "new.*Bucket" "$file" 2>/dev/null && ! grep -qiE "encryption.*KMS|encryptionKey" "$file" 2>/dev/null; then
                opportunities+=("S3 bucket without KMS encryption in $(basename $file)")
            fi

            # Check for unencrypted DynamoDB
            if grep -qiE "new.*Table" "$file" 2>/dev/null && ! grep -qiE "CUSTOMER_MANAGED|encryptionKey" "$file" 2>/dev/null; then
                opportunities+=("DynamoDB table without KMS encryption in $(basename $file)")
            fi
        done
    fi

    if [[ "$has_kms" == "true" ]]; then
        echo "PRESENT"
    else
        echo "MISSING"
    fi

    # Print opportunities
    for opp in "${opportunities[@]}"; do
        echo "OPPORTUNITY:$opp"
    done
}

check_iam_policies() {
    local dir="$1"
    local has_least_privilege=true
    local opportunities=()

    if [[ -d "$dir/lib" ]]; then
        local files=$(find "$dir/lib" -type f \( -name "*.ts" -o -name "*.py" \) 2>/dev/null)

        for file in $files; do
            # Check for overly permissive policies
            if grep -qE "actions.*\[.*'\*'.*\]|actions.*\[.*\"\*\".*\]|resources.*\[.*'\*'.*\]|resources.*\[.*\"\*\".*\]" "$file" 2>/dev/null; then
                has_least_privilege=false
                opportunities+=("Overly permissive IAM policy (using *) in $(basename $file)")
            fi

            # Check for s3:* or dynamodb:*
            if grep -qiE "s3:\*|dynamodb:\*|lambda:\*|sqs:\*" "$file" 2>/dev/null; then
                has_least_privilege=false
                opportunities+=("Service-level wildcard permissions in $(basename $file)")
            fi
        done
    fi

    if [[ "$has_least_privilege" == "true" ]]; then
        echo "GOOD"
    else
        echo "NEEDS_FIX"
    fi

    for opp in "${opportunities[@]}"; do
        echo "OPPORTUNITY:$opp"
    done
}

check_cloudwatch_monitoring() {
    local dir="$1"
    local has_monitoring=false
    local opportunities=()

    if [[ -d "$dir/lib" ]]; then
        local files=$(find "$dir/lib" -type f \( -name "*.ts" -o -name "*.py" \) 2>/dev/null)

        for file in $files; do
            # Check for CloudWatch alarms
            if grep -qiE "new.*Alarm|cloudwatch\.Alarm|metricErrors|metricThrottles" "$file" 2>/dev/null; then
                has_monitoring=true
            fi
        done

        # Check if Lambda exists without monitoring
        for file in $files; do
            if grep -qiE "new.*Function|lambda\.Function" "$file" 2>/dev/null && [[ "$has_monitoring" == "false" ]]; then
                opportunities+=("Lambda function without CloudWatch alarms")
            fi
        done
    fi

    if [[ "$has_monitoring" == "true" ]]; then
        echo "PRESENT"
    else
        echo "MISSING"
    fi

    for opp in "${opportunities[@]}"; do
        echo "OPPORTUNITY:$opp"
    done
}

check_error_handling() {
    local dir="$1"
    local has_dlq=false
    local opportunities=()

    if [[ -d "$dir/lib" ]]; then
        local files=$(find "$dir/lib" -type f \( -name "*.ts" -o -name "*.py" \) 2>/dev/null)

        for file in $files; do
            # Check for DLQ
            if grep -qiE "deadLetterQueue|DeadLetterQueue|dlq|onFailure" "$file" 2>/dev/null; then
                has_dlq=true
            fi
        done

        # Check if Lambda/SQS exists without DLQ
        for file in $files; do
            if grep -qiE "new.*Function|lambda\.Function" "$file" 2>/dev/null && [[ "$has_dlq" == "false" ]]; then
                opportunities+=("Lambda function without dead-letter queue in $(basename $file)")
            fi
            if grep -qiE "new.*Queue|sqs\.Queue" "$file" 2>/dev/null && ! grep -qiE "deadLetterQueue" "$file" 2>/dev/null; then
                opportunities+=("SQS queue without dead-letter queue in $(basename $file)")
            fi
        done
    fi

    if [[ "$has_dlq" == "true" ]]; then
        echo "PRESENT"
    else
        echo "MISSING"
    fi

    for opp in "${opportunities[@]}"; do
        echo "OPPORTUNITY:$opp"
    done
}

check_secrets_management() {
    local dir="$1"
    local has_hardcoded=false
    local opportunities=()

    if [[ -d "$dir/lib" ]]; then
        local files=$(find "$dir/lib" -type f \( -name "*.ts" -o -name "*.py" \) 2>/dev/null)

        for file in $files; do
            # Check for hardcoded credentials
            if grep -qiE "(password|secret|apiKey|token)\s*[:=]\s*['\"][^'\"]+['\"]" "$file" 2>/dev/null; then
                has_hardcoded=true
                opportunities+=("Hardcoded credentials detected in $(basename $file)")
            fi
        done
    fi

    if [[ "$has_hardcoded" == "true" ]]; then
        echo "HARDCODED"
    else
        echo "OK"
    fi

    for opp in "${opportunities[@]}"; do
        echo "OPPORTUNITY:$opp"
    done
}

# ═══════════════════════════════════════════════════════════════════════════
# COMPLEXITY FACTOR DETECTION
# ═══════════════════════════════════════════════════════════════════════════

check_service_count() {
    local services="$1"
    local count=$(echo "$services" | wc -w | tr -d ' ')
    echo "$count"
}

check_event_driven() {
    local dir="$1"

    if [[ -d "$dir/lib" ]]; then
        local files=$(find "$dir/lib" -type f \( -name "*.ts" -o -name "*.py" \) 2>/dev/null)

        for file in $files; do
            if grep -qiE "EventBus|Rule\(|eventbridge|addEventSource|SqsEventSource|S3EventSource" "$file" 2>/dev/null; then
                echo "YES"
                return
            fi
        done
    fi

    echo "NO"
}

check_serverless() {
    local services="$1"

    if echo "$services" | grep -qw "lambda"; then
        if echo "$services" | grep -qwE "apigateway|stepfunctions|eventbridge"; then
            echo "YES"
            return
        fi
    fi

    echo "NO"
}

# ═══════════════════════════════════════════════════════════════════════════
# LOCALSTACK COMPATIBILITY CHECK
# ═══════════════════════════════════════════════════════════════════════════

check_localstack_compatibility() {
    local services="$1"
    local high_count=0
    local medium_count=0
    local low_count=0
    local pro_count=0

    for service in $services; do
        if [[ " ${HIGH_COMPAT_SERVICES[*]} " =~ " $service " ]]; then
            ((high_count++))
        elif [[ " ${MEDIUM_COMPAT_SERVICES[*]} " =~ " $service " ]]; then
            ((medium_count++))
        elif [[ " ${LOW_COMPAT_SERVICES[*]} " =~ " $service " ]]; then
            ((low_count++))
        elif [[ " ${PRO_ONLY_SERVICES[*]} " =~ " $service " ]]; then
            ((pro_count++))
        fi
    done

    echo "HIGH:$high_count MEDIUM:$medium_count LOW:$low_count PRO_ONLY:$pro_count"
}

# ═══════════════════════════════════════════════════════════════════════════
# SCORE CALCULATION
# ═══════════════════════════════════════════════════════════════════════════

calculate_score() {
    local category_a_count=$1
    local service_count=$2
    local has_security=$3
    local has_event_driven=$4
    local has_serverless=$5

    local model_failures_adj=0
    local complexity_adj=0

    # MODEL_FAILURES adjustment (Category A fixes)
    if [[ $category_a_count -ge 2 ]]; then
        model_failures_adj=2
    elif [[ $category_a_count -eq 1 ]]; then
        model_failures_adj=1
    fi

    # Complexity adjustment (max +2)
    local complexity_factors=0

    # Multiple services (3+)
    if [[ $service_count -ge 3 ]]; then
        ((complexity_factors++))
    fi

    # Security practices
    if [[ "$has_security" == "YES" ]]; then
        ((complexity_factors++))
    fi

    # Event-driven (only if not already at +2)
    if [[ "$has_event_driven" == "YES" ]] && [[ $complexity_factors -lt 2 ]]; then
        ((complexity_factors++))
    fi

    # Serverless (only if not already at +2)
    if [[ "$has_serverless" == "YES" ]] && [[ $complexity_factors -lt 2 ]]; then
        ((complexity_factors++))
    fi

    # Cap at +2
    if [[ $complexity_factors -gt 2 ]]; then
        complexity_adj=2
    else
        complexity_adj=$complexity_factors
    fi

    # Single service penalty
    if [[ $service_count -eq 1 ]]; then
        ((complexity_adj--))
    fi

    # Calculate final score
    local final_score=$((BASE_SCORE + model_failures_adj + complexity_adj))

    # Cap at 0-10
    if [[ $final_score -gt 10 ]]; then
        final_score=10
    elif [[ $final_score -lt 0 ]]; then
        final_score=0
    fi

    echo "$final_score:$model_failures_adj:$complexity_adj"
}

# ═══════════════════════════════════════════════════════════════════════════
# MAIN ASSESSMENT
# ═══════════════════════════════════════════════════════════════════════════

main() {
    print_header "LocalStack Training Quality Assessment"

    # Validate directory
    if [[ ! -d "$WORK_DIR" ]]; then
        print_error "Directory not found: $WORK_DIR"
        exit 1
    fi

    cd "$WORK_DIR"
    echo "📁 Analyzing: $(pwd)"

    # ═══════════════════════════════════════════════════════════════
    # DETECT SERVICES
    # ═══════════════════════════════════════════════════════════════
    print_section "Service Detection"

    DETECTED_SERVICES=$(detect_services ".")
    SERVICE_COUNT=$(check_service_count "$DETECTED_SERVICES")

    echo "Detected services ($SERVICE_COUNT):"
    for service in $DETECTED_SERVICES; do
        if [[ " ${HIGH_COMPAT_SERVICES[*]} " =~ " $service " ]]; then
            print_success "$service (HIGH compatibility)"
        elif [[ " ${MEDIUM_COMPAT_SERVICES[*]} " =~ " $service " ]]; then
            print_warning "$service (MEDIUM compatibility)"
        elif [[ " ${LOW_COMPAT_SERVICES[*]} " =~ " $service " ]]; then
            print_error "$service (LOW compatibility)"
        elif [[ " ${PRO_ONLY_SERVICES[*]} " =~ " $service " ]]; then
            print_error "$service (PRO ONLY - will fail in LocalStack Community)"
        fi
    done

    COMPAT=$(check_localstack_compatibility "$DETECTED_SERVICES")
    echo ""
    print_info "Compatibility breakdown: $COMPAT"

    # ═══════════════════════════════════════════════════════════════
    # CHECK CATEGORY A FIXES
    # ═══════════════════════════════════════════════════════════════
    print_section "Category A Fix Analysis"

    CATEGORY_A_COUNT=0
    CATEGORY_A_OPPORTUNITIES=()

    # KMS Encryption
    echo ""
    echo "🔐 KMS Encryption:"
    KMS_RESULT=$(check_kms_encryption ".")
    KMS_STATUS=$(echo "$KMS_RESULT" | head -1)
    if [[ "$KMS_STATUS" == "PRESENT" ]]; then
        print_success "KMS encryption detected"
        ((CATEGORY_A_COUNT++))
    else
        print_opportunity "OPPORTUNITY: Add KMS encryption (+1 Category A)"
        while IFS= read -r line; do
            if [[ "$line" == OPPORTUNITY:* ]]; then
                echo "   - ${line#OPPORTUNITY:}"
                CATEGORY_A_OPPORTUNITIES+=("${line#OPPORTUNITY:}")
            fi
        done <<< "$KMS_RESULT"
    fi

    # IAM Policies
    echo ""
    echo "🔒 IAM Least-Privilege:"
    IAM_RESULT=$(check_iam_policies ".")
    IAM_STATUS=$(echo "$IAM_RESULT" | head -1)
    if [[ "$IAM_STATUS" == "GOOD" ]]; then
        print_success "IAM policies appear to use least-privilege"
        ((CATEGORY_A_COUNT++))
    else
        print_opportunity "OPPORTUNITY: Fix overly permissive IAM (+1 Category A)"
        while IFS= read -r line; do
            if [[ "$line" == OPPORTUNITY:* ]]; then
                echo "   - ${line#OPPORTUNITY:}"
                CATEGORY_A_OPPORTUNITIES+=("${line#OPPORTUNITY:}")
            fi
        done <<< "$IAM_RESULT"
    fi

    # CloudWatch Monitoring
    echo ""
    echo "📊 CloudWatch Monitoring:"
    CW_RESULT=$(check_cloudwatch_monitoring ".")
    CW_STATUS=$(echo "$CW_RESULT" | head -1)
    if [[ "$CW_STATUS" == "PRESENT" ]]; then
        print_success "CloudWatch monitoring detected"
        ((CATEGORY_A_COUNT++))
    else
        print_opportunity "OPPORTUNITY: Add CloudWatch alarms (+1 Category A)"
        while IFS= read -r line; do
            if [[ "$line" == OPPORTUNITY:* ]]; then
                echo "   - ${line#OPPORTUNITY:}"
                CATEGORY_A_OPPORTUNITIES+=("${line#OPPORTUNITY:}")
            fi
        done <<< "$CW_RESULT"
    fi

    # Error Handling / DLQ
    echo ""
    echo "🔄 Error Handling (DLQ):"
    DLQ_RESULT=$(check_error_handling ".")
    DLQ_STATUS=$(echo "$DLQ_RESULT" | head -1)
    if [[ "$DLQ_STATUS" == "PRESENT" ]]; then
        print_success "Dead-letter queue detected"
        ((CATEGORY_A_COUNT++))
    else
        print_opportunity "OPPORTUNITY: Add dead-letter queues (+1 Category A)"
        while IFS= read -r line; do
            if [[ "$line" == OPPORTUNITY:* ]]; then
                echo "   - ${line#OPPORTUNITY:}"
                CATEGORY_A_OPPORTUNITIES+=("${line#OPPORTUNITY:}")
            fi
        done <<< "$DLQ_RESULT"
    fi

    # Secrets Management
    echo ""
    echo "🔑 Secrets Management:"
    SECRETS_RESULT=$(check_secrets_management ".")
    SECRETS_STATUS=$(echo "$SECRETS_RESULT" | head -1)
    if [[ "$SECRETS_STATUS" == "OK" ]]; then
        print_success "No hardcoded credentials detected"
    else
        print_opportunity "OPPORTUNITY: Use SecretsManager (+1 Category A)"
        while IFS= read -r line; do
            if [[ "$line" == OPPORTUNITY:* ]]; then
                echo "   - ${line#OPPORTUNITY:}"
                CATEGORY_A_OPPORTUNITIES+=("${line#OPPORTUNITY:}")
            fi
        done <<< "$SECRETS_RESULT"
    fi

    # ═══════════════════════════════════════════════════════════════
    # CHECK COMPLEXITY FACTORS
    # ═══════════════════════════════════════════════════════════════
    print_section "Complexity Factor Analysis"

    HAS_SECURITY="NO"
    if [[ "$KMS_STATUS" == "PRESENT" ]] || [[ "$IAM_STATUS" == "GOOD" ]]; then
        HAS_SECURITY="YES"
    fi

    HAS_EVENT_DRIVEN=$(check_event_driven ".")
    HAS_SERVERLESS=$(check_serverless "$DETECTED_SERVICES")

    echo ""
    echo "📊 Complexity Factors:"

    # Multiple services
    if [[ $SERVICE_COUNT -ge 3 ]]; then
        print_success "Multiple services (3+): $SERVICE_COUNT services → +1"
    elif [[ $SERVICE_COUNT -eq 1 ]]; then
        print_error "Single service only → -1"
    else
        print_warning "Only $SERVICE_COUNT services (need 3+ for bonus)"
    fi

    # Security practices
    if [[ "$HAS_SECURITY" == "YES" ]]; then
        print_success "Security best practices present → +1"
    else
        print_opportunity "OPPORTUNITY: Add security practices (KMS, IAM) → +1"
    fi

    # Event-driven
    if [[ "$HAS_EVENT_DRIVEN" == "YES" ]]; then
        print_success "Event-driven architecture present → +1"
    else
        print_info "No event-driven patterns detected"
    fi

    # Serverless
    if [[ "$HAS_SERVERLESS" == "YES" ]]; then
        print_success "Serverless architecture present → +1"
    else
        print_info "No serverless patterns detected"
    fi

    # ═══════════════════════════════════════════════════════════════
    # CALCULATE SCORE
    # ═══════════════════════════════════════════════════════════════
    print_section "Score Calculation"

    SCORE_RESULT=$(calculate_score $CATEGORY_A_COUNT $SERVICE_COUNT "$HAS_SECURITY" "$HAS_EVENT_DRIVEN" "$HAS_SERVERLESS")
    FINAL_SCORE=$(echo "$SCORE_RESULT" | cut -d: -f1)
    MODEL_FAILURES_ADJ=$(echo "$SCORE_RESULT" | cut -d: -f2)
    COMPLEXITY_ADJ=$(echo "$SCORE_RESULT" | cut -d: -f3)

    echo ""
    echo "📋 Scoring Breakdown:"
    echo "   Base Score:              8"
    echo "   MODEL_FAILURES Adj:     +$MODEL_FAILURES_ADJ (Category A fixes: $CATEGORY_A_COUNT)"
    echo "   Complexity Adj:         +$COMPLEXITY_ADJ"
    echo "   ─────────────────────────"
    echo "   Final Score:             $FINAL_SCORE/10"

    # ═══════════════════════════════════════════════════════════════
    # RECOMMENDATIONS
    # ═══════════════════════════════════════════════════════════════
    print_section "Recommendations"

    if [[ $FINAL_SCORE -ge $TARGET_SCORE ]]; then
        print_success "Current score ($FINAL_SCORE) meets target ($TARGET_SCORE)"
    else
        NEEDED=$((TARGET_SCORE - FINAL_SCORE))
        print_warning "Need +$NEEDED more points to reach target score of $TARGET_SCORE"
        echo ""
        echo "📈 Top recommendations to reach score $TARGET_SCORE:"
        echo ""

        RECOMMENDATION_COUNT=0

        # Recommend Category A fixes first (highest impact)
        if [[ "$KMS_STATUS" != "PRESENT" ]] && [[ $RECOMMENDATION_COUNT -lt 3 ]]; then
            echo "1️⃣  Add KMS encryption to S3/DynamoDB (+1 Category A)"
            echo "    • Use customer-managed KMS key"
            echo "    • Apply to all data stores"
            ((RECOMMENDATION_COUNT++))
        fi

        if [[ "$IAM_STATUS" != "GOOD" ]] && [[ $RECOMMENDATION_COUNT -lt 3 ]]; then
            echo "2️⃣  Fix IAM policies to use least-privilege (+1 Category A)"
            echo "    • Replace * with specific actions"
            echo "    • Use resource ARNs instead of *"
            ((RECOMMENDATION_COUNT++))
        fi

        if [[ "$CW_STATUS" != "PRESENT" ]] && [[ $RECOMMENDATION_COUNT -lt 3 ]]; then
            echo "3️⃣  Add CloudWatch alarms (+1 Category A)"
            echo "    • Add error alarms for Lambda"
            echo "    • Add throttle alarms for DynamoDB"
            ((RECOMMENDATION_COUNT++))
        fi

        if [[ "$DLQ_STATUS" != "PRESENT" ]] && [[ $RECOMMENDATION_COUNT -lt 3 ]]; then
            echo "4️⃣  Add dead-letter queues (+1 Category A)"
            echo "    • Add DLQ to Lambda functions"
            echo "    • Add DLQ to SQS queues"
            ((RECOMMENDATION_COUNT++))
        fi

        # Recommend adding services if count is low
        if [[ $SERVICE_COUNT -lt 3 ]] && [[ $RECOMMENDATION_COUNT -lt 3 ]]; then
            echo "5️⃣  Add more services to reach 3+ (+1 Complexity)"
            echo "    • Consider adding: CloudWatch, SQS, EventBridge"
            ((RECOMMENDATION_COUNT++))
        fi
    fi

    # ═══════════════════════════════════════════════════════════════
    # FINAL STATUS
    # ═══════════════════════════════════════════════════════════════
    print_header "Assessment Summary"

    if [[ $FINAL_SCORE -ge 9 ]]; then
        print_success "EXCELLENT - Score $FINAL_SCORE/10 meets target!"
    elif [[ $FINAL_SCORE -ge 8 ]]; then
        print_warning "GOOD - Score $FINAL_SCORE/10 meets minimum, aim for $TARGET_SCORE"
    else
        print_error "BELOW THRESHOLD - Score $FINAL_SCORE/10, need 8 minimum"
    fi

    echo ""
    echo "LocalStack Compatibility: $(echo "$COMPAT" | cut -d' ' -f1 | cut -d: -f2) HIGH, $(echo "$COMPAT" | cut -d' ' -f2 | cut -d: -f2) MEDIUM services"
    echo ""

    # Return score for use in other scripts
    exit $FINAL_SCORE
}

# Run main function
main "$@"


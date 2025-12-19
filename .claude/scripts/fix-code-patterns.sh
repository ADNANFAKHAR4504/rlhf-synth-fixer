#!/bin/bash
# Applies actual code fixes based on known patterns from lessons_learnt.md
# Usage: fix-code-patterns.sh [issue_type] [target_dir]
#
# Supported issue types:
#   - aws_sdk_v2: Convert AWS SDK v2 to v3 for Node.js 18+
#   - environment_suffix: Add environmentSuffix to hardcoded resource names
#   - removal_policy: Change RETAIN to DESTROY for destroyability
#   - config_iam: Fix AWS Config IAM policy references
#   - lambda_concurrency: Remove/fix reserved concurrency issues
#   - synthetics_runtime: Update deprecated CloudWatch Synthetics runtime
#   - guardduty: Remove GuardDuty detector creation (account-level resource)
#   - all/scan: Run all fixes

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ISSUE_TYPE="${1:-scan}"
TARGET_DIR="${2:-lib}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Track fixes applied
FIXES_APPLIED=0

# Get platform/language from metadata
get_platform_info() {
    if [ -f "metadata.json" ]; then
        PLATFORM=$(jq -r '.platform // "unknown"' metadata.json 2>/dev/null || echo "unknown")
        LANGUAGE=$(jq -r '.language // "unknown"' metadata.json 2>/dev/null || echo "unknown")
    else
        PLATFORM="unknown"
        LANGUAGE="unknown"
    fi
    export PLATFORM LANGUAGE
}

# Fix: AWS SDK v2 → v3 transformation for Node.js 18+
fix_aws_sdk_v2() {
    log_info "Converting AWS SDK v2 to v3..."
    
    local files_fixed=0
    
    while IFS= read -r -d '' file; do
        if grep -q "require('aws-sdk')\|from 'aws-sdk'" "$file" 2>/dev/null; then
            log_info "  Processing: $file"
            
            # Create backup
            cp "$file" "${file}.bak"
            
            # Replace common SDK v2 patterns with v3
            # S3
            sed -i'' -e "s/const AWS = require('aws-sdk');/import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk\/client-s3';/g" "$file"
            sed -i'' -e "s/import AWS from 'aws-sdk';/import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk\/client-s3';/g" "$file"
            sed -i'' -e 's/new AWS\.S3()/new S3Client({})/g' "$file"
            
            # DynamoDB
            sed -i'' -e 's/new AWS\.DynamoDB\.DocumentClient()/new DynamoDBClient({})/g' "$file"
            sed -i'' -e 's/new AWS\.DynamoDB()/new DynamoDBClient({})/g' "$file"
            
            # Lambda
            sed -i'' -e 's/new AWS\.Lambda()/new LambdaClient({})/g' "$file"
            
            # Check if changes were made
            if ! diff -q "$file" "${file}.bak" > /dev/null 2>&1; then
                files_fixed=$((files_fixed + 1))
                log_success "  Fixed: $file"
            fi
            
            rm -f "${file}.bak"
        fi
    done < <(find "$TARGET_DIR" -type f \( -name "*.ts" -o -name "*.js" \) -print0 2>/dev/null)
    
    if [ $files_fixed -gt 0 ]; then
        FIXES_APPLIED=$((FIXES_APPLIED + files_fixed))
        log_success "Fixed AWS SDK v2 references in $files_fixed file(s)"
    else
        log_info "No AWS SDK v2 references found"
    fi
}

# Fix: Add environment suffix to hardcoded resource names
fix_environment_suffix() {
    log_info "Fixing hardcoded resource names (adding environmentSuffix)..."
    
    local files_fixed=0
    
    # TypeScript patterns
    while IFS= read -r -d '' file; do
        local modified=false
        
        # Create backup
        cp "$file" "${file}.bak"
        
        # Pattern 1: bucketName: 'my-bucket' → bucketName: `my-bucket-${props.environmentSuffix}`
        if grep -qE "bucketName:\s*'[^']+'" "$file" 2>/dev/null; then
            sed -i'' -E "s/bucketName:\s*'([^']+)'/bucketName: \`\1-\${props.environmentSuffix}\`/g" "$file"
            modified=true
        fi
        
        # Pattern 2: tableName: 'my-table' → tableName: `my-table-${props.environmentSuffix}`
        if grep -qE "tableName:\s*'[^']+'" "$file" 2>/dev/null; then
            sed -i'' -E "s/tableName:\s*'([^']+)'/tableName: \`\1-\${props.environmentSuffix}\`/g" "$file"
            modified=true
        fi
        
        # Pattern 3: queueName: 'my-queue' → queueName: `my-queue-${props.environmentSuffix}`
        if grep -qE "queueName:\s*'[^']+'" "$file" 2>/dev/null; then
            sed -i'' -E "s/queueName:\s*'([^']+)'/queueName: \`\1-\${props.environmentSuffix}\`/g" "$file"
            modified=true
        fi
        
        # Pattern 4: functionName: 'my-function' → functionName: `my-function-${props.environmentSuffix}`
        if grep -qE "functionName:\s*'[^']+'" "$file" 2>/dev/null; then
            sed -i'' -E "s/functionName:\s*'([^']+)'/functionName: \`\1-\${props.environmentSuffix}\`/g" "$file"
            modified=true
        fi
        
        # Pattern 5: clusterIdentifier: 'my-cluster'
        if grep -qE "clusterIdentifier:\s*'[^']+'" "$file" 2>/dev/null; then
            sed -i'' -E "s/clusterIdentifier:\s*'([^']+)'/clusterIdentifier: \`\1-\${props.environmentSuffix}\`/g" "$file"
            modified=true
        fi
        
        # Check if changes were made
        if [ "$modified" = true ] && ! diff -q "$file" "${file}.bak" > /dev/null 2>&1; then
            files_fixed=$((files_fixed + 1))
            log_success "  Fixed: $file"
        fi
        
        rm -f "${file}.bak"
    done < <(find "$TARGET_DIR" -type f -name "*.ts" -print0 2>/dev/null)
    
    # Python patterns
    while IFS= read -r -d '' file; do
        local modified=false
        
        cp "$file" "${file}.bak"
        
        # Pattern: bucket_name='my-bucket' → bucket_name=f'my-bucket-{environment_suffix}'
        if grep -qE "bucket_name=['\"][^'\"]+['\"]" "$file" 2>/dev/null; then
            sed -i'' -E "s/bucket_name=['\"]([^'\"]+)['\"]/bucket_name=f'\1-{environment_suffix}'/g" "$file"
            modified=true
        fi
        
        # Pattern: table_name='my-table'
        if grep -qE "table_name=['\"][^'\"]+['\"]" "$file" 2>/dev/null; then
            sed -i'' -E "s/table_name=['\"]([^'\"]+)['\"]/table_name=f'\1-{environment_suffix}'/g" "$file"
            modified=true
        fi
        
        if [ "$modified" = true ] && ! diff -q "$file" "${file}.bak" > /dev/null 2>&1; then
            files_fixed=$((files_fixed + 1))
            log_success "  Fixed: $file"
        fi
        
        rm -f "${file}.bak"
    done < <(find "$TARGET_DIR" -type f -name "*.py" -print0 2>/dev/null)
    
    if [ $files_fixed -gt 0 ]; then
        FIXES_APPLIED=$((FIXES_APPLIED + files_fixed))
        log_success "Fixed environment suffix in $files_fixed file(s)"
    else
        log_info "No hardcoded resource names found"
    fi
}

# Fix: RemovalPolicy.RETAIN → RemovalPolicy.DESTROY
fix_removal_policy() {
    log_info "Fixing retention policies for destroyability..."
    
    local files_fixed=0
    
    while IFS= read -r -d '' file; do
        local modified=false
        
        cp "$file" "${file}.bak"
        
        # TypeScript/CDK patterns
        if grep -qi "RemovalPolicy\.RETAIN\|removalPolicy:.*RETAIN" "$file" 2>/dev/null; then
            sed -i'' -e 's/RemovalPolicy\.RETAIN/RemovalPolicy.DESTROY/g' "$file"
            sed -i'' -e 's/removalPolicy: cdk\.RemovalPolicy\.RETAIN/removalPolicy: cdk.RemovalPolicy.DESTROY/g' "$file"
            modified=true
        fi
        
        # deletionProtection: true → false
        if grep -qi "deletionProtection:\s*true" "$file" 2>/dev/null; then
            sed -i'' -e 's/deletionProtection: true/deletionProtection: false/g' "$file"
            modified=true
        fi
        
        # skip_final_snapshot: false → true (for destroyability)
        if grep -qi "skipFinalSnapshot:\s*false" "$file" 2>/dev/null; then
            sed -i'' -e 's/skipFinalSnapshot: false/skipFinalSnapshot: true/g' "$file"
            modified=true
        fi
        
        if [ "$modified" = true ] && ! diff -q "$file" "${file}.bak" > /dev/null 2>&1; then
            files_fixed=$((files_fixed + 1))
            log_success "  Fixed: $file"
        fi
        
        rm -f "${file}.bak"
    done < <(find "$TARGET_DIR" -type f \( -name "*.ts" -o -name "*.py" \) -print0 2>/dev/null)
    
    # Python patterns
    while IFS= read -r -d '' file; do
        local modified=false
        
        cp "$file" "${file}.bak"
        
        if grep -qi "removal_policy=RemovalPolicy\.RETAIN\|deletion_protection=True" "$file" 2>/dev/null; then
            sed -i'' -e 's/removal_policy=RemovalPolicy\.RETAIN/removal_policy=RemovalPolicy.DESTROY/g' "$file"
            sed -i'' -e 's/deletion_protection=True/deletion_protection=False/g' "$file"
            modified=true
        fi
        
        if [ "$modified" = true ] && ! diff -q "$file" "${file}.bak" > /dev/null 2>&1; then
            files_fixed=$((files_fixed + 1))
            log_success "  Fixed: $file"
        fi
        
        rm -f "${file}.bak"
    done < <(find "$TARGET_DIR" -type f -name "*.py" -print0 2>/dev/null)
    
    # CloudFormation/YAML patterns
    while IFS= read -r -d '' file; do
        local modified=false
        
        cp "$file" "${file}.bak"
        
        if grep -qi "DeletionPolicy:\s*Retain\|UpdateReplacePolicy:\s*Retain" "$file" 2>/dev/null; then
            sed -i'' -e 's/DeletionPolicy: Retain/DeletionPolicy: Delete/g' "$file"
            sed -i'' -e 's/UpdateReplacePolicy: Retain/UpdateReplacePolicy: Delete/g' "$file"
            modified=true
        fi
        
        if [ "$modified" = true ] && ! diff -q "$file" "${file}.bak" > /dev/null 2>&1; then
            files_fixed=$((files_fixed + 1))
            log_success "  Fixed: $file"
        fi
        
        rm -f "${file}.bak"
    done < <(find "$TARGET_DIR" -type f \( -name "*.yaml" -o -name "*.yml" \) -print0 2>/dev/null)
    
    if [ $files_fixed -gt 0 ]; then
        FIXES_APPLIED=$((FIXES_APPLIED + files_fixed))
        log_success "Fixed removal policies in $files_fixed file(s)"
    else
        log_info "No RETAIN policies found"
    fi
}

# Fix: AWS Config IAM policy name
fix_config_iam_policy() {
    log_info "Fixing AWS Config IAM policy references..."
    
    local files_fixed=0
    
    while IFS= read -r -d '' file; do
        local modified=false
        
        cp "$file" "${file}.bak"
        
        # Fix incorrect policy ARNs - the correct one is service-role/AWS_ConfigRole
        if grep -qi "aws:policy/ConfigRole\|aws:policy/AWS_ConfigRole" "$file" 2>/dev/null; then
            # Only fix if it's not already correct
            if ! grep -q "aws:policy/service-role/AWS_ConfigRole" "$file" 2>/dev/null; then
                sed -i'' -e 's|aws:policy/ConfigRole|aws:policy/service-role/AWS_ConfigRole|g' "$file"
                sed -i'' -e 's|aws:policy/AWS_ConfigRole|aws:policy/service-role/AWS_ConfigRole|g' "$file"
                modified=true
            fi
        fi
        
        if [ "$modified" = true ] && ! diff -q "$file" "${file}.bak" > /dev/null 2>&1; then
            files_fixed=$((files_fixed + 1))
            log_success "  Fixed: $file"
        fi
        
        rm -f "${file}.bak"
    done < <(find "$TARGET_DIR" -type f \( -name "*.ts" -o -name "*.py" -o -name "*.yaml" -o -name "*.yml" -o -name "*.json" \) -print0 2>/dev/null)
    
    if [ $files_fixed -gt 0 ]; then
        FIXES_APPLIED=$((FIXES_APPLIED + files_fixed))
        log_success "Fixed AWS Config IAM policies in $files_fixed file(s)"
    else
        log_info "No incorrect AWS Config IAM policy references found"
    fi
}

# Fix: Lambda reserved concurrency
fix_lambda_concurrency() {
    log_info "Fixing Lambda reserved concurrency issues..."
    
    local files_fixed=0
    
    while IFS= read -r -d '' file; do
        local modified=false
        
        cp "$file" "${file}.bak"
        
        # Remove reservedConcurrentExecutions entirely (safest fix)
        if grep -q "reservedConcurrentExecutions" "$file" 2>/dev/null; then
            # Remove the entire line containing reservedConcurrentExecutions
            sed -i'' '/reservedConcurrentExecutions/d' "$file"
            modified=true
        fi
        
        # Python: reserved_concurrent_executions
        if grep -q "reserved_concurrent_executions" "$file" 2>/dev/null; then
            sed -i'' '/reserved_concurrent_executions/d' "$file"
            modified=true
        fi
        
        if [ "$modified" = true ] && ! diff -q "$file" "${file}.bak" > /dev/null 2>&1; then
            files_fixed=$((files_fixed + 1))
            log_success "  Fixed: $file"
        fi
        
        rm -f "${file}.bak"
    done < <(find "$TARGET_DIR" -type f \( -name "*.ts" -o -name "*.py" \) -print0 2>/dev/null)
    
    if [ $files_fixed -gt 0 ]; then
        FIXES_APPLIED=$((FIXES_APPLIED + files_fixed))
        log_success "Fixed Lambda concurrency in $files_fixed file(s)"
    else
        log_info "No Lambda reserved concurrency issues found"
    fi
}

# Fix: CloudWatch Synthetics deprecated runtime
fix_synthetics_runtime() {
    log_info "Fixing CloudWatch Synthetics deprecated runtimes..."
    
    local files_fixed=0
    
    while IFS= read -r -d '' file; do
        local modified=false
        
        cp "$file" "${file}.bak"
        
        # Fix deprecated runtimes (versions 0-5 are deprecated, use 6.0+)
        if grep -qE "SYNTHETICS_NODEJS_PUPPETEER_[0-5]" "$file" 2>/dev/null; then
            sed -i'' -E 's/SYNTHETICS_NODEJS_PUPPETEER_[0-5]_[0-9]/SYNTHETICS_NODEJS_PUPPETEER_6_0/g' "$file"
            sed -i'' -E 's/SYNTHETICS_NODEJS_PUPPETEER_[0-5]\.[0-9]/SYNTHETICS_NODEJS_PUPPETEER_6_0/g' "$file"
            # Also handle syn-nodejs-puppeteer-X.X format
            sed -i'' -E 's/syn-nodejs-puppeteer-[0-5]\.[0-9]/syn-nodejs-puppeteer-6.0/g' "$file"
            modified=true
        fi
        
        if [ "$modified" = true ] && ! diff -q "$file" "${file}.bak" > /dev/null 2>&1; then
            files_fixed=$((files_fixed + 1))
            log_success "  Fixed: $file"
        fi
        
        rm -f "${file}.bak"
    done < <(find "$TARGET_DIR" -type f \( -name "*.ts" -o -name "*.py" -o -name "*.yaml" -o -name "*.yml" \) -print0 2>/dev/null)
    
    if [ $files_fixed -gt 0 ]; then
        FIXES_APPLIED=$((FIXES_APPLIED + files_fixed))
        log_success "Fixed Synthetics runtime in $files_fixed file(s)"
    else
        log_info "No deprecated Synthetics runtimes found"
    fi
}

# Fix: Remove GuardDuty detector creation (account-level resource)
fix_guardduty() {
    log_info "Checking for GuardDuty detector creation (account-level resource)..."
    
    local files_with_guardduty=0
    
    while IFS= read -r -d '' file; do
        if grep -qi "guardduty\|GuardDuty" "$file" 2>/dev/null; then
            files_with_guardduty=$((files_with_guardduty + 1))
            log_warning "  Found GuardDuty in: $file"
            log_warning "  GuardDuty is account-level - only ONE detector per account/region"
            log_warning "  Consider removing or adding existence check before creation"
        fi
    done < <(find "$TARGET_DIR" -type f \( -name "*.ts" -o -name "*.py" \) -print0 2>/dev/null)
    
    if [ $files_with_guardduty -gt 0 ]; then
        log_warning "Found GuardDuty references in $files_with_guardduty file(s)"
        log_warning "Manual review recommended - cannot auto-fix account-level resource conflicts"
    else
        log_info "No GuardDuty detector creation found"
    fi
}

# Main function
main() {
    echo "🔧 Code Pattern Fixer"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Issue type: $ISSUE_TYPE"
    echo "Target directory: $TARGET_DIR"
    echo ""
    
    if [ ! -d "$TARGET_DIR" ]; then
        log_error "Target directory not found: $TARGET_DIR"
        exit 1
    fi
    
    get_platform_info
    echo "Platform: $PLATFORM, Language: $LANGUAGE"
    echo ""
    
    case "$ISSUE_TYPE" in
        "aws_sdk_v2")
            fix_aws_sdk_v2
            ;;
        "environment_suffix")
            fix_environment_suffix
            ;;
        "removal_policy")
            fix_removal_policy
            ;;
        "config_iam")
            fix_config_iam_policy
            ;;
        "lambda_concurrency")
            fix_lambda_concurrency
            ;;
        "synthetics_runtime")
            fix_synthetics_runtime
            ;;
        "guardduty")
            fix_guardduty
            ;;
        "all"|"scan")
            log_info "Running all code pattern fixes..."
            echo ""
            fix_environment_suffix
            echo ""
            fix_removal_policy
            echo ""
            fix_config_iam_policy
            echo ""
            fix_lambda_concurrency
            echo ""
            fix_synthetics_runtime
            echo ""
            fix_guardduty
            echo ""
            # AWS SDK v2 fix is more invasive, only run if detected
            if grep -rq "require('aws-sdk')\|from 'aws-sdk'" "$TARGET_DIR" 2>/dev/null; then
                fix_aws_sdk_v2
            fi
            ;;
        *)
            log_error "Unknown issue type: $ISSUE_TYPE"
            echo ""
            echo "Supported issue types:"
            echo "  aws_sdk_v2        - Convert AWS SDK v2 to v3 for Node.js 18+"
            echo "  environment_suffix - Add environmentSuffix to hardcoded resource names"
            echo "  removal_policy    - Change RETAIN to DESTROY for destroyability"
            echo "  config_iam        - Fix AWS Config IAM policy references"
            echo "  lambda_concurrency - Remove/fix reserved concurrency issues"
            echo "  synthetics_runtime - Update deprecated CloudWatch Synthetics runtime"
            echo "  guardduty         - Check for GuardDuty detector issues"
            echo "  all/scan          - Run all fixes"
            exit 1
            ;;
    esac
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    if [ $FIXES_APPLIED -gt 0 ]; then
        log_success "Total fixes applied: $FIXES_APPLIED"
    else
        log_info "No fixes needed"
    fi
    
    exit 0
}

main "$@"


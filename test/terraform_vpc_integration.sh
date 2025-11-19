#!/bin/bash
# Integration tests for Terraform VPC Infrastructure using AWS CLI
# Tests verify actual deployed resources match requirements

set -e

OUTPUTS_FILE="../cfn-outputs/flat-outputs.json"
REGION="us-east-1"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Load outputs
if [ ! -f "$OUTPUTS_FILE" ]; then
    echo -e "${RED}❌ Outputs file not found${NC}"
    exit 1
fi

VPC_ID=$(jq -r '.vpc_id' "$OUTPUTS_FILE")
VPC_CIDR=$(jq -r '.vpc_cidr' "$OUTPUTS_FILE")
NAT_GW_ID=$(jq -r '.nat_gateway_ids' "$OUTPUTS_FILE")
FLOW_LOGS_BUCKET=$(jq -r '.flow_logs_bucket' "$OUTPUTS_FILE")

echo "Testing VPC Infrastructure..."
echo "VPC ID: $VPC_ID"
echo "VPC CIDR: $VPC_CIDR"
echo "NAT Gateway: $NAT_GW_ID"
echo "Flow Logs Bucket: $FLOW_LOGS_BUCKET"
echo ""

# Test counters
PASSED=0
FAILED=0

# Helper function to run tests
run_test() {
    local test_name="$1"
    local command="$2"

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $test_name"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $test_name"
        ((FAILED++))
    fi
}

# VPC Tests
echo "=== VPC Validation ==="
run_test "VPC exists" "aws ec2 describe-vpcs --vpc-ids $VPC_ID --region $REGION --query 'Vpcs[0].VpcId' --output text | grep -q $VPC_ID"
run_test "VPC CIDR is correct" "aws ec2 describe-vpcs --vpc-ids $VPC_ID --region $REGION --query 'Vpcs[0].CidrBlock' --output text | grep -q '$VPC_CIDR'"
run_test "VPC has DNS support enabled" "aws ec2 describe-vpcs --vpc-ids $VPC_ID --region $REGION --query 'Vpcs[0].EnableDnsSupport' --output text | grep -q 'true'"
run_test "VPC has DNS hostnames enabled" "aws ec2 describe-vpcs --vpc-ids $VPC_ID --region $REGION --query 'Vpcs[0].EnableDnsHostnames' --output text | grep -q 'true'"

# Subnet Tests
echo ""
echo "=== Subnet Validation ==="
SUBNET_COUNT=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --region $REGION --query 'length(Subnets)' --output text)
run_test "Exactly 9 subnets exist" "[ $SUBNET_COUNT -eq 9 ]"

PUBLIC_SUBNET_COUNT=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Type,Values=Public" --region $REGION --query 'length(Subnets)' --output text)
run_test "3 public subnets exist" "[ $PUBLIC_SUBNET_COUNT -eq 3 ]"

PRIVATE_SUBNET_COUNT=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Type,Values=Private" --region $REGION --query 'length(Subnets)' --output text)
run_test "3 private subnets exist" "[ $PRIVATE_SUBNET_COUNT -eq 3 ]"

DATABASE_SUBNET_COUNT=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Type,Values=Database" --region $REGION --query 'length(Subnets)' --output text)
run_test "3 database subnets exist" "[ $DATABASE_SUBNET_COUNT -eq 3 ]"

# Internet Gateway Tests
echo ""
echo "=== Internet Gateway Validation ==="
IGW_COUNT=$(aws ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=$VPC_ID" --region $REGION --query 'length(InternetGateways)' --output text)
run_test "Internet Gateway is attached" "[ $IGW_COUNT -eq 1 ]"

# NAT Gateway Tests
echo ""
echo "=== NAT Gateway Validation ==="
NAT_GW_COUNT=$(aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=$VPC_ID" "Name=state,Values=available" --region $REGION --query 'length(NatGateways)' --output text)
run_test "Exactly 1 NAT Gateway exists (quota-constrained)" "[ $NAT_GW_COUNT -eq 1 ]"
run_test "NAT Gateway is available" "aws ec2 describe-nat-gateways --nat-gateway-ids $NAT_GW_ID --region $REGION --query 'NatGateways[0].State' --output text | grep -q 'available'"

# Route Table Tests
echo ""
echo "=== Route Table Validation ==="
PUBLIC_RT_COUNT=$(aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Name,Values=*public*" --region $REGION --query 'length(RouteTables)' --output text)
run_test "Public route table exists" "[ $PUBLIC_RT_COUNT -ge 1 ]"

PRIVATE_RT_COUNT=$(aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Name,Values=*private*" --region $REGION --query 'length(RouteTables)' --output text)
run_test "Private route tables exist (3)" "[ $PRIVATE_RT_COUNT -eq 3 ]"

DATABASE_RT_COUNT=$(aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Name,Values=*database*" --region $REGION --query 'length(RouteTables)' --output text)
run_test "Database route tables exist (3)" "[ $DATABASE_RT_COUNT -eq 3 ]"

# Network ACL Tests
echo ""
echo "=== Network ACL Validation ==="
NACL_COUNT=$(aws ec2 describe-network-acls --filters "Name=vpc-id,Values=$VPC_ID" --region $REGION --query 'length(NetworkAcls[?!IsDefault])' --output text)
run_test "Custom Network ACLs exist" "[ $NACL_COUNT -ge 3 ]"

# VPC Flow Logs Tests
echo ""
echo "=== VPC Flow Logs Validation ==="
FLOW_LOG_COUNT=$(aws ec2 describe-flow-logs --filter "Name=resource-id,Values=$VPC_ID" --region $REGION --query 'length(FlowLogs)' --output text)
run_test "VPC Flow Log exists" "[ $FLOW_LOG_COUNT -eq 1 ]"
run_test "Flow Log is active" "aws ec2 describe-flow-logs --filter 'Name=resource-id,Values=$VPC_ID' --region $REGION --query 'FlowLogs[0].FlowLogStatus' --output text | grep -q 'ACTIVE'"

# S3 Bucket Tests
echo ""
echo "=== S3 Bucket Validation ==="
run_test "S3 bucket exists" "aws s3 ls s3://$FLOW_LOGS_BUCKET --region $REGION"
run_test "S3 bucket has encryption" "aws s3api get-bucket-encryption --bucket $FLOW_LOGS_BUCKET --region $REGION --query 'ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm' --output text | grep -q 'AES256'"
run_test "S3 bucket has lifecycle policy" "aws s3api get-bucket-lifecycle-configuration --bucket $FLOW_LOGS_BUCKET --region $REGION --query 'Rules[0].Status' --output text | grep -q 'Enabled'"
run_test "S3 bucket blocks public access" "aws s3api get-public-access-block --bucket $FLOW_LOGS_BUCKET --region $REGION --query 'PublicAccessBlockConfiguration.BlockPublicAcls' --output text | grep -q 'true'"

# High Availability Tests
echo ""
echo "=== High Availability Validation ==="
AZ_COUNT=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --region $REGION --query 'Subnets[*].AvailabilityZone' --output text | tr '\t' '\n' | sort -u | wc -l)
run_test "Subnets span 3+ availability zones" "[ $AZ_COUNT -ge 3 ]"

# Summary
echo ""
echo "================================"
echo "Test Summary:"
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED${NC}"
    exit 1
else
    echo "Failed: $FAILED"
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
fi

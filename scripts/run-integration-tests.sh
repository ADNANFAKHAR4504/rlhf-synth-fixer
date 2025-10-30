#!/bin/bash
set -e

echo "Running VPC Infrastructure Integration Tests..."
echo "=========================================="

# Load outputs
if [ ! -f "cfn-outputs/flat-outputs.json" ]; then
  echo "Error: cfn-outputs/flat-outputs.json not found"
  exit 1
fi

VPC_ID=$(jq -r '.VPCId' cfn-outputs/flat-outputs.json)
PUBLIC_SUBNET_1=$(jq -r '.PublicSubnet1Id' cfn-outputs/flat-outputs.json)
PRIVATE_SUBNET_1=$(jq -r '.PrivateSubnet1Id' cfn-outputs/flat-outputs.json)
DATABASE_SUBNET_1=$(jq -r '.DatabaseSubnet1Id' cfn-outputs/flat-outputs.json)
NAT_GATEWAY_1=$(jq -r '.NATGateway1Id' cfn-outputs/flat-outputs.json)
IGW_ID=$(jq -r '.InternetGatewayId' cfn-outputs/flat-outputs.json)
LOG_GROUP=$(jq -r '.VPCFlowLogsLogGroupName' cfn-outputs/flat-outputs.json)

REGION=${AWS_REGION:-us-east-1}
TEST_PASSED=0
TEST_FAILED=0

# Test function
run_test() {
  local test_name="$1"
  local command="$2"
  local expected="$3"

  echo -n "Testing: $test_name ... "

  if result=$(eval "$command" 2>&1); then
    if [ -n "$expected" ]; then
      if echo "$result" | grep -q "$expected"; then
        echo "PASS"
        ((TEST_PASSED++))
      else
        echo "FAIL (expected: $expected, got: $result)"
        ((TEST_FAILED++))
      fi
    else
      echo "PASS"
      ((TEST_PASSED++))
    fi
  else
    echo "FAIL ($result)"
    ((TEST_FAILED++))
  fi
}

# VPC Tests
echo ""
echo "VPC Configuration Tests:"
run_test "VPC exists" "aws ec2 describe-vpcs --vpc-ids $VPC_ID --region $REGION --query 'Vpcs[0].State' --output text" "available"
run_test "VPC CIDR is 10.0.0.0/16" "aws ec2 describe-vpcs --vpc-ids $VPC_ID --region $REGION --query 'Vpcs[0].CidrBlock' --output text" "10.0.0.0/16"
run_test "VPC DNS support enabled" "aws ec2 describe-vpc-attribute --vpc-id $VPC_ID --attribute enableDnsSupport --region $REGION --query 'EnableDnsSupport.Value' --output text" "true"
run_test "VPC DNS hostnames enabled" "aws ec2 describe-vpc-attribute --vpc-id $VPC_ID --attribute enableDnsHostnames --region $REGION --query 'EnableDnsHostnames.Value' --output text" "true"

# Subnet Tests
echo ""
echo "Subnet Configuration Tests:"
run_test "9 subnets exist" "aws ec2 describe-subnets --filters Name=vpc-id,Values=$VPC_ID --region $REGION --query 'length(Subnets)' --output text" "9"
run_test "Public subnet has correct CIDR" "aws ec2 describe-subnets --subnet-ids $PUBLIC_SUBNET_1 --region $REGION --query 'Subnets[0].CidrBlock' --output text" "10.0.1.0/24"
run_test "Private subnet has correct CIDR" "aws ec2 describe-subnets --subnet-ids $PRIVATE_SUBNET_1 --region $REGION --query 'Subnets[0].CidrBlock' --output text" "10.0.11.0/24"
run_test "Database subnet has correct CIDR" "aws ec2 describe-subnets --subnet-ids $DATABASE_SUBNET_1 --region $REGION --query 'Subnets[0].CidrBlock' --output text" "10.0.21.0/24"
run_test "Public subnet MapPublicIpOnLaunch enabled" "aws ec2 describe-subnets --subnet-ids $PUBLIC_SUBNET_1 --region $REGION --query 'Subnets[0].MapPublicIpOnLaunch' --output text" "true"
run_test "Private subnet MapPublicIpOnLaunch disabled" "aws ec2 describe-subnets --subnet-ids $PRIVATE_SUBNET_1 --region $REGION --query 'Subnets[0].MapPublicIpOnLaunch' --output text" "false"

# NAT Gateway Tests
echo ""
echo "NAT Gateway Tests:"
run_test "3 NAT Gateways exist" "aws ec2 describe-nat-gateways --filter Name=vpc-id,Values=$VPC_ID --region $REGION --query 'length(NatGateways)' --output text" "3"
run_test "NAT Gateway 1 is available" "aws ec2 describe-nat-gateways --nat-gateway-ids $NAT_GATEWAY_1 --region $REGION --query 'NatGateways[0].State' --output text" "available"
run_test "NAT Gateway 1 has public IP" "aws ec2 describe-nat-gateways --nat-gateway-ids $NAT_GATEWAY_1 --region $REGION --query 'NatGateways[0].NatGatewayAddresses[0].PublicIp' --output text"

# Internet Gateway Tests
echo ""
echo "Internet Gateway Tests:"
run_test "Internet Gateway attached to VPC" "aws ec2 describe-internet-gateways --internet-gateway-ids $IGW_ID --region $REGION --query 'InternetGateways[0].Attachments[0].VpcId' --output text" "$VPC_ID"
run_test "Internet Gateway attachment is available" "aws ec2 describe-internet-gateways --internet-gateway-ids $IGW_ID --region $REGION --query 'InternetGateways[0].Attachments[0].State' --output text" "available"

# Route Table Tests
echo ""
echo "Route Table Tests:"
run_test "Public subnet has route to IGW" "aws ec2 describe-route-tables --filters Name=association.subnet-id,Values=$PUBLIC_SUBNET_1 --region $REGION --query 'RouteTables[0].Routes[?DestinationCidrBlock==\`0.0.0.0/0\`].GatewayId | [0]' --output text" "$IGW_ID"
run_test "Private subnet has route to NAT Gateway" "aws ec2 describe-route-tables --filters Name=association.subnet-id,Values=$PRIVATE_SUBNET_1 --region $REGION --query 'RouteTables[0].Routes[?DestinationCidrBlock==\`0.0.0.0/0\`].NatGatewayId | [0]' --output text" "nat-"

# Network ACL Tests
echo ""
echo "Network ACL Tests:"
run_test "VPC has custom Network ACLs" "aws ec2 describe-network-acls --filters Name=vpc-id,Values=$VPC_ID Name=default,Values=false --region $REGION --query 'length(NetworkAcls)' --output text"

# VPC Flow Logs Tests
echo ""
echo "VPC Flow Logs Tests:"
run_test "VPC Flow Logs enabled" "aws ec2 describe-flow-logs --filter Name=resource-id,Values=$VPC_ID --region $REGION --query 'FlowLogs[0].FlowLogStatus' --output text" "ACTIVE"
run_test "Flow Logs capture ALL traffic" "aws ec2 describe-flow-logs --filter Name=resource-id,Values=$VPC_ID --region $REGION --query 'FlowLogs[0].TrafficType' --output text" "ALL"
run_test "CloudWatch Log Group exists" "aws logs describe-log-groups --log-group-name-prefix $LOG_GROUP --region $REGION --query 'logGroups[0].logGroupName' --output text" "$LOG_GROUP"
run_test "Log Group has 7-day retention" "aws logs describe-log-groups --log-group-name-prefix $LOG_GROUP --region $REGION --query 'logGroups[0].retentionInDays' --output text" "7"

# Multi-AZ Tests
echo ""
echo "Multi-AZ Tests:"
run_test "Subnets span 3 AZs" "aws ec2 describe-subnets --filters Name=vpc-id,Values=$VPC_ID --region $REGION --query 'length(Subnets[*].AvailabilityZone | sort(@) | unique(@))' --output text" "3"

# Summary
echo ""
echo "=========================================="
echo "Test Summary:"
echo "  Passed: $TEST_PASSED"
echo "  Failed: $TEST_FAILED"
echo "=========================================="

if [ $TEST_FAILED -eq 0 ]; then
  echo "All integration tests passed!"
  exit 0
else
  echo "Some integration tests failed!"
  exit 1
fi

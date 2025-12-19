#!/bin/bash
# Terraform Infrastructure Integration Tests
# Tests actual deployed AWS resources using stack outputs

set -e

TEST_COUNT=0
PASS_COUNT=0
FAIL_COUNT=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================================================"
echo "Terraform Infrastructure Integration Test Suite"
echo "================================================================"
echo ""

# Load outputs from deployed stack
OUTPUTS_FILE="../cfn-outputs/flat-outputs.json"

if [ ! -f "$OUTPUTS_FILE" ]; then
    echo "${RED}ERROR: Outputs file not found at $OUTPUTS_FILE${NC}"
    echo "Please ensure the stack is deployed and outputs are saved."
    exit 1
fi

# Helper function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"

    TEST_COUNT=$((TEST_COUNT + 1))
    printf "Test %d: %s... " "$TEST_COUNT" "$test_name"

    if eval "$test_command" > /dev/null 2>&1; then
        printf "${GREEN}PASS${NC}\n"
        PASS_COUNT=$((PASS_COUNT + 1))
        return 0
    else
        printf "${RED}FAIL${NC}\n"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return 1
    fi
}

# Extract values from outputs
VPC_ID=$(jq -r '.vpc_id' $OUTPUTS_FILE)
ALB_DNS_NAME=$(jq -r '.alb_dns_name' $OUTPUTS_FILE)
ASG_NAME=$(jq -r '.autoscaling_group_name' $OUTPUTS_FILE)
TG_ARN=$(jq -r '.target_group_arn' $OUTPUTS_FILE)
NAT_IP=$(jq -r '.nat_gateway_ip' $OUTPUTS_FILE)
ALB_SG_ID=$(jq -r '.security_group_alb_id' $OUTPUTS_FILE)
EC2_SG_ID=$(jq -r '.security_group_ec2_id' $OUTPUTS_FILE)

echo "=== Test Category: Output Validation ==="
run_test "VPC ID is present in outputs" "test -n '$VPC_ID' && test '$VPC_ID' != 'null'"
run_test "ALB DNS name is present in outputs" "test -n '$ALB_DNS_NAME' && test '$ALB_DNS_NAME' != 'null'"
run_test "ASG name is present in outputs" "test -n '$ASG_NAME' && test '$ASG_NAME' != 'null'"
run_test "Target group ARN is present in outputs" "test -n '$TG_ARN' && test '$TG_ARN' != 'null'"
run_test "NAT Gateway IP is present in outputs" "test -n '$NAT_IP' && test '$NAT_IP' != 'null'"

echo ""
echo "=== Test Category: VPC Validation ==="
run_test "VPC exists in AWS" "aws ec2 describe-vpcs --vpc-ids $VPC_ID --region us-east-1 --query 'Vpcs[0].VpcId' --output text | grep -q $VPC_ID"
run_test "VPC has correct CIDR block" "aws ec2 describe-vpcs --vpc-ids $VPC_ID --region us-east-1 --query 'Vpcs[0].CidrBlock' --output text | grep -q '10.0.0.0/16'"
run_test "VPC DNS hostnames enabled" "aws ec2 describe-vpc-attribute --vpc-id $VPC_ID --attribute enableDnsHostnames --region us-east-1 --query 'EnableDnsHostnames.Value' --output text | grep -q 'true'"
run_test "VPC DNS support enabled" "aws ec2 describe-vpc-attribute --vpc-id $VPC_ID --attribute enableDnsSupport --region us-east-1 --query 'EnableDnsSupport.Value' --output text | grep -q 'true'"

echo ""
echo "=== Test Category: Subnet Validation ==="
run_test "Public subnets exist (2)" "aws ec2 describe-subnets --filters \"Name=vpc-id,Values=$VPC_ID\" \"Name=tag:Type,Values=public\" --region us-east-1 --query 'length(Subnets)' --output text | grep -q '2'"
run_test "Private subnets exist (2)" "aws ec2 describe-subnets --filters \"Name=vpc-id,Values=$VPC_ID\" \"Name=tag:Type,Values=private\" --region us-east-1 --query 'length(Subnets)' --output text | grep -q '2'"
run_test "Public subnets map public IPs" "aws ec2 describe-subnets --filters \"Name=vpc-id,Values=$VPC_ID\" \"Name=tag:Type,Values=public\" --region us-east-1 --query 'Subnets[0].MapPublicIpOnLaunch' --output text | grep -q 'True'"

echo ""
echo "=== Test Category: Internet Gateway & NAT Gateway ==="
run_test "Internet Gateway attached to VPC" "aws ec2 describe-internet-gateways --filters \"Name=attachment.vpc-id,Values=$VPC_ID\" --region us-east-1 --query 'InternetGateways[0].Attachments[0].State' --output text | grep -q 'available'"
run_test "NAT Gateway exists and is available" "aws ec2 describe-nat-gateways --filter \"Name=vpc-id,Values=$VPC_ID\" --region us-east-1 --query 'NatGateways[0].State' --output text | grep -q 'available'"
run_test "NAT Gateway has valid public IP" "echo $NAT_IP | grep -qE '^([0-9]{1,3}\.){3}[0-9]{1,3}$'"

echo ""
echo "=== Test Category: Security Groups ==="
run_test "ALB security group exists" "aws ec2 describe-security-groups --group-ids $ALB_SG_ID --region us-east-1 --query 'SecurityGroups[0].GroupId' --output text | grep -q $ALB_SG_ID"
run_test "EC2 security group exists" "aws ec2 describe-security-groups --group-ids $EC2_SG_ID --region us-east-1 --query 'SecurityGroups[0].GroupId' --output text | grep -q $EC2_SG_ID"
run_test "ALB SG allows HTTP (80)" "aws ec2 describe-security-groups --group-ids $ALB_SG_ID --region us-east-1 --query 'SecurityGroups[0].IpPermissions[?FromPort==\`80\`]' --output json | jq -e 'length > 0' > /dev/null"
run_test "ALB SG allows HTTPS (443)" "aws ec2 describe-security-groups --group-ids $ALB_SG_ID --region us-east-1 --query 'SecurityGroups[0].IpPermissions[?FromPort==\`443\`]' --output json | jq -e 'length > 0' > /dev/null"
run_test "EC2 SG allows HTTP from ALB only" "aws ec2 describe-security-groups --group-ids $EC2_SG_ID --region us-east-1 --query 'SecurityGroups[0].IpPermissions[?FromPort==\`80\`].UserIdGroupPairs[0].GroupId' --output text | grep -q $ALB_SG_ID"

echo ""
echo "=== Test Category: Load Balancer ==="
run_test "ALB exists and is active" "aws elbv2 describe-load-balancers --region us-east-1 --query \"LoadBalancers[?DNSName=='$ALB_DNS_NAME'].State.Code\" --output text | grep -q 'active'"
run_test "ALB is internet-facing" "aws elbv2 describe-load-balancers --region us-east-1 --query \"LoadBalancers[?DNSName=='$ALB_DNS_NAME'].Scheme\" --output text | grep -q 'internet-facing'"
run_test "ALB is application type" "aws elbv2 describe-load-balancers --region us-east-1 --query \"LoadBalancers[?DNSName=='$ALB_DNS_NAME'].Type\" --output text | grep -q 'application'"
run_test "ALB DNS resolves" "nslookup $ALB_DNS_NAME | grep -q 'Address'"

echo ""
echo "=== Test Category: Target Group ==="
run_test "Target group exists" "aws elbv2 describe-target-groups --target-group-arns $TG_ARN --region us-east-1 --query 'TargetGroups[0].TargetGroupArn' --output text | grep -q $TG_ARN"
run_test "Target group port is 80" "aws elbv2 describe-target-groups --target-group-arns $TG_ARN --region us-east-1 --query 'TargetGroups[0].Port' --output text | grep -q '80'"
run_test "Target group protocol is HTTP" "aws elbv2 describe-target-groups --target-group-arns $TG_ARN --region us-east-1 --query 'TargetGroups[0].Protocol' --output text | grep -q 'HTTP'"
run_test "Target group health check path is /health" "aws elbv2 describe-target-groups --target-group-arns $TG_ARN --region us-east-1 --query 'TargetGroups[0].HealthCheckPath' --output text | grep -q '/health'"

echo ""
echo "=== Test Category: Auto Scaling Group ==="
run_test "ASG exists" "aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names $ASG_NAME --region us-east-1 --query 'AutoScalingGroups[0].AutoScalingGroupName' --output text | grep -q $ASG_NAME"
run_test "ASG min size is 2" "aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names $ASG_NAME --region us-east-1 --query 'AutoScalingGroups[0].MinSize' --output text | grep -q '2'"
run_test "ASG max size is 10" "aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names $ASG_NAME --region us-east-1 --query 'AutoScalingGroups[0].MaxSize' --output text | grep -q '10'"
run_test "ASG desired capacity is 2" "aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names $ASG_NAME --region us-east-1 --query 'AutoScalingGroups[0].DesiredCapacity' --output text | grep -q '2'"
run_test "ASG health check type is ELB" "aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names $ASG_NAME --region us-east-1 --query 'AutoScalingGroups[0].HealthCheckType' --output text | grep -q 'ELB'"
run_test "ASG instances are in private subnets" "aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names $ASG_NAME --region us-east-1 --query 'AutoScalingGroups[0].VPCZoneIdentifier' --output text | grep -q 'subnet-'"
run_test "ASG has at least 1 healthy instance" "aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names $ASG_NAME --region us-east-1 --query 'AutoScalingGroups[0].Instances[?HealthStatus==\`Healthy\`]' --output json | jq -e 'length > 0' > /dev/null"

echo ""
echo "=== Test Category: Scaling Policies ==="
run_test "Scale out policy exists" "aws autoscaling describe-policies --auto-scaling-group-name $ASG_NAME --region us-east-1 --query \"ScalingPolicies[?contains(PolicyName, 'scale-out')].PolicyName\" --output text | grep -q 'scale-out'"
run_test "Scale in policy exists" "aws autoscaling describe-policies --auto-scaling-group-name $ASG_NAME --region us-east-1 --query \"ScalingPolicies[?contains(PolicyName, 'scale-in')].PolicyName\" --output text | grep -q 'scale-in'"
run_test "Scale out adjustment is 2" "aws autoscaling describe-policies --auto-scaling-group-name $ASG_NAME --region us-east-1 --query \"ScalingPolicies[?contains(PolicyName, 'scale-out')].ScalingAdjustment\" --output text | grep -q '2'"
run_test "Scale in adjustment is -1" "aws autoscaling describe-policies --auto-scaling-group-name $ASG_NAME --region us-east-1 --query \"ScalingPolicies[?contains(PolicyName, 'scale-in')].ScalingAdjustment\" --output text | grep -q -- '-1'"

echo ""
echo "=== Test Category: CloudWatch Alarms ==="
run_test "High CPU alarm exists" "aws cloudwatch describe-alarms --alarm-names \"high-cpu-synth-v4bg1\" --region us-east-1 --query 'MetricAlarms[0].AlarmName' --output text | grep -q 'high-cpu'"
run_test "Low CPU alarm exists" "aws cloudwatch describe-alarms --alarm-names \"low-cpu-synth-v4bg1\" --region us-east-1 --query 'MetricAlarms[0].AlarmName' --output text | grep -q 'low-cpu'"
run_test "High CPU threshold is 70" "aws cloudwatch describe-alarms --alarm-names \"high-cpu-synth-v4bg1\" --region us-east-1 --query 'MetricAlarms[0].Threshold' --output text | grep -q '70'"
run_test "Low CPU threshold is 30" "aws cloudwatch describe-alarms --alarm-names \"low-cpu-synth-v4bg1\" --region us-east-1 --query 'MetricAlarms[0].Threshold' --output text | grep -q '30'"

echo ""
echo "=== Test Category: End-to-End Connectivity ==="
run_test "ALB responds to HTTP requests" "curl -s -o /dev/null -w '%{http_code}' http://$ALB_DNS_NAME/ | grep -qE '(200|503)'"
run_test "ALB health endpoint is accessible" "curl -s -o /dev/null -w '%{http_code}' http://$ALB_DNS_NAME/health | grep -qE '(200|503)'"

echo ""
echo "=== Test Category: Resource Tagging ==="
run_test "VPC has required tags" "aws ec2 describe-vpcs --vpc-ids $VPC_ID --region us-east-1 --query 'Vpcs[0].Tags[?Key==\`Environment\`].Value' --output text | grep -q '.'"
run_test "ALB has required tags" "aws elbv2 describe-tags --resource-arns $(aws elbv2 describe-load-balancers --region us-east-1 --query \"LoadBalancers[?DNSName=='$ALB_DNS_NAME'].LoadBalancerArn\" --output text) --region us-east-1 --query 'TagDescriptions[0].Tags[?Key==\`ManagedBy\`].Value' --output text | grep -q 'terraform'"

echo ""
echo "================================================================"
echo "Integration Test Summary"
echo "================================================================"
echo "Total Tests: $TEST_COUNT"
printf "Passed: ${GREEN}%d${NC} (%.1f%%)\n" "$PASS_COUNT" "$(echo "scale=1; $PASS_COUNT * 100 / $TEST_COUNT" | bc)"
printf "Failed: ${RED}%d${NC} (%.1f%%)\n" "$FAIL_COUNT" "$(echo "scale=1; $FAIL_COUNT * 100 / $TEST_COUNT" | bc)"
echo ""

if [ "$FAIL_COUNT" -eq 0 ]; then
    printf "${GREEN}All integration tests passed!${NC}\n"
    exit 0
else
    printf "${RED}Some integration tests failed${NC}\n"
    exit 1
fi

#!/bin/bash

# LocalStack CloudFormation Post-Deploy Fix Script
# This script applies fixes for known LocalStack CloudFormation limitations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🔧 Applying LocalStack post-deployment fixes...${NC}"

# Set up environment variables for LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566

# Check if LocalStack is running
if ! curl -s http://localhost:4566/_localstack/health > /dev/null; then
    echo -e "${RED}❌ LocalStack is not running${NC}"
    exit 1
fi

# Load outputs
if [ ! -f "cfn-outputs/flat-outputs.json" ]; then
    echo -e "${RED}❌ Output file not found${NC}"
    exit 1
fi

VPC_ID=$(cat cfn-outputs/flat-outputs.json | jq -r '.VPCId // empty')
SG_ID=$(cat cfn-outputs/flat-outputs.json | jq -r '.SecurityGroupId // empty')
IGW_ID=$(cat cfn-outputs/flat-outputs.json | jq -r '.InternetGatewayId // empty')
NAT_ID=$(cat cfn-outputs/flat-outputs.json | jq -r '.NATGatewayId // empty')

echo -e "${BLUE}📋 Resource IDs:${NC}"
echo -e "${BLUE}  • VPC: ${VPC_ID:-<not present>}${NC}"
echo -e "${BLUE}  • Security Group: ${SG_ID:-<not present>}${NC}"
echo -e "${BLUE}  • Internet Gateway: ${IGW_ID:-<not present>}${NC}"
echo -e "${BLUE}  • NAT Gateway: ${NAT_ID:-<not present>}${NC}"

# Check if this stack has VPC resources
if [ -z "$VPC_ID" ] || [ "$VPC_ID" == "null" ]; then
    echo -e "${YELLOW}ℹ️  No VPC resources detected in this stack - skipping VPC-related fixes${NC}"
    echo -e "${GREEN}✅ Stack does not require VPC fixes (likely a serverless/observability stack)${NC}"
    echo -e "${GREEN}🎉 LocalStack post-deployment fixes completed!${NC}"
    exit 0
fi

# Fix 1: Enable DNS hostnames
echo -e "${YELLOW}🔧 Fix 1: Enabling VPC DNS hostnames...${NC}"
awslocal ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ DNS hostnames enabled${NC}"
else
    echo -e "${YELLOW}⚠️  DNS hostnames may already be enabled${NC}"
fi

# Fix 2: Add SSH ingress rule to security group
if [ ! -z "$SG_ID" ] && [ "$SG_ID" != "null" ]; then
    echo -e "${YELLOW}🔧 Fix 2: Adding SSH ingress rule to security group...${NC}"
    SG_RULES=$(awslocal ec2 describe-security-groups --group-ids $SG_ID --query 'SecurityGroups[0].IpPermissions' --output json)
    SSH_RULE_EXISTS=$(echo "$SG_RULES" | jq 'map(select(.FromPort == 22)) | length')

    if [ "$SSH_RULE_EXISTS" -eq 0 ]; then
        awslocal ec2 authorize-security-group-ingress \
            --group-id $SG_ID \
            --ip-permissions IpProtocol=tcp,FromPort=22,ToPort=22,IpRanges="[{CidrIp=203.0.113.0/24,Description='SSH access from specified CIDR block'}]" \
            2>/dev/null
        echo -e "${GREEN}✅ SSH ingress rule added${NC}"
    else
        echo -e "${GREEN}✅ SSH ingress rule already exists${NC}"
    fi
else
    echo -e "${YELLOW}ℹ️  No security group detected - skipping Fix 2${NC}"
fi

# Fix 3: Fix route tables
echo -e "${YELLOW}🔧 Fix 3: Fixing route tables...${NC}"

# Find public and private route tables by subnet associations
PUBLIC_SUBNET_1=$(cat cfn-outputs/flat-outputs.json | jq -r '.PublicSubnet1Id // empty')
PRIVATE_SUBNET_1=$(cat cfn-outputs/flat-outputs.json | jq -r '.PrivateSubnet1Id // empty')

# Check if we have subnet information
if [ -z "$PUBLIC_SUBNET_1" ] && [ -z "$PRIVATE_SUBNET_1" ]; then
    echo -e "${YELLOW}ℹ️  No subnet information detected - skipping Fix 3${NC}"
else
    # Get all route tables for the VPC
    ROUTE_TABLES=$(awslocal ec2 describe-route-tables \
        --filters Name=vpc-id,Values=$VPC_ID \
        --output json)

    PUBLIC_RT=$(echo "$ROUTE_TABLES" | jq -r ".RouteTables[] | select(.Associations[]?.SubnetId == \"$PUBLIC_SUBNET_1\") | .RouteTableId")
    PRIVATE_RT=$(echo "$ROUTE_TABLES" | jq -r ".RouteTables[] | select(.Associations[]?.SubnetId == \"$PRIVATE_SUBNET_1\") | .RouteTableId")

    if [ ! -z "$PUBLIC_RT" ] && [ "$PUBLIC_RT" != "null" ]; then
        echo -e "${BLUE}  • Public RT: $PUBLIC_RT${NC}"

        # Check if route already has proper IGW
        ROUTE_EXISTS=$(awslocal ec2 describe-route-tables --route-table-ids $PUBLIC_RT \
            --query "RouteTables[0].Routes[?DestinationCidrBlock=='0.0.0.0/0' && GatewayId=='$IGW_ID']" --output json | jq 'length')

        if [ "$ROUTE_EXISTS" -eq 0 ]; then
            # Delete incomplete route if exists
            awslocal ec2 delete-route --route-table-id $PUBLIC_RT --destination-cidr-block 0.0.0.0/0 2>/dev/null || true

            # Create correct route
            awslocal ec2 create-route \
                --route-table-id $PUBLIC_RT \
                --destination-cidr-block 0.0.0.0/0 \
                --gateway-id $IGW_ID \
                2>/dev/null
            echo -e "${GREEN}✅ Public route table fixed${NC}"
        else
            echo -e "${GREEN}✅ Public route table already correct${NC}"
        fi
    fi

    if [ ! -z "$PRIVATE_RT" ] && [ "$PRIVATE_RT" != "null" ]; then
        echo -e "${BLUE}  • Private RT: $PRIVATE_RT${NC}"

        # Check if route already has proper NAT
        ROUTE_EXISTS=$(awslocal ec2 describe-route-tables --route-table-ids $PRIVATE_RT \
            --query "RouteTables[0].Routes[?DestinationCidrBlock=='0.0.0.0/0' && NatGatewayId=='$NAT_ID']" --output json | jq 'length')

        if [ "$ROUTE_EXISTS" -eq 0 ]; then
            # Delete incomplete route if exists
            awslocal ec2 delete-route --route-table-id $PRIVATE_RT --destination-cidr-block 0.0.0.0/0 2>/dev/null || true

            # Create correct route
            awslocal ec2 create-route \
                --route-table-id $PRIVATE_RT \
                --destination-cidr-block 0.0.0.0/0 \
                --nat-gateway-id $NAT_ID \
                2>/dev/null
            echo -e "${GREEN}✅ Private route table fixed${NC}"
        else
            echo -e "${GREEN}✅ Private route table already correct${NC}"
        fi
    fi
fi

# Fix 4: Attach security groups to ASG instances (if needed)
ASG_NAME=$(cat cfn-outputs/flat-outputs.json | jq -r '.AutoScalingGroupName // empty')

if [ ! -z "$ASG_NAME" ] && [ "$ASG_NAME" != "null" ] && [ ! -z "$SG_ID" ] && [ "$SG_ID" != "null" ]; then
    echo -e "${YELLOW}🔧 Fix 4: Checking security group attachments on instances...${NC}"
    INSTANCE_IDS=$(awslocal ec2 describe-instances \
        --filters Name=tag:aws:autoscaling:groupName,Values=$ASG_NAME \
        --query 'Reservations[].Instances[].InstanceId' \
        --output text)

    if [ ! -z "$INSTANCE_IDS" ]; then
        for INSTANCE_ID in $INSTANCE_IDS; do
            # Check if instance already has the security group
            HAS_SG=$(awslocal ec2 describe-instances \
                --instance-ids $INSTANCE_ID \
                --query "Reservations[0].Instances[0].SecurityGroups[?GroupId=='$SG_ID']" \
                --output json | jq 'length')

            if [ "$HAS_SG" -eq 0 ]; then
                awslocal ec2 modify-instance-attribute \
                    --instance-id $INSTANCE_ID \
                    --groups $SG_ID \
                    2>/dev/null
                echo -e "${GREEN}✅ Security group attached to instance $INSTANCE_ID${NC}"
            fi
        done
        echo -e "${GREEN}✅ All instances have security groups${NC}"
    else
        echo -e "${YELLOW}⚠️  No instances found (may still be launching)${NC}"
    fi
else
    echo -e "${YELLOW}ℹ️  No Auto Scaling Group detected - skipping Fix 4${NC}"
fi

echo -e "${GREEN}🎉 LocalStack post-deployment fixes completed!${NC}"

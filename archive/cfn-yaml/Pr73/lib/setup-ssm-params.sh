#!/bin/bash
# SSM Parameter Setup Script
# This script creates SSM parameters with real infrastructure values
# It uses the default VPC to get real resource IDs for SSM parameters

set -e

export AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION:-us-east-1}

echo "🔧 Setting up SSM Parameters with real infrastructure values..."

# Get the default VPC and its resources
echo "1️⃣ Getting default VPC infrastructure..."

# Get default VPC ID
DEFAULT_VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text)

if [ "$DEFAULT_VPC_ID" == "None" ] || [ -z "$DEFAULT_VPC_ID" ]; then
    echo "❌ No default VPC found. Creating temporary VPC infrastructure..."
    
    # Create minimal VPC infrastructure
    VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 --query 'Vpc.VpcId' --output text)
    aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames
    
    # Create subnets
    AZ1=$(aws ec2 describe-availability-zones --query 'AvailabilityZones[0].ZoneName' --output text)
    AZ2=$(aws ec2 describe-availability-zones --query 'AvailabilityZones[1].ZoneName' --output text)
    
    SUBNET1_ID=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 --availability-zone $AZ1 --query 'Subnet.SubnetId' --output text)
    SUBNET2_ID=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 --availability-zone $AZ2 --query 'Subnet.SubnetId' --output text)
    
    # Create security group
    SG_ID=$(aws ec2 create-security-group --group-name temp-sg-$(date +%s) --description "Temporary security group" --vpc-id $VPC_ID --query 'GroupId' --output text)
    
    TEMP_INFRASTRUCTURE=true
else
    echo "✅ Using default VPC: $DEFAULT_VPC_ID"
    VPC_ID=$DEFAULT_VPC_ID
    
    # Get default subnets
    SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[0:2].SubnetId' --output text)
    SUBNET1_ID=$(echo $SUBNET_IDS | cut -d' ' -f1)
    SUBNET2_ID=$(echo $SUBNET_IDS | cut -d' ' -f2)
    
    # Get default security group
    SG_ID=$(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID" "Name=group-name,Values=default" --query 'SecurityGroups[0].GroupId' --output text)
    
    TEMP_INFRASTRUCTURE=false
fi

echo "2️⃣ Creating SSM parameters with real values..."

# Create SSM parameters with real infrastructure values
aws ssm put-parameter \
  --name "/network/vpc-id" \
  --value "$VPC_ID" \
  --type "String" \
  --description "VPC ID for dynamic configuration" \
  --overwrite

aws ssm put-parameter \
  --name "/network/subnet-ids" \
  --value "${SUBNET1_ID},${SUBNET2_ID}" \
  --type "String" \
  --description "Comma-separated list of subnet IDs for dynamic configuration" \
  --overwrite

aws ssm put-parameter \
  --name "/network/security-group-id" \
  --value "$SG_ID" \
  --type "String" \
  --description "Security group ID for dynamic configuration" \
  --overwrite

# Clean up temporary infrastructure if we created it
if [ "$TEMP_INFRASTRUCTURE" == "true" ]; then
    echo "3️⃣ Cleaning up temporary infrastructure..."
    aws ec2 delete-security-group --group-id $SG_ID
    aws ec2 delete-subnet --subnet-id $SUBNET1_ID
    aws ec2 delete-subnet --subnet-id $SUBNET2_ID
    aws ec2 delete-vpc --vpc-id $VPC_ID
fi

echo "✅ SSM Parameters created successfully with real infrastructure values!"
echo ""
echo "📋 Created parameters:"
echo "   /network/vpc-id = $VPC_ID"
echo "   /network/subnet-ids = ${SUBNET1_ID},${SUBNET2_ID}"
echo "   /network/security-group-id = $SG_ID"
echo ""
echo "🚀 Now you can deploy the CloudFormation stack with SSM resolution:"
echo "   npm run cfn:deploy-yaml"
echo ""
echo "💡 The CloudFormation template will use these parameters for dynamic configuration"
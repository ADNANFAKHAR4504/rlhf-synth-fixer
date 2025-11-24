#!/bin/bash
set -e

# Setup script for CI/CD Pipeline prerequisites
# This script creates the necessary AWS resources for deploying the pipeline

REGION="${AWS_REGION:-us-east-1}"
ENVIRONMENT_SUFFIX="${ENVIRONMENT_SUFFIX:-synth101912618}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "=== Setting up prerequisites for CI/CD Pipeline ==="
echo "Region: $REGION"
echo "Environment Suffix: $ENVIRONMENT_SUFFIX"
echo "Account ID: $ACCOUNT_ID"
echo ""

# 1. Create VPC with private subnets
echo "1. Creating VPC..."
VPC_ID=$(aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=pipeline-vpc-$ENVIRONMENT_SUFFIX},{Key=ManagedBy,Value=test-automation}]" \
  --region $REGION \
  --query 'Vpc.VpcId' \
  --output text)
echo "✓ VPC created: $VPC_ID"

# Enable DNS hostnames
aws ec2 modify-vpc-attribute \
  --vpc-id $VPC_ID \
  --enable-dns-hostnames \
  --region $REGION

# Get available AZs
AZ1=$(aws ec2 describe-availability-zones --region $REGION --query 'AvailabilityZones[0].ZoneName' --output text)
AZ2=$(aws ec2 describe-availability-zones --region $REGION --query 'AvailabilityZones[1].ZoneName' --output text)

# Create private subnets
echo "2. Creating private subnets..."
SUBNET1_ID=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone $AZ1 \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=private-subnet-1-$ENVIRONMENT_SUFFIX},{Key=ManagedBy,Value=test-automation}]" \
  --region $REGION \
  --query 'Subnet.SubnetId' \
  --output text)
echo "✓ Subnet 1 created: $SUBNET1_ID"

SUBNET2_ID=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone $AZ2 \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=private-subnet-2-$ENVIRONMENT_SUFFIX},{Key=ManagedBy,Value=test-automation}]" \
  --region $REGION \
  --query 'Subnet.SubnetId' \
  --output text)
echo "✓ Subnet 2 created: $SUBNET2_ID"

# 3. Create VPC Endpoints for S3, ECR, and CloudWatch Logs
echo "3. Creating VPC endpoints..."

# Get route table
ROUTE_TABLE_ID=$(aws ec2 describe-route-tables \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --region $REGION \
  --query 'RouteTables[0].RouteTableId' \
  --output text)

# S3 Gateway Endpoint
aws ec2 create-vpc-endpoint \
  --vpc-id $VPC_ID \
  --service-name com.amazonaws.$REGION.s3 \
  --route-table-ids $ROUTE_TABLE_ID \
  --region $REGION \
  --tag-specifications "ResourceType=vpc-endpoint,Tags=[{Key=Name,Value=s3-endpoint-$ENVIRONMENT_SUFFIX},{Key=ManagedBy,Value=test-automation}]" \
  > /dev/null
echo "✓ S3 VPC endpoint created"

# Security group for interface endpoints
SG_ID=$(aws ec2 create-security-group \
  --group-name vpce-sg-$ENVIRONMENT_SUFFIX \
  --description "Security group for VPC endpoints" \
  --vpc-id $VPC_ID \
  --region $REGION \
  --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=vpce-sg-$ENVIRONMENT_SUFFIX},{Key=ManagedBy,Value=test-automation}]" \
  --query 'GroupId' \
  --output text)

aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 443 \
  --cidr 10.0.0.0/16 \
  --region $REGION

# ECR API Endpoint
aws ec2 create-vpc-endpoint \
  --vpc-id $VPC_ID \
  --vpc-endpoint-type Interface \
  --service-name com.amazonaws.$REGION.ecr.api \
  --subnet-ids $SUBNET1_ID $SUBNET2_ID \
  --security-group-ids $SG_ID \
  --region $REGION \
  --tag-specifications "ResourceType=vpc-endpoint,Tags=[{Key=Name,Value=ecr-api-endpoint-$ENVIRONMENT_SUFFIX},{Key=ManagedBy,Value=test-automation}]" \
  > /dev/null
echo "✓ ECR API VPC endpoint created"

# ECR Docker Endpoint
aws ec2 create-vpc-endpoint \
  --vpc-id $VPC_ID \
  --vpc-endpoint-type Interface \
  --service-name com.amazonaws.$REGION.ecr.dkr \
  --subnet-ids $SUBNET1_ID $SUBNET2_ID \
  --security-group-ids $SG_ID \
  --region $REGION \
  --tag-specifications "ResourceType=vpc-endpoint,Tags=[{Key=Name,Value=ecr-dkr-endpoint-$ENVIRONMENT_SUFFIX},{Key=ManagedBy,Value=test-automation}]" \
  > /dev/null
echo "✓ ECR Docker VPC endpoint created"

# CloudWatch Logs Endpoint
aws ec2 create-vpc-endpoint \
  --vpc-id $VPC_ID \
  --vpc-endpoint-type Interface \
  --service-name com.amazonaws.$REGION.logs \
  --subnet-ids $SUBNET1_ID $SUBNET2_ID \
  --security-group-ids $SG_ID \
  --region $REGION \
  --tag-specifications "ResourceType=vpc-endpoint,Tags=[{Key=Name,Value=logs-endpoint-$ENVIRONMENT_SUFFIX},{Key=ManagedBy,Value=test-automation}]" \
  > /dev/null
echo "✓ CloudWatch Logs VPC endpoint created"

# 4. Create CodeCommit repository
echo "4. Creating CodeCommit repository..."
REPO_NAME="test-repo-$ENVIRONMENT_SUFFIX"
aws codecommit create-repository \
  --repository-name $REPO_NAME \
  --repository-description "Test repository for pipeline" \
  --region $REGION \
  --tags ManagedBy=test-automation \
  > /dev/null || echo "Repository may already exist"

# Create initial commit with buildspec
mkdir -p /tmp/codecommit-$ENVIRONMENT_SUFFIX
cd /tmp/codecommit-$ENVIRONMENT_SUFFIX

cat > buildspec.yml <<'EOF'
version: 0.2
phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $IMAGE_REPO_URI
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=${COMMIT_HASH:=latest}
  build:
    commands:
      - echo Build started on `date`
      - echo Building the Docker image...
      - echo "FROM alpine:latest" > Dockerfile
      - echo "CMD echo 'Hello from test container'" >> Dockerfile
      - docker build -t $IMAGE_REPO_URI:latest .
      - docker tag $IMAGE_REPO_URI:latest $IMAGE_REPO_URI:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on `date`
      - echo Pushing the Docker images...
      - docker push $IMAGE_REPO_URI:latest
      - docker push $IMAGE_REPO_URI:$IMAGE_TAG
      - echo Creating imagedefinitions.json...
      - printf '[{"name":"test-container","imageUri":"%s"}]' $IMAGE_REPO_URI:$IMAGE_TAG > imagedefinitions.json
artifacts:
  files:
    - imagedefinitions.json
EOF

git init
git add buildspec.yml
git commit -m "Initial commit with buildspec"
git remote add origin https://git-codecommit.$REGION.amazonaws.com/v1/repos/$REPO_NAME
git push -u origin main 2>/dev/null || echo "Push may have failed, continuing..."
cd -
rm -rf /tmp/codecommit-$ENVIRONMENT_SUFFIX

echo "✓ CodeCommit repository created: $REPO_NAME"

# 5. Create ECR repository
echo "5. Creating ECR repository..."
ECR_REPO_NAME="test-app-$ENVIRONMENT_SUFFIX"
aws ecr create-repository \
  --repository-name $ECR_REPO_NAME \
  --region $REGION \
  --tags Key=ManagedBy,Value=test-automation \
  > /dev/null || echo "Repository may already exist"
ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPO_NAME"
echo "✓ ECR repository created: $ECR_URI"

# 6. Create ECS cluster
echo "6. Creating ECS cluster..."
CLUSTER_NAME="test-cluster-$ENVIRONMENT_SUFFIX"
aws ecs create-cluster \
  --cluster-name $CLUSTER_NAME \
  --region $REGION \
  --tags key=ManagedBy,value=test-automation \
  > /dev/null || echo "Cluster may already exist"
echo "✓ ECS cluster created: $CLUSTER_NAME"

# 7. Create minimal ECS task definition and service
echo "7. Creating ECS task definition and service..."

# Create task execution role
TASK_ROLE_NAME="ecs-task-exec-role-$ENVIRONMENT_SUFFIX"
TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}'

TASK_ROLE_ARN=$(aws iam create-role \
  --role-name $TASK_ROLE_NAME \
  --assume-role-policy-document "$TRUST_POLICY" \
  --tags Key=ManagedBy,Value=test-automation \
  --region $REGION \
  --query 'Role.Arn' \
  --output text 2>/dev/null) || TASK_ROLE_ARN=$(aws iam get-role --role-name $TASK_ROLE_NAME --query 'Role.Arn' --output text)

aws iam attach-role-policy \
  --role-name $TASK_ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy \
  --region $REGION 2>/dev/null || echo "Policy already attached"

# Wait for role to propagate
sleep 5

# Register task definition
TASK_DEF=$(cat <<TASKDEF
{
  "family": "test-task-$ENVIRONMENT_SUFFIX",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "$TASK_ROLE_ARN",
  "containerDefinitions": [{
    "name": "test-container",
    "image": "$ECR_URI:latest",
    "essential": true,
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/test-task-$ENVIRONMENT_SUFFIX",
        "awslogs-region": "$REGION",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }]
}
TASKDEF
)

# Create log group
aws logs create-log-group \
  --log-group-name "/ecs/test-task-$ENVIRONMENT_SUFFIX" \
  --region $REGION 2>/dev/null || echo "Log group may already exist"

# Register task definition
aws ecs register-task-definition \
  --cli-input-json "$TASK_DEF" \
  --region $REGION \
  > /dev/null

# Create ECS service
SERVICE_NAME="test-service-$ENVIRONMENT_SUFFIX"
aws ecs create-service \
  --cluster $CLUSTER_NAME \
  --service-name $SERVICE_NAME \
  --task-definition "test-task-$ENVIRONMENT_SUFFIX" \
  --desired-count 0 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET1_ID,$SUBNET2_ID],securityGroups=[$SG_ID]}" \
  --region $REGION \
  > /dev/null || echo "Service may already exist"

echo "✓ ECS service created: $SERVICE_NAME"

# 8. Save parameters to file
echo "8. Saving parameters..."
cat > lib/deployment-parameters.env <<EOF
export VPC_ID=$VPC_ID
export SUBNET1_ID=$SUBNET1_ID
export SUBNET2_ID=$SUBNET2_ID
export CODECOMMIT_REPO=$REPO_NAME
export ECR_URI=$ECR_URI
export ECS_CLUSTER=$CLUSTER_NAME
export ECS_SERVICE=$SERVICE_NAME
export APPROVAL_EMAIL=test@example.com
export ENVIRONMENT_SUFFIX=$ENVIRONMENT_SUFFIX
EOF

echo ""
echo "=== Prerequisites Setup Complete ==="
echo "VPC ID: $VPC_ID"
echo "Subnets: $SUBNET1_ID, $SUBNET2_ID"
echo "CodeCommit Repo: $REPO_NAME"
echo "ECR URI: $ECR_URI"
echo "ECS Cluster: $CLUSTER_NAME"
echo "ECS Service: $SERVICE_NAME"
echo ""
echo "Parameters saved to: lib/deployment-parameters.env"
echo "Source this file before deployment: source lib/deployment-parameters.env"

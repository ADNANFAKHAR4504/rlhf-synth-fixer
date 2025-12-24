# LocalStack Deployment Guide

## Prerequisites

1. **Docker must be running** - Start Docker Desktop or Docker daemon
2. **LocalStack Auth Token** - Already configured in `docker-compose.yml`

## Step 1: Start LocalStack

### Option A: Using Docker Compose (Recommended)
```bash
# From project root directory
docker-compose up -d --build

# Or if using Docker Compose V2:
docker compose up -d --build
```

### Option B: Using Docker directly
```bash
# Stop any existing LocalStack container
docker stop localstack 2>/dev/null || true
docker rm localstack 2>/dev/null || true

# Start LocalStack with auth token
docker run -d \
  --name localstack \
  -p 4566:4566 \
  -e SERVICES=s3,lambda,dynamodb,cloudformation,apigateway,sts,iam,cloudwatch,logs,events,sns,sqs,kinesis,ec2,rds,ecs,ecr,vpc \
  -e DEBUG=1 \
  -e DATA_DIR=/tmp/localstack/data \
  -e EC2_EBS_MAX_VOLUME_SIZE=500 \
  -e EC2_DOWNLOAD_DEFAULT_IMAGES=0 \
  -e DISABLE_CORS_CHECKS=1 \
  -e SKIP_INFRA_DOWNLOADS=1 \
  -e ENFORCE_IAM=0 \
  -e LOCALSTACK_AUTH_TOKEN=ls-LiVayoxi-HuHO-toxE-1612-NeyocivIf89b \
  -v "${TMPDIR:-/tmp}/localstack:/tmp/localstack" \
  -v "/var/run/docker.sock:/var/run/docker.sock" \
  localstack/localstack:latest
```

### Verify LocalStack is Running
```bash
# Check health endpoint
curl http://localhost:4566/_localstack/health

# Check container status
docker ps | grep localstack

# View logs
docker logs localstack
```

## Step 2: Set Up Environment Variables

```bash
# Source the LocalStack environment file
source lib/localstack-env.sh

# Set the auth token (if not already in docker-compose.yml)
export LOCALSTACK_AUTH_TOKEN=ls-LiVayoxi-HuHO-toxE-1612-NeyocivIf89b

# Verify environment variables
echo "AWS_ENDPOINT_URL: $AWS_ENDPOINT_URL"
echo "AWS_ACCESS_KEY_ID: $AWS_ACCESS_KEY_ID"
echo "LOCALSTACK_AUTH_TOKEN: $LOCALSTACK_AUTH_TOKEN"
```

## Step 3: Deploy Terraform Infrastructure

### Using the deployment script:
```bash
./scripts/localstack-terraform-deploy.sh
```

### Or manually:
```bash
cd lib

# Initialize Terraform with LocalStack backend
tflocal init \
  -backend-config="bucket=terraform-state-localstack" \
  -backend-config="key=terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="endpoint=http://localhost:4566" \
  -backend-config="force_path_style=true" \
  -backend-config="skip_credentials_validation=true" \
  -backend-config="skip_metadata_api_check=true"

# Create a plan
tflocal plan -out=tfplan

# Apply the infrastructure
tflocal apply tfplan

cd ..
```

## Step 4: Verify Deployments

### 1. Check Terraform Outputs
```bash
cd lib
tflocal output
cd ..
```

### 2. List AWS Resources in LocalStack

#### S3 Buckets
```bash
awslocal s3 ls
# Or
aws --endpoint-url=http://localhost:4566 s3 ls
```

#### VPCs
```bash
awslocal ec2 describe-vpcs
# Or
aws --endpoint-url=http://localhost:4566 ec2 describe-vpcs
```

#### EC2 Instances
```bash
awslocal ec2 describe-instances
# Or
aws --endpoint-url=http://localhost:4566 ec2 describe-instances
```

#### RDS Instances
```bash
awslocal rds describe-db-instances
# Or
aws --endpoint-url=http://localhost:4566 rds describe-db-instances
```

#### IAM Roles
```bash
awslocal iam list-roles
# Or
aws --endpoint-url=http://localhost:4566 iam list-roles
```

#### Security Groups
```bash
awslocal ec2 describe-security-groups
# Or
aws --endpoint-url=http://localhost:4566 ec2 describe-security-groups
```

#### Subnets
```bash
awslocal ec2 describe-subnets
# Or
aws --endpoint-url=http://localhost:4566 ec2 describe-subnets
```

#### Load Balancers
```bash
awslocal elbv2 describe-load-balancers
# Or
aws --endpoint-url=http://localhost:4566 elbv2 describe-load-balancers
```

#### KMS Keys
```bash
awslocal kms list-keys
# Or
aws --endpoint-url=http://localhost:4566 kms list-keys
```

#### CloudWatch Log Groups
```bash
awslocal logs describe-log-groups
# Or
aws --endpoint-url=http://localhost:4566 logs describe-log-groups
```

#### AWS Config
```bash
awslocal configservice describe-configuration-recorders
# Or
aws --endpoint-url=http://localhost:4566 configservice describe-configuration-recorders
```

#### CloudTrail
```bash
awslocal cloudtrail describe-trails
# Or
aws --endpoint-url=http://localhost:4566 cloudtrail describe-trails
```

### 3. Check Specific Resources by Name

#### Find resources with your project prefix
```bash
# Replace 'tap-stack-dev' with your actual prefix
awslocal ec2 describe-instances --filters "Name=tag:Name,Values=tap-stack-dev*"
awslocal ec2 describe-vpcs --filters "Name=tag:Name,Values=tap-stack-dev*"
awslocal s3 ls | grep tap-stack-dev
```

### 4. View Resource Tags
```bash
# Get VPC details with tags
awslocal ec2 describe-vpcs --query 'Vpcs[*].[VpcId,Tags]' --output table

# Get EC2 instance details with tags
awslocal ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId,Tags]' --output table
```

### 5. Check Terraform State
```bash
cd lib
tflocal state list
tflocal state show <resource_name>
cd ..
```

### 6. View LocalStack Dashboard (if available)
```bash
# LocalStack Pro may have a web UI
open http://localhost:4566/_localstack/health
```

## Step 5: Run Integration Tests

```bash
./scripts/localstack-terraform-test.sh
```

## Troubleshooting

### LocalStack not starting
```bash
# Check Docker is running
docker ps

# Check LocalStack logs
docker logs localstack

# Restart LocalStack
docker restart localstack
```

### Terraform deployment fails
```bash
# Check Terraform logs
cd lib
tflocal plan -detailed-exitcode

# Check state
tflocal state list

# Validate configuration
tflocal validate
```

### Resources not found
```bash
# Ensure you're using the correct endpoint
export AWS_ENDPOINT_URL=http://localhost:4566

# Verify LocalStack services
curl http://localhost:4566/_localstack/health | jq .
```

## Cleanup

### Destroy Infrastructure
```bash
cd lib
tflocal destroy
cd ..
```

### Stop LocalStack
```bash
docker-compose down
# Or
docker stop localstack
docker rm localstack
```

## Quick Reference Commands

```bash
# Start LocalStack
docker-compose up -d

# Deploy infrastructure
./scripts/localstack-terraform-deploy.sh

# Check all resources
awslocal ec2 describe-instances
awslocal ec2 describe-vpcs
awslocal s3 ls
awslocal rds describe-db-instances

# View outputs
cd lib && tflocal output && cd ..

# Stop everything
cd lib && tflocal destroy && cd ..
docker-compose down
```


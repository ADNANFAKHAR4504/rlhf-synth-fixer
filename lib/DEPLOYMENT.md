# StreamFlix Disaster Recovery Solution - Deployment Guide

## Overview

This deployment guide covers the StreamFlix disaster recovery infrastructure using CloudFormation templates. The solution implements a warm standby pattern with cross-region replication for RDS, EFS, and ElastiCache components.

## Architecture

- **Primary Region**: eu-west-2
- **DR Region**: us-east-1
- **RTO**: 15 minutes
- **RPO**: Near-zero (continuous replication)

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Permissions to create resources in both eu-west-2 and us-east-1
3. Database credentials (DBUsername and DBPassword)

## Deployment Steps

### Step 1: Deploy Primary Region (eu-west-2)

```bash
# Set environment variables
export ENVIRONMENT_SUFFIX=dev
export DB_USERNAME=admin
export DB_PASSWORD=YourSecurePassword123!

# Deploy primary region stack
aws cloudformation create-stack \
  --stack-name streamflix-dr-primary-${ENVIRONMENT_SUFFIX} \
  --template-body file://lib/streamflix-dr-primary.yaml \
  --parameters \
    ParameterKey=environmentSuffix,ParameterValue=${ENVIRONMENT_SUFFIX} \
    ParameterKey=DBUsername,ParameterValue=${DB_USERNAME} \
    ParameterKey=DBPassword,ParameterValue=${DB_PASSWORD} \
  --capabilities CAPABILITY_NAMED_IAM \
  --region eu-west-2 \
  --tags \
    Key=Environment,Value=${ENVIRONMENT_SUFFIX} \
    Key=Application,Value=StreamFlix \
    Key=CostCenter,Value=Media

# Wait for stack to complete
aws cloudformation wait stack-create-complete \
  --stack-name streamflix-dr-primary-${ENVIRONMENT_SUFFIX} \
  --region eu-west-2

# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name streamflix-dr-primary-${ENVIRONMENT_SUFFIX} \
  --region eu-west-2 \
  --query 'Stacks[0].Outputs' \
  --output table
```

### Step 2: Get Primary RDS ARN for DR Setup

```bash
# Get the RDS instance ARN
export PRIMARY_RDS_ARN=$(aws cloudformation describe-stacks \
  --stack-name streamflix-dr-primary-${ENVIRONMENT_SUFFIX} \
  --region eu-west-2 \
  --query 'Stacks[0].Outputs[?OutputKey==`RDSInstanceId`].OutputValue' \
  --output text)

# Get the full ARN
export PRIMARY_RDS_FULL_ARN=$(aws rds describe-db-instances \
  --db-instance-identifier ${PRIMARY_RDS_ARN} \
  --region eu-west-2 \
  --query 'DBInstances[0].DBInstanceArn' \
  --output text)

echo "Primary RDS ARN: ${PRIMARY_RDS_FULL_ARN}"
```

### Step 3: Configure EFS Replication

```bash
# Get EFS File System ID from primary region
export PRIMARY_EFS_ID=$(aws cloudformation describe-stacks \
  --stack-name streamflix-dr-primary-${ENVIRONMENT_SUFFIX} \
  --region eu-west-2 \
  --query 'Stacks[0].Outputs[?OutputKey==`EFSFileSystemId`].OutputValue' \
  --output text)

echo "Primary EFS ID: ${PRIMARY_EFS_ID}"
```

### Step 4: Deploy DR Region (us-east-1)

```bash
# Deploy DR region stack
aws cloudformation create-stack \
  --stack-name streamflix-dr-secondary-${ENVIRONMENT_SUFFIX} \
  --template-body file://lib/streamflix-dr-secondary.yaml \
  --parameters \
    ParameterKey=environmentSuffix,ParameterValue=${ENVIRONMENT_SUFFIX} \
    ParameterKey=PrimaryRegion,ParameterValue=eu-west-2 \
    ParameterKey=PrimaryRDSArn,ParameterValue=${PRIMARY_RDS_FULL_ARN} \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1 \
  --tags \
    Key=Environment,Value=${ENVIRONMENT_SUFFIX}-dr \
    Key=Application,Value=StreamFlix \
    Key=CostCenter,Value=Media

# Wait for stack to complete
aws cloudformation wait stack-create-complete \
  --stack-name streamflix-dr-secondary-${ENVIRONMENT_SUFFIX} \
  --region us-east-1

# Get DR stack outputs
aws cloudformation describe-stacks \
  --stack-name streamflix-dr-secondary-${ENVIRONMENT_SUFFIX} \
  --region us-east-1 \
  --query 'Stacks[0].Outputs' \
  --output table
```

### Step 5: Configure EFS Replication from Primary to DR

```bash
# Get DR EFS File System ID
export DR_EFS_ID=$(aws cloudformation describe-stacks \
  --stack-name streamflix-dr-secondary-${ENVIRONMENT_SUFFIX} \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`EFSFileSystemId`].OutputValue' \
  --output text)

# Create replication configuration
aws efs create-replication-configuration \
  --source-file-system-id ${PRIMARY_EFS_ID} \
  --destinations Region=us-east-1,FileSystemId=${DR_EFS_ID} \
  --region eu-west-2

echo "EFS Replication configured from ${PRIMARY_EFS_ID} to ${DR_EFS_ID}"
```

### Step 6: Verify Deployment

```bash
# Verify primary region resources
echo "=== Primary Region Resources ==="
aws cloudformation describe-stack-resources \
  --stack-name streamflix-dr-primary-${ENVIRONMENT_SUFFIX} \
  --region eu-west-2 \
  --query 'StackResources[*].[ResourceType,LogicalResourceId,ResourceStatus]' \
  --output table

# Verify DR region resources
echo "=== DR Region Resources ==="
aws cloudformation describe-stack-resources \
  --stack-name streamflix-dr-secondary-${ENVIRONMENT_SUFFIX} \
  --region us-east-1 \
  --query 'StackResources[*].[ResourceType,LogicalResourceId,ResourceStatus]' \
  --output table

# Check RDS replication status
aws rds describe-db-instances \
  --db-instance-identifier streamflix-db-replica-${ENVIRONMENT_SUFFIX} \
  --region us-east-1 \
  --query 'DBInstances[0].[DBInstanceStatus,ReadReplicaSourceDBInstanceIdentifier]' \
  --output table
```

## Stack Outputs

### Primary Region Outputs

- **VPCId**: VPC identifier for primary region
- **RDSEndpoint**: Database endpoint for application connectivity
- **RDSInstanceId**: RDS instance identifier (for DR setup)
- **EFSFileSystemId**: EFS file system ID
- **CacheEndpoint**: ElastiCache primary endpoint
- **ECSClusterName**: ECS cluster name
- **ALBDNSName**: Application Load Balancer DNS name
- **KMSKeyId**: KMS key ARN for encryption

### DR Region Outputs

- **VPCId**: VPC identifier for DR region
- **RDSReplicaEndpoint**: Read replica endpoint
- **EFSFileSystemId**: DR EFS file system ID
- **ECSClusterName**: DR ECS cluster name
- **ALBDNSName**: DR Application Load Balancer DNS name
- **KMSKeyId**: DR KMS key ARN

## Disaster Recovery Procedures

### Failover to DR Region (RTO: 15 minutes)

1. **Promote RDS Read Replica**
   ```bash
   aws rds promote-read-replica \
     --db-instance-identifier streamflix-db-replica-${ENVIRONMENT_SUFFIX} \
     --region us-east-1
   ```

2. **Scale Up DR ECS Service**
   ```bash
   aws ecs update-service \
     --cluster streamflix-cluster-dr-${ENVIRONMENT_SUFFIX} \
     --service streamflix-service-dr-${ENVIRONMENT_SUFFIX} \
     --desired-count 2 \
     --region us-east-1
   ```

3. **Update DNS/Route53**
   - Point application DNS to DR ALB DNS name
   - Update health checks to DR region endpoints

4. **Verify Application Functionality**
   ```bash
   # Get DR ALB DNS
   DR_ALB=$(aws cloudformation describe-stacks \
     --stack-name streamflix-dr-secondary-${ENVIRONMENT_SUFFIX} \
     --region us-east-1 \
     --query 'Stacks[0].Outputs[?OutputKey==`ALBDNSName`].OutputValue' \
     --output text)

   # Test connectivity
   curl http://${DR_ALB}/health
   ```

### Failback to Primary Region

1. **Ensure Primary Region is Healthy**
2. **Create New RDS Read Replica in DR Region**
3. **Synchronize EFS Data**
4. **Scale Down DR ECS Service**
5. **Update DNS Back to Primary Region**

## Cost Optimization

The solution is optimized for cost:
- Fargate for serverless container management (no EC2 instances)
- T3 instance types for RDS and ElastiCache
- EFS Lifecycle policies (move to IA after 30 days)
- CloudWatch Logs retention: 7 days
- Warm standby with minimal DR compute (scales on demand)

## Security Features

- Encryption at rest for all data stores (RDS, EFS, ElastiCache)
- Encryption in transit (EFS transit encryption, ElastiCache TLS)
- KMS customer-managed keys for encryption
- Security groups with least privilege access
- IAM roles for service-to-service authentication
- Multi-AZ deployment for high availability

## Monitoring and Alerts

```bash
# View ECS service events
aws ecs describe-services \
  --cluster streamflix-cluster-${ENVIRONMENT_SUFFIX} \
  --services streamflix-service-${ENVIRONMENT_SUFFIX} \
  --region eu-west-2 \
  --query 'services[0].events[0:5]' \
  --output table

# View CloudWatch Logs
aws logs tail /ecs/streamflix-${ENVIRONMENT_SUFFIX} \
  --follow \
  --region eu-west-2
```

## Cleanup

To delete the infrastructure:

```bash
# Delete DR region stack first
aws cloudformation delete-stack \
  --stack-name streamflix-dr-secondary-${ENVIRONMENT_SUFFIX} \
  --region us-east-1

aws cloudformation wait stack-delete-complete \
  --stack-name streamflix-dr-secondary-${ENVIRONMENT_SUFFIX} \
  --region us-east-1

# Delete primary region stack
aws cloudformation delete-stack \
  --stack-name streamflix-dr-primary-${ENVIRONMENT_SUFFIX} \
  --region eu-west-2

aws cloudformation wait stack-delete-complete \
  --stack-name streamflix-dr-primary-${ENVIRONMENT_SUFFIX} \
  --region eu-west-2
```

## Troubleshooting

### Stack Creation Failures

1. Check CloudFormation events:
   ```bash
   aws cloudformation describe-stack-events \
     --stack-name streamflix-dr-primary-${ENVIRONMENT_SUFFIX} \
     --region eu-west-2 \
     --max-items 20
   ```

2. Common issues:
   - IAM permissions insufficient
   - Service quotas exceeded
   - Parameter validation errors
   - Availability Zone capacity issues

### RDS Read Replica Creation Issues

- Ensure primary RDS has automated backups enabled
- Verify KMS key permissions in DR region
- Check network connectivity between regions

### EFS Replication Issues

- Verify EFS file system is in AVAILABLE state
- Ensure replication configuration is supported in both regions
- Check IAM permissions for EFS replication

## Support

For issues or questions:
- Review CloudFormation stack events
- Check AWS service health dashboard
- Review CloudWatch Logs for application errors
- Contact AWS Support for infrastructure issues

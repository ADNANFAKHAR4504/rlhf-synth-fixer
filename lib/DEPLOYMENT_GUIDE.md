# Deployment Guide

## Quick Start

Deploy the security-hardened infrastructure:

```bash
# 1. Validate template
aws cloudformation validate-template \
  --template-body file://lib/security-infrastructure.yaml

# 2. Create stack
aws cloudformation create-stack \
  --stack-name payment-security-prod \
  --template-body file://lib/security-infrastructure.yaml \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-v1 \
    ParameterKey=DBMasterUsername,ParameterValue=dbadmin \
    ParameterKey=DBMasterPassword,ParameterValue=SecurePass123! \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1 \
  --tags \
    Key=Project,Value=PaymentProcessing \
    Key=Owner,Value=SecurityTeam

# 3. Monitor deployment
aws cloudformation wait stack-create-complete \
  --stack-name payment-security-prod \
  --region us-east-1

# 4. Get outputs
aws cloudformation describe-stacks \
  --stack-name payment-security-prod \
  --query 'Stacks[0].Outputs' \
  --region us-east-1
```

## Deployment Steps

### Step 1: Prepare Environment

```bash
# Set AWS region
export AWS_REGION=us-east-1

# Set environment suffix (unique identifier)
export ENV_SUFFIX=prod-v1

# Verify AWS credentials
aws sts get-caller-identity
```

### Step 2: Validate Template

```bash
# Validate CloudFormation syntax
aws cloudformation validate-template \
  --template-body file://lib/security-infrastructure.yaml

# Expected output: TemplateDescription and Parameters
```

### Step 3: Create Stack

```bash
# Create the stack with parameters
aws cloudformation create-stack \
  --stack-name payment-security-${ENV_SUFFIX} \
  --template-body file://lib/security-infrastructure.yaml \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=${ENV_SUFFIX} \
    ParameterKey=DBMasterUsername,ParameterValue=dbadmin \
    ParameterKey=DBMasterPassword,ParameterValue=$(aws secretsmanager get-random-password --require-each-included-type --password-length 16 --query 'RandomPassword' --output text) \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ${AWS_REGION}
```

### Step 4: Monitor Deployment

```bash
# Watch stack creation progress
aws cloudformation describe-stack-events \
  --stack-name payment-security-${ENV_SUFFIX} \
  --region ${AWS_REGION} \
  --max-items 20

# Wait for completion (this will block until done)
aws cloudformation wait stack-create-complete \
  --stack-name payment-security-${ENV_SUFFIX} \
  --region ${AWS_REGION}
```

### Step 5: Retrieve Outputs

```bash
# Get all stack outputs
aws cloudformation describe-stacks \
  --stack-name payment-security-${ENV_SUFFIX} \
  --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
  --output table \
  --region ${AWS_REGION}

# Get specific output (e.g., DB endpoint)
aws cloudformation describe-stacks \
  --stack-name payment-security-${ENV_SUFFIX} \
  --query 'Stacks[0].Outputs[?OutputKey==`DBEndpoint`].OutputValue' \
  --output text \
  --region ${AWS_REGION}
```

## Post-Deployment Verification

### Verify VPC and Subnets

```bash
# Get VPC ID
VPC_ID=$(aws cloudformation describe-stacks \
  --stack-name payment-security-${ENV_SUFFIX} \
  --query 'Stacks[0].Outputs[?OutputKey==`VPCId`].OutputValue' \
  --output text)

# List subnets
aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=${VPC_ID}" \
  --query 'Subnets[*].[SubnetId,CidrBlock,AvailabilityZone,Tags[?Key==`Name`].Value|[0]]' \
  --output table
```

### Verify RDS Instance

```bash
# Get database details
aws rds describe-db-instances \
  --db-instance-identifier payment-db-${ENV_SUFFIX} \
  --query 'DBInstances[0].[DBInstanceIdentifier,DBInstanceStatus,Engine,MultiAZ,StorageEncrypted]' \
  --output table

# Check encryption
aws rds describe-db-instances \
  --db-instance-identifier payment-db-${ENV_SUFFIX} \
  --query 'DBInstances[0].StorageEncrypted'
```

### Verify S3 Bucket

```bash
# Get bucket name
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name payment-security-${ENV_SUFFIX} \
  --query 'Stacks[0].Outputs[?OutputKey==`AuditLogBucketName`].OutputValue' \
  --output text)

# Verify encryption
aws s3api get-bucket-encryption --bucket ${BUCKET_NAME}

# Verify versioning
aws s3api get-bucket-versioning --bucket ${BUCKET_NAME}

# Verify public access block
aws s3api get-public-access-block --bucket ${BUCKET_NAME}
```

### Verify KMS Key

```bash
# Get KMS key ID
KMS_KEY_ID=$(aws cloudformation describe-stacks \
  --stack-name payment-security-${ENV_SUFFIX} \
  --query 'Stacks[0].Outputs[?OutputKey==`RDSKMSKeyId`].OutputValue' \
  --output text)

# Check key rotation
aws kms get-key-rotation-status --key-id ${KMS_KEY_ID}
```

### Verify CloudTrail

```bash
# Check CloudTrail status
aws cloudtrail get-trail-status \
  --name payment-audit-trail-${ENV_SUFFIX}

# Verify log file validation
aws cloudtrail describe-trails \
  --trail-name-list payment-audit-trail-${ENV_SUFFIX} \
  --query 'trailList[0].LogFileValidationEnabled'
```

### Verify VPC Flow Logs

```bash
# List flow logs
aws ec2 describe-flow-logs \
  --filter "Name=resource-id,Values=${VPC_ID}" \
  --query 'FlowLogs[*].[FlowLogId,FlowLogStatus,LogDestinationType,LogDestination]' \
  --output table
```

## Updating the Stack

```bash
# Update stack with changes
aws cloudformation update-stack \
  --stack-name payment-security-${ENV_SUFFIX} \
  --template-body file://lib/security-infrastructure.yaml \
  --parameters \
    ParameterKey=EnvironmentSuffix,UsePreviousValue=true \
    ParameterKey=DBMasterUsername,UsePreviousValue=true \
    ParameterKey=DBMasterPassword,UsePreviousValue=true \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ${AWS_REGION}

# Wait for update to complete
aws cloudformation wait stack-update-complete \
  --stack-name payment-security-${ENV_SUFFIX} \
  --region ${AWS_REGION}
```

## Rollback

```bash
# If deployment fails, CloudFormation auto-rolls back
# To manually rollback an update:
aws cloudformation cancel-update-stack \
  --stack-name payment-security-${ENV_SUFFIX} \
  --region ${AWS_REGION}
```

## Stack Deletion

```bash
# Delete the stack (removes all resources)
aws cloudformation delete-stack \
  --stack-name payment-security-${ENV_SUFFIX} \
  --region ${AWS_REGION}

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete \
  --stack-name payment-security-${ENV_SUFFIX} \
  --region ${AWS_REGION}
```

## Troubleshooting

### Stack Creation Failed

```bash
# View failure reason
aws cloudformation describe-stack-events \
  --stack-name payment-security-${ENV_SUFFIX} \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`].[LogicalResourceId,ResourceStatusReason]' \
  --output table
```

### Resource Already Exists

If you get "AlreadyExists" errors:
- Change the EnvironmentSuffix parameter to a unique value
- Or delete the existing stack first

### Insufficient Permissions

Ensure your IAM user/role has these permissions:
- cloudformation:* (for stack operations)
- ec2:* (for VPC, subnets, security groups)
- rds:* (for database instances)
- s3:* (for buckets)
- kms:* (for encryption keys)
- iam:* (for roles and policies)
- logs:* (for CloudWatch logs)
- cloudtrail:* (for audit trails)

### Database Connection Issues

```bash
# Test connectivity from EC2 instance
psql -h <DB_ENDPOINT> -U dbadmin -d postgres

# Check security group rules
aws ec2 describe-security-groups \
  --group-ids <DB_SECURITY_GROUP_ID> \
  --query 'SecurityGroups[0].IpPermissions'
```

## Best Practices

1. **Use Secrets Manager**: Store database credentials in AWS Secrets Manager instead of parameters
2. **Enable MFA Delete**: For S3 bucket versioning protection
3. **Regular Backups**: RDS automated backups are configured (30-day retention)
4. **Monitoring**: Set up CloudWatch alarms for critical metrics
5. **Cost Tracking**: Use Cost Allocation Tags for detailed billing
6. **Change Sets**: Use CloudFormation change sets to preview updates before applying

## Production Checklist

- [ ] Updated DBMasterPassword to strong, unique value
- [ ] Configured appropriate RDS instance size
- [ ] Verified Multi-AZ is enabled for RDS
- [ ] Confirmed encryption is enabled for all resources
- [ ] Tested security group rules
- [ ] Verified VPC Flow Logs are active
- [ ] Confirmed CloudTrail logging is enabled
- [ ] Set up CloudWatch alarms
- [ ] Documented all outputs and credentials
- [ ] Tested stack deletion and recreation

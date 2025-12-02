# Payment Processing Infrastructure - CloudFormation StackSets

This CloudFormation template deploys a complete multi-environment payment processing infrastructure using StackSets for cross-account deployment.

## Architecture Overview

The infrastructure includes:
- **VPC**: 2 public and 2 private subnets across 2 availability zones
- **Networking**: Internet Gateway, 2 NAT Gateways, Route Tables
- **Load Balancing**: Application Load Balancer in public subnets
- **Compute**: Auto Scaling Group with EC2 instances in private subnets
- **Database**: RDS PostgreSQL with encryption and automated backups
- **Storage**: S3 buckets for payment logs and transaction archives
- **Serverless**: Lambda function for payment validation
- **Messaging**: SQS queues for asynchronous processing
- **Monitoring**: CloudWatch alarms for CPU, memory, and queue depth

## Prerequisites

1. AWS Organizations with CloudFormation StackSets enabled
2. Three AWS accounts for dev, staging, and production
3. Appropriate IAM permissions for StackSet operations
4. AWS CLI configured with credentials

## Parameters

### Required Parameters
- **EnvironmentSuffix**: Unique suffix for resource naming (e.g., dev-123, staging-456, prod-789)
- **EnvironmentType**: Environment type (dev, staging, prod) - affects auto scaling configuration
- **DBPassword**: Master password for RDS PostgreSQL (8-41 characters)

### Environment-Specific Parameters
- **InstanceType**: EC2 instance type
  - Dev: t3.micro
  - Staging: t3.small
  - Production: m5.large

- **DBInstanceClass**: RDS instance class
  - Dev: db.t3.small
  - Staging: db.t3.medium
  - Production: db.r5.large

- **DBMultiAZ**: Multi-AZ deployment
  - Dev: false
  - Staging: false
  - Production: true

### Optional Parameters
- **DBUsername**: RDS master username (default: postgres)
- **CPUAlarmThreshold**: CPU utilization alarm threshold (default: 80%)
- **QueueDepthAlarmThreshold**: SQS queue depth threshold (default: 100)
- **SQSVisibilityTimeout**: SQS visibility timeout (default: 30 seconds)
- **PaymentAPIEndpoint**: Payment validation API endpoint URL

## Deployment

### Option 1: Deploy via AWS Console

1. Navigate to CloudFormation StackSets in AWS Console
2. Create new StackSet with the template file
3. Configure parameter overrides for each account/environment
4. Deploy to target accounts

### Option 2: Deploy via AWS CLI

```bash
# Create StackSet
aws cloudformation create-stack-set \
  --stack-set-name payment-processing-infrastructure \
  --template-body file://lib/payment-processing-stack.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev-123 \
    ParameterKey=EnvironmentType,ParameterValue=dev \
    ParameterKey=InstanceType,ParameterValue=t3.micro \
    ParameterKey=DBInstanceClass,ParameterValue=db.t3.small \
    ParameterKey=DBMultiAZ,ParameterValue=false \
    ParameterKey=DBPassword,ParameterValue=YourSecurePassword123

# Deploy to dev account
aws cloudformation create-stack-instances \
  --stack-set-name payment-processing-infrastructure \
  --accounts 111111111111 \
  --regions us-east-1 \
  --parameter-overrides \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev-123 \
    ParameterKey=EnvironmentType,ParameterValue=dev \
    ParameterKey=InstanceType,ParameterValue=t3.micro \
    ParameterKey=DBInstanceClass,ParameterValue=db.t3.small \
    ParameterKey=DBMultiAZ,ParameterValue=false

# Deploy to staging account
aws cloudformation create-stack-instances \
  --stack-set-name payment-processing-infrastructure \
  --accounts 222222222222 \
  --regions us-east-1 \
  --parameter-overrides \
    ParameterKey=EnvironmentSuffix,ParameterValue=staging-456 \
    ParameterKey=EnvironmentType,ParameterValue=staging \
    ParameterKey=InstanceType,ParameterValue=t3.small \
    ParameterKey=DBInstanceClass,ParameterValue=db.t3.medium \
    ParameterKey=DBMultiAZ,ParameterValue=false

# Deploy to production account
aws cloudformation create-stack-instances \
  --stack-set-name payment-processing-infrastructure \
  --accounts 333333333333 \
  --regions us-east-1 \
  --parameter-overrides \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-789 \
    ParameterKey=EnvironmentType,ParameterValue=prod \
    ParameterKey=InstanceType,ParameterValue=m5.large \
    ParameterKey=DBInstanceClass,ParameterValue=db.r5.large \
    ParameterKey=DBMultiAZ,ParameterValue=true
```

### Option 3: Single Account Testing

```bash
# Create stack in single account
aws cloudformation create-stack \
  --stack-name payment-processing-dev \
  --template-body file://lib/payment-processing-stack.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev-test-123 \
    ParameterKey=EnvironmentType,ParameterValue=dev \
    ParameterKey=InstanceType,ParameterValue=t3.micro \
    ParameterKey=DBInstanceClass,ParameterValue=db.t3.small \
    ParameterKey=DBMultiAZ,ParameterValue=false \
    ParameterKey=DBPassword,ParameterValue=TestPassword123
```

## Validation

After deployment, verify:

1. **VPC and Networking**:
   ```bash
   aws ec2 describe-vpcs --filters "Name=tag:Name,Values=vpc-*"
   aws ec2 describe-nat-gateways --filter "Name=tag:Name,Values=nat-gateway-*"
   ```

2. **Load Balancer**:
   ```bash
   aws elbv2 describe-load-balancers --names alb-<environment-suffix>
   ```

3. **Auto Scaling Group**:
   ```bash
   aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names asg-<environment-suffix>
   ```

4. **RDS Instance**:
   ```bash
   aws rds describe-db-instances --db-instance-identifier payment-db-<environment-suffix>
   ```

5. **S3 Buckets**:
   ```bash
   aws s3 ls | grep payment-logs
   aws s3 ls | grep transaction-archive
   ```

6. **Lambda Function**:
   ```bash
   aws lambda get-function --function-name payment-validation-<environment-suffix>
   ```

7. **SQS Queues**:
   ```bash
   aws sqs list-queues | grep payment-queue
   ```

8. **CloudWatch Alarms**:
   ```bash
   aws cloudwatch describe-alarms --alarm-name-prefix ec2-cpu-alarm
   ```

## Testing

### Test Payment Validation Flow

1. Send test message to SQS queue:
   ```bash
   aws sqs send-message \
     --queue-url $(aws sqs get-queue-url --queue-name payment-queue-<environment-suffix> --query 'QueueUrl' --output text) \
     --message-body '{"payment_id":"test-001","amount":"100.00"}'
   ```

2. Check Lambda logs:
   ```bash
   aws logs tail /aws/lambda/payment-validation-<environment-suffix> --follow
   ```

3. Verify log in S3:
   ```bash
   aws s3 ls s3://payment-logs-<environment-suffix>/validations/ --recursive
   ```

### Test Load Balancer

```bash
ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name payment-processing-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text)

curl http://$ALB_DNS/
curl http://$ALB_DNS/health
```

## Cleanup

### Delete Stack Instances

```bash
# Delete from all accounts
aws cloudformation delete-stack-instances \
  --stack-set-name payment-processing-infrastructure \
  --accounts 111111111111 222222222222 333333333333 \
  --regions us-east-1 \
  --no-retain-stacks

# Wait for deletion to complete
aws cloudformation describe-stack-set-operation \
  --stack-set-name payment-processing-infrastructure \
  --operation-id <operation-id>

# Delete StackSet
aws cloudformation delete-stack-set \
  --stack-set-name payment-processing-infrastructure
```

### Delete Single Stack

```bash
aws cloudformation delete-stack --stack-name payment-processing-dev
```

## Security Considerations

1. **RDS Password**: Use AWS Secrets Manager for production passwords
2. **S3 Encryption**: All buckets use AES256 encryption at rest
3. **VPC Security**: EC2 instances and Lambda in private subnets
4. **Security Groups**: Least privilege access rules
5. **IAM Roles**: Minimal permissions for each service
6. **Public Access**: S3 buckets block all public access

## Cost Optimization

- **Dev Environment**: Uses t3.micro and db.t3.small (lowest cost)
- **Staging Environment**: Uses t3.small and db.t3.medium (moderate cost)
- **Production Environment**: Uses m5.large and db.r5.large Multi-AZ (higher cost but HA)
- **S3 Lifecycle**: Automatic transition to cheaper storage classes
- **Auto Scaling**: Adjusts capacity based on demand

## Monitoring and Alarms

The template creates CloudWatch alarms for:
- EC2 CPU utilization (threshold configurable via parameter)
- RDS CPU utilization (threshold configurable via parameter)
- RDS freeable memory (< 1GB triggers alarm)
- SQS queue depth (threshold configurable via parameter)

Configure SNS topics for alarm notifications in production.

## Troubleshooting

### Stack Creation Fails

1. Check CloudFormation events:
   ```bash
   aws cloudformation describe-stack-events --stack-name payment-processing-dev
   ```

2. Common issues:
   - Insufficient IAM permissions
   - Resource name conflicts (ensure unique EnvironmentSuffix)
   - Invalid parameter values
   - Service limits exceeded

### Lambda Function Not Triggering

1. Verify SQS event source mapping:
   ```bash
   aws lambda list-event-source-mappings --function-name payment-validation-<environment-suffix>
   ```

2. Check Lambda execution role permissions
3. Review Lambda CloudWatch logs

### RDS Connection Issues

1. Verify security group rules allow connections from EC2/Lambda
2. Check RDS instance status
3. Verify VPC and subnet configuration

## Support

For issues or questions, contact the infrastructure team.

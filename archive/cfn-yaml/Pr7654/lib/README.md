# Multi-Environment Infrastructure Deployment

CloudFormation template for deploying consistent infrastructure across dev, staging, and production environments using StackSets.

## Architecture

This template deploys:
- VPC with public and private subnets across 2 availability zones
- Application Load Balancer with Auto Scaling Group
- RDS MySQL database with environment-specific configurations
- Lambda function for data processing
- S3 buckets for static assets and application data
- CloudWatch alarms with SNS notifications
- IAM roles with least privilege permissions

## Prerequisites

Before deploying this stack, you must create the database password in Systems Manager Parameter Store:

```bash
# For dev environment
aws ssm put-parameter \
  --name /database/dev/password \
  --value "YourDevPassword123!" \
  --type SecureString \
  --region us-east-1

# For staging environment
aws ssm put-parameter \
  --name /database/staging/password \
  --value "YourStagingPassword123!" \
  --type SecureString \
  --region us-east-1

# For prod environment
aws ssm put-parameter \
  --name /database/prod/password \
  --value "YourProdPassword123!" \
  --type SecureString \
  --region us-east-1
```

## Deployment with CloudFormation StackSets

### 1. Create StackSet

```bash
aws cloudformation create-stack-set \
  --stack-set-name multi-env-infrastructure \
  --template-body file://lib/TapStack.yml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameters \
    ParameterKey=LatestAmiId,ParameterValue=/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2 \
  --region us-east-1
```

### 2. Deploy to Dev Account

```bash
aws cloudformation create-stack-instances \
  --stack-set-name multi-env-infrastructure \
  --accounts 111111111111 \
  --regions us-east-1 \
  --parameter-overrides \
    ParameterKey=EnvironmentType,ParameterValue=dev \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev-001
```

### 3. Deploy to Staging Account

```bash
aws cloudformation create-stack-instances \
  --stack-set-name multi-env-infrastructure \
  --accounts 222222222222 \
  --regions us-east-1 \
  --parameter-overrides \
    ParameterKey=EnvironmentType,ParameterValue=staging \
    ParameterKey=EnvironmentSuffix,ParameterValue=staging-001
```

### 4. Deploy to Production Account

```bash
aws cloudformation create-stack-instances \
  --stack-set-name multi-env-infrastructure \
  --accounts 333333333333 \
  --regions us-east-1 \
  --parameter-overrides \
    ParameterKey=EnvironmentType,ParameterValue=prod \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-001
```

## Single Account Deployment (Testing)

For testing in a single account with multiple stacks:

```bash
# Deploy dev environment
aws cloudformation create-stack \
  --stack-name multi-env-dev \
  --template-body file://lib/TapStack.yml \
  --parameters \
    ParameterKey=EnvironmentType,ParameterValue=dev \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev-001 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Deploy staging environment
aws cloudformation create-stack \
  --stack-name multi-env-staging \
  --template-body file://lib/TapStack.yml \
  --parameters \
    ParameterKey=EnvironmentType,ParameterValue=staging \
    ParameterKey=EnvironmentSuffix,ParameterValue=staging-001 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Deploy production environment
aws cloudformation create-stack \
  --stack-name multi-env-prod \
  --template-body file://lib/TapStack.yml \
  --parameters \
    ParameterKey=EnvironmentType,ParameterValue=prod \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-001 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

## Environment-Specific Configurations

The template uses Mappings to configure environment-specific values:

| Configuration | Dev | Staging | Prod |
|--------------|-----|---------|------|
| VPC CIDR | 10.0.0.0/16 | 10.1.0.0/16 | 10.2.0.0/16 |
| Instance Type | t3.micro | t3.small | t3.medium |
| Lambda Memory | 128MB | 256MB | 512MB |
| CPU Alarm Threshold | 80% | 70% | 60% |
| RDS Backup Retention | 0 days | 7 days | 30 days |
| RDS Multi-AZ | false | false | true |
| S3 Versioning | Disabled | Enabled | Enabled |

## Testing the Deployment

After deployment, test the infrastructure:

```bash
# Get the load balancer DNS
ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name multi-env-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text \
  --region us-east-1)

# Test the application
curl http://$ALB_DNS

# Invoke Lambda function
aws lambda invoke \
  --function-name data-processor-dev-001 \
  --region us-east-1 \
  response.json

cat response.json
```

## Cleanup

```bash
# Delete individual stack
aws cloudformation delete-stack \
  --stack-name multi-env-dev \
  --region us-east-1

# For StackSets
aws cloudformation delete-stack-instances \
  --stack-set-name multi-env-infrastructure \
  --accounts 111111111111 \
  --regions us-east-1 \
  --no-retain-stacks

aws cloudformation delete-stack-set \
  --stack-set-name multi-env-infrastructure
```

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environmentSuffix}`

Example with environmentSuffix=dev-001:
- VPC: vpc-dev-001
- Load Balancer: alb-dev-001
- RDS Instance: rds-mysql-dev-001
- S3 Bucket: fintech-dev-001-static-assets
- Lambda Function: data-processor-dev-001

## Security Considerations

- Database passwords stored in Systems Manager Parameter Store (SecureString)
- All S3 buckets have encryption enabled
- Public access blocked on all S3 buckets
- Security groups follow least privilege principle
- IAM roles use managed policies where appropriate
- RDS is deployed in private subnets
- Lambda functions run in VPC with security groups

## Monitoring

CloudWatch alarms are configured for:
- High CPU utilization on Auto Scaling Group (environment-specific thresholds)
- High database connections on RDS
- Low storage space on RDS
- Lambda function errors

All alarms send notifications to the SNS topic created by the stack.

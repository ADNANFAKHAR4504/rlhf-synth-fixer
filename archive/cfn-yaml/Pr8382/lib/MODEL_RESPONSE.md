# Multi-Environment Payment Processing Infrastructure Solution

This CloudFormation template provides a complete multi-environment payment processing infrastructure that deploys consistently across dev, staging, and production environments.

## Solution Overview

The solution implements:
- Environment-parameterized infrastructure using CloudFormation mappings and conditions
- VPC with environment-specific CIDR ranges (10.0.0.0/16 for prod, 10.1.0.0/16 for staging, 10.2.0.0/16 for dev)
- Aurora MySQL cluster with environment-appropriate sizing (db.r5.large for prod, db.t3.medium for others)
- ECS Fargate services with auto-scaling based on environment
- Application Load Balancer with optional HTTPS
- S3 buckets for transaction logs with versioning and lifecycle policies
- CloudWatch alarms with environment-specific thresholds
- KMS encryption for databases
- Comprehensive security groups and IAM roles

## Implementation

The complete implementation is in `lib/TapStack.yml` (878 lines) which includes:

1. **Parameters**: Environment, environmentSuffix, DBMasterUsername, DBMasterPassword, ContainerImage, CertificateArn
2. **Conditions**: IsProduction, IsStaging, IsDevelopment, HasCertificate
3. **Mappings**: EnvironmentConfig with environment-specific values for VPC CIDR, instance classes, backup retention, capacity settings, and alarm thresholds
4. **Resources** (50+ resources):
   - VPC with 2 public and 2 private subnets across 2 AZs
   - Internet Gateway and 2 NAT Gateways
   - Route tables and associations
   - 3 Security Groups (ALB, ECS, Database)
   - KMS key and alias for database encryption
   - RDS Aurora MySQL cluster with 2 instances
   - DB subnet group
   - S3 bucket for transaction logs
   - ECS cluster, task definition, and service
   - Application Load Balancer with target group and listeners (HTTP and conditional HTTPS)
   - Auto Scaling target and policies (CPU and Memory)
   - CloudWatch Log Group
   - IAM roles (ECS Task Execution and ECS Task)
   - SNS topic for alarms
   - CloudWatch alarms (CPU, Memory, DB Connections)
5. **Outputs**: VPC ID, subnet IDs, ALB DNS, Aurora endpoints, S3 bucket name, ECS cluster/service names, SNS topic ARN

## Key Features

### Environment-Specific Configuration
All resource sizing controlled by Environment parameter and EnvironmentConfig mapping:
- **Production**: 10.0.0.0/16 VPC, db.r5.large, 30-day backups, 3-10 ECS tasks, 70/80% alarm thresholds
- **Staging**: 10.1.0.0/16 VPC, db.t3.medium, 7-day backups, 2-5 ECS tasks, 80/85% alarm thresholds
- **Development**: 10.2.0.0/16 VPC, db.t3.medium, 7-day backups, 1-3 ECS tasks, 85/90% alarm thresholds

### Resource Naming
All resources use `${environmentSuffix}` parameter for unique naming:
- vpc-${environmentSuffix}
- aurora-cluster-${environmentSuffix}
- ecs-cluster-${environmentSuffix}
- ${Environment}-transaction-logs-${environmentSuffix}

### Security
- Database in private subnets with security group limiting access to ECS tasks only
- ECS tasks in private subnets with security group allowing traffic only from ALB
- ALB in public subnets accepting HTTP/HTTPS from internet
- KMS encryption for Aurora storage
- S3 bucket encryption and public access blocking
- IAM roles with least-privilege permissions

### High Availability
- Multi-AZ deployment (2 availability zones)
- Aurora cluster with 2 instances for read scalability
- ECS service with auto-scaling based on CPU and memory
- NAT Gateways in both AZs for redundancy
- Application Load Balancer distributing traffic

### Monitoring
- Container Insights enabled on ECS cluster
- CloudWatch alarms for ECS CPU and memory utilization
- CloudWatch alarm for database connections
- Aurora logs exported to CloudWatch (error, general, slowquery)
- ECS task logs sent to CloudWatch Log Group
- SNS topic for alarm notifications

## Deployment

### Development Environment
```bash
aws cloudformation create-stack \
  --stack-name payment-infra-dev \
  --template-body file://lib/TapStack.yml \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=environmentSuffix,ParameterValue=dev-001 \
    ParameterKey=DBMasterUsername,ParameterValue=admin \
    ParameterKey=DBMasterPassword,ParameterValue=SecurePass123 \
    ParameterKey=ContainerImage,ParameterValue=nginx:latest \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2
```

### Staging Environment
```bash
aws cloudformation create-stack \
  --stack-name payment-infra-staging \
  --template-body file://lib/TapStack.yml \
  --parameters \
    ParameterKey=Environment,ParameterValue=staging \
    ParameterKey=environmentSuffix,ParameterValue=staging-001 \
    ParameterKey=DBMasterUsername,ParameterValue=admin \
    ParameterKey=DBMasterPassword,ParameterValue=SecurePass123 \
    ParameterKey=ContainerImage,ParameterValue=nginx:latest \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-2
```

### Production Environment
```bash
aws cloudformation create-stack \
  --stack-name payment-infra-prod \
  --template-body file://lib/TapStack.yml \
  --parameters \
    ParameterKey=Environment,ParameterValue=prod \
    ParameterKey=environmentSuffix,ParameterValue=prod-001 \
    ParameterKey=DBMasterUsername,ParameterValue=admin \
    ParameterKey=DBMasterPassword,ParameterValue=SecurePass123 \
    ParameterKey=ContainerImage,ParameterValue=your-repo/payment-api:v1.0 \
    ParameterKey=CertificateArn,ParameterValue=arn:aws:acm:us-east-1:123456789012:certificate/xxxxx \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

## Validation

Validate the template:
```bash
aws cloudformation validate-template --template-body file://lib/TapStack.yml
```

Check stack status:
```bash
aws cloudformation describe-stacks --stack-name payment-infra-dev --query 'Stacks[0].StackStatus'
```

Get stack outputs:
```bash
aws cloudformation describe-stacks --stack-name payment-infra-dev --query 'Stacks[0].Outputs'
```

## Cleanup

Delete stack (note: manually empty S3 buckets first):
```bash
# Empty S3 bucket
aws s3 rm s3://dev-transaction-logs-dev-001 --recursive

# Delete stack
aws cloudformation delete-stack --stack-name payment-infra-dev --region us-west-2
```

## Architecture Highlights

- **Single template** deploys to all environments
- **No hardcoded values** - all configuration via parameters and mappings
- **Consistent architecture** across environments with only sizing differences
- **Production-grade** security, monitoring, and high availability
- **Cost-optimized** with appropriate resource sizing per environment
- **Fully automated** deployment with no manual steps
- **Destroyable** - all resources can be deleted (no Retain policies)

# Loan Processing Application Infrastructure

This CloudFormation template deploys a production-ready loan processing application infrastructure with high availability, security, and compliance features for a fintech startup.

## Architecture

The infrastructure includes:

- **VPC**: 10.0.0.0/16 CIDR with public and private subnets across 3 availability zones
- **ECS Fargate**: Containerized application running in private subnets
- **Aurora PostgreSQL Serverless v2**: Multi-AZ database with 0.5-4 ACUs, encrypted with customer-managed KMS keys
- **Application Load Balancer**: Internet-facing ALB with HTTPS support
- **S3**: Document storage with encryption, versioning, and lifecycle policies
- **Auto-scaling**: Based on ALB RequestCountPerTarget metric (not CPU/memory)
- **CloudWatch**: Log Groups with 365-day retention for compliance

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. ACM certificate in us-east-2 (optional, for HTTPS listener)
3. Docker image for the loan processing application

## Parameters

- **EnvironmentSuffix**: Unique suffix for resource names (default: "dev")
- **ContainerImage**: Docker image URI (default: "nginx:latest")
- **CertificateArn**: ACM certificate ARN for HTTPS (optional)
- **DBMasterUsername**: Aurora master username (default: "dbadmin")
- **DBMasterPassword**: Aurora master password (minimum 8 characters, required)
- **DesiredTaskCount**: Initial number of ECS tasks (default: 2)
- **MinTaskCount**: Minimum tasks for auto-scaling (default: 2)
- **MaxTaskCount**: Maximum tasks for auto-scaling (default: 10)

## Deployment

### Using AWS CLI

```bash
aws cloudformation create-stack \
  --stack-name loan-processing-dev \
  --template-body file://lib/cfn-template.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev \
    ParameterKey=ContainerImage,ParameterValue=123456789012.dkr.ecr.us-east-2.amazonaws.com/loan-app:latest \
    ParameterKey=DBMasterPassword,ParameterValue=YourSecurePassword123 \
    ParameterKey=CertificateArn,ParameterValue=arn:aws:acm:us-east-2:123456789012:certificate/abc-123 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-2
```

### Monitor Stack Creation

```bash
aws cloudformation describe-stacks \
  --stack-name loan-processing-dev \
  --region us-east-2 \
  --query 'Stacks[0].StackStatus'
```

### Get Stack Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name loan-processing-dev \
  --region us-east-2 \
  --query 'Stacks[0].Outputs'
```

## Key Features

### Security

- All ECS tasks run in private subnets with no direct internet access
- Security groups with least-privilege access rules
- Aurora backups encrypted with customer-managed KMS keys
- S3 bucket encryption and public access blocking
- IAM roles with minimal required permissions

### High Availability

- Resources distributed across 3 availability zones
- Aurora Multi-AZ configuration with 2 instances
- ECS tasks distributed across multiple AZs
- NAT Gateways in each AZ for redundancy

### Compliance

- CloudWatch Log Groups with 365-day retention
- Comprehensive audit logging
- Encryption at rest for database and S3
- Versioning enabled for document storage

### Auto-scaling

- Custom auto-scaling based on ALB RequestCountPerTarget metric
- Target: 1000 requests per task
- Scale-in/out cooldown: 60 seconds
- Configurable min/max task counts

## Cost Optimization

- Aurora Serverless v2 scales from 0.5 to 4 ACUs based on demand
- S3 lifecycle policies transition old versions to IA (30 days) and Glacier (90 days)
- ECS Fargate tasks scale based on actual load
- Non-current S3 versions expire after 365 days

## Cleanup

To delete all resources:

```bash
# Empty S3 bucket first (versioned bucket requires special handling)
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name loan-processing-dev \
  --region us-east-2 \
  --query 'Stacks[0].Outputs[?OutputKey==`DocumentBucketName`].OutputValue' \
  --output text)

aws s3 rm s3://${BUCKET_NAME} --recursive --region us-east-2

# Delete all object versions
aws s3api delete-objects \
  --bucket ${BUCKET_NAME} \
  --delete "$(aws s3api list-object-versions \
    --bucket ${BUCKET_NAME} \
    --query '{Objects: Versions[].{Key:Key,VersionId:VersionId}}' \
    --region us-east-2)" \
  --region us-east-2

# Delete stack
aws cloudformation delete-stack \
  --stack-name loan-processing-dev \
  --region us-east-2
```

## Outputs

The stack provides the following outputs:

- **VPCId**: VPC identifier
- **PublicSubnets**: Comma-separated list of public subnet IDs
- **PrivateSubnets**: Comma-separated list of private subnet IDs
- **ECSClusterName**: ECS cluster name
- **ECSServiceName**: ECS service name
- **AuroraClusterEndpoint**: Database write endpoint
- **AuroraClusterReadEndpoint**: Database read endpoint
- **DocumentBucketName**: S3 bucket name for documents
- **ApplicationLoadBalancerDNS**: ALB DNS name
- **ApplicationLoadBalancerURL**: Full ALB URL
- **LogGroupName**: CloudWatch Log Group name

## Troubleshooting

### Stack Creation Fails

- Check CloudFormation events for specific error messages
- Verify you have necessary IAM permissions (CAPABILITY_NAMED_IAM required)
- Ensure the DBMasterPassword meets complexity requirements (min 8 characters)
- Verify the CertificateArn is valid if provided

### ECS Tasks Not Starting

- Check ECS service events in AWS Console
- Review CloudWatch logs: `/ecs/loan-processing-{suffix}`
- Verify the container image is accessible from us-east-2
- Check security group rules allow ALB to ECS communication on port 80

### Database Connection Issues

- Verify security group allows traffic from ECS tasks to RDS on port 5432
- Check Aurora cluster is in "available" state
- Verify database credentials are correct
- Ensure ECS task definition has correct DB_HOST environment variable

### Auto-scaling Not Working

- Verify ALB is receiving traffic
- Check CloudWatch metrics for ALBRequestCountPerTarget
- Review Application Auto Scaling service role permissions
- Verify target value (1000 requests/task) is appropriate for your workload

## Architecture Diagram

```
                                    Internet
                                        |
                                        v
                      [Application Load Balancer]
                      (Public Subnets - 3 AZs)
                                        |
                                        v
                         [ECS Fargate Service]
                      (Private Subnets - 3 AZs)
                      /          |           \
                     /           |            \
                    v            v             v
        [Aurora Serverless]  [S3 Bucket]  [CloudWatch]
         (Multi-AZ, KMS)    (Versioned)   (365d logs)

[NAT Gateways x3] -----> Internet (outbound only)
```

## Notes

- The default container image (nginx:latest) is for testing only - replace with your application image
- HTTPS listener is only created if CertificateArn parameter is provided
- NAT Gateways incur hourly charges and data transfer costs
- Aurora Serverless v2 has minimum capacity charges even when idle (0.5 ACUs)
- The template is designed for us-east-2 region
- All resource names include the EnvironmentSuffix parameter for uniqueness
- Database credentials should be managed through AWS Secrets Manager in production

## Cost Estimate

Approximate monthly costs for us-east-2 region (moderate usage):

- **Aurora Serverless v2**: $45-180 (0.5-4 ACUs, depending on load)
- **ECS Fargate**: $30-150 (2-10 tasks at 0.5 vCPU, 1GB each)
- **NAT Gateways**: $100 (3 gateways @ $0.045/hour + data transfer)
- **Application Load Balancer**: $25 (LCU charges + data processing)
- **S3**: $5-20 (storage + requests + data transfer)
- **CloudWatch Logs**: $2-10 (ingestion + storage)

**Total estimate**: $207-485/month depending on usage patterns

To reduce costs:
- Use single NAT Gateway instead of 3 (saves ~$65/month, reduces availability)
- Reduce Aurora max capacity during off-peak hours
- Implement more aggressive S3 lifecycle transitions
- Reduce ECS task size if application allows

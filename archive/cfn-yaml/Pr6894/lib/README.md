# Loan Processing Infrastructure - CloudFormation Template

This CloudFormation template deploys a complete, production-ready infrastructure for a fault-tolerant loan processing web application with comprehensive security, monitoring, and high availability features.

## Architecture Overview

The infrastructure includes:

- **VPC**: Custom VPC spanning 3 availability zones with public and private subnets
- **Networking**: NAT Gateways in each AZ for high availability
- **Compute**: ECS Fargate cluster with auto-scaling based on CPU and memory metrics
- **Load Balancing**: Application Load Balancer with health checks
- **Database**: Aurora MySQL cluster with 1 writer and 2 reader instances across multiple AZs
- **Storage**: S3 buckets with encryption, versioning, and lifecycle policies
- **CDN**: CloudFront distribution with Origin Access Identity for secure S3 access
- **Security**: KMS encryption keys, IAM roles with least-privilege, and security groups
- **Monitoring**: CloudWatch alarms for CPU, memory, and database metrics with 90-day log retention

## Prerequisites

- AWS CLI installed and configured
- Valid AWS credentials with permissions to create CloudFormation stacks
- Docker image for the loan processing application (or use default nginx for testing)

## Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| EnvironmentSuffix | Unique suffix for resource names | `prod` |
| EnableDeletionProtection | Enable deletion protection on critical resources | `false` |
| DisasterRecoveryRegion | AWS region for DR backups | `us-west-2` |
| ContainerImage | Docker image for the application | `nginx:latest` |
| ContainerPort | Port exposed by the container | `80` |
| DBMasterUsername | Aurora MySQL master username | `admin` |
| DBMasterPassword | Aurora MySQL master password | (required) |

## Deployment Instructions

### Option 1: AWS Console

1. Navigate to CloudFormation in the AWS Console
2. Click "Create Stack"  "With new resources"
3. Upload `loan-processing-infrastructure.yaml`
4. Fill in the required parameters (especially DBMasterPassword)
5. Review and create the stack

### Option 2: AWS CLI

```bash
# Validate the template
aws cloudformation validate-template \
  --template-body file://lib/loan-processing-infrastructure.yaml

# Create the stack
aws cloudformation create-stack \
  --stack-name loan-processing-prod \
  --template-body file://lib/loan-processing-infrastructure.yaml \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=DBMasterPassword,ParameterValue=YourSecurePassword123! \
    ParameterKey=EnableDeletionProtection,ParameterValue=false \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Monitor stack creation
aws cloudformation wait stack-create-complete \
  --stack-name loan-processing-prod \
  --region us-east-1

# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name loan-processing-prod \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

### Option 3: Using Parameters File

Create a parameters file `parameters.json`:

```json
[
  {
    "ParameterKey": "EnvironmentSuffix",
    "ParameterValue": "prod"
  },
  {
    "ParameterKey": "DBMasterPassword",
    "ParameterValue": "YourSecurePassword123!"
  },
  {
    "ParameterKey": "EnableDeletionProtection",
    "ParameterValue": "false"
  },
  {
    "ParameterKey": "ContainerImage",
    "ParameterValue": "your-ecr-repo/loan-app:latest"
  }
]
```

Deploy with:

```bash
aws cloudformation create-stack \
  --stack-name loan-processing-prod \
  --template-body file://lib/loan-processing-infrastructure.yaml \
  --parameters file://parameters.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

## Stack Outputs

After successful deployment, the stack provides these outputs:

- **LoadBalancerURL**: HTTP endpoint to access the application
- **DatabaseEndpoint**: Aurora MySQL writer endpoint
- **DatabaseReaderEndpoint**: Aurora MySQL reader endpoint
- **DocumentBucketName**: S3 bucket for loan documents
- **StaticAssetsBucketName**: S3 bucket for static assets
- **CloudFrontDistributionURL**: HTTPS endpoint for static content
- **ECSClusterName**: Name of the ECS cluster
- **ECSServiceName**: Name of the ECS service

## Security Features

1. **Encryption at Rest**:
   - RDS encrypted with customer-managed KMS keys
   - S3 buckets encrypted with KMS
   - CloudWatch logs encrypted with KMS

2. **Encryption in Transit**:
   - Aurora MySQL requires SSL/TLS connections
   - CloudFront uses TLS 1.2 minimum
   - ALB supports HTTPS (configure certificate separately)

3. **Network Security**:
   - Private subnets for ECS tasks and RDS instances
   - Security groups with minimal required ports
   - Public access blocked on S3 buckets

4. **IAM**:
   - Least-privilege IAM roles for all services
   - Separate execution and task roles for ECS

## Auto-Scaling Configuration

- **CPU Scaling**: Triggers at 70% utilization
- **Memory Scaling**: Triggers at 80% utilization
- **Database Connection Scaling**: Alarm at 80% of max connections
- **Min Tasks**: 2
- **Max Tasks**: 10

## Monitoring and Alarms

CloudWatch alarms configured for:

1. ECS CPU utilization (>70%)
2. ECS memory utilization (>80%)
3. RDS database connections (>80)
4. RDS CPU utilization (>80%)

Logs retention: 90 days (compliance requirement)

## Lifecycle Policies

S3 objects automatically transition to Glacier after 180 days to reduce storage costs.

## Disaster Recovery

- Aurora automated backups retained for 30 days
- Backups can be replicated to us-west-2 (configured via parameter)
- Multi-AZ deployment ensures high availability

## Cost Optimization

Estimated monthly costs (us-east-1):

- ECS Fargate (2 tasks): ~$40
- Aurora MySQL (3 instances): ~$500
- NAT Gateways (3): ~$100
- ALB: ~$25
- S3 Storage: Variable
- CloudFront: Variable
- Data Transfer: Variable

**Total Base Cost**: ~$665/month (excluding data transfer and storage)

## Updating the Stack

```bash
aws cloudformation update-stack \
  --stack-name loan-processing-prod \
  --template-body file://lib/loan-processing-infrastructure.yaml \
  --parameters file://parameters.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

## Deleting the Stack

```bash
# Empty S3 buckets first
aws s3 rm s3://loan-documents-prod-ACCOUNT_ID --recursive
aws s3 rm s3://loan-static-assets-prod-ACCOUNT_ID --recursive

# Delete the stack
aws cloudformation delete-stack \
  --stack-name loan-processing-prod \
  --region us-east-1

# Wait for deletion
aws cloudformation wait stack-delete-complete \
  --stack-name loan-processing-prod \
  --region us-east-1
```

## Troubleshooting

### Stack Creation Fails

1. Check CloudFormation events for error messages
2. Verify IAM permissions (requires CAPABILITY_NAMED_IAM)
3. Ensure unique EnvironmentSuffix parameter
4. Verify database password meets requirements (min 8 characters)

### Application Not Accessible

1. Check ECS service status: `aws ecs describe-services`
2. Verify ALB target health: `aws elbv2 describe-target-health`
3. Check security group rules
4. Verify container image is accessible

### Database Connection Issues

1. Verify security group allows traffic from ECS tasks
2. Check Aurora cluster status
3. Verify SSL/TLS certificate validation in application
4. Check database credentials

## Compliance

This infrastructure meets the following compliance requirements:

- **PCI-DSS**: Encryption at rest and in transit, audit logging, network segmentation
- **Logging**: 90-day retention for compliance
- **Data Protection**: Versioning and lifecycle policies on all buckets
- **High Availability**: Multi-AZ deployment across 3 availability zones

## Support

For issues or questions:

1. Check CloudFormation stack events
2. Review CloudWatch logs: `/ecs/loan-processing-{suffix}`
3. Check AWS service health dashboard
4. Review AWS CloudFormation documentation

## License

This template is provided as-is for demonstration purposes.
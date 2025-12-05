# ECS Batch Processing System

CloudFormation template for deploying a containerized batch processing system using Amazon ECS with Fargate for transaction reconciliation workloads.

## Architecture Overview

This solution deploys a complete ECS-based batch processing system with three distinct processing stages:

1. **Data Ingestion Service**: Ingests transaction data from various sources
2. **Transaction Processing Service**: Performs reconciliation logic on transactions
3. **Report Generation Service**: Generates compliance reports (exposed via ALB)

### Key Components

- **ECS Cluster**: Fargate-based cluster with Container Insights enabled
- **Task Definitions**: Three task definitions with X-Ray sidecar containers
- **ECS Services**: Three services with exactly 2 tasks each for redundancy
- **Application Load Balancer**: Distributes traffic to report-generation service
- **Auto Scaling**: CPU-based scaling policies (70% scale up, 30% scale down)
- **Monitoring**: CloudWatch logs with 30-day retention, X-Ray tracing
- **Security**: IAM roles with least-privilege access, Secrets Manager integration

## Prerequisites

Before deploying this template, ensure you have:

1. **VPC Setup**: VPC with at least 2 availability zones, private subnets for ECS tasks, public subnets for ALB
2. **NAT Gateway**: For outbound connectivity from private subnets
3. **ECR Repositories**: Pre-created with container images
   - data-ingestion
   - transaction-processing
   - report-generation
4. **Secrets Manager**: Secret containing database credentials and API keys
5. **S3 Bucket**: For output data storage
6. **IAM Service-Linked Role**: For Application Auto Scaling (created automatically if not exists)

## Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| EnvironmentSuffix | Unique suffix for resource naming | `prod-123` |
| VpcId | VPC ID where resources will be created | `vpc-0123456789abcdef0` |
| PrivateSubnetIds | Private subnet IDs (minimum 2) | `subnet-abc123,subnet-def456` |
| PublicSubnetIds | Public subnet IDs for ALB | `subnet-pub123,subnet-pub456` |
| DataIngestionImageUri | ECR image URI for data-ingestion | `123456789012.dkr.ecr.us-east-2.amazonaws.com/data-ingestion:latest` |
| TransactionProcessingImageUri | ECR image URI for transaction-processing | `123456789012.dkr.ecr.us-east-2.amazonaws.com/transaction-processing:latest` |
| ReportGenerationImageUri | ECR image URI for report-generation | `123456789012.dkr.ecr.us-east-2.amazonaws.com/report-generation:latest` |
| XRayImageUri | X-Ray daemon image URI | `public.ecr.aws/xray/aws-xray-daemon:latest` |
| SecretsManagerArn | ARN of Secrets Manager secret | `arn:aws:secretsmanager:us-east-2:123456789012:secret:my-secret-abc123` |
| S3BucketName | S3 bucket for output data | `my-transaction-data-bucket` |

## Deployment

### Using AWS CLI

```bash
aws cloudformation create-stack \
  --stack-name ecs-batch-processing-prod \
  --template-body file://template.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-123 \
    ParameterKey=VpcId,ParameterValue=vpc-0123456789abcdef0 \
    ParameterKey=PrivateSubnetIds,ParameterValue=subnet-abc123\\,subnet-def456 \
    ParameterKey=PublicSubnetIds,ParameterValue=subnet-pub123\\,subnet-pub456 \
    ParameterKey=DataIngestionImageUri,ParameterValue=123456789012.dkr.ecr.us-east-2.amazonaws.com/data-ingestion:latest \
    ParameterKey=TransactionProcessingImageUri,ParameterValue=123456789012.dkr.ecr.us-east-2.amazonaws.com/transaction-processing:latest \
    ParameterKey=ReportGenerationImageUri,ParameterValue=123456789012.dkr.ecr.us-east-2.amazonaws.com/report-generation:latest \
    ParameterKey=XRayImageUri,ParameterValue=public.ecr.aws/xray/aws-xray-daemon:latest \
    ParameterKey=SecretsManagerArn,ParameterValue=arn:aws:secretsmanager:us-east-2:123456789012:secret:my-secret-abc123 \
    ParameterKey=S3BucketName,ParameterValue=my-transaction-data-bucket \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-2
```

### Using AWS Console

1. Navigate to CloudFormation in AWS Console
2. Click "Create stack" with new resources
3. Upload `template.json`
4. Fill in all parameters
5. Acknowledge IAM resource creation
6. Click "Create stack"

## Validation

After deployment completes (approximately 10-15 minutes), verify:

```bash
# Check stack status
aws cloudformation describe-stacks \
  --stack-name ecs-batch-processing-prod \
  --query 'Stacks[0].StackStatus' \
  --region us-east-2

# Get ALB DNS name
aws cloudformation describe-stacks \
  --stack-name ecs-batch-processing-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text \
  --region us-east-2

# List ECS services
aws ecs list-services \
  --cluster ecs-cluster-prod-123 \
  --region us-east-2

# Check service running tasks
aws ecs describe-services \
  --cluster ecs-cluster-prod-123 \
  --services data-ingestion-service-prod-123 \
  --query 'services[0].runningCount' \
  --region us-east-2
```

## Monitoring

### CloudWatch Logs

Logs are available in CloudWatch Log Groups:
- `/ecs/data-ingestion-{environmentSuffix}`
- `/ecs/transaction-processing-{environmentSuffix}`
- `/ecs/report-generation-{environmentSuffix}`
- `/ecs/xray-{environmentSuffix}`

Retention: 30 days

### Container Insights

View ECS metrics in CloudWatch Container Insights:
1. Navigate to CloudWatch Container Insights
2. Select ECS Clusters
3. Choose your cluster: `ecs-cluster-{environmentSuffix}`

### X-Ray Tracing

View distributed traces in AWS X-Ray:
1. Navigate to X-Ray Service Map
2. View traces for each service
3. Analyze latency and errors

### Auto Scaling Metrics

Monitor auto-scaling activities:
```bash
aws application-autoscaling describe-scaling-activities \
  --service-namespace ecs \
  --region us-east-2
```

## Troubleshooting

### Services Not Starting

```bash
# Check service events
aws ecs describe-services \
  --cluster ecs-cluster-prod-123 \
  --services data-ingestion-service-prod-123 \
  --query 'services[0].events[0:5]' \
  --region us-east-2

# Check task definition
aws ecs describe-task-definition \
  --task-definition data-ingestion-prod-123 \
  --region us-east-2
```

### Task Health Check Failures

- Verify container health check commands
- Check CloudWatch logs for application errors
- Ensure security groups allow necessary traffic
- Verify Secrets Manager secret is accessible

### ALB Target Health

```bash
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn> \
  --region us-east-2
```

## Cost Optimization

Estimated monthly costs (us-east-2):
- **Fargate Tasks**: 6 tasks (2 per service) × 1 vCPU × 2 GB × $0.04 per hour approximately $175/month
- **Application Load Balancer**: $16/month + data processing
- **CloudWatch Logs**: approximately $5/month (depends on log volume)
- **NAT Gateway**: $32/month + data transfer
- **Total**: approximately $230-250/month (baseline)

Cost scales with auto-scaling and data transfer.

## Clean Up

To delete all resources:

```bash
aws cloudformation delete-stack \
  --stack-name ecs-batch-processing-prod \
  --region us-east-2

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete \
  --stack-name ecs-batch-processing-prod \
  --region us-east-2
```

Note: Manual cleanup required for:
- ECR repositories (if they contain images)
- S3 bucket (if it contains data)
- Secrets Manager secret

## Security Considerations

1. **IAM Roles**: Task roles follow least-privilege principle
2. **Secrets**: All sensitive data from Secrets Manager
3. **Network**: Tasks in private subnets, no public IPs
4. **Encryption**: Enable encryption at rest for S3 and logs
5. **Security Groups**: Restrictive ingress rules

## Resources Created

The template creates:

1. **1 ECS Cluster** with Container Insights
2. **2 IAM Roles** (Task Execution Role, Task Role)
3. **4 CloudWatch Log Groups** (one per service + X-Ray)
4. **3 Task Definitions** (each with main container + X-Ray sidecar)
5. **2 Security Groups** (ECS tasks, ALB)
6. **1 Application Load Balancer** with target group and listener
7. **3 ECS Services** (one per task definition)
8. **3 Auto Scaling Targets** and **3 Scaling Policies**

Total: 23 CloudFormation resources

## Support

For issues or questions:
1. Check CloudWatch logs for application errors
2. Review CloudFormation events for deployment issues
3. Consult AWS documentation for ECS and Fargate

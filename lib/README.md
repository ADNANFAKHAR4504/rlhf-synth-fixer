# ECS Fargate Batch Processing Infrastructure

This CDKTF Python application deploys a production-ready ECS Fargate cluster for batch processing workloads with comprehensive networking, monitoring, and security features.

## Architecture

The infrastructure includes:

1. **Networking**: VPC with 3 public and 3 private subnets across availability zones, NAT gateways, and VPC endpoints
2. **Container Registry**: ECR repository with image scanning and lifecycle policies
3. **ECS Cluster**: Fargate cluster with container insights and mixed capacity providers (FARGATE + FARGATE_SPOT)
4. **Load Balancing**: Application Load Balancer with health checks
5. **Auto-Scaling**: Target tracking based on CPU utilization (70% scale up, 30% scale down)
6. **Logging**: CloudWatch Logs with KMS encryption and 30-day retention
7. **Security**: IAM roles with least privilege, KMS encryption, security groups
8. **VPC Endpoints**: Private connectivity for ECR, ECS, CloudWatch Logs, and S3
9. **Monitoring**: Comprehensive CloudWatch alarms for ECS and ALB metrics
10. **Notifications**: SNS topic for alarm notifications

## Prerequisites

- Python 3.9+
- pipenv
- CDKTF 0.20+
- AWS CLI configured with appropriate credentials
- Docker (for building container images)
- Terraform 1.0+

## Installation

1. Install dependencies:

```bash
pipenv install
```

2. Verify CDKTF installation:

```bash
pipenv run cdktf --version
```

## Deployment

1. Initialize the project:

```bash
pipenv run cdktf get
```

2. Build a sample container image and push to ECR (after first deployment to create ECR repository):

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(terraform output -raw ecr_repository_url | cut -d'/' -f1)

# Build and push image
docker build -t batch-processor .
docker tag batch-processor:latest $(terraform output -raw ecr_repository_url):latest
docker push $(terraform output -raw ecr_repository_url):latest
```

3. Deploy the infrastructure:

```bash
pipenv run cdktf deploy
```

4. To destroy the infrastructure:

```bash
pipenv run cdktf destroy
```

## Configuration

### Environment Suffix

The infrastructure uses Terraform workspace names as environment suffixes for unique resource naming:

```bash
# Create and select workspace
terraform workspace new dev
terraform workspace select dev

# Deploy with environment suffix
pipenv run cdktf deploy
```

### Resource Tagging

All resources are tagged with:
- `Environment`: Workspace name (environment suffix)
- `Project`: ecs-fargate-batch-processing
- `CostCenter`: engineering
- `ManagedBy`: CDKTF

### Cost Optimization

The infrastructure uses:
- 70% FARGATE_SPOT capacity for cost savings
- VPC endpoints to reduce NAT gateway data transfer costs
- ECR lifecycle policy to retain only last 10 images
- 30-day CloudWatch Logs retention

## Monitoring

### CloudWatch Alarms

The infrastructure includes alarms for:

**ECS Service:**
- Unhealthy task count > 1
- CPU utilization > 85% for 15 minutes
- Memory utilization > 85% for 15 minutes

**Application Load Balancer:**
- Unhealthy host count > 1
- Target response time > 1 second for 3 minutes
- HTTP 5XX errors > 10 per minute

**Notifications:**
All alarms send notifications to the SNS topic. Subscribe to receive alerts:

```bash
aws sns subscribe \
  --topic-arn $(terraform output -raw sns_topic_arn) \
  --protocol email \
  --notification-endpoint your-email@example.com
```

### Container Insights

ECS Container Insights provides additional metrics and logs for:
- Task-level CPU and memory
- Network metrics
- Storage metrics

Access via CloudWatch Console > Container Insights.

## Security

### Network Isolation

- ECS tasks run in private subnets with no direct internet access
- Outbound traffic routes through NAT gateways
- VPC endpoints provide private connectivity to AWS services
- Security groups enforce least privilege network access

### Encryption

- CloudWatch Logs encrypted with KMS
- ECR images scanned for vulnerabilities
- KMS key rotation enabled

### IAM Roles

- Task execution role: Minimal permissions for ECR pull and CloudWatch Logs
- Task role: Application-specific permissions (customize as needed)

## Testing

Run unit tests:

```bash
pipenv run pytest tests/unit/ -v --cov=stacks --cov-report=term-missing
```

Run integration tests (requires deployed infrastructure):

```bash
pipenv run pytest tests/integration/ -v
```

## Troubleshooting

### Task Startup Issues

Check CloudWatch Logs:

```bash
aws logs tail /ecs/fargate-batch-processor-$(terraform workspace show) --follow
```

### ALB Health Check Failures

Verify target group health:

```bash
aws elbv2 describe-target-health \
  --target-group-arn $(terraform output -raw target_group_arn)
```

### VPC Endpoint Connectivity

Verify private DNS is enabled and security groups allow HTTPS (443) from ECS tasks.

## Outputs

After deployment, the following outputs are available:

- `vpc_id`: VPC ID
- `cluster_name`: ECS Cluster Name
- `cluster_arn`: ECS Cluster ARN
- `service_name`: ECS Service Name
- `alb_dns_name`: ALB DNS Name (use to access the application)
- `ecr_repository_url`: ECR Repository URL
- `log_group_name`: CloudWatch Log Group Name
- `sns_topic_arn`: SNS Topic ARN for Alarms

## Blue-Green Deployments

While this infrastructure uses standard ECS deployment, you can enable blue-green deployments using AWS CodeDeploy:

1. Create CodeDeploy application and deployment group
2. Update ECS service to use CODE_DEPLOY deployment controller
3. Configure traffic shifting rules in CodeDeploy

## License

MIT

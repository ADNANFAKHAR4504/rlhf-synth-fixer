# E-commerce Containerized Application Infrastructure

Pulumi TypeScript infrastructure for deploying a containerized e-commerce application on AWS using ECS Fargate, RDS PostgreSQL, Application Load Balancer, and supporting services.

## Architecture

This infrastructure deploys a production-grade containerized e-commerce platform with:

- **Networking**: VPC with 3 public and 3 private subnets across availability zones
- **Database**: RDS PostgreSQL 14 (db.t3.medium) in private subnets with automated backups
- **Compute**: ECS Fargate cluster running containerized applications
- **Load Balancing**: Application Load Balancer with health checks on /health endpoint
- **Container Registry**: ECR repository with image scanning and lifecycle policies
- **Logging**: CloudWatch Logs with 30-day retention
- **Secrets**: AWS Secrets Manager for database credentials
- **Auto-scaling**: ECS service scaling based on 70% CPU utilization (2-10 tasks)
- **Security**: Multi-tier security groups, encryption at rest and in transit

## Prerequisites

- Node.js 20.x or later
- Pulumi CLI 3.x or later
- AWS CLI configured with appropriate credentials
- Docker (for building and pushing container images)
- AWS account with permissions for VPC, ECS, RDS, ECR, ALB, CloudWatch, IAM, Secrets Manager

## Installation

1. Clone the repository and navigate to the project directory

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure AWS region:
   ```bash
   export AWS_REGION=ap-southeast-1
   pulumi config set aws:region ap-southeast-1
   ```

## Deployment

### 1. Set Environment Variables

```bash
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=ap-southeast-1
```

### 2. Initialize Pulumi Stack

```bash
pulumi stack init dev
```

### 3. Deploy Infrastructure

```bash
pulumi up --yes
```

This will create all AWS resources. The deployment takes approximately 10-15 minutes due to RDS and NAT Gateway provisioning.

### 4. Get Stack Outputs

```bash
# Get all outputs
pulumi stack output

# Get specific outputs
export ECR_REPO_URI=$(pulumi stack output ecrRepositoryUri)
export ALB_DNS=$(pulumi stack output albDnsName)
```

### 5. Build and Push Container Image

```bash
# Authenticate Docker with ECR
aws ecr get-login-password --region ap-southeast-1 | \
  docker login --username AWS --password-stdin $ECR_REPO_URI

# Build application container (assuming app code in ./app directory)
docker build -t ecommerce-app ./app

# Tag and push to ECR
docker tag ecommerce-app:latest $ECR_REPO_URI:latest
docker push $ECR_REPO_URI:latest
```

### 6. Update ECS Service

After pushing the image, ECS will automatically deploy the new task definition:

```bash
# Wait for service to stabilize
aws ecs wait services-stable \
  --cluster ecommerce-cluster-${ENVIRONMENT_SUFFIX} \
  --services ecommerce-service-${ENVIRONMENT_SUFFIX} \
  --region ap-southeast-1
```

### 7. Verify Deployment

```bash
# Check health endpoint
curl http://$ALB_DNS/health

# View ECS service status
aws ecs describe-services \
  --cluster ecommerce-cluster-${ENVIRONMENT_SUFFIX} \
  --services ecommerce-service-${ENVIRONMENT_SUFFIX} \
  --region ap-southeast-1
```

## Configuration

### Environment Suffix

All resources are tagged with an environment suffix to support multiple deployments:

```bash
export ENVIRONMENT_SUFFIX=staging  # or prod, qa, etc.
```

### Resource Naming

Resources follow the pattern: `{resource-type}-{environmentSuffix}`

Examples:
- VPC: `ecommerce-vpc-dev`
- ECS Cluster: `ecommerce-cluster-dev`
- RDS Instance: `ecommerce-db-dev`
- ALB: `ecommerce-alb-dev`

### Auto-scaling Configuration

The ECS service scales between 2-10 tasks based on average CPU utilization:
- Scale out when CPU > 70% (cooldown: 60 seconds)
- Scale in when CPU < 70% (cooldown: 300 seconds)

## Monitoring

### CloudWatch Logs

Container logs are sent to CloudWatch Logs:
- Log Group: `/ecs/ecommerce-app-${ENVIRONMENT_SUFFIX}`
- Retention: 30 days
- Stream Prefix: `ecs`

View logs:
```bash
aws logs tail /ecs/ecommerce-app-${ENVIRONMENT_SUFFIX} --follow
```

### CloudWatch Metrics

ECS Container Insights is enabled for detailed metrics:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ClusterName,Value=ecommerce-cluster-${ENVIRONMENT_SUFFIX} \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

## Security

### Network Security

- RDS database deployed in private subnets only
- ECS tasks run in private subnets with NAT Gateway for outbound access
- ALB deployed in public subnets
- Security groups implement least privilege access

### Data Protection

- RDS storage encryption enabled (AES256)
- ECR repository encryption enabled
- Database credentials stored in AWS Secrets Manager
- Secrets injected as environment variables at runtime

### IAM Policies

- Task Execution Role: Minimal permissions for pulling images and accessing secrets
- Task Role: Application-specific permissions for CloudWatch Logs
- No excessive wildcard permissions

## Troubleshooting

### ECS Tasks Not Starting

Check task logs:
```bash
aws ecs describe-tasks \
  --cluster ecommerce-cluster-${ENVIRONMENT_SUFFIX} \
  --tasks $(aws ecs list-tasks --cluster ecommerce-cluster-${ENVIRONMENT_SUFFIX} --query 'taskArns[0]' --output text) \
  --region ap-southeast-1
```

### ALB Health Checks Failing

Verify health endpoint returns 200:
```bash
# From within VPC or via bastion host
curl http://<task-ip>/health
```

### Database Connection Issues

Check security group rules and verify secrets:
```bash
aws secretsmanager get-secret-value \
  --secret-id ecommerce-db-connection-${ENVIRONMENT_SUFFIX} \
  --region ap-southeast-1
```

## Testing

### Unit Tests

```bash
npm run test:unit
```

### Integration Tests

```bash
# Deploy infrastructure first
pulumi up --yes

# Run integration tests
npm run test:integration
```

## Cleanup

Destroy all resources:

```bash
pulumi destroy --yes
```

This will remove all AWS resources created by the stack. The RDS instance will be deleted without a final snapshot (skipFinalSnapshot=true) to enable easy cleanup in CI/CD environments.

## Cost Optimization

Current configuration is optimized for cost:
- Single NAT Gateway instead of one per AZ (can be changed for production)
- db.t3.medium RDS instance (suitable for dev/test)
- Single-AZ RDS deployment (set multiAz=true for production)
- Auto-scaling ensures you only pay for what you use

Estimated monthly cost (us-east-1 pricing):
- NAT Gateway: ~$32/month
- RDS db.t3.medium: ~$50/month (single-AZ)
- ECS Fargate: ~$35/month (1 vCPU, 2GB, 3 tasks average)
- ALB: ~$20/month
- Total: ~$137/month (excluding data transfer)

## Production Recommendations

For production deployments:
1. Enable multi-AZ for RDS (set multiAz: true)
2. Use NAT Gateway per AZ (change strategy to PerAZ)
3. Enable ALB deletion protection
4. Configure HTTPS listener with ACM certificate
5. Increase RDS backup retention period
6. Add AWS WAF for application protection
7. Implement CloudWatch alarms for critical metrics
8. Use dedicated Secrets Manager entries (not hardcoded passwords)
9. Enable VPC Flow Logs
10. Configure RDS Performance Insights

## Stack Outputs

The following outputs are exported:

- `vpcId`: VPC identifier
- `albDnsName`: Application Load Balancer DNS name
- `ecrRepositoryUri`: ECR repository URI for pushing images
- `databaseEndpoint`: RDS database endpoint
- `ecsClusterName`: ECS cluster name
- `ecsServiceName`: ECS service name
- `region`: AWS region (ap-southeast-1)
- `environmentSuffixOutput`: Environment suffix used

## Support

For issues or questions, please refer to:
- Pulumi documentation: https://www.pulumi.com/docs/
- AWS ECS documentation: https://docs.aws.amazon.com/ecs/
- Project PROMPT.md for detailed requirements

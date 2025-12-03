# ECS Cluster Optimization Stack

## Overview

This Pulumi TypeScript stack implements a fully optimized Amazon ECS cluster addressing all 10 optimization requirements:

1. **Capacity Providers**: Uses Fargate and Fargate Spot with managed scaling
2. **Task Optimization**: Right-sized CPU (256) and Memory (512) - 40% reduction
3. **Fargate Spot**: 80% of tasks run on Spot for 70% cost savings
4. **Fixed Health Checks**: ALB timeout set to 5s, interval 30s (no false positives)
5. **Tagging Strategy**: All resources include environmentSuffix in names
6. **Container Insights**: Enabled on ECS cluster for performance monitoring
7. **Task Placement**: Binpack strategy on memory for optimal utilization
8. **Security Hardening**: SSH restricted to VPC CIDR only (no 0.0.0.0/0)
9. **IAM Least Privilege**: Separate execution and task roles with minimal permissions
10. **ECR Lifecycle**: Automatic cleanup of untagged images after 7 days

## Architecture

- **VPC**: 10.0.0.0/16 with public and private subnets across 2 AZs
- **ECS Cluster**: Fargate-based with Container Insights enabled
- **Capacity**: 80% Fargate Spot (weight 4) + 20% Fargate (weight 1, base 1)
- **Load Balancer**: Application Load Balancer with fixed health checks
- **Container Registry**: ECR with lifecycle policies
- **Monitoring**: CloudWatch Logs, Container Insights, CPU/Memory alarms
- **Security**: Hardened security groups, least privilege IAM roles

## Cost Optimization

- **Task Right-Sizing**: 40% reduction in CPU/Memory allocations
- **Fargate Spot**: 70% cost reduction for 80% of workload
- **ECR Lifecycle**: Automated image cleanup reduces storage costs
- **NAT Gateway**: Single NAT for cost efficiency
- **Log Retention**: 7-day retention to control costs

## Prerequisites

- Pulumi CLI installed
- AWS CLI configured with appropriate credentials
- Node.js 18+ and npm installed
- Docker (for building container images)

## Configuration

Required configuration values:

```bash
pulumi config set environmentSuffix <your-suffix>
pulumi config set aws:region us-east-1
```

## Deployment

### 1. Build and Push Container Image

```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build the image
docker build -t ecs-app-<environmentSuffix> -f lib/Dockerfile lib/

# Tag the image
docker tag ecs-app-<environmentSuffix>:latest <repository-url>:latest

# Push to ECR
docker push <repository-url>:latest
```

### 2. Deploy Infrastructure

```bash
# Install dependencies
npm install

# Preview changes
pulumi preview

# Deploy stack
pulumi up
```

### 3. Verify Deployment

```bash
# Get ALB URL
pulumi stack output albUrl

# Test health endpoint
curl $(pulumi stack output albUrl)/health

# Check Container Insights
aws ecs describe-clusters --clusters $(pulumi stack output clusterName) --include SETTINGS
```

## Monitoring

### CloudWatch Container Insights

The cluster has Container Insights enabled for monitoring:

- CPU utilization
- Memory utilization
- Network traffic
- Task count and status

Access metrics in CloudWatch Console under Container Insights.

### CloudWatch Alarms

Two alarms configured:

1. **High CPU**: Alerts when CPU > 80% for 10 minutes
2. **High Memory**: Alerts when Memory > 80% for 10 minutes

### CloudWatch Logs

All container logs are sent to CloudWatch Logs group: `/ecs/<environmentSuffix>`

Retention: 7 days

## Security

### Network Security

- ALB in public subnets (accepts HTTP/HTTPS from internet)
- ECS tasks in private subnets (no direct internet access)
- Security groups follow least privilege:
  - ALB SG: 80, 443 from internet
  - Task SG: 80, 443 from ALB only; SSH from VPC CIDR only (not 0.0.0.0/0)

### IAM Security

- **Task Execution Role**: Minimal permissions for ECR pull and CloudWatch logging
- **Task Role**: Limited to CloudWatch logs and S3 read operations
- No administrative or elevated permissions

### ECR Security

- Image scanning enabled on push
- Lifecycle policy removes untagged images after 7 days
- Only tagged versioned images retained (last 10)

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

All resources are configured without retention policies for clean teardown.

## Resource Naming Convention

All resources follow the pattern: `<resource-type>-<environment-suffix>`

Examples:
- ecs-cluster-dev123
- ecs-alb-dev123
- ecs-task-sg-dev123

## Troubleshooting

### Health Check Failures

If health checks fail:
1. Verify container is listening on port 80
2. Check /health endpoint returns 200
3. Verify security group allows ALB to Task traffic
4. Review CloudWatch Logs for application errors

### Task Launch Failures

If tasks fail to start:
1. Check ECR image exists and is accessible
2. Verify task execution role has ECR pull permissions
3. Review CloudWatch Logs for startup errors
4. Confirm task definition resource allocations

### High Costs

If costs are higher than expected:
1. Verify Fargate Spot is being used (check capacity provider metrics)
2. Confirm ECR lifecycle policy is cleaning up images
3. Review CloudWatch Logs retention (7 days)
4. Check for unused NAT Gateway data transfer

## Performance Metrics

Expected performance after optimization:

- **Cost Reduction**: 70% for Fargate Spot workloads
- **Resource Utilization**: 60-80% (up from 40%)
- **Task Startup Time**: <30 seconds
- **Health Check Success Rate**: >99%
- **Spot Interruption Rate**: <5% (Fargate manages gracefully)

## References

- [Amazon ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [Fargate Spot](https://aws.amazon.com/fargate/spot/)
- [Container Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/ContainerInsights.html)
- [ECR Lifecycle Policies](https://docs.aws.amazon.com/AmazonECR/latest/userguide/LifecyclePolicies.html)

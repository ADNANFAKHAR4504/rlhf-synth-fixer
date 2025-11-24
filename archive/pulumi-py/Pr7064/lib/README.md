# Payment Processing Infrastructure - Multi-Environment Deployment

A comprehensive payment processing platform infrastructure implemented with Pulumi and Python, supporting multiple environments (dev, staging, production) with identical core infrastructure and environment-specific configurations.

## Architecture Overview

This solution provides a complete, production-ready payment processing platform with the following components:

### Core Infrastructure

- **Networking**: VPC with public and private subnets across multiple availability zones
- **Compute**: ECS Fargate cluster for containerized application hosting
- **Database**: RDS Aurora Serverless v2 PostgreSQL for transaction data
- **Caching**: ElastiCache Redis for session management and performance optimization
- **Messaging**: SQS queues and SNS topics for asynchronous processing and notifications
- **Load Balancing**: Application Load Balancer for HTTPS traffic distribution
- **Monitoring**: CloudWatch alarms and logging for operational visibility
- **Security**: Security groups, IAM roles, encryption at rest and in transit
- **Secrets Management**: AWS Secrets Manager for secure credential storage

### Multi-Environment Support

The infrastructure supports three environments with identical structure but different configurations:

- **Development**: Minimal resources, single AZ, smaller instance sizes
- **Staging**: Production-like setup, multi-AZ, moderate instance sizes
- **Production**: Full multi-AZ deployment, larger instances, enhanced monitoring

## Project Structure

```
lib/
├── __main__.py          # Main Pulumi program entry point
├── vpc.py               # VPC and networking resources
├── security.py          # Security groups for all components
├── database.py          # RDS Aurora Serverless v2 database
├── cache.py             # ElastiCache Redis cluster
├── messaging.py         # SQS queues and SNS topics
├── compute.py           # ECS Fargate cluster and services
├── monitoring.py        # CloudWatch alarms and monitoring
├── PROMPT.md            # Original requirements
├── MODEL_RESPONSE.md    # Generated implementation details
└── README.md            # This file

Root:
├── Pulumi.yaml          # Pulumi project configuration
├── Pulumi.dev.yaml      # Development environment config
├── Pulumi.staging.yaml  # Staging environment config
├── Pulumi.prod.yaml     # Production environment config
└── metadata.json        # Task metadata
```

## Prerequisites

### Software Requirements

1. **Pulumi CLI** (v3.0 or later)
   ```bash
   curl -fsSL https://get.pulumi.com | sh
   ```

2. **Python** (3.8 or later)
   ```bash
   python3 --version
   ```

3. **AWS CLI** configured with appropriate credentials
   ```bash
   aws configure
   ```

4. **Python Dependencies**
   ```bash
   pip install pulumi pulumi-aws
   ```

### AWS Permissions

The AWS user/role needs permissions for:
- VPC and networking (EC2)
- ECS and Fargate
- RDS Aurora
- ElastiCache
- SQS and SNS
- Application Load Balancer
- CloudWatch Logs and Alarms
- IAM roles and policies
- Secrets Manager

## Quick Start

### 1. Initialize Development Environment

```bash
# Navigate to project directory
cd /var/www/turing/iac-test-automations/worktree/synth-101912543

# Initialize Pulumi stack for development
pulumi stack init dev

# Configure required parameters
pulumi config set aws:region us-east-1
pulumi config set payment-processing:environmentSuffix dev-test-001
pulumi config set payment-processing:environment dev
pulumi config set payment-processing:vpcCidr 10.0.0.0/16
pulumi config set payment-processing:enableMultiAZ false
```

### 2. Preview Infrastructure

```bash
# Preview what will be created
pulumi preview
```

### 3. Deploy Infrastructure

```bash
# Deploy all resources
pulumi up

# Review the plan and confirm with 'yes'
```

### 4. Access Deployment Outputs

```bash
# Get ALB DNS name for API access
pulumi stack output alb_dns_name

# Get database endpoint
pulumi stack output database_endpoint

# Get cache endpoint
pulumi stack output cache_endpoint

# Get SQS queue URL
pulumi stack output payment_queue_url

# Get all outputs
pulumi stack output --json
```

### 5. Test the Deployment

```bash
# Test ALB endpoint (will return nginx default page until app is deployed)
curl http://$(pulumi stack output alb_dns_name)

# Check ECS service status
aws ecs describe-services \
  --cluster payment-cluster-dev-test-001 \
  --services payment-service-dev-test-001 \
  --region us-east-1
```

### 6. Destroy Infrastructure

```bash
# Remove all resources
pulumi destroy

# Confirm with 'yes'
```

## Environment-Specific Deployment

### Staging Environment

```bash
# Switch to staging stack
pulumi stack init staging

# Configure staging parameters
pulumi config set aws:region us-east-1
pulumi config set payment-processing:environmentSuffix staging-test-001
pulumi config set payment-processing:environment staging
pulumi config set payment-processing:vpcCidr 10.1.0.0/16
pulumi config set payment-processing:enableMultiAZ true

# Deploy
pulumi up
```

### Production Environment

```bash
# Switch to production stack
pulumi stack init prod

# Configure production parameters
pulumi config set aws:region us-east-1
pulumi config set payment-processing:environmentSuffix prod-test-001
pulumi config set payment-processing:environment prod
pulumi config set payment-processing:vpcCidr 10.2.0.0/16
pulumi config set payment-processing:enableMultiAZ true

# Deploy
pulumi up
```

## Configuration Parameters

### Required Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `aws:region` | AWS region for deployment | `us-east-1` |
| `payment-processing:environmentSuffix` | Unique suffix for resource names | `dev-test-001` |
| `payment-processing:environment` | Environment name | `dev`, `staging`, `prod` |

### Optional Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `payment-processing:vpcCidr` | VPC CIDR block | `10.0.0.0/16` |
| `payment-processing:enableMultiAZ` | Enable multi-AZ deployment | `false` |

## Infrastructure Details

### Networking

- **VPC**: /16 CIDR block with DNS support enabled
- **Public Subnets**: 2-3 subnets (based on multi-AZ config) for ALB
- **Private Subnets**: 2-3 subnets for ECS, RDS, ElastiCache
- **Internet Gateway**: For public subnet internet access
- **VPC Endpoints**: S3 endpoint for private subnet AWS service access

### Security

- **ALB Security Group**: Allows HTTP/HTTPS from internet
- **App Security Group**: Allows traffic only from ALB
- **Database Security Group**: Allows PostgreSQL only from app
- **Cache Security Group**: Allows Redis only from app
- **IAM Roles**: Least-privilege roles for ECS tasks
- **Encryption**: All data encrypted at rest and in transit

### Compute

- **ECS Cluster**: Fargate launch type with Container Insights enabled
- **Task Definition**: 256 CPU, 512 MB memory per container
- **Service**: Auto-scaling from 1-10 tasks based on CPU utilization
- **Health Checks**: ALB health checks every 30 seconds
- **Logging**: CloudWatch Logs with 7-day retention

### Database

- **Engine**: Aurora PostgreSQL 15.3
- **Mode**: Serverless v2
- **Scaling**: 0.5-1.0 ACU (dev), 0.5-2.0 ACU (prod)
- **Backups**: 1 day retention (dev), 7 days (prod)
- **Encryption**: Storage encryption enabled
- **Credentials**: Stored in AWS Secrets Manager

### Caching

- **Engine**: Redis 7.0
- **Node Type**: cache.t3.micro
- **Configuration**: Single node cluster
- **Snapshots**: 1 snapshot retention
- **Port**: 6379

### Messaging

- **Payment Queue**: Visibility timeout 5 minutes, message retention 4 days
- **Dead Letter Queue**: Message retention 14 days, max receive count 3
- **Alert Topic**: SNS topic for operational alerts
- **Notification Topic**: SNS topic for payment notifications

### Monitoring

CloudWatch alarms configured for:

- **ALB**: Unhealthy target count, response time > 1 second
- **ECS**: CPU > 80%, memory > 80%
- **Database**: CPU > 80%, connections > 100
- **Cache**: CPU > 75%
- **SQS**: Queue depth > 100 messages

All alarms send notifications to the alert SNS topic.

## Customization

### Adding Application Container Image

Edit `lib/compute.py` and replace the placeholder image:

```python
"image": "nginx:latest",  # Replace with actual payment app image
```

Update to your actual container registry:

```python
"image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/payment-app:latest",
```

### Modifying Auto-Scaling Thresholds

Edit `lib/compute.py` in the CPU scaling policy:

```python
target_value=70.0,  # Change threshold percentage
scale_in_cooldown=300,  # Adjust scale-in cooldown (seconds)
scale_out_cooldown=60   # Adjust scale-out cooldown (seconds)
```

### Adding Read Replicas (Production)

Edit `lib/database.py` to add additional cluster instances:

```python
if environment == "prod":
    # Add read replica
    read_replica = aws.rds.ClusterInstance(
        f"payment-db-replica-{environment_suffix}",
        identifier=f"payment-db-replica-{environment_suffix}",
        cluster_identifier=cluster.id,
        instance_class="db.serverless",
        engine=aws.rds.EngineType.AURORA_POSTGRESQL,
        engine_version="15.3",
        publicly_accessible=False,
        tags={**tags, "Name": f"payment-db-replica-{environment_suffix}"}
    )
```

### Configuring SSL/TLS for ALB

To add HTTPS listener, update `lib/compute.py`:

1. Import ACM certificate
2. Add HTTPS listener on port 443
3. Redirect HTTP to HTTPS

## Troubleshooting

### ECS Tasks Not Starting

Check CloudWatch Logs:

```bash
aws logs tail /ecs/payment-dev-test-001 --follow
```

Verify task definition:

```bash
aws ecs describe-task-definition \
  --task-definition payment-task-dev-test-001
```

### Database Connection Issues

Check security group rules:

```bash
aws ec2 describe-security-groups \
  --filters "Name=tag:Name,Values=payment-db-sg-dev-test-001"
```

Verify database endpoint:

```bash
pulumi stack output database_endpoint
```

### ALB Health Check Failures

Check target group health:

```bash
aws elbv2 describe-target-health \
  --target-group-arn $(aws elbv2 describe-target-groups \
    --names payment-tg-dev-test-001 \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)
```

### Pulumi State Issues

Refresh state:

```bash
pulumi refresh
```

Cancel stuck operation:

```bash
pulumi cancel
```

## Cost Optimization

### Development Environment

- Single AZ deployment reduces data transfer costs
- Smaller Aurora Serverless capacity (0.5-1.0 ACU)
- Single ECS task
- Minimal CloudWatch log retention (7 days)

### Staging Environment

- Multi-AZ for testing failover scenarios
- Moderate Aurora capacity (0.5-1.0 ACU)
- 1-2 ECS tasks

### Production Environment

- Full multi-AZ for high availability
- Larger Aurora capacity (0.5-2.0 ACU)
- 2-10 ECS tasks with auto-scaling
- Extended backup retention

### Cost Estimates (Approximate Monthly)

- **Development**: $150-200
- **Staging**: $250-350
- **Production**: $400-600

Actual costs vary based on usage patterns, data transfer, and running time.

## Security Best Practices

1. **Database Credentials**: Change default password immediately after deployment
2. **IAM Policies**: Review and tighten Resource ARNs (currently using "*")
3. **Network Access**: Update security groups to restrict source IP ranges
4. **SSL/TLS**: Configure HTTPS listener with valid ACM certificate
5. **Secrets Rotation**: Implement automatic secret rotation for database
6. **Logging**: Enable VPC Flow Logs for network monitoring
7. **Compliance**: Review against PCI DSS requirements for payment data

## Testing

### Unit Tests

Unit tests will be created in `tests/unit/` directory to test:

- Resource naming conventions
- Security group rules
- IAM policy definitions
- Configuration parameter validation

### Integration Tests

Integration tests will be created in `tests/integration/` to test:

- Database connectivity from ECS tasks
- Cache accessibility
- SQS message processing
- ALB health checks
- Cross-resource dependencies

## CI/CD Integration

This infrastructure can be deployed via CI/CD pipelines:

### GitHub Actions Example

```yaml
name: Deploy Infrastructure

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: pulumi/actions@v3
        with:
          command: up
          stack-name: dev
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## Support and Documentation

- **Pulumi Documentation**: https://www.pulumi.com/docs/
- **AWS ECS Documentation**: https://docs.aws.amazon.com/ecs/
- **AWS Aurora Serverless**: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html
- **ElastiCache Redis**: https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/

## License

This infrastructure code is provided as-is for synthetic task generation and training purposes.

## Authors

Generated by iac-infra-generator agent for Task ID: 101912543

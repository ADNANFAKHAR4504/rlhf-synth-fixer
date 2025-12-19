# Multi-Environment Fraud Detection Infrastructure

Complete Pulumi Python implementation for deploying consistent fraud detection infrastructure across three AWS environments (dev, staging, prod).

## Architecture

This solution implements a multi-environment fraud detection system with:

- **ComponentResource Pattern**: Reusable `FraudDetectionStack` component
- **Multi-Region Deployment**: us-east-1 (prod), us-west-2 (staging), eu-west-1 (dev)
- **Cross-Region Replication**: Aurora read replicas and DynamoDB global tables
- **Environment-Specific Configurations**: Via Pulumi config files
- **Drift Detection**: Automation API script for detecting configuration drift

## Components

### Networking
- VPC with public/private subnets across 3 availability zones
- NAT Gateways for high availability
- Security groups for ALB, ECS, and Aurora
- VPC peering for cross-region replication

### Compute
- ECS Fargate clusters for containerized services
- Application Load Balancers with health checks
- Auto-scaling policies based on CPU utilization
- CloudWatch Logs for container logging

### Database
- Aurora PostgreSQL clusters with encryption at rest
- Cross-region read replicas (prod to staging/dev)
- DynamoDB tables with global replication
- Point-in-time recovery enabled

### Security
- Environment-specific IAM roles
  - Dev: Read-only access
  - Staging: Limited write access
  - Prod: Full access with audit logging
- Encryption at rest and in transit
- VPC security groups with least privilege

### Monitoring
- CloudWatch dashboards with cross-environment metrics
- CloudWatch alarms for CPU, errors, and latency
- SNS topics for environment-specific alerting
- Environment-specific alert thresholds

## Prerequisites

- Python 3.9 or higher
- Pulumi CLI 3.x
- AWS CLI configured with credentials
- Docker for container images

## Installation

1. Install Python dependencies:
```bash
cd lib
pip install -r requirements.txt
```

2. Configure Pulumi backend:
```bash
pulumi login
```

3. Set AWS credentials:
```bash
aws configure
```

## Deployment

### Deploy Development Environment

```bash
pulumi stack select dev
pulumi config set environmentSuffix dev001
pulumi config set containerImage myregistry/fraud-detection:dev
pulumi config set --secret dbPassword "YourSecurePassword"
pulumi up
```

### Deploy Staging Environment

```bash
pulumi stack select staging
pulumi config set environmentSuffix stg001
pulumi config set containerImage myregistry/fraud-detection:staging
pulumi config set --secret dbPassword "YourSecurePassword"
pulumi up
```

### Deploy Production Environment

```bash
pulumi stack select prod
pulumi config set environmentSuffix prd001
pulumi config set containerImage myregistry/fraud-detection:prod
pulumi config set --secret dbPassword "YourSecurePassword"
pulumi up
```

## Configuration Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `environmentSuffix` | Unique suffix for resource names | Required |
| `region` | AWS region | us-east-1 |
| `azCount` | Number of availability zones | 3 |
| `containerImage` | Docker image for fraud detection | Required |
| `ecsCpu` | CPU units for ECS tasks | 256 |
| `ecsMemory` | Memory (MB) for ECS tasks | 512 |
| `desiredCount` | Desired number of ECS tasks | 2 |
| `auroraInstanceClass` | RDS instance class | db.t4g.medium |
| `enableGlobalTable` | Enable DynamoDB global tables | false |
| `iamMode` | IAM permission mode | read-only |
| `alertEmail` | Email for alerts | devops@example.com |

## Drift Detection

Check for configuration drift:

```bash
# Check all environments
python lib/drift_detector.py --project fraud-detection-infrastructure

# Check specific environment
python lib/drift_detector.py --project fraud-detection-infrastructure --stack prod

# Save report to file
python lib/drift_detector.py --project fraud-detection-infrastructure --output drift-report.json
```

## Stack Outputs

Each stack exports:
- `vpc_id` - VPC ID
- `ecs_cluster_arn` - ECS cluster ARN
- `alb_dns_name` - ALB DNS name
- `aurora_endpoint` - Aurora writer endpoint
- `dynamodb_table_name` - DynamoDB table name
- `sns_topic_arn` - SNS topic ARN
- `dashboard_name` - CloudWatch dashboard name

## Cross-Stack References

Staging and dev can reference production:

```python
prod_stack_ref = pulumi.StackReference("turinggpt/fraud-detection-infrastructure/prod")
prod_aurora_endpoint = prod_stack_ref.get_output("aurora_endpoint")
```

## Resource Naming Convention

Pattern: `{environment}-{region}-{resource-type}-{environmentSuffix}`

Examples:
- `prod-us-east-1-ecs-cluster-prd001`
- `staging-us-west-2-aurora-stg001`
- `dev-eu-west-1-fraud-rules-dev001`

## Tagging Strategy

All resources tagged with:
- `Environment`: dev, staging, or prod
- `Owner`: Team responsible
- `CostCenter`: For billing allocation
- `ManagedBy`: Pulumi
- `Project`: FraudDetection

## Testing

Run unit tests:
```bash
cd lib
python -m pytest tests/unit/ -v
```

Run integration tests:
```bash
python -m pytest tests/integration/ -v
```

## Cleanup

Destroy resources:

```bash
pulumi stack select dev
pulumi destroy

pulumi stack select staging
pulumi destroy

pulumi stack select prod
pulumi destroy
```

## Troubleshooting

### Stack fails to initialize
**Solution**: Ensure Pulumi backend configured and valid AWS credentials.

### Aurora cluster creation fails
**Solution**: Check VPC subnet configuration, need at least 2 subnets in different AZs.

### ECS tasks fail to start
**Solution**: Verify container image accessible and IAM roles have correct permissions.

### Cross-region replication not working
**Solution**: Ensure VPC peering established and security groups allow traffic.

## Security Best Practices

1. Use secrets for sensitive data (database passwords)
2. Enable encryption at rest and in transit
3. Use VPC security groups with least privilege
4. Enable CloudTrail for audit logging
5. Regularly rotate credentials
6. Enable MFA for production deployments

## Cost Optimization

- Use Aurora Serverless v2 for variable workloads
- Use DynamoDB on-demand pricing for unpredictable traffic
- Configure auto-scaling for ECS services
- Use single NAT Gateway per AZ in dev/staging
- Enable CloudWatch Logs retention policies

## Support

For issues or questions:
- Pulumi docs: https://www.pulumi.com/docs/
- Review AWS service limits
- Contact DevOps team: devops@example.com

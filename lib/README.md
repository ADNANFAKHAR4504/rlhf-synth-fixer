# Loan Processing Infrastructure

This Pulumi Python project deploys a secure, compliant infrastructure for loan processing applications in AWS eu-west-2.

## Architecture

- **Network**: Multi-AZ VPC with 3 availability zones, public/private subnets
- **Compute**: ECS Fargate cluster with auto-scaling (CPU and memory-based)
- **Database**: RDS Aurora MySQL Serverless v2 with IAM authentication
- **Load Balancing**: Application Load Balancer with HTTPS support
- **Storage**: S3 bucket for ALB logs with lifecycle policies
- **Security**: Customer-managed KMS keys, security groups, IAM least-privilege
- **Monitoring**: CloudWatch logs with 365-day retention

## Prerequisites

- Pulumi CLI 3.x
- Python 3.8+
- AWS CLI configured with appropriate credentials
- AWS account with permissions for VPC, ECS, RDS, ALB, S3, IAM, KMS

## Deployment

```bash
# Install Python dependencies
pip install -r requirements.txt

# Configure environment suffix
pulumi config set environment_suffix <your-suffix>

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# Get outputs
pulumi stack output
```

## Configuration

Required configuration:
- `environment_suffix`: Unique suffix for resource names (required for parallel deployments)

Optional configuration:
- `aws:region`: AWS region (default: eu-west-2)

## Outputs

- `vpc_id`: VPC identifier
- `alb_dns_name`: Load balancer DNS name
- `ecs_cluster_name`: ECS cluster name
- `db_endpoint`: RDS cluster endpoint
- `log_bucket_name`: S3 bucket for ALB logs

## Compliance

- **Data Residency**: All resources in eu-west-2
- **Encryption**: KMS-encrypted RDS, S3 with versioning
- **Logging**: 365-day CloudWatch retention, ALB access logs
- **Network Isolation**: Private subnets for compute/database
- **Authentication**: IAM-based RDS authentication

## Cost Optimization

- Aurora Serverless v2 (auto-scaling 0.5-4 ACU)
- Single NAT Gateway (not per-AZ)
- S3 lifecycle to Glacier after 90 days

## Security

- Least-privilege IAM roles
- Security groups with minimal access
- No public database access
- Encrypted storage and transit
- Required tags on all resources

## Cleanup

```bash
pulumi destroy
```

All resources are configured to be fully destroyable without manual intervention.

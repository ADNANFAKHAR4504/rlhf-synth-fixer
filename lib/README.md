# Multi-Region Infrastructure Deployment

CDKTF Python implementation for deploying identical infrastructure across three AWS regions with workspace-based environment management.

## Architecture

This solution deploys:
- VPC: Per-region VPCs with non-overlapping CIDR blocks
- RDS Aurora MySQL: Multi-AZ clusters with automated backups
- Lambda: Regional data processors with S3 integration
- API Gateway: HTTP APIs with Lambda integration
- DynamoDB: Global tables for session management
- S3: Regional buckets with KMS encryption
- CloudWatch: Monitoring and alerting

## Regions

- us-east-1: 10.0.0.0/16
- us-east-2: 10.1.0.0/16
- eu-west-1: 10.2.0.0/16

## Workspaces

- dev: Development environment
- staging: Staging environment
- prod: Production environment

## Prerequisites

- Python 3.11+
- pipenv
- AWS CLI configured
- Terraform 1.5+
- CDKTF CLI

## Installation

```bash
# Install dependencies
pipenv install --dev

# Activate virtual environment
pipenv shell

# Install CDKTF providers
cdktf get
```

## Deployment

### Initialize Workspace

```bash
# Create workspace
terraform workspace new dev

# Select workspace
terraform workspace select dev
```

### Deploy to All Regions

```bash
# Synthesize CDKTF to Terraform
cdktf synth

# Deploy all stacks
cdktf deploy --all

# Or deploy specific region
cdktf deploy tap-stack-us-east-1
```

### Workspace-Based Deployment

```bash
# Deploy dev environment
terraform workspace select dev
cdktf deploy --all

# Deploy staging environment
terraform workspace select staging
cdktf deploy --all

# Deploy production environment
terraform workspace select prod
cdktf deploy --all
```

## Validation

The implementation includes:

1. CIDR Overlap Prevention: Validates non-overlapping CIDR blocks
2. Required Tags: Ensures Environment, Region, CostCenter tags
3. Encryption: KMS encryption for S3, RDS, DynamoDB
4. IAM Least Privilege: Scoped policies for Lambda
5. CloudWatch Monitoring: Drift detection and alerting

## Testing

```bash
# Run Python tests
pytest tests/

# Validate Terraform
terraform validate

# Plan deployment
cdktf diff
```

## State Management

State is stored in S3 with DynamoDB locking:

```
s3://terraform-state-{workspace}-{region}/infrastructure/{region}/terraform.tfstate
```

## Outputs

Each regional stack outputs:
- VPC ID
- S3 bucket name
- Lambda function ARN
- RDS cluster endpoint
- DynamoDB table name
- API Gateway endpoint
- KMS key ID

## Cross-Region Replication

RDS read replicas and DynamoDB global tables provide cross-region data replication for disaster recovery and low-latency access.

## Cleanup

```bash
# Destroy all stacks
cdktf destroy --all

# Or destroy specific region
cdktf destroy tap-stack-us-east-1
```

## Security

- All data encrypted at rest using KMS
- All data encrypted in transit using TLS
- IAM roles follow least privilege principle
- Security groups restrict access
- CloudWatch logs enabled for audit

## Cost Optimization

- Use serverless services where possible
- RDS Aurora Serverless for variable workloads
- Lambda for event-driven processing
- DynamoDB on-demand billing
- S3 lifecycle policies for cost management

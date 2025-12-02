# FastShop Secure Data Pipeline Infrastructure

This Pulumi Python project creates a secure, LGPD-compliant data pipeline infrastructure for FastShop's real-time transaction processing and fraud detection system.

## Architecture

The infrastructure includes:

- **VPC**: Multi-AZ VPC with public and private subnets (10.0.0.0/16)
- **KMS**: Customer managed encryption key with automatic rotation
- **Kinesis Data Stream**: Real-time transaction ingestion with KMS encryption
- **RDS PostgreSQL**: Database for processed transactions in private subnet
- **ElastiCache Redis**: Caching layer with automatic failover and 2 nodes
- **Security Groups**: Network isolation for database and cache

## Prerequisites

- Python 3.8+
- Pulumi CLI
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create VPC, KMS, Kinesis, RDS, and ElastiCache resources

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
export ENVIRONMENT_SUFFIX="dev"  # or your preferred suffix
export AWS_REGION="us-east-1"
```

## Deployment

1. Initialize Pulumi stack:
```bash
pulumi stack init dev
```

2. Configure AWS region:
```bash
pulumi config set aws:region us-east-1
```

3. Deploy the infrastructure:
```bash
pulumi up
```

4. Review the changes and confirm when ready.

## Outputs

After deployment, the following outputs are available:

- `vpc_id`: VPC identifier
- `kinesis_stream_name`: Kinesis Data Stream name
- `kinesis_stream_arn`: Kinesis Data Stream ARN
- `rds_endpoint`: RDS PostgreSQL endpoint
- `rds_arn`: RDS instance ARN
- `redis_endpoint`: ElastiCache Redis endpoint
- `redis_port`: ElastiCache Redis port
- `kms_key_id`: KMS key ID for encryption

## Security Features

### LGPD Compliance

- All data at rest encrypted using AWS KMS customer managed keys
- RDS instance isolated in private subnet with no public access
- Security groups configured with least privilege access
- Encryption in transit for ElastiCache Redis
- Audit logging enabled for data access

### Network Security

- RDS and ElastiCache deployed in private subnets
- Security groups allow access only from within VPC
- NAT Gateway for private subnet internet access
- No public endpoints for sensitive resources

## Testing

Run unit tests:
```bash
python -m pytest tests/unit/ -v
```

Run integration tests (requires deployed infrastructure):
```bash
python -m pytest tests/integration/ -v
```

## Cleanup

To destroy all resources:
```bash
pulumi destroy
```

Confirm the destruction when prompted. All resources will be removed, including:
- ElastiCache Redis cluster
- RDS PostgreSQL instance (no final snapshot)
- Kinesis Data Stream
- KMS key (7-day deletion window)
- VPC and all networking components

## Cost Optimization

The infrastructure is optimized for cost while maintaining functionality:

- RDS: `db.t3.micro` instance (single AZ for testing)
- ElastiCache: `cache.t3.micro` nodes
- Kinesis: 1 shard (can scale based on throughput)
- Single NAT Gateway (not per AZ)

Estimated monthly cost: ~$50-70 USD for testing environment.

## Notes

- Default credentials are placeholders. Use AWS Secrets Manager for production.
- Automatic failover requires at least 2 ElastiCache nodes.
- RDS backup retention set to 1 day for testing.
- KMS key deletion window is 7 days (minimum).

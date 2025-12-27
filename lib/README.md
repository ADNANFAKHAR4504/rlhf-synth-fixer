# JapanCart Transaction Monitoring System

Real-time transaction monitoring infrastructure for JapanCart e-commerce platform, built with Pulumi and Python.

## Architecture

The system consists of:

- **Kinesis Data Stream**: Ingests ~1000 transactions per minute
- **ElastiCache Redis**: Caches 24-hour transaction history with automatic expiration
- **RDS PostgreSQL**: Stores permanent transaction records with Multi-AZ
- **Secrets Manager**: Securely manages database credentials
- **VPC**: Network isolation with public and private subnets
- **CloudWatch**: Comprehensive monitoring and alerting

## Components

### VPC Stack (`vpc_stack.py`)
- VPC with DNS support
- Internet Gateway
- Public and private subnets across 2 AZs
- Route tables for network routing

### Kinesis Stack (`kinesis_stack.py`)
- Data Stream with 1 shard (sufficient for 17 tx/sec)
- 24-hour retention period
- KMS encryption at rest
- Enhanced shard-level metrics

### Secrets Stack (`secrets_stack.py`)
- Random password generation
- Secrets Manager secret for RDS credentials
- Encrypted storage

### ElastiCache Stack (`elasticache_stack.py`)
- Redis replication group with Multi-AZ
- 2 nodes (1 primary + 1 replica)
- Encryption at rest and in transit
- Security group with VPC-only access

### RDS Stack (`rds_stack.py`)
- PostgreSQL 15.4 instance
- Multi-AZ deployment
- 7-day backup retention
- Enhanced monitoring
- Encryption at rest
- Security group with VPC-only access

### Monitoring Stack (`monitoring_stack.py`)
- Kinesis iterator age and throughput alarms
- Redis CPU and memory alarms
- RDS CPU, storage, and connection alarms

## Deployment

### Prerequisites

```bash
# Install Pulumi CLI
curl -fsSL https://get.pulumi.com | sh

# Install Python dependencies
pip install -r requirements.txt
```

### Configuration

```bash
# Set AWS region
pulumi config set aws:region us-east-1

# Set environment suffix for resource naming
pulumi config set environmentSuffix dev
```

### Deploy

```bash
# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# View outputs
pulumi stack output
```

### Outputs

After deployment, the following outputs are available:

- `vpc_id`: VPC identifier
- `kinesis_stream_name`: Name of the Kinesis stream
- `kinesis_stream_arn`: ARN of the Kinesis stream
- `redis_endpoint`: Redis cluster endpoint
- `redis_port`: Redis port (6379)
- `rds_endpoint`: RDS instance endpoint
- `rds_port`: PostgreSQL port (5432)
- `db_secret_arn`: ARN of the database credentials secret
- `elasticache_security_group_id`: Redis security group ID
- `rds_security_group_id`: RDS security group ID

## Testing

### Unit Tests

```bash
# Run all tests
pytest test/ -v

# Run with coverage
pytest test/ --cov=lib --cov-report=html
```

### Integration Tests

```bash
# Run integration tests
pytest tests/integration/ -v
```

## Cleanup

```bash
# Destroy all infrastructure
pulumi destroy

# Remove stack
pulumi stack rm dev
```

## Security

- All data stores use encryption at rest
- Redis uses encryption in transit
- Database credentials stored in Secrets Manager
- Security groups follow least privilege principle
- IAM roles use minimum required permissions
- VPC isolation with private subnets for data stores

## Cost Optimization

- Small instance types (t3.micro) for cost efficiency
- No NAT Gateways (using VPC endpoints where needed)
- Minimal shard count for Kinesis
- Short backup retention (7 days)
- Serverless-friendly architecture

## Monitoring

CloudWatch alarms are configured for:

- Kinesis iterator age and write throughput
- Redis CPU and memory utilization
- RDS CPU, storage, and connections

Set up SNS topics to receive alarm notifications.

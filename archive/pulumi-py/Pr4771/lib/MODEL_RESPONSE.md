# Industrial IoT Data Processing Infrastructure - Implementation

This document contains the complete Pulumi Python implementation for a secure industrial IoT data processing infrastructure deployed in sa-east-1 region.

## Architecture Overview

The infrastructure includes:
- VPC with Multi-AZ Networking across 2 availability zones
- Amazon Kinesis Data Streams for real-time sensor data ingestion with KMS encryption
- RDS Aurora Serverless v2 for persistent data storage with 30-day backup retention
- ElastiCache Redis for real-time data processing and caching
- AWS Secrets Manager for secure credential storage
- AWS KMS encryption keys for all services
- Security Groups for network access control with least privilege

## Implementation

All code is in `/Users/mayanksethi/Projects/turing/iac-test-automations/worktree/synth-5344690492/lib/tap_stack.py`

The implementation includes:

### 1. KMS Keys for Encryption
- Separate KMS keys for Kinesis, RDS, and Secrets Manager
- Automatic key rotation enabled for all keys
- 7-day deletion window for recovery

### 2. VPC and Networking
- VPC with 10.0.0.0/16 CIDR block
- 2 public subnets (10.0.1.0/24, 10.0.2.0/24) across 2 AZs
- 2 private subnets (10.0.11.0/24, 10.0.12.0/24) across 2 AZs
- Internet Gateway for public subnet connectivity
- Route tables for public and private subnet routing
- No NAT Gateway (cost optimization)

### 3. Security Groups
- RDS security group allowing PostgreSQL (5432) from VPC CIDR only
- ElastiCache security group allowing Redis (6379) from VPC CIDR only
- No overly broad rules (0.0.0.0/0 only for egress)

### 4. Kinesis Data Stream
- Stream name: `sensor-data-stream-{environment_suffix}`
- 2 shards for data ingestion
- 24-hour data retention
- KMS encryption enabled
- Shard-level metrics for monitoring

### 5. AWS Secrets Manager
- Secret name: `db-master-password-{environment_suffix}`
- Contains database credentials (username, password, engine, host, port, dbname)
- Encrypted with dedicated KMS key
- Random password generation (32 characters)

### 6. RDS Aurora Serverless v2
- Cluster identifier: `aurora-cluster-{environment_suffix}`
- Engine: aurora-postgresql 15.4
- Serverless v2 with 0.5-2.0 ACU scaling
- 30-day backup retention (compliance requirement)
- KMS encryption enabled
- Deployed in private subnets
- skip_final_snapshot=True for destroyability

### 7. ElastiCache Redis
- Replication group ID: `redis-{environment_suffix}`
- Engine: Redis 7.0
- 2 cache clusters for high availability
- cache.t3.micro node type
- Encryption at rest and in transit enabled
- Automatic failover enabled
- 5-day snapshot retention
- Deployed in private subnets

### 8. CloudWatch Log Groups
- Kinesis log group: `/aws/kinesis/sensor-data-stream-{environment_suffix}`
- RDS log group: `/aws/rds/cluster/aurora-cluster-{environment_suffix}`
- 7-day log retention for cost optimization

### 9. Outputs
All resources export their identifiers for integration:
- VPC ID, CIDR, subnet IDs
- Kinesis stream name and ARN
- Aurora cluster endpoints (write and read)
- Redis endpoints (primary and reader)
- Secrets Manager ARN
- KMS key IDs
- Security group IDs

## Key Design Decisions

### 1. Aurora Serverless v2
Chosen for faster provisioning and cost optimization. Auto-scales between 0.5 and 2 ACUs based on workload.

### 2. Encryption Strategy
Separate KMS keys for each service enables granular access control and independent key rotation policies.

### 3. Network Security
- Private subnets for data stores (no internet access)
- Public subnets for potential future bastion hosts
- Security groups restrict access to VPC CIDR only
- No NAT Gateway to reduce costs

### 4. Backup and Compliance
- 30-day RDS backup retention meets compliance requirement
- Redis snapshots for data recovery
- All resources are destroyable for testing

### 5. High Availability
- Multi-AZ deployment for Aurora
- Redis with automatic failover
- Subnets across 2 availability zones

## Security Features

1. **Encryption at Rest**: KMS encryption for Kinesis, RDS, Redis, and Secrets Manager
2. **Encryption in Transit**: Redis transit encryption enabled
3. **Least Privilege**: Security groups allow only required ports from VPC CIDR
4. **Credential Management**: Database credentials in Secrets Manager with KMS encryption

## Integration Tests

Comprehensive integration tests in `/Users/mayanksethi/Projects/turing/iac-test-automations/worktree/synth-5344690492/tests/integration/test_tap_stack.py` verify:

- VPC and networking components
- Security group rules
- KMS key configuration and rotation
- Kinesis stream encryption and data ingestion
- RDS Aurora encryption, backup retention, and endpoints
- ElastiCache Redis encryption and high availability
- Secrets Manager secret storage and encryption
- Resource naming with environment_suffix
- Resource tagging

## Deployment

```bash
# Deploy infrastructure
pulumi up

# Destroy infrastructure
pulumi destroy
```

Region: sa-east-1 (South America - Sao Paulo)
Platform: Pulumi with Python
All resources include environment_suffix for uniqueness

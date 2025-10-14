# HIPAA-Compliant Healthcare Data Processing API - Implementation

This implementation provides a production-ready HIPAA-compliant healthcare data processing system using CDKTF with TypeScript, featuring Multi-AZ deployment, encryption at rest and in transit, and comprehensive audit logging.

## Implementation Summary

The infrastructure creates a secure healthcare API with:
- API Gateway HTTP API with rate limiting
- Lambda function for patient record processing
- RDS Aurora Serverless v2 PostgreSQL (Multi-AZ)
- ElastiCache Redis replication group (Multi-AZ)
- KMS encryption for all data stores
- Secrets Manager for credential management
- CloudWatch Logs for HIPAA audit compliance
- VPC with public and private subnets across 2 AZs

## Files Generated

### lib/healthcare-stack.ts
Contains the complete healthcare infrastructure stack with all AWS resources properly configured for HIPAA compliance, high availability, and failure recovery.

Key components:
- VPC with Internet Gateway, 2 public subnets, 2 private subnets, route tables
- Security groups with least-privilege access rules
- KMS key with automatic rotation for encryption
- RDS Aurora Serverless v2 cluster with 2 instances in different AZs
- ElastiCache Redis replication group with 2 nodes and automatic failover
- Secrets Manager for database credentials
- Lambda function with VPC configuration and IAM role
- API Gateway HTTP API with logging and throttling
- CloudWatch Log Group with 90-day retention

### lib/tap-stack.ts
Entry point that instantiates the HealthcareStack construct with proper configuration from environment variables.

## HIPAA Compliance Features

**Encryption at Rest**: KMS encryption enabled for RDS, ElastiCache, Secrets Manager, and CloudWatch Logs

**Encryption in Transit**: TLS for ElastiCache, HTTPS for API Gateway

**Audit Logging**: CloudWatch Logs captures all API access with 90-day retention, RDS exports PostgreSQL logs

**Access Controls**: Security groups restrict access to authorized sources only, IAM policies follow least-privilege principle

**Credential Management**: Secrets Manager stores database credentials encrypted with KMS

## High Availability and Failure Recovery

**Multi-AZ**: RDS cluster spans 2 AZs with 2 instances, ElastiCache replication group spans 2 AZs with 2 nodes

**Automated Backups**: RDS daily backups (7-day retention), ElastiCache snapshots (5-day retention)

**Automatic Failover**: Both RDS and ElastiCache configured for automatic failover

**Rate Limiting**: API Gateway throttling (50 req/sec, 100 burst) prevents overload

**Auto-Scaling**: Aurora Serverless v2 scales 0.5-1 ACU based on demand

## Security Configuration

**Network Isolation**: RDS and ElastiCache in private subnets with no internet access

**Security Groups**: Port-specific rules allowing only necessary traffic

**KMS Key Rotation**: Annual automatic rotation enabled

**IAM Least Privilege**: Lambda has specific permissions for Secrets Manager and KMS only

## Cost Optimization

**Aurora Serverless v2**: Auto-scales from 0.5 to 1 ACU, pay only for capacity used

**Right-Sized Resources**: ElastiCache t4g.micro, Lambda 512MB memory

**Lifecycle Policies**: CloudWatch Logs 90-day retention with automatic deletion

## Resource Naming Convention

All resources include `environmentSuffix` parameter in their names to support multiple isolated deployments:
- Format: `{resource-type}-{environmentSuffix}`
- Examples: `healthcare-vpc-synth2857171312`, `healthcare-db-synth2857171312`

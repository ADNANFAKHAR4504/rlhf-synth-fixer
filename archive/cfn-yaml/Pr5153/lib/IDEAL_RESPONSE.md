# FedRAMP-Compliant API Infrastructure - Ideal Implementation

This is the ideal, production-ready implementation of the FedRAMP Moderate-compliant API infrastructure using CloudFormation YAML. The solution demonstrates best practices for security, high availability, monitoring, and compliance.

## Architecture Overview

The infrastructure implements a complete FedRAMP-compliant API gateway system with:
- API Gateway REST API with TLS 1.2+ encryption
- ElastiCache Redis for distributed caching with 1-hour TTL
- Kinesis Data Streams for audit logging
- SecretsManager for API keys management
- KMS encryption for all data at rest
- Multi-AZ deployment for high availability
- CloudWatch monitoring and alarms

## File: lib/TapStack.yml

The complete CloudFormation template has been generated in `lib/TapStack.yml` with 23 AWS resources implementing:

### Core Infrastructure Components

1. **VPC and Networking (3 resources)**
   - VPC with DNS support
   - Two private subnets across multiple AZs
   - Security groups for ElastiCache and API Gateway

2. **Encryption (2 resources)**
   - KMS key with automatic rotation
   - KMS key alias for easy reference

3. **Caching Layer (3 resources)**
   - ElastiCache subnet group
   - Security group for Redis
   - Redis replication group with Multi-AZ and encryption

4. **Audit Logging (1 resource)**
   - Kinesis Data Stream with KMS encryption

5. **Secrets Management (1 resource)**
   - SecretsManager secret with KMS encryption

6. **API Gateway (10 resources)**
   - REST API with regional endpoint
   - API resource and method
   - Deployment and stage with caching
   - Usage plan with throttling
   - API key
   - CloudWatch log group
   - IAM role for logging

7. **Monitoring (2 resources)**
   - CloudWatch alarm for throttling
   - CloudWatch alarm for cache hit rate

### Security Implementation (FedRAMP Moderate)

**Encryption at Rest:**
- KMS encryption enabled for ElastiCache Redis
- KMS encryption enabled for Kinesis Data Streams
- KMS encryption enabled for Secrets Manager
- KMS encryption enabled for CloudWatch Logs
- Automatic key rotation enabled

**Encryption in Transit:**
- TLS 1.2+ enforced on API Gateway (regional endpoint default)
- Transit encryption enabled for Redis cluster
- HTTPS-only API endpoints

**Network Security:**
- VPC isolation for ElastiCache
- Security groups with least privilege rules
- Private subnets for data layer
- No public access to cache layer

**Access Control:**
- IAM authentication for API Gateway
- API key requirement for all endpoints
- Usage plans for throttling enforcement

### Caching Configuration

- Cache TTL: 3600 seconds (1 hour) as required
- API Gateway cache cluster size: 0.5 GB
- Cache encryption enabled at API Gateway level
- ElastiCache Redis with encryption at rest and in transit
- Multi-AZ deployment for cache high availability

### Throttling Configuration

- Burst limit: 1000 requests (meets requirement)
- Rate limit: 1000 requests per minute (meets requirement)
- Enforced at both stage and usage plan levels
- CloudWatch alarm for throttling events

### Audit and Compliance

- Kinesis Data Streams captures API request logs
- 168-hour (7-day) retention for audit logs
- CloudWatch Logs with 90-day retention
- KMS encryption for all audit data
- X-Ray tracing enabled for request tracking

### High Availability

- Multi-AZ Redis with automatic failover
- Two availability zones for redundancy
- Regional API Gateway endpoint
- Automatic backups with 5-day retention

### Resource Naming Convention

All resources use the `EnvironmentSuffix` parameter following the pattern:
```
{resource-type}-{environment-suffix}
```

Examples:
- `fedramp-vpc-${EnvironmentSuffix}`
- `redis-cluster-${EnvironmentSuffix}`
- `audit-log-stream-${EnvironmentSuffix}`
- `fedramp-api-key-${EnvironmentSuffix}`

## Deployment

Deploy to eu-west-2 region:

```bash
aws cloudformation create-stack \
  --stack-name fedramp-api-infrastructure \
  --template-body file://lib/TapStack.yml \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=prod123 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region eu-west-2
```

## Outputs

The template provides 15 outputs:
- VPC and subnet IDs
- Redis endpoint and port
- Kinesis stream name and ARN
- Secrets Manager ARN
- KMS key ID and ARN
- API Gateway REST API ID
- API Gateway endpoint URL
- API key ID
- Usage plan ID
- CloudWatch log group name

## Compliance Verification Checklist

- [x] All data encrypted at rest using KMS
- [x] All data encrypted in transit using TLS 1.2+
- [x] Request throttling enforced at 1000 requests/minute
- [x] Cache TTL set to 1 hour (3600 seconds)
- [x] Audit logs captured in Kinesis Data Streams
- [x] Multi-AZ high availability enabled
- [x] Resources deployed in eu-west-2 region
- [x] All resources include EnvironmentSuffix parameter
- [x] No Retain deletion policies (all resources destroyable)
- [x] Security groups follow least privilege
- [x] IAM roles follow least privilege
- [x] CloudWatch monitoring and alarms configured

## Key Features

1. **FedRAMP Moderate Compliance**: All security controls implemented
2. **High Availability**: Multi-AZ deployment across two availability zones
3. **Encryption Everywhere**: KMS encryption for all data at rest and TLS 1.2+ for transit
4. **Comprehensive Monitoring**: CloudWatch logs, metrics, and alarms
5. **Proper Throttling**: 1000 requests per minute limit enforced
6. **Audit Trail**: Complete request logging via Kinesis
7. **Secure Secrets**: SecretsManager with KMS encryption
8. **Flexible Configuration**: Parameters for customization
9. **Production Ready**: All AWS best practices implemented
10. **Destroyable**: No retention policies preventing cleanup
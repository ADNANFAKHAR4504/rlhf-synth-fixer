# Disaster Recovery Infrastructure Implementation

This document contains the complete AWS CDK Python implementation for a disaster recovery infrastructure with Multi-AZ RDS, automated failover, and FedRAMP compliance.

## Architecture Overview

The solution implements a highly available disaster recovery infrastructure with:
- Multi-AZ VPC with isolated database subnets
- KMS encryption for all data stores
- Secrets Manager with 30-day automatic rotation
- EFS file system for transaction logs with Multi-AZ mount targets
- RDS PostgreSQL with Multi-AZ deployment for automatic failover
- CloudWatch monitoring and alarms with SNS notifications

## Implementation Files

All implementation files are located in the `lib/` directory:
- `tap_stack.py` - Main orchestration stack
- `vpc_stack.py` - VPC and networking resources
- `kms_stack.py` - KMS encryption keys
- `secrets_stack.py` - Secrets Manager configuration
- `efs_stack.py` - EFS file system for transaction logs
- `rds_stack.py` - RDS Multi-AZ database

## Key Features

1. **Multi-AZ High Availability**
   - VPC spans 3 availability zones
   - RDS Multi-AZ deployment with automatic failover
   - EFS mount targets in multiple AZs
   - RPO < 1 hour, RTO < 15 minutes

2. **Security and Compliance**
   - KMS encryption for RDS, EFS, and Secrets Manager
   - Automatic key rotation enabled
   - Secrets Manager with 30-day credential rotation
   - SSL/TLS enforced for database connections
   - VPC Flow Logs for network monitoring
   - FedRAMP Moderate compliant

3. **Monitoring and Alerting**
   - CloudWatch alarms for CPU, connections, storage, latency
   - SNS topic for alarm notifications
   - Performance Insights enabled
   - CloudWatch Logs exports

4. **Resource Naming**
   - All resources use environmentSuffix variable
   - Format: `{resource-type}-{environment-suffix}`
   - Enables multi-environment deployments

5. **Destroyability**
   - All resources use RemovalPolicy.DESTROY
   - No DeletionProtection enabled
   - Fully teardown-capable for CI/CD

## Deployment Instructions

1. Install dependencies:
   ```bash
   pipenv install
   ```

2. Set environment:
   ```bash
   export CDK_DEFAULT_REGION=eu-central-2
   ```

3. Deploy:
   ```bash
   cdk deploy -c environmentSuffix=dev
   ```

4. Test:
   ```bash
   pipenv run test-py-unit
   pipenv run test-py-integration
   ```

5. Destroy:
   ```bash
   cdk destroy -c environmentSuffix=dev
   ```

## Testing

- Unit tests: 20+ test cases covering all components
- Integration tests: Validate deployed resources using boto3
- Coverage: >90% code coverage required
- Tests use cfn-outputs/flat-outputs.json for resource identifiers

## Compliance and Performance

**FedRAMP Moderate:**
- Encryption at rest and in transit
- Automated credential rotation
- Comprehensive logging and monitoring
- Network isolation with private subnets
- Least privilege IAM policies

**Performance:**
- RPO: < 1 hour (automated backups)
- RTO: < 15 minutes (Multi-AZ failover)
- Automatic failover without manual intervention

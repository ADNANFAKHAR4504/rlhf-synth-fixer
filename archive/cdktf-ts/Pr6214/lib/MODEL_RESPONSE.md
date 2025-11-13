# Multi-Environment Payment Processing Infrastructure - CDKTF Implementation

This implementation creates a comprehensive multi-environment payment processing infrastructure using CDKTF with TypeScript. The solution deploys consistent resources across dev, staging, and production environments with workspace-aware configurations.

## Architecture Overview

- VPC networking with public/private subnets across 2 AZs
- RDS PostgreSQL databases with environment-specific sizing
- S3 buckets with versioning and lifecycle policies
- EC2 instances with security groups
- NAT Gateways and VPC endpoints
- Consistent tagging across all resources

## Implementation Files

The implementation consists of:
1. Main stack orchestrator (lib/tap-stack.ts)
2. VPC networking module (lib/stacks/vpc-stack.ts)
3. RDS database module (lib/stacks/rds-stack.ts)
4. S3 storage module (lib/stacks/s3-stack.ts)
5. EC2 compute module (lib/stacks/ec2-stack.ts)
6. Comprehensive unit tests (test/tap-stack.unit.test.ts)
7. Integration tests (test/tap-stack.int.test.ts)

## Key Features

- Environment-aware configuration (dev, staging, prod)
- Consistent resource naming with environmentSuffix support
- Modular architecture with reusable constructs
- Complete security implementation (encryption, IAM, security groups)
- Full test coverage (25+ unit tests, 6 integration tests)
- Proper tagging strategy (Environment, Application, CostCenter, EnvironmentSuffix)

## Environment-Specific Configurations

### Dev Environment
- VPC CIDR: 10.0.0.0/16
- RDS: db.t3.micro with 1-day backup retention
- EC2: t3.micro
- S3 Lifecycle: 30 days to IA

### Staging Environment
- VPC CIDR: 10.1.0.0/16
- RDS: db.t3.small with 7-day backup retention
- EC2: t3.small
- S3 Lifecycle: 90 days to IA

### Production Environment
- VPC CIDR: 10.2.0.0/16
- RDS: db.r5.large with 30-day backup retention, Multi-AZ enabled
- EC2: t3.medium
- S3 Lifecycle: 365 days to IA

## Security Features

- VPC with public/private subnet isolation
- Security groups with least-privilege rules
- RDS encryption at rest (storage_encrypted)
- S3 server-side encryption (AES256)
- S3 public access blocked
- IAM roles with minimal permissions (SSM, CloudWatch)
- EC2 encrypted EBS volumes
- Database credentials from AWS Secrets Manager

## Networking Architecture

- 2 Availability Zones per environment (ap-southeast-1a, ap-southeast-1b)
- 2 Public subnets + 2 Private subnets
- Internet Gateway for public subnet connectivity
- NAT Gateways (one per AZ) for private subnet outbound
- VPC Endpoint for S3 service access
- Route tables per subnet type

## Resource Naming Pattern

All resources include the environmentSuffix for uniqueness:
- `payment-vpc-{environment}-{environmentSuffix}`
- `payment-db-{environment}-{environmentSuffix}`
- `payment-data-{environment}-{environmentSuffix}`
- `payment-api-{environment}-{environmentSuffix}`

## Deployment Instructions

See lib/README.md for complete deployment instructions.

## Test Coverage

Unit tests cover:
- Stack instantiation for all environments
- VPC CIDR configuration validation
- RDS instance class verification
- EC2 instance type validation
- S3 bucket versioning
- Security group creation
- Encryption enablement
- IAM roles and policies
- Resource tagging
- Stack outputs

Integration tests validate:
- VPC ID output
- RDS endpoint format
- S3 bucket naming
- EC2 instance ID format
- Environment detection
- Environment suffix propagation

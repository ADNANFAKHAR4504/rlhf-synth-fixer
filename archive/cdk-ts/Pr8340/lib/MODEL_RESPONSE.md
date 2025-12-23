# AWS Infrastructure Setup - CDK TypeScript Implementation

This implementation provides a secure, production-ready AWS infrastructure using AWS CDK with TypeScript. The infrastructure follows security best practices and is compatible with both AWS and LocalStack.

## Architecture Overview

The infrastructure consists of:

1. VPC with Multi-AZ Configuration
2. Internet Gateway and NAT Gateways (AWS only)
3. Security Groups for Web, SSH, and RDS access
4. KMS Encryption Key for resource encryption
5. S3 Bucket for application logs (encrypted)
6. IAM Roles following least privilege principle
7. EC2 Launch Template with encrypted EBS volumes
8. RDS MySQL Database in private subnets with encryption
9. Lambda Execution Role for serverless workloads

## Implementation Details

### VPC Configuration

- CIDR: 10.0.0.0/16
- 2 Public Subnets (24-bit mask)
- 2 Private Subnets (24-bit mask)
- Deployed across 2 Availability Zones
- DNS hostname and DNS support enabled
- NAT Gateways: 2 (AWS) / 0 (LocalStack)

### Security Groups

1. Web Security Group: Allows HTTP (80) and HTTPS (443) from anywhere
2. SSH Security Group: Allows SSH (22) from within VPC only
3. RDS Security Group: Allows MySQL (3306) from web security group only

### Encryption

All data at rest is encrypted using a customer-managed KMS key:
- S3 bucket encryption
- RDS database storage encryption
- EBS volume encryption
- Key rotation enabled

### IAM Roles

Two IAM roles with least privilege access:

1. EC2 Role:
   - CloudWatch Agent for monitoring
   - S3 PutObject for logs
   - KMS encrypt/decrypt for bucket access

2. Lambda Role:
   - Basic Lambda execution
   - VPC network interface management

### RDS Database

- Engine: MySQL 8.0
- Instance: t3.micro
- Credentials: Generated secrets (no hardcoded passwords)
- Backup retention: 7 days
- CloudWatch logs enabled: error, general, slowquery
- Auto-scaling storage: 20GB - 100GB

### Clean Destruction

All resources configured with:
- RemovalPolicy.DESTROY
- Auto-delete for S3 objects
- No deletion protection

## LocalStack Compatibility

The implementation detects LocalStack via AWS_ENDPOINT_URL and applies necessary adjustments:

1. NAT Gateways disabled (not supported)
2. Private subnets configured as PUBLIC type
3. Subnet selection adjusted for RDS

## Files Structure

- bin/tap.ts - CDK app entry point with tagging
- lib/tap-stack.ts - Main stack implementation
- test/tap-stack.unit.test.ts - Unit tests
- test/tap-stack.int.test.ts - Integration tests

## Deployment

The infrastructure is ready for deployment using:

```bash
cdk bootstrap
cdk deploy
```

All resources are properly tagged with Environment, Repository, Author, PRNumber, and Team tags for tracking and cost allocation.

# Secure Transaction Processing Infrastructure

This CloudFormation template deploys a PCI-compliant transaction processing infrastructure for credit card transaction analysis.

## Architecture Overview

The infrastructure includes:

- **VPC**: Isolated VPC with 3 private subnets across 3 availability zones (no internet gateway)
- **Lambda**: Transaction processor function (1GB memory, 5-minute timeout) deployed in VPC
- **DynamoDB**: Transaction storage table with on-demand billing and point-in-time recovery
- **S3**: Audit logs bucket with versioning, lifecycle policies, and KMS encryption
- **KMS**: Two separate customer-managed encryption keys (S3 and CloudWatch Logs)
- **VPC Endpoints**: Gateway endpoints for S3 and DynamoDB, interface endpoint for Lambda
- **IAM**: Least-privilege roles with explicit permissions (no wildcards)
- **CloudWatch Logs**: Lambda logs with KMS encryption and 90-day retention
- **VPC Flow Logs**: Network traffic logs stored in encrypted S3 bucket
- **Security Groups**: Explicit rules for inter-service communication

## Security Features

1. **Encryption at Rest**:
   - S3 buckets encrypted with customer-managed KMS keys
   - DynamoDB table encrypted with KMS
   - CloudWatch Logs encrypted with separate KMS key

2. **Network Isolation**:
   - No internet gateway - complete isolation
   - Lambda functions in private subnets
   - VPC endpoints for AWS service access

3. **Access Control**:
   - IAM roles with explicit permissions only
   - No wildcard actions in policies
   - Least-privilege principle enforcement

4. **Audit Logging**:
   - VPC Flow Logs for network traffic
   - CloudWatch Logs for Lambda execution
   - S3 audit logs with versioning

5. **Compliance**:
   - PCI DSS requirements met
   - Encryption in transit and at rest
   - Comprehensive audit trails

## Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- Permissions to create all required resources
- CloudFormation execution permissions

### Deploy the Stack

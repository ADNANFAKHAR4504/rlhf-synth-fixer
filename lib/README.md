# Secure Transaction Processing Pipeline

CloudFormation template for deploying a secure, compliant transaction processing pipeline with KMS encryption, VPC isolation, and AWS Config compliance monitoring.

## Architecture

This infrastructure implements a secure transaction processing system with:

- **VPC Network Isolation**: Private subnets across 3 AZs with no internet access
- **VPC Endpoints**: DynamoDB, Kinesis, KMS, CloudWatch Logs, Lambda endpoints for AWS service access
- **KMS Encryption**: Customer-managed key with automatic rotation for all data at rest
- **Lambda Processing**: 1GB memory function in private subnets for transaction processing
- **DynamoDB Storage**: Encrypted table with point-in-time recovery
- **Kinesis Streaming**: Encrypted data stream for real-time analytics
- **CloudWatch Monitoring**: 90-day log retention with KMS encryption
- **AWS Config Compliance**: Encryption compliance monitoring and rules

## Security Features

1. **Network Isolation**: Lambda runs in private subnets with no internet gateway or NAT
2. **Encryption at Rest**: All data encrypted with customer-managed KMS key
3. **Least Privilege IAM**: Explicit permissions, no wildcards
4. **VPC Endpoints**: All AWS service communication through private endpoints
5. **Security Groups**: Explicit rules with specific CIDR ranges
6. **Compliance Monitoring**: AWS Config rules verify encryption compliance

## Prerequisites

- AWS CLI 2.x configured with appropriate credentials
- CloudFormation permissions to create all resources
- Sufficient service quotas for VPC endpoints, Lambda, DynamoDB, Kinesis

## Deployment

### Deploy Stack
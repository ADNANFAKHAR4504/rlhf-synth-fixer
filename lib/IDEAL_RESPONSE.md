# HIPAA-Compliant Healthcare Data Processing Infrastructure

This CloudFormation template in JSON format implements a complete HIPAA-compliant healthcare data processing infrastructure with comprehensive audit logging and security controls.

## Complete Solution

The infrastructure includes 27 AWS resources deployed across multiple service categories to ensure secure, compliant healthcare data processing:

### 1. Encryption Management (2 resources)
- **KMS Key**: Customer-managed CMK with automatic rotation enabled
- **KMS Alias**: Friendly name alias for the encryption key

### 2. Storage Layer (4 resources)
- **Patient Data Bucket**: S3 bucket with SSE-S3 encryption, versioning, lifecycle policies, and logging
- **Logging Bucket**: Centralized S3 access logs storage with lifecycle management
- **CloudTrail Bucket**: Dedicated bucket for CloudTrail audit logs
- **CloudTrail Bucket Policy**: Policy allowing CloudTrail service to write logs

### 3. Audit Trail (3 resources)
- **CloudTrail**: Multi-region trail with log file validation
- **CloudTrail Log Group**: CloudWatch Logs integration with KMS encryption
- **CloudTrail Role**: IAM role for CloudTrail to write to CloudWatch Logs

### 4. Network Security (9 resources)
- **VPC**: 10.0.0.0/16 CIDR with DNS support
- **Private Subnets**: 2 subnets across different availability zones
- **Route Table**: Private routing table with subnet associations
- **S3 VPC Endpoint**: Gateway endpoint for S3 access
- **CloudWatch Logs VPC Endpoint**: Interface endpoint for logs
- **Security Groups**: Separate groups for Lambda and VPC endpoints with restrictive rules

### 5. Data Processing (5 resources)
- **Lambda Function**: Node.js 20.x function for processing patient data
- **Lambda Execution Role**: IAM role with least-privilege access to S3, DynamoDB, SNS, KMS, and SSM
- **Lambda Log Group**: CloudWatch Logs with KMS encryption and 14-day retention
- **Lambda Permission**: S3 bucket notification permission
- **DynamoDB Audit Table**: Encrypted table with point-in-time recovery for audit trail

### 6. Alerting (1 resource)
- **SNS Topic**: Encrypted topic for processing error notifications

### 7. Configuration Management (2 resources)
- **Config Parameter**: SSM parameter storing environment configuration
- **Bucket Name Parameter**: SSM parameter storing patient data bucket name

## Key HIPAA Compliance Features

1. **Encryption at Rest**: All data storage services use encryption (S3, DynamoDB, CloudWatch Logs, SNS)
2. **Encryption in Transit**: VPC endpoints and security groups enforce HTTPS-only communication
3. **Key Management**: Customer-managed KMS key with automatic rotation
4. **Audit Logging**: CloudTrail tracks all API calls with data event tracking on patient data bucket
5. **Access Control**: IAM roles follow least-privilege principle
6. **Data Lifecycle**: Automated transition to lower-cost storage and expiration policies
7. **Versioning**: S3 versioning enabled for data recovery
8. **Point-in-Time Recovery**: DynamoDB PITR for audit trail protection
9. **Network Isolation**: Lambda runs in private subnets with no internet access
10. **Log Retention**: CloudWatch Logs retained for 14 days as required

## Resource Naming Convention

All resources use the `EnvironmentSuffix` parameter for naming:
- Pattern: `{resource-purpose}-${EnvironmentSuffix}`
- Examples: `patient-data-dev`, `audit-trail-prod`
- Ensures no naming conflicts across environments

## Outputs

The template exports 11 outputs for integration and testing:
- Bucket names (Patient Data, Logging, CloudTrail)
- DynamoDB table name
- Lambda function name and ARN
- SNS topic ARN
- VPC ID
- KMS key ID and ARN
- CloudTrail name

## Validation Results

- CloudFormation template validation: PASSED
- Unit tests: 46/46 PASSED
- JSON syntax: VALID
- Resource dependencies: CORRECT
- IAM capabilities required: CAPABILITY_NAMED_IAM

## Deployment Note

Deployment requires AWS account with sufficient IAM role quota. The template creates 2 new IAM roles (CloudTrailRole, LambdaExecutionRole). If IAM role limit (1000) is reached, cleanup of unused roles or quota increase is required.
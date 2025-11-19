# Secure Document Processing Pipeline

A PCI-DSS compliant document processing system built with AWS CDK (Python).

## Architecture Overview

This solution implements a zero-trust security architecture for processing sensitive financial documents with:

- End-to-end encryption using AWS KMS with automatic key rotation
- Multi-layer security with VPC isolation, WAF, and API Gateway authentication
- Automated compliance scanning and validation
- Security monitoring with GuardDuty, AWS Config, and CloudWatch
- Audit logging to DynamoDB with point-in-time recovery

## Prerequisites

- Python 3.9 or later
- AWS CDK 2.x
- AWS CLI v2 configured with appropriate credentials
- Node.js (for AWS CDK CLI)

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Bootstrap CDK (first time only):
```bash
cdk bootstrap aws://ACCOUNT-ID/us-east-1
```

## Deployment

Deploy with an environment suffix for unique resource naming:

```bash
cdk deploy -c environmentSuffix=dev
```

For production:

```bash
cdk deploy -c environmentSuffix=prod
```

## Architecture Components

### 1. KMS Encryption
- Customer-managed CMK with automatic rotation
- Used for S3, DynamoDB, Secrets Manager, and SNS encryption

### 2. S3 Buckets
- Document Bucket: Stores processed documents with versioning
- Access Log Bucket: Captures access logs for compliance
- Both encrypted with KMS, block all public access

### 3. VPC Configuration
- Private subnets across 3 availability zones
- No internet gateway (fully isolated)
- VPC endpoints for S3, DynamoDB, Lambda, Secrets Manager, and KMS

### 4. Lambda Functions
- Validation: Validates document format and size
- Encryption: Applies KMS encryption to documents
- Compliance: Scans for PCI-DSS compliance issues
- Remediation: Automated response to GuardDuty findings

All Lambda functions:
- Run in VPC private subnets
- Use separate IAM roles with least-privilege policies
- Have 15-second timeout (60s for remediation)

### 5. API Gateway
- REST API with WAF protection
- API key authentication required
- Request throttling (100 req/sec, burst 50)
- CloudWatch logging enabled
- Endpoints:
  - POST /documents/upload - Upload and validate
  - POST /documents/encrypt - Encrypt document
  - POST /documents/scan - Compliance scan

### 6. WAF Rules
- SQL injection protection
- XSS attack prevention
- Managed rule sets from AWS

### 7. DynamoDB
- Audit log table with point-in-time recovery
- Encrypted with customer-managed KMS key
- Partition key: requestId, Sort key: timestamp

### 8. Security Monitoring
- GuardDuty: Monitors for threats, triggers remediation for high-severity findings
- AWS Config: Validates encryption and access policies
- CloudWatch Events: Captures all API calls
- CloudWatch Logs: Stores API call logs with retention

### 9. Secrets Management
- API keys and database credentials stored in Secrets Manager
- Encrypted with KMS
- Configured for automatic rotation (requires rotation Lambda in production)

### 10. SNS Alerts
- Encrypted topic for security alerts
- Receives notifications from GuardDuty remediation

## Testing

Run unit tests:

```bash
pytest tests/unit/
```

Run integration tests:

```bash
pytest tests/integration/
```

## Security Features

### PCI-DSS Compliance
- Data encryption at rest and in transit
- Access control with IAM and API keys
- Audit logging for all operations
- Network isolation with VPC
- Automated security monitoring

### Zero-Trust Architecture
- No public internet access
- All service communication via VPC endpoints
- Least-privilege IAM policies
- Encryption for all data stores

### Automated Remediation
- GuardDuty findings trigger Lambda remediation
- Security alerts sent to SNS topic
- Audit trail maintained in DynamoDB

## Outputs

After deployment, the stack exports:

- ApiEndpoint: API Gateway URL
- DocumentBucketName: S3 bucket for documents
- AccessLogBucketName: S3 bucket for access logs
- AuditTableName: DynamoDB table name
- KmsKeyId: KMS key ID for encryption
- SecurityAlertTopicArn: SNS topic for alerts

## Clean Up

To destroy all resources:

```bash
cdk destroy -c environmentSuffix=dev
```

Note: All resources are configured without RemovalPolicy.RETAIN or DeletionProtection for complete cleanup.

## Known Limitations

1. GuardDuty: Detector is account-level. Only one detector per account/region. If a detector already exists, the deployment will use it.

2. Secrets Rotation: Automatic rotation requires a rotation Lambda function. Implement per AWS documentation for production use.

3. NAT Gateway: Intentionally omitted for cost optimization and security. All AWS service access via VPC endpoints.

## Production Considerations

1. Configure SNS email subscription for security alerts
2. Implement Secrets Manager rotation Lambda
3. Adjust Lambda timeout and memory based on document sizes
4. Configure CloudWatch alarms for critical metrics
5. Review and adjust API Gateway throttling limits
6. Implement DynamoDB auto-scaling if needed
7. Configure backup retention policies
8. Review IAM policies for least-privilege access

## Cost Optimization

- Uses serverless services (Lambda, API Gateway, DynamoDB)
- No NAT Gateway (significant cost savings)
- VPC endpoints for service access
- Configurable log retention periods
- S3 lifecycle policies can be added for archival

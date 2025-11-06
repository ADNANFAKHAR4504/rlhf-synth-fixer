# Secure Financial Data Infrastructure - CDK Python Implementation

Complete implementation of PCI-DSS compliant infrastructure for handling sensitive financial data.

## Implementation Files

All code files have been created in the lib/ directory following CDK Python best practices.

### Stack Implementation (lib/tap_stack.py)

The main stack file implements:
- KMS key with automatic rotation for encryption
- VPC with private subnets (2 AZs) and no NAT gateways
- VPC endpoints for S3, KMS, and CloudWatch Logs
- S3 bucket for data with KMS encryption, versioning, and lifecycle rules
- S3 bucket for VPC flow logs with encryption
- Lambda function in VPC with security group (HTTPS only)
- IAM role with least privilege permissions
- API Gateway REST API with API key authentication
- Request validation and usage plan
- CloudWatch Log groups with 90-day retention
- CloudWatch alarms for security monitoring
- Stack outputs for integration

### Lambda Function (lib/lambda/index.py)

PII scanning Lambda function that:
- Scans S3 objects for PII using regex patterns
- Detects SSN, credit cards, emails, phone numbers, IP addresses
- Runs in VPC using VPC endpoints
- Encrypted environment variables
- Stores scan results back to S3
- Proper error handling and logging

## Key Security Features

1. KMS encryption for all data at rest
2. HTTPS-only enforcement via bucket policies
3. Private subnets with VPC endpoints (no public internet)
4. Security groups allowing only port 443
5. IAM roles with specific permissions (no wildcards)
6. API Gateway with API key requirement
7. CloudWatch alarms for unauthorized access
8. 90-day log retention for compliance
9. VPC flow logs for network monitoring
10. Multi-AZ deployment for high availability

## Resource Naming

All resources include environmentSuffix:
- financial-data-bucket-{environmentSuffix}
- flow-logs-bucket-{environmentSuffix}
- pii-scanner-{environmentSuffix}
- pii-scanner-api-{environmentSuffix}

## Deployment

The infrastructure can be deployed using:
```bash
cdk deploy --context environmentSuffix=dev
```

All resources are configured with RemovalPolicy.DESTROY for CI/CD compatibility.
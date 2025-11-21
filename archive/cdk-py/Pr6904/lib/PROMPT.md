# Infrastructure as Code Task: Secure Document Processing Pipeline

## Platform and Language (MANDATORY CONSTRAINTS)
**IMPORTANT**: This task MUST be implemented using:
- **Platform**: AWS CDK
- **Language**: Python

These are non-negotiable requirements from metadata.json. Any other platform or language will result in task rejection.

## Task Description

Create a CDK Python program to deploy a secure document processing pipeline with automated compliance scanning. The configuration must: 1. Create KMS keys with automatic rotation for bucket encryption and environment variables. 2. Deploy S3 buckets with versioning, access logging to a separate bucket, and block all public access. 3. Implement Lambda functions for document validation, encryption, and compliance scanning with 15-second timeouts. 4. Configure API Gateway REST API with WAF rules blocking SQL injection and XSS attempts. 5. Set up VPC with private subnets only and VPC endpoints for S3, DynamoDB, and Lambda. 6. Create DynamoDB table for audit logs with point-in-time recovery and encryption. 7. Implement CloudWatch Events rules to capture all API calls and store in CloudWatch Logs. 8. Deploy GuardDuty with rules triggering remediation Lambdas for high-severity findings. 9. Configure Secrets Manager to store API keys and database credentials with automatic rotation. 10. Create IAM roles with external ID requirements and session policies limiting access duration. 11. Implement AWS Config custom checks validating encryption and access policies. 12. Set up SNS topics with encrypted email notifications for security alerts. Expected output: A complete CDK Python stack that deploys a zero-trust document processing system meeting PCI-DSS requirements with automated security monitoring and remediation.

## Background

A financial services company needs to implement a secure document processing system that meets PCI-DSS compliance requirements. The system must handle sensitive financial documents with end-to-end encryption, audit logging, and automated security scanning. All data must be encrypted at rest and in transit with customer-managed keys.

## Environment

"Highly secure multi-AZ deployment in us-east-1 for PCI-DSS compliant document processing. Uses Lambda for processing, S3 with KMS encryption for storage, API Gateway with WAF for endpoints. Requires Python 3.9+, CDK 2.x, AWS CLI v2 configured with MFA. VPC spans 3 AZs with private subnets only, using VPC endpoints for AWS service access. Security-focused architecture with GuardDuty, and automated compliance scanning. No internet gateway, all traffic routes through VPC endpoints."

## Requirements and Constraints

1. All S3 buckets must use SSE-KMS encryption with customer-managed CMKs
2. Lambda functions must use separate execution roles with least-privilege policies
3. All API Gateway endpoints must require API keys and implement request throttling
4. CloudTrail alternatives must be implemented using CloudWatch Events and Logs
5. VPC endpoints must be used for all AWS service communications
6. Security Groups must explicitly deny all traffic except required ports
7. All IAM policies must use condition keys to restrict access by IP and MFA
8. Secrets Manager must rotate database credentials every 30 days automatically
9. GuardDuty findings must trigger automated remediation functions

## Mandatory Infrastructure Requirements

### Resource Naming Convention
ALL named resources MUST include stack name and environmentSuffix parameter:
- Format: `{base-name}-{stack-name}-${environmentSuffix}`
- Example: `documents-tapstackdev-dev`
- Implementation uses `_get_unique_name()` helper method
- This is CRITICAL for parallel deployment support in CI/CD and avoiding resource name conflicts

### Destroyability Requirements
- NO RemovalPolicy.RETAIN on any resources
- NO DeletionProtection enabled
- All resources must be fully destroyable for clean teardown

### Security Best Practices
- All S3 buckets must use SSE-KMS encryption with customer-managed keys
- All Lambda functions must use separate IAM execution roles with least-privilege
- All API Gateway endpoints must require API keys
- VPC endpoints must be used for all AWS service communications
- Security Groups must explicitly deny all traffic except required ports
- IAM policies must use condition keys to restrict access

### Compliance Requirements
- PCI-DSS compliance for document processing
- GuardDuty monitoring with automated remediation
- CloudWatch Events for all API call auditing
- Secrets Manager for credential rotation
- Note: AWS Config removed due to account-level quota limits (one configuration recorder per account/region)

### Monitoring and Logging
- CloudWatch Logs with appropriate retention periods
- CloudWatch alarms for critical metrics
- SNS topics for security alerts
- Audit logging to DynamoDB with point-in-time recovery

## Expected Outputs

The CDK stack must export:
1. API Gateway endpoint URL
2. S3 bucket names for document storage and logging
3. DynamoDB table name for audit logs
4. CloudWatch dashboard URL
5. KMS key IDs for encryption

## Testing Considerations

The infrastructure must support:
- Unit tests validating resource configurations
- Integration tests using deployed resources
- 100% test coverage requirement
- Proper mocking of AWS services in unit tests

## Known Issues to Avoid

1. AWS Config: Account-level resource - only ONE configuration recorder per account/region. Removed from implementation to avoid quota conflicts.
2. DynamoDB VPC Endpoints: Must use Gateway endpoint, not Interface endpoint (DynamoDB doesn't support private DNS).
3. VPC Endpoints: Required for all AWS service communications (no internet gateway). S3 and DynamoDB use Gateway endpoints, others use Interface endpoints.
4. Lambda Runtime: Use Python 3.9+ compatible with CDK requirements
5. Secrets Manager: Configure automatic rotation for database credentials
6. Resource Naming: Use `_get_unique_name()` helper method to include stack name in resource names for uniqueness across parallel deployments

## Success Criteria

- All resources deployed successfully
- All security controls implemented
- All compliance requirements met
- Infrastructure is fully destroyable
- Tests achieve 100% coverage
- Training quality score >= 8/10

# Secure E-Commerce Data Pipeline Infrastructure

> **CRITICAL REQUIREMENT: This task MUST be implemented using Pulumi with Go**
>
> Platform: **Pulumi**
> Language: **Go**
> Region: **ap-southeast-1**

---

## Background

A retail company is building a secure e-commerce platform that processes sensitive customer payment information. They need to implement a data pipeline that captures transaction data, securely stores it with encryption, and makes it available for analytics while maintaining PCI DSS compliance requirements.

## Problem Statement

Design and implement a secure payment processing infrastructure for a high-traffic e-commerce platform that handles sensitive customer data in compliance with PCI DSS requirements.

## Requirements

### 1. Data Ingestion Layer
- Implement Amazon Kinesis Data Streams to capture real-time transaction data
- Configure appropriate shard capacity for transaction throughput
- Enable server-side encryption using AWS KMS for data at rest in Kinesis

### 2. Secure Storage Layer
- Create S3 bucket for storing transaction data with server-side encryption (SSE-KMS)
- Enable S3 bucket versioning for data retention requirements
- Block all public access to the S3 bucket
- Implement bucket policy enforcing encryption in transit (SSL/TLS only)
- Enable S3 access logging to audit bucket access

### 3. Analytics Layer
- Set up Amazon Kinesis Data Firehose to deliver data from Kinesis Streams to S3
- Configure Firehose with data transformation capabilities
- Enable Firehose encryption using KMS
- Create IAM role for Firehose with least privilege permissions

### 4. Encryption and Key Management
- Create customer-managed KMS key for encrypting sensitive data
- Enable automatic key rotation for the KMS key
- Create KMS key alias for easy reference
- Configure key policy allowing required AWS services (Kinesis, S3, Firehose)

### 5. Security and Compliance
- Implement least privilege IAM roles for all services
- Create security monitoring with CloudWatch Logs
- Enable CloudWatch log groups with retention policies
- Configure CloudWatch alarms for security events
- All IAM policies must follow least privilege principle

### 6. Network Security
- No public endpoints for data storage
- All data transfers must use encryption in transit (TLS/SSL)
- Implement VPC endpoints where applicable for private connectivity

### 7. Monitoring and Logging
- Enable CloudWatch Logs for Kinesis, Firehose, and Lambda
- Create CloudWatch metric alarms for:
  - Kinesis stream throttling
  - Firehose delivery failures
  - KMS key usage anomalies
- Set log retention to 30 days for compliance

### 8. Infrastructure Requirements
- All resources must use the environmentSuffix variable for naming
- All resources must be fully destroyable for CI/CD testing
- Do NOT create new secrets in AWS Secrets Manager (fetch from existing if needed)
- Deploy all resources in ap-southeast-1 region
- Tag all resources with appropriate metadata

## Implementation Guidelines

### Code Structure
- Implement in Pulumi Go using the standard tap_stack.go pattern
- Use component-based architecture for modularity
- Implement proper error handling for all resources
- Export necessary outputs for testing and integration

### Security Best Practices
- Never hardcode sensitive values
- Use KMS for all encryption at rest
- Enforce TLS for all encryption in transit
- Implement least privilege IAM policies
- Enable logging and monitoring for all security-relevant events

### Resource Naming Convention
- Use format: `{service}-{purpose}-${environmentSuffix}`
- Example: `kinesis-transactions-${environmentSuffix}`

### PCI DSS Compliance Considerations
- Encryption at rest for all stored payment data
- Encryption in transit for all data transfers
- Access logging and monitoring for all data access
- Least privilege access control
- Regular key rotation
- Immutable audit trails

## Success Criteria

1. All resources deploy successfully in ap-southeast-1
2. Data pipeline can ingest, process, and store transaction data securely
3. All encryption requirements (at rest and in transit) are met
4. IAM policies follow least privilege principle
5. CloudWatch monitoring and logging are operational
6. All resources are tagged with environmentSuffix
7. Infrastructure can be cleanly destroyed
8. No public access to any data storage resources
9. KMS key rotation is enabled

## Outputs Required

Export the following outputs for testing:
- Kinesis stream name and ARN
- S3 bucket name for transaction data
- Firehose delivery stream name
- KMS key ID and ARN
- CloudWatch log group names
- IAM role ARNs

## Testing Considerations

The infrastructure will be tested for:
- Successful deployment in ap-southeast-1
- Proper encryption configuration (at rest and in transit)
- IAM permission boundaries and least privilege
- CloudWatch metrics and logging
- Resource tagging compliance
- Clean destruction without manual intervention

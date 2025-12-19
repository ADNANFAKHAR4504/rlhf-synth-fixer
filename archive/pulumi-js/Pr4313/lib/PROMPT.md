# HIPAA-Compliant Healthcare Data Pipeline

## Critical Requirements

This task must be implemented using Pulumi with JavaScript.

Platform: pulumi
Language: javascript
Region: ap-southeast-1

## Background

A healthcare provider needs infrastructure for processing real-time patient monitoring data. The system must comply with HIPAA regulations for handling Protected Health Information (PHI). This is a medium-complexity infrastructure task using Pulumi with JavaScript.

## Problem Statement

Create a HIPAA-compliant data pipeline that processes and stores patient monitoring data in real-time. The system needs to:

- Ingest continuous streams of patient vital signs (heart rate, blood pressure, temperature)
- Store data securely in a relational database for long-term analysis
- Ensure all data is encrypted at rest and in transit
- Maintain audit trails for compliance purposes
- Provide monitoring and alerting capabilities
- Support Multi-AZ deployment for high availability

The infrastructure must handle Protected Health Information (PHI) according to HIPAA requirements including encryption, access controls, audit logging, and secure network isolation.

## Requirements

### Functional Requirements

1. Real-time data ingestion system capable of handling continuous patient monitoring streams
2. PostgreSQL database for structured storage of patient records
3. Encrypted storage for all PHI data at rest
4. Secure network environment with private subnets
5. Audit logging system with minimum 90-day retention
6. Monitoring and alerting for critical system metrics

### HIPAA Compliance Requirements

1. All data must be encrypted at rest using customer-managed encryption keys
2. All data must be encrypted in transit using TLS/SSL
3. Database must not be publicly accessible
4. Comprehensive audit logging must be enabled
5. Access must follow principle of least privilege
6. Data retention policies must be enforced
7. Automatic key rotation must be enabled

### Technical Constraints

1. Use Pulumi as the Infrastructure as Code framework
2. All code must be written in JavaScript
3. Deploy to AWS region ap-southeast-1
4. Use RDS PostgreSQL version 15 or higher
5. Use AWS Kinesis for real-time data streaming
6. All resources must be tagged with environment identifier
7. Infrastructure must be fully destroyable for CI/CD workflows
8. Use environmentSuffix variable for all resource naming

### Security Requirements

1. Implement VPC with private subnets in multiple availability zones
2. Configure security groups with minimal required access
3. Use AWS KMS for encryption key management
4. Enable key rotation for all KMS keys
5. Configure SSL/TLS enforcement for database connections
6. Implement IAM roles with least privilege policies
7. Enable CloudWatch logging for all services

### Monitoring Requirements

1. CloudWatch alarms for database CPU utilization
2. CloudWatch alarms for Kinesis iterator age
3. CloudWatch log groups with encryption enabled
4. Export database logs to CloudWatch
5. Configure appropriate alarm thresholds and evaluation periods

## Environment Setup

The solution requires:
- Pulumi CLI installed
- AWS credentials configured
- Node.js and npm installed
- AWS region set to ap-southeast-1

## Implementation Guidelines

### Resource Naming Convention
All resources must use the environmentSuffix variable in their names following the pattern:
- Format: `resource-type-${environmentSuffix}`
- Example: `healthcare-rds-dev`, `healthcare-stream-prod`

### Tag Requirements
All resources must be tagged with:
- Compliance: HIPAA
- DataClassification: PHI
- Environment: environmentSuffix value

### Testing Requirements
1. Unit tests must validate resource configurations
2. Integration tests must verify deployed infrastructure
3. Tests must validate HIPAA compliance features
4. Tests must check encryption settings
5. Tests must verify network isolation

### Destroyability Requirements
- Set skipFinalSnapshot to true for RDS instances
- Set deletionProtection to false
- Avoid DeletionPolicy: Retain
- Do not create secrets in Secrets Manager (use existing ones if needed)

## Success Criteria

1. All infrastructure deploys successfully to ap-southeast-1 region
2. RDS instance is encrypted with customer-managed KMS key
3. Kinesis stream is encrypted with customer-managed KMS key
4. Database is not publicly accessible
5. SSL/TLS is enforced for database connections
6. CloudWatch logs have 90-day retention
7. All resources are properly tagged
8. IAM roles follow least privilege principle
9. Security groups restrict access appropriately
10. Multi-AZ subnets are configured
11. CloudWatch alarms are functional
12. Infrastructure can be cleanly destroyed
13. All unit and integration tests pass

## Deliverables

1. Pulumi JavaScript code implementing the stack
2. Unit tests with good coverage
3. Integration tests validating deployed resources
4. Documentation of the solution
5. HIPAA compliance validation

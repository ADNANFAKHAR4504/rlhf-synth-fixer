# Security Infrastructure for Financial Services Data Processing Application

## Overview

We need to implement a comprehensive security infrastructure for a financial services data processing application using Infrastructure as Code (Pulumi with TypeScript). The infrastructure must meet strict compliance requirements and implement defense-in-depth security controls.

## Requirements

### 1. Encryption at Rest with KMS

Implement a customer-managed KMS encryption key with the following specifications:
- Enable automatic key rotation
- Set minimum deletion window of 30 days
- Create a key policy that allows specific IAM roles and AWS services (CloudWatch Logs, Secrets Manager) to use the key
- Use conditional access based on encryption context for CloudWatch Logs
- Tag the key appropriately for compliance tracking

### 2. IAM Roles with Least-Privilege Access

Create three IAM roles with strict least-privilege policies:

**EC2 Data Processing Role:**
- Maximum session duration: 1 hour
- External ID validation for assume role
- Read-only access to Secrets Manager secrets
- KMS decrypt permissions with VPC source conditions
- CloudWatch Logs write permissions scoped to `/aws/ec2/*`
- **Explicit deny** for IAM modifications and KMS key deletion

**Lambda Secrets Rotation Role:**
- Maximum session duration: 1 hour
- Permissions for VPC networking (ENI management)
- Secrets Manager read/write for rotation operations
- KMS encrypt/decrypt permissions
- CloudWatch Logs permissions for Lambda logs
- **Explicit deny** for IAM modifications and key deletion

**Cross-Account Auditor Role:**
- External ID validation (minimum 32 characters)
- IP address restrictions (only 10.0.0.0/8 and 172.16.0.0/12)
- Read-only permissions for security auditing (CloudWatch, KMS, Secrets Manager, IAM)
- **Explicit deny** for all write operations (Create*, Delete*, Update*, Put*, Modify*)

### 3. Secrets Manager with Automatic Rotation

Implement automated secret management:
- Store database credentials in Secrets Manager
- Encrypt secrets with the customer-managed KMS key
- Configure automatic rotation every 30 days
- Set recovery window of 7 days for accidental deletion
- Create a Lambda function for rotation logic (must run in **private subnet**)
- Lambda must use customer-managed KMS key for environment variable encryption

### 4. Cross-Account Access with External ID Validation

Implement secure cross-account access for third-party auditors:
- Generate external ID dynamically (minimum 32 characters)
- Include external ID validation in assume role policy
- Add source IP address restrictions
- Limit session duration to 1 hour maximum
- Provide read-only access to security resources

### 5. CloudWatch Log Groups with Encryption

Create two log groups for audit trail:
- **Audit Log Group**: `/aws/security/audit-logs-{environmentSuffix}`
- **Application Log Group**: `/aws/application/logs-{environmentSuffix}`

Both must:
- Have 365-day retention period (compliance requirement)
- Use KMS encryption with customer-managed key
- Be properly tagged with Purpose tag

### 6. MFA Enforcement Policy

Create an IAM policy that enforces MFA for sensitive operations:
- Deny `secretsmanager:DeleteSecret` without MFA
- Deny `secretsmanager:PutSecretValue` without MFA
- Deny `kms:ScheduleKeyDeletion` without MFA
- Deny `kms:DisableKey` without MFA
- Deny `iam:DeleteRole` and `iam:DeleteRolePolicy` without MFA
- Attach this policy to all IAM roles

### 7. Service Control Policy (Region Restriction)

Implement region restriction to prevent data residency violations:
- Deny resource creation outside `eu-north-1` region
- Apply to: EC2 instances, RDS instances, S3 buckets, Lambda functions
- Note: This should be implemented as an IAM policy (actual SCPs are organization-level)

### 8. Compliance Tagging

Apply mandatory tags to all resources:
- `Environment`: Deployment environment (from environmentSuffix parameter)
- `Owner`: cloud-team
- `SecurityLevel`: high
- `ManagedBy`: pulumi

Additional purpose-specific tags on log groups (Purpose: audit-trail, application).

### 9. VPC and Networking

Since the rotation Lambda must run in a **private subnet** (compliance requirement):
- Create a VPC with CIDR 10.0.0.0/16
- Create a private subnet in eu-north-1a (10.0.1.0/24)
- Enable DNS support and hostnames
- Create VPC endpoint for Secrets Manager (Interface endpoint) to allow private subnet access without NAT Gateway
- Create security group for Lambda with appropriate egress rules

## Constraints

1. **All resources must be deployed in eu-north-1 region**
2. KMS key deletion window must be at least 30 days
3. All IAM roles must have maximum session duration of 1 hour (3600 seconds)
4. External ID must be at least 32 characters
5. CloudWatch log retention must be 365 days
6. Lambda for rotation must run in private subnet
7. Lambda environment variables must be encrypted with customer-managed KMS key
8. All resources must have mandatory compliance tags (Environment, Owner, SecurityLevel)
9. Cross-account role must have IP address restrictions
10. All roles must have explicit deny statements for dangerous operations

## Expected Outputs

The stack should export the following outputs for integration with other systems:
- KMS key ARN and ID
- All IAM role ARNs and names
- Secrets Manager secret ARN and name
- CloudWatch log group names and ARNs
- VPC ID and private subnet ID
- Lambda function ARN for secret rotation
- MFA policy ARN
- Region restriction policy ARN

## Success Criteria

- All 8 security requirements implemented
- All 10 constraints satisfied
- Resources can be successfully created and destroyed
- Proper error handling and validation
- Comprehensive documentation of security controls
- Production-ready code with proper TypeScript types

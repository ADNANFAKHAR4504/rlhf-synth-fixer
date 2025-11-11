# Security Framework Implementation Task

Create a CDKTF program implementing a security framework for sensitive data processing with PCI DSS compliance. Everything must be in TypeScript using AWS CDK (not CDKTF, CDK only).

## Platform Requirements
- Platform: AWS CDK
- Language: TypeScript
- Single file implementation in lib/tap-stack.ts

## What needs to be built

1. KMS Key Hierarchy
Create multi-region KMS keys with automatic rotation enabled for different data types:
- PII data key
- Financial data key
- Operational data key
- CloudWatch Logs key (separate from app data)

Set up notifications 30 days before key rotation expires.

2. IAM Roles
Define least-privilege roles for:
- Application services (limited to payment processing operations)
- Data analysts (read-only to operational data, MFA required)
- Security auditors (read-only to security resources and audit logs)
- Cross-account security scanner (read-only for external tools)

All roles need max session duration of 1 hour and must enforce source IP ranges. MFA required for privileged operations.

3. S3 Buckets with Tag-Based Encryption
Create buckets with:
- Public access blocked
- TLS 1.2 minimum enforced
- Encryption policies based on object tags (DataType: PII uses PII KMS key, etc)
- Deny uploads without encryption headers
- Versioning enabled

4. Lambda Functions for Auto-Remediation
Build functions to:
- Scan S3 objects for missing/incorrect tags
- Apply tags based on metadata or content
- Re-encrypt with correct KMS key if needed
- Notify security team of violations

Functions should run in private subnets with no internet access. Use Python 3.11 runtime with inline code. Set up EventBridge triggers.

5. CloudWatch Log Groups
Create log groups for Lambda, API access, security events, and audit trails. Encrypt with the logs KMS key. Set 7 year retention (2557 days).

6. Cross-Account Access
Create IAM role for security scanning tools with read-only permissions and external ID requirement. Document role ARNs.

7. Resource Deletion Protection
Create policies preventing deletion of KMS keys, log groups, audit buckets, and security IAM resources. Use explicit Deny with conditions.

8. CloudWatch Alarms
Set up alarms for:
- Unauthorized KMS access attempts
- Policy violations
- Failed auth attempts
- Unusual API patterns
- S3 policy changes
- IAM modifications

Configure SNS topics for notifications.

9. MFA Enforcement
Create IAM policies requiring MFA for writes to security resources, access to PII/financial data, admin operations, and cross-account assumptions. Use aws:MultiFactorAuthPresent condition.

10. Key Rotation Monitoring
Set up EventBridge rules monitoring KMS rotation events with SNS notifications. Alert 30 days before rotation required.

## Technical Constraints
- All KMS keys must be multi-region
- IAM policies must enforce source IP ranges with condition keys
- S3 buckets must block public access and require TLS 1.2+
- Lambda must run in private subnets without internet
- CloudWatch Logs must use separate KMS key from application data
- IAM roles limited to 1 hour sessions

## Business Context
Financial tech startup needs security controls for payment processing infrastructure. Requires automated policy enforcement, key rotation, and audit logging for PCI DSS compliance.

## Deliverables

Single CDK stack in lib/tap-stack.ts with:
- All resources in one file
- Clear section comments
- TypeScript types and interfaces
- Environment config support (dev/staging/prod)
- Inline Lambda code

Security audit report showing:
- All resources and configurations
- PCI DSS compliance mapping
- Encryption status, access controls, monitoring
- JSON/Markdown format

Outputs for:
- KMS key ARNs by classification
- IAM role ARNs
- S3 bucket names/ARNs
- Log group names
- Lambda ARNs
- SNS topic ARNs
- Alarm names

## Implementation Notes
- Tag everything (Environment, Owner, DataClassification, Compliance)
- Use least privilege throughout
- Enable CloudTrail integration
- Multi-region disaster recovery design
- Assume VPC/subnets already exist
- Use CDK L2 constructs
- Make Lambda operations idempotent

The lib/tap-stack.ts file will be 500-1000+ lines. This is expected for a comprehensive single-file security framework.

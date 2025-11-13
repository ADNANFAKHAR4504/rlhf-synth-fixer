# AWS CDK Infrastructure for TAP Payment System

## Background
We need to build out the core security infrastructure for our new payment processing platform (TAP - Trusted Audit Platform). This is for a fintech client who's pretty strict about security - they need PCI-DSS compliance and have asked for zero-trust architecture.

Platform: AWS CDK with TypeScript

## Important Note
Keep everything in a single stack file (`lib/tap-stack.ts`). I know it's not ideal, but the client wants to review all infrastructure in one place. Use comments to organize different sections.

## What We Need to Build

### KMS Encryption Setup
Set up a couple of KMS keys for different purposes:
- One for general data encryption
- Another one specifically for secrets

Make sure rotation is enabled (they mentioned 90 days but AWS default is 365 which should be fine). Single region only - they're deploying to ap-northeast-1 initially.

### IAM Roles and Permissions
This is the tricky part. Need to create roles with permission boundaries to prevent privilege escalation. The security team is paranoid about this after their last audit.

Requirements:
- Application role with permission boundary that blocks modifying IAM/KMS/security stuff
- Cross-account role for their ops team (different AWS account)
- Use MFA conditions where possible
- External ID validation for cross-account access

The permission boundary should deny actions like:
- Creating/modifying IAM roles
- Deleting KMS keys
- Changing CloudTrail config
- Basically anything that could compromise security

### Secrets Management
Use Secrets Manager for:
- Database credentials (RDS master password)
- API keys for payment gateway

Add rotation lambdas but keep them simple - just need basic rotation logic. Timeout should be 30 seconds max.

### Parameter Store
Some non-sensitive config should go in Systems Manager Parameter Store:
- App configuration
- Environment-specific settings
- Use SecureString type with KMS encryption

Naming convention: /tap/{environment}/...

### Logging and Monitoring
CloudWatch log groups for audit logs. Encrypt with KMS and set retention (maybe 90 days?).

We also need CloudTrail enabled with log file validation. Store logs in S3 bucket with encryption.

Add some basic CloudWatch alarms:
- Unauthorized API calls
- IAM policy changes
- Root account usage
- That kind of stuff

EventBridge rules to route security events to the audit log group.

### S3 Buckets
Need a few buckets:
- CloudTrail logs
- Application data
- Make sure they enforce encryption (both in-transit and at-rest)
- Block all public access
- Versioning enabled on CloudTrail bucket

Bucket policies should deny any non-SSL uploads and require KMS encryption.

### Service Control Policies
Create some SCP templates that can be used at the org level. Not actually applying them in this stack, just creating the policy documents as reference.

Common restrictions:
- Prevent leaving the organization
- Require encryption
- Restrict regions to approved list

## Code Organization
Since everything goes in one file, use section comments:

```
// KMS Keys
// IAM Permission Boundaries
// IAM Roles
// S3 Buckets
// Secrets Manager
// Parameter Store
// Lambda Functions
// CloudWatch Logs
// CloudTrail
// Service Control Policies
// Alarms and Monitoring
// Outputs
// Tags
```

## Stack Properties
Make it configurable with constructor props:
- Environment suffix (dev, staging, prod)
- Optional list of trusted account ARNs for cross-account role

## Outputs
Export the important ARNs so other teams can reference them:
- KMS key ARNs
- IAM role ARNs
- S3 bucket names
- Secrets ARNs
- External ID for cross-account access

## Testing
Needs to deploy cleanly. Use RemovalPolicy.DESTROY for testing environments so we can tear down and rebuild easily.

Make sure the code is production-ready:
- Proper TypeScript types
- Error handling
- Use CDK best practices
- No hardcoded values (use variables/parameters)

## Compliance Notes
Client mentioned PCI-DSS compliance is mandatory. That means:
- All data encrypted at rest and in transit
- Audit logging enabled
- Access controls with least privilege
- Regular key rotation
- MFA for sensitive operations

They're pretty serious about this - their last provider got dinged on an audit.

## Notes from Security Review
- NO AWS Config (they have their own compliance scanning tool)
- Prefer explicit deny policies over just not allowing
- Tag everything with Environment, Project, CostCenter
- Session duration max 1 hour for application role
- CloudWatch logs must be encrypted

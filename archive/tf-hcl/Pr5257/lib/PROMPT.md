I need help building a comprehensive IAM security framework for a financial services company using Terraform. We're implementing zero-trust principles across multiple AWS accounts, and the security requirements are really strict - this is regulated financial services, so we can't cut corners.

## Technology Stack: Terraform HCL

**All infrastructure must be written in Terraform 1.5+ using HCL with AWS Provider 5.x.** This is for production deployment in a regulated environment.

## Our Current Setup

We have a multi-account AWS organization with separate accounts for development, staging, and production. Everything is deployed in **us-east-1**. We use AWS SSO integrated with our external identity provider for authentication.

Current infrastructure includes:

- EC2 instances running our applications
- RDS databases with financial data
- S3 buckets for document storage
- Lambda functions for various automation tasks
- VPC endpoints configured for secure API access
- CloudTrail logging enabled across all accounts feeding into a central logging account

## The Problem We're Trying to Solve

Right now our IAM setup is too permissive and doesn't meet our compliance requirements. We need a complete overhaul that implements proper zero-trust principles with granular access controls.

We need to enforce:

- Least privilege access (nobody should have more permissions than they absolutely need)
- Conditional access based on context (who, when, where, how)
- Strict separation of duties (developers shouldn't touch production, etc.)
- Time-limited access (privileges should expire automatically)
- MFA for anything sensitive
- Complete audit trails

## What We Need to Build

### 1. Advanced IAM Policies with Conditional Logic

Create custom IAM policies that use sophisticated conditions - not just simple "allow/deny" but contextual decisions based on multiple factors.

Every policy must include at least 3 different condition keys, such as:

- **Source IP restrictions** (`aws:SourceIp`) - only allow from our corporate network or VPN
- **Time-based access** (`aws:CurrentTime`) - restrict certain operations to business hours
- **MFA requirements** (`aws:MultiFactorAuthPresent`, `aws:MultiFactorAuthAge`) - require recent MFA for sensitive actions
- **Session tags** for attribute-based access control
- **VPC endpoint restrictions** (`aws:SourceVpce`) - API calls must come through our VPC endpoints
- **Region restrictions** (`aws:RequestedRegion`) - ensure operations only happen in approved regions

Also, every policy needs explicit deny statements for:

- Operations in unauthorized AWS regions (we only use us-east-1 for most things)
- High-risk actions (like deleting CloudTrail logs, disabling encryption, making S3 buckets public)

Example policy structure we're looking for:

```
{
  "Effect": "Allow",
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::financial-data/*",
  "Condition": {
    "IpAddress": {"aws:SourceIp": "10.0.0.0/8"},
    "Bool": {"aws:MultiFactorAuthPresent": "true"},
    "StringEquals": {"aws:SourceVpce": "vpce-xxxxx"}
  }
}
```

### 2. Role Hierarchy with Separation of Duties

We need three main role types with clear boundaries:

**Developer Roles:**

- Full access to dev and staging environments
- Read-only access to production (for troubleshooting)
- Cannot modify IAM policies or security configurations
- Cannot access production databases directly
- Can deploy code through CI/CD only

**Operator Roles:**

- Infrastructure management in all environments
- Can modify compute, storage, networking resources
- Cannot change IAM policies or create new users
- Cannot access application data directly
- Require MFA for production changes

**Administrator Roles:**

- Full access to everything but with heavy restrictions
- Must use MFA (no exceptions)
- All actions logged and monitored
- Cannot disable logging or audit trails
- Session duration limited to 4 hours maximum

All roles must have:

- Session duration limits of maximum 4 hours (no long-lived sessions)
- Automatic session expiration
- Permission boundaries to prevent privilege escalation

### 3. Cross-Account Access Controls

We occasionally need to grant access to external auditors and partners. Set up cross-account roles that:

- Only allow access from specific, pre-approved AWS account IDs
- Require external ID validation to prevent confused deputy attacks
- Use session tagging to track who's accessing what
- Have time-limited sessions (maybe 2 hours for external access)
- Log everything to CloudWatch for auditing
- Include trust policies that look like:

```
{
  "Effect": "Allow",
  "Principal": {"AWS": "arn:aws:iam::123456789012:root"},
  "Action": "sts:AssumeRole",
  "Condition": {
    "StringEquals": {"sts:ExternalId": "unique-external-id"},
    "Bool": {"aws:MultiFactorAuthPresent": "true"}
  }
}
```

### 4. Password and Account Security Policies

Configure the AWS account password policy to meet financial industry standards:

- Minimum 14 characters
- Must include uppercase, lowercase, numbers, and symbols
- Password expiration every 90 days
- Cannot reuse last 12 passwords
- Account lockout after 3 failed login attempts
- Password reset requires MFA

### 5. Service-Specific IAM Roles

Create dedicated roles for our AWS services with minimal permissions:

**EC2 Instance Roles:**

- Allow EC2 to read configuration from Parameter Store
- Allow writing logs to CloudWatch
- Allow reading from specific S3 buckets
- Allow connecting to specific RDS databases
- Nothing else

**Lambda Execution Roles:**

- Scoped to specific functions and resources they need
- Read-only where possible
- Write access only to necessary destinations
- X-Ray tracing permissions
- CloudWatch Logs write permissions

**RDS Enhanced Monitoring Roles:**

- Permission to publish metrics to CloudWatch
- Nothing else

Important: We need to explicitly define service-linked roles rather than letting AWS auto-create them (for better control and auditing).

### 6. S3 Bucket Policies with VPC Restrictions

Our S3 buckets contain sensitive financial data. The bucket policies need to:

- Deny all access unless it comes through our VPC endpoints
- Deny any unencrypted uploads
- Deny public access (use explicit deny statements)
- Require MFA for delete operations
- Implement time-based access restrictions (maybe only allow certain operations during business hours)

Example bucket policy structure:

```
{
  "Effect": "Deny",
  "Principal": "*",
  "Action": "s3:*",
  "Resource": "arn:aws:s3:::financial-data/*",
  "Condition": {
    "StringNotEquals": {"aws:SourceVpce": "vpce-xxxxx"}
  }
}
```

### 7. Time-Based Access Controls

We need the ability to grant elevated privileges that automatically expire. For example:

- A developer needs production access for 2 hours to troubleshoot an issue
- After 2 hours, their access automatically revokes
- An operator gets emergency admin access for 1 hour
- Access is logged and can't be extended without re-approval

Implement this using:

- IAM policies with time-based conditions
- Maybe a Lambda function that removes policy attachments after expiration
- Session policies that limit duration
- CloudWatch Events to trigger automatic revocation

### 8. CloudWatch Monitoring and Alerting

Set up comprehensive monitoring for all IAM activity:

**Events to Monitor:**

- Any IAM policy changes
- Role assumption (especially cross-account)
- Failed authentication attempts
- MFA bypass attempts
- Administrative actions in production
- Access to sensitive resources
- Policy modifications
- User/role creation or deletion

**Alerting Requirements:**

- CloudWatch Events rules triggering on security events
- SNS notifications to security team
- Lambda functions for automated response to certain violations
- Metrics and dashboards showing security posture
- Integration with our SIEM

**Log Retention:**

- CloudWatch Logs kept for 90 days minimum
- CloudTrail logs kept for 7 years (compliance requirement)
- All logs encrypted

### 9. Modular Terraform Architecture

We want this to be reusable and maintainable, so please structure it as Terraform modules:

**Modules we need:**

- `iam-policy-template` - creates policies with standard conditions
- `iam-role` - creates roles with trust policies and permission boundaries
- `cross-account-role` - handles external account access
- `s3-secure-bucket` - creates S3 buckets with proper policies

Each module should be parameterized so we can use it across dev, staging, and production with different values.

**Variables to expose:**

- List of allowed IP ranges
- Business hours for time-based restrictions
- Session duration limits
- External account IDs for cross-account access
- VPC endpoint IDs
- Environment name (dev/staging/prod)

### 10. Regional Restrictions

We're only approved to operate in us-east-1 (with some exceptions for global services). Implement explicit deny rules that prevent operations in other regions:

```
{
  "Effect": "Deny",
  "Action": "*",
  "Resource": "*",
  "Condition": {
    "StringNotEquals": {
      "aws:RequestedRegion": ["us-east-1"]
    }
  }
}
```

Allow exceptions for global services like IAM, CloudFront, and Route53 that don't have regional endpoints.

## Mandatory Security Constraints - No Exceptions

These are non-negotiable requirements:

1. All IAM policies must use condition blocks with at least 3 different condition keys
2. Cross-account access restricted to specific external account IDs only
3. All roles have session duration limits of maximum 4 hours
4. MFA required for all administrative actions
5. Access logging enabled with CloudWatch integration
6. Password policy enforces 14-character minimum with complexity requirements
7. Service-linked roles explicitly defined rather than auto-created
8. All policies include explicit deny statements for unauthorized regions
9. Resource-based policies implement time-based access restrictions

## What We Need From You - Terraform HCL Code

Please create complete Terraform configuration with:

**Main Configuration Files:**

- `versions.tf` (Terraform >= 1.5, AWS provider >= 5.x)
- `providers.tf` (AWS provider with default tags)
- `variables.tf` (all configurable parameters)
- `iam-policies.tf` (custom policies with conditions)
- `iam-roles-developer.tf` (developer role definitions)
- `iam-roles-operator.tf` (operator role definitions)
- `iam-roles-administrator.tf` (admin role definitions)
- `iam-roles-service.tf` (EC2, Lambda, RDS service roles)
- `iam-cross-account.tf` (cross-account role configurations)
- `iam-password-policy.tf` (account password policy)
- `s3-bucket-policies.tf` (S3 resource-based policies)
- `cloudwatch-monitoring.tf` (IAM event monitoring and alerting)
- `outputs.tf` (role ARNs and policy references)

**Terraform Modules:**

- `modules/iam-policy-template/` (reusable policy creation)
- `modules/iam-role/` (standardized role creation)
- `modules/cross-account-role/` (cross-account access)
- `modules/s3-secure-bucket/` (S3 with security policies)

**Policy Examples:**
Include example policies demonstrating:

- Multi-condition access controls
- Time-based restrictions
- MFA requirements
- Regional restrictions
- VPC endpoint requirements

**Documentation:**
Comprehensive README.md covering:

- Architecture overview and security principles
- How the role hierarchy works
- Step-by-step deployment instructions
- How to add new users to specific roles
- Cross-account access setup procedures
- Emergency access procedures (break glass)
- Condition key reference guide
- Compliance mapping (which controls meet which requirements)
- Troubleshooting common IAM issues
- How to test policies with IAM Policy Simulator

## Testing and Validation

Include guidance on:

- Testing policies with IAM Policy Simulator before deploying
- Validating least-privilege with IAM Access Analyzer
- Testing cross-account access with external IDs
- Verifying MFA enforcement
- Testing time-based expiration
- Security scanning the Terraform code (checkov, tfsec)

## Important Design Considerations

**Fail-Closed Security:**

- If any condition check fails, deny access
- Better to block legitimate access than allow unauthorized access
- Include deny statements as backup

**Audit Everything:**

- Every access decision should be logged
- Include context in logs (why was access granted/denied)
- Make logs searchable and analyzable

**Least Privilege:**

- Start with zero permissions
- Add only what's needed
- Use permission boundaries to prevent escalation
- Regularly review and tighten permissions

**Separation of Duties:**

- No single person should have all permissions
- Require multiple approvals for critical actions
- Different teams for different environments

**Assume Breach:**

- Design like someone already has compromised credentials
- Time-limited sessions limit damage
- MFA provides second factor of protection
- Monitoring catches suspicious activity

**Compliance First:**

- These are financial services regulations - we can't be flexible
- Document why each control exists
- Map controls to regulatory requirements
- Make it audit-ready

Make everything production-ready with comprehensive error handling, clear documentation, and security-first design throughout. This is going to be reviewed by our compliance team and external auditors, so it needs to be rock-solid!

```

```

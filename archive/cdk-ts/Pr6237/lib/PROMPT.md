# Zero-Trust Security Architecture for Multi-Department Data Platform

Hey team,

We're building out a zero-trust security architecture for our new multi-department data platform. The compliance and security folks have been on us for months about implementing proper access controls, and we finally got the budget approved. This is a big deal because we're handling financial data, marketing analytics, and customer PII across three departments, and right now the permissions are way too loose.

The platform needs to support Finance, Marketing, and Analytics departments, each with their own isolated resources but also with controlled cross-department data sharing. Think of it like building separate security zones where each department has full control over their own S3 buckets and DynamoDB tables, but we also need specific roles that allow limited read-only access across departments for approved collaboration scenarios.

Security is telling us we need external ID validation for any cross-account access, IP-based conditions on role assumptions, and MFA for anything touching sensitive data. They also want CloudWatch alarms watching for unusual IAM activity and AWS Config rules monitoring our policies. Basically, we need to make this bulletproof from both internal and external threats.

## What we need to build

Create a complete infrastructure solution using **CDK with TypeScript** that implements a zero-trust security model for a multi-department data analytics platform.

### Core Requirements

1. **Department-Specific IAM Roles**
   - IAM role for Finance department with full S3 and DynamoDB access to finance-prefixed resources
   - IAM role for Marketing department with full S3 and DynamoDB access to marketing-prefixed resources
   - IAM role for Analytics department with full S3 and DynamoDB access to analytics-prefixed resources
   - Each role scoped to only their department's resources using resource-level permissions

2. **Cross-Department Data Sharing Roles**
   - Finance-to-Marketing read-only role with access to specific S3 prefixes
   - Marketing-to-Analytics read-only role with access to aggregated data prefixes
   - Analytics-to-Finance read-only role for compliance reporting prefixes
   - All cross-department roles require external ID validation

3. **Lambda Execution Roles**
   - Separate Lambda execution roles for each department
   - Each role scoped to department-specific S3 buckets, DynamoDB tables, and CloudWatch log groups
   - Read-only Lambda role for cross-department data access
   - All Lambda roles include CloudWatch Logs write permissions

4. **CloudWatch Log Groups with Encryption**
   - Dedicated KMS key for CloudWatch log encryption
   - Log groups for each department with proper retention policies
   - Separate log groups for Lambda functions by department
   - All log data encrypted at rest using KMS

5. **S3 Bucket Policies**
   - Require SSL/TLS for all S3 access (deny non-SSL requests)
   - Deny access to principals outside the trusted AWS accounts
   - Enforce object ownership controls
   - Require encryption for all objects at rest

6. **STS Assume Role Policies**
   - External ID validation required for all role assumptions
   - IP-based conditions allowing access only from corporate CIDR ranges
   - Session duration limited to 1 hour maximum
   - MFA required for roles accessing sensitive data classifications

7. **CloudWatch Alarms for Security Monitoring**
   - Alarm for unauthorized API calls detected
   - Alarm for IAM policy changes
   - Alarm for root account usage
   - Alarm for failed console login attempts
   - Alarm for S3 bucket policy changes

8. **AWS Config Rules**
   - Rule monitoring IAM password policy compliance
   - Rule checking for overly permissive IAM policies
   - Rule monitoring MFA enablement on IAM users
   - Rule checking S3 bucket encryption settings
   - Rule validating CloudTrail is enabled

9. **SNS Topics for Security Alerts**
   - SNS topic for critical security events
   - SNS topic for compliance violations
   - Subscription filters routing high-severity alerts to security team
   - Email subscriptions for on-call rotation

10. **Resource Tagging Standards**
    - Department tag (Finance, Marketing, Analytics)
    - Environment tag (derived from environmentSuffix context parameter)
    - DataClassification tag (Public, Internal, Confidential, Restricted)
    - All resources must include these tags for compliance

### Technical Requirements

- All infrastructure defined using **CDK with TypeScript**
- Use **IAM** roles, policies, and permission boundaries
- Use **S3** buckets with secure policies
- Use **DynamoDB** tables for department data stores
- Use **Lambda** functions with least-privilege execution roles
- Use **KMS** for encryption key management
- Use **CloudWatch** for logging, metrics, and alarms
- Use **AWS Config** for compliance monitoring
- Use **SNS** for alerting and notifications
- Use **CloudTrail** integration for audit logging
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** context parameter for uniqueness across environments
- Follow naming convention: resource-department-${environmentSuffix}
- All resources must be fully destroyable (no Retain deletion policies)

### Security Constraints

- Implement least privilege principle for all IAM policies
- Require external ID validation for cross-account assume role scenarios
- Limit session duration to maximum 1 hour for assumed roles
- Require MFA for roles accessing Confidential or Restricted data
- Encrypt all data at rest using KMS customer-managed keys
- Encrypt all data in transit (require SSL/TLS connections)
- Implement IP-based conditions restricting role assumptions to corporate network (10.0.0.0/8)
- Deny all access to S3 buckets unless from trusted principals
- Enable versioning and logging on all S3 buckets
- Set CloudWatch log retention to minimum 90 days for compliance

### Compliance Requirements

- All resources must be tagged with Department, Environment, and DataClassification
- Enable AWS Config rules for continuous compliance monitoring
- CloudTrail integration for all API activity auditing
- CloudWatch alarms must trigger SNS notifications for security events
- IAM policies must follow organizational security baseline
- No wildcard permissions in production IAM policies
- Regular access reviews enabled through detailed IAM policy structure

## Success Criteria

- **Functionality**: All three departments can access their own resources, controlled cross-department access works with external ID validation
- **Security**: Zero-trust model enforced, least privilege IAM policies, all encryption requirements met
- **Monitoring**: CloudWatch alarms detecting security events, AWS Config rules monitoring compliance
- **Reliability**: Session handling with 1-hour expiration works correctly, MFA enforcement operational
- **Compliance**: All resources properly tagged, audit logging enabled, retention policies configured
- **Resource Naming**: All resources include environmentSuffix for environment isolation
- **Code Quality**: TypeScript, comprehensive unit tests, well-documented

## What to deliver

- Complete CDK TypeScript implementation in lib/tap-stack.ts
- IAM roles and policies for three departments
- Cross-department data sharing roles with external ID validation
- Lambda execution roles scoped by department
- KMS key for CloudWatch log encryption
- CloudWatch log groups with encryption and retention
- S3 bucket policies requiring SSL and denying unauthorized access
- STS assume role trust policies with IP conditions and external ID
- CloudWatch alarms for security monitoring
- AWS Config rules for compliance checks
- SNS topics for security alerting
- Proper resource tagging on all components
- Unit tests validating IAM policy permissions
- Comprehensive documentation in lib/README.md
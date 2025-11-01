Hey team,

We need to build a security-hardened S3 data lake infrastructure for our financial services company. The security team has been pushing for a comprehensive solution that provides encrypted storage, granular access controls, and full audit trails for compliance requirements. I've been asked to create this infrastructure using Pulumi with TypeScript, and we need to make sure we follow industry best practices for financial data protection.

The business wants a data lake that can serve multiple teams - data analysts, data engineers, and data administrators - each with different levels of access. Security is paramount here, so every aspect needs to be locked down. We're talking server-side encryption with customer-managed keys, versioning for data protection, lifecycle management to optimize storage costs, and comprehensive logging for audit trails.

One of the key requirements from the security team is that we need to support cross-account access for a trusted AWS account, which will allow our partner teams to collaborate on certain datasets. But we also need to enforce strict security controls like HTTPS-only access, MFA delete protection, and explicit resource ARNs in our IAM policies - no wildcards allowed in production.

## What we need to build

Create a secure data lake infrastructure using **Pulumi with TypeScript** for financial services data storage and access management.

### Core Requirements

1. **S3 Data Lake with Encryption**
   - Create S3 bucket with server-side encryption using AWS KMS customer-managed keys
   - Enable versioning for data protection and recovery
   - Configure lifecycle policies to transition objects to Glacier after 90 days
   - Enable MFA delete protection on the bucket
   - Block all public access settings
   - Configure S3 access logging to CloudWatch

2. **KMS Key Management**
   - Create customer-managed KMS keys for encryption
   - Enable automatic key rotation with annual schedule
   - Use same KMS key for S3 encryption and CloudWatch log encryption
   - Configure key policies for proper access control

3. **IAM Roles and Policies**
   - Create DataAnalyst role with read-only access to S3 data
   - Create DataEngineer role with read/write access to S3 data
   - Create DataAdmin role with full administrative access
   - Implement least-privilege principles with explicit resource ARNs
   - Set maximum session duration of 1 hour for all roles
   - Include conditions for source IP restrictions in all policies
   - Configure cross-account access for trusted AWS account (123456789012)

4. **S3 Bucket Policies**
   - Enforce encryption in transit (HTTPS only)
   - Deny unencrypted object uploads
   - Configure proper access controls for IAM roles
   - Support cross-account access requirements

5. **CloudWatch Logging**
   - Set up CloudWatch log groups for S3 access logging
   - Configure 30-day retention period for logs
   - Encrypt logs at rest using the same KMS key
   - Enable proper log group policies

6. **Resource Tagging and Naming**
   - Tag all resources with Environment, Department, and CostCenter tags
   - Resource names must follow pattern: {environment}-{service}-{resource-type}-{environmentSuffix}
   - Include **environmentSuffix** parameter in all resource names for uniqueness
   - Use consistent naming convention across all resources

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **S3** for data storage with encryption and versioning
- Use **KMS** for customer-managed encryption keys with rotation
- Use **IAM** for roles (DataAnalyst, DataEngineer, DataAdmin) with custom policies
- Use **CloudWatch** for log groups with 30-day retention
- Deploy to **ap-northeast-2** region
- Resource names must include **environmentSuffix** for uniqueness and environment identification
- Follow naming convention: `{environment}-{service}-{resource-type}-{suffix}`
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and logging

### Constraints

- All S3 operations must use HTTPS endpoints only
- KMS key rotation must be enabled with annual rotation schedule
- IAM policies must use explicit ARNs without wildcards for production resources
- S3 bucket must block all public access settings
- Each IAM role must have a maximum session duration of 1 hour (3600 seconds)
- CloudWatch logs must be encrypted at rest using the same KMS key
- All IAM policies must include conditions for source IP restrictions
- S3 lifecycle rules must include abort incomplete multipart uploads after 7 days
- Resource names must follow pattern: {environment}-{service}-{resource-type}-{random}
- Stack must export outputs as Pulumi stack references for cross-stack consumption
- Enable MFA delete protection on S3 bucket
- Cross-account access for AWS account 123456789012

### Security Requirements

- Server-side encryption mandatory for all S3 objects
- Customer-managed KMS keys with rotation enabled
- Least-privilege IAM policies with explicit resource ARNs
- No wildcard permissions in production IAM policies
- HTTPS-only access to S3 bucket
- MFA delete protection enabled
- All public access blocked on S3 bucket
- Source IP restrictions in IAM policy conditions
- Encrypted CloudWatch logs
- Comprehensive audit trail through S3 access logging

### Cost Optimization

- Use S3 Glacier for long-term storage (90+ days)
- Abort incomplete multipart uploads after 7 days
- 30-day log retention to balance compliance and cost
- Leverage lifecycle policies for automatic storage class transitions

## Success Criteria

- Functionality: Complete S3 data lake with encryption, versioning, and lifecycle policies
- Security: KMS-encrypted storage, HTTPS-only access, MFA delete protection, least-privilege IAM policies
- Access Control: Three IAM roles with granular permissions and cross-account access
- Compliance: CloudWatch logging with 30-day retention, comprehensive audit trails
- Reliability: Versioning enabled, lifecycle management, proper error handling
- Resource Naming: All resources include environmentSuffix following the naming pattern
- Code Quality: Clean TypeScript code, well-tested, properly documented
- Outputs: Role ARNs and bucket name exported for cross-stack consumption

## What to deliver

- Complete Pulumi TypeScript implementation
- S3 bucket with encryption, versioning, lifecycle policies, and MFA delete protection
- Customer-managed KMS key with automatic rotation
- Three IAM roles (DataAnalyst, DataEngineer, DataAdmin) with custom policies
- S3 bucket policies enforcing HTTPS-only access
- CloudWatch log groups for S3 access logging with encryption
- Cross-account access configuration for account 123456789012
- Proper resource tagging (Environment, Department, CostCenter)
- Stack outputs for role ARNs and bucket name
- Unit tests for all components
- Documentation and deployment instructions

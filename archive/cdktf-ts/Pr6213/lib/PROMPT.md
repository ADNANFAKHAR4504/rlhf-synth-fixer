# Security-Hardened Payment Processing Infrastructure

Hey team,

We need to build a comprehensive security infrastructure for our payment processing application that meets PCI-DSS compliance requirements. This is critical infrastructure for a financial services company, so everything needs to be locked down tight with proper encryption, access controls, and audit logging.

I've been asked to implement this using **CDKTF with TypeScript** to define all the security controls. The business is particularly concerned about meeting regulatory requirements while maintaining operational flexibility across multiple AWS accounts.

The infrastructure will be deployed in ap-southeast-1 and needs to support separate security, audit, and production accounts. We need to ensure all data is encrypted at rest and in transit, with comprehensive monitoring to catch any compliance violations.

## What we need to build

Create a security-focused infrastructure using **CDKTF with TypeScript** that implements defense-in-depth security controls for a payment processing system.

### Core Requirements

1. **Encryption Key Management**
   - Create customer-managed KMS keys with automatic rotation enabled
   - Use multi-region key material for disaster recovery
   - Configure automated key rotation every 90 days
   - Separate KMS keys for different data types (S3 buckets vs CloudWatch logs)
   - Enable key policies that enforce least-privilege access

2. **Identity and Access Management**
   - Define IAM roles with assume role policies requiring MFA
   - Restrict role assumption to specific IP ranges
   - Implement least-privilege IAM policies with no wildcard actions or resources
   - Configure maximum session duration of 1 hour for all roles
   - Set up cross-account access roles with external ID requirements
   - Enforce MFA for sensitive operations

3. **Secure Storage**
   - Configure S3 buckets with server-side encryption using customer-managed KMS keys
   - Enable S3 bucket versioning for data protection
   - Implement MFA delete protection on buckets
   - Create bucket policies that explicitly deny unencrypted uploads
   - Enforce HTTPS-only access using aws:SecureTransport condition
   - Block all public access to buckets

4. **Audit Logging**
   - Set up CloudWatch log groups with KMS encryption
   - Configure log retention policies of 365 days for compliance
   - Use separate KMS keys for log encryption (different from S3 keys)
   - Ensure all security events are logged
   - Enable log integrity validation

5. **Compliance Monitoring**
   - Configure AWS Config rules to monitor encryption compliance
   - Set up automated compliance checks for all storage services
   - Create SNS topics for compliance violation alerts
   - Implement Config rules for MFA enforcement
   - Monitor IAM policy changes

6. **Service Control Policies**
   - Implement SCPs that prevent deletion of security resources
   - Require encryption for all storage services at the organization level
   - Block actions that could weaken security posture
   - Prevent disabling of security logging

### Technical Requirements

- All infrastructure defined using **CDKTF with TypeScript**
- Use **KMS** for encryption key management with automated rotation
- Use **IAM** for role-based access control with MFA enforcement
- Use **S3** for encrypted storage with versioning and MFA delete
- Use **CloudWatch Logs** for audit trails with 365-day retention
- Use **AWS Config** for compliance monitoring with automated rules
- Use **SNS** for real-time compliance violation alerts
- Use **Organizations** for service control policies across accounts
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-${environmentSuffix}`
- Deploy to **ap-southeast-1** region
- Support multi-account deployment (security, audit, production accounts)

### Constraints

- KMS keys must use multi-region configuration with 90-day rotation
- All IAM policies must follow least-privilege with explicit actions and resources
- S3 bucket policies must deny unencrypted uploads and non-HTTPS requests
- CloudWatch logs must use separate KMS keys from S3 for security isolation
- IAM roles limited to 1-hour sessions with mandatory MFA
- All resources must include mandatory tags: Environment, DataClassification, ComplianceScope
- Terraform state stored in encrypted S3 backend with DynamoDB locking
- Module outputs must not expose sensitive values (KMS keys, credentials)
- All resources must be destroyable (no Retain policies)
- Include proper error handling and validation

## Success Criteria

- **Security**: All data encrypted at rest and in transit with customer-managed keys
- **Compliance**: PCI-DSS requirements met with automated monitoring
- **Access Control**: Least-privilege IAM policies with MFA enforcement
- **Audit Trail**: 365-day log retention with integrity validation
- **Monitoring**: Real-time alerts for compliance violations
- **Multi-Account**: Cross-account access with external ID validation
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: TypeScript, modular design, well-tested, documented
- **Reusability**: Environment-specific variables for multi-account deployment

## What to deliver

- Complete CDKTF TypeScript implementation with modular architecture
- Separate constructs/modules for KMS, IAM, S3, and monitoring resources
- KMS module with multi-region keys and automated rotation
- IAM module with MFA-enforced roles and least-privilege policies
- S3 module with encryption, versioning, and secure access policies
- Monitoring module with Config rules, CloudWatch logs, and SNS alerts
- Organizations SCP definitions for account-level security enforcement
- Data sources for cross-module resource references
- Output definitions for cross-module integration (ARNs, IDs)
- Comprehensive tagging strategy implementation
- Unit tests for all infrastructure components
- Documentation covering deployment and configuration
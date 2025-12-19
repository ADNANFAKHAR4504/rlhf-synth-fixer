# Security Foundation Infrastructure

Hey team,

I've been working with our financial services client who needs to establish a rock-solid security foundation for their AWS infrastructure. They're in a heavily regulated industry, so compliance isn't optional here - it's everything. The security team has been very clear that they want zero-trust principles baked into the foundation from day one, with comprehensive key management and granular access controls throughout.

The challenge is that they're starting fresh and need automated security controls that will enforce encryption, proper access patterns, and full audit capabilities across all their future workloads. They've mandated that we follow zero-trust principles with separation of duties for key management, and they need everything trackable and auditable.

I've been asked to create this using **CloudFormation with json** - that's the standard they've chosen for consistency across their organization.

## What we need to build

Create a security-first infrastructure foundation using **CloudFormation with json** that establishes automated compliance controls and zero-trust security principles for a multi-account AWS environment.

### Core Requirements

1. **Key Management Service (KMS) Setup**
   - Create a customer-managed KMS key with automatic rotation enabled
   - Configure key alias 'security/primary' for easy reference
   - Implement resource-based policy on the key allowing only tagged principals with Environment=Production
   - Key policy must enforce separation of duties between key administrators and key users
   - Must export KMS key ARN for cross-stack references

2. **Secrets Management**
   - Deploy Secrets Manager secret for database credentials encrypted with the KMS key
   - Configure automatic rotation every 30 days
   - Rotation Lambda must run in isolated environment with no internet access

3. **IAM Roles and Cross-Account Access**
   - Define IAM role with AssumeRolePolicyDocument allowing only specific AWS account (123456789012) to assume
   - Create cross-account IAM role for security scanning with external ID requirement
   - External IDs must be minimum 32 characters long and unique
   - Must export IAM role ARNs for cross-stack references

4. **IAM Policies and Enforcement**
   - Implement IAM policy enforcing S3 bucket encryption with customer KMS keys only
   - All IAM policies must use explicit deny statements for prohibited actions
   - Implement SCPs-like IAM boundary policy preventing EC2 instance launch without encryption
   - IAM policies must explicitly deny access from non-approved IP ranges (10.0.0.0/8)

5. **Security Auditor Access**
   - Create IAM group 'SecurityAuditors' with read-only access to CloudTrail and Config
   - Follow least-privilege principles for all permissions

6. **Password Policy**
   - Set up IAM password policy requiring 14+ characters minimum
   - Require uppercase, lowercase, numbers, and symbols
   - Enforce strong password requirements organization-wide

### Technical Requirements

- All infrastructure defined using **CloudFormation with json**
- Use **KMS** for encryption key management with automatic rotation
- Use **Secrets Manager** for credential storage and rotation
- Use **IAM** for granular access controls and policies
- Deploy to **us-east-1** region
- All resource names must follow pattern: CompanyName-Environment-ResourceType-Purpose
- All resource names must include **environmentSuffix** parameter for uniqueness across deployments
- Resource tags must include CostCenter, DataClassification, and Owner as mandatory fields
- Template must use Conditions to enable/disable features based on environment parameter
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and validation

### Constraints

- All IAM policies must use explicit deny statements for prohibited actions
- KMS key policy must enforce separation of duties between key administrators and users
- Secrets rotation Lambda must run in isolated environment with no internet access
- IAM roles must have unique external IDs with minimum 32 characters
- All resource names must follow pattern: CompanyName-Environment-ResourceType-Purpose
- CloudFormation stack must export KMS key ARN and IAM role ARNs for cross-stack references
- IAM policies must explicitly deny access from non-approved IP ranges (10.0.0.0/8)
- Resource tags must include CostCenter, DataClassification, and Owner as mandatory
- Template must use Conditions to enable/disable features based on environment parameter
- Target account ID: 123456789012 for cross-account access patterns
- No VPC required - these are account-level security resources

### Optional Enhancements

If time permits, consider adding:
- Config rules for continuous compliance monitoring (automates compliance checks)
- GuardDuty for threat detection (adds real-time security monitoring)
- Security Hub custom controls (centralizes security findings)

## Deployment Requirements (CRITICAL)

- All resource names MUST include **environmentSuffix** parameter for deployment uniqueness
- Follow naming convention: CompanyName-Environment-ResourceType-Purpose-environmentSuffix
- All resources MUST be destroyable - use RemovalPolicy: DESTROY or DeletionPolicy: Delete
- FORBIDDEN: Any DeletionPolicy: Retain or RemovalPolicy: RETAIN
- All Lambda functions must use Node.js 18+ runtime (AWS SDK v3 available by default)
- GuardDuty: Do NOT create GuardDuty detector - it's account-level and only one allowed per account
- AWS Config: Use managed policy arn:aws:iam::aws:policy/service-role/AWS_ConfigRole for IAM role

## Success Criteria

- Functionality: All 9 mandatory requirements fully implemented and functional
- Security: Zero-trust principles with separation of duties enforced
- Compliance: All constraints met including naming patterns, tagging, IP restrictions
- Key Management: KMS key with rotation, proper policies, and tagged access control
- Access Control: Cross-account roles with external IDs, boundary policies, audit groups
- Reliability: Secrets rotation working, proper error handling throughout
- Resource Naming: All resources include environmentSuffix and follow naming pattern
- Exportability: KMS key ARN and IAM role ARNs exported for cross-stack usage
- Code Quality: Valid CloudFormation json, well-structured, properly documented

## What to deliver

- Complete CloudFormation json implementation
- KMS customer-managed key with rotation and alias
- Secrets Manager secret with 30-day rotation
- IAM roles, policies, groups, and password policy
- Cross-account access with external ID validation
- Template parameters for environment and company name
- Proper conditions for feature toggling
- Stack outputs exporting key ARNs
- Clear documentation and deployment instructions

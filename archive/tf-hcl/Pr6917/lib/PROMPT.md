Hey team,

We need to build a comprehensive multi-account security framework for our financial services company. The business is implementing a zero-trust security architecture to meet PCI-DSS compliance requirements, and we need centralized encryption key management across all accounts. This is a critical security initiative that will form the foundation of our cloud security posture.

The security team has been clear that we need granular access controls, mandatory encryption for all sensitive data, and a robust audit trail. We're dealing with financial data here, so there's no room for shortcuts. Everything needs to be encrypted at rest with customer-managed keys, and those keys need automatic rotation to meet compliance requirements.

## What we need to build

Create a multi-account security infrastructure using **Terraform with HCL** that implements enterprise-grade security controls, centralized key management, and comprehensive audit capabilities across our AWS organization.

### Core Requirements

1. **Cross-Account IAM Roles**
   - Deploy cross-account IAM roles for security audit access
   - Enforce MFA for all AssumeRole operations
   - Implement least-privilege access patterns
   - No wildcard permissions except for read-only actions

2. **KMS Multi-Region Key Management**
   - Implement KMS customer-managed keys with multi-region support
   - Configure automatic annual key rotation
   - Use AES-256 encryption standard
   - Deploy primary keys in us-east-1 and replica keys in eu-west-1

3. **IAM Security Policies**
   - Restrict root user actions across all accounts
   - Enforce mandatory resource tagging compliance
   - Implement least-privilege access patterns throughout
   - Create security audit role with read-only access but no modification permissions

4. **CloudWatch Logging**
   - Set up CloudWatch Logs for all IAM activity
   - Configure 90-day retention period for audit logs

5. **AWS Config Compliance**
   - Enable AWS Config rules for security compliance monitoring
   - Monitor encryption settings for S3, EBS, and RDS
   - Track compliance with organizational security standards
   - Use correct IAM managed policy: service-role/AWS_ConfigRole

6. **State File Encryption**
   - All Terraform state files must be encrypted using KMS customer-managed keys
   - Configure S3 backend with encryption enabled
   - Implement DynamoDB state locking

### Optional Enhancements

If time permits, consider adding:
- GuardDuty for threat detection across accounts (Note: GuardDuty is account-level, do not create detectors in IaC)
- Security Hub for centralized security findings
- EventBridge rules for automated security alerting

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **IAM** for cross-account roles and policies
- Use **KMS** for encryption key management with multi-region support
- Use **CloudWatch Logs** for audit trail
- Use **AWS Config** for compliance monitoring
- Deploy to **us-east-1** (primary) and **eu-west-1** (secondary) regions
- Resource names must include **environment_suffix** for uniqueness
- Follow naming convention: resource-type-${var.environment_suffix}
- All resources must be destroyable (no deletion_protection = true, skip_final_snapshot = true for databases)

### Security Constraints

- All KMS keys must use AES-256 encryption with automatic annual rotation enabled
- Cross-account IAM roles must enforce MFA for all AssumeRole operations (require_mfa = true in assume role policy)
- No IAM policy can contain Resource: '*' except for read-only actions (s3:List*, s3:Get*, ec2:Describe*, etc.)
- Security audit role must have read-only access to all accounts but no modification permissions (no Put*, Create*, Delete*, Update* actions)

### Deployment Requirements (CRITICAL)

- All Terraform state files must be encrypted using KMS customer-managed keys
- S3 backend bucket must have encryption enabled with KMS
- All resource names must include environment_suffix variable for parallel deployment isolation
- All resources must be destroyable (no deletion_protection flags)
- Skip final snapshots for any database resources
- Do not create GuardDuty detectors in IaC (account-level limitation - one detector per account)
- AWS Config IAM role must use managed policy: arn:aws:iam::aws:policy/service-role/AWS_ConfigRole
- Include proper error handling and validation in Terraform code

## Success Criteria

- **Functionality**: All 6 mandatory requirements implemented and deployable
- **Security**: Zero-trust architecture with MFA enforcement, encryption at rest, least-privilege IAM
- **Compliance**: PCI-DSS compliant with audit trails, mandatory encryption, and access controls
- **Multi-Region**: KMS keys replicated between us-east-1 and eu-west-1
- **Resource Naming**: All resources include environment_suffix for uniqueness
- **Destroyability**: All resources can be cleanly destroyed without manual intervention
- **Code Quality**: Clean HCL syntax, well-structured modules, comprehensive variables

## What to deliver

- Complete Terraform HCL implementation with all required resources
- Cross-account IAM roles with MFA enforcement
- KMS multi-region keys with automatic rotation
- IAM policies for root restriction and tagging compliance
- CloudWatch Logs configuration with 90-day retention
- AWS Config rules for compliance monitoring
- S3 backend configuration with KMS encryption for state files
- Comprehensive variables.tf with environment_suffix variable
- Clean, well-documented Terraform code ready for deployment

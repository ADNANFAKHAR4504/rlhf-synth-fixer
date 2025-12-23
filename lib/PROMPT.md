# Security Foundation Infrastructure

Hey team,

We need to build a comprehensive security foundation for a financial services company moving to AWS. They're in the process of implementing zero-trust security principles and need to comply with PCI-DSS requirements. The infrastructure must support multi-region operations with strict encryption and access controls.

I've been asked to create this using **Terraform with HCL** to establish the security baseline. This will be the foundation that all other teams build on top of, so it needs to be rock-solid and compliant from day one.

The business wants automated secret rotation, fine-grained access controls, and continuous compliance monitoring. They're particularly concerned about encryption key management across multiple regions and ensuring that no one can bypass security controls - including root account users.

## What we need to build

Create a security-first infrastructure foundation using **Terraform with HCL** that implements zero-trust principles for AWS infrastructure.

### Core Requirements

**1. Multi-Region Encryption Key Management**
- Create a KMS multi-region primary key in us-east-1
- Deploy replica keys in eu-west-1 and ap-southeast-1
- Enable automatic key rotation
- Configure key policy that restricts usage to specific IAM roles
- Explicitly deny aws:kms:Decrypt operations for root account
- Set deletion window to exactly 7 days

**2. Automated Secret Management**
- Deploy Secrets Manager secrets for database credentials
- Implement automatic rotation every 30 days using Lambda
- Use aws_secretsmanager_secret_version with ignore_changes lifecycle
- Lambda rotation function must validate secret format before rotation
- Python 3.9 runtime for rotation functions

**3. Fine-Grained IAM Access Controls**
- Implement IAM roles with session duration limits of 1 hour
- Enforce MFA for role assumption via aws:MultiFactorAuthPresent condition
- Follow least-privilege principle with no wildcard Resource statements
- All IAM policies must be specific and scoped

**4. VPC Endpoint Security**
- Configure resource-based policies denying all actions unless requests originate from specific VPC endpoints
- Create VPC endpoints for Secrets Manager, KMS, and EC2 services

**5. Data Classification and Tagging**
- Create standardized data classification tags: PII, Confidential, Public
- All resources must include these classification tags
- Resource names must include environmentSuffix for uniqueness
- Follow naming pattern: environment-service-purpose-environmentSuffix

**6. Service Control Policies**
- Implement SCPs preventing root account usage
- Enforce encryption requirements organization-wide
- Requires AWS Organizations enabled

**7. Logging and Monitoring**
- Configure CloudWatch Logs with encryption using customer-managed KMS keys
- Set log retention to 90 days
- Ensure all logs are encrypted at rest

**8. Compliance Monitoring**
- Set up AWS Config rules to monitor encryption compliance
- Create at least 5 custom rules using AWS Config Rule DSL
- Configure audit account for Config aggregation

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use Terraform 1.5+ and AWS provider 5.x
- Deploy primarily to us-east-1 region
- Use KMS for encryption with multi-region keys
- Use Secrets Manager for credential storage
- Use Lambda with Python 3.9 for secret rotation
- Use AWS Config for compliance monitoring
- Use CloudWatch Logs for centralized logging
- Resource names must include environmentSuffix parameter for uniqueness
- All resources must have prevent_destroy lifecycle rule
- Organization-level setup with AWS Organizations required

### Constraints and Requirements

**Mandatory Constraints:**
- KMS keys: deletion window exactly 7 days, automatic rotation enabled
- Secrets Manager: use ignore_changes lifecycle for secret versions
- IAM roles: session duration 1 hour max, MFA enforcement required
- IAM policies: no wildcard Resource patterns allowed, must be specific
- KMS key policies: must explicitly deny root account decrypt operations
- Lambda validation: rotation functions must validate secret format
- AWS Config: minimum 5 custom rules required
- Lifecycle rules: all Terraform resources must have prevent_destroy
- Naming convention: environment-service-purpose-environmentSuffix

**Security Requirements:**
- All data encrypted at rest using customer-managed KMS keys
- All data encrypted in transit
- MFA enforcement for privileged operations
- VPC endpoint restrictions for service access
- Root account usage prevention via SCPs
- Least-privilege access controls throughout

**Deployment Requirements - CRITICAL:**
- All resources must be destroyable 
- Resource names MUST include environmentSuffix for uniqueness
- Use random provider for generating unique suffixes
- Include validation commands in outputs using AWS CLI

### Optional Enhancements

If time permits, consider adding:
- GuardDuty for real-time threat detection - NOTE: One detector per account limit
- Security Hub for centralized compliance dashboards
- Systems Manager Parameter Store for non-rotating configuration values

## Success Criteria

**Functionality:**
- Multi-region KMS keys successfully replicate
- Secrets automatically rotate every 30 days
- IAM roles enforce MFA and session limits
- VPC endpoint policies restrict service access
- SCPs prevent root account usage

**Security:**
- All encryption uses customer-managed keys
- No wildcard Resource patterns in IAM policies
- Root account explicitly denied decrypt operations
- All resources properly tagged with classification
- Compliance rules detect violations

**Reliability:**
- Lambda rotation functions include error handling
- Config rules actively monitor compliance
- CloudWatch Logs retain 90 days
- All resources include prevent_destroy lifecycle

**Code Quality:**
- Modular Terraform HCL structure
- Proper variable definitions and outputs
- Validation commands included in outputs
- Well-documented configuration files

## What to deliver

- Complete Terraform HCL implementation with modular structure
- KMS multi-region key configuration : us-east-1, eu-west-1, ap-southeast-1
- Secrets Manager with Lambda rotation functions using Python 3.9
- IAM roles and policies following least-privilege
- VPC endpoints with resource-based policies
- Service Control Policies for organization-level controls
- CloudWatch Logs with KMS encryption
- AWS Config rules for compliance monitoring
- Validation commands in outputs for verifying security controls
- All files in lib/ directory following Terraform best practices

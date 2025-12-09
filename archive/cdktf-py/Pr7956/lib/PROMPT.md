# Zero Trust Security Framework for AWS

Hey team,

We need to build a comprehensive Zero Trust security framework for our AWS infrastructure. I've been asked to create this using **CDKTF with Python**. The financial services company I'm working with has identified critical gaps in their security posture, and we need to address network segmentation, IAM permissions, and encryption through infrastructure-as-code.

This is a complex multi-service architecture that will establish security controls across their AWS accounts.

## What We Need to Build

Create a Zero Trust security framework using **CDKTF with Python** that implements comprehensive security controls for AWS infrastructure. The configuration must:

1. Define VPC endpoints for all AWS services to eliminate internet-bound traffic.
2. Create IAM roles with external ID requirements and MFA enforcement for cross-account access.
3. Implement S3 bucket policies with explicit deny rules for unencrypted uploads and public access.
4. Configure AWS Config rules to monitor for non-compliant resources including unencrypted EBS volumes and publicly accessible RDS instances.
5. Set up GuardDuty with custom threat intelligence feeds and EventBridge rules for automated response.
6. Create KMS keys with granular key policies restricting usage to specific services and principals.
7. Deploy VPC Flow Logs with Athena tables for security analysis queries.
8. Configure Security Hub custom insights to track critical security findings.
9. Implement service control policies (SCPs) to prevent disabling of security services.
10. Create CloudWatch alarms for suspicious API activities like privilege escalation attempts.

## Expected Output

A modular Terraform configuration with separate files for each security domain (iam.tf, kms.tf, vpc.tf, monitoring.tf, compliance.tf) that can be deployed across multiple AWS accounts. The solution should include data sources for existing resources and outputs for integration with SIEM systems.

## Background

A financial services company needs to implement Zero Trust security architecture for their AWS infrastructure hosting sensitive customer data. Recent compliance audits have identified gaps in network segmentation, IAM permissions, and encryption policies that must be addressed through infrastructure-as-code to ensure consistent security posture across all environments.

## Environment

Zero Trust security architecture deployed in us-east-1 with multi-account AWS Control Tower setup. Core services include AWS Security Hub for centralized security findings, GuardDuty for threat detection, AWS Config for compliance monitoring, and Systems Manager for secure access. VPC spans 3 availability zones with private subnets only, no internet gateways. Transit Gateway connects to on-premises data center. Requires Terraform 1.5+, AWS Provider 5.x. Security account serves as delegated administrator for security services across the organization.

## Technical Requirements

All infrastructure must be defined using **CDKTF with Python** and deploy to the **us-east-1** region.

### AWS Services Required

- **VPC**: Private subnets spanning 3 availability zones, VPC endpoints for all AWS services
- **IAM**: Roles with external ID and MFA enforcement for cross-account access
- **S3**: Buckets with policies denying unencrypted uploads and public access
- **AWS Config**: Rules monitoring unencrypted EBS volumes and publicly accessible RDS
- **GuardDuty**: Threat detection (DO NOT create detector - account-level resource exists)
- **KMS**: Keys with granular policies restricting usage to specific services/principals
- **VPC Flow Logs**: With Athena tables for security analysis
- **Security Hub**: Custom insights tracking critical security findings
- **CloudTrail**: Log file validation and S3 object lock enabled
- **CloudWatch**: Alarms for suspicious API activities and privilege escalation
- **WAF**: Rate-based rules and IP reputation lists
- **Systems Manager**: Session Manager for bastion-less access

### Deployment Requirements (CRITICAL)

- **Resource Naming**: All resources must include **environmentSuffix** for uniqueness
  - Pattern: `{resource-type}-${environment_suffix}` (e.g., `security-bucket-dev`)
  - This enables parallel deployments without conflicts
- **Destroyability**: All resources must be destroyable
  - NO RemovalPolicy.RETAIN or equivalent retention policies
  - NO DeletionProtection on any resources
  - Database snapshots: skipFinalSnapshot = true
  - S3 buckets: Must be deletable (remove forceDestroy = false if present)
- **GuardDuty Limitation**: Do NOT create GuardDuty detector - it's an account-level resource (one per account/region)
- **AWS Config IAM**: Use managed policy `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole`

## Constraints

- Enable AWS CloudTrail with log file validation and S3 object lock
- Implement VPC Flow Logs with CloudWatch Logs analysis
- Enable AWS Config rules for continuous compliance monitoring
- GuardDuty threat intelligence feeds (reference existing detector, do not create)
- Use AWS Systems Manager Session Manager for bastion-less access
- Implement least-privilege IAM roles with session-based temporary credentials
- Implement AWS WAF with rate-based rules and IP reputation lists
- Use AWS KMS with automatic key rotation for all encryption needs
- Use AWS Security Hub with custom compliance standards enabled

## Success Criteria

- **Functionality**: All 10 Zero Trust requirements implemented
- **Modularity**: Separate files for each security domain (vpc.py, iam.py, security.py, etc.)
- **Compliance**: All constraints met (CloudTrail, Config, WAF, KMS, etc.)
- **Resource Naming**: All resources include environmentSuffix parameter
- **Destroyability**: All resources can be deleted without manual intervention
- **Code Quality**: Well-documented Python code with type hints
- **Testing**: 100% test coverage with unit and integration tests
- **Documentation**: Complete deployment instructions and architecture explanation

## What to Deliver

- Complete CDKTF Python implementation with modular structure:
  - `lib/vpc.py` - VPC, subnets, VPC endpoints
  - `lib/iam.py` - IAM roles with MFA/external ID
  - `lib/security.py` - Security Hub, Config rules (GuardDuty reference only)
  - `lib/encryption.py` - KMS keys with granular policies
  - `lib/monitoring.py` - CloudTrail, VPC Flow Logs, CloudWatch alarms
  - `lib/waf.py` - AWS WAF configuration
  - `lib/compliance.py` - Service control policies
  - `lib/tap_stack.py` - Main stack orchestrator
- Unit tests for all components
- Integration tests validating deployed infrastructure
- IMPLEMENTATION.md with deployment instructions
- Outputs for SIEM system integration

Hey team,

We need to implement a comprehensive zero-trust security architecture for sensitive data processing workloads on AWS. I've been asked to create this in HCL using Terraform. The business is handling highly sensitive data and requires multiple layers of security controls that follow zero-trust principles - essentially, never trust, always verify.

The architecture needs to implement defense in depth with network segmentation, strict identity controls, end-to-end encryption, and continuous monitoring. We're talking about a production-grade security posture that meets enterprise compliance requirements while still being manageable and cost-effective.

This is a complex setup, so we need to make sure everything is properly configured with unique resource names and that all resources can be destroyed cleanly after testing.

## What we need to build

Create a zero-trust security architecture using **Terraform with HCL** for sensitive data processing on AWS.

### Core Requirements

1. **Network Segmentation and Isolation**
   - Private VPC with multiple isolated subnets across availability zones
   - Security groups with least-privilege ingress/egress rules
   - Network ACLs for additional subnet-level protection
   - VPC Flow Logs for network traffic monitoring
   - No direct internet access - use VPC endpoints for AWS services

2. **Identity and Access Management**
   - IAM roles with least-privilege policies for all resources
   - IAM policies enforcing encryption and secure access patterns
   - No hardcoded credentials or long-lived access keys
   - Service-to-service authentication using IAM roles

3. **Encryption Everywhere**
   - KMS customer-managed keys for encryption at rest
   - Key rotation policies and proper key aliasing
   - S3 bucket encryption with KMS keys
   - Enforce encryption in transit for all data transfers
   - All data stored must be encrypted

4. **Data Protection and Storage Security**
   - S3 buckets with versioning enabled
   - S3 bucket policies enforcing encryption and secure transport
   - Block all public access to S3 buckets
   - S3 access logging for audit trails
   - Lifecycle policies for data retention

5. **Logging and Monitoring**
   - CloudTrail for API activity logging
   - CloudWatch log groups for centralized logging
   - CloudWatch metrics and alarms for security events
   - Log encryption using KMS
   - Retention policies for compliance

6. **Threat Detection and Response**
   - GuardDuty for intelligent threat detection (NOTE: GuardDuty detector is account-level, do not create if one already exists)
   - AWS Config for compliance monitoring with proper IAM role (use AWS managed policy: service-role/AWS_ConfigRole)
   - Security Hub for centralized security findings (if needed)
   - Automated alerting for security incidents

7. **Compute Security (if needed)**
   - EC2 instances in private subnets only
   - Systems Manager Session Manager for secure access (no SSH keys)
   - IMDSv2 enforcement for EC2 metadata
   - Security group restrictions

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **VPC** for network isolation with private subnets
- Use **KMS** for encryption key management
- Use **S3** with encryption and versioning for data storage
- Use **CloudTrail** for comprehensive API logging
- Use **CloudWatch** for logs, metrics, and alarms
- Use **IAM** roles and policies with least privilege
- Use **VPC Flow Logs** for network monitoring
- Use **GuardDuty** for threat detection (WARNING: account-level resource, do not create if already exists)
- Use **AWS Config** for compliance (use managed policy: service-role/AWS_ConfigRole)
- Resource names must include **var.environment_suffix** for uniqueness
- Follow naming convention: `resource-type-${var.environment_suffix}`
- Deploy to **us-east-1** region (configurable via variable)

### Deployment Requirements (CRITICAL)

1. **Resource Naming with environmentSuffix**
   - ALL named resources MUST include `var.environment_suffix` in their names
   - This ensures multiple environments can coexist without conflicts
   - Example: `bucket_name = "sensitive-data-${var.environment_suffix}"`
   - Example: `log_group_name = "/aws/security/${var.environment_suffix}"`

2. **Destroyability Requirement**
   - All resources MUST be destroyable via `terraform destroy`
   - NO DeletionProtection flags
   - NO prevent_destroy lifecycle rules
   - S3 buckets should use `force_destroy = true` for testing environments
   - This is critical for automated testing and cleanup

3. **Service-Specific Warnings**
   - GuardDuty: Only ONE detector per account - check if exists before creating
   - AWS Config: Use AWS managed IAM policy `service-role/AWS_ConfigRole`
   - CloudTrail: S3 bucket requires special bucket policy for CloudTrail service

4. **Variable Configuration**
   - Define `environment_suffix` as required variable (no default)
   - Define `aws_region` with default "us-east-1"
   - All other settings should have sensible defaults

### Constraints

- Must implement zero-trust security principles (never trust, always verify)
- Must use least-privilege access for all IAM permissions
- Must encrypt all data at rest and in transit
- All resources must be taggable for cost tracking and compliance
- No public internet access - use VPC endpoints
- Must handle sensitive data according to security best practices
- All resources must be cleanly destroyable for testing
- Include proper error handling and validation

## Success Criteria

- **Security Posture**: Multi-layered defense with network isolation, encryption, and access controls
- **Zero Trust**: No implicit trust - all access verified and authenticated
- **Compliance**: Comprehensive logging and monitoring for audit requirements
- **Encryption**: All data encrypted at rest (KMS) and in transit (TLS)
- **Monitoring**: CloudWatch alarms and GuardDuty active threat detection
- **Resource Naming**: All resources include var.environment_suffix for uniqueness
- **Destroyability**: Clean terraform destroy with no manual cleanup needed
- **Code Quality**: HCL best practices, modular design, well-documented

## What to deliver

- Complete Terraform HCL implementation with proper module structure
- VPC with private subnets, security groups, and network ACLs
- KMS keys with proper rotation policies
- S3 buckets with encryption, versioning, and access logging
- IAM roles and policies following least privilege
- CloudTrail, CloudWatch, and VPC Flow Logs configuration
- GuardDuty threat detection setup (with account-level warning)
- AWS Config compliance monitoring (with correct IAM policy)
- Variables file defining all configurable parameters
- Outputs file exposing key resource identifiers
- README with deployment instructions and architecture overview

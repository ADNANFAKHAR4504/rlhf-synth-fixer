# Zero-Trust IAM and KMS Infrastructure

Hey team,

We're working with a financial services company that needs to implement a zero-trust security model for their AWS infrastructure. They've been dealing with overly permissive IAM policies and unencrypted data at rest, which is a compliance nightmare. The security team has mandated strict separation of duties, proper encryption key management, and comprehensive audit trails for all privileged operations.

The core problem is establishing a robust role-based access control system with proper encryption key hierarchies. We need to ensure that every role follows least-privilege principles, enforce MFA for all role assumptions, and implement time-based access controls that prevent sensitive operations outside business hours. This is critical for their audit requirements and overall security posture.

We're tasked with building this infrastructure using Terraform with HCL for a multi-account AWS deployment. The solution needs to support production-grade financial services requirements with strict compliance controls.

## What we need to build

Create a comprehensive security infrastructure using **Terraform with HCL** that implements role-based access control with encryption key management for a zero-trust security model.

### Core Requirements

1. **IAM Role Structure**
   - Create three distinct IAM roles: SecurityAdmin, DevOps, and Auditor
   - Each role must have assume role policies requiring MFA authentication
   - Implement cross-account assume role permissions with external ID validation
   - Configure unique session name patterns for each role to enable proper attribution
   - Apply custom permission boundaries to service-linked roles for ECS and RDS

2. **KMS Key Hierarchy**
   - Implement separate KMS keys that integrate with IAM roles for application data and infrastructure secrets
   - Configure automatic key rotation with 365-day rotation period
   - Set up key policies that restrict encrypt/decrypt operations and connect to specific roles only
   - Enable encryption at rest for Terraform state that communicates with KMS

3. **Time-Based Access Controls**
   - Implement IAM policies with explicit deny statements for sensitive operations outside business hours
   - Configure session policies that trigger limitations on assumed role sessions to 1 hour maximum
   - Ensure all policies enforce least-privilege access patterns

4. **Audit and Compliance**
   - Create CloudWatch Log groups that collect and publish IAM activity with 90-day retention
   - Tag all resources with Owner, Environment, and CostCenter for cost attribution
   - Ensure all resources connect through STS to use temporary credentials

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **IAM** for role-based access control
- Use **KMS** for encryption key management
- Use **CloudWatch Logs** for audit trails
- Use **STS** for temporary credential generation
- Use **ECS** and **RDS** service-linked roles with permission boundaries
- All resource names must include environmentSuffix for uniqueness
- Follow naming convention with resource-type and environment_suffix pattern
- Deploy to **us-east-1** region

### Constraints

- All IAM policies must use explicit deny statements for actions outside business hours
- MFA must be enforced for all role assumptions without exceptions
- KMS keys must have automatic rotation enabled with 365-day rotation period
- No use of IAM user access keys - only temporary credentials via STS
- External ID for assume role must be at least 32 characters from random provider
- Permission boundaries must restrict access to us-east-1 region only
- CloudTrail must be excluded - use CloudWatch Logs for audit trails instead
- Each role must have a unique session name pattern for attribution
- All resources must be destroyable with no prevent_destroy lifecycle rules for testing
- Terraform state must be configured with encryption at rest using KMS

## Success Criteria

- **Functionality**: All three IAM roles properly configured with MFA-enforced assume role policies
- **Security**: KMS keys with automatic rotation and role-specific access policies
- **Compliance**: Time-based access controls preventing operations outside business hours
- **Auditability**: CloudWatch Logs capturing all IAM activity with 90-day retention
- **Naming Convention**: All resources include environmentSuffix for multi-environment support
- **Code Quality**: Modular Terraform HCL code, well-tested, fully documented

## What to deliver

- Complete Terraform HCL implementation
- Modular configuration with separate files for IAM roles, KMS keys, and policies
- IAM roles for SecurityAdmin, DevOps, and Auditor with MFA enforcement
- KMS key hierarchy for application data and infrastructure secrets
- Time-based IAM policies with business hours restrictions
- CloudWatch Log groups with 90-day retention
- Service-linked roles for ECS and RDS with permission boundaries
- Unit tests for all components
- Documentation and deployment instructions

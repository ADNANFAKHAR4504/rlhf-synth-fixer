# Task: Multi-Account Security Framework with Centralized Key Management

## Platform and Language
**MANDATORY**: Use **Terraform with HCL**

## Background
A financial services company needs to implement a zero-trust security architecture across their AWS multi-account structure. The security team requires centralized encryption key management and granular access controls that comply with PCI-DSS requirements. All sensitive data must be encrypted at rest using customer-managed keys with automatic rotation.

## Problem Statement
Create a Terraform configuration to implement a multi-account security framework with centralized key management.

## Mandatory Requirements (Must Complete)
1. Create an AWS Organizations structure with 3 OUs: Security, Production, and Development (CORE: Organizations)
2. Deploy cross-account IAM roles for security audit access with MFA enforcement (CORE: IAM)
3. Implement KMS multi-region keys with automatic rotation enabled (CORE: KMS)
4. Configure SCPs to enforce encryption for S3, EBS, and RDS across all accounts
5. Create IAM policies restricting root user actions and enforcing tagging compliance
6. Set up CloudWatch Logs for IAM activity with 90-day retention
7. Implement least-privilege access with no wildcard permissions in any policy
8. Enable AWS Config rules for security compliance monitoring

## Optional Enhancements (If Time Permits)
- Add GuardDuty for threat detection across accounts (OPTIONAL: GuardDuty) - improves threat visibility
- Implement Security Hub for centralized findings (OPTIONAL: Security Hub) - consolidates security posture
- Create EventBridge rules for security alerts (OPTIONAL: EventBridge) - enables automated response

## Environment
Multi-account AWS environment deployed across us-east-1 (primary) and eu-west-1 (secondary) regions. Requires AWS Organizations with 3 accounts minimum: management, security audit, and production. Uses KMS for centralized encryption key management, IAM for cross-account access controls, and CloudWatch Logs for audit trails. Terraform 1.5+ with AWS provider 5.x. Management account must have Organizations enabled. VPC not required for this security-focused deployment.

## Constraints
1. All KMS keys must use AES-256 encryption with automatic annual rotation
2. Cross-account IAM roles must enforce MFA for all AssumeRole operations
3. Service Control Policies must prevent disabling of CloudWatch Logs in any account
4. No IAM policy can contain Resource: '*' except for read-only actions
5. All Terraform state files must be encrypted using KMS customer-managed keys
6. Security audit role must have read-only access to all accounts but no modification permissions

## AWS Services Required
- Organizations
- IAM (Identity and Access Management)
- KMS (Key Management Service)

## Region
us-east-1 (primary), eu-west-1 (secondary)

## Critical Requirements
- ALL resource names MUST include `${var.environment_suffix}` to avoid collisions
- NO RemovalPolicy.RETAIN or deletion_protection = true
- Follow AWS best practices for security and compliance
- Implement proper error handling and logging
- Use appropriate tagging strategy

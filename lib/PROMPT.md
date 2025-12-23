# Task: Multi-Account Security Framework with Centralized Key Management

## Platform and Language
**MANDATORY**: Use **Terraform with HCL**

## Background
A financial services company needs to implement a zero-trust security architecture across their AWS multi-account structure. The security team requires centralized encryption key management and granular access controls that comply with PCI-DSS requirements. All sensitive data must be encrypted at rest using customer-managed keys with automatic rotation.

## Problem Statement
Create a Terraform configuration to implement a multi-account security framework with centralized key management.

## Mandatory Requirements (Must Complete)
1. Create an AWS Organizations structure with 3 OUs: Security, Production, and Development. The Organizations service provides the multi-account foundation that IAM roles will use to establish cross-account trust relationships for centralized security management.
2. Deploy cross-account IAM roles that connect to KMS customer-managed keys for decryption access when auditing encrypted resources. These roles must enforce MFA for all AssumeRole operations and integrate with CloudWatch Logs to capture all audit activity.
3. Implement KMS multi-region keys with automatic rotation enabled. These encryption keys protect data at rest in S3 buckets, EBS volumes, and RDS databases, with IAM policies controlling which principals can use them for encryption and decryption operations.
4. Configure SCPs that enforce encryption requirements across all member accounts. These policies prevent any S3, EBS, or RDS resources from being created without KMS encryption, working alongside IAM policies to create defense-in-depth security controls.
5. Create IAM policies that restrict root user actions and enforce tagging compliance. These policies connect to Organizations OUs to apply consistent access controls, while CloudWatch Logs captures policy evaluation results for compliance monitoring.
6. Set up CloudWatch Logs for IAM activity with 90-day retention. These logs capture all IAM role assumptions, policy evaluations, and KMS key usage events, feeding into AWS Config rules for automated compliance validation.
7. Implement least-privilege IAM access patterns where each policy explicitly specifies resource ARNs rather than using broad wildcards, except for specific read-only actions like listing buckets or describing resources.
8. Enable AWS Config rules that validate security compliance by evaluating IAM policies, KMS key configurations, and encryption settings. Config integrates with CloudWatch Logs to receive IAM activity data and with Organizations to assess compliance across all OUs.

## Optional Enhancements (If Time Permits)
- Add GuardDuty for threat detection across accounts, with findings forwarded to Security Hub through EventBridge rules for centralized security monitoring - improves threat visibility
- Implement Security Hub to aggregate findings from GuardDuty, Config rules, and IAM Access Analyzer into a single dashboard - consolidates security posture
- Create EventBridge rules that trigger SNS notifications when GuardDuty detects threats or Config rules identify non-compliant resources - enables automated response

## Environment
Multi-account AWS environment deployed across us-east-1 (primary) and eu-west-1 (secondary) regions. Requires AWS Organizations with 3 accounts minimum: management, security audit, and production. Uses KMS for centralized encryption key management, IAM for cross-account access controls, and CloudWatch Logs for audit trails. Terraform 1.5+ with AWS provider 5.x. Management account must have Organizations enabled. VPC not required for this security-focused deployment.

## Constraints
1. All KMS keys must use AES-256 encryption with automatic annual rotation
2. Cross-account IAM roles must enforce MFA for all AssumeRole operations
3. Service Control Policies must prevent disabling of CloudWatch Logs in any account
4. IAM policies must specify explicit resource ARNs for write operations, with wildcards only permitted for read-only actions like listing or describing resources
5. All Terraform state files must be encrypted using KMS customer-managed keys
6. Security audit role must have read-only access to all accounts but no modification permissions

## AWS Services Required
- Organizations
- IAM (Identity and Access Management)
- KMS (Key Management Service)

## Region
us-east-1 (primary), eu-west-1 (secondary)

## Critical Requirements
- ALL resource names MUST include a dynamic environment suffix variable to avoid collisions
- NO RemovalPolicy.RETAIN or deletion_protection = true
- Follow AWS best practices for security and compliance
- Implement proper error handling and logging
- Use appropriate tagging strategy

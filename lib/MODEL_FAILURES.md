# Model Failures for SecureApp CloudFormation Template

This document lists common model failures and misconfigurations when generating a CloudFormation YAML template for highly secure AWS infrastructure, based on the requirements provided.

---

## 1. S3 Bucket Encryption
- **Failure:** S3 buckets are created without `BucketEncryption` or use incorrect encryption type.
- **Impact:** Data at rest is not protected, violating compliance.
- **Mitigation:** Ensure all S3 buckets use `SSE-S3` for encryption at rest.

## 2. IAM Least Privilege for EC2
- **Failure:** IAM roles attached to EC2 instances grant excessive permissions (e.g., `*:*`).
- **Impact:** EC2 instances can perform unintended actions, increasing risk.
- **Mitigation:** Scope IAM policies to only required actions and resources for EC2.

## 3. CloudTrail Logging
- **Failure:** CloudTrail is not enabled or does not log all account activity.
- **Impact:** Lack of audit trail for security investigations.
- **Mitigation:** Enable CloudTrail for all regions and all management events.

## 4. AWS WAF Not Deployed
- **Failure:** No AWS WAF WebACL attached to web-facing resources.
- **Impact:** Web applications are exposed to common exploits.
- **Mitigation:** Attach WAF to all public-facing ALBs or CloudFront distributions.

## 5. VPC and Subnet Design
- **Failure:** VPC does not have at least two public and two private subnets across different AZs.
- **Impact:** Reduced high availability and fault tolerance.
- **Mitigation:** Define subnets in at least two AZs for both public and private tiers.

## 6. Network ACLs
- **Failure:** Network ACLs are too permissive or not configured for critical services.
- **Impact:** Unauthorized access to resources.
- **Mitigation:** Restrict NACL rules to only required IP ranges and ports.

## 7. KMS Key Management
- **Failure:** Data encryption keys are not managed with AWS KMS or are not securely stored.
- **Impact:** Data at rest is not properly protected.
- **Mitigation:** Use KMS for all encryption keys and restrict access to keys.

## 8. GuardDuty Coverage
- **Failure:** GuardDuty is not enabled in all utilized regions.
- **Impact:** Missed threat detection in some regions.
- **Mitigation:** Enable GuardDuty in every region where resources are deployed.

## 9. AWS Config Monitoring
- **Failure:** AWS Config is not enabled or lacks compliance rules.
- **Impact:** Configuration drift and non-compliance go undetected.
- **Mitigation:** Enable AWS Config and define rules for all critical compliance checks.

## 10. Naming Conventions and Tagging
- **Failure:** Resources do not use the 'SecureApp' prefix or lack required tags.
- **Impact:** Harder to manage, track, and audit resources.
- **Mitigation:** Apply naming conventions and tags to all resources.

## 11. Template Validation
- **Failure:** Syntax errors or missing required properties in the template.
- **Impact:** Stack creation fails.
- **Mitigation:** Validate template before deployment.

---

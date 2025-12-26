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

## LocalStack Compatibility Adjustments

This section documents changes made for LocalStack deployment compatibility. These changes do not affect production AWS deployment functionality.

### Category A: Unsupported Resources (Entire resource commented/removed)

| Resource | LocalStack Status | Solution Applied | Production Status |
|----------|------------------|------------------|-------------------|
| N/A | N/A | No unsupported resources in this stack | N/A |

### Category B: Deep Functionality Limitations (Property/feature disabled)

| Resource | Feature | LocalStack Limitation | Solution Applied | Production Status |
|----------|---------|----------------------|------------------|-------------------|
| NAT Gateway | EIP Allocation | EIP allocation fails in Community Edition | Conditional with UseNATGateway (disabled when IsLocalStack=true) | Enabled in AWS |
| EC2 Subnets | AvailabilityZone | Fn::GetAZs not reliable in LocalStack | Hardcoded us-east-1a/us-east-1b | Dynamic AZ selection in AWS |
| Launch Template | LatestVersionNumber | GetAtt for LatestVersionNumber not supported | Using $Latest string | GetAtt LatestVersionNumber in AWS |

### Category C: Behavioral Differences (Works but behaves differently)

| Resource | Feature | LocalStack Behavior | Production Behavior |
|----------|---------|---------------------|---------------------|
| Auto Scaling Group | Health Checks | ELB health checks may not trigger | Full ELB health check integration |
| Application Load Balancer | Target Registration | Targets may not register automatically | Automatic target registration |
| KMS | Key Rotation | Rotation doesn't actually occur | Automatic key rotation |

### Category D: Test-Specific Adjustments

| Test File | Adjustment | Reason |
|-----------|------------|--------|
| Integration tests | AWS_ENDPOINT_URL=http://localhost:4566 | LocalStack endpoint |
| Integration tests | Account ID 000000000000 | LocalStack default account |
| Integration tests | Region us-east-1 | LocalStack default region |
| cfn-lint | W3010, W7001, W8001 ignored | Hardcoded AZs and unused mappings/conditions for LocalStack compatibility |

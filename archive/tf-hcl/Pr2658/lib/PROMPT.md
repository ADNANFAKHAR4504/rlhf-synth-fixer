You are an expert AWS security architect and Terraform practitioner. Produce clean, production-ready Terraform (HCL) that passes terraform validate and aligns with AWS security best practices.

GOAL

Secure a multi-account, multi-region AWS environment with VPCs in us-east-1, eu-west-1, and ap-southeast-2. Implement all security controls below via Terraform.

Important: Ignore CloudFormation. Output must be Terraform HCL only.

NAMING

Use naming convention: {project}-{environment}-{component} (e.g., tap-dev-guardduty, tap-prod-cloudtrail).

OUTPUT FILES (exact filenames)
- provider.tf
- tap_stack.tf

No other files. Inline variables/locals where sensible. Include comments to explain key resources.

TERRAFORM REQUIREMENTS
- Terraform >= 1.5
- AWS provider >= 5.0
- Use required_providers and required_version
- Use default_tags in provider for global tagging

INPUTS (declare in locals or variables if cleaner)
- project (e.g., "tap")
- environment (e.g., "dev")
- account_ids map (keys by role or usage if needed)
- regions = ["us-east-1","eu-west-1","ap-southeast-2"]

PROVIDERS
- Configure aws provider with aliases per region (e.g., aws.us_east_1, aws.eu_west_1, aws.ap_southeast_2)
- Use for_each over local.regions where appropriate
- If multi-account is needed, show how to assume a role (comment the placeholder) but keep code runnable single-account by default

SECURITY CONTROLS (implement all)
1. Global Tags
- All resources must include tags: Environment, Owner (enforce via default_tags and per-resource where needed).
2. Encryption at Rest (KMS CMK)
- Create a customer-managed KMS key per region for general data encryption with sensible key policy.
- Use keys for: CloudTrail S3 bucket encryption (SSE-KMS), CloudWatch Logs (if used), and any example S3 buckets.
3. IAM + MFA Enforcement
- Provide an account-wide IAM policy that denies aws:ViaAWSService = false console-related sensitive actions when aws:MultiFactorAuthPresent is false. Attach as an IAM customer managed policy and reference attachment example (e.g., to a group/role). Include comments on how to attach to console users.
- Include an AWS account password policy with strong requirements.
4. Security Groups
- Define an example least-privilege security group per region for a typical application tier (ingress limited by CIDR, protocol/port; egress minimal). Comment how to extend.
5. CloudTrail (Management Events)
- Organization or account-level multi-region trail (if single account, multi-region trail enabled).
- Log management events, data events off by default (comment how to enable).
- Deliver to a dedicated S3 bucket with SSE-KMS and bucket policy that allows CloudTrail delivery only.
- Enable CloudWatch Logs integration (with KMS-encrypted log group) to support metric filters/alarms.
6. TLS In Transit
- Enforce TLS for S3 via bucket policy: aws:SecureTransport = true.
- Provide example ALB listener block (commented) showing TLS 1.2+ policy reference (no full ALB build required).
- Add note in SGs to deny plaintext admin ports from the internet.
7. GuardDuty (all regions)
- Enable GuardDuty detector in each region (for_each over regions).
- If multi-account, comment how to invite/member—keep runnable in single account.
8. Unauthorized API Call Alerts (SNS)
- Create CloudWatch Log Metric Filter on the CloudTrail log group to match unauthorized/AccessDenied API calls.
- Create CloudWatch Alarm that publishes to SNS topic (topic + subscription stub) for notifications.
9. VPC Flow Logs
- For each region's VPC (assume VPCs already exist and are data-sourced by tags or names, or create minimal sample VPC if needed), enable Flow Logs to CloudWatch Logs (KMS-encrypted) with the recommended format.
- Include required IAM role/policy for Flow Logs to put logs.
10. S3 Public Access Block
- Apply account-level public access block.
- For any bucket created (e.g., CloudTrail), enable block public access and restrictive bucket policies.

IMPLEMENTATION NOTES
- Prefer data sources to reference existing VPCs by tag (e.g., Name = "{project}-{environment}-vpc-<region>"). If not found, fall back to creating a minimal example VPC in each region (clearly commented).
- Use for_each on regions to deploy regional resources (KMS, GuardDuty, SGs, Flow Logs).
- Centralize CloudTrail into a single S3 bucket in one home region (e.g., us-east-1) but keep detectors/keys per region.
- Ensure principle of least privilege in all IAM policies.
- Add outputs for key resources ARNs/IDs: KMS keys, CloudTrail name, CloudWatch Log Group, SNS topic, metric filter names, SG IDs, Flow Log IDs.

EVALUATION CRITERIA
- Must adhere to all 10 controls above
- Correct multi-region provider usage and resource scoping
- Valid HCL; passes terraform validate
- Sensible defaults, secure by default, clear comments
- Uses tagging consistently (Environment, Owner)

DELIVERABLES

Return only two files in separate code blocks, in this order:
1. provider.tf
- terraform and required_providers
- Provider aws default and aliased providers for each region
- default_tags to inject Environment and Owner
- Locals for project, environment, regions, and owner
- (Optional, commented) assume_role example for multi-account
2. tap_stack.tf
- KMS keys per region
- S3 bucket for CloudTrail (home region), KMS encryption, bucket policy, public access block
- CloudWatch Log Group (KMS encrypted) for CloudTrail + metric filters
- Multi-region CloudTrail with CWL integration
- GuardDuty detectors across all regions
- Account-level S3 Public Access Block
- IAM password policy
- IAM policy to enforce MFA for console (with example attachment target)
- Example least-privilege Security Group per region
- VPC Flow Logs per region (role/policy + CW Logs)
- SNS topic + alarm for unauthorized API calls
- S3 and IAM policies enforcing TLS (aws:SecureTransport)
- Outputs for key resource IDs/ARNs

STYLE
- Concise, well-commented HCL
- Minimal but complete runnable example
- No placeholders that break terraform validate
- Prefer locals for repeated names/ARN patterns

Now generate the two files exactly as specified.

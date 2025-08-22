You are a Senior Cloud Engineer with expertise in AWS.

Restate and implement the following requirements as Terraform (HCL) for a production, finance-related web application. Be concise, high-level, and natural-sounding. Use only information provided below.

Environment & scope:
- Production workload deployed across multiple AWS regions: us-west-2 and us-east-1.
- Follow the company’s standard naming conventions.
- Tag all resources with: environment = "production", owner = "DevOps", project = "SecureApp".
- Use a centralized logging account to aggregate CloudTrail logs.

Security & compliance requirements:
1) Enable server-side encryption for all S3 buckets.
2) Implement IAM with least-privilege policies.
3) Ensure all RDS instances are not publicly accessible.
4) Enable CloudTrail logging across all AWS regions and route logs to the centralized logging account.
5) Restrict Security Group ingress to known IP addresses only.
6) Enforce MFA for all IAM users.
7) Ensure all EBS volumes are encrypted.
8) Enable VPC Flow Logs for network monitoring.
9) Make all API Gateway endpoints private.
10) Use AWS Config for continuous compliance monitoring.
11) Use customer-managed AWS KMS keys for all resource encryption.
12) Set up AWS GuardDuty to detect and alert on potential security threats.

Expected output:
- Write the Terraform configuration files in HCL format and ensure all constraints above are met.

File structure guidance:

provider.tf (already present)
- Contains the AWS provider configuration and S3 backend for remote state.
- Only modify if absolutely necessary (e.g., backend bucket/key changes, provider aliases for multi-region).

Multi-environment tip:
- For multiple regions (us-west-2 and us-east-1), define multiple provider aliases in provider.tf (e.g., aws.usw2, aws.use1).
- Reference them where needed in main code using `provider = aws.usw2` or `provider = aws.use1`.

lib/main.tf (single source of truth)
- Declare all `variable` blocks (including regions, allowed ingress CIDRs, tags, and any IDs/names required for the centralized logging account).
- Define all `locals` for names, tags, and toggles that implement the corporate naming policy and mandatory tags.
- Implement all resources directly (do not use external/remote modules) to satisfy items 1–12 above across both regions, including KMS CMKs where required.

Notes:
- Keep the configuration simple, concise, and high-level while fully implementing the listed requirements.
---

#### **Prompt:**

> You are a senior AWS CDK security engineer specializing in building **enterprise-grade security baselines** for multi-tier application environments using **TypeScript CDK (v2)**.
> Your task is to **analyze the given specification** and generate a **complete CDK application** that enforces **encryption, IAM least privilege, audit logging, and compliance monitoring** across AWS resources.
>
> **Deliverables:**
>
> * `main.ts` — CDK app entrypoint and stack initialization.
> * `tapstack.ts` — Full infrastructure stack implementing the complete AWS security baseline (KMS hierarchy, IAM, Config, CloudTrail, SCPs, etc.) with logical grouping and dependency management.
>
> ---
>
> ### 📘 Input Specification
>
> ```json
> {
>   "problem": "Create a CDK program to implement a security baseline for a multi-tier application environment. The configuration must: 1. Create a KMS key hierarchy with separate keys for database encryption, S3 bucket encryption, and secrets encryption. 2. Implement IAM roles with least-privilege access for EC2 instances, Lambda functions, and ECS tasks. 3. Set up AWS Secrets Manager with automatic rotation for database credentials and API keys. 4. Configure S3 buckets with server-side encryption, versioning, and access logging enabled. 5. Create VPC flow logs encrypted with KMS and stored in a dedicated S3 bucket. 6. Implement CloudWatch log groups with KMS encryption for application logs. 7. Set up cross-account assume role policies for DevOps team access with MFA requirements. 8. Create SCPs (Service Control Policies) to prevent deletion of security resources. 9. Configure AWS Config rules to monitor compliance with encryption requirements. 10. Implement CloudTrail with log file validation and encryption. Expected output: A TypeScript CDK application that deploys all security configurations as a stack, with proper dependencies and resource naming conventions following AWS security best practices.",
>   "background": "A financial technology company needs to implement strict security controls for their payment processing infrastructure. They require automated security configurations that enforce encryption, access controls, and audit logging across all resources while maintaining compliance with PCI-DSS requirements.",
>   "environment": "AWS",
>   "constraints": [
>     "All KMS keys must have automatic key rotation enabled",
>     "IAM policies must use condition keys to restrict access by IP range and MFA status",
>     "S3 buckets must block all public access and enforce SSL requests only",
>     "Secrets rotation Lambda must run in isolated subnets with no internet access",
>     "CloudTrail logs must be stored in a separate AWS account for immutability",
>     "All log groups must have retention policies set to 7 years for compliance",
>     "Use CDK aspects to enforce tagging standards across all resources",
>     "Implement custom CDK constructs for reusable security patterns",
>     "Deploy stack with termination protection enabled",
>     "Generate compliance reports using AWS Config aggregators"
>   ]
> }
> ```
>
> ---
>
> ### 🧩 Output Requirements
>
> 1. Generate **TypeScript CDK v2** code using modules such as `aws-kms`, `aws-iam`, `aws-s3`, `aws-secretsmanager`, `aws-cloudtrail`, `aws-logs`, `aws-config`, and `aws-organizations`.
> 2. Include and correctly link the following components:
>
>    * **KMS key hierarchy:**
>
>      * `kmsDatabaseKey`, `kmsS3Key`, `kmsSecretsKey` with rotation enabled and key policies allowing least privilege.
>    * **IAM roles:**
>
>      * Roles for EC2, Lambda, and ECS tasks with minimal policies.
>      * Cross-account assume-role with MFA enforcement for DevOps access (`Condition: {"Bool": {"aws:MultiFactorAuthPresent": true}}`).
>    * **Secrets Manager:**
>
>      * Secrets with rotation via a private Lambda in isolated subnet (no Internet access).
>    * **S3 Buckets:**
>
>      * Server-side encryption (KMS), versioning, access logging, SSL-only, and public access blocked.
>    * **CloudTrail:**
>
>      * Multi-region trail, log validation, encrypted with a KMS key, and delivery to an immutable bucket in another account.
>    * **CloudWatch Logs:**
>
>      * 7-year retention, encrypted with KMS, used for application and audit logs.
>    * **AWS Config:**
>
>      * Encryption compliance rules, aggregators for multi-account reporting.
>    * **SCPs:**
>
>      * Prevent deletion or modification of KMS, IAM, and CloudTrail resources.
>    * **Tagging & Aspects:**
>
>      * Apply global tags (`Environment`, `CostCenter`, `Owner`) via Aspects to enforce compliance.
> 3. Use CDK **termination protection** on the stack.
> 4. Enforce encryption at rest and in transit for all supported services.
> 5. Include clear inline comments marking logical sections, e.g.
>
>    * `// 🔹 KMS Hierarchy`, `// 🔹 IAM Roles`, `// 🔹 CloudTrail Configuration`, etc.
> 6. Output **only two files** — `main.ts` and `tapstack.ts` — in fenced markdown code blocks.
> 7. No prose, no explanations — only valid CDK code ready to synthesize.
>
> ---
>
> ### 🎯 Goal
>
> Deliver a **production-grade AWS security baseline** using TypeScript CDK that enforces encryption, least privilege, compliance monitoring, and audit integrity for PCI-DSS workloads.
> Focus on:
>
> * Secure inter-resource connections (KMS, IAM, CloudTrail, Config)
> * Strict policy enforcement (MFA, IP conditions, SCPs)
> * Maintainability via constructs and tagging aspects
> * Full traceability and audit readiness

---
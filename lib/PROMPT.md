I need help creating a comprehensive security-focused AWS infrastructure using CDKTF with Go. The setup needs to meet our company's strict security standards and include the following components:

1. Code Structure: I want a clean two-file setup:

   * `main.go` → Simple entrypoint that gets environment suffix from `ENVIRONMENT_SUFFIX` env var (defaults to "dev"), creates stack with format `TapStack{environmentSuffix}`, and calls `app.Synth()`.
   * `tap-stack.go` → Contains `NewTapStack` function that returns `cdktf.TerraformStack` and implements all AWS resources.

2. Backend Configuration: Configure S3 backend using environment variables:

   * `TERRAFORM_STATE_BUCKET` (default: `"iac-rlhf-tf-states"`)
   * `TERRAFORM_STATE_BUCKET_REGION` (default: `"us-east-1"`)
   * Key format: `{environmentSuffix}/TapStack{environmentSuffix}.tfstate`

3. Resource Naming: All resources should include the environment suffix in their names (e.g., `tap-main-vpc-{environmentSuffix}`).

4. TapStackConfig Structure:

   ```go
   type TapStackConfig struct {
       Region          *string
       Environment     *string
       Project         *string
       Owner           *string
       CostCenter      *string
       VpcCidr         *string
       AllowedIpRanges []*string
   }
   ```

5. Global Region: Everything must deploy in **`us-east-1`** (hard requirement).

6. IAM Configuration: Implement IAM roles and policies following the principle of least privilege. Use AWS managed policies where appropriate but prefer least-privilege custom inline policies for service-specific roles when needed. Avoid wildcard (`*`) actions unless absolutely justified and documented.

7. Network Infrastructure (us-east-1): Create a VPC with:

   * 2 public subnets and 2 private subnets distributed across 2 availability zones for high availability.
   * Public subnets must host NAT gateways (one NAT gateway for high availability across AZs is acceptable but outline the pattern).
   * Route tables for public and private subnets configured correctly so private subnets route outbound traffic through NAT gateway.
   * Create appropriate Elastic IP(s) for NAT gateway(s).

8. Security Controls:

   * Security Groups: Restrict inbound and outbound traffic to specific IP ranges only. Provide example rules for SSH (from allowed IPs), HTTP/HTTPS for app layer, and DB access limited to app tier security group only. No overly permissive rules.

9. S3 Storage:

   * All S3 buckets must be encrypted with **customer-managed KMS keys** (not just AES-256 SSE-S3).
   * Enforce bucket policies to deny unencrypted uploads and deny access over insecure (non-TLS) connections.
   * Block public access on all buckets by default and set `force_destroy` only when explicitly safe to do so (comment reasons).

10. Logging Infrastructure:

    * Enable CloudTrail with S3 delivery and **CloudWatch Logs** integration (send logs to CloudWatch Logs).
    * Set up comprehensive event selectors including data events for S3 and management events.
    * Use KMS encryption (customer-managed keys) for all log destinations (S3 bucket and CloudWatch log group).
    * Ensure CloudWatch Log Groups have retention and encryption configured.

11. RDS & Database Security:

    * Create an example RDS instance (e.g., PostgreSQL) with Multi-AZ deployment in private subnets.
    * Enable encryption-at-rest using **customer-managed KMS keys**.
    * Configure automated snapshots and appropriate backup retention.
    * Ensure DB is not publicly accessible and is only reachable from app servers via SGs.
    * Include key rotation and strict key policies for the DB KMS key.

12. KMS Keys:

    * All KMS keys used (S3, CloudTrail logs, RDS) must be customer-managed keys with:

      * Proper key policies allowing only necessary principals (root + specific IAM roles) to use/administrate keys.
      * Aliases created for each key (e.g., `alias/tap-s3-{env}`, `alias/tap-logs-{env}`, `alias/tap-rds-{env}`).
      * Key rotation enabled.
      * Reasonable deletion/pending window comments for production safety.

13. Tagging & Metadata:

    * Apply consistent tags across all resources: `Environment`, `Project`, `Owner`, `CostCenter`, `ManagedBy="cdktf"`.
    * Tag values must include environment suffix where appropriate.

14. Security Best Practices & Hardening:

    * Disallow public access to sensitive resources.
    * Enforce TLS-only access in bucket policies.
    * Avoid storing secrets in plaintext in code. Use placeholders or reference to Secrets Manager (show example secret creation but do not store real secrets in code).
    * Provide comments describing security rationale for decisions (e.g., why a NAT gateway is used, why KMS keys use these policies).

15. Outputs:

    * Provide Terraform outputs for VPC ID, public/private subnet IDs, NAT gateway ID(s), security group IDs, KMS key ARNs/IDs, CloudTrail ARN, RDS endpoint/ARN, S3 bucket names/ARNs, and any other major resource IDs/ARNs.

16. Error Handling & Patterns:

    * Use `jsii.String()` for all string literals passed to constructs.
    * Follow idiomatic CDKTF for Go: accept `TapStackConfig` into `NewTapStack` and use `cdktf.TerraformStack` patterns.
    * Include sensible defaults (e.g., `VpcCidr` default `"10.0.0.0/16"`, AllowedIpRanges default to an empty list) but allow overrides via `TapStackConfig`.

17. Testing & Production Readiness:

    * Code should be production-ready, aligned with AWS Well-Architected Framework security principles.
    * Do not use `force_destroy` on critical buckets in production without clear comments.
    * Keep the code modular and clearly documented.

18. Implementation Constraints:

    * Use the exact import structure and coding patterns shown in my example files.
    * Use only Terraform/AWS provider resources that are stable and available in `us-east-1`.
    * All KMS keys must have aliases and rotation enabled.
    * Use AWS-managed policies sparingly and only when they align with least privilege.

19. Deliverable:

    * Provide **complete CDKTF Go code** in **exact two-file structure** (`main.go`, `tap-stack.go`) as described above.
    * Use `jsii.String()` for all string values and show explicit tagging and outputs.
    * Include inline comments explaining security hardening choices and any assumptions.
Generate a single-file Terraform configuration at ./lib/main.tf that meets the following:

1. **General Requirements**
   - All variables (including `aws_region`) must be declared in main.tf and referenced by provider.tf.
   - Include all locals, resource definitions, and outputs in main.tf.
   - No provider blocks in main.tf; provider.tf already contains AWS provider + S3 backend configuration.
   - Build all resources directly in main.tf (no external modules).
   - Apply consistent cost allocation tags: owner, environment, ManagedBy=terraform.

2. **Region & Naming**
   - Deploy all resources in the `us-east-1` region.
   - The S3 bucket name must follow the pattern: `data-secured-<account_id>` using `aws_caller_identity` data source to dynamically fetch account_id (no hardcoded IDs).

3. **S3 Security Configuration**
   - Create an S3 bucket with:
     - Server-side encryption enabled using AWS-managed KMS keys (SSE-S3 or SSE-KMS with aws/s3 key).
     - Versioning enabled.
     - Public access completely blocked.
     - Default encryption for all new objects without requiring SSE in API requests.
   - Configure logging to capture all access requests to a separate logging bucket.
   - Apply lifecycle rules to delete objects older than 365 days.
   - Implement a replication rule to replicate all new objects to a destination bucket in `us-west-2`.

4. **IAM & MFA Enforcement**
   - Create IAM policy that enforces Multi-Factor Authentication (MFA) for accessing the S3 bucket.
   - Apply the principle of least privilege to all IAM roles and policies.

5. **Replication Setup**
   - Create a replication destination bucket in `us-west-2` with the same encryption and versioning enabled.
   - Configure the replication role and policy with least-privilege permissions.

6. **Outputs**
   - Output non-sensitive information required for CI/CD and testing:
     - Source bucket name
     - Destination bucket name
     - Logging bucket name
   - Do not output sensitive values.

**Constraints:**
- Terraform version >= 0.15.0
- No provider blocks in main.tf
- No hardcoded account IDs
- No external Terraform modules
- Must be a brand-new stack with all resources created from scratch
- Must be valid HCL that passes `terraform validate` and AWS best practices checks

Follow the above instructions and produce the complete ./lib/main.tf in Terraform HCL.
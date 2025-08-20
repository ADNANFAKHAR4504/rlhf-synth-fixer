# Terraform AWS Secure Multi-Account Environment

## Objective
You are tasked with creating a **secure, multi-account AWS environment** using Terraform. The setup will be deployed in production, staging, and development environments (excluding the `us-east-1` region). The configuration should **provision all resources from scratch** (no references to existing infrastructure), strictly adhere to AWS security best practices, and pass `terraform plan` and `apply` validations without errors.

## Requirements

### Provider Setup
- The AWS provider configuration resides in `provider.tf` (already present).
- The region is managed via an `aws_region` variable in `provider.tf`, so ensure `tap_stack.tf` declares and uses this variable appropriately.

### `tap_stack.tf` Specifications
- All **variable declarations**, **default/example values**, **resource logic**, and **outputs** must be included in `tap_stack.tf`.
- All resources must be **newly created**; do NOT reference any existing modules or infrastructure.
- Organize resources using Terraform modules created in `tap_stack.tf` itself.

### AWS Resources & Security Best Practices

1. **S3 Buckets**
   - Buckets must be encrypted (SSE-S3 or SSE-KMS).
   - IAM policies must strictly restrict unauthorized access.
   - Outputs should include bucket names and encryption status.

2. **RDS Databases**
   - Must NOT be publicly accessible.
   - Use parameterized configurations (engine, instance size, etc.).
   - Outputs should include DB endpoint and security status.

3. **VPCs**
   - VPC must be custom-created.
   - Enable VPC Flow Logs, with logs sent to CloudWatch Logs.
   - Outputs should include VPC ID and Flow Log status.

4. **CloudTrail**
   - Configure CloudTrail to log to a dedicated, encrypted S3 bucket.
   - Restrict access to this bucket.
   - Outputs should include CloudTrail name and S3 bucket ARN.

5. **IAM**
   - Enable Multi-Factor Authentication (MFA) for IAM users.
   - IAM roles must apply least-privilege policies.
   - Outputs should show enabled MFA and IAM role ARNs/policies.

6. **Security Groups**
   - Automate cleanup of unused security group rules.
   - Ensure only necessary rules exist; remove all unused via Terraform logic.
   - Outputs should show active security group IDs and rules.

## Instructions
- The **entire Terraform logic** must be in the `tap_stack.tf` file, including variables and outputs.
- The configuration must be **modular**, secure, and ready to deploy a **brand new stack** for each environment.
- The output must be a single, well-structured `tap_stack.tf` file that passes security constraints and Terraform validation.

## Expected Deliverable
- A complete `tap_stack.tf` Terraform configuration file meeting all the above requirements.
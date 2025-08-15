# Terraform Prompt for Secure AWS Storage and IAM Management

## Objective:

Configure a Terraform-based infrastructure on AWS, with a specific focus on secure storage and IAM management. The VPC is pre-defined, and resources must fit within the specified network CIDRs.

## Requirements:

Write a Terraform HCL script that accomplishes the following tasks:

### 1. S3 Buckets Configuration

- Ensure all data stored in S3 buckets is encrypted using AES-256 encryption.
- Only allow access to S3 buckets from specific IP address ranges.
- Enable versioning on all S3 buckets to preserve data history.
- Implement logging for all AWS API calls using CloudTrail.
- Ensure that IAM roles are used instead of hard-coded AWS access keys.

### 2. IAM Configuration

- Ensure least-privilege IAM role permissions, restricting permissions to the minimum necessary for application functionality.
- Implement CloudWatch alarms to monitor any IAM permission changes.
- Configure an SNS topic to notify the security team of any IAM role changes.

### 3. Deployment Region

- Deploy all resources in the `us-west-2` AWS region.

### Constraints and Best Practices:

- Ensure all data in S3 buckets is encrypted using AES-256.
- Only allow access to S3 buckets from specific IP address ranges.
- Use IAM roles instead of hard-coded AWS access keys.
- Use least-privilege IAM policies.
- Implement logging for AWS API calls with CloudTrail.
- Enable versioning on all S3 buckets.
- Deploy resources in us-west-2.
- Implement CloudWatch alarms for IAM role changes.
- No external modules should be used. All resources should be defined directly in the HCL script.

### Non-Negotiables:

- The Terraform logic should be kept in the file `./lib/tap_stack.tf` (variables, locals, resources, outputs).
- The `provider.tf` file already contains the (AWS provider + S3 backend). Do not put a provider block in `tap_stack.tf`.
- The variable (`aws_region`) must be declared in `tap_stack.tf` and consumed by `provider.tf`.
- Tests must not run (`terraform init/plan/apply`) during the test stage.

### Expected Output:

Provide a single-file Terraform configuration in (`tap_stack.tf`) that includes:

- All variable declarations (including `aws_region` for `provider.tf`).
- Locals, resources, and outputs.
- Directly build all resources (no external modules).
- Follow best practices such as least-privilege IAM, encryption where applicable, secure security groups, and consistent tagging.
- Emit useful outputs for CI/CD and testing (no secrets).

Ensure that the generated Terraform configuration aligns with the following security best practices:

- Least-privilege IAM roles and policies.
- Encryption for sensitive data.
- Logging and alerting for critical changes.

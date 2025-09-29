### Develop a Terraform configuration to configure a secure AWS environment

Generate a deployable Terraform configuration that sets up a secure, multi-region-ready AWS environment and passes security/compliance checks.

Requirements:
- **Project**
  - Use Terraform 1.x with AWS provider and remote state example.
  - Organize as , `versions.tf`, `main.tf`, `variables.tf`, `outputs.tf`, `README.md`.
  - Use provider aliases for `eu-north-1` where needed (e.g., Lambda@Edge).
  - The `providers.tf` will be provided at deployment time.
- **S3**
  - Enable default server-side encryption (SSE-KMS) on all buckets.
  - Block all public access and add strict bucket policies preventing public read/write.
  - Create an S3 VPC Gateway Endpoint and restrict bucket access to that endpoint.
- **IAM**
  - Create least-privilege roles and policies; avoid wildcard actions like `s3:*`.
  - Configure `aws_iam_account_password_policy` and an MFA-enforcement policy (deny actions when `aws:MultiFactorAuthPresent` is false).
  - Plan for periodic review/updates to maintain least privilege.
- **Networking**
  - Define a VPC with private subnets for sensitive workloads in `eu-north-1`.
  - Ensure all EC2 instances launch within the VPC.
  - Security Groups must not allow `0.0.0.0/0` ingress; use specific CIDRs.
  - Enable VPC Flow Logs to CloudWatch Logs or S3 with SSE.
- **Compute**
  - Lambda functions must have environment variables encrypted with KMS (`kms_key_arn`).
  - Add a Lambda@Edge function (deployed in `eu-north-1`) for CloudFront request/response security inspection.
- **Logging and Monitoring**
  - Enable CloudTrail multi-region logging with SSE-KMS and log file validation.
  - Enable GuardDuty (detector on, auto-enable in all regions if applicable).
  - Enable AWS Config with core managed rules for compliance tracking.
- **Datastores and Storage**
  - Enforce EBS encryption by default (account setting) and ensure all volumes are encrypted.
  - Deploy RDS in Multi-AZ with automated backups (backup window, retention, deletion protection optional) in `eu-north-1`.
- **Secrets**
  - Use AWS Systems Manager Parameter Store (SecureString with KMS) for secrets; no hardcoded secrets.

Output:
- A Terraform project (files above) that runs `terraform init && terraform validate` cleanly, and clearly documents how to deploy.
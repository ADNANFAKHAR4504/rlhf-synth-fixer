I need a single-file Terraform configuration at ./lib/main.tf that provisions a secure infrastructure for a web application on AWS. Please follow these requirements:

1. All code must live in ./lib/main.tf — include variable declarations (including aws_region), locals, resources, and outputs. Do not use external modules or add provider blocks (provider.tf already exists and consumes aws_region).
2. Security rules:
   - Define IAM roles and least-privilege policies to manage access to AWS resources.
   - All S3 buckets must use KMS encryption at rest.
   - Enable CloudWatch monitoring to capture unauthorized API requests.
   - Configure an SNS topic to send alerts when security breaches are detected.
   - Follow least-privilege principles for IAM everywhere.
   - Restrict resources to the us-west-2 region only.
3. Infrastructure should follow best practices:
   - No open 0.0.0.0/0 on sensitive ports.
   - Encryption enabled wherever possible (S3, EBS, CloudWatch logs).
   - Consistent tagging for all resources (Environment, Project, Owner, ManagedBy=terraform).
   - Only expose safe values in outputs (no secrets).
4. This is a brand-new stack — build resources directly instead of pointing to existing ones.
5. Make sure useful outputs are defined for CI/CD and tests (like bucket name, SNS topic ARN, IAM role ARNs, region, etc.).

The end result should be a Terraform HCL file that cleanly implements the above with secure defaults and best practices.

Generate a complete single-file Terraform configuration for ./lib/tap_stack.tf that provisions a secure and compliant infrastructure for a web application in AWS.

Requirements:

Region: All resources must be created in us-east-2. The provider is already configured in provider.tf and uses the variable aws_region. Declare aws_region in this file with default "us-east-2".

Networking:

Create a new VPC with both public and private subnets across two Availability Zones.

Add appropriate Internet Gateway, NAT Gateway, route tables, and routing for public/private traffic separation.

Compute:

Deploy an EC2 Auto Scaling Group (Amazon Linux 2 AMI) in the public subnets, configured for high availability across both AZs.

Use a secure Security Group allowing only HTTP (80), HTTPS (443), and SSH (22) from a restricted CIDR (variable-driven).

Database:

Provision an RDS instance (PostgreSQL or MySQL, variable-driven) in the private subnets with no public access.

Enable encryption at rest, backups, and automatic minor version upgrades.

IAM:

Create IAM roles for EC2 and RDS with least privilege access, attaching only AWS managed policies required for the use case.

Storage:

Create an S3 bucket for application data with server-side encryption, versioning enabled, and public access blocked.

Auditing:

Enable AWS CloudTrail to log all API activity, store logs in the S3 bucket with encryption.

Structure & Best Practices:

No external modules — build all logic inline.

All resources must have consistent tags (environment, project, owner).

Variables for configurable items, sensible defaults for ease of deployment.

Follow Terraform best practices (explicit dependencies, naming conventions, secure defaults).

Outputs:

Provide non-sensitive outputs: VPC ID, subnet IDs, EC2 ASG name, RDS endpoint, S3 bucket name, CloudTrail ARN.

No secrets or sensitive data in outputs.

Additional Conditions:

The file must contain:

All variable declarations (including aws_region)

Any locals needed

All resources

All outputs

This is a brand-new stack — nothing points to existing resources.

Ensure configuration passes terraform validate and produces a valid terraform plan in a clean environment.

Use clear inline comments explaining each section for maintainability.

Deliverable:

Output only the complete contents of ./lib/tap_stack.tf (HCL), meeting all above constraints.

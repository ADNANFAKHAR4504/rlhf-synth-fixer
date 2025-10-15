You are tasked with designing a secure, production-grade Infrastructure as Code (IaC) solution using Terraform, not CloudFormation. The infrastructure will manage the security configuration for a multi-account AWS environment. The setup must strictly adhere to AWS security best practices and organizational compliance standards, ensuring confidentiality, integrity, and availability across all services.

The environment will span multiple AWS accounts and regions, consisting of:

VPCs and Subnets

IAM Roles and Policies

Security Groups

RDS Databases

S3 Buckets

CloudWatch Logs

AWS Config

AWS GuardDuty

AWS Shield Advanced

AWS CloudTrail

AWS Secrets Manager

The Terraform code must be consolidated into a single file (main.tf), written with clarity, modular structure (using logical blocks), and security-first principles.

Core Implementation Requirements

Implement the following requirements strictly within Terraform, ensuring that each configuration is fully compliant and functional:

Secrets Management:

Use AWS Secrets Manager to store and retrieve database credentials securely.

Avoid hardcoding sensitive data in the Terraform file.

S3 Security:

Ensure all public S3 buckets enforce encryption at rest (SSE-S3 or KMS) and in transit (HTTPS-only access).

Security Group Change Logging:

Implement CloudWatch Logs and EventBridge Rules to capture and log all security group modifications.

Store these logs in an encrypted S3 bucket.

Access Management:

Use IAM roles exclusively for resource access (no IAM users for services).

Enforce multi-factor authentication (MFA) for any IAM users with console access.

Continuous Security Monitoring:

Deploy AWS Config to track compliance and configuration drift.

Enable AWS GuardDuty for continuous threat detection.

DDoS Protection:

Integrate AWS Shield Advanced to protect web-facing resources (like Load Balancers or CloudFront distributions).

Audit and Logging:

Enable AWS CloudTrail in all regions, logging all API activity.

Store the logs securely in an encrypted S3 bucket with versioning enabled.

Network Monitoring:

Implement VPC Flow Logs for all VPCs, sending data to CloudWatch Logs for monitoring and troubleshooting.

Database Network Security:

Restrict RDS database access only to specific VPC subnets and approved security groups.

Ensure RDS encryption at rest and TLS in transit are enabled.

Multi-Region Awareness:

Configure all resources to be deployable across multiple AWS regions via variables.

Constraints

Deliver the entire Terraform solution as a single, self-contained main.tf file.

The Terraform code must:

Deploy successfully without syntax or validation errors.

Use Terraform AWS provider 

Follow best practices for resource naming, tagging, and modular structure.

Ensure encryption by default (KMS-managed keys where applicable).

Avoid deprecated Terraform syntax or data sources.

Include output variables for critical resource identifiers (like VPC ID, S3 bucket ARN, RDS endpoint).

Contain inline comments explaining each major block.

Expected Output

Claude Sonnet must produce a complete Terraform file (main.tf) that:

Implements all 10 security requirements listed above.

Uses secure AWS resources, data sources, and variables appropriately.

Is ready to be deployed with minimal modification after filling in required variable values.

Is production-grade, meaning it can run safely in a real AWS account under an organization’s compliance requirements.

Follows a clean, readable, and modular Terraform style (logical separation of blocks via comments).

Output Instructions

Produce only the Terraform HCL code for the complete configuration.

The entire environment must be within a single file (main.tf).

Do not include explanations, YAML, or commentary.

Include all dependencies, encryption configurations, and tagging as part of the final Terraform file.
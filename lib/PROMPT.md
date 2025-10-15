You are tasked with creating a Terraform-based Infrastructure as Code (IaC) solution that provisions a secure AWS environment in a new AWS account. This environment must adhere to strict security, encryption, and compliance requirements aligned with enterprise best practices. The Terraform configuration should be fully self-contained in a single file (main.tf) and ready to deploy in the us-west-2 region.

This solution embodies Security Configuration as Code, ensuring that infrastructure is not only deployed but also continuously compliant with organizational security policies and AWS best practices.

Core Implementation Requirements:
Implement the following security and compliance configurations in Terraform:

Encryption with KMS – Use AWS KMS to encrypt all sensitive data both at rest and in transit (e.g., databases, logs, S3 buckets).

IAM Roles & Policies (Least Privilege) – Define IAM roles, users, and policies ensuring least privilege access.

Resource Tagging – Automatically tag every AWS resource with:

CostCenter

Environment (values: development, testing, production)

CloudTrail Setup – Enable AWS CloudTrail to log all API calls and user activities for auditing and compliance tracking.

Network Security –

Configure Network ACLs and Security Groups to restrict unauthorized access.

Prevent open inbound access (no 0.0.0.0/0 on sensitive resources).

Secure Logging (S3) –

Deploy an S3 bucket for log storage with versioning and server-side encryption.

Ensure access logging is enabled for auditing.

Instance and Service Security –

Apply strict security groups for compute instances and AWS services.

Restrict inbound access to only approved IPs or internal CIDRs.

AWS Config Monitoring – Enable AWS Config to monitor configuration changes and enforce compliance with security rules.

Multi-Factor Authentication (MFA) – Require MFA for all IAM users accessing the AWS Management Console.

CloudWatch Budget Alert – Implement AWS Budgets with CloudWatch integration to alert when spending approaches the defined threshold.

Constraints:

All configurations must be defined in a single Terraform file (main.tf).

Use the AWS provider targeting region us-west-2.

Follow Terraform syntax and best practices.

Use KMS encryption for all applicable AWS services (S3, CloudTrail, Config, etc.).

Apply tags globally across all resources.

Ensure no public CIDR (0.0.0.0/0) is permitted for inbound access.

The Terraform file must be deployable without modification using standard AWS credentials.

Expected Output:
A fully functional main.tf Terraform configuration file that provisions the entire secure AWS environment, including:

KMS Key for encryption

IAM roles, policies, and MFA enforcement

S3 bucket for encrypted and versioned log storage

CloudTrail and AWS Config setup

Security Groups and NACLs with strict access rules

CloudWatch budget alert configuration

Complete tagging implementation across resources

Output Instructions

Produce only the Terraform HCL code for the complete configuration.

The entire environment must be within a single file (main.tf).

Do not include explanations, YAML, or commentary.

Include all dependencies, encryption configurations, and tagging as part of the final Terraform file.
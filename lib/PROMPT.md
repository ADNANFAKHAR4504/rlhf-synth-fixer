You are required to design and implement a secure AWS infrastructure using Terraform (Infrastructure as Code).
The Terraform configuration must automate the setup of multiple AWS security and compliance services while following AWS Well-Architected Security Pillar best practices.

The infrastructure spans multiple regions within a single AWS account and converts the default VPC into a customized, secure VPC environment.

Naming conventions should follow this format:
company-resource-environment (e.g., acme-s3-prod).

Core Implementation Requirements

Using Terraform, implement the following security and infrastructure resources in a single Terraform file (main.tf):

S3 Buckets

Create S3 buckets with default encryption enabled (SSE-S3 or KMS).

Enforce block public access for all buckets.

Enable versioning.

IAM Policies and Roles

Create a custom IAM policy that provides read-only access to S3 and EC2.

Enforce multi-factor authentication (MFA) for all IAM users.

Create IAM roles and attach least-privilege permissions to Lambda and EC2.

VPC Configuration

Create a custom VPC with:

2 public and 2 private subnets.

Internet Gateway and NAT Gateway for outbound traffic.

Route tables properly associated.

Restrict EC2 public access only via Security Groups.

EC2 Instances

Launch EC2 instances within private subnets.

Attach IAM roles with least privilege.

Ensure SSH access restricted to specific IPs (via Security Group rules).

RDS Instance

Deploy an RDS instance inside the private subnet.

Disable public accessibility.

Enforce encryption at rest (KMS) and in transit (SSL).

AWS Config

Enable AWS Config to monitor configuration changes.

Store Config data in a secure S3 bucket.

AWS CloudTrail

Enable CloudTrail to log all account API activity.

Store logs in an encrypted S3 bucket.

CloudWatch Alarms

Create CloudWatch Alarms for unauthorized API attempts.

Use SNS for alert notifications.

KMS Key Management

Create and manage KMS CMK keys.

Enable automatic annual key rotation.

Amazon GuardDuty

Enable GuardDuty across all available regions for intelligent threat detection.

Lambda Function Security

Create a sample Lambda function.

Ensure least privilege IAM policy.

Enable environment variable encryption with KMS.

Constraints

All resources must be provisioned using Terraform AWS Provider.

The solution must be contained entirely in a single file (main.tf) — no external modules.

Use descriptive naming conventions: acme-[resource]-prod.

Ensure that all encryption keys, logs, and buckets comply with encryption at rest and in transit.

Use tags across all resources for Environment, Owner, and Project.

The configuration should pass terraform validate and terraform fmt.

Expected Output

A complete Terraform configuration file (main.tf) that includes:

All resources configured as per requirements above.

Clearly separated Terraform blocks (provider, variables, VPC, IAM, RDS, Config, CloudTrail, CloudWatch, KMS, GuardDuty, Lambda).

Inline comments explaining key security features (e.g., encryption, MFA, IAM policy scopes).

Output Instructions
Generate a single-file Terraform configuration (main.tf) implementing all requirements above.
Ensure the output is formatted as valid Terraform HCL code 
Include comments throughout explaining key security best practices.
Do not summarize or break into sections — produce one full Terraform file as the output.
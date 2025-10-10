You are an expert Terraform engineer.
Produce a single, standalone Terraform configuration file named main.tf that implements the complete AWS infrastructure described below using HCL (HashiCorp Configuration Language).
Write all code in a single file only — do not use modules, variables, data files, or external dependencies.
Your response must contain only the Terraform code (no explanations, comments, or extra text).
The file must be ready to run directly with terraform init and terraform apply.

Objective

Deploy a secure, redundant, and compliant AWS cloud environment spanning multiple regions.
The design must follow AWS security best practices, provide high availability, and include centralized logging and compliance enforcement.

Requirements (implement exactly as stated):
1. Provider & Regions

Configure AWS provider for multiple regions (for example: us-east-1 and us-west-2).

Deploy key resources redundantly across these regions for high availability and disaster recovery.

2. Networking (VPC Architecture)

Create a VPC with public and private subnets in at least two Availability Zones per region.

Include Internet Gateway, NAT Gateway, and appropriate route tables for internet and private traffic separation.

Enable VPC flow logs and send them to encrypted CloudWatch Log Groups.

3. S3 Buckets (Redundant & Secure Storage)

Create multiple S3 buckets distributed across regions.

Enable versioning, server-side encryption using AWS KMS (SSE-KMS), and cross-region replication.

Ensure all bucket policies enforce SSL/TLS connections only.

4. IAM Roles & Policies (Least Privilege)

Define distinct IAM Roles for:

Application services

Database access

Logging and auditing

Attach only the minimum required policies using inline or managed policies.

Deny wildcard (*) permissions and enforce least privilege.

5. CloudWatch Logging (Encrypted Central Logging)

Create CloudWatch Log Groups encrypted with KMS keys.

Send:

VPC flow logs

Application logs

CloudTrail logs

Config compliance logs
to these Log Groups.

6. Security Groups

Define security groups with:

Restricted CIDR ranges (e.g., specific corporate IPs only).

Only required ingress/egress rules — e.g., port 22 (SSH) and 443 (HTTPS).

Apply principle of least access.

7. AWS Config Rules

Enable AWS Config and define Config Rules to ensure:

S3 buckets are encrypted.

Security groups do not allow unrestricted ingress.

Resources are properly tagged.

CloudTrail and CloudWatch are enabled.

8. Databases

Deploy RDS or DynamoDB instances within private subnets only.

Enable storage encryption with KMS.

Disable public access.

9. Application Layer (TLS/SSL)

Use AWS ACM certificates for SSL/TLS.

Attach certificates to all load balancers or endpoints handling public traffic.

10. CloudTrail (Auditing & Multi-Region Logging)

Enable AWS CloudTrail in all regions.

Store audit logs in an encrypted S3 bucket and forward them to CloudWatch Log Groups.

Enable log file validation for integrity.

11. KMS Key Management

Define customer-managed KMS keys for encryption across:

S3

RDS

CloudWatch

CloudTrail

Config logs

Compliance & Security Constraints

All data at rest must use KMS encryption.

All data in transit must use SSL/TLS.

All resources must adhere to least-privilege IAM and restricted network access.

Ensure multi-region redundancy for critical components (S3, CloudTrail).

Ensure AWS Config enforces ongoing compliance automatically.

Expected Output

Generate a fully functional single Terraform file (main.tf) that:

Implements all above resources and policies.

Passes terraform validate successfully.

Deploys without manual edits in an AWS test account.

Demonstrates proper cross-region redundancy, encryption, compliance, and logging.
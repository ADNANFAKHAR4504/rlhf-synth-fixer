You are tasked with creating an AWS CloudFormation template in YAML that establishes a highly secure AWS environment in the US West (Oregon) region (us-west-2). This template must implement a comprehensive set of security best practices and compliance measures across multiple AWS services, including EC2, S3, RDS, VPC, IAM, Lambda, and more. The template should be deployable without errors and adhere to AWS CloudFormation best practices.

Detailed Requirements:

Region: All resources must be created in the us-west-2 region.
IAM for EC2: Use IAM roles (not IAM users) for managing permissions within EC2 instances.
VPC Flow Logs: Enable VPC Flow Logs for all VPCs to monitor network traffic.
S3 Encryption: Encrypt all S3 buckets using AES-256 encryption (SSE-S3).
RDS Backups: Automate RDS instance backups using the AWS Backup service.
EBS Encryption: Encrypt all EBS volumes.
CloudTrail: Enable CloudTrail to capture all API activity within the account.
S3 Public Access: Disable public access for all S3 buckets unless explicitly required.
EC2 in VPC: Launch all EC2 instances within Virtual Private Clouds (VPCs) and not in the default VPC.
SSH Access: Set up security groups to allow SSH access only from specified CIDR blocks (e.g., restrict to a trusted IP range).
AWS Config: Implement AWS Config to ensure compliance and configuration monitoring.
GuardDuty: Enable GuardDuty for ongoing threat detection.
Lambda in VPC: Ensure Lambda functions operate within VPCs for network isolation.
KMS Encryption: Use KMS customer-managed keys for encrypting sensitive application data and communications.
TLS Encryption: Ensure TLS is employed for all data transfers both to and from AWS.
Cost Reporting: Provide detailed billing and utilization reporting with AWS Cost Explorer.
Password Policy: Enforce a strong password policy across IAM users (minimum 12 characters, including numbers and symbols).
AMI Hardening: Validate that AMIs are hardened and updated regularly for deployment.
Additional Context:

The template should be self-contained and idempotent, meaning it can be deployed multiple times without issues.
Use AWS CloudFormation parameters where necessary to allow flexibility (e.g., for CIDR blocks or key IDs).
Follow security best practices, such as least privilege for IAM roles and encryption at rest and in transit.
Ensure all resources are tagged appropriately for cost management and organization.
Expected Output:
A YAML-formatted CloudFormation template named secure_env.yaml that satisfies all the above requirements. The template must pass AWS CloudFormation validation and be ready for deployment.

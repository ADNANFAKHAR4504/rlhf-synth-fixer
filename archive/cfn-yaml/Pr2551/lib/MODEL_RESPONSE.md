Overview

This CloudFormation template provisions a secure and compliant AWS environment that aligns with AWS best practices and regulatory frameworks such as CIS AWS Foundations, PCI DSS, and SOC 2.

The stack emphasizes defense-in-depth, ensuring encryption, monitoring, logging, and least-privilege IAM policies are applied consistently. WAF is intentionally skipped as per constraints.

Key Features Implemented

IAM & Access Control

IAM roles follow principle of least privilege.

MFA enforcement policy applied to all console users.

Separate roles for EC2 and Lambda with minimum required permissions.

Networking & VPC

VPC with public and private subnets across multiple AZs.

Security groups only allow inbound on ports 80 and 443.

RDS deployed in private subnets only.

Storage & Encryption

S3 buckets use server-side encryption with KMS CMKs.

EBS volumes for EC2 instances are encrypted.

RDS instances use encrypted storage.

Sensitive parameters stored in SSM Parameter Store (SecureString).

Customer-managed KMS CMKs used for all encryption tasks.

Monitoring & Compliance

CloudTrail enabled across all regions for audit logging.

AWS Config monitors and alerts on security group changes.

CloudWatch alarms for unauthorized API calls.

Centralized CloudWatch Logs for application and infrastructure logs.

DDoS Protection

AWS Shield Advanced enabled to mitigate large-scale DDoS attacks.

Integrated with ALBs for real-time protection.

Load Balancing

Application Load Balancers (ALBs) configured.

Logging enabled and protected using centralized log groups.

Compliance tags applied (Environment, Project, Owner).

Compliance Alignment

CIS AWS Foundations Benchmark: IAM, CloudTrail, Config, least privilege, restricted SGs.

PCI DSS: Encrypted storage, MFA enforcement, centralized logging.

SOC 2: Monitoring, logging, auditability, and security controls.

Outputs

The template provides outputs for:

VPC ID

Public and Private Subnet IDs

S3 Bucket ARNs

KMS Key ARNs

RDS Endpoint

CloudTrail Trail ARN

Config Recorder Status

CloudWatch Alarm ARNs
Problem Statement

You are tasked with securing an AWS environment spanning the us-east-1 and us-west-2 regions. All resource names must start with SecureEnv- and follow a private IP naming convention. The environment must comply with industry standards for security and data protection, and resources are organized under a single AWS account.

The infrastructure includes:

S3 buckets

RDS databases

EC2 instances

VPCs and subnets

Security Groups

IAM roles

AWS WAF setups

AWS Config for compliance tracking

Constraints & Requirements

KMS Encryption: Use AWS Key Management Service (KMS) to encrypt all S3 bucket data.

IAM Least Privilege: Ensure IAM roles follow the principle of least privilege.

VPC Logging: Enable logging for VPCs for monitoring and auditing.

AWS Config: Track all resource changes and maintain compliance.

CloudTrail: Log all account activity; ensure it cannot be tampered with.

MFA: Implement Multi-Factor Authentication for all IAM users.

AWS WAF: Protect web applications against SQL injection and XSS attacks.

GuardDuty: Enable Amazon GuardDuty for threat detection and anomaly monitoring.

RDS Encryption: Ensure all RDS databases are encrypted at rest and in transit.

Secure VPC: Configure VPC with appropriate subnetting, routing, and NAT gateways for Internet access when needed.

EC2 Metadata Protection: Block instance metadata access from scripts.

Security Groups: Control inbound and outbound traffic for instances.

EBS Encryption: Ensure all EBS volumes are encrypted using KMS keys.

Expected Output

A fully functional CloudFormation YAML template named:

secure_configuration.yml


The template must satisfy all constraints above.

It should deploy successfully in the outlined AWS environment.

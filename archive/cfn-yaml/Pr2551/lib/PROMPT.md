Generate a complete YAML CloudFormation template that provisions a fully secured AWS environment aligned with industry best practices and compliance requirements.

The stack must implement the following controls:

IAM & Access Control

Enforce principle of least privilege for all IAM roles and Lambda execution roles.

Ensure MFA is mandatory for all IAM users with console access.

Networking

Create a VPC with public and private subnets.

Only allow inbound traffic on ports 80 and 443 from the public internet.

Ensure RDS instances are deployed into private subnets only.

Storage & Databases

All S3 buckets must have server-side encryption (SSE-KMS) enabled by default.

Use KMS CMKs for encryption of S3, EBS, RDS, and Parameter Store.

Place RDS instances with encryption enabled in private subnets.

Compute

EC2 instances must use encrypted EBS volumes.

Assign IAM instance profiles with only the minimum permissions needed.

Monitoring & Logging

Enable CloudTrail across all regions.

Enable AWS Config with rules to notify on security group changes.

Use CloudWatch alarms to detect and notify on unauthorized API calls.

Centralize all logs with CloudWatch Logs for application and infrastructure events.

Security & Compliance

Store all sensitive information (passwords, DB creds, API keys) in SSM Parameter Store (SecureString).

Enable AWS Shield Advanced for DDoS protection.

Application Load Balancers must be configured with centralized logging and compliance tagging.

Constraints & Notes:

Skip WAF integration.

Ensure tagging for compliance (Environment, Project, Owner).

The template must be production-ready and aligned with CIS AWS Foundations, PCI DSS, and SOC 2 controls.

Provide Outputs for critical resources (VPC ID, Subnet IDs, S3 Bucket ARNs, RDS Endpoint, KMS Key IDs, etc.).

Expected Output:
A single, self-contained YAML CloudFormation template that meets all requirements above, ready to be deployed and validated against real-world security audits.
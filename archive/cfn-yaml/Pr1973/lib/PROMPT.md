As an AWS CloudFormation expert, you are tasked with creating a comprehensive security-focused template for a multi-account AWS environment. Develop a YAML-formatted CloudFormation template that implements the following advanced security measures across all accounts, ensuring consistency and adherence to AWS best practices:

VPC Configuration: All EC2 instances must be launched within a designated VPC in the us-east-1 region. The VPC should be appropriately configured with subnets, route tables, and internet gateway.
IAM Roles: Implement IAM roles with least privilege permissions for all AWS services. Ensure roles are granular and specific to each service's needs.
CloudTrail Logging: Enable logging of all API calls using AWS CloudTrail. Configure a trail that logs all management events and delivers logs to a secure S3 bucket.
S3 Encryption: Ensure that all S3 buckets have server-side encryption (SSE) enabled by default, using AWS-KMS or similar.
RDS Backups: All RDS databases must have automated backups enabled with a retention period of at least 7 days.
AWS Config: Configure AWS Config to monitor changes in security groups. Set up rules to detect and alert on unauthorized changes.
Access Key Rotation: Implement a mechanism to ensure that access keys older than 90 days are rotated or disabled. This may involve using IAM policies or Lambda functions.
MFA Enforcement: Enable Multi-Factor Authentication (MFA) on all IAM user accounts. Enforce MFA for console and API access.
Security Hub: Ensure AWS Security Hub is enabled and integrated for continuous monitoring across all accounts. Enable standard security standards like CIS AWS Foundations Benchmark.
Secrets Management: Use AWS Systems Manager Parameter Store or Secrets Manager for all sensitive information, such as database passwords or API keys.
EBS Encryption: All EBS volumes must be encrypted by default using AWS KMS keys.
TLS Enforcement: Enforce use of TLS for all connections to any Load Balancer (Application or Network Load Balancer). Ensure listeners use HTTPS and redirect HTTP to HTTPS.
Additionally, the template must:

Support a multi-account strategy with consolidated billing and centralized monitoring.
Include consistent IAM policies across accounts.
Use parameters for flexibility, such as for VPC CIDR blocks or KMS key IDs.
Include outputs for key resources like CloudTrail bucket name, Security Hub status, etc.
Pass AWS CloudFormation validation and be deployable in the us-east-1 region.
Provide the complete ready for use YAML template.

Generate a single main.tf Terraform configuration file (HCL) that provisions a secure AWS environment in the us-east-1 region, following AWS security best practices. The configuration must satisfy these requirements:

All S3 buckets must enforce SSL-only access for data in transit.

All EBS volumes must have encryption at rest enabled.

Use IAM roles instead of root credentials for ECS tasks.

Enforce multi-factor authentication (MFA) for all IAM users.

Use AWS KMS to manage encryption keys and encrypt all supported data (S3, EBS, RDS, CloudTrail).

Ensure CloudTrail logs are encrypted using SSE-KMS.

Restrict RDS database access via VPC Security Groups (only from application subnets/instances).

Route all application traffic through Amazon CloudFront to provide DDoS protection.

Enable VPC Flow Logs, storing them in a non-default S3 bucket with encryption and lifecycle policies.

Deploy AWS WAF WebACL associated with CloudFront to filter malicious HTTP/HTTPS traffic.

Additional constraints and best practices:

All resources must include tags (e.g., Environment, Project, Owner).

Use variables and locals for region, CIDR ranges, and sensitive values.

Use data sources for latest AMIs where applicable.

IAM policies must follow least-privilege principles.

Ensure high availability (multi-AZ deployments where relevant).

Configuration must be in a single file (main.tf) only (no modules or multiple files).
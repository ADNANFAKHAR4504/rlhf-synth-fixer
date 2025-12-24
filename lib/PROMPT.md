Need a CloudFormation template in YAML that sets up secure AWS infrastructure in us-east-1. This needs to follow security best practices for a production environment.

Requirements:

IAM: Set up IAM roles and policies using least privilege. Attach policies to roles, not users. Require MFA for console access. Use condition keys to restrict requests based on AWS attributes.

Storage Security: Encrypt all S3 buckets, RDS instances, and EBS volumes at rest using KMS or AWS-managed keys. Enable S3 bucket logging with a dedicated logging bucket.

Secrets Management: Use AWS Secrets Manager for storing credentials and enable automatic rotation for API keys.

Networking: All EC2 instances must run inside a custom VPC - block the default VPC. Security groups should deny all traffic except explicitly allowed ports. Keep dev and prod environments isolated.

Monitoring: Enable CloudTrail for audit logging, CloudWatch detailed monitoring for EC2, and make sure Lambda functions have least privilege IAM permissions.

Constraints:
- Single YAML CloudFormation template
- No default VPC allowed
- Tag everything with env, owner, and project tags
- EC2 and RDS only in us-east-1
- Include outputs for key resource IDs

The template should use Parameters for configuration, Mappings for environment-specific values, and include comments showing how each security control is implemented.

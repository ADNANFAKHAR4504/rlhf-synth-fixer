Develop a Terraform configuration to deploy a secure, compliant AWS environment. The deployment is expected to do the following:

- Configure S3 buckets with server-side encryption (SSE-KMS) enabled by default.
- Create IAM roles with least-privilege policies and avoid wildcard actions like `s3:*`.
- Configure Security Groups to not allow `0.0.0.0/0` ingress; use specific CIDRs only.
- Ensure all Lambda functions have environment variables encrypted with KMS.
- Enable CloudTrail multi-region logging with SSE-KMS and log file validation.
- Deploy RDS in Multi-AZ mode with automated backups and encryption at rest.
- Apply strict S3 bucket policies to block all public access and prevent public read/write.
- Enable VPC Flow Logs to CloudWatch Logs for network traffic monitoring.
- Ensure all EBS volumes are encrypted at rest by enabling default encryption.
- Configure AWS Config with managed rules for compliance tracking and resource monitoring.
- Create a Lambda@Edge function for CloudFront request/response security inspection.
- Connect S3 via VPC Gateway Endpoint to restrict data access to private networks.
- Enable GuardDuty threat detection across all supported regions.
- Ensure all EC2 instances launch within the defined VPC and private subnets.
- Implement IAM account password policy and MFA enforcement for administrative actions.
- Use AWS Systems Manager Parameter Store (SecureString with KMS) for secrets management.
- Organise Terraform code into modular files
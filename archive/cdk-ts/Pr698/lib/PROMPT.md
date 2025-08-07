I need to create a secure AWS architecture using AWS CDK TypeScript that implements comprehensive security controls across multiple services. 

The architecture needs to include:
- AWS KMS with automatic rotation for encryption key management
- S3 buckets with server-side encryption using S3-managed keys
- CloudTrail configured across all regions with secure log storage
- RDS instances with encryption and automated backups
- IAM roles and policies following least privilege principles
- VPC with public and private subnets across two availability zones with NAT gateway
- DDoS protection using AWS Shield and AWS WAF on CloudFront
- MFA enforcement for IAM users accessing AWS Management Console
- Security group change logging to CloudWatch Logs
- AWS Config for compliance checking against security best practices
- Lambda environment variable encryption
- Amazon Inspector for continuous vulnerability assessment

I need infrastructure code that creates a production-ready secure architecture. The latest features like AWS KMS ECDH key agreement support and Amazon Inspector code security capabilities should be considered where applicable.

Please provide the complete CDK TypeScript code with one code block per file that implements all these security requirements.
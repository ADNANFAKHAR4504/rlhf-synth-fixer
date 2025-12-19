# Secure Infrastructure Setup with Pulumi Go

I need to build a secure infrastructure for a new web application using Pulumi in Go. The setup should be production-ready and follow security best practices.

The infrastructure needs to be deployed in the us-east-1 region and should include proper security measures. All resources should use the default IAM policy for access control, and S3 buckets need logging enabled to track access and changes.

For data protection, I need a DynamoDB table that must be private with no public access allowed. I want to use AWS KMS for encrypting sensitive data and resources. Every resource should be tagged with environment=production for proper identification and billing.

Monitoring should also be included using Cloudwatch metrics and notifications

The solution should be a single Go file that creates this infrastructure.

This needs to be production-ready with comprehensive security measures and proper resource management.

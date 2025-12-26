# Multi-Region Infrastructure in Pulumi Go

I need help setting up a multi-region AWS infrastructure using Pulumi in Go. Here's what I'm trying to build:

I want an S3 bucket that serves static files through CloudFront distribution for faster global access. The S3 bucket needs KMS encryption for security. Also need an RDS database that connects to EC2 instances in private subnets, with CloudWatch log groups that receive logs from RDS and EC2. IAM roles should grant EC2 instances access to read from the S3 bucket and write metrics to CloudWatch.

Requirements:
- Deploy across at least three AWS regions
- Tag everything with environment and purpose tags
- Name things like dev-my-bucket, prod-my-database, etc
- Put all code in one .go file with a struct I can reuse
- Support different configs like instance sizes or database settings
- IAM policies should only grant specific permissions needed (no wildcards on actions or resources)
- CloudWatch monitoring and logging for RDS, EC2, and S3
- AWS Config for compliance tracking
- Export important values like bucket names and database endpoints
- RDS setup: Multi-AZ, Performance Insights enabled, encrypted with KMS, auto minor version upgrades on, backup retention 7 days
- Valid Pulumi Go code ready to deploy
- Skip boilerplate, just core infrastructure

Give me the complete Pulumi Go code in one file with everything in a reusable struct.

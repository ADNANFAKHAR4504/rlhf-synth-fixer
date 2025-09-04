# AWS Security Environment Setup

We need a CloudFormation template to create a secure AWS environment for our multi-account organization. All resources should be deployed in us-east-1 region with lowercase naming using hyphens like 'project-x'. The goal is to establish strong security and monitoring across the organization.

Required security controls:

- IAM roles with least privilege access that only grant minimum necessary permissions
- S3 buckets encrypted with AWS KMS keys
- CloudTrail logging enabled for all IAM role activity monitoring
- API Gateway configured to require HTTPS for all communication
- Security groups that restrict inbound traffic to specific IP ranges
- EC2 instances deployed within VPC for network isolation
- CloudWatch alarms configured to detect unauthorized access attempts

The template should pass CloudFormation validation tools like cfn-lint and correctly implement all these security requirements.

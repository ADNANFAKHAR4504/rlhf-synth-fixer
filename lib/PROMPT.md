##Lock Down AWS Setup

we need a CloudFormation YAML template to set up a secure AWS environment. It's for a multi-account AWS setup, all within the `us-east-1` region and part of the same AWS Organization. We'll use lowercase names with hyphens, like 'project-x'. The main goal is to make sure our security and monitoring are solid across the whole organization.

Here's what the template needs to do:

- **IAM Roles**: Use IAM roles to control who can get to resources, making sure they only have the minimum permissions they need.
- **S3 Encryption**: All S3 buckets need to be encrypted using AWS KMS.
- **CloudTrail Logging**: Turn on logging for all IAM roles to CloudTrail. This helps us see who's doing what.
- **API Gateway Security**: Make sure all communication with API Gateway uses HTTPS.
- **Security Groups**: Configure security groups to only let in traffic from specific IP ranges.
- **EC2 in VPC**: Ensure all EC2 instances are launched inside a VPC.
- **Security Alarms**: Set up CloudWatch alarms to warn us about any unauthorized access attempts.

We need a CloudFormation YAML template that passes validation (like with `cfn-lint`) and sets up everything correctly based on these rules.

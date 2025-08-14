# Terraform Infrastructure Setup: AWS Security Best Practices

## Goal:
The goal here is to create secure infrastructure on AWS using Terraform, while adhering to security best practices.

## What needs to be done:
1. Set up IAM roles that manage permissions without using inline policies.
2. Make sure all data in S3 buckets is encrypted using AES-256 encryption.
3. Build a secure VPC with private subnets to ensure proper network isolation.
4. Configure Lambda functions to only trigger from IAM-authenticated sources.
5. Ensure that all RDS actions are logged and the logs are encrypted.
6. Set up EC2 security groups that allow SSH only from a specific range of IPs.
7. Use AWS KMS for key management and configure automatic key rotation.

## Work Environment:
We’ll be using Terraform to implement all of this. Here’s how the setup should look:

1. **IAM Roles**: Manage permissions with roles, not inline policies.
2. **Encryption**: Encrypt all S3 bucket data using AES-256 encryption.
3. **VPC**: Set up a VPC with private subnets to keep resources isolated.
4. **Lambda**: Restrict Lambda function triggers to IAM-authenticated sources only.
5. **RDS**: Enable logging for all RDS actions and make sure those logs are encrypted.
6. **EC2 Security Groups**: Limit access to EC2 instances to SSH traffic only, and restrict it to a defined IP range.
7. **Key Management**: Use AWS KMS for all encryption and ensure key rotation is enabled.

## What you should produce:
A Terraform configuration file that includes all of the above security measures. Once you apply the configuration, the infrastructure should pass all security checks, including those from AWS Trusted Advisor.

## Notes:
- Stick to the naming conventions, such as prefixing resources with `prod-`.
- Make sure to handle different AWS regions and workspaces for environment isolation.

This setup should provide a secure foundation for AWS resources while maintaining best practices.

# prompt.md

## Goal

Update the existing AWS CDK stack to improve security by adding the following:

### 1. Enable KMS Encryption for S3 Buckets
- All S3 buckets in the stack must use **AWS KMS** encryption for data at rest.
- Use a customer-managed KMS key or the default AWS-managed key.

### 2. Use AWS Secrets Manager for Passwords
- Store all passwords or sensitive data in **AWS Secrets Manager**.

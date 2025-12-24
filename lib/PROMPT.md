# prompt.md

## Goal

Update the existing AWS CDK stack to improve security by adding the following:

### 1. Enable KMS Encryption for S3 Buckets
- All S3 buckets in the stack must use **AWS KMS** encryption for data at rest.
- S3 buckets connect to KMS keys to encrypt objects stored in the buckets.
- Use a customer-managed KMS key or the default AWS-managed key.
- Applications writing to S3 buckets will automatically use the KMS key for encryption.

### 2. Use AWS Secrets Manager for Passwords
- Store all passwords or sensitive data in **AWS Secrets Manager**.
- RDS database instances read database credentials from Secrets Manager during initialization.
- Applications access secrets from Secrets Manager to connect to RDS databases.
- Secrets Manager uses KMS keys to encrypt secrets at rest.

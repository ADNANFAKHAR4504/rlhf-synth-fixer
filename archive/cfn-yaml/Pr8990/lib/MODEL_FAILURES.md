# prompt.md

## Goal

Enhance the AWS CDK stack with the following security best practices:

### Success Criteria

1. **S3 Buckets**
   - All S3 buckets use **AWS KMS encryption** for data at rest.
   - Either a **customer-managed** or **AWS-managed KMS key** is used.

2. **Secrets Management**
   - All passwords or secrets are stored securely in **AWS Secrets Manager**.

3. **Testing**
   - All existing **unit tests pass** without errors after implementing these changes.

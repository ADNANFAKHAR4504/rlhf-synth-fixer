# CDK Secure Infrastructure Configuration (Python)

## Objective

Set up a secure infrastructure configuration using **CDK with Python**, ensuring:

- **Encryption at rest** with AWS KMS for S3 buckets (including all current and future objects)
- **Encryption in transit** using valid **SSL/TLS certificates** for all endpoints
- **IAM roles** that strictly follow the **principle of least privilege**

## Requirements

1. **S3 Encryption at Rest**  
   - Use **AWS KMS** to encrypt all S3 buckets.
   - Ensure all existing and future objects in these buckets are encrypted with the specified KMS key.

2. **Encryption in Transit**  
   - All exposed endpoints (e.g., APIs, websites) must use **valid SSL/TLS certificates**.
   - Enforce HTTPS-only access using security best practices.

3. **IAM Best Practices**  
   - Define **IAM roles** with minimal, task-specific permissions.
   - Ensure roles are **scoped tightly** to resources they manage or access.

4. **CDK Usage**  
   - Implement all infrastructure as code in **CDK (Python)**.
   - Organize code in a **new branch named `secure-setup`**.
   - Include **unit tests** that validate:
     - S3 encryption settings
     - TLS enforcement
     - IAM policies and scope

5. **Quality Criteria**  
   - All tests must **pass without errors**
   - Code should be clean, readable, and follow best practices
   - CDK configuration files (`__main__.py`, `CDK.yaml`, etc.) should be properly structured

## Deliverables

- Python source code implementing the CDK infrastructure
- Unit test suite for validating encryption and IAM logic
- Branch name: `secure-setup`

## Test Expectations

Ensure the following are programmatically tested:
- S3 bucket default encryption is enabled with a KMS key
- All created endpoints use HTTPS with a valid certificate (e.g., ACM)
- IAM roles have no broader permissions than necessary


You are an AWS Cloud Architect specializing in secure infrastructure design with CloudFormation.
Your task is to create a YAML-based CloudFormation template that provisions a secure foundation on AWS,
following best practices for privacy, encryption, IAM, and monitoring.

The solution must satisfy these requirements:

1. **Amazon S3**
   - All buckets should be private by default.
   - Server access logging must be enabled, with logs stored in a dedicated logging bucket.

2. **Amazon RDS**
   - All database instances must have encryption at rest enabled.
   - Encryption must use KMS Customer Master Keys (CMKs) that are explicitly defined.

3. **IAM Roles**
   - IAM roles should follow the principle of least privilege.
   - Only the minimum required policies should be attached to each role.

4. **CloudWatch Monitoring**
   - Set up CloudWatch alarms that can detect unauthorized access attempts.
   - Ensure alerts are configured so potential breaches can be caught quickly.

**Constraints:**

- Every S3 bucket must enforce privacy and logging.
- RDS instances must rely on CMK encryption.
- IAM must grant only necessary privileges.
- CloudWatch must provide alarms for unauthorized access attempts.

**Expected Output:**
Provide a valid YAML CloudFormation template that:

- Implements these security requirements in full.
- Passes `aws cloudformation validate-template` without errors.
- Includes parameters, resources, and outputs.
- Can be deployed in a test AWS environment to demonstrate compliance and functionality.

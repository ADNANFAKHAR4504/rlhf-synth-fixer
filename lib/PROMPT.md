## Problem Statement Refinement

**Title:**  
Design a Security-First AWS CloudFormation YAML Template

**Objective:**  
Create an AWS CloudFormation YAML template (`SecurityConfig.yml`) that codifies security best practices for a cloud environment, ensuring robust access control, monitoring, and auditing as per the constraints below.

**Scope & Requirements:**  

1. **Region Enforcement:**  
   - All resources must be deployed in the `us-east-1` region.

2. **IAM Best Practices:**  
   - Use IAM roles for EC2 instances; do not use IAM users for EC2 permissions.
   - Implement the principle of least privilege for all IAM roles and policies.
   - Enable Multi-Factor Authentication (MFA) for the root user and any IAM user with AWS Console access.

3. **S3 Security:**  
   - All S3 buckets must have server-side encryption enabled (AES-256).
   - S3 buckets must not be publicly accessible unless explicitly justified.

4. **CloudTrail Auditing:**  
   - Enable AWS CloudTrail in all regions to log API activity for auditing purposes.

5. **EC2 Network Security:**  
   - EC2 instances must be associated with security groups that restrict SSH (port 22) access to a specific, approved IP range.

6. **CloudWatch Monitoring:**  
   - Configure CloudWatch alarms for critical resources.
   - Ensure alarms notify a specified SNS topic.

**Expected Output:**  
- Deliver a CloudFormation YAML template file named `SecurityConfig.yml` that implements all the above constraints.
- The template must be deployable without errors and pass AWS CloudFormation validation.
- All resources and configurations should strictly adhere to AWS security best practices.

**Notes:**  
- Justify any public S3 bucket configuration if it is required.
- Specify the approved IP range for SSH access.
- Identify the SNS topic for CloudWatch alarm notifications.

---

**Goal:**  
Provide a comprehensive, secure, and compliant starting point for cloud infrastructure as code using AWS CloudFormation.
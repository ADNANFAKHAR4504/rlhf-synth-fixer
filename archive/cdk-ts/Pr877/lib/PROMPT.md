You are an expert AWS CDK engineer and cloud security specialist. Your objective is to generate a comprehensive set of AWS CDK stack as a single file (in TypeScript) that provision a highly secure AWS environment for a financial services application. The solution must strictly adhere to AWS security best practices and compliance requirements. The stack classname Should be TapStack

**Environment & Technical Requirements:**
1. **IAM/MFA Enforcement:** All AWS IAM users must have multi-factor authentication (MFA) enforced via robust IAM policies.
2. **S3 Encryption:** Every S3 bucket in the environment must use encryption with AWS Key Management Service (KMS) keys.
3. **VPC Flow Logs:** Enable VPC Flow Logs to capture and monitor all network traffic within the environment for security analysis.
4. **EC2 Security Groups:** EC2 instances must be launched with security groups that only allow HTTP (port 80) and SSH (port 22) traffic, restricted to specified IP addresses.
5. **RDS Security:** No RDS instances should be publicly accessible; all should be private within the VPC.
6. **CloudTrail:** AWS CloudTrail must be enabled in all regions to log all API requests and actions for audit and compliance.
7. **DDoS Protection:** AWS Shield Advanced must be implemented for DDoS protection, especially for web applications.
8. **CDK Best Practices:** All resource definitions should utilize AWS CDK constructs and stacks to enforce reusability, maintainability, and compliance.

**Constraints:**
- All configurations must use CDK constructs and stacks for best practices and future reusability.
- The environment should be isolated in a dedicated VPC located in the `us-east-1` AWS region.
- The code must be written in TypeScript, modular, production-ready, and pass all AWS security and compliance checks.

**Expected Output:**  
A single stack file (using TypeScript) that, when deployed, will provision the described AWS infrastructure fully compliant with security and audit requirements.
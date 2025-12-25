You are an expert AWS CDK engineer and cloud security specialist. Generate a comprehensive AWS CDK stack in TypeScript that provisions a highly secure AWS environment for a financial services application. The stack classname should be TapStack.

**Architecture and Service Integration:**

The infrastructure should deploy a VPC with public and private subnets where EC2 instances in public subnets connect to RDS databases in private subnets through security groups that control traffic flow. EC2 instances use IAM roles with policies that grant access to S3 buckets encrypted with KMS keys, ensuring data flows are protected both in transit and at rest.

S3 buckets encrypted with KMS customer-managed keys integrate with application servers through VPC endpoints, allowing secure data transfer without internet exposure. IAM policies gate access to these encrypted buckets, requiring MFA authentication for sensitive operations and restricting access based on security group membership.

VPC security groups control network traffic between EC2 instances and RDS databases, allowing only necessary ports like HTTP and SSH from specified IP addresses. RDS instances remain isolated in private subnets, accessible only through the application tier via security group rules that enforce least-privilege access.

CloudTrail logs all API requests across the environment and integrates with CloudWatch Logs for real-time security monitoring. CloudWatch alarms trigger on suspicious activity patterns detected in CloudTrail logs, creating a security monitoring pipeline that connects audit logging with alerting.

**Security Requirements:**

1. IAM MFA Enforcement: All IAM users must have multi-factor authentication enforced via IAM policies that deny actions without MFA present.

2. S3 Encryption: Every S3 bucket must use KMS encryption with customer-managed keys, and bucket policies should reject unencrypted uploads.

3. VPC Flow Logs: Enable VPC Flow Logs that capture network traffic and send logs to CloudWatch Logs for security analysis and monitoring.

4. EC2 Security Groups: EC2 instances must use security groups that only allow HTTP on port 80 and SSH on port 22, restricted to specified IP addresses.

5. RDS Security: RDS instances must be deployed in private subnets within the VPC, not publicly accessible, with security groups controlling database access from application servers.

6. CloudTrail: AWS CloudTrail must be enabled in all regions to log API requests, with logs stored in encrypted S3 buckets and integrated with CloudWatch for monitoring.

7. DDoS Protection: Implement AWS Shield Advanced for DDoS protection, especially for web applications exposed through load balancers.

**Constraints:**

- All configurations must use CDK constructs and stacks for best practices and future reusability
- The environment should be isolated in a dedicated VPC located in the us-east-1 AWS region
- The code must be written in TypeScript, modular, production-ready, and pass all AWS security and compliance checks

**Expected Output:**

A single stack file in TypeScript that, when deployed, provisions the described AWS infrastructure fully compliant with security and audit requirements.

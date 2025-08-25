I need to create a secure AWS infrastructure using Pulumi with JavaScript that follows security best practices. The infrastructure should include the following components:

**Core Security Requirements:**
1. Create a VPC with public and private subnets across multiple availability zones for network isolation
2. Set up S3 buckets with strict public access blocking and server-side encryption enabled
3. Deploy an RDS database instance with encryption at rest in private subnets
4. Implement IAM roles and policies following the principle of least privilege
5. Configure security groups to restrict inbound traffic to only HTTP (80) and HTTPS (443) ports from specific IP ranges
6. Enable VPC flow logs for network traffic monitoring

**Additional Security Features:**
7. Set up AWS KMS customer-managed keys for encryption at rest
8. Enable AWS CloudTrail for API audit logging
9. Configure Amazon GuardDuty for threat detection with malware protection for S3
10. Implement AWS Config for compliance monitoring and configuration tracking

**Infrastructure Components Required:**
- VPC with public/private subnets in multiple AZs
- Internet Gateway and NAT Gateways for connectivity
- Security groups with least privilege access rules
- S3 buckets with public access blocked and KMS encryption
- RDS MySQL database in private subnet with encryption
- IAM roles for EC2, S3, and RDS services
- KMS keys for different encryption purposes
- VPC Flow Logs stored in S3
- CloudTrail logging to S3
- GuardDuty detector with S3 malware protection
- AWS Config configuration recorder and delivery channel

**Security Constraints:**
- All S3 buckets must have public read/write access blocked
- RDS instances must have encryption at rest enabled
- Security groups should only allow necessary ports (80, 443) from defined IP ranges
- IAM policies must follow least privilege principle
- All resources should be properly tagged for compliance
- Use customer-managed KMS keys where possible
- Enable logging and monitoring for all supported services

Please generate the complete Pulumi JavaScript infrastructure code that implements these security requirements. The code should be production-ready and follow AWS security best practices.
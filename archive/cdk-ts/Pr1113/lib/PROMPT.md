I need to create a secure infrastructure environment for a global ecommerce platform using CDK TypeScript. The setup needs to meet strict security compliance requirements:

1. Create IAM roles following the principle of least privilege
2. Configure all S3 buckets with server-side encryption enforced
3. Set up security groups that only allow inbound traffic from public internet on ports 80 and 443
4. Log all DNS queries through CloudTrail
5. Enable AWS Config to track configuration changes of AWS resources
6. Activate CloudTrail in all AWS regions for governance
7. Use AWS Key Management Service (KMS) for encryption keys on S3 buckets
8. Enforce multi-factor authentication (MFA) for all IAM users
9. Enable VPC Flow Logs for all subnets within all VPCs
10. Restrict database instance access via RDS security group rules to a specific IP range
11. Implement password policies for IAM users requiring minimum 12 characters
12. Ensure all EC2 metadata service accesses require IMDSv2
13. Set up SNS notifications for security group alterations to notify admin email
14. Create automated daily compliance checks to detect and report security policy deviations

The environment supports a global ecommerce platform with high traffic across multiple regions. Security compliance is critical for preventing data breaches and maintaining customer trust.

Please create infrastructure code that implements these security measures and policies. Include GuardDuty for enhanced threat detection and AWS Secrets Manager for secure credential management. Use the latest AWS security features like enhanced VPC Flow Logs with KMS encryption and automated compliance monitoring.
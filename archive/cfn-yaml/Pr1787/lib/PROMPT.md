I need to create a comprehensive security-focused CloudFormation template in YAML format for AWS us-west-2 region. The infrastructure should implement security best practices and include the following components:

1. Create IAM roles with strict assume role policies that only allow access from trusted AWS accounts or specific services
2. Set up customer-managed KMS keys for encrypting all resources that support encryption
3. Deploy a VPC with appropriate subnets and enable VPC Flow Logs to monitor all network traffic
4. Configure Security Groups that restrict SSH access to port 22 and HTTP/HTTPS access to ports 80/443 from specific IP address ranges only
5. Implement AWS Config to monitor compliance with security best practices and evaluate resource configurations
6. Enable AWS CloudTrail for comprehensive audit logging of all account activities and deliver logs to an S3 bucket
7. Create S3 buckets with default encryption enabled and appropriate bucket policies to safeguard data

Please use the latest AWS security features including GuardDuty Malware Protection for S3 and AWS Security Hub integration where applicable. Ensure all resources follow proper naming conventions and include appropriate tags.

Generate the complete infrastructure code with one code block per file. The main template should be comprehensive and production-ready.
I need to create a comprehensive security as code configuration for a large-scale enterprise AWS environment using AWS CDK JavaScript. The solution must implement the following security requirements:

1. Ensure all S3 buckets have server-side encryption enabled by default with KMS encryption
2. Configure IAM policies following the principle of least privilege with explicit deny statements
3. Set up CloudTrail to record all API actions across all regions with log file validation enabled
4. Implement AWS Shield Advanced for DDoS protection on all publicly accessible endpoints
5. All EC2 instances must not have public IP addresses by default and use private subnets
6. Ensure that all RDS instances are encrypted using customer-managed KMS keys with automated backups
7. Use CloudWatch to monitor network intrusions with custom metrics and trigger alarms for suspicious activity
8. All Lambda functions should have restricted permissions via IAM roles with resource-based policies
9. Enforce VPC flow logs to be enabled for all VPCs in the account with CloudWatch Logs destination

Additional modern AWS security requirements:
- Implement AWS Security Hub with compliance standards (CIS, PCI DSS, AWS Foundational Security Standard)
- Use AWS Systems Manager Session Manager for secure EC2 access without SSH keys or bastion hosts

Please provide infrastructure code as AWS CDK JavaScript with one code block per file. The solution should be production-ready and follow AWS Well-Architected Framework security pillar best practices. Target deployment region is us-east-1.
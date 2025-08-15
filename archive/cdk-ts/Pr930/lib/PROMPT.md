I need to deploy secure AWS infrastructure for a financial institution using CDK TypeScript. The solution must follow security best practices and include these requirements:

1. Create IAM roles and policies with least privilege access for all services
2. Tag all resources with Environment and Owner tags for compliance tracking
3. Deploy S3 buckets with versioning enabled and restrict access to specific CIDR blocks (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
4. Set up CloudTrail to log all API calls across the account
5. Configure security groups that only allow SSH access from approved IP ranges
6. Deploy Lambda functions with minimal IAM permissions
7. Ensure all EBS volumes use KMS encryption
8. Create CloudWatch alarms to detect unauthorized third-party API calls
9. Deploy RDS instances that are not publicly accessible
10. Enable VPC Flow Logs on all subnets to capture network traffic
11. Use AWS Shield Advanced and AWS Certificate Manager for enhanced protection
12. Implement AWS WAF with managed rule groups for application security

The infrastructure should be production-ready and demonstrate security controls required for regulated financial environments. Please provide the complete CDK TypeScript code with one code block per file.
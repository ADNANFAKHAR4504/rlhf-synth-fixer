I need to create a secure AWS environment for a web application that works in both staging and production environments. The infrastructure should include:

1. EC2 instances that are only t2.micro type for cost optimization
2. Security groups that only allow port 22 (SSH) and port 80 (HTTP)
3. IAM roles attached to EC2 instances with minimal permissions following least privilege principle
4. All IAM users must have MFA enabled
5. SNS topics configured to use HTTPS subscriptions only
6. All resources tagged with "Project: X"
7. A Lambda function that automatically shuts down all EC2 instances at 8 PM daily
8. Use EventBridge Scheduler for precise timing control
9. S3 bucket with default encryption enabled
10. All EBS volumes must be encrypted
11. RDS database for the application with appropriate security settings
12. Environment-specific configuration using context variables for staging and production

The solution should use AWS CDK with TypeScript and deploy to us-east-1 region. Include IAM Access Analyzer for security validation and implement proper resource naming with environment suffixes. Make sure to use the latest AWS security features like enhanced MFA enforcement and proper IAM role configurations.
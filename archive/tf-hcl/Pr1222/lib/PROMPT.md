I need help setting up a secure cloud infrastructure using Terraform on AWS. I'm working on a project that needs to follow security best practices and compliance requirements.

Here's what I need to implement:

1. Create IAM roles with proper permissions for EC2 instances and Lambda functions
2. Set up S3 buckets with KMS encryption for sensitive data storage
3. Tag all resources with 'environment' and 'owner' tags for management
4. Use AWS WAF to protect web applications from common threats
5. Configure CloudWatch monitoring and alarms for EC2 CPU usage
6. Send all logs (VPC flow logs, ALB logs) to CloudWatch Logs
7. Restrict SSH access to EC2 instances to specific IP ranges
8. Set up RDS with encryption at rest and in transit
9. Create automated EBS volume backups with 30-day retention using AWS Backup
10. Use separate VPCs for development, testing, and production environments
11. Make sure Lambda functions follow least privilege access
12. Enable S3 bucket versioning to prevent data loss
13. Set up AWS Config to check if required tags are applied to resources
14. Use AWS Secrets Manager for secure database credential storage

I want to use some of the latest AWS security features like AWS Shield Advanced for network security posture management and the new AWS WAF simplified protection packs. The infrastructure should be deployed in us-east-1 region and follow the naming pattern 'proj-env-function'.

Can you provide complete Terraform configuration files that implement all these security requirements? Please provide one code block per file so I can easily copy and create each file.
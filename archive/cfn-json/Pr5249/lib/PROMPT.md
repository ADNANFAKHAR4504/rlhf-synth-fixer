
Create an AWS CloudFormation template in JSON to deploy a secure and highly available web application infrastructure in the us-west-2 region.

Here are the requirements for the setup:

Networking and Compute:
A VPC with both public and private subnets.
An Application Load Balancer (ALB) with health checks configured on its target groups.
An Auto Scaling group for EC2 instances that scales based on CPU utilization.
All EC2 instances must be of the t3.micro type.

Database and Storage:
An RDS database instance with Multi-AZ support for high availability.
An S3 bucket with AES-256 encryption enabled.

Security and CDN:
Use AWS WAF to protect the application against SQL injection and XSS attacks.
Set up an AWS CloudFront distribution with a default TTL of 24 hours (86400 seconds).
Manage secrets using AWS Parameter Store.
Use AWS KMS for key management.
IAM roles must be configured with the least privilege necessary and must not have Admin access.

Logging and Monitoring:
Enable AWS CloudTrail for logging.
Configure CloudWatch alarms for monitoring critical components.

Please ensure the final JSON template is well-commented and easy to read.
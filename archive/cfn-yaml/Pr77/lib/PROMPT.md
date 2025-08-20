Create a complete, production-ready CloudFormation YAML template that provisions a secure and scalable infrastructure environment in the us-east-1 region. All resource names should be parameterized with an environment suffix.

Infrastructure Requirements

1. Networking
Create a VPC with pre-defined CIDR blocks for network isolation.
Include public and private subnets across at least two Availability Zones.
Configure Internet Gateway, NAT Gateway(s), and appropriate route tables.
Enable VPC Flow Logs to capture all network traffic.
2. Identity & Security
Use IAM roles for resource-specific permissions, following the principle of least privilege.
Store all secrets (e.g., RDS credentials) in AWS Secrets Manager.
Enable AWS CloudTrail for full account logging.
3. Compute
Deploy an EC2 Auto Scaling Group (minimum 2, maximum 5 instances) in private subnets.
Use a specific, approved AMI ID for all EC2 instances (pass as a parameter).
Attach IAM roles with least privilege to EC2 instances.
Configure a CloudWatch alarm for EC2 CPU utilization > 70%, triggering an SNS notification.
Deploy a Lambda function for serverless processing, with environment variables securely stored (do not store secrets in plaintext).
4. Database & Caching
Deploy an Amazon RDS PostgreSQL instance with Multi-AZ enabled, credentials managed by AWS Secrets Manager.
Deploy an Amazon ElastiCache Redis cluster with a single node group for caching.
5. Storage & Content Delivery
Create an Amazon S3 bucket for storage, with default encryption enabled.
Deploy an AWS CloudFront distribution with the S3 bucket as the origin.
6. Web & API Security
Deploy AWS WAF to protect against common web exploits.
Attach WAF to any API Gateway deployed in the stack.
Template Features
Use Parameters for:
Environment suffix (e.g., dev, staging, prod)
Approved EC2 AMI ID
VPC CIDR blocks
RDS instance size
All IAM roles and resource policies must follow least privilege.
All resource names should include the environment suffix.
All resources must be deployed in the us-east-1 region.
Outputs
VPC ID
S3 bucket name and ARN
RDS endpoint
ElastiCache endpoint
EC2 Auto Scaling Group name
Lambda function ARN
CloudFront distribution domain name
CloudWatch Alarm ARN
CloudTrail ARN
WAF WebACL ARN

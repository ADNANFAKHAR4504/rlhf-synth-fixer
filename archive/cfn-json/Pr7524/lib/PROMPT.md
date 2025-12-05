Create an AWS CloudFormation template in JSON for a secure production environment in the us-west-1 region.

Here are the requirements for the setup:

VPC and Networking: Create a VPC with CIDR block 10.0.0.0/16. Set up public and private subnets in multiple availability zones. Configure Security Groups with descriptions for each rule. Enable VPC Flow Logs for network traffic monitoring.

RDS Database: Implement RDS instance with encryption at rest using AWS KMS. Place RDS in private subnet with security group allowing access only from EC2 security group.

EC2 Instances: Launch EC2 instances in private subnets with IAM roles. EC2 instances should have SSM agent installed for remote command execution. EC2 needs IAM role with permissions for CloudWatch, S3, Secrets Manager, and SSM.

S3 Storage: Create S3 buckets with server access logging enabled. Enable server-side encryption using KMS.

Lambda Functions: Create Lambda functions with IAM roles following least privilege. Use AWS Secrets Manager to store and retrieve sensitive information.

Load Balancing: Configure Application Load Balancer with access logs enabled and stored in S3 bucket.

CloudWatch Monitoring: Set up CloudWatch alarms for EC2 instances and RDS database monitoring.

CloudTrail: Configure CloudTrail to log all account activity with encryption enabled.

Secrets Manager: Store RDS database credentials in Secrets Manager for secure access.

Please ensure the final JSON template is valid and would pass standard AWS CloudFormation validation tests.

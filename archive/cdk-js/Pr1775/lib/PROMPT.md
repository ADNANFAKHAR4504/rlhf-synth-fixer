You are an AWS Cloud Architect. Write an AWS CDK application in JavaScript that builds a secure, scalable, and highly available web application environment in us-east-1.
The infrastructure should include:
A VPC with public and private subnets across multiple Availability Zones, Internet Gateway, NAT Gateways, and security groups with least-privilege rules.
An Application Load Balancer in the public subnets distributing traffic to EC2 instances in private subnets, launched through an Auto Scaling Group with AMI ID and instance type provided as parameters.
A Bastion host in a public subnet allowing controlled SSH access to private instances.
A Multi-AZ PostgreSQL RDS instance with KMS encryption and automated backups.
An S3 bucket with versioning and server-side encryption enabled, sending event notifications to a Lambda function for processing.
A CloudFront distribution using the S3 bucket as origin with secure access controls.
IAM roles and policies designed with least privilege for EC2, Lambda, and RDS.
CloudWatch monitoring and alarms for EC2, ALB, and RDS metrics, with notifications via SNS.
Auto Scaling policies to adjust EC2 capacity based on utilization.
A VPC peering connection to a peer VPC, with routes added for communication.
Parameters for AMI ID, instance type, DB credentials, SSH CIDR, and scaling settings. Outputs for key resources like ALB DNS, CloudFront domain, RDS endpoint, S3 bucket name, Bastion host IP, and VPC ID.
Tags for Environment and Owner on all resources, plus a stack policy to protect critical infrastructure.
Expected Output: A CDK JavaScript project that synthesizes into valid CloudFormation, deploys without errors, and follows AWS best practices while supporting up to 100,000 concurrent users.
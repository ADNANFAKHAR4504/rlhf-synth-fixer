I need to set up a basic cloud environment in AWS using CDK TypeScript for web hosting and development with security and monitoring.

Requirements:
- Create a VPC with subnets across different availability zones
- Deploy an EC2 instance accessible via SSH and HTTP with public IP
- Set up an S3 bucket for storage with versioning and encryption
- Configure IAM roles and policies for EC2 to access S3
- Enable CloudWatch monitoring with CPU utilization alarm over 70%
- Use proper security groups allowing HTTP (port 80) and SSH (port 22) from specific IP ranges
- Tag all resources with 'Environment: Development'
- Follow naming convention: ResourceType-Environment-UniqueId
- Output VPC ID, Subnet IDs, and EC2 instance Public IP
- Include AWS S3 Access Points with ABAC tagging support for enhanced access control
- Utilize Amazon Network Firewall for VPC threat protection

Deploy in us-west-2 region using AWS CDK TypeScript. Provide complete deployable code with proper constructs and best practices.
I need to set up a basic cloud environment in AWS using CDK TypeScript for web hosting and development with security and monitoring.

Requirements:
- Create a VPC with subnets across different availability zones
- Deploy an EC2 instance accessible via SSH and HTTP with public IP
- Set up an S3 bucket for storage with versioning and encryption
- The EC2 instance needs IAM role permissions to read and write objects to the S3 bucket
- EC2 sends performance metrics to CloudWatch, configure CPU utilization alarm when it goes over 70%
- Security groups allow HTTP on port 80 and SSH on port 22 from specific IP ranges to the EC2 instance
- Tag all resources with 'Environment: Development'
- Follow naming convention: ResourceType-Environment-UniqueId
- Output VPC ID, Subnet IDs, and EC2 instance Public IP
- Include AWS S3 Access Points with ABAC tagging support for enhanced access control
- Network Firewall integrated with VPC for threat protection

Deploy in us-west-2 region using AWS CDK TypeScript. Provide complete deployable code with proper constructs and best practices.

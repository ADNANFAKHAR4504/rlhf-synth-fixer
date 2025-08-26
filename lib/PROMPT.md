# Security Configuration as Code for Web Application

I need help in creating a secure AWS infrastructure for a web application using Pulumi Go. The infrastructure should include comprehensive security features and follow AWS security best practices.

## Requirements

Please create Pulumi Go code that implements the following components and make them follow all security guidelines:

### Networking & VPC

- Create a VPC with 2 public subnets and 2 private subnets across 2 availability zones
- Set up an internet gateway for public subnets
- Configure NAT gateways for private subnet internet access
- Create appropriate route tables

### Security Groups & Access Control

- Implement restrictive security groups that deny all inbound traffic except from specific IP ranges
- Create separate security groups for bastion hosts, application servers, and Lambda functions
- Use least privilege access principles

### IAM Roles & Policies

- Create IAM roles with least privilege access for all services
- Separate roles for EC2 instances, Lambda functions, and other AWS services
- Include policies for S3 access, CloudWatch logging, and KMS encryption

### Storage & Encryption

- Set up S3 buckets with versioning enabled
- Use AWS KMS for encryption of all data at rest
- Configure bucket policies for secure access

### Compute Resources

- Deploy EC2 instances in private subnets
- Create a bastion host in public subnet for secure access
- Use appropriate instance types and security configurations

### Lambda Functions

- Create Lambda functions for S3 object processing
- Set strict timeout (30 seconds) and memory limits (256 MB)
- Use environment variables for configuration
- Implement the new Lambda response streaming capabilities where applicable

### Monitoring & Alarms

- Set up CloudWatch alarms for security monitoring
- Monitor unauthorized access attempts
- Alert on resource usage spikes
- Include metrics for Lambda function performance

### Resource Management

- Apply detailed tags to all resources for cost tracking and management
- Use consistent naming conventions
- Include environment, project, and owner tags

### Multi-AZ Deployment

- Deploy infrastructure across multi AZ in us-east-1 regions

## Implementation Notes

- Use Pulumi Go syntax and best practices
- Include proper error handling and resource dependencies
- Minimize deployment time by avoiding slow-deploying resources where possible
- Implement security monitoring using the latest AWS Inspector and GuardDuty integration features
- Use the new IAM Access Analyzer for comprehensive permission visibility

Please add all the infrastructure code in one code block in a file, ensuring each file can be independently instantiated and executed.

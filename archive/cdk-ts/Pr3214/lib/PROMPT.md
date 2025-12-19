# Web Server Infrastructure Requirements

## Overview

Create infrastructure code using AWS CDK TypeScript to deploy a web server for a community platform serving 2,500 daily users with high availability and performance monitoring.

## Infrastructure Requirements

### Network Configuration

- Deploy VPC with CIDR block 10.3.0.0/16
- Configure public and private subnets across multiple availability zones for high availability
- Set up Internet Gateway for public subnet connectivity
- Configure route tables appropriately

### Compute Resources

- Deploy EC2 t3.micro instances running Apache web server
- Enable auto-scaling for handling user traffic variations
- Configure user data script to install and start Apache on instance launch
- Place instances in public subnet for direct web access

### Security Configuration

- Create Security Groups allowing HTTP traffic on port 80 from anywhere (0.0.0.0/0)
- Allow outbound traffic for software updates
- Configure least-privilege IAM roles for EC2 instances

### Storage

- Create S3 bucket for static content hosting
- Enable versioning for content protection
- Configure bucket policy for CloudFront or EC2 access
- Consider using S3 Intelligent-Tiering for cost optimization

### Monitoring

- Set up CloudWatch monitoring for EC2 instances
- Monitor CPU utilization and memory usage metrics
- Configure CloudWatch alarms for high CPU usage (threshold: 80%)
- Enable detailed monitoring for better granularity
- Use CloudWatch Application Insights for automatic dashboard creation

### Additional Features

- Implement AWS Systems Manager Session Manager for secure instance access without SSH keys
- Configure EC2 Instance Connect Endpoint for browser-based SSH access without bastion hosts

## Implementation Details

Provide the complete CDK TypeScript infrastructure code with the following structure:

- Main stack file with all resources properly configured
- Clear resource naming conventions
- Proper tagging for resource management
- Output important values like instance IPs and S3 bucket name

Generate production-ready code that can be deployed immediately to AWS us-east-1 region.

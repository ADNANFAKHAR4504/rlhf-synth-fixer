# Highly Available Web Application Infrastructure

I need help creating a production-ready web application infrastructure on AWS using infrastructure as code. The infrastructure should be highly available, secure, and scalable.

## Requirements

### Network Infrastructure
- Create a VPC with CIDR block 10.0.0.0/16
- Set up 2 public subnets across different availability zones (10.0.1.0/24, 10.0.2.0/24)
- Set up 2 private subnets across different availability zones (10.0.3.0/24, 10.0.4.0/24)
- Configure an Internet Gateway for public internet access
- Set up NAT Gateways in each public subnet for private subnet internet access
- Create appropriate route tables for both public and private subnets

### Compute and Load Balancing
- Deploy an Application Load Balancer in the public subnets
- Create an Auto Scaling group with EC2 instances in the private subnets
- Configure the Auto Scaling group to span both availability zones for high availability
- Set up proper health checks and scaling policies

### Database
- Deploy an RDS MySQL database in the private subnets with Multi-AZ deployment
- Use CloudWatch Database Insights for enhanced database monitoring
- Create a DB subnet group spanning both private subnets
- Configure automated backups and maintenance windows

### Storage
- Create an S3 bucket for static asset storage
- Implement proper bucket policies and access controls
- Enable versioning and server-side encryption

### Security
- Create security groups with least privilege access
- Set up IAM roles for EC2 instances and other services
- Ensure all communication between services is secure

### Monitoring and Logging
- Implement CloudWatch monitoring for all resources
- Set up CloudWatch alarms for key metrics
- Use CloudWatch Network Monitoring for enhanced network visibility
- Configure proper log retention policies

### Naming Convention
All resources should follow the naming convention: prod-<resource_name>

### Latest AWS Features Integration
Please incorporate these modern AWS capabilities:
1. CloudWatch Database Insights for RDS performance monitoring and correlation with application metrics
2. CloudWatch Network Monitoring with flow monitors for near real-time network performance visibility between compute instances and AWS services

## Output Format

Please provide the infrastructure code using Pulumi with JavaScript. Structure the code as a single ComponentResource class that encapsulates all the infrastructure components. Include proper resource dependencies, comprehensive tagging, and follow AWS Well-Architected Framework principles.

Provide one code block per file, ensuring each file can be created by copying from your response.
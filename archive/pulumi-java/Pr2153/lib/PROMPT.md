# AWS Web Application Infrastructure Deployment

You are an infrastructure engineer tasked with creating a comprehensive web application deployment using Pulumi and Java. Your goal is to generate production-ready infrastructure code that provisions all necessary AWS resources for a scalable, secure, and highly available web application.

## Requirements

Create a complete web application infrastructure that includes:

- VPC with public subnets across multiple availability zones for high availability
- Application Load Balancer (ALB) to distribute traffic across instances with HTTP and HTTPS listeners
- Auto Scaling Group with EC2 instances running a simple web server
- Security Groups with proper access controls (ALB allows HTTP/HTTPS from internet, instances only accept traffic from ALB)
- IAM roles for EC2 instances with appropriate permissions for S3 access
- S3 bucket for application code storage
- Launch Template for consistent EC2 instance configuration

## Technical Specifications

- Deploy in us-west-2 region
- Use Amazon Linux 2 AMI for EC2 instances
- Instance type: t3.micro for cost optimization
- Auto Scaling Group: minimum 2 instances, maximum 4 instances, desired capacity 2
- VPC CIDR: 10.0.0.0/16 with public subnets 10.0.1.0/24 and 10.0.2.0/24
- Target group health checks on HTTP port 80 with "/" path
- User data script to install Apache HTTP server and create a basic HTML page
- Use AWS Application Auto Scaling for better resource management
- Include proper resource tagging for cost tracking and management

## AWS Latest Features Integration

Incorporate these modern AWS capabilities:
- Use Launch Templates instead of Launch Configurations for better instance management and versioning
- Implement Application Load Balancer with advanced routing capabilities for better traffic distribution

## Security and Best Practices

- Follow principle of least privilege for IAM roles
- Use security groups with specific source/destination rules instead of overly permissive 0.0.0.0/0
- Enable proper health checks for load balancer targets
- Configure appropriate timeouts and intervals for health checks

## Output Requirements

Generate Pulumi Java code that:
- Uses proper Pulumi Java SDK syntax and patterns
- Includes comprehensive resource exports for application URLs, VPC ID, subnet IDs, and other important resource identifiers
- Has proper error handling and resource dependencies
- Creates one main Java class with all infrastructure components
- Uses appropriate Maven dependencies for Pulumi AWS provider

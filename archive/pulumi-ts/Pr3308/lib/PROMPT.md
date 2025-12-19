# Web Infrastructure Requirements

## Task Overview

A media company needs a web infrastructure for 4,000 daily viewers in us-east-2 region.

You are tasked with creating TypeScript Pulumi infrastructure code.

## Requirements

### 1. VPC Configuration
- Create a VPC with CIDR block 10.5.0.0/16
- Configure public and private subnets across availability zones

### 2. Application Load Balancer
- Deploy Application Load Balancer for HTTP traffic on port 80
- Configure target group with automatic target weights for improved availability
- Set up health checks for monitoring application uptime

### 3. EC2 Instances
- Deploy EC2 t3.micro instances in private subnets
- Configure Auto Scaling Group with minimum 2 instances for high availability
- Install web application server on instances

### 4. Security Groups
- Configure Security Group for ALB allowing HTTP traffic on port 80
- Configure Security Group for EC2 instances allowing traffic from ALB
- Allow SSH access from specific CIDR block only

### 5. S3 Static Assets
- Create S3 bucket for static content storage
- Enable versioning and lifecycle policies
- Configure bucket policy for CloudFront or direct ALB access

### 6. CloudWatch Monitoring
- Enable CloudWatch monitoring for EC2 instances
- Configure alarms for high CPU utilization (threshold 80%)
- Set up health check alarms for target group
- Monitor ALB metrics including request count and latency

## Expected Output

Infrastructure code using Pulumi TypeScript that creates:
- VPC with proper subnet configuration
- Application Load Balancer with target group
- Auto Scaling Group with EC2 instances
- S3 bucket for static content
- CloudWatch dashboards and alarms

Code should be production-ready with proper tagging and error handling.

## Implementation Notes

### Region Configuration
Deploy all resources in us-east-2 region.

### Instance Configuration
Use t3.micro instances to optimize costs while handling expected traffic.

### Security Constraints
- Restrict SSH access to specific CIDR blocks
- Implement principle of least privilege for IAM roles
- Enable VPC flow logs for security monitoring

### High Availability
- Deploy across multiple availability zones
- Configure Auto Scaling for traffic fluctuations
- Use ALB automatic target weights for better load distribution

Provide complete infrastructure code in TypeScript for Pulumi. Each file should be in a separate code block.
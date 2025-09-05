# Terraform Infrastructure Prompt

## Task Overview

You are tasked with creating a Terraform file (.tf) that provisions AWS infrastructure across three environments: Dev, Staging, and Production. Each environment must be fully isolated but identical in functionality, ensuring strict consistency and scalability.

## Requirements

### Networking & Compute
- VPC with public/private subnets across multiple AZs
- Security groups with least privilege access
- Internet Gateway and NAT Gateway for connectivity
- Route tables for proper traffic routing
- EC2 instances with Auto Scaling Groups
- Application Load Balancer for traffic distribution

### Database & Storage
- RDS instances with Multi-AZ deployment
- S3 buckets for data storage and backups
- KMS keys for encryption
- Parameter Store for configuration management

### Security & Compliance
- IAM roles and policies with minimal permissions
- CloudTrail for audit logging
- Config for compliance monitoring
- Secrets Manager for sensitive data

### Monitoring & Logging
- CloudWatch alarms for key metrics
- Log groups for application logs
- SNS topics for notifications
- Dashboards for monitoring

## Environment Configuration

Each environment should have:
- Unique VPC CIDR blocks
- Environment-specific resource naming
- Appropriate instance sizes for each environment
- Consistent tagging strategy
- Proper cost allocation tags

## Implementation Guidelines

1. Use for_each loops for environment-specific resources
2. Implement proper variable definitions
3. Use locals for common configurations
4. Follow Terraform best practices
5. Ensure proper resource dependencies
6. Use modules for reusability
7. Implement proper tagging strategy

## Expected Outputs

- VPC IDs and subnet IDs for each environment
- Security group IDs
- Load balancer DNS names
- Database endpoints
- S3 bucket names
- CloudWatch log group names

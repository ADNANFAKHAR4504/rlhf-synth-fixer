# High Availability AWS Infrastructure

I need to deploy a production-ready infrastructure in us-east-2 across three availability zones (us-east-2a, us-east-2b, us-east-2c) with the following requirements:

## Core Infrastructure
- VPC with public and private subnets across 3 AZs
- Auto Scaling Group for EC2 instances (t3.medium) with health checks
- Application Load Balancer for traffic distribution
- RDS MySQL instance with Multi-AZ enabled
- S3 bucket with versioning and cross-region replication

## High Availability Features
- Route 53 health checks and failover routing
- CloudWatch alarms for monitoring and auto-scaling
- SNS topic for notifications
- Lambda functions for automated responses to events

## Security & Compliance
- IAM roles with least privilege access
- CloudTrail logging to S3
- AWS Config for compliance monitoring
- Systems Manager for configuration management

## Naming & Tagging
- Use 'prod-' prefix for all resources
- Tag everything with 'environment: production' and 'purpose: high-availability'

## Deployment Constraints
- Deploy in us-east-2 region only
- Use TerraformHCL
- Keep deployment time reasonable (avoid long-running resources)
- Ensure all resources are properly tagged and follow AWS best practices
 All the Terraform code should go into the `main.tf` file. Assume the `provider.tf` file will be provided at deployment
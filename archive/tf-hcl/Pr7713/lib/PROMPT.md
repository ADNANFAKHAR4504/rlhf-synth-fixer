# Multi-Environment AWS Infrastructure with Terraform

## Project Overview

We need to build infrastructure for a financial services company that operates microservices across three environments: development, staging, and production. The goal is to maintain identical infrastructure configurations while allowing for environment-specific customizations.

## Business Requirements

Our company needs to:
- Deploy the same infrastructure stack across dev, staging, and prod environments
- Ensure consistent configuration management across all environments
- Maintain environment-specific parameters for cost optimization and performance
- Implement proper security and compliance standards

## Infrastructure Specifications

### Environment Details
- **AWS Account**: Single account (current configured account)
- **Environment Separation**: Resource naming and tagging
- **AWS Region**: us-east-2

### Core Infrastructure Components

Each environment should include:

1. **Networking**
   - Dedicated VPC with public and private subnets
   - 2 Availability Zones for high availability
   - NAT Gateways for outbound traffic from private subnets
   - Complete network isolation between environments

2. **Compute Services**
   - ECS Fargate services for containerized applications
   - Task counts: dev (1), staging (2), prod (4)
   - Application Load Balancers with environment-appropriate health checks

3. **Database**
   - RDS Aurora PostgreSQL clusters
   - Instance classes: dev (db.t3.medium), staging (db.r5.large), prod (db.r5.xlarge)
   - Automated password management through AWS Secrets Manager
   - 30-day password rotation policy

4. **Storage**
   - S3 buckets for static assets
   - Environment-specific naming conventions
   - Versioning enabled on all buckets
   - Lifecycle policies to archive objects after 90 days

5. **Monitoring and Logging**
   - CloudWatch dashboards for metrics aggregation
   - Environment-specific log retention: dev (7 days), staging (30 days), prod (90 days)
   - CloudWatch alarms with stricter thresholds in production

6. **Security and Compliance**
   - Environment separation through resource naming and tagging
   - Mandatory tagging: Environment, CostCenter, Owner, Project
   - Environment-specific security groups and IAM policies

## Technical Constraints

- All infrastructure must be defined in a single Terraform codebase
- Environment variations should be handled through configuration files
- Environment isolation through separate VPCs and security groups
- All database credentials stored securely in AWS Secrets Manager
- Automatic rotation of secrets every 30 days

## Expected Deliverables

A complete Terraform project that demonstrates:
- Reusable infrastructure components
- Environment-specific parameter management
- Consistent deployment across multiple environments in single AWS account
- Proper security and compliance implementation
- Comprehensive monitoring and alerting setup
# Multi-Environment Consistency & Replication

## Background
A fintech startup needs to maintain identical infrastructure across development, staging, and production environments for their payment processing system. They require automated deployment pipelines that ensure consistency while allowing environment-specific configurations for database sizes, instance types, and scaling parameters.

## Problem Statement
Create a Pulumi Python program to deploy identical payment processing infrastructure across three environments (dev, staging, prod) with environment-specific configurations. The configuration must:

1. Define a reusable component that creates a complete environment stack including VPC, RDS Aurora cluster, Lambda functions, DynamoDB tables, and S3 buckets.
2. Use Pulumi.yaml configuration to specify environment-specific values for instance sizes, backup retention, and scaling parameters.
3. Create three separate VPCs with identical structure but different CIDR blocks (10.0.0.0/16 for prod, 10.1.0.0/16 for staging, 10.2.0.0/16 for dev).
4. Deploy RDS Aurora PostgreSQL clusters with 2 instances in production, 1 instance in staging, and 1 instance in development.
5. Configure automated backups with 30-day retention for production, 7 days for staging, and 1 day for development.
6. Create Lambda functions that process payments, with memory allocation of 3008MB for production, 1024MB for staging, and 512MB for development.
7. Set up DynamoDB tables with on-demand billing for development, provisioned capacity for staging (5 RCU/WCU), and auto-scaling for production (5-100 RCU/WCU).
8. Configure S3 buckets with versioning enabled for all environments, but lifecycle policies only for production (transition to Glacier after 90 days).
9. Implement CloudWatch alarms for RDS CPU utilization with thresholds of 80% for production, 90% for staging, and no alarms for development.
10. Create a deployment script that can target any environment using 'pulumi up -s <environment>' command.

## Environment Requirements
Multi-environment AWS deployment across us-east-1 (production), us-west-2 (staging), and eu-west-1 (development). Each environment requires its own VPC with 3 availability zones, containing public and private subnets. Infrastructure includes RDS Aurora PostgreSQL clusters, Lambda functions for payment processing, DynamoDB tables for transaction logs, and S3 buckets for audit trails. Requires Pulumi 3.x with Python 3.9+, AWS CLI configured with appropriate credentials. Each environment uses different instance sizes: production uses r5.xlarge for RDS, staging uses r5.large, and development uses t3.medium. Network architecture includes NAT gateways in production and staging, but uses NAT instances in development for cost optimization.

## Constraints
1. Must use Pulumi configuration files to manage environment-specific values
2. RDS instances must have automated backups enabled with retention periods varying by environment
3. All environments must use separate VPCs with identical CIDR block structures
4. Security groups must be dynamically generated based on environment tags
5. Lambda functions must reference environment-specific API endpoints
6. S3 buckets must follow naming convention: company-service-environment-purpose
7. DynamoDB tables must have point-in-time recovery enabled only in production
8. CloudWatch alarms must have different thresholds for each environment
9. IAM roles must be scoped to prevent cross-environment access
10. All resources must be tagged with Environment, Team, and CostCenter tags

## Expected Output
A Pulumi Python project with a main __main__.py file containing the reusable infrastructure component, three Pulumi.<environment>.yaml configuration files with environment-specific values, and a README explaining how to deploy to each environment. The stack should output the RDS endpoint, Lambda function ARNs, and S3 bucket names for each environment.

## AWS Services Required
- VPC (Virtual Private Cloud)
- RDS Aurora PostgreSQL
- Lambda Functions
- DynamoDB
- S3 (Simple Storage Service)
- CloudWatch (Monitoring and Alarms)
- IAM (Identity and Access Management)
- NAT Gateway/NAT Instances
- Security Groups
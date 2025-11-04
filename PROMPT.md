# Task: Environment Migration

## Background
A financial services company needs to migrate their payment processing database from a development environment to staging. The staging environment has different networking requirements and enhanced security configurations that must be properly implemented.

## Problem Statement
Create a CDK Python program to migrate an RDS PostgreSQL database from development to staging environment. The configuration must:

1. Copy an existing RDS PostgreSQL instance from dev VPC (10.0.0.0/16) to staging VPC (10.1.0.0/16)
2. Create new parameter groups with staging-specific settings including max_connections=200 and shared_buffers=256MB
3. Enable deletion protection and automated backups with 7-day retention in staging
4. Configure Multi-AZ deployment for high availability in staging environment
5. Set up enhanced monitoring with 60-second granularity
6. Create new security groups allowing access only from staging application subnets
7. Migrate existing database credentials to AWS Secrets Manager with automatic rotation
8. Apply staging-specific tags including Environment=staging and CostCenter=engineering
9. Configure CloudWatch alarms for CPU utilization above 80% and storage space below 10GB

Expected output: A complete CDK Python stack that creates the staging RDS instance with all configurations applied, outputs the new database endpoint, and ensures zero downtime during migration.

## Environment
AWS staging environment in us-east-1 region with existing VPC infrastructure. Requires CDK 2.x with Python 3.8+, AWS CLI configured with appropriate IAM permissions for RDS, VPC, Secrets Manager, and CloudWatch. Source database running PostgreSQL 13.7 in development VPC with db.t3.medium instance class. Staging VPC has 3 availability zones with private database subnets already configured.

## Constraints
1. Must use CDK L2 constructs for RDS resources
2. Database endpoint must be accessible only from private subnets
3. Implement least privilege IAM policies for all resources
4. Use CDK context variables for environment-specific values
5. Enable encryption at rest using AWS managed KMS keys
6. Configure automatic minor version upgrades for PostgreSQL
7. Set maintenance window to Sunday 3-5 AM EST
8. Use CDK aspects to validate all resources have required tags
9. Implement stack-level CloudFormation outputs for connection details

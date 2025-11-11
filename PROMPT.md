# Task: Aurora PostgreSQL Database Infrastructure

## Background
A financial services company needs to deploy a production-ready database infrastructure for their transaction processing system. The infrastructure must support high availability, automated backups, and secure access patterns while maintaining cost efficiency through proper resource allocation.

## Environment
Production database infrastructure deployed in us-east-1 region using Aurora Serverless v2 PostgreSQL 15.4. Requires VPC with private subnets across 2 AZs, subnet group for RDS placement, and security groups for database access. AWS Secrets Manager stores database credentials with automatic rotation disabled. CloudWatch monitoring with custom alarms for database performance metrics. Infrastructure supports transaction processing workloads with variable traffic patterns throughout the day.

## Problem Statement
Create a CloudFormation template to deploy a production Aurora PostgreSQL database cluster. The configuration must:

1. Create an Aurora Serverless v2 cluster with PostgreSQL 15.4 engine.
2. Configure minimum capacity of 0.5 ACUs and maximum of 1 ACU.
3. Enable deletion protection and encryption using AWS KMS default key.
4. Set backup retention to 7 days with preferred backup window between 03:00-04:00 UTC.
5. Create a DB subnet group using existing subnet IDs provided as parameters.
6. Generate master username and password in AWS Secrets Manager.
7. Configure a custom DB cluster parameter group with log_statement set to 'all'.
8. Create CloudWatch alarm triggering when cluster CPU exceeds 80% for 5 minutes.
9. Output the cluster endpoint, reader endpoint, and secret ARN.
10. Tag all resources with Environment=Production and ManagedBy=CloudFormation.

**Expected output**: A complete CloudFormation template in JSON format that creates the Aurora infrastructure with all specified configurations, proper resource dependencies, and outputs for application integration.

## Constraints
1. Use Aurora Serverless v2 for automatic scaling between 0.5 and 1 ACU
2. Enable deletion protection on the Aurora cluster
3. Configure automated backups with a 7-day retention period
4. Use AWS Secrets Manager for database credentials management
5. Implement parameter groups with slow query logging enabled
6. Deploy the cluster across exactly 2 availability zones
7. Enable encryption at rest using AWS managed keys
8. Configure CloudWatch alarms for CPU utilization above 80%

## Platform and Language Requirements
- **Platform**: CloudFormation
- **Language**: JSON
- **Region**: us-east-1
- **Complexity**: hard

## AWS Services Required
- Amazon Aurora (RDS)
- AWS Secrets Manager
- Amazon CloudWatch
- AWS KMS
- Amazon VPC

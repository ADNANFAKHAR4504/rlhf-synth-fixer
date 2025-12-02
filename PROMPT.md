# Task: Environment Migration

## Background

A financial services company needs to migrate their production database from an on-premises MySQL instance to AWS RDS Aurora MySQL. The migration must maintain data integrity and minimize downtime during the cutover process.

## Problem Statement

Create a CloudFormation template to deploy an RDS Aurora MySQL cluster for migrating an on-premises database. The configuration must: 1. Define an Aurora DB cluster with MySQL 8.0 engine compatibility. 2. Create one writer instance and two reader instances of db.r5.large instance class. 3. Configure a KMS key for database encryption with proper key policy. 4. Set up a DB subnet group using three private subnet IDs provided as parameters. 5. Configure backup retention to 30 days with a preferred backup window of 03:00-04:00 UTC. 6. Enable Performance Insights with 7-day retention period. 7. Create a security group allowing MySQL traffic (port 3306) only from application subnet CIDR blocks. 8. Set up DB cluster parameter group with character set UTF8MB4. 9. Configure deletion protection to prevent accidental cluster removal. 10. Output the cluster endpoint, reader endpoint, and KMS key ARN for application configuration. Expected output: A JSON CloudFormation template that creates all necessary resources for the Aurora MySQL cluster including the KMS key, subnet group, security group, parameter group, DB cluster, and instances. The template should use parameters for subnet IDs and application CIDR blocks to ensure reusability across environments.

## Environment

Production database infrastructure in us-east-1 region hosting RDS Aurora MySQL cluster for financial transaction processing. Deployed across 3 availability zones with Multi-AZ configuration for high availability. VPC contains 3 private database subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) with no internet access. Requires AWS CLI configured with appropriate IAM permissions for RDS, KMS, and VPC services. Database subnet group and security groups must isolate database traffic.

## Constraints

1. The RDS Aurora cluster must use MySQL 8.0 compatibility mode
2. Database encryption at rest must use AWS KMS with a customer-managed key
3. The cluster must have exactly one writer and two reader instances
4. Automated backups must retain snapshots for 30 days
5. The database must be deployed in private subnets only
6. Performance Insights must be enabled with 7-day retention

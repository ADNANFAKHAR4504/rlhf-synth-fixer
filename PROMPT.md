# Task Description

## Background
A financial services company needs to maintain identical database schemas and reference data across development, staging, and production environments. They require automated synchronization of non-sensitive configuration data while ensuring production data remains isolated.

## Problem Statement
Create a CloudFormation template to establish a multi-environment database replication system.

MANDATORY REQUIREMENTS (Must complete):
1. Deploy RDS Aurora MySQL clusters in three separate VPCs representing dev, staging, and prod environments (CORE: RDS Aurora)
2. Implement Lambda functions to synchronize schema changes and reference data between environments (CORE: Lambda)
3. Create S3 buckets for storing database migration scripts with versioning enabled (CORE: S3)
4. Configure cross-account assume roles for Lambda to access resources in different environments
5. Set up VPC peering connections between environments with appropriate route tables
6. Implement CloudWatch alarms for replication lag exceeding 60 seconds
7. Use Systems Manager Parameter Store for storing database connection strings
8. Enable encryption at rest for all databases using AWS KMS with separate keys per environment
9. Configure automated backups with 7-day retention for all Aurora clusters

OPTIONAL ENHANCEMENTS (If time permits):
 Add EventBridge rules to trigger sync on schedule (OPTIONAL: EventBridge) - enables automated synchronization
 Implement SNS notifications for sync failures (OPTIONAL: SNS) - improves incident response
 Add Step Functions for orchestrating complex migrations (OPTIONAL: Step Functions) - handles multi-step workflows

Expected output: A CloudFormation template that deploys a complete multi-environment database replication infrastructure with automated synchronization capabilities while maintaining strict environment isolation.

## Constraints
- Aurora clusters must use db.r5.large instances minimum for consistent performance
- Lambda functions must complete synchronization within 5-minute timeout
- VPC peering connections must restrict traffic to MySQL port 3306 only
- S3 buckets must have lifecycle policies to delete migration scripts older than 30 days
- Parameter Store values must be encrypted using KMS customer managed keys
- Lambda functions must log all synchronization activities to CloudWatch Logs
- Database passwords must be generated using Secrets Manager with automatic rotation
- Cross-account roles must follow least-privilege principle with explicit resource ARNs
- Template must use Conditions to handle environment-specific configurations

## Environment
Multi-environment AWS deployment across three separate accounts (dev, staging, prod) in us-east-1 region. Each environment requires its own VPC with private subnets across 2 AZs, RDS Aurora MySQL 5.7 compatible clusters, Lambda functions with Python 3.9 runtime, and S3 buckets for migration artifacts. VPC CIDR blocks: dev (10.1.0.0/16), staging (10.2.0.0/16), prod (10.3.0.0/16). Requires AWS CLI configured with cross-account access, CloudFormation StackSets permissions. KMS keys must be created separately in each account before deployment.

## AWS Services Used
RDS Aurora, Lambda, S3

## Subject Labels
RDS Aurora, Lambda, S3

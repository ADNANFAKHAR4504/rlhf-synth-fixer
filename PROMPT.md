# Task: Multi-Environment Consistency & Replication

## Background

Your company runs a data processing application across three environments (dev, staging, prod) in different AWS accounts. The infrastructure has drifted between environments causing deployment failures and inconsistent behavior. Management requires immediate alignment of all environments with identical configurations while maintaining environment-specific parameters.

## Problem Statement

Create a Pulumi Python program to deploy and maintain consistent infrastructure across dev, staging, and production environments. The configuration must:

1. Define a base infrastructure class that encapsulates S3 buckets, Lambda functions, DynamoDB tables, SNS topics, and SQS queues.
2. Implement environment-specific configuration using Pulumi config files for bucket names, table capacities, and function memory sizes.
3. Create S3 buckets with versioning, server-side encryption, and 30-day lifecycle policies for non-current versions.
4. Deploy Lambda functions with Python 3.9 runtime, 512MB memory for dev/staging and 1GB for prod, with environment variables from config.
5. Provision DynamoDB tables with on-demand billing, global secondary index on 'timestamp' attribute, and point-in-time recovery enabled.
6. Set up SNS topics with email subscription endpoints specific to each environment from config.
7. Configure SQS queues with 14-day message retention and dead letter queues after 3 retries.
8. Create IAM roles with policies scoped to environment-specific resource ARNs using Pulumi interpolation.
9. Implement a validation function that compares configurations across stacks to ensure consistency.
10. Export critical resource ARNs and endpoints for use by application deployment pipelines.

## Environment

Multi-account AWS deployment across three regions: dev in us-east-2, staging in us-west-1, and production in us-east-1. Each environment requires identical infrastructure components including S3 buckets for data storage, Lambda functions for processing, DynamoDB tables for metadata, SNS topics for notifications, and SQS queues for task management. Python 3.9+ required with Pulumi 3.x CLI installed. AWS CLI configured with credentials for all three accounts. VPC setup with private subnets for Lambda execution. Each environment uses separate AWS accounts with cross-account IAM trust relationships established.

## Constraints

1. Use Pulumi configuration files to manage environment-specific values
2. All S3 buckets must have versioning enabled and lifecycle policies
3. Lambda functions must use the same runtime version across all environments
4. DynamoDB tables must have identical indexes and capacity settings
5. SNS topics and SQS queues must maintain the same retention policies
6. IAM roles must follow least privilege with environment-specific resource ARNs
7. Use Pulumi stack references to share outputs between environments

## Expected Output

A reusable Pulumi program structure with separate config files for each environment, demonstrating how to maintain infrastructure consistency while allowing controlled variations. The program should validate that all environments have matching resource types and configurations, with only approved differences in sizing and naming.

## Subject Labels

- Multi-account AWS deployment
- Pulumi configuration management
- Infrastructure consistency
- Environment-specific parameters
- S3 bucket configuration
- Lambda function deployment
- DynamoDB table provisioning
- SNS topic setup
- SQS queue configuration
- IAM role management

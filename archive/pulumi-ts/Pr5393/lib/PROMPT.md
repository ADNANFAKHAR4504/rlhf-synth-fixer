# Task: Multi-Environment Consistency & Replication

## Problem Statement

Create a Pulumi TypeScript program to deploy consistent data processing infrastructure across three environments (dev, staging, prod). The configuration must:

1. Create an S3 bucket for raw data ingestion with environment-prefixed names (e.g., dev-rawdata-bucket).
2. Deploy a Lambda function for data validation with environment-specific memory allocation (dev: 512MB, staging: 1024MB, prod: 2048MB).
3. Set up a DynamoDB table for metadata storage with environment-appropriate capacity (dev: 1 RCU/WCU, staging: 5 RCU/WCU, prod: 10 RCU/WCU).
4. Configure S3 event notifications to trigger the Lambda function when new objects are uploaded.
5. Create IAM roles and policies that allow Lambda to read from S3 and write to DynamoDB.
6. Implement CloudWatch log groups with 7-day retention for dev/staging and 30-day retention for prod.
7. Use Pulumi stack configuration to manage environment-specific values.
8. Export the S3 bucket name, Lambda function ARN, and DynamoDB table name for each environment.
9. Ensure all resources are tagged with Environment and Project tags.

Expected output: A reusable Pulumi program that can be deployed to any environment using stack configuration, maintaining consistent architecture while allowing environment-specific customization.

## Context

A data analytics company needs to maintain identical data processing pipelines across development, staging, and production environments. Each environment must have the same infrastructure components but with environment-specific configurations for bucket names, Lambda memory settings, and DynamoDB capacity.

## Platform & Language

- **Platform**: Pulumi
- **Language**: TypeScript
- **Provider**: AWS

## Constraints

1. Use Pulumi.Config to read environment-specific values from stack configuration files
2. Lambda function code must be inline (not from external files) for simplicity
3. All S3 buckets must have versioning enabled and block public access
4. DynamoDB tables must use on-demand billing mode only for production
5. Lambda functions must have X-Ray tracing enabled in staging and production
6. Use consistent naming convention: {environment}-{service}-{resource}
7. CloudWatch log groups must be created explicitly before Lambda functions
8. IAM policies must follow least-privilege principle with no wildcard permissions
9. All exported values must include the environment name as a prefix

## Subject Labels

- aws
- infrastructure
- multi-environment
- s3
- lambda

## Task ID

xu8bg

## Difficulty

medium
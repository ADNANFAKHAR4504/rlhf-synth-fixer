# Task: Multi-Environment Consistency & Replication

## Problem Statement
Create a Pulumi TypeScript program to deploy consistent infrastructure across multiple AWS environments. The configuration must:

1. Accept an environment parameter (dev, staging, or prod) that determines resource naming and configuration.
2. Create an S3 bucket with versioning enabled and lifecycle rules that transition objects to Glacier after 90 days.
3. Deploy a DynamoDB table with on-demand billing mode for storing file metadata with partition key 'fileId' and sort key 'timestamp'.
4. Set up S3 event notifications to trigger when objects are created, sending notifications to an SQS queue.
5. Create an SQS queue with a 14-day message retention period and visibility timeout of 300 seconds.
6. Implement consistent tagging across all resources with Environment, Project (DataPipeline), and ManagedBy (Pulumi) tags.
7. Configure S3 bucket encryption using AWS-managed keys (SSE-S3).
8. Create IAM policies that allow read/write access to the S3 bucket and DynamoDB table from the same environment only.
9. Export the S3 bucket name, DynamoDB table name, and SQS queue URL as stack outputs.
10. Ensure all resource names follow the pattern: {project}-{resourceType}-{environment}.

## Use Case
A data analytics company needs to maintain identical data processing infrastructure across development, staging, and production environments. Each environment must have the same S3 bucket configuration for data ingestion and DynamoDB tables for metadata tracking, with environment-specific naming and tagging.

## Platform Requirements
- Platform: Pulumi
- Language: TypeScript
- Cloud Provider: AWS

## Constraints
- Use Pulumi's configuration system to handle environment-specific settings
- All resources must be created in the same AWS region specified in the Pulumi config
- S3 bucket names must be globally unique - append a random suffix if needed
- DynamoDB table must have point-in-time recovery enabled
- Use Pulumi's interpolation for constructing resource names dynamically
- Implement proper dependency management between S3 bucket and event notifications

## Expected Output
A Pulumi program that can be deployed to any environment by setting the stack configuration, creating identical infrastructure with environment-specific naming and appropriate access controls.

# Task: Multi-Environment Consistency & Replication

## Problem Statement

Create a Pulumi TypeScript program to deploy a multi-environment data pipeline infrastructure that automatically replicates configuration changes across three environments (dev, staging, prod). The configuration must:

1. Create S3 buckets in each environment with consistent naming patterns (e.g., company-data-{env}-{region})
2. Deploy DynamoDB tables with identical schemas across all environments for metadata storage
3. Implement Lambda functions that monitor configuration changes in the production environment
4. Set up EventBridge rules to trigger replication workflows when production configurations change
5. Configure SNS topics for notification of successful and failed replications
6. Ensure all S3 buckets have versioning enabled and lifecycle policies for 30-day retention
7. Apply consistent tagging across all resources with Environment, Project, and ManagedBy tags
8. Create IAM roles with least-privilege access for Lambda functions to read from prod and write to dev/staging
9. Implement a dead letter queue for failed replication attempts
10. Generate outputs showing resource ARNs for each environment

## Expected Output

Three separate stacks (dev, staging, prod) with synchronized infrastructure components. Each stack should output the S3 bucket names, DynamoDB table names, Lambda function ARNs, and SNS topic ARNs. The production stack should additionally output the EventBridge rule ARN that triggers the replication process.

## Context

A data analytics company needs to maintain identical data processing pipelines across development, staging, and production environments. They require automated synchronization of configuration changes and data schemas across these environments to ensure consistency during testing and deployment cycles.

## Requirements

- Use Pulumi's stack references to share outputs between environments
- Implement proper error handling in Lambda functions with structured logging
- S3 bucket names must be globally unique and follow AWS naming conventions
- DynamoDB tables must use on-demand billing mode to control costs
- Lambda functions must have a timeout of 5 minutes maximum
- Use Pulumi's ComponentResource pattern to create reusable environment modules
- All inter-environment communication must use AWS services only (no external APIs)
- Implement exponential backoff for retry logic in replication functions
- Use TypeScript interfaces to define consistent resource configurations
- EventBridge rules must include proper event pattern filtering for production changes only

## Platform & Language

- Platform: Pulumi
- Language: TypeScript
- Complexity: medium

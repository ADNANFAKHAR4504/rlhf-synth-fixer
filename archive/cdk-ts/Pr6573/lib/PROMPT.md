# Infrastructure as Code Task

## Problem Statement

Create a CDK TypeScript program to implement a multi-environment infrastructure replication system for a trading platform. The configuration must: 1. Define a base stack class that accepts environment configuration objects containing region, account ID, and environment name. 2. Implement a configuration management system using TypeScript interfaces that enforces type safety for environment-specific values. 3. Create Lambda functions for order processing with environment-specific memory allocations (dev: 512MB, staging: 1024MB, prod: 2048MB). 4. Deploy DynamoDB tables with environment-appropriate read/write capacity units and point-in-time recovery enabled only for production. 5. Set up API Gateway REST APIs with environment-specific throttling (dev: 100 req/sec, staging: 500 req/sec, prod: 2000 req/sec). 6. Configure S3 buckets for trade data storage with lifecycle policies that retain data for 30 days in dev, 90 days in staging, and indefinitely in production. 7. Implement SQS queues for order processing with environment-specific message retention periods and dead letter queue configurations. 8. Create a deployment pipeline that validates infrastructure consistency across environments before promotion. 9. Generate CloudFormation drift detection alarms that trigger when any environment deviates from the defined configuration. 10. Implement automated rollback mechanisms that revert changes if post-deployment validation fails. Expected output: A complete CDK application with separate stack files for each service component, a central configuration management system, environment-specific configuration files, and a CDK pipeline that ensures infrastructure consistency across all three environments while allowing controlled variations in capacity and retention settings.

## Background

A financial services company operates identical trading platforms across development, staging, and production environments. Recent configuration drift incidents have caused production issues when features tested in staging behaved differently in production due to mismatched infrastructure settings.

## Technical Environment

Multi-environment AWS infrastructure spanning us-east-1 (production), us-east-2 (staging), and us-east-1 (development). Each environment requires isolated VPCs with 3 availability zones, private and public subnets, and NAT gateways. Core services include API Gateway, Lambda functions, DynamoDB tables, S3 buckets, and SQS queues. Infrastructure managed through CDK 2.x with TypeScript, requiring Node.js 18+, AWS CLI configured with appropriate IAM permissions. Each environment maintains separate AWS accounts for isolation with cross-account deployment capabilities through CDK pipelines.

## Constraints and Requirements

- API Gateway stages must be automatically created with matching throttling limits per environment
- All S3 buckets must have environment-appropriate lifecycle policies and encryption settings
- Environment-specific tags must be automatically applied for cost tracking and compliance
- Each environment must have identical resource naming patterns with environment prefixes
- Stack outputs must be automatically exported to SSM Parameter Store for cross-stack references
- All IAM roles must follow least-privilege principles with environment-specific boundaries
- Lambda functions must use environment-specific reserved concurrent executions
- All environment configurations must be derived from a single source of truth with environment-specific overrides
- Parameter Store must be used for runtime configuration values that differ between environments

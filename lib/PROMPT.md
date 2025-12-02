# Multi-Environment Consistency & Replication

> **CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with py**
>
> Platform: **pulumi**
> Language: **py**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A fintech startup needs to maintain identical API infrastructure across development, staging, and production environments for their payment processing service. Each environment must have consistent configurations while allowing for environment-specific parameters like database capacity and domain names.

## Problem Statement
Create a Pulumi Python program to deploy a multi-environment API infrastructure that ensures consistency across three environments (dev, staging, prod). The configuration must:

1. Deploy an API Gateway REST API with Lambda integrations in each environment using shared base configurations.
2. Create DynamoDB tables with environment-specific read/write capacity units (dev: 5/5, staging: 25/25, prod: 100/100).
3. Set up S3 buckets for API logs with lifecycle policies that retain logs for 7 days in dev, 30 days in staging, and 90 days in production.
4. Configure Lambda functions with environment-specific memory allocations (dev: 512MB, staging: 1024MB, prod: 3008MB) and timeout values.
5. Implement a shared configuration module that defines common infrastructure patterns used across all environments.
6. Create Route53 hosted zones and records for each environment using a base domain with environment prefixes (dev.api.example.com, staging.api.example.com, api.example.com).
7. Deploy CloudFront distributions for each environment with identical cache behaviors but different origin domains.
8. Use Pulumi stack references to share outputs between environments for cross-environment testing capabilities.
9. Implement parameter validation to ensure environment-specific values fall within acceptable ranges.
10. Tag all resources with Environment, ManagedBy, and CostCenter tags that vary by environment.

Expected output: Three Pulumi stacks (dev, staging, prod) that can be deployed independently but maintain structural consistency. Each stack should output the API endpoint URL, CloudFront distribution domain, and DynamoDB table names. The program should use Pulumi's configuration system to manage environment-specific values while maximizing code reuse through shared modules.

## Constraints and Requirements
- All three environments must use the same Pulumi program with environment-specific configurations
- Lambda function code must be packaged from the same source directory for all environments
- DynamoDB tables must have point-in-time recovery enabled only in staging and production
- API Gateway must implement request throttling with different limits per environment
- S3 buckets must have versioning enabled and block public access in all environments
- Cross-environment dependencies must be handled through Pulumi stack references only

## Environment Setup
Multi-environment AWS infrastructure deployed across three separate accounts in us-east-1 region. Each environment consists of API Gateway, Lambda functions, DynamoDB tables, S3 buckets for logging and CloudFront for content delivery. Requires Pulumi CLI 3.x with Python 3.8+, AWS CLI configured with appropriate credentials for each environment account. VPC endpoints for DynamoDB and S3 in each environment to reduce data transfer costs. Lambda functions deployed in private subnets with NAT Gateway for outbound internet access.
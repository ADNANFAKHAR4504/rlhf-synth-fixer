# Task: Multi-Environment Payment Processing System

## Task ID
h0w0k6v8

## Platform & Language
- **Platform:** Pulumi
- **Language:** TypeScript
- **Difficulty:** Expert

## Problem Statement

Create a Pulumi TypeScript program to deploy a multi-environment payment processing system with automatic replication and consistency checks.

The configuration must:

1. Define a reusable PaymentProcessor ComponentResource that encapsulates Lambda, DynamoDB, and SNS resources.
2. Deploy identical infrastructure to dev, staging, and prod environments using different Pulumi stacks.
3. Implement environment-specific scaling (dev: 1 Lambda concurrent execution, staging: 10, prod: 100).
4. Create DynamoDB tables with point-in-time recovery enabled only in staging and prod.
5. Configure SNS topics with email subscriptions using environment-specific addresses from config.
6. Use stack references to propagate DynamoDB table ARNs from lower to higher environments.
7. Implement a drift detection function using Pulumi Automation API that compares staging and prod.
8. Create Lambda functions with 512MB memory in dev, 1GB in staging, and 2GB in prod.
9. Set up dead letter queues for Lambda functions with different retry counts per environment.
10. Export a comparison report showing configuration differences between environments.

**Expected output:** A Pulumi TypeScript project with separate stack configurations for each environment, a reusable ComponentResource class, and an automation script that validates consistency between staging and production while allowing controlled variations in scaling parameters.

## Scenario

A fintech startup needs to replicate their payment processing infrastructure across three environments (dev, staging, prod) with consistent configurations but environment-specific scaling. They require automated environment promotion workflows and drift detection to ensure production mirrors staging exactly, with controlled parameter variations.

## Technical Details

Multi-account AWS deployment across us-east-1 (dev), us-west-2 (staging), and eu-west-1 (prod) regions. Each environment runs in separate AWS accounts with cross-account IAM roles. Core infrastructure includes Lambda functions for payment processing, DynamoDB tables for transaction records, and SNS topics for notifications. VPC setup with private subnets for Lambda, VPC endpoints for DynamoDB and SNS. Requires Pulumi 3.x with TypeScript, Node.js 18+, AWS CLI with profiles for each account configured. Environment promotion workflow using Pulumi Automation API for controlled deployments.

## Requirements

- Use Pulumi stack references to share outputs between environments
- Implement custom ComponentResource classes for reusable infrastructure patterns
- Deploy to exactly 3 AWS accounts using cross-account assume role
- Use Pulumi configuration files with environment-specific overrides
- Implement automated drift detection using Pulumi Automation API
- All Lambda functions must use ARM64 architecture for cost optimization

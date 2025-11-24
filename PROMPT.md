# Task: Failure Recovery Automation

## Problem Statement

Create a Pulumi Go program to deploy a multi-region disaster recovery infrastructure for a payment processing system. The configuration must:

1. Create DynamoDB global tables with on-demand billing and point-in-time recovery enabled.
2. Deploy identical Lambda functions in both us-east-1 and us-east-2 for payment processing.
3. Configure API Gateway REST APIs in both regions with custom domain names.
4. Set up Route 53 hosted zone with health checks and failover routing policies.
5. Create S3 buckets in both regions with cross-region replication for transaction logs.
6. Implement CloudWatch alarms monitoring DynamoDB replication lag exceeding 30 seconds.
7. Configure SSM parameters storing region-specific endpoints and configurations.
8. Set up SQS dead letter queues in both regions for failed transaction retry.
9. Create IAM roles with least-privilege permissions for all services.
10. Output primary and secondary API endpoints, health check URLs, and alarm ARNs.

Expected output: The program should create a fully automated disaster recovery setup where traffic automatically fails over to us-east-2 if us-east-1 becomes unavailable, with all transaction data synchronized and accessible in both regions.

## Business Context

A financial services company needs to implement a disaster recovery solution for their payment processing system. The primary region hosts critical transaction data and must be replicated to a secondary region with automated failover capabilities. The system must maintain RTO of 15 minutes and RPO of 5 minutes while ensuring data consistency across regions.

## Infrastructure Requirements

Multi-region AWS infrastructure spanning us-east-1 (primary) and us-east-2 (disaster recovery). Deployment includes DynamoDB global tables for transaction data, Lambda functions for payment processing, API Gateway for REST endpoints, S3 buckets with cross-region replication for backups. Route 53 manages DNS failover between regions. CloudWatch monitors replication metrics and triggers alarms. SSM Parameter Store holds region-specific configurations. Requires Pulumi 3.x with Go SDK, AWS CLI configured with appropriate credentials. VPCs in both regions with private subnets for Lambda functions.

## Technical Requirements

- Deploy Lambda functions in both regions with identical configurations
- Use SSM Parameter Store for storing region-specific configurations
- Use S3 cross-region replication for static assets and backups
- Set up CloudWatch alarms for monitoring replication lag
- Implement Route 53 health checks with automatic DNS failover
- Implement dead letter queues for failed transactions during failover
- Configure API Gateway with custom domain names in each region
- Use DynamoDB global tables for multi-region data replication

## Constraints

- Platform: Pulumi
- Language: TypeScript
- Complexity: expert
- Subtask: Failure Recovery and High Availability
- Subject: Failure Recovery Automation

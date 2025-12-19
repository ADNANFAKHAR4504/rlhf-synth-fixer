# Task: Multi-Region Disaster Recovery Infrastructure

## Problem Statement

Create a Pulumi TypeScript program to implement a multi-region disaster recovery infrastructure for a payment processing system. The configuration must:

1. Set up DynamoDB global tables with automated backups and point-in-time recovery enabled in both us-east-1 and us-east-2.
2. Deploy identical Lambda functions in both regions for payment processing with environment variables pointing to regional resources.
3. Create S3 buckets in both regions with cross-region replication and RTC enabled for sub-minute replication.
4. Configure API Gateway REST APIs in both regions with custom domain names.
5. Implement Route53 health checks monitoring the primary region's API Gateway endpoint.
6. Set up Route53 failover routing policies with automatic DNS failover to secondary region.
7. Create CloudWatch alarms for DynamoDB table health, Lambda errors, and S3 replication lag.
8. Configure SNS topics in both regions for alerting on failover events.
9. Implement IAM roles with cross-region assume role policies for disaster recovery operations.
10. Set up CloudWatch Logs with cross-region log group subscriptions for centralized monitoring.
11. Deploy all resources with consistent naming convention: {service}-{region}-{environment}.
12. Output the primary and failover API endpoints, health check IDs, and alarm ARNs.

**Expected output:** The program should create a fully functional multi-region infrastructure where the primary region handles all traffic under normal conditions. When the primary region experiences an outage detected by Route53 health checks, DNS automatically fails over to the secondary region within 5 minutes, with data synchronized within the last minute via DynamoDB global tables and S3 cross-region replication.

## Background

A financial services company needs to implement a disaster recovery solution for their critical payment processing system. They require automatic failover capabilities between regions with minimal data loss and downtime. The system must maintain transaction integrity during regional outages.

## Context

Multi-region AWS infrastructure spanning us-east-1 (primary) and us-east-2 (secondary) for disaster recovery. Core services include DynamoDB global tables for transaction data, Lambda functions for payment processing, S3 for document storage with cross-region replication, API Gateway for REST endpoints, and Route53 for DNS failover. Requires Pulumi 3.x with TypeScript, Node.js 18+, and AWS SDK v3. Both regions will have identical VPC configurations with 3 availability zones, private subnets for compute resources, and VPC endpoints for AWS services. CloudWatch alarms and SNS topics configured for monitoring failover events.

## Constraints

- RPO (Recovery Point Objective) must be under 1 minute
- DynamoDB global tables must be configured with point-in-time recovery
- RTO (Recovery Time Objective) must be under 5 minutes
- Primary region must be us-east-1 with failover to us-east-2
- Use Route53 health checks for automatic DNS failover
- All resources must be tagged with Environment, Region, and DR-Role tags
- S3 buckets must use cross-region replication with RTC (Replication Time Control)
- Lambda functions must be deployed in both regions with identical configurations

## Subject Labels

- Failure Recovery and High Availability
- Failure Recovery Automation

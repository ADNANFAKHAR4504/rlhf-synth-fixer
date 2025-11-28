# Task 101912813: Multi-Region Disaster Recovery Solution

## Background

A financial services company needs to implement a disaster recovery solution for their critical transaction processing system. The primary region experienced a 6-hour outage last quarter, resulting in significant revenue loss. They require an active-passive multi-region setup with automated failover capabilities.

## Problem Statement

Create a CloudFormation template to deploy a multi-region disaster recovery solution for a transaction processing system.

### MANDATORY REQUIREMENTS (Must complete):

1. Configure DynamoDB Global Tables with on-demand billing mode and point-in-time recovery (CORE: DynamoDB)
2. Set up S3 buckets in both regions with cross-region replication and versioning enabled (CORE: S3)
3. Implement Route 53 hosted zone with failover routing policy using health checks
4. Create Lambda functions in both regions for transaction processing with environment variables for region-specific configuration
5. Configure KMS keys in each region with alias 'alias/transaction-encryption'
6. Set up CloudWatch alarms for DynamoDB throttling, S3 replication lag, and Lambda errors
7. Create SNS topics in both regions for operational alerts
8. Implement IAM roles with cross-region assume role permissions
9. Configure CloudWatch Logs with cross-region log group subscriptions
10. Add stack outputs for primary and secondary region endpoints

### OPTIONAL ENHANCEMENTS (If time permits):

- Add AWS Backup for automated cross-region backups (OPTIONAL: AWS Backup) - provides additional data protection layer
- Implement EventBridge rules for automated failover triggers (OPTIONAL: EventBridge) - enables event-driven DR automation
- Add Systems Manager Parameter Store for configuration management (OPTIONAL: Systems Manager) - centralizes multi-region configuration

Expected output: A single CloudFormation JSON template that deploys all resources in both regions with proper cross-region references, automated health monitoring, and failover capabilities. The template should use nested stacks or StackSets for multi-region deployment coordination.

## Constraints

1. Use JSON format exclusively for the CloudFormation template
2. Primary region must be us-east-1 with failover to us-west-2
3. RTO must be under 15 minutes and RPO under 5 minutes
4. All data must be encrypted at rest using AWS KMS CMKs
5. Route 53 health checks must monitor both regions continuously
6. DynamoDB global tables must have point-in-time recovery enabled
7. Lambda functions must use reserved concurrency of at least 100
8. Cross-region replication must use S3 Transfer Acceleration
9. All resources must have DeletionPolicy set to Retain
10. CloudWatch alarms must trigger SNS notifications for any failover events

## Environment

Multi-region disaster recovery infrastructure spanning us-east-1 (primary) and us-west-2 (secondary). Utilizes DynamoDB Global Tables for transaction data, S3 with cross-region replication for document storage, Lambda functions for transaction processing, and Route 53 for DNS failover. Requires AWS CLI 2.x configured with appropriate IAM permissions for multi-region deployments. VPCs in both regions with private subnets and VPC peering connection. KMS keys in each region for encryption. CloudWatch cross-region monitoring with centralized dashboard. Total infrastructure supports 10,000 TPS with sub-second latency requirements.

## Platform Details

- **Platform**: CloudFormation
- **Language**: JSON
- **Difficulty**: Expert
- **Regions**: us-east-1 (primary), us-west-2 (secondary)

## AWS Services

Core services (mandatory):
- DynamoDB (Global Tables)
- S3 (Cross-Region Replication)
- Route 53 (Failover Routing)
- Lambda (Transaction Processing)
- KMS (Encryption Keys)
- CloudWatch (Alarms, Logs)
- SNS (Notifications)
- IAM (Cross-region roles)

Optional services:
- AWS Backup
- EventBridge
- Systems Manager Parameter Store

# Task: Failure Recovery Automation

## Problem Statement
Create a CDK Python program to implement a multi-region disaster recovery solution. The configuration must: 1. Set up Aurora Global Database cluster with writer in us-east-1 and reader in us-west-2. 2. Configure DynamoDB global tables for transaction metadata with PITR enabled. 3. Deploy identical Lambda functions in both regions for processing logic. 4. Create S3 buckets with cross-region replication for document storage. 5. Implement AWS Backup plans with 1-hour RPO and cross-region copy. 6. Configure Route 53 health checks and weighted routing policies. 7. Set up EventBridge rules to monitor backup jobs and send alerts. 8. Create customer-managed keys in both regions with key policies. 9. Implement least-privilege IAM roles for all services. 10. Add CloudWatch dashboards for monitoring replication lag. 11. Configure deletion protection on all production resources. 12. Tag all resources with Environment=Production and DR-Role tags. Expected output: CDK Python stacks that deploy a complete disaster recovery infrastructure with automated failover capabilities, meeting 1-hour RPO and 4-hour RTO requirements while maintaining data encryption and compliance.

## Context
A financial services company needs automated backup and disaster recovery for their critical transaction processing system. The system must maintain RPO of 1 hour and RTO of 4 hours across regions. All backups must be encrypted and comply with financial data retention policies.

## AWS Environment
Multi-region disaster recovery infrastructure spanning us-east-1 (primary) and us-west-2 (secondary). Core services include Aurora PostgreSQL 14.x Global Database, DynamoDB global tables, Lambda functions for transaction processing, and S3 with cross-region replication. VPC peering connects regions with private connectivity. AWS Backup manages automated snapshots. Route 53 provides DNS failover. Requires CDK 2.100+ with Python 3.9+, AWS CLI v2 configured with appropriate IAM permissions for multi-region deployments.

## Hints
- Use AWS Backup for centralized backup management with cross-region replication
- Implement Aurora Global Database with automated failover capabilities
- Deploy Lambda functions in both primary and secondary regions with identical configurations
- Use DynamoDB global tables with point-in-time recovery enabled
- Configure Route 53 health checks with automated DNS failover
- All keys must use customer-managed keys with automatic rotation
- Implement EventBridge rules to monitor backup completion and alert on failures

## Task Metadata
- Task ID: y0b2v6
- Platform: CDK
- Language: Python
- Complexity: expert
- Subject: Failure Recovery and High Availability
- Subtask: Failure Recovery Automation

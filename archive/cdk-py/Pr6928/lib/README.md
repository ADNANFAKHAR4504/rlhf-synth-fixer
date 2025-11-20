# Multi-Region Disaster Recovery Solution

## Overview

This CDK application deploys a comprehensive multi-region disaster recovery infrastructure for a financial transaction processing system. The solution spans AWS regions us-east-1 (primary) and us-west-2 (secondary) and meets strict RPO (1 hour) and RTO (4 hours) requirements.

## Architecture

### Components

1. **Database Layer**
   - Aurora PostgreSQL 14.6 Global Database with writer in us-east-1 and reader in us-west-2
   - DynamoDB global tables for transaction metadata with point-in-time recovery

2. **Compute Layer**
   - Identical Lambda functions in both regions for transaction processing
   - VPC configuration with private subnets for secure compute

3. **Storage Layer**
   - S3 buckets with cross-region replication
   - KMS customer-managed keys in both regions with automatic rotation

4. **Backup & Recovery**
   - AWS Backup with hourly snapshots (1-hour RPO)
   - Cross-region backup copy to secondary region
   - EventBridge monitoring for backup job status

5. **Traffic Management**
   - Route 53 health checks monitoring primary region
   - Weighted routing policies for controlled failover

6. **Monitoring**
   - CloudWatch dashboards showing replication lag
   - EventBridge rules for backup and replication alerts
   - SNS topics for notifications

## Prerequisites

- AWS CDK 2.100.0 or higher
- Python 3.9 or higher
- AWS CLI v2 configured with appropriate credentials
- Permissions for multi-region deployments

## Installation

# Multi-Region Disaster Recovery Architecture

This infrastructure implements a comprehensive multi-region disaster recovery solution for a financial services transaction processing system using CDKTF with Python.

## Architecture Overview

The solution provides:
- **99.99% uptime** with automated failover
- **Sub-minute RTO** (Recovery Time Objective < 60 seconds)
- **Near-zero RPO** (Recovery Point Objective < 1 second)
- **Multi-region resilience** across us-east-1 and us-west-2

## Components

### 1. Networking Stack (`networking_stack.py`)
- VPCs in us-east-1 (10.0.0.0/16) and us-west-2 (10.1.0.0/16)
- Private subnets across 3 availability zones per region
- VPC peering for cross-region communication
- Security groups for Aurora, Lambda, and inter-region traffic
- All traffic encrypted using AWS-managed certificates

### 2. Database Stack (`database_stack.py`)
- Aurora MySQL Global Database with Serverless v2 instances
- Primary cluster in us-east-1, secondary in us-west-2
- Minimum 0.5 ACUs for cost optimization
- Cross-region replication with < 1 second lag
- 7-day point-in-time recovery
- CloudWatch logs enabled (audit, error, general, slowquery)

### 3. Monitoring Stack (`monitoring_stack.py`)
- CloudWatch alarms for replication lag (500ms threshold)
- CPU utilization monitoring (80% threshold)
- Database connection monitoring (100 connections threshold)
- SNS topics in both regions for notifications

### 4. Failover Stack (`failover_stack.py`)
- Lambda functions for health monitoring (runs every minute)
- Lambda function for failover orchestration
- Route53 health checks based on CloudWatch metrics
- Idempotent failover logic with retry safety
- EventBridge rules for scheduled health checks

## Lambda Functions

### Health Monitor (`lambda/health_monitor.py`)
Runs every minute in both regions to:
- Monitor replication lag via CloudWatch metrics
- Check cluster status and health
- Send SNS alerts when thresholds are exceeded
- Track cluster availability

### Failover Trigger (`lambda/failover_trigger.py`)
Orchestrates failover when needed:
- Promotes secondary region to primary
- Idempotent design for safe retries
- 60-second timeout for complete failover
- SNS notifications for failover events
- Handles partial failure scenarios

## Deployment

### Prerequisites
- Python 3.11+
- CDKTF 0.15+
- AWS credentials with permissions for RDS, VPC, Lambda, Route53, CloudWatch, SNS, IAM
- Lambda deployment packages (see Lambda Packaging section)

### Configuration
The stack accepts the following parameters:
- `environment_suffix`: Unique suffix for resource naming (required)
- `aws_region`: Primary region (default: us-east-1)
- `state_bucket`: S3 bucket for Terraform state
- `default_tags`: Tags to apply to all resources

### Lambda Packaging

Before deploying, create Lambda deployment packages:

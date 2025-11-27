# Multi-Region Disaster Recovery Architecture

Production-ready multi-region DR infrastructure using **CDKTF with Python** for a payment processing system.

## Overview

Multi-region deployment across us-east-1 (primary) and us-west-2 (secondary) with:
- Aurora Global Database with 72-hour backtracking
- DynamoDB Global Tables for session management
- Lambda functions in both regions (Python 3.11, 1GB memory)
- Route 53 health checks with automatic DNS failover
- EventBridge cross-region event replication
- AWS Backup with 7-day retention and cross-region copy
- CloudWatch dashboards and alarms for monitoring
- IAM roles with cross-region permissions
- Systems Manager Parameter Store for configuration

RPO: 5 minutes | RTO: 15 minutes


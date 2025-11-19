# Multi-Region Disaster Recovery Architecture for Trading Platform

This CDK application deploys a complete multi-region disaster recovery infrastructure for a trading platform with automatic failover capabilities.

## Architecture Overview

The solution spans two AWS regions:
- **Primary Region**: us-east-1
- **Secondary Region**: us-west-2

### Components

1. **Route 53**: DNS management with weighted routing (100% primary, 0% secondary) and health checks
2. **ECS Fargate**: Containerized trading application (2 tasks, 1 vCPU, 2GB each)
3. **Application Load Balancers**: Traffic distribution in both regions
4. **Aurora Global Database**: PostgreSQL with cross-region replication
5. **DynamoDB Global Tables**: Session data with automatic replication
6. **S3 Cross-Region Replication**: Object storage with versioning and RTC
7. **EventBridge**: Cross-region event replication
8. **CloudWatch**: Monitoring and alarms for replication lag

## Prerequisites

- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Python 3.9 or later
- AWS CLI configured with appropriate credentials
- Docker installed for container builds

## Deployment

### 1. Install Dependencies
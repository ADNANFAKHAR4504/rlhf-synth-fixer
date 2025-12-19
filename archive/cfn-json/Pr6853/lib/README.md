# Multi-Region Disaster Recovery Solution

This CloudFormation solution implements a comprehensive multi-region disaster recovery system for a transaction processing application.

## Architecture

The solution consists of two stacks:

1. **Primary Stack (tap-stack.json)** - Deploys to us-east-1
2. **Secondary Stack (secondary-stack.json)** - Deploys to us-west-2

### Components

- **DynamoDB Global Tables**: Automatic cross-region replication for transaction data
- **S3 Cross-Region Replication**: Transaction logs replicated from primary to secondary
- **Lambda Functions**: Transaction processing in both regions
- **API Gateway**: REST API endpoints in both regions
- **SQS Queues**: Message queuing for transaction processing
- **Route53 Health Checks**: Monitors primary region and triggers failover
- **CloudWatch Alarms**: Monitoring and alerting for system health
- **VPC with Multi-AZ**: High availability within each region

## Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- jq installed for JSON parsing
- Email address for CloudWatch alarms

### Deploy Primary Stack

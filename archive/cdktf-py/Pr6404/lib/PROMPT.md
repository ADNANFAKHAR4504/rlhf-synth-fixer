# Asynchronous Transaction Processing System

## Project Overview

We need to build a robust transaction processing system that can handle high volumes of financial transactions asynchronously. This system will help a financial services company overcome performance bottlenecks in their fraud detection pipeline.

## Business Problem

A financial services company is struggling with their current transaction validation system. They process millions of fraud detection requests daily, but their synchronous architecture creates significant delays during busy periods. Customers are complaining about slow transaction approvals, and the engineering team needs a solution that can handle variable loads while keeping transactions secure and reliable.

## Technical Requirements

### Core Infrastructure
- **Message Queues**: Set up three SQS queues for different priority levels:
  - High-priority queue (1-day message retention)
  - Medium-priority queue (3-day message retention)  
  - Low-priority queue (7-day message retention)

- **Error Handling**: Configure dead letter queues for each priority level with a maximum of 3 retry attempts

- **Processing Functions**: Create Lambda functions with different concurrency limits:
  - High priority: 100 concurrent executions
  - Medium priority: 50 concurrent executions
  - Low priority: 25 concurrent executions

### Workflow Management
- **Step Functions**: Build state machines to handle complex validation workflows including:
  - Fraud detection checks
  - Account balance verification
  - Compliance screening
  - Human approval for high-value transactions

### Transaction Routing
- **EventBridge**: Automatically route transactions based on amount:
  - $10,000+ → High priority queue
  - $1,000-$10,000 → Medium priority queue
  - Under $1,000 → Low priority queue

### Data Storage
- **DynamoDB**: Store transaction metadata with:
  - Partition key: `transactionId`
  - TTL attribute: `expirationTime` (90 days)
  - On-demand billing mode

### Monitoring & Alerting
- **CloudWatch Alarms**: Alert when queue depths exceed:
  - High priority: 1,000 messages
  - Medium priority: 5,000 messages
  - Low priority: 10,000 messages

- **X-Ray Tracing**: Enable full transaction tracking across all components

## Technical Specifications

### Development Environment
- **Framework**: CDKTF 0.20+ with Python
- **AWS CDK**: Constructs v10
- **Region**: us-east-2

### Architecture Details
- **Network**: 3 availability zones with VPC endpoints for AWS services
- **Security**: Lambda functions in private subnets with NAT Gateway access
- **IAM**: Least-privilege roles for each component
- **Logging**: CloudWatch Logs with 7-day retention

### Queue Configuration
- **Visibility Timeouts**:
  - High priority: 30 seconds
  - Medium priority: 60 seconds
  - Low priority: 120 seconds

## Performance Goals
The system should handle 100,000+ transactions per hour with sub-second queue polling and automatic scaling based on load.
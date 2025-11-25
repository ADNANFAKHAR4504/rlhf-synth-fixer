# Serverless Stock Pattern Detection System

A serverless system for processing real-time stock market data feeds and generating alerts when specific trading patterns are detected.

## Architecture

This system consists of the following components:

### API Gateway
- REST API with `/patterns` and `/alerts` endpoints
- Request validation enabled
- Throttling: 1000 requests/second with burst of 2000

### Lambda Functions

1. **PatternDetector** (512MB, Graviton2)
   - Processes incoming market data from API
   - Detects trading patterns
   - Stores patterns in DynamoDB
   - Sends alerts to SQS queue
   - Reserved concurrency: 50

2. **AlertProcessor** (256MB, Graviton2)
   - Reads from SQS queue (batch size: 10)
   - Publishes critical alerts to SNS
   - Reads pattern details from DynamoDB
   - DLQ with max receive count: 3

3. **ThresholdChecker** (256MB, Graviton2)
   - Triggered by EventBridge every 5 minutes
   - Checks patterns against thresholds
   - Sends threshold violation alerts to SQS

### Data Storage
- **DynamoDB Table**: TradingPatterns
  - Partition Key: patternId
  - Sort Key: timestamp
  - On-demand billing with PITR enabled

### Messaging
- **SQS Queue**: AlertQueue
  - Visibility timeout: 300 seconds
  - Message retention: 4 days
  - Dead Letter Queue configured

### Notifications
- **SNS Topic**: TradingAlerts
  - Email subscriptions for critical alerts

### Monitoring
- CloudWatch Logs (7-day retention)
- X-Ray tracing enabled on all functions
- CloudWatch alarms for error rates > 1%

## Prerequisites

- AWS CDK 2.x
- Node.js 18+
- TypeScript 5.x
- AWS CLI configured

## Deployment

1. Install dependencies:

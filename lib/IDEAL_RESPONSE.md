# Serverless Logistics Shipment Automation System

## Architecture Overview

This solution implements a comprehensive serverless logistics automation system using AWS services to handle 2,000 daily shipment updates with reliability, scalability, and monitoring capabilities.

## Core Components

### 1. Event Processing Pipeline
- **Amazon EventBridge**: Intelligent event routing for shipment updates from logistics partners
- **AWS Lambda (Node.js 20.x)**: Serverless compute for processing shipment events
- **Amazon SQS Dead Letter Queue**: Captures failed events for manual review and replay

### 2. Data Storage and Management
- **Amazon DynamoDB**: 
  - Primary table: `shipment-logs-{EnvironmentSuffix}`
  - Composite key: `shipmentId` (HASH) + `timestamp` (RANGE)
  - Global Secondary Index: `StatusIndex` for efficient status-based queries
  - Point-in-time recovery enabled for data protection
  - DynamoDB Streams for change data capture

### 3. Monitoring and Alerting
- **Amazon CloudWatch**:
  - Custom metrics namespace: `LogisticsAutomation`
  - Comprehensive dashboard with key performance indicators
  - Alarms for Lambda errors, throttles, and DLQ messages
- **Amazon SNS**: Real-time email notifications for critical events and failures

### 4. Security and Access Control
- **AWS IAM**: Least-privilege access with specific permissions for:
  - DynamoDB operations (PutItem, GetItem, UpdateItem, Query)
  - SNS publishing
  - CloudWatch metrics publication

## Key Features

### Event Processing Capabilities
- Validates incoming shipment data with required field checking
- Processes multiple event types: `Shipment Update`, `Shipment Status Change`
- Automatic retry mechanism with EventBridge (2 attempts)
- Comprehensive error handling and logging

### Data Model
```json
{
  "shipmentId": "string",
  "timestamp": "number",
  "status": "string",
  "location": "string", 
  "carrier": "string",
  "eventData": "json_string",
  "processedAt": "iso_datetime"
}
```

### Monitoring Metrics
- `ShipmentProcessed`: Count of successfully processed shipments
- `ShipmentProcessingError`: Count of processing failures
- `ProcessingDuration`: Lambda execution time in milliseconds

### Alert Conditions
- Critical status updates: DELAYED, FAILED, LOST
- Lambda function errors (threshold: >5 in 5 minutes)
- Lambda throttles (threshold: >1 in 5 minutes) 
- Dead letter queue messages (threshold: >=1)

## Operational Excellence

### Scalability
- Serverless architecture auto-scales based on demand
- DynamoDB on-demand billing handles traffic spikes
- Lambda concurrency manages processing load

### Reliability
- Multi-layer error handling
- Dead letter queue prevents event loss
- Point-in-time recovery for data protection
- Comprehensive monitoring and alerting

### Cost Optimization
- Pay-per-request pricing for DynamoDB
- Lambda charges only for execution time
- CloudWatch logs with 30-day retention

### Security
- Least-privilege IAM roles
- No hardcoded credentials
- Environment-specific resource isolation

## Configuration Parameters

- **EnvironmentSuffix**: Environment identifier for resource naming
- **NotificationEmail**: Email address for SNS alerts (validated format)

## Outputs

The stack exports the following values for integration:
- DynamoDB table name and ARN
- Lambda function ARN
- SNS topic ARN
- EventBridge rule name
- CloudWatch dashboard URL
- Dead letter queue URL

This architecture ensures reliable processing of 2,000+ daily shipment updates while providing comprehensive monitoring, alerting, and operational visibility for the logistics team.
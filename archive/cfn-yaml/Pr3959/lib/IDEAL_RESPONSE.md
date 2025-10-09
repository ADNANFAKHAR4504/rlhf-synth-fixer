# Serverless Notification System - CloudFormation Solution

This solution implements a complete serverless notification system for handling 2,000 daily order update notifications using AWS CloudFormation with YAML configuration.

## Architecture Overview

The system uses the following AWS services:
- **SNS (Simple Notification Service)**: Central messaging hub for publishing order notifications
- **Lambda**: Node.js function for processing notifications and handling failures
- **DynamoDB**: NoSQL database for logging notification events with GSI for status queries
- **CloudWatch**: Comprehensive monitoring with custom metrics, alarms, and dashboard
- **SES (Simple Email Service)**: Email fallback when push delivery fails
- **IAM**: Role-based security with least-privilege permissions

## CloudFormation Template Structure

### Parameters
- `EnvironmentSuffix`: Environment differentiation (dev/staging/prod)
- `NotificationEmail`: Configurable email for notifications and SES fallback

### Key Resources

#### 1. SNS Topic (`OrderNotificationTopic`)
```yaml
Type: AWS::SNS::Topic
Properties:
  TopicName: !Sub 'order-notifications-${EnvironmentSuffix}'
  Subscription:
    - Endpoint: !GetAtt NotificationProcessorFunction.Arn
      Protocol: lambda
    - Endpoint: !Ref NotificationEmail
      Protocol: email
```

#### 2. Lambda Function (`NotificationProcessorFunction`)
- **Runtime**: Node.js 22.x for optimal performance
- **Memory**: 512MB for handling concurrent notifications
- **Timeout**: 30 seconds for reliable processing
- **Key Features**:
  - DynamoDB logging with structured data
  - CloudWatch custom metrics publishing
  - SES fallback for failed deliveries
  - Error handling and retry logic

#### 3. DynamoDB Table (`NotificationLogTable`)
- **Billing**: Pay-per-request for cost optimization
- **Schema**: 
  - Primary Key: `notificationId` (Hash) + `timestamp` (Range)
  - GSI: `StatusIndex` for status-based queries
- **Features**:
  - Point-in-time recovery enabled
  - DynamoDB Streams for future extensibility
  - No deletion protection for testing environments

#### 4. IAM Role (`NotificationProcessorRole`)
Least-privilege permissions including:
- DynamoDB read/write access to notification table
- SES email sending permissions
- CloudWatch metrics publishing
- Lambda execution role basics

#### 5. CloudWatch Monitoring
- **Alarms**:
  - `NotificationFailureAlarm`: Triggers on >10 failures in 5 minutes
  - `LambdaErrorAlarm`: Monitors Lambda function errors
  - `LambdaThrottleAlarm`: Alerts on function throttling
- **Dashboard**: Real-time visualization of:
  - Notification processing metrics
  - Lambda performance metrics
  - SNS delivery statistics

## Lambda Function Implementation

The notification processor implements:

1. **Message Processing**: Parses SNS messages and extracts order information
2. **DynamoDB Logging**: Stores notification events with metadata:
   - `notificationId`, `timestamp`, `status`
   - `messageType`, `orderId`, `processedAt`
   - Error details for failed notifications

3. **CloudWatch Metrics**: Publishes custom metrics:
   - `NotificationsProcessed`: Success counter
   - `NotificationFailures`: Failure counter
   - Dimensional data by environment and status

4. **SES Fallback**: Automatic email notifications for failures including:
   - Notification ID and error details
   - Timestamp and original message content
   - Sent to configured notification email

## Security Features

- IAM role with minimal required permissions
- SNS topic policy restricting publish access to account
- No hardcoded secrets or credentials
- Resource-level access controls

## Scalability Considerations

- **SNS**: Auto-scales to handle message volume
- **Lambda**: Concurrent execution for parallel processing
- **DynamoDB**: Pay-per-request billing scales with usage
- **Environment suffix**: Enables multiple deployments

## Monitoring and Observability

- CloudWatch dashboard provides real-time visibility
- Alarms trigger on failure thresholds
- DynamoDB logs provide audit trail
- Custom metrics enable business intelligence

## Outputs

The template exports all necessary values for integration:
- SNS topic ARN and name
- Lambda function ARN and name  
- DynamoDB table ARN and name
- Dashboard URL for monitoring
- Configured notification email

This solution provides a production-ready, serverless notification system that can handle the required 2,000 daily notifications with proper monitoring, error handling, and scalability.
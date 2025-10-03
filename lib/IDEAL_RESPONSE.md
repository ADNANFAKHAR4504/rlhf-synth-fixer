# Ideal Response Structure

## Overview

This document defines the ideal response structure for the Payment Workflow Orchestration System, outlining the expected behavior, outputs, and success criteria for each component.

## 1. CloudFormation Template Structure

### 1.1 Template Metadata

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Payment Workflow Orchestration System using Step Functions'
```

### 1.2 Parameters

- **Environment**: String with allowed values [dev, test, prod]
- **AlertEmail**: String with email validation pattern
- **EnvironmentSuffix**: String with alphanumeric pattern validation

### 1.3 Resources

- DynamoDB table with proper indexing and encryption
- SNS topic with email subscription
- IAM roles with least privilege access
- Lambda functions with proper runtime and configuration
- Step Functions state machine with retry logic
- CloudWatch dashboard and alarms
- All resources tagged with `iac-rlhf-amazon`

## 2. Lambda Function Response Structures

### 2.1 ValidatePayment Lambda

**Success Response:**

```json
{
  "statusCode": 200,
  "isValid": true,
  "paymentId": "PAY-12345",
  "customerId": "CUST-67890",
  "amount": 100.5,
  "currency": "USD",
  "customerEmail": "customer@example.com"
}
```

**Error Response:**

```json
{
  "statusCode": 400,
  "isValid": false,
  "errors": ["Invalid paymentId", "Amount must be greater than 0"],
  "paymentId": "PAY-12345"
}
```

### 2.2 ProcessPayment Lambda

**Success Response:**

```json
{
  "statusCode": 200,
  "success": true,
  "paymentId": "PAY-12345",
  "transactionId": "TXN-PAY-12345-1640995200",
  "processedAt": "2021-12-31T23:00:00.000Z",
  "amount": 100.5,
  "currency": "USD"
}
```

**Failure Response:**

```json
{
  "statusCode": 402,
  "success": false,
  "paymentId": "PAY-12345",
  "error": "Insufficient funds",
  "transactionId": null
}
```

### 2.3 StoreTransaction Lambda

**Success Response:**

```json
{
  "statusCode": 200,
  "stored": true,
  "paymentId": "PAY-12345",
  "status": "SUCCESS"
}
```

**Idempotent Response:**

```json
{
  "statusCode": 200,
  "stored": true,
  "paymentId": "PAY-12345",
  "note": "Already stored"
}
```

### 2.4 NotifyCustomer Lambda

**Success Response:**

```json
{
  "statusCode": 200,
  "notified": true,
  "paymentId": "PAY-12345",
  "customerEmail": "customer@example.com",
  "notificationType": "email"
}
```

**Failure Response:**

```json
{
  "statusCode": 200,
  "notified": false,
  "paymentId": "PAY-12345",
  "error": "SNS publish failed"
}
```

## 3. Step Functions Execution Response

### 3.1 Successful Execution

```json
{
  "paymentId": "PAY-12345",
  "customerId": "CUST-67890",
  "amount": 100.5,
  "currency": "USD",
  "customerEmail": "customer@example.com",
  "validation": {
    "statusCode": 200,
    "isValid": true,
    "paymentId": "PAY-12345",
    "customerId": "CUST-67890",
    "amount": 100.5,
    "currency": "USD",
    "customerEmail": "customer@example.com"
  },
  "payment": {
    "statusCode": 200,
    "success": true,
    "paymentId": "PAY-12345",
    "transactionId": "TXN-PAY-12345-1640995200",
    "processedAt": "2021-12-31T23:00:00.000Z",
    "amount": 100.5,
    "currency": "USD"
  },
  "storeResult": {
    "statusCode": 200,
    "stored": true,
    "paymentId": "PAY-12345",
    "status": "SUCCESS"
  }
}
```

### 3.2 Validation Failure Execution

```json
{
  "paymentId": "PAY-12345",
  "validation": {
    "statusCode": 400,
    "isValid": false,
    "errors": ["Invalid paymentId", "Amount must be greater than 0"],
    "paymentId": "PAY-12345"
  },
  "storeResult": {
    "statusCode": 200,
    "stored": true,
    "paymentId": "PAY-12345",
    "status": "VALIDATION_FAILED"
  }
}
```

### 3.3 Payment Processing Failure Execution

```json
{
  "paymentId": "PAY-12345",
  "customerId": "CUST-67890",
  "amount": 100.5,
  "currency": "USD",
  "customerEmail": "customer@example.com",
  "validation": {
    "statusCode": 200,
    "isValid": true,
    "paymentId": "PAY-12345",
    "customerId": "CUST-67890",
    "amount": 100.5,
    "currency": "USD",
    "customerEmail": "customer@example.com"
  },
  "payment": {
    "statusCode": 402,
    "success": false,
    "paymentId": "PAY-12345",
    "error": "Insufficient funds",
    "transactionId": null
  },
  "storeResult": {
    "statusCode": 200,
    "stored": true,
    "paymentId": "PAY-12345",
    "status": "FAILED"
  }
}
```

## 4. DynamoDB Item Structure

### 4.1 Successful Payment Record

```json
{
  "paymentId": "PAY-12345",
  "customerId": "CUST-67890",
  "amount": 100.5,
  "currency": "USD",
  "customerEmail": "customer@example.com",
  "transactionId": "TXN-PAY-12345-1640995200",
  "status": "SUCCESS",
  "timestamp": "2021-12-31T23:00:00.000Z",
  "processedAt": "2021-12-31T23:00:00.000Z",
  "retries": 0
}
```

### 4.2 Failed Payment Record

```json
{
  "paymentId": "PAY-12345",
  "customerId": "CUST-67890",
  "amount": 100.5,
  "currency": "USD",
  "customerEmail": "customer@example.com",
  "status": "FAILED",
  "timestamp": "2021-12-31T23:00:00.000Z",
  "errorReason": "Insufficient funds",
  "retries": 3
}
```

### 4.3 Validation Failed Record

```json
{
  "paymentId": "PAY-12345",
  "status": "VALIDATION_FAILED",
  "timestamp": "2021-12-31T23:00:00.000Z",
  "errorReason": ["Invalid paymentId", "Amount must be greater than 0"],
  "retries": 0
}
```

## 5. SNS Notification Messages

### 5.1 Success Notification

```
Subject: Payment Successful - PAY-12345

Dear Customer,

Your payment has been successfully processed.

Payment ID: PAY-12345
Transaction ID: TXN-PAY-12345-1640995200
Amount: 100.50 USD

Thank you for your business!
```

### 5.2 Failure Notification

```
Subject: Payment Failed - PAY-12345

Dear Customer,

Unfortunately, your payment could not be processed.

Payment ID: PAY-12345
Error: Insufficient funds

Please contact support if you need assistance.
```

### 5.3 Alert Notification

```
Subject: Payment Workflow Failed

A payment workflow has failed after maximum retries.

Payment ID: PAY-12345
Error: Payment gateway timeout
Retries: 3
Timestamp: 2021-12-31T23:00:00.000Z
```

## 6. CloudWatch Metrics

### 6.1 Step Functions Metrics

- **ExecutionsStarted**: Number of workflow executions started
- **ExecutionsSucceeded**: Number of successful executions
- **ExecutionsFailed**: Number of failed executions
- **ExecutionTime**: Average execution time

### 6.2 Lambda Metrics

- **Invocations**: Number of function invocations
- **Errors**: Number of function errors
- **Duration**: Function execution duration
- **Throttles**: Number of throttled invocations

### 6.3 DynamoDB Metrics

- **ConsumedReadCapacityUnits**: Read capacity consumed
- **ConsumedWriteCapacityUnits**: Write capacity consumed
- **ThrottledRequests**: Number of throttled requests

## 7. CloudWatch Alarms

### 7.1 Workflow Failure Alarm

- **Metric**: ExecutionsFailed
- **Threshold**: > 5 failures in 5 minutes
- **Action**: Send SNS notification

### 7.2 High Execution Time Alarm

- **Metric**: ExecutionTime
- **Threshold**: > 60 seconds average
- **Action**: Send SNS notification

## 8. Dashboard Widgets

### 8.1 Workflow Executions Widget

- Line chart showing executions started, succeeded, and failed
- Time range: 24 hours
- Period: 5 minutes

### 8.2 Lambda Metrics Widget

- Line chart showing invocations, errors, and duration
- Time range: 24 hours
- Period: 5 minutes

## 9. Error Handling Standards

### 9.1 HTTP Status Codes

- **200**: Success
- **400**: Bad Request (validation errors)
- **402**: Payment Required (insufficient funds)
- **500**: Internal Server Error

### 9.2 Error Response Format

```json
{
  "statusCode": 400,
  "error": "Validation failed",
  "message": "Invalid input parameters",
  "details": {
    "field": "amount",
    "reason": "Must be greater than 0"
  },
  "timestamp": "2021-12-31T23:00:00.000Z",
  "requestId": "req-12345"
}
```

## 10. Performance Standards

### 10.1 Response Time Targets

- **Validation Lambda**: < 1 second
- **Payment Processing Lambda**: < 5 seconds
- **Storage Lambda**: < 2 seconds
- **Notification Lambda**: < 1 second

### 10.2 Throughput Targets

- **Concurrent Executions**: 100
- **Daily Workflows**: 1,500
- **Peak Load**: 10 workflows per minute

### 10.3 Availability Targets

- **System Availability**: 99.9%
- **Data Durability**: 99.999999999%
- **Recovery Time Objective**: < 15 minutes

## 11. Security Standards

### 11.1 Encryption

- **Data at Rest**: AES-256 encryption
- **Data in Transit**: TLS 1.2+
- **Key Management**: AWS KMS

### 11.2 Access Control

- **IAM Roles**: Least privilege access
- **Resource Policies**: Restrictive access
- **Network Security**: VPC endpoints where applicable

### 11.3 Audit and Compliance

- **CloudTrail**: All API calls logged
- **CloudWatch Logs**: Application logs retained
- **DynamoDB**: Point-in-time recovery enabled

## 12. Monitoring and Observability

### 12.1 Logging Standards

- **Log Level**: INFO for normal operations, ERROR for failures
- **Log Format**: JSON structured logging
- **Log Retention**: 7 days for CloudWatch Logs

### 12.2 Metrics Collection

- **Custom Metrics**: Business-specific metrics
- **Standard Metrics**: AWS service metrics
- **Composite Metrics**: Calculated metrics for dashboards

### 12.3 Alerting Strategy

- **Critical Alerts**: Immediate notification
- **Warning Alerts**: 15-minute delay
- **Info Alerts**: Daily digest

This ideal response structure ensures the Payment Workflow Orchestration System meets all requirements for reliability, security, performance, and maintainability while providing clear visibility into system behavior and health.

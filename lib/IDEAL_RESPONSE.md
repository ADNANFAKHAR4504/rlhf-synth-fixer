# Ideal Infrastructure Solution: Restaurant Order Processing System

This document describes the production-ready order processing infrastructure deployed for a restaurant chain handling 3,400 orders per day.

## Architecture Overview

A serverless order processing system deployed in us-west-1 with the following components:

1. **SQS FIFO Queues**: Main queue and Dead Letter Queue for reliable message ordering
2. **Lambda Function**: Node.js 20 order validator with CloudWatch monitoring
3. **DynamoDB Table**: Persistent storage with PAY_PER_REQUEST billing
4. **Step Functions**: Workflow orchestration with retry logic
5. **EventBridge Scheduler**: Daily report generation
6. **CloudWatch Logs**: Centralized logging with 7-day retention

## Infrastructure Code Structure

### Main.java (Refactored for Maintainability)

The infrastructure is defined using helper methods to comply with checkstyle rules (max 200 lines per method):

- `createDeadLetterQueue()`: Creates FIFO DLQ with 3-day retention
- `createOrderQueue()`: Creates main FIFO queue with redrive policy
- `createOrdersTable()`: Creates DynamoDB table with composite key
- `createLambdaRole()` & `createLambdaPolicy()`: IAM permissions following least privilege
- `createLambdaFunction()`: Lambda with environment variables and dependencies
- `createEventSourceMapping()`: Connects SQS to Lambda
- `createStepFunctionsRole()` & `createStepFunctionsPolicy()`: Step Functions IAM
- `createStepFunctionsStateMachine()`: Workflow with error handling
- `createSchedulerRole()` & `createSchedulerPolicy()`: EventBridge IAM
- `createDailySchedule()`: Cron-based scheduler
- `exportOutputs()`: Stack outputs for integration tests

### Lambda Function (index.js)

Order validator with:
- Field validation (orderId, customerName, items, totalAmount)
- DynamoDB persistence
- CloudWatch metrics publishing
- Error handling with detailed logging

## Key Design Decisions

1. **FIFO Queues**: Ensures order sequence is maintained
2. **Content-Based Deduplication**: Prevents duplicate processing
3. **Visibility Timeout**: 300 seconds for processing
4. **DLQ with Max Receive Count**: 3 retries before DLQ
5. **PAY_PER_REQUEST**: Cost-effective for variable workload
6. **Composite Key**: orderId (hash) + orderTimestamp (range)
7. **Step Functions Retry Logic**: Exponential backoff for transient failures
8. **CloudWatch Integration**: Metrics for throughput, errors, execution times

## Testing

- **Unit Tests**: 23 tests covering method structure and visibility
- **Integration Tests**: 10 tests validating deployed infrastructure
  - Queue configuration (FIFO, deduplication, visibility timeout)
  - DynamoDB schema and billing mode
  - Lambda configuration (runtime, handler, timeout)
  - Step Functions workflow definition
  - CloudWatch log group retention

## Compliance

- All resources are destroyable (no retain policies)
- IAM follows least privilege principle
- Resources tagged for cost tracking
- Checkstyle compliant (no methods > 200 lines)
- Comprehensive test coverage
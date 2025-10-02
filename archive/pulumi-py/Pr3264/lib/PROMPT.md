# Gaming Leaderboard Update System Infrastructure

Create AWS infrastructure code using Pulumi Python to build an asynchronous leaderboard update system for a gaming application. The system should process 2,200 daily leaderboard updates with reliability and auditing capabilities.

## Requirements

### Core Components
- SQS standard queue for receiving leaderboard update messages
- Lambda function (Python 3.11) to process updates from the queue
- DynamoDB table to store leaderboard data and update logs
- Dead Letter Queue (DLQ) for handling failed update messages

### Configuration Details

**SQS Queue:**
- Standard queue for leaderboard update messages
- Message retention period: 4 days
- Visibility timeout: 60 seconds
- Redrive policy pointing to DLQ after 3 attempts
- Enable content-based deduplication for reliability

**Lambda Function:**
- Runtime: Python 3.11
- Memory: 512 MB
- Timeout: 30 seconds
- Reserved concurrent executions: 10
- Event source mapping from SQS queue with batch size of 10
- Environment variables for DynamoDB table name

**DynamoDB Table:**
- Partition key: player_id (String)
- Sort key: timestamp (Number)
- On-demand billing mode for cost efficiency
- Point-in-time recovery enabled
- Stream enabled with NEW_AND_OLD_IMAGES view type for audit trail

**Dead Letter Queue:**
- Maximum receives: 5
- Message retention: 14 days

**IAM Roles:**
- Lambda execution role with least privilege permissions:
  - Read/Delete from SQS queue
  - Write to DynamoDB table
  - Send messages to DLQ
  - Write logs to CloudWatch

**CloudWatch:**
- Log group for Lambda function with 7 days retention
- Metric alarm for DLQ message count threshold (alarm at 10 messages)

## Implementation Notes

- Use AWS EventBridge Scheduler integration for potential future scheduling needs
- Implement Lambda Powertools for structured logging and metrics
- All resources should be tagged with Environment and Purpose tags
- Deploy in us-west-1 region

Provide the complete Pulumi Python infrastructure code with proper error handling and resource dependencies. Include the Lambda function code inline that processes leaderboard updates with proper exception handling and DLQ integration.
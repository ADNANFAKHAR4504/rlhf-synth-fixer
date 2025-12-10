## Secure FinTech Webhook Processor

Build a zero-trust, high-volume payment notification processing system in us-east-1 using AWS CDK in Python. The system must be fully auditable and resilient, capable of handling real-time payment webhooks.

### Core Infrastructure & Flow

1. **Ingestion & Security:** Create an API Gateway REST API with a /webhook POST endpoint secured by API Key Authentication.
2. **Validation & Distribution:** Deploy a Lambda function (webhook_handler) integrated with API Gateway that validates requests and publishes valid events to an SNS Topic (payment_events).
3. **Event Filtering:** Configure the SNS Topic to use message attribute filtering for distribution.
4. **Processing:** Deploy a subscriber Lambda (transaction_processor) to handle payment logic.
5. **Audit Trail:** Deploy an audit_logger Lambda to record all events to a separate DynamoDB table (audit_logs).
6. **Data Persistence:** Create the primary DynamoDB table (transactions) using transaction_id as partition key and timestamp as sort key.

### Resilience and Observability

7. **DLQs:** Implement dedicated Dead Letter Queues (SQS) for both the webhook_handler and the transaction_processor with 3 retries.
8. **Monitoring:** Set up CloudWatch alarms to fire if the transaction_processor error rate exceeds 1% over 5 minutes.
9. **Metrics:** Create custom CloudWatch metrics to track successful and failed transaction processing events.
10. **Logging:** Configure CloudWatch Log Groups for all Lambda functions with 30-day retention.

### Security and Performance Constraints

- **Runtime:** All Lambda functions must use Python 3.11 runtime with arm64 architecture.
- **Data Security:** Both DynamoDB tables must use Point-in-Time Recovery (PITR) and enforce encryption at rest with AWS managed keys.
- **Security Controls:**
  - Implement request throttling on API Gateway at 1000 requests per second per API key.
  - Set concurrent execution limits on all Lambda functions.
  - All IAM roles must strictly follow Least Privilege with no wildcard actions allowed.

Please provide the final Python code in separate, labeled code blocks for `lib/analyse.py`.

Banking Transaction Processor Lambda
Real-time transaction processing Lambda function for global banking platform.
Overview
This Lambda function handles all transaction processing for the banking platform including:

Transaction Validation: Validates amounts, currencies, and transaction types
Idempotency: Prevents duplicate transactions using idempotency keys
Fraud Detection Integration: Calls fraud detection Lambda for every transaction
Multi-Status Handling: APPROVED, REJECTED, PENDING_REVIEW flows
Data Persistence: Stores transactions in DynamoDB
Event Publishing: Publishes to Kinesis streams and SQS queues
Customer Notifications: Sends transaction notifications

Architecture
API Gateway → Transaction Processor Lambda → Fraud Detection Lambda
                        ↓
                ── DynamoDB (transactions)
                ── DynamoDB (idempotency)
                ── Kinesis Stream (real-time events)
                ── SQS Queue (async processing)
                ── SQS Queue (manual review)
                ── SQS Queue (notifications)
                ── SQS Queue (fraud alerts)
Runtime

Language: Java 17
Handler: com.banking.TransactionHandler::handleRequest
Memory: 1024 MB
Timeout: 30 seconds

Transaction Flow

Receive Request → API Gateway proxy event
Parse & Validate → Extract transaction details
Idempotency Check → Prevent duplicate requests
Fraud Detection → Call fraud detection Lambda
Process Transaction → Based on fraud result:

 APPROVED: Save to DB, publish events, notify customer
 REJECTED: Save for audit, send fraud alert
 PENDING_REVIEW: Queue for manual review


Return Response → Status, transaction ID, fraud score

Request Format
json{
  "amount": 150.50,
  "currency": "USD",
  "type": "PAYMENT",
  "description": "Coffee shop purchase",
  "fromAccountId": "acct_12345",
  "toAccountId": "acct_67890",
  "merchantId": "merch_starbucks",
  "merchantName": "Starbucks",
  "merchantCategory": "FOOD_BEVERAGE",
  "sourceCountry": "US",
  "deviceId": "device_123",
  "deviceFingerprint": "fp_abc",
  "paymentMethod": "CREDIT_CARD"
}
Headers
Idempotency-Key: unique-request-id-123
Authorization: Bearer <token>
Content-Type: application/json
Response Format
Approved Transaction
json{
  "transactionId": "TXN-1697500800000-ABC123",
  "status": "APPROVED",
  "message": "Transaction processed successfully",
  "amount": 150.50,
  "currency": "USD",
  "fraudScore": 0.15,
  "reasons": [],
  "timestamp": "2024-10-15T10:30:00Z",
  "processingTimeMs": 245
}
Rejected Transaction
json{
  "transactionId": "TXN-1697500800000-XYZ789",
  "status": "REJECTED",
  "message": "Transaction rejected due to security concerns",
  "amount": 5000.00,
  "currency": "USD",
  "fraudScore": 0.85,
  "reasons": [
    "High fraud score detected (0.85)",
    "Unusual transaction velocity detected"
  ],
  "timestamp": "2024-10-15T10:30:00Z",
  "processingTimeMs": 198
}
Pending Review
json{
  "transactionId": "TXN-1697500800000-DEF456",
  "status": "PENDING_REVIEW",
  "message": "Transaction is under review. You will be notified once reviewed.",
  "amount": 2500.00,
  "currency": "USD",
  "fraudScore": 0.55,
  "reasons": [
    "Medium fraud score - manual review required (0.55)"
  ],
  "timestamp": "2024-10-15T10:30:00Z",
  "processingTimeMs": 312,
  "estimatedReviewTime": "24 hours"
}
Supported Transaction Types

PAYMENT: Merchant payments
TRANSFER: Account-to-account transfers
WITHDRAWAL: ATM/cash withdrawals
DEPOSIT: Cash/check deposits
REFUND: Transaction refunds

Supported Currencies
USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, NGN, INR
Transaction Limits

Minimum: $0.01
Maximum: $50,000.00

Features
1. Idempotency
Prevents duplicate transactions using Idempotency-Key header:
bashcurl -X POST https://api.contactjoshua.live/transactions \
  -H "Idempotency-Key: unique-request-123" \
  -H "Authorization: Bearer token" \
  -d '{"amount": 100, "currency": "USD", ...}'
Duplicate requests return cached response.
2. Fraud Detection Integration
Every transaction is checked by fraud detection Lambda:

ML-based scoring
Velocity checks
Geographic analysis
Amount anomaly detection

3. Multi-Queue Publishing
Transactions are published to multiple queues:

Kinesis Stream: Real-time analytics
SQS Transactions: Async processing (accounting, reporting)
SQS Manual Review: Pending transactions
SQS Notifications: Customer alerts
SQS Fraud Alerts: High-risk transactions

4. Comprehensive Logging

CloudWatch Logs for all transactions
X-Ray tracing for performance analysis
Request/response logging
Error tracking

Build Instructions
1. Build the JAR
bashcd lambda/transaction-processor
./build.sh
2. Deploy with Pulumi
bashpulumi up
Environment Variables
Configured by Pulumi:
VariableDescriptionExampleENVIRONMENTDeployment environmentprodDYNAMODB_TABLETransactions tabletransactions-prodKINESIS_STREAMEvent streamtransactions-stream-prodSQS_QUEUE_URLMain queue URLhttps://sqs...
AWS Services Used

AWS Lambda: Serverless compute
DynamoDB: Transaction and idempotency storage
Lambda: Invokes fraud detection Lambda
Kinesis: Real-time event streaming
SQS: Asynchronous message queuing
CloudWatch: Logging and metrics
X-Ray: Distributed tracing
API Gateway: REST API endpoint

Error Handling
Validation Errors (400)

Invalid amount
Invalid currency
Invalid transaction type
Missing required fields

Processing Errors (500)

Database errors
Fraud detection failures
Queue publishing failures

Fail-Safe Behavior

If fraud detection fails → PENDING_REVIEW
If database write fails → Transaction rolled back
If notification fails → Transaction still processed

Monitoring
CloudWatch Metrics
Track:

Transaction count by status
Processing time percentiles
Error rates
Fraud detection latency

X-Ray Traces
Segments:

TransactionProcessing (main)
InvokeFraudDetection
SaveTransaction
PublishToKinesis
SendToQueue

Testing
Local Testing
bash# Invoke with test event
sam local invoke -e test-event.json

# Test with API Gateway
sam local start-api
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d @test-event.json
Unit Tests
bashmvn test
Security
Authentication

Cognito JWT token required
Customer ID extracted from token claims

Authorization

User can only access their own transactions
Role-based access control

Data Protection

All data encrypted in transit (TLS)
DynamoDB encrypted at rest
Sensitive data never logged

Idempotency

Prevents duplicate charges
24-hour cache window
Automatic TTL cleanup

Performance

Cold Start: ~2-3 seconds
Warm Invocation: 150-300ms
Concurrent Executions: 100 reserved
Throughput: 1000+ TPS

Troubleshooting
High Latency

Check fraud detection Lambda performance
Review DynamoDB throttling
Check network connectivity

Transaction Rejected

Review fraud score in logs
Check X-Ray trace for fraud reasons
Verify transaction details

Idempotency Issues

Check idempotency table exists
Verify key format
Review cache TTL settings

Production Considerations
Scaling

Enable provisioned concurrency
Monitor concurrent execution limits
Configure auto-scaling for DynamoDB

Monitoring

Set up CloudWatch alarms
Monitor error rates
Track fraud score trends

Optimization

Tune Lambda memory
Optimize fraud detection calls
Consider batch processing for queues

Integration
With Fraud Detection Lambda
Transaction processor automatically calls fraud detection:
javaFraudCheckResult result = fraudCheckService.checkFraud(request, transactionId);

if (result.isApproved()) {
    // Process transaction
} else if (result.isRequiresManualReview()) {
    // Queue for review
} else {
    // Reject transaction
}
With Downstream Services
Transactions published to:

Kinesis: Real-time analytics dashboard
SQS: Accounting system, reporting, compliance
Notifications: Email/SMS/push notifications

Support
For issues or questions:

Check CloudWatch logs: /aws/lambda/transaction-processor-{env}
Review X-Ray traces in AWS Console
Contact: banking-platform-team@example.com

License
Proprietary - Banking Platform Team
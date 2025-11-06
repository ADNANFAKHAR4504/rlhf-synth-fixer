I need help building a serverless payment webhook processing system for our fintech startup. We're integrating with multiple payment providers (Stripe, PayPal, and Square) and need to handle their webhook events at scale - we're talking 10,000+ webhooks per minute with sub-second response times. The system needs to be PCI compliant and fully serverless.

## Technology Stack: Terraform HCL

**All infrastructure must be written in Terraform 1.5+ using HCL with AWS Provider 5.x.** This is for production deployment in us-east-1.

## What We're Building

A serverless event-driven system where:
- Payment providers send webhooks to our API Gateway endpoints
- Lambda functions validate and process these webhooks asynchronously
- We store transaction records in DynamoDB for fast queries
- Raw payloads and processed data go to S3 for compliance
- We provide a REST API to query transaction status
- Everything is monitored and we get alerted on failures

## The High-Level Flow

1. Stripe/PayPal/Square sends webhook → API Gateway
2. API Gateway validates request format, invokes Lambda validator
3. Lambda validates signature, stores raw payload to S3, returns 200 OK immediately
4. Lambda asynchronously invokes processor function
5. Processor extracts data, writes to DynamoDB and S3
6. Our systems query transaction status via GET API

This way providers get instant 200 responses, and we process asynchronously.

## API Gateway Setup

**REST API Structure:**
Create a REST API with these endpoints:

Webhook endpoints (POST):
- `/api/v1/webhooks/stripe` - Stripe webhook events
- `/api/v1/webhooks/paypal` - PayPal IPN notifications  
- `/api/v1/webhooks/square` - Square webhook events

Query endpoints (GET):
- `/api/v1/transactions/{id}` - Get transaction by ID
- `/api/v1/transactions?provider={provider}&start={timestamp}&end={timestamp}` - List transactions

**Request Validation - This is Important:**
Implement JSON schema validation on all POST endpoints. Each provider has different webhook formats, so create schemas for:
- Stripe schema: validate Stripe event structure
- PayPal schema: validate IPN structure
- Square schema: validate Square event structure

If the request doesn't match the schema, API Gateway should return 400 Bad Request immediately without invoking Lambda. This protects us from malformed requests.

**Throttling and Rate Limiting:**
Set up throttling:
- Overall burst limit: 5,000 requests
- Steady-state: 10,000 requests per second
- Per-provider limits (configurable):
  - Stripe: 2,000 req/sec
  - PayPal: 1,500 req/sec
  - Square: 1,000 req/sec

**Usage Plans and API Keys:**
Create separate usage plans for each payment provider with their own API keys. This lets us:
- Track usage per provider
- Apply different quotas if needed
- Disable a provider without affecting others
- Monitor costs per provider

**Deployment Stages:**
Set up dev, staging, and production stages. Use stage variables for environment-specific configs like DynamoDB table names and S3 bucket names.

Enable CloudWatch logging (full request/response) and X-Ray tracing on all stages.

## Lambda Functions - ARM64 for Cost Savings

**Important:** All Lambda functions must use ARM64 architecture (Graviton2 processors) for about 20% cost savings compared to x86.

### Webhook Validator Functions (one per provider)

Create three separate Lambda functions:
- `stripe-webhook-validator`
- `paypal-webhook-validator`
- `square-webhook-validator`

Configuration for each:
- Runtime: Python 3.11 or Node.js 18.x (your choice)
- Architecture: **arm64** (this is mandatory)
- Memory: 512 MB
- Timeout: 10 seconds
- Environment variables:
  - `PROVIDER_NAME` (stripe/paypal/square)
  - `PROVIDER_SECRET_ARN` (Secrets Manager ARN for webhook secret)
  - `DYNAMODB_TABLE` (transactions table name)
  - `S3_BUCKET` (raw payloads bucket)
  - `PROCESSOR_FUNCTION_ARN` (processing function to invoke)

What these functions do:
1. Retrieve webhook signing secret from Secrets Manager
2. Verify webhook signature (each provider has different methods)
3. If signature invalid → return 401 Unauthorized
4. If valid → store raw JSON payload to S3
5. Invoke processor function asynchronously (don't wait for result)
6. Return 200 OK immediately to provider

This keeps response times under 1 second even though processing takes longer.

### Webhook Processor Function

Create one processor function that handles all providers:
- `webhook-processor`

Configuration:
- Runtime: Python 3.11 or Node.js 18.x
- Architecture: **arm64**
- Memory: 1024 MB (might need more for processing)
- Timeout: 30 seconds
- Reserved concurrency: 100 (prevents throttling during traffic spikes)
- Dead letter queue: SQS queue for failed events

Environment variables:
- `DYNAMODB_TABLE`
- `S3_PROCESSED_BUCKET`
- `ENVIRONMENT` (dev/staging/prod)

What it does:
1. Parse the webhook event
2. Extract transaction data (amount, currency, customer, status, etc.)
3. Normalize data across providers (they all have different formats)
4. Write record to DynamoDB
5. Store processed/normalized data to S3
6. Handle errors gracefully

If this function fails after retries, the event goes to the dead letter queue (DLQ).

### Transaction Query Function

Create a query function:
- `transaction-query`

Configuration:
- Runtime: Python 3.11 or Node.js 18.x
- Architecture: **arm64**
- Memory: 256 MB (lightweight, just queries)
- Timeout: 5 seconds

What it does:
- Query DynamoDB by transaction ID (primary key)
- Query by provider and timestamp range (using GSI)
- Return formatted JSON response

### Lambda Layers - Reduce Deployment Size

Create a Lambda layer containing shared dependencies:
- Name: `webhook-processor-dependencies`
- Contents:
  - HTTP client libraries (requests for Python, axios for Node)
  - Cryptography libraries for signature validation
  - AWS SDK
  - JSON parsing utilities
  - Logging helpers

All Lambda functions use this layer instead of packaging dependencies individually. This reduces deployment package sizes significantly and speeds up cold starts.

Version the layer so you can update it independently of functions.

## DynamoDB Table

**Transactions Table:**
- Table name: `webhook-transactions`
- Partition key: `transaction_id` (String) - unique ID from provider or UUID
- Sort key: `timestamp` (Number) - Unix timestamp of event

Attributes to store:
- `provider` (String): "stripe", "paypal", or "square"
- `event_type` (String): "payment.success", "refund.created", etc.
- `amount` (Number): transaction amount
- `currency` (String): "USD", "EUR", etc.
- `customer_id` (String): customer identifier
- `status` (String): "pending", "processed", "failed"
- `raw_payload_s3_key` (String): S3 key for raw webhook JSON
- `processed_at` (Number): when we processed it
- `metadata` (Map): any additional provider-specific data

**Global Secondary Indexes:**

GSI-1 for querying by provider and time:
- Name: `ProviderTimestampIndex`
- Partition key: `provider`
- Sort key: `timestamp`
- Projection: ALL

This lets us query: "Give me all Stripe transactions from last hour"

GSI-2 for customer queries:
- Name: `CustomerIndex`
- Partition key: `customer_id`
- Sort key: `timestamp`
- Projection: ALL

This lets us query: "Give me all transactions for customer X"

**Configuration:**
- Billing mode: **On-demand** (mandatory - we don't want to manage capacity)
- Point-in-time recovery: **Enabled** (mandatory - for data protection)
- Encryption: AWS managed (default is fine)
- DynamoDB Streams: Enabled (for audit logging or analytics later)
- TTL: Optional, maybe expire records after 7 years

If we decide to use provisioned mode later, set up autoscaling:
- Target utilization: 70%
- Min: 5 RCU/WCU
- Max: 1000 RCU/WCU

## S3 Buckets

### Raw Webhook Payloads Bucket

Bucket name: `{account-id}-webhook-payloads-{environment}`

Purpose: Store the original webhook JSON exactly as received from providers (for compliance and debugging).

Organization: `/{provider}/{year}/{month}/{day}/{transaction_id}.json`

Configuration:
- Encryption: **SSE-S3** (mandatory)
- Public access: **Blocked** (mandatory)
- Versioning: Disabled (no need)
- Lifecycle policy:
  - Move to Intelligent-Tiering immediately
  - Move to Glacier after 90 days
  - Delete after 365 days (or 7 years for compliance)

### Processed Transaction Logs Bucket

Bucket name: `{account-id}-transaction-logs-{environment}`

Purpose: Store processed and normalized transaction data in a consistent format.

Organization: `/{provider}/{year}/{month}/{day}/transactions.json` (maybe batch writes)

Configuration:
- Encryption: **SSE-S3**
- Public access: **Blocked**
- Versioning: Enabled (in case we need to recover)
- Lifecycle policy:
  - Intelligent-Tiering immediately
  - Glacier after 180 days
  - Keep for 7 years for PCI compliance

## Dead Letter Queue (DLQ)

Create an SQS queue for failed webhook processing:
- Queue name: `webhook-processing-dlq`
- Message retention: 14 days
- Visibility timeout: 30 seconds

Configure the processor Lambda function to send failed events here after 2 retries.

Set up a CloudWatch alarm if message count > 10 (means something is seriously wrong).

## CloudWatch Monitoring

**Log Groups:**
Create log groups for each Lambda function with retention policies:
- Validators: 7 days retention
- Processor: 30 days retention (more important to keep)
- Query function: 7 days
- API Gateway: 14 days

**Metric Filters:**
Create filters to extract metrics from logs:
- Count ERROR lines (transaction failures)
- Count "Invalid signature" (security issues)
- Measure processing duration from log timestamps
- Track errors by provider

**CloudWatch Alarms:**

Lambda alarms:
- Errors > 10 in 5 minutes
- Throttles > 5 in 5 minutes
- Duration approaching timeout (> 80% of max)
- Concurrent executions > 900 (we're approaching limit of 1000)
- DLQ message count > 10

API Gateway alarms:
- 4xx error rate > 5%
- 5xx error rate > 1%
- Latency p99 > 2000ms (we want sub-second)
- Anomaly detection on request count

DynamoDB alarms:
- User errors > 50 in 5 minutes
- System errors > 0 (shouldn't happen)
- Throttled requests > 10

All alarms should publish to SNS topic that emails/pages the ops team.

## X-Ray Tracing - Mandatory

Enable X-Ray tracing on everything for distributed tracing:
- API Gateway: Active tracing
- All Lambda functions: X-Ray SDK instrumented in code
- Sampling: 100% for errors, 10% for successful requests

In Lambda code, create custom subsegments for:
- DynamoDB operations
- S3 operations
- External API calls (if any)

Add annotations like `provider`, `transaction_id`, `status` so we can filter traces.

This gives us end-to-end visibility: webhook arrives → validation → processing → database write.

## IAM Roles and Permissions

**Lambda Execution Roles:**
Create separate roles for each Lambda function with minimal permissions:

Validator functions need:
- CloudWatch Logs write
- X-Ray write
- S3 PutObject (scoped to payloads bucket)
- Secrets Manager GetSecretValue (scoped to specific secrets)
- Lambda InvokeFunction (to invoke processor)

Processor function needs:
- CloudWatch Logs write
- X-Ray write
- DynamoDB PutItem/UpdateItem (scoped to transactions table)
- S3 PutObject (scoped to processed logs bucket)
- SQS SendMessage (for DLQ)

Query function needs:
- CloudWatch Logs write
- X-Ray write
- DynamoDB GetItem/Query (scoped to transactions table, read-only)

**API Gateway Role:**
- CloudWatch Logs write
- Lambda InvokeFunction for all webhook functions

## Secrets Management

Store webhook signing secrets in AWS Secrets Manager:
- `webhook-processor/stripe/secret` - Stripe webhook signing secret
- `webhook-processor/paypal/secret` - PayPal API secret
- `webhook-processor/square/secret` - Square webhook signature key

Lambda functions retrieve these at initialization (cold start) and cache them.

Rotation: Manual for now (update when providers rotate keys).

## Mandatory Requirements - No Exceptions

These are hard requirements:
1. **Lambda functions must use ARM-based Graviton2 processors (arm64)** for cost optimization
2. **DynamoDB tables must use on-demand billing mode** with point-in-time recovery enabled
3. **API Gateway must implement request validation** using JSON schemas for all POST endpoints
4. **All Lambda functions must have X-Ray tracing enabled** for distributed tracing
5. **S3 buckets must use SSE-S3 encryption** and block all public access

## What We Need From You - Terraform HCL Code

**Terraform Modules:**
- `modules/api-gateway/` - API Gateway with endpoints, schemas, usage plans, API keys
- `modules/lambda-function/` - Reusable Lambda creation with standard configs
- `modules/lambda-layer/` - Lambda layer for shared dependencies
- `modules/dynamodb-table/` - DynamoDB with GSIs
- `modules/s3-bucket/` - S3 with lifecycle and encryption

**Main Configuration Files:**
- `versions.tf` (Terraform >= 1.5, AWS >= 5.x)
- `providers.tf` (AWS provider for us-east-1)
- `variables.tf` (all inputs)
- `data.tf` (data sources for account ID, region)
- `api-gateway.tf` (API Gateway REST API, endpoints, integrations)
- `lambda-validators.tf` (three validator Lambda functions)
- `lambda-processor.tf` (processor function with DLQ)
- `lambda-query.tf` (query function)
- `lambda-layers.tf` (shared dependencies layer)
- `dynamodb.tf` (transactions table with both GSIs)
- `s3-buckets.tf` (both buckets with lifecycle policies)
- `sqs.tf` (dead letter queue)
- `cloudwatch-logs.tf` (log groups with retention)
- `cloudwatch-alarms.tf` (all alarms and SNS topic)
- `iam-roles.tf` (all IAM roles and policies)
- `secrets.tf` (Secrets Manager secrets for provider keys)
- `outputs.tf` (API endpoint URL, function ARNs, table name, bucket names)

**Lambda Function Code:**
Please provide example/skeleton code for:
- `lambda/stripe-validator/index.py` (or .js) - Stripe signature validation
- `lambda/paypal-validator/index.py` - PayPal signature validation
- `lambda/square-validator/index.py` - Square signature validation
- `lambda/processor/index.py` - Event processing logic
- `lambda/query/index.py` - Query DynamoDB
- `lambda/layers/dependencies/` - What goes in the layer

**API Gateway JSON Schemas:**
- `schemas/stripe-webhook.json` - Stripe event validation schema
- `schemas/paypal-webhook.json` - PayPal IPN validation schema
- `schemas/square-webhook.json` - Square event validation schema

**Documentation:**
Comprehensive README.md with:
- Architecture diagram (provider → API Gateway → Lambda → DynamoDB/S3 flow)
- How the system works end-to-end
- API endpoint documentation with examples
- Deployment instructions:
  - Prerequisites
  - How to add provider secrets to Secrets Manager
  - Terraform apply sequence
  - Testing with mock webhooks
- How to add a new payment provider (steps to follow the pattern)
- Monitoring guide:
  - What metrics to watch
  - What alarms mean
  - How to investigate issues with X-Ray
- Troubleshooting:
  - Invalid signatures
  - Lambda timeouts
  - DynamoDB throttling
  - DLQ messages piling up
- Cost optimization tips
- PCI compliance considerations:
  - What data we store where
  - Encryption at rest and in transit
  - Access controls
- Performance tuning guide
- Disaster recovery procedures

## Performance Targets

- **Throughput:** Handle 10,000 webhooks per minute sustained
- **Latency:** API Gateway response < 1 second at p99
- **Availability:** 99.9% uptime
- **Scalability:** Automatically scale to handle traffic spikes
- **Cold start:** < 500ms for validators (critical for provider timeouts)

## Testing Requirements

Include instructions for:
- Load testing with 10,000 requests/minute
- Testing each provider's webhook format
- Testing signature validation (valid and invalid)
- Testing DLQ behavior (simulate failures)
- Testing query API performance
- Verifying X-Ray traces show complete flow

## Security and Compliance

This handles payment data, so security is critical:
- No cardholder data in logs (mask sensitive fields)
- All data encrypted at rest (S3, DynamoDB)
- All data encrypted in transit (HTTPS only)
- Secrets in Secrets Manager, never in code or environment variables
- IAM roles follow least privilege
- CloudTrail logging on for audit trail
- 7-year retention for PCI compliance

Make everything production-ready, well-documented, and maintainable. This is handling real money so reliability and security are paramount!
```
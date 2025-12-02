# Serverless Webhook Processing System

Hey team,

We've got an interesting challenge from a fintech startup. They're integrating with multiple payment providers and need to handle webhook events reliably. Think Stripe, PayPal, and other payment processors all sending notifications about transactions, refunds, disputes, and whatnot. Right now, they don't have a proper way to receive and process these webhooks at scale.

The business needs this to be bulletproof because missed webhooks mean missed payments or failed transaction updates. They also have audit requirements - every webhook payload needs to be stored for compliance. Plus, different providers send webhooks in different orders, and some downstream systems need events processed sequentially per provider. It's not just about receiving HTTP requests; it's about building a reliable pipeline.

I've been asked to build this using **Pulumi with Python** to deploy serverless AWS infrastructure. The team prefers Python for infrastructure code because it's what the rest of their backend uses.

## What we need to build

Create a serverless webhook processing pipeline using **Pulumi with Python** that can ingest, validate, store, and route payment webhook events.

### Core Requirements

1. **Webhook Ingestion Endpoint**
   - REST API with POST endpoint at /webhook
   - Validate required headers: X-Webhook-Signature and X-Provider-ID
   - Handle high volumes with throttling protection
   - Return immediately to the webhook sender (async processing)

2. **Signature Validation and Payload Storage**
   - Lambda function to validate webhook signatures
   - Store raw webhook payloads in S3 for audit compliance
   - Archive old payloads after 30 days using lifecycle policies
   - Track webhook metadata in DynamoDB (id, provider, timestamp, status)

3. **Ordered Processing Pipeline**
   - Use SQS FIFO queue to ensure order-by-provider processing
   - Lambda function to consume messages from FIFO queue
   - Handle processing failures with dead letter queue
   - Maximum 3 retry attempts before sending to DLQ

4. **Event Routing**
   - Custom EventBridge bus for processed webhooks
   - EventBridge rules to route by provider type
   - Enable downstream systems to subscribe to specific provider events

5. **Observability**
   - CloudWatch Logs for all Lambda functions with 7-day retention
   - X-Ray tracing enabled on API Gateway and Lambda
   - Detailed logging for troubleshooting and audit trails

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **API Gateway REST API** for webhook endpoint
- Use **Lambda** functions (Python 3.11 runtime, 256MB memory, 30s timeout)
- Use **DynamoDB** with on-demand billing for webhook metadata
- Use **S3** with lifecycle policy for payload storage (archive after 30 days)
- Use **SQS FIFO** queue for ordered processing
- Use **SQS standard** queue as dead letter queue
- Use **EventBridge** custom bus and rules for event routing
- Use **CloudWatch Logs** with 7-day retention
- Use **X-Ray** tracing for all components
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- All resources must include **environmentSuffix** in their names
  - Examples: webhook-api-dev, payload-bucket-staging, webhook-metadata-prod
  - This ensures multiple environments can coexist without naming conflicts
- All resources must be **destroyable** (no RemovalPolicy.RETAIN or equivalent)
  - S3 buckets: Enable force_destroy or auto_delete_objects
  - DynamoDB tables: Use default deletion policy (no retain)
  - CloudWatch Logs: Allow deletion
  - This is CRITICAL for test environments that need clean teardown
- Lambda functions must use Python 3.11 runtime
- All resources must be tagged with Environment and Service tags

### Constraints (All 10 Must Be Enforced)

1. **API Gateway**: Enable request validation and throttling
2. **Lambda Configuration**: 256MB memory and 30 second timeout for all functions
3. **DynamoDB Billing**: Use on-demand billing mode (no provisioned capacity)
4. **Lambda Runtime**: Python 3.11 for all Lambda functions
5. **X-Ray Tracing**: Enable on all Lambda functions and API Gateway
6. **SQS FIFO**: Use FIFO queue with content-based deduplication for ordered processing
7. **Dead Letter Queue**: Implement DLQ with maximum 3 receive attempts
8. **S3 Lifecycle**: Archive webhook payloads to Glacier after 30 days
9. **EventBridge**: Use custom event bus with provider-based routing rules
10. **Resource Tagging**: Tag all resources with Environment and Service tags

### Service-Specific Notes

- **Lambda Functions**: Include IAM roles with appropriate permissions
  - Ingestion function: S3 write, DynamoDB write, SQS send, X-Ray write
  - Processing function: SQS receive/delete, EventBridge put events, X-Ray write
- **S3 Bucket**: Must be globally unique, include environmentSuffix
- **SQS FIFO**: Queue names must end with .fifo suffix
- **DynamoDB**: Single table with partition key for webhook id
- **EventBridge Rules**: Create at least one example rule (e.g., route Stripe events)

## Success Criteria

- **Functionality**: Webhook endpoint accepts POST requests with required headers
- **Validation**: API Gateway validates headers before invoking Lambda
- **Storage**: Raw payloads stored in S3 with lifecycle policy
- **Metadata**: Webhook tracking records created in DynamoDB
- **Ordering**: FIFO queue ensures order-by-provider processing
- **Resilience**: Failed messages routed to DLQ after 3 attempts
- **Routing**: EventBridge publishes processed webhook events
- **Observability**: All Lambda functions log to CloudWatch with 7-day retention
- **Tracing**: X-Ray traces visible for all requests
- **Resource Naming**: All resources include environmentSuffix
- **Destroyability**: Stack can be destroyed completely without manual cleanup
- **Code Quality**: Python code, well-structured, documented

## What to deliver

- Complete Pulumi Python implementation in lib/tap_stack.py
- Lambda function code in lib/lambda/ directory (2 functions: ingestion + processing)
- API Gateway REST API with request validator
- DynamoDB table for webhook metadata
- S3 bucket with lifecycle policy
- SQS FIFO queue with DLQ configuration
- EventBridge custom bus with routing rules
- IAM roles and policies for Lambda functions
- CloudWatch Log Groups with 7-day retention
- X-Ray tracing configuration
- Stack outputs:
  - API Gateway endpoint URL
  - DynamoDB table name
  - S3 bucket name
  - SQS FIFO queue URL
  - EventBridge bus ARN
- Unit tests for Lambda functions
- Integration tests for the full pipeline
- Documentation for deployment and testing

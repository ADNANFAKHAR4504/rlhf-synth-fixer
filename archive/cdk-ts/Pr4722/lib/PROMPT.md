We need to build the backend for **"MarketGrid,"** our new multi-vendor e-commerce marketplace, using the AWS CDK and TypeScript. The system must process real-time payment notifications from providers like Stripe and PayPal for thousands of independent sellers. It needs to handle massive, spiky traffic loads during sales events like Black Friday, processing over 10,000 webhooks per minute with sub-second latency. The entire infrastructure will be serverless and deployed in the `us-east-1` region.

---

### The End-to-End Payment Flow

1.  A customer buys a product. Stripe sends a `payment_intent.succeeded` webhook to our platform.
2.  Our system securely ingests the webhook, validates it's from Stripe, and queues it for processing.
3.  A backend function processes the payment, updates the transaction status in a database, and archives the original webhook for auditing.
4.  The system then needs to notify the correct vendor that their product has been sold.

---

### The Infrastructure We Need to Build

#### 1. Secure Webhook Ingestion

- The entry point will be an **API Gateway REST API** using a custom domain. This is our security frontline.
- It must be protected by **AWS WAF** to block common attacks.
- Every incoming request must be authenticated by a **Lambda Authorizer** that validates a unique API key for each payment provider (Stripe, PayPal, etc.).
- For ultimate resilience, the API Gateway's job isn't to process the webhook, but to drop it into an **SQS FIFO queue**. This decouples ingestion from processing and creates a durable buffer to absorb traffic spikes.

#### 2. Asynchronous Processing

- A **processing Lambda** will be triggered by messages on the SQS queue. This function is our core business logic engine.
- It must use the **Node.js 18.x runtime with 3GB of memory**. To handle variable loads, configure it with a baseline of **Provisioned Concurrency** and use Application Auto Scaling to add more concurrent instances based on the SQS queue depth.
- The Lambda will parse the webhook and write the structured transaction data to a DynamoDB table. If the function fails, the message must be sent to a separate SQS queue acting as a **dead-letter queue (DLQ)**.

#### 3. Data Storage and Archival

- The primary data store is a **DynamoDB table**. It must be configured for **on-demand billing** and have **point-in-time recovery (PITR)** enabled. It will need a Global Secondary Index (GSI) to allow our support team to query transactions by `vendorId`.
- After a transaction is successfully recorded in DynamoDB, we need to archive the original webhook payload. Instead of having the main Lambda do this, let's use a modern, decoupled pattern:
  - Enable a **DynamoDB Stream** on the table.
  - Create an **Amazon EventBridge Pipe** that is triggered by new records in the stream. This pipe's target will be a small, separate Lambda function whose only job is to write the original payload to an S3 bucket for long-term archival.
- The S3 bucket must be encrypted with a customer-managed KMS key.

#### 4. Vendor Notification Service

- To notify vendors of a sale, we'll use a real-time, push-based system. The EventBridge Pipe from the previous step will have a second target: an **Amazon SNS topic**.
- Different vendors can subscribe to this topic (e.g., via email or an HTTPS endpoint) to receive immediate notifications about their sales.

#### 5. Configuration and Observability

- All application configuration, like the DynamoDB table name, should be stored in **AWS Systems Manager Parameter Store** and passed to the Lambda functions as environment variables.
- **AWS X-Ray** must be enabled for the API Gateway and all Lambda functions for end-to-end distributed tracing.
- Your CDK code should also create a **CloudWatch Dashboard** that tracks key business metrics like `SuccessfulTransactions` and operational metrics like API Gateway latency and SQS queue depth.
- All CloudWatch Logs must have a 30-day retention period and be encrypted.

---

### Expected Code

Implement using AWS CDK TypeScript with separate modular stack file webhook.ts in lib/ for all components, instantiated in lib/tap-stack.ts.

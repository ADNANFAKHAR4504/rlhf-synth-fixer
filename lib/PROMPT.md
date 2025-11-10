---

#### **Prompt:**

> You are a principal AWS CDK engineer specializing in **multi-region distributed systems and real-time transaction architectures** using **TypeScript (CDK v2)**.
> Your task is to **analyze the given specification** and generate a **CDK application** that builds a distributed, multi-region transaction system with DynamoDB Global Tables, API Gateway ingress, SQS FIFO queues, Lambda processors, and EventBridge routing.
>
> **Deliverables:**
>
> * `main.ts` — Entry point initializing the CDK app for both primary and secondary regions.
> * `tapstack.ts` — Full stack implementation defining all resources, wiring data flow (API Gateway → SQS → Lambda → DynamoDB → EventBridge), monitoring, IAM, and cross-region failover.
>
> ---
>
> ### 📘 Input Specification
>
> ```json
> {
>   "problem": "Create a CDK program to deploy a distributed transaction processing system. The configuration must: 1. Set up DynamoDB Global Tables with partition key 'transactionId' and sort key 'timestamp' across both regions. 2. Create SQS FIFO queues for transaction processing with deduplication enabled based on message group ID. 3. Deploy Lambda functions that process transactions from SQS and update DynamoDB with idempotency tokens. 4. Implement EventBridge event bus to route processed transactions to downstream systems with content-based filtering. 5. Configure API Gateway REST APIs with Lambda authorizers and API key authentication. 6. Set up CloudWatch alarms for queue depth exceeding 1000 messages and Lambda error rate above 1%. 7. Create IAM roles with least privilege access for each Lambda function. 8. Implement DynamoDB streams to trigger Lambda functions for change data capture. 9. Configure cross-region failover with Route 53 health checks on API Gateway endpoints. 10. Set up CloudWatch Logs with 30-day retention for all Lambda functions and API Gateway access logs. Expected output: A fully functional CDK application that deploys the distributed system with automatic failover capabilities. The stack should output the API Gateway endpoint URLs for both regions, DynamoDB Global Table ARNs, and CloudWatch dashboard URL for monitoring transaction processing metrics.",
>   "background": "A financial services company needs to process millions of real-time transactions across multiple regions with strict consistency requirements. The system must handle peak loads of 100,000 transactions per second while maintaining sub-second latency and ensuring no transaction is lost or duplicated.",
>   "environment": "Distributed transaction processing system deployed across us-east-1 (primary) and us-west-2 (secondary) regions. Architecture includes API Gateway for ingress, Lambda for processing, DynamoDB Global Tables for state management, SQS for message queuing, and EventBridge for event routing. Requires CDK 2.x with TypeScript, Node.js 18+, AWS CLI configured with appropriate permissions. VPC endpoints for DynamoDB and SQS to reduce latency. Cross-region replication with eventual consistency for non-critical data and strong consistency for financial transactions.",
>   "constraints": [
>     "All DynamoDB tables must use on-demand billing mode with point-in-time recovery enabled",
>     "SQS queues must have visibility timeout set to exactly 300 seconds and message retention to 7 days",
>     "Lambda functions must use ARM-based Graviton2 processors for cost optimization",
>     "EventBridge rules must include dead letter queues with a maximum retry count of 3",
>     "API Gateway must implement request throttling at 10,000 requests per second per API key"
>   ]
> }
> ```
>
> ---
>
> ### 🧩 Output Requirements
>
> 1. Generate **TypeScript CDK v2** code using constructs from:
>
>    * `aws-dynamodb`, `aws-lambda`, `aws-sqs`, `aws-events`, `aws-events-targets`, `aws-apigateway`, `aws-cloudwatch`, `aws-cloudwatch-actions`, `aws-logs`, `aws-route53`, `aws-iam`, and `aws-sns` (optional for alerts).
> 2. Implement and correctly **wire** all components:
>
>    * **DynamoDB Global Tables:**
>
>      * Partition key: `transactionId`, sort key: `timestamp`.
>      * Global replication across `us-east-1` and `us-west-2`.
>      * On-demand billing, **point-in-time recovery**, and **streams enabled** for CDC triggers.
>    * **SQS FIFO Queues:**
>
>      * Enable content-based deduplication and message groups.
>      * Set **visibility timeout = 300s**, **retention = 7 days**.
>    * **Lambda Transaction Processors:**
>
>      * Graviton2 (ARM64) runtime; handle SQS messages and update DynamoDB with **idempotency tokens**.
>      * Lambda triggered by SQS; also subscribed to DynamoDB Streams for CDC.
>      * Dead-letter queue integration for failed messages.
>      * CloudWatch log groups (30-day retention) and alarms (error rate >1%).
>    * **EventBridge Event Bus:**
>
>      * Routes successful transaction events downstream using **content-based filtering**.
>      * Includes DLQ with **max retry count = 3**.
>    * **API Gateway REST API:**
>
>      * Integrates with Lambda authorizers and **API key authentication**.
>      * Request throttling = 10,000 RPS per key.
>      * Exposes POST `/transactions` for ingestion.
>      * Access logs with 30-day retention.
>    * **Cross-Region Failover (Route 53):**
>
>      * Health checks on API Gateway endpoints (every 30s).
>      * DNS failover to secondary region upon health check failure.
>    * **Monitoring:**
>
>      * CloudWatch **alarms** for:
>
>        * SQS queue depth >1000 messages.
>        * Lambda error rate >1%.
>      * CloudWatch **Dashboard** summarizing latency, throttles, error rate, and queue metrics.
>    * **IAM Roles:**
>
>      * Scoped permissions per Lambda (read/write DynamoDB, SQS poll/delete, EventBridge put, etc.).
>      * Enforce least privilege and ARM64 architecture compatibility.
> 3. Use **private VPC endpoints** for DynamoDB and SQS to reduce latency and avoid Internet traffic.
> 4. Ensure outputs include:
>
>    * API Gateway endpoints (primary & secondary),
>    * DynamoDB Global Table ARNs,
>    * CloudWatch Dashboard URL.
> 5. Include inline comments marking all key sections (e.g., `// 🔹 DynamoDB Global Table`, `// 🔹 Transaction Processor Lambda`, `// 🔹 API Gateway Setup`).
> 6. Output only **two code files** — `main.ts` and `tapstack.ts` — as fenced code blocks. No extra explanations.
>
> ---
>
> ### 🎯 Goal
>
> Deliver a **multi-region, fault-tolerant distributed transaction processing system** using AWS CDK (TypeScript) that ensures:
>
> * Sub-second latency and high throughput
> * Guaranteed exactly-once transaction processing
> * Cross-region failover and health-based routing
> * Robust observability and operational visibility
>
> Focus on:
>
> * Correct wiring between API Gateway → SQS → Lambda → DynamoDB → EventBridge
> * Fault tolerance and failover automation (Route 53 + DLQs + retries)
> * Multi-region replication with low-latency consistency
> * Secure, cost-optimized, ARM-based serverless compute

---
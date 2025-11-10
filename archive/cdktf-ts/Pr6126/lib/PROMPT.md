---

## Serverless Webhook Processor (CDKTF – TypeScript)

### Serverless Webhook Handling System

A fintech startup needs a **serverless webhook processing system** that can ingest, process, and retrieve transaction status in real time. We’ll build this using **CDK for Terraform (CDKTF)** in **TypeScript**.

---

## What We Need

Implement the full infrastructure in `main.ts` to deploy a **complete webhook pipeline**.

### **Core Components**

1. **Lambda Functions (Node.js 18)**

   * `ingestion` → receives webhooks via API Gateway
   * `processing` → processes queued webhook messages
   * `status` → retrieves transaction status
   * All functions run on **ARM64 (Graviton2)** and use **structured logging with correlation IDs**.

2. **API Gateway REST API**

   * Endpoints:

     * `POST /webhook/{provider}`
     * `GET /status/{transactionId}`
   * Include **request validation**, **throttling (1000 req/s)**, and **AWS_IAM authorization** for internal endpoints.

3. **DynamoDB Table**

   * Partition key: `transactionId`, Sort key: `timestamp`
   * On-demand billing
   * **Point-in-time recovery** and **encryption at rest** enabled.

4. **S3 Bucket for Raw Payloads**

   * Store raw webhook payloads.
   * Enable **versioning** and **30-day lifecycle archiving**.
   * Apply **server-side encryption** with AWS-managed keys.

5. **SQS Queue**

   * Decouples ingestion from processing.
   * Visibility timeout: **5 minutes**
   * **Dead Letter Queue (DLQ)** with **3 retries max**.

6. **Monitoring**

   * Create **CloudWatch Log Groups** for all functions (7-day retention).
   * Add **alarms** for Lambda errors and SQS backlog growth.

7. **IAM Roles**

   * Apply **least privilege** for all functions (access only DynamoDB, S3, or SQS as required).

8. **Concurrency Controls**

   * Ingestion Lambda → reserved concurrency: 50
   * Processing Lambda → reserved concurrency: 100

---

## Technical Requirements

* CDKTF 0.19+ with TypeScript
* Node.js 18 runtime
* All Lambdas use ARM64 architecture
* No VPC required — all services are managed
* Cost-efficient, production-ready design with error handling and retries

---

## Current Stack Structure

The entry point `main.ts` already defines a base `WebhookStack`.
Add all resources inside this stack, ensuring logical grouping by service type (Lambda, API, Storage, Queue, Monitoring).

Connections should be correctly wired:

* API Gateway → Ingestion Lambda
* Ingestion → SQS
* Processing → DynamoDB + S3
* Status Lambda → DynamoDB

Keep IAM permissions minimal.
The implementation should remain **lightweight, reliable, and production-grade**, without adding Route53 or ACM dependencies.

---
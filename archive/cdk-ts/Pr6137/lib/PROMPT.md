---

## Serverless Transaction Processing Pipeline (AWS CDK – TypeScript)

### Risk Analysis and Notification System

A financial services company needs a **serverless transaction processing pipeline** for risk analysis and automated notifications. We'll build this using **AWS CDK** in **TypeScript** to handle variable loads during market hours while maintaining strict security and compliance requirements.

---

## What We Need

Implement the full infrastructure in `lib/tap-stack.ts` to deploy a **comprehensive transaction processing system**.

### **Core Components**

1. **S3 Transaction Ingestion**

   * Bucket with versioning and 90-day Glacier transition lifecycle
   * Event-triggered Lambda for file validation and metadata extraction
   * Server-side encryption with AWS-managed keys
   * Access logging and compliance auditing

2. **DynamoDB Metadata Store**

   * Partition key: `transactionId`, Sort key: `timestamp`
   * On-demand billing mode for unpredictable traffic
   * Point-in-time recovery and encryption at rest
   * Global secondary indexes for query optimization

3. **Step Functions Risk Analysis Workflow**

   * State machine orchestrating multi-stage risk assessment
   * Parallel processing of risk calculation and compliance checks
   * Retry logic with exponential backoff for external API calls
   * Error handling and compensation activities

4. **Lambda Risk Processing Functions**

   * Risk calculator with reserved concurrency (50)
   * Compliance checker with reserved concurrency (30)
   * Notification dispatcher for high-risk alerts
   * All functions use ARM64 architecture and structured logging

5. **API Gateway Transaction Status**

   * REST API with usage plans and API key authentication
   * Query endpoints for transaction status and history
   * Request validation and rate limiting
   * Integration with existing partner systems

6. **SNS Alert System**

   * High-risk transaction alert topics
   * Email subscriptions for compliance teams
   * Webhook integrations with monitoring systems
   * Message filtering based on risk severity

7. **Systems Manager Parameter Store**

   * Secure storage for API keys and sensitive configuration
   * Encrypted parameters with IAM access controls
   * Versioning for configuration change management
   * Integration with Lambda environment variables

---

## Technical Requirements

* AWS CDK v2.x with TypeScript and Node.js 18+
* ARM64 (Graviton2) architecture for all Lambda functions
* 3GB memory allocation for Lambda functions
* On-demand DynamoDB billing with pay-per-request model
* Systems Manager Parameter Store for sensitive configuration

---

## Current Stack Structure

The entry point `bin/tap.ts` already defines a base CDK app. Add all transaction processing resources inside the main stack in `lib/tap-stack.ts`, ensuring logical grouping by processing stage (Ingestion, Analysis, Storage, Notification).

Connections should be correctly wired:

* S3 → Lambda Validator → Step Functions → Risk Analysis Lambdas
* Step Functions → DynamoDB storage + SNS notifications
* API Gateway → DynamoDB queries for transaction status
* Systems Manager → Lambda environment configuration

Keep IAM permissions minimal with least-privilege access for each processing stage. The implementation should remain **scalable and resilient**, with proper error handling, monitoring, and cost optimization for variable transaction volumes.

---
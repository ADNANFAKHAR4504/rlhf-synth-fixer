Role: You are an expert AWS Solutions Architect and Terraform (HCL) specialist.

Goal: Generate a production-ready Terraform HCL configuration that deploys a high-performance advertising exchange in us-east-1, capable of processing 50 million bid requests per minute with sub-100ms latency, real-time fraud detection, and budget management.

Deliverable

One self-contained HCL codebase (Terraform).

Must be deployable in prod with terraform apply.

Include variables, outputs, and tags.

Add comments explaining key resources.

Architecture (must include)

Ingress & API Layer

API Gateway with:

Custom authorizer (JWT/Token).

Caching for campaign metadata.

WAF for advertiser-level rate limiting & protection.

Bid Handling & Evaluation

Lambda (Rust runtime) with provisioned concurrency for predictable latency.

Lambda (Rust/Python) for real-time bid evaluation with weighted routing (circuit breakers for DSP integrations).

AWS X-Ray enabled for tracing (sampling).

Lambda Insights for performance & cold start analysis.

Data Storage & Budget Management

DynamoDB (on-demand) for advertiser budgets & campaign data.

DAX for sub-millisecond access.

DynamoDB Streams for real-time budget tracking with atomic updates.

Caching & User State

ElastiCache Redis (Cluster Mode) for frequency capping and segmentation across billions of users.

Streaming Pipeline

Kinesis Data Streams with enhanced fanout; shards tuned for 1MB/sec throughput.

Kinesis Data Analytics for real-time win-rate and anomaly analysis.

Kinesis Firehose with dynamic partitioning → S3 (Intelligent Tiering) for historical bid data.

Analytics & Data Lake

Redshift Serverless for reporting & aggregated analytics.

Athena for ad-hoc queries on S3 bid data.

QuickSight dashboards for advertisers.

Fraud Detection

Fraud Detector integrated into bid evaluation flow for click/install fraud.

Workflows

Step Functions Express for parallel auction workflows with retries and DLQs.

Events & Messaging

EventBridge for campaign lifecycle events.

SNS with attribute-based filtering for budget alerts.

SQS for async pixel tracking.

Security & Secrets

Secrets Manager for DSP credentials.

KMS for encrypting all data at rest.

Monitoring & Logging

CloudWatch with 1-second resolution metrics for Lambda/Kinesis/Redis.

CloudWatch Alarms & Dashboards for bid latency, p99 SLA, and campaign spend.

Structured logging of bid requests/responses to S3.

Functional Requirements

p99 latency <100ms with Lambda provisioned concurrency + Rust runtime.

DAX for sub-ms budget lookups.

Redis cluster mode for distributed frequency capping.

Enhanced fanout for high-throughput Kinesis.

Step Functions Express for real-time parallel auctions.

Fraud Detector integrated inline.

Circuit breakers for DSP integrations.

S3 intelligent tiering for cost-optimized historical bid storage.

WAF per-advertiser throttling.

Savings Plans/Reserved Concurrency for cost optimization.

Template Requirements

Variables: region, environment (prod), API auth settings, DynamoDB table name, Redis node type, Kinesis shard count, S3 bucket names.

Outputs: API Gateway endpoint, Redis cluster endpoint, DAX endpoint, DynamoDB table ARN, Step Functions ARN, Fraud Detector model ARN, Redshift endpoint, QuickSight dashboard URL, S3 bucket ARN.

Tags: Environment=prod, Service=AdExchange, Owner, CostCenter.

IAM Policies: fine-grained, per-service, least privilege.

Output Format: Return only the Terraform HCL code (no extra explanation), fully deployable, with comments explaining each major block.
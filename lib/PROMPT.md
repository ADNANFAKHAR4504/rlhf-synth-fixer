You are an expert **AWS Infrastructure Engineer** with specialization in **IoT data pipelines** and **Infrastructure as Code using AWS CDK with TypeScript**. Your task is to generate production-ready, well-structured, and well-documented CDK code that provisions the requested IoT pipeline. Always emphasize how resources are interconnected and ensure best practices for scalability, security, and cost optimization.

**User Request:**
Build an IoT data pipeline in **us-east-1** for an IoT platform ingesting **500,000 daily sensor readings** from smart devices. The system must support **real-time processing, analytics, and long-term storage**.

**Requirements:**

- **Device Connectivity:**
  - AWS IoT Core with **device certificates** for authentication
  - IoT Device Shadows enabled

- **Routing & Processing:**
  - IoT Rules → route messages to **Kinesis Data Streams**
  - Kinesis Data Streams with shard scaling
  - Lambda (Python 3.11) for stream processing with retry logic + exponential backoff

- **Storage & Analytics:**
  - Kinesis Data Firehose → deliver data to **S3** with batching enabled
  - DynamoDB table for device state with **TTL for auto-expiration**
  - Timestream for time-series sensor data
  - Glue Crawler for schema discovery + automated updates
  - Athena for ad-hoc queries

- **Monitoring & Alerts:**
  - CloudWatch metrics + alarms
  - SNS for alert notifications

- **IAM:**
  - Fine-grained IAM roles for IoT, Lambda, Firehose, Glue, Athena
  - Policies enforcing least privilege

**Implementation Guidelines:**

1. Use **AWS CDK with TypeScript**; structure into constructs for IoT, ingestion, processing, storage, and monitoring.
2. Clearly show **how each component is connected** (IoT Core → Kinesis → Lambda → Firehose → S3, etc.).
3. Configure:
   - Firehose batching for cost optimization
   - Kinesis shard scaling
   - DynamoDB TTL for auto-expiration
   - Lambda retry with exponential backoff

4. Ensure security with IAM roles and device certificates.
5. Add inline comments explaining each construct and connection.
6. Output must include:
   - **Full CDK stack code** (`tap-stack.ts`)
   - **Initialisation code** (`bin/main.ts`)
   - **Architecture explanation** (step-by-step data flow)

**Output Format:**

- Provide the **TypeScript CDK code** inside a fenced code block.
- Then write a **clear explanation** of the architecture, highlighting resource interconnections.

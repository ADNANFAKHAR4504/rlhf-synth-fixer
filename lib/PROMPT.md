---

#### Prompt:

> You are a senior AWS CDK engineer specializing in **big-data pipelines on EMR Serverless** with **Step Functions orchestration** using **TypeScript (CDK v2)**.
> Analyze the input and produce a **complete CDK application** that builds an automated fraud analysis pipeline with private networking, least-privilege IAM, and clear inter-resource wiring.
>
> **Deliverables**
>
> * `main.ts` — CDK app entrypoint and stack initialization.
> * `tapstack.ts` — Full stack: EMR Serverless app, Step Functions state machine, Lambda validator/trigger, S3 buckets, DynamoDB table, EventBridge rule, SNS topic, CloudWatch dashboard, VPC endpoints, and tagging — all connected.
>
> ---
>
> ### 📘 Input Specification
>
> ```json
> {
>   "problem": "Create a CDK program to deploy a big data processing pipeline for transaction fraud analysis. The configuration must: 1. Create an EMR Serverless application with Spark 3.3.0 runtime and maximum capacity of 100 vCPUs and 300 GB memory. 2. Set up three S3 buckets: raw-transactions, processed-data, and fraud-reports with lifecycle policies to transition objects older than 30 days to Glacier. 3. Deploy a Lambda function that validates incoming transaction files and triggers the EMR job. 4. Configure a Step Functions state machine that orchestrates: file validation, EMR job submission, result verification, and notification sending. 5. Create a DynamoDB table named 'fraud-analysis-jobs' to track job execution history with attributes: job_id (partition key), timestamp (sort key), status, and input_file. 6. Implement an EventBridge rule that triggers the Step Functions workflow when new files arrive in the raw-transactions bucket. 7. Set up SNS topic for job completion notifications with email subscription. 8. Configure CloudWatch dashboard showing EMR job metrics, Lambda invocations, and Step Functions execution status. 9. Create VPC endpoints for S3 and DynamoDB to allow private connectivity. 10. Apply resource tags: Environment=Production, Project=FraudDetection, ManagedBy=CDK. Expected output: A fully deployed big data pipeline that automatically processes transaction files uploaded to S3, runs distributed Spark analysis on EMR Serverless, stores results in processed-data bucket, tracks job history in DynamoDB, and sends notifications upon completion.",
>   "background": "A fintech company processes millions of daily transactions and needs to build a data pipeline for fraud detection analytics. They want to use EMR Serverless to run Spark jobs that analyze transaction patterns and generate risk scores stored in S3.",
>   "environment": "Data processing infrastructure deployed in us-east-1 using EMR Serverless for Spark jobs, Step Functions for orchestration, Lambda for data validation, S3 for data lake storage, and DynamoDB for job metadata tracking. Requires CDK 2.x with TypeScript, Node.js 18+, AWS CLI configured. VPC with private subnets across 2 AZs, no NAT Gateway, VPC endpoints for S3 and DynamoDB access. EMR Serverless applications run in isolated network configuration.",
>   "constraints": [
>     "EMR Serverless application must use Spark 3.3.0 runtime",
>     "All S3 buckets must have server-side encryption with AWS managed keys",
>     "EMR jobs must run in a dedicated VPC with no internet access",
>     "Use Step Functions to orchestrate the pipeline with error handling",
>     "Lambda functions must have execution roles with least privilege",
>     "CloudWatch Logs retention must be set to 7 days for all services",
>     "DynamoDB table must use on-demand billing mode"
>   ]
> }
> ```
>
> ---
>
> ### 🧩 Output Requirements
>
> 1. Produce **TypeScript CDK v2** using: `aws-emrserverless`, `aws-stepfunctions`, `aws-stepfunctions-tasks`, `aws-lambda`, `aws-s3`, `aws-s3-notifications`, `aws-dynamodb`, `aws-events`, `aws-events-targets`, `aws-sns`, `aws-sns-subscriptions`, `aws-cloudwatch`, `aws-logs`, `aws-ec2`, `aws-iam`.
> 2. Implement and **wire** these components end-to-end:
>
>    * **EMR Serverless (Spark 3.3.0):** app with max 100 vCPUs / 300 GB memory; VPC config in private subnets, no Internet; security groups locked down.
>    * **S3 Buckets:** `raw-transactions`, `processed-data`, `fraud-reports`; versioning on; lifecycle → Glacier at 30 days; SSE-S3 encryption.
>    * **Lambda Validator/Trigger:** ARM64 runtime; validates file schema, writes job record to DynamoDB, starts EMR job via Step Functions task. Least-privilege IAM only.
>    * **Step Functions State Machine:** tasks for validate → submit EMR job → poll status → verify outputs in S3 → publish SNS; error handling with retries and catch → DLQ (optional via SNS/SQS).
>    * **DynamoDB (`fraud-analysis-jobs`):** PK `job_id`, SK `timestamp`, attrs `status`, `input_file`; on-demand billing; PITR on; used for job history and idempotency.
>    * **EventBridge Rule:** triggers state machine when new objects land in `raw-transactions` (use S3 → EventBridge integration or S3 notification → Lambda → StartExecution).
>    * **SNS Notifications:** topic for job completion; email subscription placeholder.
>    * **CloudWatch Dashboard:** widgets for EMR job metrics, Lambda invokes/errors/duration, Step Functions executions/success/fail.
>    * **VPC Endpoints:** Gateway endpoint for S3; Interface endpoint for DynamoDB; private subnets across 2 AZs; no NAT.
> 3. Apply tags globally: `Environment=Production`, `Project=FraudDetection`, `ManagedBy=CDK`.
> 4. Enforce **7-day log retention** for Lambda, Step Functions, and EMR logs; least-privilege IAM everywhere.
> 5. Add clear inline comments per section (e.g., `// 🔹 EMR Serverless`, `// 🔹 Step Functions Orchestration`, `// 🔹 EventBridge Trigger`).
> 6. Output **only two files** in fenced blocks: **`main.ts`** and **`tapstack.ts`** — no extra prose.
>
> ---
>
> ### 🎯 Goal
>
> Deliver a **production-ready, private EMR Serverless fraud pipeline** that:
>
> * Processes S3-ingested transaction files end-to-end
> * Orchestrates via Step Functions with retries and error handling
> * Tracks job history in DynamoDB
> * Emits completion notifications via SNS
> * Runs fully in private subnets with S3/DynamoDB VPC endpoints

---
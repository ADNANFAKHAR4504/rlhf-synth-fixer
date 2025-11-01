---

#### **Prompt:**

> You are a principal AWS CDK engineer specializing in **serverless performance tuning and cost optimization** using **TypeScript (CDK v2)**.
> Analyze the input specification and produce a **complete CDK application** that refactors an existing serverless transaction system to reduce cost and improve P99 latency — **without changing public APIs or breaking compatibility**.
>
> **Deliverables:**
>
> * `main.ts` — CDK app entrypoint and stack initialization.
> * `tapstack.ts` — Full optimization stack (Lambda, DynamoDB, SQS, S3 lifecycle, alarms, tagging, dashboards, rollback scaffolding) wired together with least-privilege IAM and safe rollout guards.
>
> ---
>
> ### 📘 Input Specification
>
> ```json
> {
>   "problem": "Create a CDK program to optimize an existing serverless transaction processing system that currently suffers from over-provisioned resources and inefficient data access patterns. The configuration must: 1. Refactor Lambda functions to use ARM-based Graviton2 processors and implement proper memory sizing based on CloudWatch metrics showing 40% memory underutilization. 2. Convert DynamoDB tables from on-demand to provisioned capacity with auto-scaling between 5-500 RCU/WCU based on historical usage patterns. 3. Implement DynamoDB Global Secondary Indexes to eliminate expensive scan operations currently causing 80% of read costs. 4. Add S3 lifecycle policies to transition transaction logs older than 30 days to Glacier and delete after 7 years for compliance. 5. Replace individual Lambda invocations with SQS batch processing for non-real-time transactions to reduce invocation costs by 70%. 6. Implement Lambda reserved concurrency limits to prevent throttling and cost spikes during traffic bursts. 7. Add CloudWatch Alarms for Lambda duration, DynamoDB throttles, and monthly cost thresholds. 8. Configure Lambda functions with appropriate timeout values based on P99 execution times from logs. 9. Implement dead letter queues for failed transactions with exponential backoff retry logic. 10. Set up cost allocation tags for all resources to track expenses by department and environment. Expected output: A fully optimized CDK application that reduces monthly costs by at least 60% while improving P99 latency from 5s to under 1s, with comprehensive monitoring and cost tracking in place.",
>   "background": "A financial services company has an existing CDK application that processes transaction data but is experiencing high costs and performance bottlenecks. The current implementation uses inefficient resource allocation and lacks proper monitoring, resulting in $50,000+ monthly AWS bills and frequent timeouts during peak hours.",
>   "environment": "Production environment spanning us-east-1 and us-west-2 regions for disaster recovery. Existing infrastructure includes API Gateway REST APIs, Lambda functions processing 10M+ daily transactions, DynamoDB tables with 500GB+ data, and S3 buckets storing transaction logs. Requires AWS CDK 2.x with TypeScript, Node.js 18+, and AWS CLI configured with appropriate permissions. VPC endpoints for DynamoDB and S3 to reduce data transfer costs. CloudWatch Logs retention set to 30 days.",
>   "constraints": [
>     "Must maintain 99.9% uptime SLA during optimization deployment",
>     "Cannot modify existing API Gateway endpoints or break backward compatibility",
>     "DynamoDB migration must be performed without downtime using point-in-time recovery",
>     "Lambda function code changes must preserve existing business logic and error handling",
>     "Cost optimization must not impact transaction processing latency for real-time operations",
>     "All changes must be reversible with infrastructure rollback capabilities",
>     "Monitoring must capture performance metrics before and after optimization for comparison",
>     "Resource naming must follow existing company standards: {environment}-{service}-{component}",
>     "Implementation must use CDK best practices including proper L2/L3 constructs and avoid L1 constructs where possible"
>   ]
> }
> ```
>
> ---
>
> ### 🧩 Output Requirements
>
> 1. Produce **TypeScript CDK v2** using modules such as `aws-lambda`, `aws-dynamodb`, `aws-sqs`, `aws-s3`, `aws-cloudwatch`, `aws-cloudwatch-actions`, `aws-logs`, `aws-iam`, `aws-events`, `aws-events-targets`, and `aws-budgets` (for cost alarms if needed).
> 2. Implement and **connect** the following:
>
>    * **Lambda Optimizations**
>
>      * Migrate to **arm64** architecture; set memory sizes from metrics (target reducing 40% underutilization).
>      * Configure **reserved concurrency** and **timeouts** from P99 logs; preserve handlers & business logic.
>      * Add **DLQs** (SQS) with retry policies and exponential backoff; wire CloudWatch alarms on errors/duration.
>      * Ensure **VPC endpoints** (DynamoDB/S3) for all data access.
>    * **DynamoDB Tuning**
>
>      * Convert tables to **Provisioned** with autoscaling **5–500 RCU/WCU** using historical utilization.
>      * Add **GSIs** to replace scans; update IAM to least-privilege per table/index.
>      * Enable **PITR** and define **zero-downtime migration** strategy (e.g., dual-write, traffic shift, or table import).
>    * **SQS Batch Processing**
>
>      * Introduce queue(s) for non-real-time transactions; enable batch size & visibility timeout aligned to Lambda runtime.
>      * Route from producers (unchanged APIs) to SQS for async workloads; keep real-time path untouched.
>    * **S3 Lifecycle Policies**
>
>      * Transition logs **>30 days → Glacier**, **delete after 7 years**; versioning + encryption enabled.
>    * **Monitoring & Cost Controls**
>
>      * CloudWatch **Alarms** for Lambda duration/errors, DynamoDB throttles, and **monthly cost** threshold (via Budgets or billing metrics).
>      * **Dashboards** summarizing P50/P90/P99 latency, error rates, throttle counts, and cost KPIs.
>      * Pre/post-optimization **metric filters** for comparison.
>    * **Tagging & Naming**
>
>      * Global **cost allocation tags** (`Environment`, `Service`, `Component`, `Owner`, `CostCenter`, `SourceCommit`, `DeployedAt`).
>      * Enforce naming `{environment}-{service}-{component}`.
>    * **Rollbacks & Safety**
>
>      * Artifact/version retention for rollback; deploy-safe changes with **gradual traffic shifting** where applicable.
>      * Multi-region (us-east-1 primary, us-west-2 DR) parity for critical assets.
> 3. Use **least-privilege IAM** with explicit grants (e.g., DynamoDB table/index actions, SQS send/receive/delete, CloudWatch putMetricData).
> 4. Keep constructs modular; add clear comments like `// 🔹 Lambda Optimization`, `// 🔹 DynamoDB Autoscaling`, `// 🔹 SQS Batching`, etc.
> 5. Output **only two code files** in fenced blocks: **`main.ts`** and **`tapstack.ts`** — no extra prose.
>
> ---
>
> ### 🎯 Goal
>
> Deliver a **production-safe optimization** that reduces monthly costs by **≥60%** and improves **P99 latency from 5s → <1s**, with complete monitoring, rollback, and DR alignment — **without breaking existing APIs or uptime SLOs**.
> Focus on:
>
> * Correct, efficient inter-service wiring (Lambda ⇄ DynamoDB/SQS/S3)
> * Autoscaling & right-sizing grounded in metrics
> * Observability and cost governance
> * Safe, reversible rollout patterns

---
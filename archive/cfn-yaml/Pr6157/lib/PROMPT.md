# Objective

Design a **single CloudFormation YAML** file named **`TapStack.yml`** that provisions a brand-new, serverless transaction processing system in **`us-east-1`**, compliant with the requirements below. The template must be fully self-contained (no references to pre-existing resources) and deployable with AWS CLI permissions. All resource names must include **`${EnvironmentSuffix}`** to prevent cross-environment collisions.

# Functional scope (build everything new):

* Create **all** infrastructure for ingesting merchant CSV files, parsing and validating transactions, persisting records, detecting suspicious activity, alerting compliance, exposing simple query endpoints, and monitoring with alarms and tracing—**within a single CloudFormation stack**.
* No VPC configuration; all services are AWS-managed and public where applicable.

# Core services (mandatory focus — 2):

1. **Amazon S3 + AWS Lambda (ingestion & processing)**
2. **Amazon DynamoDB (transaction storage with Streams)**

# Mandatory requirements (implement these 5 in full):

1. **S3 ➜ Lambda CSV ingestion**

   * S3 bucket with **versioning enabled** and lifecycle rule to transition/delete **after 90 days**.
   * Trigger only on `s3:ObjectCreated:*` events for keys with prefix **`uploads/`** and suffix `.csv`.
   * Lambda (Python 3.11, 512 MB, **reserved concurrency = 10**) parses CSV lines and validates records.

2. **DynamoDB table (on-demand, PITR)**

   * Table **`Transactions`** with **PK: `transactionId` (String)** and **SK: `timestamp` (Number or String)**.
   * **Point-in-time recovery enabled**.
   * Write items from ingestion Lambda.

3. **DynamoDB Streams ➜ Lambda fraud detection**

   * Streams on the table enabled (NEW_IMAGE).
   * Second Lambda detects **amount > 10,000** and publishes alerts.

4. **SQS Dead-Letter Queue (DLQ)**

   * Dedicated DLQ with **maxReceiveCount = 3**.
   * Ingestion Lambda and fraud Lambda both configured to route failures to the DLQ.

5. **Least-privilege IAM**

   * **Separate** execution roles for each Lambda with **minimum permissions only** (S3 read, DynamoDB put/query, Streams read, SQS send, CloudWatch logs, X-Ray).
   * Explicit resource ARNs; avoid `*` where not required.

# Optional enhancement (implement exactly one):

* **API Gateway REST API** with GET/POST for transaction status:

  * **Usage plan quota**: 1000 requests/day.
  * Integrates with a small Lambda (Python 3.11, 512 MB, reserved concurrency = 10).
  * Return status lookups by `transactionId`.
  * **Output the invoke URL**.

# Additional required capabilities & best practices

* **SNS Topic** for fraud alerts; subscribe **`compliance@company.com`** (email). Publish alerts from fraud Lambda.
* **CloudWatch Logs** retention of **30 days** for **all** Lambda log groups (explicit `AWS::Logs::LogGroup` resources).
* **CloudWatch Alarms** for each Lambda: **error rate > 1% over 5 minutes** (use `Errors` and `Invocations` with metric math or a single `Errors` threshold using appropriate evaluation periods—choose a defensible approach and document).
* **AWS X-Ray tracing** enabled for **all Lambdas** and **API Gateway** (if API is implemented).
* **Reserved concurrency = 10** for **every Lambda**.
* **Outputs**: S3 bucket name, DynamoDB table ARN, and (if API implemented) API base URL.
* **No VPC** attachments for Lambdas.
* **Region**: default `us-east-1`.

# Template authoring rules

* File name: **`TapStack.yml`** (YAML, not JSON).
* Use **Parameters** with sane defaults and descriptions for:

  * `EnvironmentSuffix` (e.g., `dev|staging|prod`),
  * `ProjectName` (e.g., `tapstack`),
  * `AlertEmail` (default `compliance@company.com`).
* **All resource names** must interpolate **`${EnvironmentSuffix}`** (e.g., `!Sub '${ProjectName}-ingest-bucket-${EnvironmentSuffix}'`).
* Provide **explicit dependencies** where ordering matters (e.g., stream/permission wiring, subscriptions).
* Use **least-privilege IAM policies** with scoped ARNs (S3 bucket/key prefix, DynamoDB table ARN, Streams ARN, SQS queue ARN, SNS topic ARN, CloudWatch Logs, X-Ray).
* **Inline Lambda code** with minimal but deployable Python 3.11 handlers via `Code.ZipFile` (CSV parsing, DynamoDB write, fraud detection, API handler if implemented). Keep them concise and functional.
* Configure **event source mappings** (S3 notification to ingestion Lambda; DynamoDB Streams to fraud Lambda; API ➜ Lambda integration if implemented).
* Add **DLQ** via Lambda `DeadLetterConfig` or event-source failure handling; ensure the DLQ resource policy allows receives for debugging.
* Create **usage plan, API key, and stage** for API Gateway; attach to REST API if optional enhancement is chosen.
* Enable **X-Ray**: Lambda `TracingConfig: Active` and API Gateway `TracingEnabled: true`.
* Create **CloudWatch Alarms** using either **metric math** (`Errors/Invocations > 0.01`) or a clear alternative and set **EvaluationPeriods = 1**, **Period = 300**, and a sensible **DatapointsToAlarm**; document rationale in resource `Metadata`.
* Explicit **LogGroup** for each Lambda with **RetentionInDays: 30**.
* **S3 lifecycle**: clear, documented rule for **90-day retention** of objects (noncurrent versions may follow the same).
* **Outputs**:

  * `IngestBucketName`,
  * `TransactionsTableArn`,
  * `ApiBaseUrl` (only if API is implemented).
* Validate intrinsic functions, avoid circular dependencies, and ensure event permissions (`AWS::Lambda::Permission`) are correctly wired (S3, API Gateway, DynamoDB Streams, SNS as needed).

# Deliverable

Produce **one** file named **`TapStack.yml`** that includes: `AWSTemplateFormatVersion`, `Description`, `Metadata` (brief rationale for alarms and security choices), `Parameters`, `Mappings` (only if truly needed), `Conditions` (if used), **`Resources`** (complete definitions for S3, Lambdas, DynamoDB, Streams, SQS DLQ, SNS, CloudWatch Logs & Alarms, and *optionally* API Gateway with usage plan), and **`Outputs`**.
The YAML must be **syntactically valid**, **fully declarative**, deploy **all resources from scratch**, and reflect **AWS serverless best practices** with **least-privilege IAM** and **operational readiness** (monitoring, alerts, tracing).

# Naming & interpolation standard

* Use `!Sub '${ProjectName}-${Component}-${EnvironmentSuffix}'` for all named resources (buckets, tables, functions, roles, queues, topics, log groups, API, usage plan, keys).
* Where AWS imposes naming constraints (e.g., S3 bucket names), convert to lowercase and strip invalid characters using sane concatenation within `!Sub`.

# Testing & acceptance

* Stack successfully creates and configures:

  * S3 notifications to ingestion Lambda for `uploads/*.csv`.
  * DynamoDB writes from ingestion Lambda.
  * Fraud Lambda receives Stream events and publishes to SNS.
  * DLQ is attached and receives failed messages after 3 receives.
  * CloudWatch log groups exist with 30-day retention.
  * Alarms deploy with the specified thresholds.
  * X-Ray tracing active for Lambdas (and API if present).
  * Outputs present as specified.
* No references to external/pre-existing resources; no placeholder ARNs.
* All names include `${EnvironmentSuffix}`.

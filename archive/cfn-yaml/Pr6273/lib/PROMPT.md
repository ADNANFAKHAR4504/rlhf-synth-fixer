# Functional scope (build everything new):

* **Core services (mandatory)**: API Gateway (REST), Lambda, DynamoDB.
* **Optional (exactly one)**: SQS buffering between ingestion and detection.

# Mandatory requirements to implement (7/7):

1. All Lambda functions use **ARM64** architecture, **512 MB** memory (ingestion lambda), **60-second** timeout (ingestion lambda), **X-Ray tracing enabled**, and **reserved concurrency ≥ 100** per function.
2. **API Gateway** exposes **POST** webhook endpoints, implements **request throttling at 1000 RPS** (per stage/method).
3. **DynamoDB** uses **on-demand billing** (PAY_PER_REQUEST) with **PK = transactionId (String)** and **SK = timestamp (Number or String)**.
4. **Dead-letter queues** for all asynchronous Lambda invocations with **exactly 14 days** retention.
5. **CloudWatch Logs** retention set to **30 days** for all Lambda/API logs.
6. **CloudWatch Alarms**: trigger when **Lambda error rate > 1%** (metric math on `Errors/Invocations*100`), with actionable alarm descriptions.
7. **Tagging** on every resource with `Environment`, `CostCenter`, and `Owner`.

# Non-goals (explicitly out of scope for this template):

* No VPC networking (pure managed services).
* No AWS WAF or Step Functions in this iteration (kept minimal per “focus” rule).
* No existing resources referenced; all modules are freshly created.

# Parameters (define and use in names; avoid hard AllowedValues):

* `ProjectName` (String): short slug for the project, lower-case letters/numbers/hyphens.
* `EnvironmentSuffix` (String): **must be validated by a safe regex** (no hard enumeration). Use `AllowedPattern` such as:

  * `^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$`
  * Include `ConstraintDescription` explaining allowed chars and length.
* `Owner` (String), `CostCenter` (String), `AlertEmail` (String, list-capable via comma-sep if you choose), optional `ApiThrottleRps` defaulting to **1000**.

> Every resource’s **Name**, logical identifiers (where supported), queue/table names, API stage names, and CloudWatch dashboards **must include** `${EnvironmentSuffix}` to ensure safe multi-environment coexistence.

# Resource design & best practices

* **API Gateway (REST)**

  * Single REST API with a **/webhook** `POST` method integrated to the ingestion Lambda via **Lambda proxy**.
  * Stage name includes `${EnvironmentSuffix}`.
  * Throttling set to **1000 RPS** (and appropriate burst) at stage/method level.
  * Access logs enabled (JSON) to a dedicated log group (30-day retention).
  * X-Ray tracing enabled at stage.

* **Lambda: Ingestion (Validate & Parse)**

  * ARM64, 512 MB, 60 s timeout, reserved concurrency ≥ 100, X-Ray enabled.
  * Environment variables for table name, queue URL (when SQS optional is enabled), and project metadata.
  * Writes validated transaction records (idempotent upsert) to DynamoDB **or** enqueues to SQS (optional path).
  * Execution role: least-privilege (logs, xray, ddb:PutItem/UpdateItem, sqs:SendMessage when optional enabled).
  * **DLQ**: an SQS queue with 14-day retention.

* **SQS (Optional buffering)**

  * Primary queue `${ProjectName}-${EnvironmentSuffix}-txq` with visibility timeout **300 seconds**.
  * **DLQ** with **14-day** retention and redrive policy (e.g., maxReceiveCount 5).
  * Appropriate permissions for producer (ingestion Lambda) and consumer (detection Lambda).

* **Lambda: Anomaly Detection (SQS consumer when optional enabled)**

  * ARM64, reserved concurrency ≥ 100, X-Ray enabled.
  * Triggered by SQS event source mapping (batch size reasonable, visibility aligns with processing time).
  * Writes detection results back to DynamoDB.
  * **DLQ** (14-day).
  * Execution role: least-privilege (logs, xray, ddb:PutItem/UpdateItem/TransactWrite).

* **DynamoDB: Transactions table**

  * `BillingMode: PAY_PER_REQUEST`.
  * `KeySchema`: `transactionId` (HASH), `timestamp` (RANGE).
  * Server-side encryption enabled (AWS owned key is acceptable).
  * Point-in-time recovery enabled.
  * Table name includes `${EnvironmentSuffix}`.

* **CloudWatch Monitoring**

  * **Dashboards** that chart: API latency (p50/p95), Lambda invocations & durations, and DynamoDB **ConsumedRead/ConsumedWrite** capacity.
  * **Alarms**: Lambda **Error rate > 1%** using metric math (`(Errors/Invocations)*100 > 1`). Route alarms to SNS.

* **SNS Alerts**

  * Topic `${ProjectName}-${EnvironmentSuffix}-alerts`.
  * Email subscription(s) from `AlertEmail` parameter (support multiple via comma-sep if implemented).
  * Used by CloudWatch alarms.

# Deliverable:

* **Single file**: `TapStack.yml` (**YAML, not JSON**).
* Contains **Parameters**, **Mappings** (if used), **Conditions** (if used), **Resources**, **Outputs**, and **Metadata** (e.g., cfn-lint regions).
* Every module is **created new** (no `ImportValue`, no external references).
* API, Lambdas, DynamoDB, and (optionally) SQS are fully wired with **proper `DependsOn`/implicit dependencies** via ARNs/refs.
* **Least-privilege IAM** policies crafted per function (separate roles per Lambda), no `*` wildcards on resource where scoping is practical.
* All LogGroups created explicitly with **30-day** retention (avoid late-bound default creation).
* **Outputs** include: API invoke URL, API ID and Stage, DynamoDB table name/ARN, SQS queue URLs/ARNs (if optional enabled), SNS topic ARN, Lambda ARNs, CloudWatch Dashboard name, and key CloudWatch Alarm ARNs.
* All resources include `Tags` with the three keys: `Environment`, `CostCenter`, `Owner`.

# Implementation details the template must include:

* **YAML only**; use CloudFormation intrinsic functions (`!Ref`, `!Sub`, `!GetAtt`) idiomatically.
* **EnvironmentSuffix** must be validated via **`AllowedPattern`** (safe regex) rather than hard `AllowedValues`. Provide a **ConstraintDescription** that guides safe naming.
* Names must follow a consistent pattern, for example:

  * `${ProjectName}-${EnvironmentSuffix}-ingestion-lambda`
  * `${ProjectName}-${EnvironmentSuffix}-transactions`
  * `${ProjectName}-${EnvironmentSuffix}-alerts`
* API throttling configured at stage/method to **1000 RPS**; include a parameter to allow overrides but default to 1000.
* All Lambda event source mappings (for SQS optional) are defined in the template.
* DLQs set to **1209600 seconds** retention (14 days).
* Metric-math alarm for **>1% error rate** with **treat missing data as not breaching**; alarm actions wired to SNS.
* X-Ray tracing set for Lambdas and API stage; attach `AWSXRayDaemonWriteAccess` managed policy (or equivalent minimal custom) to roles.
* DynamoDB PITR enabled; SSE enabled; table name includes suffix.
* CloudWatch Dashboard sections: **API latency (p95)**, **Lambda duration & invocations**, **DynamoDB consumed capacity** (read/write).
* IAM roles use **scoped ARNs** referencing created resources; avoid blanket `*` unless the service requires (e.g., X-Ray write).
* Reserved concurrency set to **100** (parameterized but default 100).

# Output formatting

Produce only the complete **CloudFormation YAML** in a single ```yaml fenced block**, file-ready as `TapStack.yml`. Do not include commentary outside the block. Ensure the template is self-contained and deployable without edits (aside from parameter values). Include comprehensive **Outputs**.

# Acceptance checks

* Validation with `cfn-lint` in **us-east-1** passes.
* Deploys without referencing external resources.
* POST `/webhook` returns 200 for a well-formed sample event and records a transaction in DynamoDB (or enqueues to SQS when optional path is enabled).
* CloudWatch dashboard renders all three metric categories.
* CloudWatch alarm enters **OK** on normal traffic and **ALARM** when induced error rate exceeds 1%.

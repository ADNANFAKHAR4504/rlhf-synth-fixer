# Build me a CDK (Python) serverless transaction pipeline

## Context (humanized)
We’re a financial-services team building a real-time, event-driven pipeline for transaction anomaly detection. It must handle millions of events/day with sub-second latency, strong auditing, and easy replay/reprocessing.

## What to build (with AWS CDK v2 in Python, region: eu-central-1)
- **Three EventBridge custom buses:** `transaction`, `system`, `audit`.
- **Lambda functions (Node.js 18, ARM64)**
  1) `ingest_processor` (main event processing)  
  2) `fraud_detector` (critical path)  
  3) `notifier` (notification handling)
- **API Gateway (REST):** `/transactions` endpoint with request validation (JSON schema), **API key required via Usage Plan**, Lambda proxy integration, and **X-Ray tracing enabled**.
- **DynamoDB (on-demand):**
  - `Transactions` table — composite PK `(accountId, ts)` or `(accountId, yyyymmddhhmmss)` for time-ordered queries.
  - `Rules` table — composite PK `(ruleId, version)`.
  - `AuditLogs` table — composite PK `(transactionId, ts)`.
- **S3** “processed data” bucket:
  - Block public access, **deny unencrypted uploads**, **require TLS**, default encryption with **AWS-managed KMS (aws/s3)**, **Intelligent-Tiering**, lifecycle to archive after **90 days**.
- **EventBridge rules** on `transaction` bus with **content-based filtering** (at least **5** patterns below). **Each rule fans out to ≥3 targets**, each with **retry policy** and **target DLQ**.
- **Lambda destinations:** on **success → audit bus** (PutEvents); on **failure → SQS DLQ** (with redrive policy).
- **Concurrency:** **reserved** concurrency on all functions; **provisioned** concurrency (via alias) for `fraud_detector` and `ingest_processor`.
- **EventBridge archive + replay** on `transaction` bus for deterministic reprocessing.
- **CloudWatch Logs:** dedicated log group per Lambda with **30-day retention**.
- **Observability:** X-Ray tracing **active** for Lambda and API Gateway; propagate trace context through EventBridge event detail.
- **Security/IAM:** strictly least-privilege roles per function (only required table ARNs, bucket prefixes, buses, logs, xray).

## Hard constraints
- **Runtime/arch:** All Lambdas = **Node.js 18** on **ARM64** (cost-optimized).
- **Env-param memory:** `dev=512 MB`, `prod=3008 MB` (parameterize by `stage`).
- **Tracing:** set to **Active** everywhere supported (Lambda, API Gateway).
- **Event rules:** ≥ **5** distinct patterns, each → **≥3** targets with per-target retries + DLQ.
- **DynamoDB:** on-demand, composite keys as above.
- **API Gateway:** requires **API key** (Usage Plan) and **request validation** (schema).
- **S3:** enforced encryption (AWS-managed), TLS-only, public-access block, Intelligent-Tiering, **90-day** transition.
- **Lambda destinations:** success → audit bus; failure → SQS DLQ.
- **Concurrency:** reserved on all; **provisioned** on critical path via alias.
- **Archive & replay:** enabled on `transaction` bus.

## Event patterns to implement (on `transaction` bus)
1. **High-value domestic**: `amount >= 1000`, `currency = USD`, `region ∈ {us-east-1, us-west-2, ...}`.  
2. **High-risk MCCs**: `merchantCategory ∈ {electronics, luxury, crypto}`.  
3. **Geo-anomaly**: `cardNotPresent = true` AND `country ∉ {US, NL, DE, FR, UK,...}`.  
4. **Velocity spike**: `recentTxnCount >= threshold` within short window.  
5. **Night-time behavior**: `localHour ∈ {00–05}` per cardholder time zone.  
_For each rule, targets (example set):_  
- Target A: `fraud_detector` Lambda  
- Target B: SQS buffer queue  
- Target C: **audit** bus (PutEvents)  
_All with `retryAttempts`, `maxEventAge`, and **target-level DLQ**._

## Observability & ops
- **Log groups** per function (30 days).  
- **X-Ray** on API stage and all Lambdas; pass trace IDs in EventBridge detail for continuity.  
- **Alarm stubs** (create CloudWatch alarms with sensible defaults):  
  - DLQ ApproximateNumberOfMessagesVisible  
  - Lambda Error/Throttles  
  - API 5XXRate / Latency (p99)

## Security & IAM (least privilege, no wildcards where avoidable)
- Each Lambda role:
  - Specific **DynamoDB** table actions (Get/Put/Query/Update) on exact ARNs.  
  - Specific **S3** bucket + prefix actions (PutObject/GetObject/List) with `aws:SecureTransport = true`.  
  - **EventBridge**: PutEvents only to named buses.  
  - **Logs/X-Ray**: create stream/put events, `xray:PutTraceSegments`, `xray:PutTelemetryRecords`.  
- S3 bucket policies to **deny unencrypted** and **non-TLS** uploads.

## Non-functional requirements
- **Sub-second** happy-path latency at scale.  
- Deterministic audit trail + replay via EventBridge archive/replay.  
- Clear environment separation: `stage` (dev/prod) controls memory, concurrency, and naming.

## Tooling expectations
- **AWS CDK v2** (Python).  
- Python **3.11+** for CDK app code.  
- Lambda code is **Node.js 18** (bundled assets), architecture **ARM64**.

## Parameters & config (suggested)
- `stage`: `dev|prod`  
- `defaultReservedConcurrency`: per function (overrideable)  
- `provisionedConcurrencyCritical`: value for fraud & ingest (prod only)  
- `archiveRetentionDays`: for EventBridge archive  
- API key & usage plan name; JSON schema for `/transactions`

## Acceptance criteria (Definition of Done)
- CDK **synth** and **deploy** succeed in **eu-central-1**.  
- All Lambdas: **Node 18, ARM64, tracing=Active**, dedicated log groups (30 days).  
- **3 EventBridge buses** exist; `transaction` bus has **archive & replay**.  
- **≥5 rules** with **≥3 targets** each, target-level retries + DLQ configured.  
- DynamoDB tables: **on-demand**, composite keys as specified.  
- API Gateway: **API key required**, **usage plan** attached, **request validation** enabled, tracing on.  
- S3 bucket: encryption enforced (AWS-managed), TLS-only, public blocked, Intelligent-Tiering, **90-day** archive.  
- Lambda **destinations**: success → audit bus; failure → SQS DLQ.  
- Critical Lambdas have **reserved** + **provisioned** concurrency via alias.

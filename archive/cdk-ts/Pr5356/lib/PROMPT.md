## Title

Build a serverless transaction pipeline (single-stack CDK v2 TypeScript)

## TL;DR

Create a production-ready, event-driven payments workflow in any region using **AWS CDK v2 + TypeScript (Node 18+)**. **Step Functions** orchestrates **parallel fraud & compliance** paths, with **compensating (Saga) rollbacks**, strict **per-merchant ordering** via **SQS FIFO**, and **real-time webhooks** for status updates. All stack code must live in **`lib/tapstack.ts`**.

---

## Repository layout (must match)

* `bin/tap.ts` — minimal CDK entry; instantiate the stack only
* `lib/tapstack.ts` — **entire stack implementation in this single file**
* `lib/other .md files` — docs only
* `test/tap-stack.int.test.ts` — integration tests (may read stack outputs)
* `test/tap-stack.unit.test.ts` — unit/snapshot tests

**Hard placement rule:** put *all* constructs/resources/permissions/outputs inside `lib/tapstack.ts`. Do not create additional `.ts` source files.

---

## Why we’re building this

* Process payment transactions **asynchronously** with **strict ordering** per merchant.
* Run **fraud** and **compliance** checks **in parallel**.
* Recover safely with **compensating transactions** (Saga).
* Send **real-time webhook** notifications on status changes.
* Operate with **strong observability**, **least-privilege IAM**, and **cost-optimized ARM** Lambdas.

---

## Services in scope

AWS Step Functions, AWS Lambda, Amazon API Gateway, Amazon DynamoDB, Amazon SQS, Amazon EventBridge, Amazon S3, AWS X-Ray, Amazon CloudWatch, AWS Identity and Access Management (IAM), AWS Secrets Manager, AWS CloudFormation (via AWS CDK)

---

## Environment & standards
* CDK: **v2**
* Language: **TypeScript**, **Node.js ≥ 18**
* Lambda architecture: **ARM_64 (Graviton2) only**
* Tracing: **AWS X-Ray** end-to-end
* IaC: single CDK **Stack** in `lib/tapstack.ts`, minimal `bin/tap.ts`

---

## What to build (implement all in `lib/tapstack.ts`)

### 1) Orchestration — Step Functions (with compensation)

* State machine flow:
  **Normalize input → Validate → Parallel { Fraud, Compliance } → Aggregate → Persist + Emit → Webhook dispatch**
* **Custom retry** on each Task (exponential backoff, jitter, max attempts) with **Catch** → **Compensator** (Saga rollback).
* Compensation must **reverse side effects**, **persist an audit record**, and **emit `transaction.rolled_back`**.
* **X-Ray tracing** enabled; sensible state timeouts; **idempotency** guidance documented.

### 2) Lambda functions — Node 18, ARM_64, SDK v3 + custom retries

* Functions: `transaction-validation`, `fraud-scoring`, `compliance-verification`, `persist-transaction`, `emit-events`, `webhook-dispatcher`, `compensator`.
* Use **AWS SDK v3** only, via a **shared custom retry helper** (max attempts, exponential backoff, throttle/5xx aware, timeouts).
* **Reserved concurrency** for all functions.
  **Provisioned concurrency** for `transaction-validation` and `webhook-dispatcher` (version + alias wired).
* **Structured JSON logs** with correlation IDs (`transactionId`, `executionArn`); **least-privilege IAM**; **X-Ray** on.

### 3) Data — DynamoDB (PAY_PER_REQUEST + Contributor Insights)

* **Transactions** table

  * Billing: **on-demand**; **Contributor Insights** ON; **Streams** ON (NEW_AND_OLD_IMAGES).
  * Keys/attrs: `txnId` (PK), `merchantId`, `amount`, `currency`, `status`, `fraudScore`, `complianceFlags`, `createdAt`, `updatedAt`.
  * **GSIs**:

    * `byMerchantAndTime` — PK `merchantId`, SK `updatedAt`
    * `byStatusAndTime` — PK `status`, SK `updatedAt`
* **Audit** table

  * Billing: **on-demand**; **Contributor Insights** ON.
  * Keys/attrs: `auditId` (PK), `txnId`, `eventType`, `details`, `createdAt`.
  * **GSI**: `byTxnAndTime` — PK `txnId`, SK `createdAt`

### 4) Ingress & webhooks — API Gateway (auth, throttling, mappings)

* REST API endpoints:

  * **POST `/transactions`** — ingest new transactions
  * **POST `/webhooks/status`** — merchant acknowledgements
* **Custom Lambda authorizer**: validate **HMAC** and/or **API key**; inject `clientId` into request context.
* **Per-client throttling** via **Usage Plans + API Keys** (enforce **rate** and **burst** by client ID).
* **Models** + **request/response mapping templates**; **access/execution logs** enabled.

### 5) Events & queues — EventBridge + SQS (strict ordering + DLQs)

* **SQS FIFO** inbound queue:

  * **MessageGroupId = merchantId** (strict per-merchant ordering).
  * Content-based or explicit dedup strategy documented.
  * **FIFO DLQ** with **custom redrive policy** (e.g., `maxReceiveCount`, `redriveAllowPolicy`).
* **EventBridge** custom bus + rules:

  * **HighAmountRule** — thresholded amount triggers review/workflow.
  * **HighFraudScoreRule** — high fraud score triggers manual review path.
  * **FailureSpikeRule** — error pattern with rate-limited incident event.
  * Targets: Step Functions / Lambdas, each with **DLQ** configured.

### 6) Storage lifecycle — S3 archival

* Bucket: `txn-archive-{env}`

  * Default encryption ON, block public access ON, versioning as needed.
  * **Lifecycle**: transition completed transaction artifacts after **90 days** to cheaper storage (optional expire at 365).

### 7) Observability — X-Ray + CloudWatch (metrics, dashboard, alarms)

* **X-Ray** on API Gateway, all Lambdas, and Step Functions; propagate trace headers.
* **Custom metrics** (namespace **`TxnPipeline`**):
  `TransactionsSucceeded`, `TransactionsFailed`, `ProcessingTimeMs` (p50/p90/p99), `FraudScoreHighCount`, `ComplianceFailCount`, `WebhookDeliveryLatencyMs`, `DLQDepth`.
* **CloudWatch Dashboard**: success rate, latency, throttles, errors per component, DLQ depth, Step Functions executions by status.
* **Alarms** (actionable descriptions + runbook links):

  * DLQ depth > 0 for 5 minutes
  * Lambda **Throttles** > 0
  * StateMachine **ExecutionsFailed** over threshold
  * API **5xx** rate over threshold

---

## Hard constraints (do not bend)

* **Compensating transactions** (Saga) must be implemented for rollback paths.
* **All Lambdas use ARM_64 (Graviton2)**.
* Lambdas must use **AWS SDK v3** with a **custom retry** strategy.
* DynamoDB tables must be **PAY_PER_REQUEST** and have **Contributor Insights enabled**.
* API Gateway must enforce **per-client throttling** (usage plans + API keys with **burst limits**).

---

## Ordering, idempotency, performance

* **Strict ordering**: SQS **FIFO** with **MessageGroupId = merchantId**; document dedup strategy.
* **Idempotency**: use `txnId` across writes and webhook retries; safe retries for non-idempotent calls.
* **Provisioned concurrency** on hot paths; timeouts/backoffs tuned to avoid API timeouts.

---

## Security & secrets

* **Least-privilege IAM** per function/resource; scope ARNs tightly.
* Store secrets (e.g., webhook signing keys) in **AWS Secrets Manager**; do not commit any secrets.

---

## Deliverables

* A single **CDK Stack** in `lib/tapstack.ts` implementing everything above.
* Minimal `bin/tap.ts` that constructs the app and the stack.
* Docs in `lib/` as `.md` files:

  * **README** (bootstrap/synth/diff/deploy/destroy, env vars, sample cURL/Postman, replay/DLQ drain/stuck execution runbooks)
  * Architecture diagram + State Machine diagram (PNG or Mermaid accepted)
* Tests:

  * `test/tap-stack.unit.test.ts` — props validation + synth snapshot
  * `test/tap-stack.int.test.ts` — minimal integration reading stack outputs

---

## Acceptance criteria

*  All resources defined inside **one** stack file: `lib/tapstack.ts`
*  Parallel fraud/compliance branches with **custom retries** and a **compensation** path that emits `transaction.rolled_back`
*  DynamoDB tables with required **GSIs** and **Contributor Insights**
*  API Gateway with **custom authorizer**, **per-client throttling**, mappings, and logging
*  EventBridge rules that trigger workflows on thresholds/patterns
*  SQS **FIFO** + **DLQ** with custom redrive policy
*  S3 lifecycle moves artifacts after **90 days**
*  Lambda **reserved** + **provisioned** concurrency as specified
*  **X-Ray** end-to-end; **CloudWatch** dashboard, custom metrics, and alarms
*  Project builds and deploys with **CDK v2 / Node 18+** without adding new source files beyond the structure above

---

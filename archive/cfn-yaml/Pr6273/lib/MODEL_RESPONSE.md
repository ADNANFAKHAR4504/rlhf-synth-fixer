# model_response

## Functional scope (build everything new)

* Provision a fresh serverless anomaly detection pipeline in **us-east-1** using **API Gateway**, **Lambda**, **DynamoDB**, and optional **SQS** buffering.
* Centralize logs and metrics; build alarms and a dashboard for operational visibility.
* Enforce environment isolation by appending **ENVIRONMENT_SUFFIX** to every resource name.

## Assumptions & parameters

* A single **TapStack.yml** contains all definitions.
* **EnvironmentSuffix** uses a safe **regex** (2–32 chars, lowercase alphanumerics and hyphens, not starting/ending with hyphen).
* Parameters include: `ProjectName`, `EnvironmentSuffix`, `Owner`, `CostCenter`, `AlertEmail`, `ApiThrottleRps`, `ApiThrottleBurst`, `LambdaReservedConcurrency`, `LambdaMemoryIngestion`, `LambdaTimeoutIngestion`, and `SqsVisibilityTimeoutSeconds`.

## Architecture summary

* **POST /webhook** (API Gateway) → **Ingestion Lambda** (ARM64, 512 MB, 60s, X-Ray, reserved concurrency ≥ 100).
* Ingestion Lambda validates payload, writes a base record to **DynamoDB** (on-demand, `transactionId` + `timestamp`), and enqueues to **SQS** (optional buffer).
* **Detection Lambda** reads from SQS, evaluates simple anomaly rules, writes results to DynamoDB, and can fan out alerts via **SNS** when extended.
* **Scheduled Analysis Lambda** runs every 15 minutes (EventBridge) to perform pattern checks or aggregations.

## Reliability, security, and cost controls

* **DLQs** for each Lambda with **14-day** retention; explicit **QueuePolicies** allow Lambda/EventBridge to send to DLQs (source-restricted).
* **IAM**: least-privilege task policies for each Lambda (DynamoDB read/write scope to the created table; SQS send/receive only to created queues).
* **Tracing & logging**: X-Ray enabled for Lambdas; explicit log groups with **30-day** retention; API Gateway access logs configured.
* **Throttling**: API stage enforces **1000 RPS** and configured burst.
* **Observability**: CloudWatch **dashboard** (API p95, Lambda invocations/duration p95, DynamoDB capacity) and **alarms** for Lambda error rate > 1% using safe math expressions that avoid divide-by-zero.

## Deliverable

* **TapStack.yml** containing:

  * Parameters, validations, and tags.
  * DynamoDB table, SQS queues (main + DLQs), SNS topic/subscription.
  * Lambda functions (ingestion, detection, scheduled) with ARM64, X-Ray, reserved concurrency, DLQs, env vars.
  * IAM roles/policies restricted to the created resources.
  * API Gateway REST API with `/webhook` POST using Lambda proxy integration and stage-level throttling.
  * EventBridge schedule for the 15-minute analysis.
  * CloudWatch dashboard and error-rate alarms.
  * Outputs for key ARNs/URLs/names.

## Quality checks

* **cfn-lint** passes with no errors.
* Initial deployment succeeds without manual pre-existing resources.
* Posting a test transaction yields 200 OK and a corresponding entry in DynamoDB; the detection flow completes and writes an anomaly flag.
* Alarms and dashboard populate within minutes under load.


You are generating **a single Terraform file named `tap_stack.tf`**.

## CRITICAL FORMAT REQUIREMENTS
1. **Your entire output MUST be valid Terraform code inside one file (`tap_stack.tf`).**
2. **Do NOT include `provider.tf`**. Assume I already have a working `provider.tf` that configures the AWS provider.
   - `provider.tf` will read a variable called `aws_region`.
3. You MUST:
   - Declare **all variables** (with sensible defaults where possible).
   - Declare **all resources**.
   - Add any needed `locals`.
   - Add any `outputs`.
   - Include inline comments explaining intent (not long essays).
4. **Do NOT reference external modules, remote modules, or pre-existing infrastructure.**  
   Every resource must be defined inline using native AWS Terraform resources (`aws_*`) in this one file.  
   No `module "..." { source = "..." }`.
5. Assume this is a **brand new stack** being deployed from scratch.
6. Use AWS best practices (naming, tags, IAM least privilege, DLQs, retries, etc.).
7. The code must be syntactically valid HCL2 and logically consistent.

## CONTEXT (SYSTEM WE ARE BUILDING)

We're building a global hotel booking infrastructure. It handles real-time reservations for ~45,000 properties and prevents double-booking of the same room-night.

### Core flow:
1. **API Gateway (booking endpoint)**  
   - Receives booking requests from clients.

2. **Lambda: `booking_handler`**  
   - Validates request.
   - Writes booking state to **DynamoDB** using conditional writes with an optimistic lock version (to prevent double-sell).
   - Returns success/failure quickly to caller.
   - Publishes an event to SNS about the booking change.

3. **DynamoDB (authoritative booking + inventory state)**  
   - Global table replicated to multiple regions.
   - Each item tracks room availability per property per stay-date, including a `version` attribute for optimistic locking.
   - Streams enabled.

4. **DynamoDB Stream → Lambda: `cache_updater`**  
   - On change, updates **ElastiCache (Redis)** for that specific property’s affected rooms / dates only.
   - Cache entries have TTL.
   - This keeps per-hotel availability fast to read.

5. **SNS topic: `inventory_updates`**  
   - Receives "room X at hotel Y changed" events.

6. **SQS queues (per property / per PMS integration)**  
   - Each property (or PMS integration class) has an SQS queue subscribed to the SNS topic.
   - A Lambda consumer `pms_sync_worker` reads from that SQS queue, calls the property’s Property Management System (PMS) API, and syncs availability.
   - Includes retry logic, exponential backoff, DLQ, and a circuit breaker style flag (stop calling a broken PMS temporarily).

7. **EventBridge rule + Step Functions for reconciliation**  
   - EventBridge triggers a Step Function on a schedule.
   - The Step Function runs a consistency check for recent “hot” bookings:
     - Compare authoritative DynamoDB state in the primary region vs cached availability vs replicated copies.
     - Detect drift / potential overbooking.
   - If drift is found, invoke a Lambda `overbooking_resolver`.

8. **Aurora (read replica)**  
   - Aurora is used as a reporting / audit / reconciliation store.
   - Step Functions can read from Aurora read replica to compare “what we think is sold” vs “what downstream PMS thinks is sold.”

9. **Overbooking detection and correction**
   - Lambda `overbooking_resolver`:
     - Detects conflicts (same room-night double allocated).
     - Tries to auto-reassign guest to another available equivalent room in same property.
     - If fixable, writes correction back to DynamoDB and republishes to SNS.
     - If not fixable, sends alert (for now just expose as a CloudWatch alarm / output).

---

## SLA TARGETS (TONED DOWN + REALISTIC)

These are not to be enforced in code, but code comments should reflect them:

- API Gateway must handle ~70,000 booking requests per minute (~1,200 RPS sustained, burst ~2,000 RPS).
- Booking confirmation path (API Gateway → `booking_handler` Lambda → DynamoDB conditional write → response) should return in **<400ms P95** in the primary region.
- DynamoDB global table replication target: typically <5 seconds cross-region, alert if >10s.
- Cache (ElastiCache) for a specific hotel is updated in <1s P95 after DynamoDB change.
- SNS → SQS → PMS sync should enqueue and attempt delivery for that property’s PMS in <60 seconds.
- Reconciliation:
  - “Hot” bookings are rechecked within 30 seconds.
  - A wider audit Step Function runs every 5 minutes and finishes within 2 minutes.
- Overbooking:
  - Conflicts detected within 5 seconds of collision.
  - Auto-reassign (if possible) within 60 seconds.
  - Push correction to PMS within 2 minutes.
  - Otherwise raise an alert for human ops.

These SLAs should appear as comments where relevant in the code so it’s obvious why we built certain pieces (TTL, DLQ, etc.).

---

## REQUIRED TERRAFORM CONTENTS

Your `tap_stack.tf` MUST define at least the following.  
Use reasonable placeholder names where needed (e.g. `booking-api`, `booking-handler`, etc.).  
All names must be parameterized via variables where it makes sense.

### 1. Variables
Declare variables for (with sane defaults if possible):
- `aws_region` (string, no default or default = `"us-west-2"`; this is passed into provider.tf externally)
- `project_name` (string, default `"global-booking"`)
- `environment` (string, default `"prod"`)
- `dynamodb_table_name`
- `dynamodb_replica_regions` (list of regions for global table replicas)
- `cache_node_type` (for ElastiCache, e.g. `cache.t3.micro` as placeholder)
- `pms_queue_visibility_timeout_seconds`
- `booking_api_rate_limit_rps` (number, default 2000) // helps document SLA
- `tags` (map(string)) for standard tagging: owner, cost_center, environment, etc.

Also include any other variables you need (like VPC IDs, subnet IDs, security group IDs).  
You can assume we already have a VPC, private subnets, and security groups managed elsewhere or create simple placeholders using variables like `vpc_id`, `private_subnet_ids`, `security_group_ids`.  
We just need the variables declared because this stack should be deployable.

### 2. Locals
Use `locals` to standardize naming:
- Resource name prefixes like `"${var.project_name}-${var.environment}"`.
- Common tags merged from `var.tags`.

### 3. DynamoDB Global Table
- `aws_dynamodb_table` with:
  - PK (e.g. `property_id#room_id#date` as the partition key).
  - Attributes to store:
    - `available_units` (number of rooms left for that night)
    - `version` (number used for optimistic locking)
    - timestamps
  - `stream_enabled = true` and `stream_view_type = "NEW_AND_OLD_IMAGES"`.
  - `replica` blocks for each region in `var.dynamodb_replica_regions` to make it a global table.
- Add `billing_mode = "PAY_PER_REQUEST"` for autoscaling.
- Add `ttl` configuration for short-lived hold records (temporary locks for pending bookings).

### 4. IAM Roles / Policies
Create least-privilege IAM roles for each Lambda:
- `booking_handler_role`
- `cache_updater_role`
- `pms_sync_worker_role`
- `reconciliation_checker_role`
- `overbooking_resolver_role`

Each role must have policies to:
- Read/write the DynamoDB table (with conditional writes).
- Read from DynamoDB Streams (for `cache_updater`).
- Publish to SNS (`booking_handler`).
- Consume from SQS + call external PMS APIs (`pms_sync_worker`).
- Access ElastiCache (if using in-VPC auth).
- Write CloudWatch logs.

Show policies inline using `aws_iam_role`, `aws_iam_policy`, `aws_iam_role_policy_attachment`.  
Use least privilege style (only needed actions).

### 5. Lambda Functions
Create these Lambda functions (as `aws_lambda_function` resources) with placeholder code buckets/keys/env vars:
- `booking_handler`
  - Triggered by API Gateway.
  - Writes to DynamoDB using conditional expression on `version`.
  - Publishes booking change event to SNS.
- `cache_updater`
  - Triggered by DynamoDB Stream.
  - Updates ElastiCache entries for only the impacted hotel/room/date with a TTL.
- `pms_sync_worker`
  - Triggered by SQS.
  - Calls downstream PMS API.
  - Implements retry / backoff / circuit breaker via env vars (like `MAX_RETRIES`, `CIRCUIT_OPEN_SECONDS`).
- `reconciliation_checker`
  - Triggered by Step Functions to read recent “hot” bookings from DynamoDB and compare to cache / replicas / Aurora.
- `overbooking_resolver`
  - Triggered when reconciliation detects a conflict.
  - Attempts to auto-reassign or raise alert.

Each Lambda:
- Must have `memory_size`, `timeout`, and `environment` (env vars).
- Must have `vpc_config` variables referencing `private_subnet_ids` & `security_group_ids` where needed (especially for ElastiCache / Aurora access).
- Must have `tracing_config` with `mode = "Active"` to allow X-Ray (best practice).

### 6. API Gateway
Create:
- `aws_apigatewayv2_api` (HTTP API) for `/book`.
- `aws_apigatewayv2_integration` to integrate with `booking_handler` Lambda.
- `aws_apigatewayv2_route` for `POST /book`.
- `aws_lambda_permission` so API Gateway can invoke the Lambda.

Add throttling notes in comments tying back to SLA (~2k RPS burst).

### 7. DynamoDB Stream → `cache_updater` Lambda
Create:
- `aws_lambda_event_source_mapping` from the DynamoDB table stream ARN to the `cache_updater` Lambda.

Comment that this path must propagate changes to cache for the affected hotel in <1s P95.

### 8. ElastiCache (Redis)
Create:
- `aws_elasticache_subnet_group` using `private_subnet_ids`.
- `aws_elasticache_replication_group` (Redis) sized via `var.cache_node_type`.
  - Enable at-rest/encryption-in-transit where possible.
  - Comment that keys are per-hotel availability snapshots with TTL and only updated for that hotel, not global.

### 9. SNS Topic + SQS Queues + Subscriptions
Create:
- `aws_sns_topic` called something like `inventory_updates`.
- An example SQS queue `hotel_pms_queue` for a single property/PMS integration.
  - Include `visibility_timeout_seconds = var.pms_queue_visibility_timeout_seconds`.
  - Include a DLQ (`hotel_pms_dlq`) using SQS redrive policy for poison messages.
- `aws_sns_topic_subscription` wiring topic → queue.
- `aws_lambda_event_source_mapping` from `hotel_pms_queue` to `pms_sync_worker` Lambda.

Add comments:
- We fan out booking changes only to affected property/PMS, not all 45k hotels.
- We aim to enqueue and attempt sync within 60 seconds SLA.

### 10. EventBridge Rule + Step Functions
Create:
- `aws_cloudwatch_event_rule` (a.k.a. EventBridge rule) that runs every 5 minutes (cron).
  - Comment: This replaces “every 30s all hotels.” We now do periodic sampled reconciliation.
- `aws_cloudwatch_event_target` to trigger the Step Function.

Create:
- `aws_sfn_state_machine` that:
  - Invokes `reconciliation_checker` Lambda.
  - If drift found, invokes `overbooking_resolver` Lambda.
  - Uses `aws_iam_role` for Step Functions execution with permissions to invoke those Lambdas.

The state machine definition can be an inline JSON with `Task` steps.

Comment:
- SLA: finish reconciliation of “hot” bookings within 30s of the booking being finalized, and run a deeper audit every 5 minutes that completes in under 2 minutes.

### 11. Aurora (for reconciliation reads)
Create:
- A minimal `aws_rds_cluster` (Aurora) + `aws_rds_cluster_instance` (reader).
- Comment:
  - Aurora here is used as a reporting / audit store, not the primary booking source of truth.
  - The reconciliation Lambda will compare DynamoDB state to Aurora-replicated state.
- Use serverless or provisioned with small instance class for example (e.g. `db.serverless` or `db.r6g.large` placeholder).  
  You can assume networking via same VPC/subnets.

### 12. CloudWatch Alarms / Metrics (basic)
Create CloudWatch alarms (e.g. `aws_cloudwatch_metric_alarm`) for:
- High DynamoDB replication lag metric (placeholder, you can simulate with `EvaluationPeriods` etc.).
- SQS DLQ > 0 messages.
- Circuit breaker open too long (can be via custom metric from Lambda).

These alarms should have tags and descriptions mentioning the SLA breaches:
- Replication >10s.
- PMS sync backlog >60s.
- Unresolved overbooking after 2 minutes.

### 13. Outputs
Add Terraform outputs that expose:
- API Gateway invoke URL.
- DynamoDB table name.
- SNS topic ARN.
- SQS main queue URL + DLQ URL.
- Step Functions state machine ARN.
- ElastiCache primary endpoint address.
- Aurora reader endpoint.

These outputs let other teams / test harnesses hit the infra.

---

## NAMING & TAGGING GUIDELINES

All resources should:
- Use a consistent prefix like:  
  `local.name_prefix = "${var.project_name}-${var.environment}"`
- Use tags that include:
  - `Project = var.project_name`
  - `Environment = var.environment`
  - `Owner` / `CostCenter` from `var.tags`

Show this in each resource using `tags = merge(local.common_tags, { "Name" = "${local.name_prefix}-something" })`.

---

## SECURITY / BEST PRACTICE REQUIREMENTS
- All Lambdas must have CloudWatch Logs enabled automatically (Terraform does this when you set up execution role permissions for logs, but also include comments).
- Where possible, enable encryption at rest:
  - DynamoDB server-side encryption.
  - SNS / SQS SSE.
  - ElastiCache `at_rest_encryption_enabled` and `transit_encryption_enabled`.
  - Aurora storage encryption.
- SQS queues must have a redrive policy (DLQ).
- Step Functions execution role must have least privilege to invoke only the Lambdas it needs.
- Lambda environment variables should NOT contain secrets in plain text. Add comments that secrets should come from AWS Secrets Manager or SSM Parameter Store. (You can declare variables referencing SSM ARNs to make this obvious.)

---

## SUMMARY OF WHAT YOU MUST RETURN

Return ONE Terraform file (`tap_stack.tf`) that contains:
1. All `variable` blocks (including `aws_region`).
2. `locals` (prefix, tags).
3. All AWS resources described above (API Gateway, DynamoDB global table w/ stream, Lambdas, DynamoDB Stream mapping, ElastiCache, SNS, SQS+DLQ, EventBridge rule, Step Functions, Aurora cluster, IAM roles/policies, CloudWatch alarms).
4. All needed IAM roles / policies / attachments.
5. All `output` blocks.

Include helpful inline comments referencing the SLA targets we defined (the toned down ones, not the original impossible ones).

Do **not** include any other files, YAML, docs, prose, or explanations.  
Just the final `tap_stack.tf` code.

The final output you produce after reading this prompt should be directly copy/pastable into `tap_stack.tf`.
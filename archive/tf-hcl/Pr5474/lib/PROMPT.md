# Prompt: Generate `tap_stack.tf` for Multi-Environment Consistency (Terraform)

You are an expert Terraform engineer. Produce **production-ready Terraform** that enforces **multi-environment (dev, staging, prod) topology parity** for a reference-data pipeline. Follow all constraints exactly.

## Deliverables
- A **single file** named **`tap_stack.tf`** containing:
  - `terraform` block with `required_version` and `required_providers` (no provider config here).
  - **All variable declarations** (with types, descriptions, sane defaults where appropriate).
  - **All resources and data sources** (see Required Topology).
  - **Locals** for naming, tagging, and per-env capacity maps.
  - **Outputs** for key endpoints/ARNs/IDs.
- Include **three example var files** at the end of your answer as code blocks: `dev.tfvars`, `staging.tfvars`, `prod.tfvars`. These must only set **allowed per-env differences** (sizes/capacities/limits), **not** topology.

## Important Constraints (do not violate)
1. **Provider config is already in `provider.tf`** and uses a variable `aws_region`.  
   - In `tap_stack.tf`, **declare** `variable "aws_region"` (type string, no provider blocks).
2. **Single-file implementation**: all resources must be defined directly in `tap_stack.tf`. **Do not** use external registry modules or local module sources.
3. **Topology parity**: dev/staging/prod must have **identical resource types and counts**. Only capacities/sizes/tags/limits may vary via tfvars.
4. **Best practices**: encryption, least-privilege IAM, deterministic naming, idempotency, and minimal `depends_on`.
5. **Networking**: create a VPC with public/private subnets, NAT where needed, security groups, and place resources that require VPC access accordingly (Lambda that hits Aurora/ElastiCache/Neptune).
6. **No placeholders or pseudo-code**: write actual `aws_*` resources with realistic arguments and comments.

## Required Topology (same in every env; only capacities differ)
- **DynamoDB** table with Streams (NEW_AND_OLD_IMAGES), server-side encryption (KMS), TTL & point-in-time recovery.
- **Lambda** validators (from inline zip via `archive_file`), with IAM role/policies, env vars, DLQ (SQS), CloudWatch log group, optional provisioned concurrency (var-driven). VPC-enabled if accessing VPC resources.
- **Kinesis Data Stream** (on-demand or provisioned shard count via var) + **Lambda processors** subscribed via event source mapping.
- **ElastiCache for Redis** (replication group), parameter group, subnet group, SGs; Lambdas update cache.
- **EventBridge** rule (cron or rate) to kick off consistency checks.
- **Step Functions** state machine (JSON from `templatefile` in locals) that:
  - Invokes Lambda(s) that query **Aurora PostgreSQL** **Serverless v2** (writer + reader(s)) via Data API off if you choose VPC lambdas; ensure SGs/Secrets Manager for DB creds.
- **SNS** topic + **SQS** queue subscription for conflict events; **Lambda** reconciliation processor consuming the queue.
- **Neptune** (cluster + instance) for lineage writes; SG/subnet group.
- **CloudWatch** alarms & dashboards for key metrics (DDB stream lag, Kinesis iterator age, Lambda errors/duration, cache update latency, SFN failures, Aurora/Neptune connectivity).

## Variables (declare all in `tap_stack.tf`)
- `env` (string; allowed: `dev`, `staging`, `prod`) — used for namespacing and tags.
- `aws_region` (string) — **declare only**; provider uses it in `provider.tf`.
- Naming & tagging: `project_name`, `owner`, `cost_center`, `common_tags` (map), `kms_key_alias_suffix`.
- VPC: `vpc_cidr`, `public_subnet_cidrs` (list), `private_subnet_cidrs` (list), `enable_nat` (bool).
- DDB: `ddb_table_name`, `ddb_ttl_attribute`, `ddb_billing_mode` (PAY_PER_REQUEST | PROVISIONED), `ddb_rcu`, `ddb_wcu`.
- Lambda (shared): `lambda_memory_mb`, `lambda_timeout_s`, `lambda_provisioned_concurrency`, `lambda_env` (map(string)).
- Kinesis: `kinesis_mode` (ON_DEMAND | PROVISIONED), `kinesis_shard_count` (number when PROVISIONED).
- ElastiCache: `redis_node_type`, `redis_num_replicas`, `redis_multi_az`, `redis_engine_version`.
- Aurora (PostgreSQL): `aurora_engine_version`, `aurora_instance_class`, `aurora_min_capacity`, `aurora_max_capacity`, `aurora_initial_db_name`.
- Neptune: `neptune_instance_class`, `neptune_engine_version`, `enable_neptune` (bool).
- Eventing/SFN: `consistency_check_rate` (e.g., `"rate(5 minutes)"`), `sfn_tracing_enabled` (bool).
- Ops: `log_retention_days`, `alarm_email` (string, optional).
- Any secrets should be referenced via variables that point to **Secrets Manager/SSM parameter names**, not literal secrets.

Use **locals** to:
- Build deterministic names: `${var.project_name}-${var.env}-<component>`.
- Centralize tags: merge `common_tags` + `Environment = var.env` + `Project = var.project_name`.
- Provide **per-env capacity maps** (e.g., shard counts, memory, instance sizes) and then set resource arguments like `lookup(local.kinesis_shards_by_env, var.env)`—but keep **defaults minimal** and allow override via tfvars.

## Implementation Details & Guardrails
- KMS: create CMKs per env (alias includes env); encrypt DDB, Kinesis, SNS/SQS, logs, Aurora (storage), ElastiCache (in-transit + at-rest), Neptune.
- IAM: least-privilege policies for each Lambda (DDB stream read, Kinesis put, ElastiCache via SG only, Aurora via IAM auth or Secrets Manager, Neptune access in VPC).
- Lambda packaging: use `archive_file` + `aws_lambda_function` (runtime can be `python3.12`) with small inline handlers sufficient to demonstrate wiring.
- Events:
  - DDB Stream → **validator Lambda** via event source mapping.
  - Validator → **Kinesis** (`PutRecords`).
  - Kinesis → **processor Lambda** → **Redis** updates.
  - EventBridge Rule → **SFN StartExecution**.
  - SFN → **Lambda** to query **Aurora** readers, apply  business-rule checks, publish conflicts to **SNS**.
  - **SNS → SQS** subscription; **reconciliation Lambda** consumes SQS, updates sources, writes lineage to **Neptune**.
- VPC endpoints for DynamoDB/Kinesis/SNS/SQS if needed; otherwise route through NAT for Lambda egress.
- Observability: log groups with retention, metrics filters where useful, essential CloudWatch alarms (e.g., IteratorAge, Lambda Errors/Throttles, Redis CPU/FreeableMemory, RDS/Neptune connectivity, SFN FailedExecutions).

## Outputs (include in `tap_stack.tf`)
Expose ARNs/IDs/endpoints for: DDB table, Kinesis stream, Redis primary endpoint, Aurora writer & reader endpoints, SNS topic ARN, SQS queue URL/ARN, Neptune endpoint, SFN ARN, key IAM role ARNs, VPC/Subnets/Security Groups.

## Parity & Allowed Diffs
- **Same resource graph** across envs.
- Allowed to differ via tfvars: sizes (instance class/memory), capacities (RCU/WCU/shards), timeouts, provisioned concurrency, engine versions (only patch), retention days, rate expression, node counts.
- **Disallowed**: adding/removing services per env.

## Code Quality & Style
- Terraform `>= 1.5`, AWS provider `~> 5.0`.
- Consistent naming, comments for each resource, minimal `depends_on`.
- Use `for_each`/`count` deterministically; avoid non-stable `random_*` (or set `keepers` with env/project).

---

## Produce These Files

### 1) `tap_stack.tf`
Write the entire file contents inside one code block.

### 2) `dev.tfvars`
Only capacities/sizes/limits/tags specific to dev.

### 3) `staging.tfvars`
Only capacities/sizes/limits/tags specific to staging.

### 4) `prod.tfvars`
Only capacities/sizes/limits/tags specific to prod.

---

## Acceptance Criteria (gate your output)
- `tap_stack.tf` contains **all** variables, locals, resources, IAM, and outputs—**no TODOs** or placeholders.
- No `provider` blocks in `tap_stack.tf`.
- Resource topology is **identical** across envs; only values pulled from vars differ.
- Compiles without external modules; uses only native `aws_*` and `archive_file` resources/data sources.
- Clear, well-commented, and ready to `plan` in all three envs.
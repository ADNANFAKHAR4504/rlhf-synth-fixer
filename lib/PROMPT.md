# Prompt (copy-paste into Claude)

You are an expert Terraform engineer. Generate a **single Terraform file named `tap_stack.tf`** that provisions a **brand-new test environment** for a fintech platform targeting **parity with production for 234 microservices**.

## Hard requirements
- **Single file only**: put **everything** (variables + locals + resources + data sources + outputs) inside `tap_stack.tf`.  
  - I already have `provider.tf` with the AWS provider configured to use a variable named **`aws_region`**.  
  - In `tap_stack.tf`, **declare** `variable "aws_region"` (with a sensible default), but **do not** redefine the provider.
- **No external modules, no existing infra references**: create all resources from scratch using core `aws_*` resources and data sources only.
- **Environment**: this is a **test** environment that must maintain **~95% infra parity** with production while remaining independently scalable.
- **Daily refresh (runtime)**: Terraform should provision the **automation** (not run it). After provision, a daily job must:
  1) copy prod data → test,  
  2) **mask/PII-redact** automatically,  
  3) kick off **integration tests**, and  
  4) emit metrics to CloudWatch.
- **Performance**: target **< 30 min provisioning** for infra (data sync runs post-provision).  
- **Security**: use **separate KMS keys** for test while preserving alias/patterns used in prod.

## What to build (resources & architecture)
1. **Networking**
   - VPC mirroring production topology (CIDRs as variables), 2–3 public + 2–3 private subnets across ≥2 AZs, NAT GW(s), route tables, SGs (least-privilege).
   - VPC endpoints for S3, DynamoDB, SSM, CloudWatch Logs.
2. **Data layers**
   - **Aurora** (PostgreSQL or MySQL, param group + subnet group).  
     - Create a **read/write test cluster** with performance-friendly instance size (via variable).  
     - Provision **KMS CMK** (alias mirroring prod pattern, e.g., `alias/app-data-test`).
   - **DynamoDB**: create N tables via `for_each` from `var.ddb_tables` (name, pk/sk defs, GSIs optional).  
     - Seed minimal **test data** (use `aws_dynamodb_table_item` or a Lambda seeder).
   - **S3**: buckets for (a) test application data, (b) **artifacts** (lambda zips), (c) **masked-data staging**. All with bucket policies, versioning, lifecycle, default encryption (KMS), and **prod-like prefixes/folder structure**.
3. **Compute & code parity**
   - **Lambda** orchestration functions (packaged by `archive_file` from inline heredoc to keep single-file constraint) for:
     - `masking_handler`
     - `dynamodb_refresh_handler`
     - `aurora_refresh_handler`
     - `s3_sync_handler`
     - `integration_tests_handler`
   - Use identical env-config shape as prod (names/keys via SSM Parameters) to preserve **config parity**.
4. **Automation**
   - **EventBridge** rule (daily) → **Step Functions** state machine that orchestrates:  
     S3 sync → DynamoDB export/import → Aurora snapshot clone + SQL mask → run integration tests → publish metrics.  
   - **AWS Systems Manager**:  
     - SSM **Automation Document** to run DB snapshot clone & SQL masking via `aws:executeScript`.  
5. **Observability**
   - **CloudWatch dashboards** (overall + per-service via `for_each` over `var.service_names`) showing: refresh success rate, durations, masked rows count, test failures, queue depths.
   - Log groups with retention, metric filters, alarms (failure of state machine, error rates, throttles).
6. **Parity validation**
   - Weekly **EventBridge** rule triggers a Lambda that:  
     - Lists expected resources (from locals), compares against live (via SDK), and writes **drift report** to S3 + emits metrics.  
     - If drift < threshold, attempt **auto-remediation** (invoke targeted Terraform via SSM or call a remediation branch).
7. **Scalability**
   - Per-service **independent scaling** scaffolding: define autoscaling targets/policies for a generic compute layer (assume services are Lambda/ECS; expose knobs via variables). Do not create 234 stacks; use `for_each` over `var.service_names`.
8. **Encryption**
   - Dedicated **KMS keys** for: test data, logs, SSM, and S3. Aliases should mirror prod naming conventions (e.g., `alias/app-${each.value}-test`).

## Variables & conventions (expand as needed)
- `aws_region` (string, default `us-west-2`) ← consumed by `provider.tf`.  
- `vpc_cidr`, `public_subnet_cidrs`, `private_subnet_cidrs`, `enable_nat`  
- `service_names` (list(string)) — sample defaults `["billing", "ledger", "auth"]`  
- `ddb_tables` (map(object{ name=string, hash_key=string, range_key=optional(string), billing_mode=string }))  
- `aurora_engine`, `aurora_instance_class`, `aurora_username`, `aurora_password` (sensitive), `aurora_db_name`  
- `artifact_bucket_name`, `data_bucket_name`, `staging_bucket_name`  
- `masking_rules` (map(string)) — e.g., column regex → replacement; used by masking Lambda/SSM.  
- `prod_account_id` and ARNs for cross-account read (as variables; wire into IAM trust policies).  
- Global `tags` map applied to all resources.

## Outputs (at minimum)
- VPC ID, subnet IDs (grouped), security group IDs  
- S3 bucket names/arns, DynamoDB table names, Aurora endpoint  
- KMS key ARNs (per purpose)  
- Step Functions ARN, EventBridge rule name, SSM doc name  
- CloudWatch dashboard names/urls, drift report S3 URI

## IAM & least privilege
- Create IAM roles/policies for each Lambda and the state machine with **minimal** actions (S3, DDB export/import, RDS snapshots, KMS decrypt/encrypt, SSM:GetParameter, CloudWatch:PutMetricData).  
- Cross-account read from prod: trust `prod_account_id` (variable) and **restrict resource ARNs**.

## Data masking approach (encode in code)
- **Aurora**: run parameterized SQL in SSM Automation to **replace PII columns** per `var.masking_rules`.  
- **DynamoDB**: export to S3 → masking Lambda transforms → import to test table (full replace).  
- **S3**: use S3 Batch Operations or Lambda to copy **keys & metadata only**, then mask object payloads where needed.

### Environment-specific variables
Use var-files for env values (don’t hard-code):
- `dev.tfvars`, `prod.tfvars`
- Run:
  - `terraform workspace select dev && terraform apply -var-file=dev.tfvars`
  - `terraform workspace select prod && terraform apply -var-file=prod.tfvars`
- Example (`dev.tfvars`): set `aws_region`, CIDRs, instance sizes, KMS aliases, table lists, etc.

## File expectations
- Return **only one fenced code block** with language `hcl` that is a complete `tap_stack.tf`.  
- Use `locals {}` for naming, tags, and parity catalogs.  
- Use `for_each` to fan out resources per `service_names` and `ddb_tables`.  
- Use `data "archive_file"` with heredoc inline code for Lambda zips to keep single-file constraint.  
- Mark secret variables `sensitive = true` and pass via env vars/SSM refs.  
- Do **not** modify providers/backends; assume `provider.tf` already exists and uses `var.aws_region`.

## Acceptance criteria
- Plan/apply succeeds in an empty AWS account (after filling secrets).  
- Creates new VPC + subnets, KMS keys, S3 buckets, DynamoDB tables, Aurora cluster, SSM params, Lambdas, Step Functions, EventBridge rules, CloudWatch dashboards/alarms.  
- Daily refresh & weekly parity **wired** (state machine + schedules) with clear placeholders for prod ARNs and masking rules.  
- Outputs expose all critical entry points.  
- Resource tagging applied consistently.  
- No external modules or files required.

**Now generate the complete `tap_stack.tf` in a single ` ```hcl ` code block. Do not include any explanations outside the code block.**
# Project: TapStack — New Build with Managed Stack Operations (us-west-2)

## Objective

Produce an end-to-end, production-ready infrastructure **from scratch** in **us-west-2** using AWS CloudFormation, along with a Python orchestration script (Boto3) to create, update, and delete the stack safely with best practices, detailed logging, retries, notifications, and automated validation/tests.

## Functional scope (build everything new)

* Build **all** required resources as **new** resources; no references to pre-existing infrastructure.
* Include networking (VPC, public/private subnets, NAT, route tables), compute (ASG + Launch Template), load balancing (ALB), storage (S3 with lifecycle), database (RDS, encrypted), IAM (least-privilege roles/policies), logging/monitoring (CloudWatch Logs/Alarms, VPC Flow Logs), security/audit (KMS CMKs with rotation, CloudTrail multi-region on), and an example Lambda with a matching log group name.
* Add an SNS topic for notifications.
* Ensure every created resource name is suffixed with `ENVIRONMENT_SUFFIX`.

## Region & naming guarantees

* Target region is **us-west-2**.
* All logical/resource names MUST include `ENVIRONMENT_SUFFIX` to avoid cross-environment collisions.
* Enforce a **safe naming regex** for `EnvironmentSuffix` using `AllowedPattern` (e.g., `^[a-z0-9-]{2,20}$`).
* **Do not** hardcode restrictive `AllowedValues` lists for `EnvironmentSuffix`.

## Constraints & standards

* YAML template only (no JSON).
* Parameters must have sensible defaults so the stack can be deployed non-interactively in CI/CD.
* Align with AWS best practices: least privilege IAM, encryption at rest and in transit, no public S3 ACLs, blocked public access on buckets, minimal inbound exposure, and controlled egress.
* Use Conditions/DependsOn only where necessary; avoid circular dependencies.
* Validate the template structure and include `Metadata` for documentation and version notes.

## Security requirements

* KMS CMKs with rotation enabled for logs and data where applicable.
* CloudTrail enabled (include global service events; multi-region), logs encrypted.
* S3 buckets versioned, encrypted (KMS), and public access blocked.
* No plaintext secrets in the template.

## Template requirements (TapStack.yml)

* **Parameters**:

  * `ProjectName` (regex-validated), `EnvironmentSuffix` (safe regex), CIDR blocks, instance types, key networking toggles, notification email(s), RDS engine/version/size, ALB health check path/port, and any other values required for a full new build.
  * Provide **sensible defaults** for all parameters so the template can deploy in pipelines without CLI overrides.
* **Mappings/Conditions**: AZ lookups or sensible defaults for us-west-2; optional toggles for creating optional components.
* **Resources**:

  * VPC + 2+ AZ public/private subnets, NAT Gateways (cost-aware designs accepted), IGW, route tables/associations.
  * Security groups with least-privilege inbound/outbound and clear, documented rules.
  * Launch Template + Auto Scaling Group tied to an ALB Target Group with listener rules and health checks.
  * RDS (Multi-AZ recommended), encrypted with KMS; subnet group in private subnets; SG rules locked down.
  * S3 (artifacts/logs) with lifecycle policies (e.g., transition older logs to Glacier).
  * CloudWatch: Log groups (with KMS), metric filters/alarms for key signals (e.g., ALB 5xx, ASG unhealthy host count, RDS CPU), and VPC Flow Logs to a log group or S3 (encrypted).
  * CloudTrail: multi-region trail → KMS-encrypted destination (S3 or CloudWatch Logs).
  * Example Lambda (Python 3.12) + IAM role/policy with least-privilege; **log group name must match function**.
  * SNS topic for stack notifications; **parameterize** subscription email(s).
* **Outputs**: Export ARNs/IDs/Names for VPC, subnets, ALB DNS, ASG name, RDS endpoint, S3 bucket(s), KMS keys, CloudTrail trail name/ARN, SNS topic ARN, and Lambda name/ARN.
* **Metadata**: Template author, version, changelog notes, and a brief description of major resources.
* **Resiliency**: Ensure idempotent creation; handle common `DELETE_FAILED` and name-collision edge cases via unique naming with `ENVIRONMENT_SUFFIX`.

## Python stack manager (cloudformation_manager.py)

* Language: Python 3.11+ using **Boto3**.
* Region forced to **us-west-2**.
* Reads sensitive values (AWS keys, notification email, etc.) from **environment variables** only.
* Features:

  * Create/Update/Delete operations with intelligent **change set** usage to minimize downtime where applicable (rolling updates on ASG, health-check aware ALB target registration, `MinHealthyPercent` style behaviors where relevant).
  * **Template validation** before any action (`validate_template`).
  * **Automated rollback** on failure (`Capabilities` set correctly; waiters used to monitor progress).
  * **Detailed logging** (structured logs with operation IDs; include stack events on failure).
  * **Retries with backoff** for transient errors; explicit **timeouts** to avoid indefinite waits.
  * **Graceful exception handling** for common states (e.g., `UPDATE_ROLLBACK_IN_PROGRESS`, `DELETE_FAILED`, resource already exists).
  * **Safe concurrency**: gracefully handle the “stack is in progress” condition; avoid concurrent updates; surface actionable messages.
  * **Notifications**: On success/failure, publish a status message to the SNS topic defined in the stack (look up the Output by key) or fall back to an email/SNS ARN in env vars.
  * **Verification step**: After successful updates, perform read-backs (e.g., describe stack outputs, confirm ALB health checks passing, ASG desired capacity met, RDS available) before reporting **final success**.
* Packaging & usage: a single script runnable as:

  * `python cloudformation_manager.py validate`
  * `python cloudformation_manager.py create --stack-name tapstack-<ENVIRONMENT_SUFFIX> --template TapStack.yml`
  * `python cloudformation_manager.py update --stack-name ... --template TapStack.yml`
  * `python cloudformation_manager.py delete --stack-name ...`
* Logging: prints to stdout and writes to a local rotating log file; redact any secrets.

## Automated tests & validation

* Provide a minimal automated test (e.g., `pytest` or a built-in `--self-test` command) that:

  * Validates `TapStack.yml` via Boto3 `validate_template`.
  * Mocks Boto3 clients (where live credentials are not present) to verify create/update/delete flows, retries, and exception handling.
  * Lints the template structure (e.g., basic intrinsic function sanity and required parameters) without external internet calls.

## Edge cases to handle

* Stack already exists; choose **update** path with change set.
* Stack in `ROLLBACK_COMPLETE` or `UPDATE_ROLLBACK_FAILED`; surface remediation guidance or allow forced delete with confirmation flag.
* `DELETE_FAILED` resources; attempt clean-up with targeted retries and clear user guidance.
* Idempotent “no updates” results; log and exit 0.
* Transient throttling (`ThrottlingException`), network hiccups, and eventual consistency delays.

## Deliverable

1. `TapStack.yml` — a **complete** CloudFormation YAML template (not JSON) that builds all modules new with parameters, conditions, resources, outputs, encryption, logging, alarms, and strict naming via `ENVIRONMENT_SUFFIX` (safe regex, no hard `AllowedValues`).
2. `cloudformation_manager.py` — a Python 3 script using Boto3 that validates, creates, updates (with minimal downtime), deletes, logs verbosely, retries transient failures, enforces timeouts, publishes SNS notifications, reads secrets from environment variables, and runs a basic automated self-test to confirm integrity.

## Acceptance criteria

* Template passes `ValidateTemplate` and deploys cleanly in **us-west-2** with default parameters.
* All resource names include `ENVIRONMENT_SUFFIX`; no hardcoded AllowedValues lists for `EnvironmentSuffix`.
* Python script prevents concurrent updates, rolls back on failure, provides clear logs, and sends final status notifications.
* Basic automated tests run locally without real AWS calls (mocked) and pass.
* No placeholders or TODOs; production-ready outputs and documentation present.
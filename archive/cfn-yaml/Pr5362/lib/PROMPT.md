You’re an AWS Solutions Architect. Please produce one CloudFormation YAML template (single file) targeting eu-central-1 that deploys an automated infrastructure analysis & compliance validation system for a financial-services environment.

**What it should do (high level):**

* Inspect CloudFormation stacks/resources, check encryption at rest, public exposure risks, required tags, and cross-stack references (every `Fn::ImportValue` must resolve to an existing Export in the same account/region).
* Produce **per-stack JSON reports** (summary + detailed) with timestamps, request IDs, and a deterministic `evaluationId`; store them in S3 under `account/region/stackId/date/`.
* Alert via SNS when violations meet a severity threshold; also run a **scheduled backstop** so evaluations happen within **15 minutes** of changes.

**Required components & constraints:**

* **Lambdas (Python 3.12):** `AnalyzerFunction` and `PeriodicScanFunction`

  * **Timeout ≤ 300s**, memory 512–1024 MB, environment variables **KMS-encrypted**, each with an **encrypted SQS DLQ**, dedicated **CloudWatch Log Groups** (retention **365 days**, logs encrypted with CMK).
* **EventBridge:** one rule for CloudFormation stack lifecycle events; one **scheduled** rule (e.g. `rate(10 minutes)`) to trigger the periodic scan. Targets pass structured inputs (source, account, region, stack IDs when available).
* **S3 storage:** two buckets (`compliance-reports`, `analysis-results`) with **versioning enabled**, **Block Public Access = true** (all 4 flags), **SSE-KMS using a customer-managed CMK** from this template, and a lifecycle policy: **transition current objects to Glacier (Flexible Retrieval) after 90 days** and **noncurrent versions after 90 days** (`Transitions -> TransitionInDays`, `NoncurrentVersionTransitions -> NoncurrentDays`). Buckets should apply least-privilege policies for the analyzer.
* **KMS:** one CMK (with alias) used by **S3, CloudWatch Logs, SNS, SQS DLQs, and Lambda env**; key rotation enabled; admin separation & least-privilege policy.
* **SNS:** a topic for violation alerts, **encrypted with the CMK**. **Email subscription is optional**—parameter may be empty; create the subscription **only** when it’s non-empty (template must deploy without an email).
* **IAM:** separate execution roles, least-privilege permissions (CloudFormation read/list, Tagging APIs, minimal S3/KMS/SNS/SQS as needed), and **explicit Deny** guardrails (e.g., `kms:ScheduleKeyDeletion`, `kms:DisableKey`, `s3:PutBucketAcl` with public grants, wildcard `iam:PassRole`).
* **Compliance checks implemented by code** in the analyzer, including encryption, public access, missing tags, and cross-stack Import/Export integrity. Include a simple but working inline Python 3.12 implementation (no placeholders for core logic).
* **Parameters & outputs:**

  * Parameters: `NotificationEmail` (optional; empty allowed with regex), `RequiredTags`, `PublicEndpointAllowlist`, optional bucket names, `KMSKeyAlias`, `ScanScheduleRate`, `AlertSeverityThreshold`.
  * Outputs: ARNs/names for buckets, Lambdas, SNS, KMS key/alias, EventBridge rules, and base S3 URI for reports.

**Quality expectations:**

* **cfn-lint clean.** Use correct IAM actions (e.g., `s3:GetEncryptionConfiguration`), correct lifecycle keys (`TransitionInDays` for current objects; `NoncurrentDays` for noncurrent versions).
* Single YAML file, clear descriptions, sane defaults, reusable via Parameters/Conditions, deterministic names.
* No plaintext secrets; all at-rest data uses **SSE-KMS**.
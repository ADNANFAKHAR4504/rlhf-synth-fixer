**Task context (what the user wanted)**
Deliver one production-ready **CloudFormation YAML** template for a compliance analyzer in `us-east-1` that: inspects stacks, writes **KMS-encrypted** JSON reports to S3, triggers on CloudFormation events + schedule, keeps **365-day** logs, uses **least-privilege IAM**, and supports **optional email** notifications without requiring an email at deploy time. Output must be a **≤5-line preface** followed by **one fenced `yaml` block only**. Must be **cfn-lint clean** and satisfy all quality gates.

**What the model delivered**
A long narrative with “Reasoning Trace”, extra sections (features, CLI steps, sample JSON), then a YAML. It also hard-requires an email and misses several policy/details the spec mandates.

---

## Exact Failures (map each to the spec)

1. **Output format violation**

* Added “Reasoning Trace”, feature bullets, CLI instructions, and example JSON outside the single YAML block.
* Spec: **Only** ≤5-line preface + **one fenced `yaml`**. No other text.

2. **Email optionality broken**

* `NotificationEmail` lacks `Default: ""` and the SNS subscription is **unconditional**.
* Spec: deployment must succeed **without** email; subscription **only** when email is non-empty via a condition (e.g., `HasNotificationEmail`).

3. **Wrong IAM action for S3 encryption check**

* Used `s3:GetBucketEncryption`.
* Quality gate: must use **`s3:GetEncryptionConfiguration`** (avoids cfn-lint W3037).

4. **S3 bucket policy gaps**

* Missing **deny** on `PutObject` unless `aws:kms` SSE is specified (check `s3:x-amz-server-side-encryption`).
* Must also include **deny non-TLS** (`aws:SecureTransport=false`) on both buckets.

5. **KMS key policy principals incomplete**

* CMK is used by Logs, SNS, SQS, Lambda, but key policy does not grant all required service principals (e.g., `sqs.amazonaws.com`).
* Risk: runtime KMS decryption/GenerateDataKey failures for queues/logs/Lambda env.

6. **Conditional resources & parameters**

* No condition guarding the SNS email subscription.
* Spec: create subscription **only if** email provided; stack must deploy cleanly with default parameters.

7. **IAM least-privilege precision**

* Broad resources for logs/S3; should scope to log group ARN patterns and bucket/object ARNs already in the template.
* Must keep explicit **deny** list (key deletion, disabling KMS, S3 ACLs, `iam:PassRole`) per spec.

8. **Log retention & KMS encryption**

* Log groups present, but ensure both **RetentionInDays = 365** and **KmsKeyId** are set (the spec is explicit). Verify both functions’ log groups comply.

9. **Lifecycle configuration correctness**

* Must use **TransitionInDays** for both current and noncurrent transitions to GLACIER after **90 days**; avoid unsupported properties and mismatched casing.

10. **Outputs completeness**

* Ensure all named outputs are present and useful: bucket names/ARNs, function ARNs, EventBridge rule ARNs, **KMS KeyId and Alias**, helpful S3 base URI.

11. **Lambda configuration gates**

* Runtime must be **python3.12**; timeout **≤ 300s**; DLQs configured; environment encryption via CMK; memory reasonable (512–1024 MB).

12. **EventBridge coverage**

* Must include both: CloudFormation **stack status change** rule and **scheduled** scan rule, with permissions for Events→Lambda.

---

## Why this matters (impact/risk)

* **Deployability:** Hard-required email blocks “no-param” deploys; extra text breaks the required output format pipeline.
* **Security:** Missing SSE-KMS enforcement on `PutObject` and incomplete KMS principals can leave data unencrypted or cause runtime failures.
* **Lint/compliance:** Wrong IAM action fails a stated quality gate.
* **Operability:** Missing denies/over-broad IAM contradict least-privilege and audit expectations.

---

## Regeneration Instructions (follow exactly)

1. **Output discipline**

* Produce **only**: a **≤5-line preface** and a **single fenced `yaml`** template. No reasoning, no extra sections, no CLI, no JSON, no prose after the YAML.

2. **Parameters & conditions**

* Add `NotificationEmail` with **`Default: ""`** and a `HasNotificationEmail` condition.
* Create the **SNS subscription only when `HasNotificationEmail` is true**.

3. **KMS**

* One CMK with rotation enabled.
* Key policy must permit: `logs.amazonaws.com`, `sns.amazonaws.com`, `sqs.amazonaws.com`, and `lambda.amazonaws.com` for the minimal actions (Encrypt/Decrypt/GenerateDataKey/CreateGrant/DescribeKey) necessary.

4. **S3 buckets (reports & results)**

* Versioning enabled, public access block = true for all four flags.
* **BucketEncryption** with **SSE-KMS** using the CMK.
* **Lifecycle**: Transition to GLACIER after **90 days** for current and **noncurrent** versions via **TransitionInDays**.
* **BucketPolicy**:

  * Deny any request with `aws:SecureTransport=false`.
  * Deny `s3:PutObject` unless `s3:x-amz-server-side-encryption = aws:kms`.
  * Allow analyzer Lambda role only the exact list/list-bucket and get/put on the two buckets.

5. **IAM**

* Two roles (Analyzer, PeriodicScan) with:

  * Logs: create stream/put events (scoped to function log group ARN).
  * S3: list on buckets, get/put on objects.
  * CloudFormation read (Describe/List/GetTemplate*).
  * Tagging read for compliance checks.
  * S3 target checks: **use `s3:GetEncryptionConfiguration`** not `GetBucketEncryption`.
  * EC2/RDS/ELB describe calls as needed.
  * KMS use on the CMK (Encrypt/Decrypt/GenerateDataKey*/DescribeKey).
  * SNS publish to violations topic (Analyzer only).
  * SQS send/get attributes to their DLQs.
  * **Explicit Deny**: KMS disable/schedule deletion, S3 bucket/ACL mutation, `iam:PassRole`.

6. **Lambda functions**

* `AnalyzerFunction` and `PeriodicScanFunction`:

  * **Runtime python3.12**, **Timeout ≤ 300s**.
  * DLQ configured.
  * Env vars for buckets, topic ARN, required tags, allowlist, severity threshold, CMK id.
  * KmsKeyArn set (env encryption).
  * Inline code that: lists stacks, analyzes S3/RDS/public exposure/tags, produces **summary** and **detailed** reports to S3 (KMS), and publishes SNS above threshold; periodic function invokes analyzer on schedule.

7. **EventBridge**

* Rule for **CloudFormation Stack Status Change** events (CREATE_COMPLETE, UPDATE_COMPLETE, UPDATE_ROLLBACK_COMPLETE) targeting the analyzer (include Lambda permission).
* **Scheduled** rule (5/10/15 minutes; default 10) targeting the periodic scan (include permission).

8. **Logs**

* Two explicit log groups with **RetentionInDays=365** and **KmsKeyId = CMK ARN**.

9. **Outputs**

* Bucket names/ARNs, function ARNs, SNS topic ARN, EventBridge rule ARNs, **KMS KeyId** and **Alias**, and a helpful **S3 base URI** for reports.

10. **Lint & gates**

* Must be **cfn-lint clean** (no E/W).
* Honor all quality gates listed above (runtime, retention, IAM action names, lifecycle semantics, SSE-KMS enforcement).

---

## Acceptance Checklist (grader uses this to pass/fail)

* Output is exactly **≤5 lines preface + one fenced `yaml`** block; nothing else.
* Stack deploys **without** providing `NotificationEmail`.
* SNS email subscription is created **only** when a non-empty email is provided.
* Buckets enforce TLS and **reject PutObject without `aws:kms` SSE**.
* IAM uses **`s3:GetEncryptionConfiguration`** (not `GetBucketEncryption`).
* Log groups have **365** retention and **KMS**.
* CMK key policy includes **logs, sns, sqs, lambda** service principals.
* Lifecycle transitions to **GLACIER** after **90 days** for current and noncurrent.
* Both Lambdas are **python3.12**, **≤300s**, with DLQs and KMS env encryption.
* EventBridge rules exist and have Lambda invoke permissions.
* Outputs include all identifiers listed above.

ID: CDK_PY_HRD_S3_VERSIONING_1c2d3e_4z5a6b7cQR
Title: CDK (Python) – S3 Versioned Storage with Legal Retention & Compliance Monitoring
Owner: Abubakar

## Context
A legal firm must store ~15,000 documents per day with strict versioning and audit/compliance needs. Data must be encrypted, retained for at least 90 days, access must be auditable, and monitoring/alerting should be in place. The solution must be account-agnostic and parameterized for reuse across environments.

## Goals
Build an AWS CDK (Python) stack that provisions:
1) S3 bucket with **versioning** enabled.
2) **Legal retention**: enforce minimum 90-day retention.
   - Prefer **S3 Object Lock** (COMPLIANCE mode) at bucket creation if possible.
   - Add lifecycle policies that do NOT delete versions before 90 days.
3) **Encryption at rest**: KMS CMK (customer-managed key) with key rotation.
4) **Access auditability**: CloudTrail data events for the bucket (read/write) enabled.
5) **Monitoring/metrics**: CloudWatch metrics/alarms + a small dashboard (storage bytes, 4xx/5xx errors if available, object count).
6) **Secure access**: IAM least-privilege roles/policies, bucket policy to require TLS, deny unencrypted PUTs, and optionally prevent bypassing Object Lock.
7) **Access logging**: Either S3 server access logs to a dedicated logging bucket or rely on CloudTrail (include both if feasible; keep logs separate from primary data).
8) **Cost controls**: Basic lifecycle class transitions optional (e.g., STANDARD → INTELLIGENT_TIERING) but never violate the 90-day legal minimum retention.

## Deliverables
Produce a self-contained CDK Python project with:
- `app.py` wiring a stack named `LegalDocsStorageStack`.
- `legal_docs_storage_stack.py` implementing all resources.
- `cdk.json`, `requirements.txt`, `.gitignore`.
- `README.md` with deploy/test/teardown steps and security notes.
- **Unit tests** (`tests/`) using `pytest` and `aws_cdk.assertions` to validate:
  - Bucket versioning = enabled.
  - Object Lock = enabled (if implemented) in COMPLIANCE mode.
  - Lifecycle rule(s) ensure no deletion < 90 days.
  - KMS key exists; bucket encryption = SSE-KMS with that key.
  - CloudTrail data events enabled for this bucket (read & write).
  - Bucket policy denies `aws:SecureTransport = false` and denies unencrypted uploads.
  - Alarms and (optional) dashboard created.
- Optional: **Integration test plan** (no real deploy required) describing how to verify Object Lock/retention and CloudTrail events in a live account.

## Implementation Requirements
- **CDK Language**: Python (AWS CDK v2).
- **No hardcoding of account/region**. Use environment variables/context or CDK defaults.
- **Parameters/Context**:
  - `bucketName` (optional; otherwise auto-name with stack suffix),
  - `enableObjectLock` (bool; default true if supported),
  - `retentionDays` (default 90),
  - `logBucketName` (optional; else create one),
  - `alarmEmail` (SNS topic/email optional).
- **S3 Bucket**:
  - `versioned=True`.
  - If `enableObjectLock`: create bucket with `object_lock_enabled=True` and set default retention (COMPLIANCE, 90 days).
  - Block all public access.
  - Enforce SSL/TLS (`aws:SecureTransport`).
  - Deny unencrypted PUTs (require `x-amz-server-side-encryption: aws:kms`).
- **KMS**:
  - Create a CMK with rotation enabled, alias `alias/legal-docs-bucket`.
  - Grant bucket access; scope IAM to least privilege.
- **CloudTrail**:
  - If a Trail doesn’t exist in the stack, create one limited to S3 data events for this bucket (read/write).
- **Logging**:
  - Create a separate log bucket with its own KMS or S3-managed encryption, versioning on, and restricted access.
  - Enable S3 server access logging from primary bucket → log bucket (if implemented).
- **Monitoring**:
  - Create CloudWatch Alarms on relevant S3 metrics (e.g., 4xx/5xx error rates if request metrics are enabled, or storage size thresholds).
  - Optionally create a small CloudWatch Dashboard summarizing key graphs.
  - If `alarmEmail` provided, create SNS topic/subscription and wire alarms.
- **IAM**:
  - Example read/write role for an “ingestion” principal with least privilege (no delete of versions before retention).
  - Bucket policy to avoid bypassing Object Lock (document constraints if applicable).
- **Lifecycle**:
  - Lifecycle rule that transitions objects to cheaper storage (optional) but never deletes or expires versions before `retentionDays`.
  - Explicitly state that deletion markers and expired versions must not remove data before legal retention.

## README.md Must Include
- Prereqs: Python, CDK v2, bootstrapping notes.
- How to set context/parameters.
- Deploy commands: `cdk synth`, `cdk diff`, `cdk deploy`.
- Validation steps post-deploy (how to check versioning, Object Lock defaults, CloudTrail data events).
- How to test: `pytest -q`.
- Teardown cautions: Object Lock may block deletion until retention expires.

## Testing (Unit)
Write `pytest` tests that assert synthesized template contains:
- `AWS::S3::Bucket` with VersioningConfiguration = Enabled.
- If enabled: `ObjectLockEnabled: true` and default retention policy in compliance mode with specified days.
- `BucketEncryption` using KMS CMK (not AES256).
- Lifecycle configuration with retention ≥ 90 days (no deletes < retention).
- `AWS::KMS::Key` with rotation.
- `AWS::CloudTrail::Trail` with S3 data event selectors for this bucket.
- `AWS::CloudWatch::Alarm` resources and (optional) `AWS::CloudWatch::Dashboard`.
- Bucket Policy statements for `aws:SecureTransport` and unencrypted PUT deny.

## Style & Quality
- Clean, documented Python code (type hints where reasonable).
- Clear variable naming and separation of concerns.
- No placeholder ARNs. All resources created in-stack and referenced by logical IDs.
- Tags: add standard tags (Owner=Abubakar, System=LegalDocs, Compliance=Yes, Environment).

## Output
Return:
1) Full project tree.
2) All source files’ contents.
3) Exact commands to install, synth, test, and deploy.
4) Brief note on tradeoffs (Object Lock implications, cost, and operational caveats).

Build now.

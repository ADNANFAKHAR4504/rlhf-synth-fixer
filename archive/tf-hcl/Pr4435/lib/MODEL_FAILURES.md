```
# Failure Points & Fixes — `tap_stack.tf`

This document lists the real issues we hit (or narrowly avoided) while hardening `tap_stack.tf`, why they failed in CI/unit/E2E, and the exact fixes we applied. It mirrors how your final stack now passes **all unit tests** and **all integration tests** without skipping anything.

---

## 1) CloudTrail → CloudWatch Logs: missing delivery permissions

**Symptoms**
- Trail created with `cloud_watch_logs_group_arn` and `cloud_watch_logs_role_arn`, but delivery failed intermittently.
- E2E relied on S3 listing only because log delivery permissions were incomplete.

**Root cause**
- The role policy didn’t include the exact `logs:CreateLogGroup` / `CreateLogStream` / `PutLogEvents` permissions targeting the log group ARN pattern that CloudTrail uses.

**Fix**
- Add an explicit **role** `cloudtrail_to_cwl` and an **inline policy** that allows:
  - `logs:CreateLogGroup`, `logs:DescribeLogGroups` on `*` (safe, scoped by service usage)
  - `logs:CreateLogStream`, `logs:PutLogEvents` on `${log_group_arn}:*` and `${log_group_arn}:log-stream:*`

**Why this passed tests now**
- CloudTrail can always create/append streams in the dedicated log group.
- Unit tests assert presence of the role + policy; E2E observes S3 delivery and log events reliably.

---

## 2) KMS policy: missing grant context for CloudWatch Logs

**Symptoms**
- Occasional KMS access denials when CloudTrail writes to CW Logs with KMS encryption enabled.

**Root cause**
- KMS key policy lacked the **`kms:GrantIsForAWSResource`** and `kms:EncryptionContext:aws:logs:arn` context line for the specific log group.

**Fix**
- Extend the CMK policy with a statement allowing `logs.${region}.amazonaws.com` to create grants **with resource context**, matching the log group ARN.

**Why this passed tests now**
- CloudTrail log events land encrypted without KMS errors.
- Unit tests look for the log group and KMS wiring; E2E spool logs appear after invoke.

---

## 3) Trail bucket policy too permissive / missing TLS-only

**Symptoms**
- Unit test flagged absence of deny-blocks.
- Potential for plain HTTP access or non-CloudTrail principals to write.

**Fix**
- Build policy via `data "aws_iam_policy_document"` with three core statements:
  - `AWSCloudTrailAclCheck` (bucket ACL check for CloudTrail service principal)
  - `AWSCloudTrailWrite` (PutObject with `"s3:x-amz-acl": "bucket-owner-full-control"`)
  - `DenyInsecureTransport` (deny any action if `aws:SecureTransport=false`)
- Added **optional** `DenyNonAllowlistedIPs` guarded by `length(var.ip_allowlist) > 0`.
- Wire the **selected JSON** into `aws_s3_bucket_policy.trail` using `local.trail_bucket_policy_json`.

**Why this passed tests now**
- Unit tests match the statement names and structure; E2E validates delivery to `AWSLogs/` and encryption posture.

---

## 4) HTTP API + WAF association: unsupported path

**Symptoms**
- Early variants tried to associate a regional WAF directly to **HTTP API stage**, producing deploy errors or dangling resources.

**Fix**
- Leave the association **disabled** for HTTP API (`count = 0`) and keep the WebACL for potential ALB/REST API/CloudFront attachment.
- Keep **optional WAF logging** guarded by `local.waf_logging_enabled`.

**Why this passed tests now**
- Unit tests verify the WebACL exists and that association block is present (but off). No runtime error in E2E.

---

## 5) Region handling & testability

**Symptoms**
- Hard-coded or implied region broke CI and tests in different AWS partitions/regions.

**Fix**
- Require `var.aws_region` with **regex validation** (`can(regex("^[a-z]{2}-[a-z-]+\\d$", var.aws_region))`) and **no default**.
- CI supplies the region; tests derive the region from `subnet_azs` as a fallback.

**Why this passed tests now**
- Unit test looks for the `can(regex(...))` shape.
- E2E works in whichever region CI injects.

---

## 6) EC2 IMDSv2 not enforced

**Symptoms**
- IMDS requests succeeded without a token; unit/E2E expect 401 without token and 200 with token.

**Fix**
- Add `metadata_options { http_tokens = "required" }` on the instance.
- E2E SSM script probes metadata with and without token to validate behavior.

**Why this passed tests now**
- Deterministic 401/200 flow observed from the instance. Unit test checks presence; E2E confirms behavior.

---

## 7) EC2 SSM management wasn’t guaranteed

**Symptoms**
- `InvalidInstanceId` or instance not appearing in SSM inventory; SSM commands errored.

**Fix**
- Create a dedicated **EC2 role** with **AmazonSSMManagedInstanceCore**, attach via instance profile.
- Add a **waiter** in tests (`DescribeInstanceInformation`) to ensure the instance is managed before running commands.

**Why this passed tests now**
- SSM RunCommand is reliable; integration steps (nginx diagnostics, psql install) work every time.

---

## 8) NAT/IGW routing & public IP on public subnets

**Symptoms**
- Instances reachable sometimes, NAT egress inconsistent for Lambda.

**Fix**
- Explicit IGW, public route table (`0.0.0.0/0 → igw-...`) + associations for **both** public subnets.
- NAT Gateway in public subnet A, private route table default via `nat-...` + associations for both private subnets.
- `map_public_ip_on_launch = true` on public subnets.

**Why this passed tests now**
- Unit tests assert IGW/NAT default routes and public mapping; E2E validates outbound DNS/TLS and Lambda egress to the Internet.

---

## 9) RDS posture: SSL enforcement, private, encrypted with CMK

**Symptoms**
- SQL connections didn’t require SSL; instance could be exposed publicly; missing KMS wiring.

**Fix**
- `aws_db_parameter_group` sets `rds.force_ssl = 1`.
- DB instance `publicly_accessible = false`, `storage_encrypted = true`, `kms_key_id = aws_kms_key.platform.arn`.
- Password stored in **SSM SecureString** under the platform CMK.

**Why this passed tests now**
- E2E from EC2 installs `psql`, sets `sslmode=require`, runs CRUD, and parses a deterministic `COUNT=1`.
- Unit verifies parameter group + encryption flags.

---

## 10) Lambda heartbeat packaging & least-privilege

**Symptoms**
- Inlined code paths and missing S3/SSM/KMS permissions caused 5xx or timeouts.

**Fix**
- Package with `data "archive_file"`; set VPC config (private subnets + SG); env vars for bucket/RDS/param name.
- IAM: allow `ssm:GetParameter` on **one** parameter, `kms:Decrypt` for the platform CMK, and `s3:PutObject` on `app/*`.

**Why this passed tests now**
- E2E invokes Lambda and observes **new `heartbeats/<ts>.json`** in app bucket and **CloudWatch logs** after invocation.

---

## 11) API Gateway IAM auth & SigV4 testing

**Symptoms**
- Unsigned calls got 403 as expected; signed path failed due to missing signer plumbing or credentials source.

**Fix**
- E2E test signs a request using the default AWS SDK credential chain (same creds used by other clients in the suite) against `execute-api`.
- Validate `2xx` on the signed request and **non-2xx** for the unsigned request.

**Why this passed tests now**
- No reliance on environment shell vars; signer reuses credentials that already succeed with SDK calls.

---

## 12) S3 posture (app bucket): versioning + public access block

**Symptoms**
- Bucket created without versioning or PAB; tests demanded secure posture.

**Fix**
- Enable versioning and **all** public access block flags on the app bucket.
- E2E fetches an object and asserts JSON content (`public_ip` and `ts`).

**Why this passed tests now**
- Unit validates posture; E2E confirms live write/read. An extra test proves **HTTP (non-TLS)** access is denied.

---

## 13) Output formatting & coverage

**Symptoms**
- Single-line compressed outputs and/or missing outputs caused unit checks to fail.

**Fix**
- Use standard multi-line `output` blocks for: VPC, subnets, IGW, route tables, SGs, EC2, API URL, Lambda name, RDS endpoint, S3 names, CloudTrail name, etc.

**Why this passed tests now**
- Unit suite enumerates keys and finds **canonical** `output "<name>" { ... }` blocks.

---

## 14) Optional features guarded by `count`

**Symptoms**
- Unused optional stacks (CloudFront, WAF logging) tried to deploy and failed without inputs.

**Fix**
- Guard with feature flags: `enable_cloudfront` and `local.waf_logging_enabled`, using `count = cond ? 1 : 0`.

**Why this passed tests now**
- Unit tests assert the `count` expressions exist; plan/apply is lean by default.

---

## 15) SG posture symmetry

**Symptoms**
- Drift between inline rules and standalone `aws_vpc_security_group_ingress_rule` resources.

**Fix**
- Keep **web** SG with HTTP 80 world-allow and optional SSH via dynamic block (driven by `allowed_ssh_cidrs`).
- DB ingress from **lambda** and **web** using dedicated `aws_vpc_security_group_ingress_rule` resources.

**Why this passed tests now**
- Unit asserts structure; E2E uses EC2→RDS and Lambda→S3 successfully.

---

## Verification Matrix

| Area | Unit | E2E |
|---|---|---|
| VPC/IGW/NAT/Subnets | ✔︎ (regex blocks) | ✔︎ (reachability + outbound TLS) |
| EC2 IMDSv2 | ✔︎ (presence) | ✔︎ (401 vs 200 curl) |
| EC2 SSM | — | ✔︎ (DescribeInstanceInformation waiter) |
| SG Posture | ✔︎ | ✔︎ (HTTP allowed, SSH not world-open) |
| RDS SSL + KMS + private | ✔︎ | ✔︎ (psql CRUD, sslmode=require) |
| S3 (app) Posture | ✔︎ | ✔︎ (new heartbeat object) |
| CloudTrail → S3/CWL | ✔︎ | ✔︎ (AWSLogs/ prefix, CW logs after activity) |
| Lambda packaging & perms | ✔︎ | ✔︎ (invoke + logs) |
| API GW IAM auth | — | ✔︎ (unsigned denied, signed allowed) |
| WAF & logging guards | ✔︎ | — |
| Outputs | ✔︎ | — |

---

### Final Note

All fixes were **surgical** to avoid breaking your working behavior while satisfying strict unit regex checks and real connectivity tests. The end state is production-lean: secure defaults, opt‑in heavy services, explicit encryption, and deterministic E2E probes.

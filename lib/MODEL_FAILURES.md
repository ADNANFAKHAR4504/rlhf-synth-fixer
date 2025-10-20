# model_failure

# Context

Failures typically arise when templates leave parameters uninitialized, omit encryption or logging requirements, weaken IAM scoping, or misconfigure networking so that private resources become exposed or unreachable. The following outlines common pitfalls and how to avoid them.

# Frequent failure modes

* **Uninitialized parameters**

  * Templates requiring values (e.g., `KeyName`) without defaults cause change-set creation to fail.
  * Remedy: provide safe defaults and conditions that omit optional properties when empty.

* **S3 naming and policy issues**

  * Hardcoding bucket names with uppercase or invalid characters leads to linter warnings or deployment errors.
  * Remedy: omit explicit names or ensure lowercase/dash/period only; enforce TLS and block public access via bucket policy.

* **Secrets in plaintext**

  * Passing DB passwords via Parameters triggers security lint warnings.
  * Remedy: use **Secrets Manager** and reference secrets with dynamic references at deployment time.

* **Over-permissive IAM**

  * Using wildcards across all buckets or KMS keys violates least-privilege requirements.
  * Remedy: scope IAM policies to the specific application bucket and the required KMS key ARNs; include only necessary actions.

* **Networking misconfigurations**

  * Missing NAT routes for private subnets or attaching the application instance to a public subnet breaks the security model.
  * Remedy: ensure dedicated private route tables with default routes via NAT Gateways and place the app EC2 only in private subnets.

* **RDS public exposure or missing Multi-AZ**

  * Setting `PubliclyAccessible: true` or `MultiAZ: false` violates constraints.
  * Remedy: keep the DB private with controlled SG ingress and enable Multi-AZ.

* **CloudTrail delivery failures**

  * Buckets lacking the correct ACL conditions or KMS permissions prevent log delivery.
  * Remedy: allow `cloudtrail.amazonaws.com` to `s3:PutObject` with `bucket-owner-full-control` and ensure a KMS key policy permits CloudTrail service use.

* **Missing encryption consistency**

  * Inconsistent use of KMS across S3, RDS, and logging leads to security findings.
  * Remedy: dedicate CMKs per service (or shared with explicit principals) and reference them consistently.

* **Alarm gaps**

  * Not wiring SNS topics or leaving email subscription unmanaged results in silent failures.
  * Remedy: create an SNS topic by default and add a conditional subscription when `AlarmEmail` is provided.

# Indicators of poor quality

* Multiple lint warnings (naming regex, unnecessary substitutions, plaintext secrets)
* Parameters without defaults that block change-set creation
* IAM policies with broad resource `*` or action `*` without justification
* Missing comments that explain intent and verification steps
* Region-agnostic assumptions that conflict with **us-west-2** constraints

# How to avoid regressions

* Keep all user-facing parameters initialized with safe defaults
* Prefer dynamic references for secrets
* Enforce TLS-only and block public access on S3 buckets
* Scope IAM to specific ARNs; include only necessary actions
* Maintain dual NAT Gateways for AZ egress resilience
* Test lints prior to delivery; ensure validate-template passes
* Preserve single-file design with clear section comments and comprehensive Outputs

# Model Failure Criteria – Pulumi Secure Infrastructure Configuration

This document outlines the conditions under which the implementation should be considered a failure. Any of the following issues indicate that the solution does **not** meet the specified requirements and should be rejected or revised.

---

## ❌ Encryption at Rest Failures

- S3 buckets do **not** have default encryption enabled.
- Buckets are encrypted with **SSE-S3** or **SSE-C**, instead of **AWS KMS (SSE-KMS)**.
- KMS keys are not explicitly defined or are improperly configured.
- Encryption does not apply to **existing** objects already in the bucket.

---

## ❌ Encryption in Transit Failures

- Endpoints (e.g. API Gateway, Load Balancer, S3 static website) allow **unencrypted HTTP access**.
- SSL/TLS is **not enforced** through redirect policies or security groups.
- TLS certificates are **self-signed** or **invalid** (e.g., not from ACM or a trusted CA).
- Certificates are not attached to relevant resources (e.g., load balancers, CloudFront, etc.).

---

## ❌ IAM Permissions Failures

- IAM roles or policies grant **broad permissions**, such as:
  - `iam:*`
  - `s3:*`
  - `*:*` on any resource
- Resources are not scoped using specific `Resource` ARNs (use of `"*"` instead).
- IAM roles are assigned to resources unnecessarily or redundantly.
- Lack of separation between roles for different responsibilities (e.g., data access vs. deployment logic).

---

## ❌ Code Quality / Structural Failures

- Pulumi program is not written in **Python**.
- Project is **not implemented in a branch** named `secure-setup`.
- Infrastructure code lacks **unit tests**, or tests fail to validate:
  - S3 encryption configuration
  - TLS enforcement on endpoints
  - IAM role permissions
- Tests fail or return errors during execution.
- Pulumi files (`__main__.py`, `Pulumi.yaml`, etc.) are missing or malformed.

---

## ❌ Deployment Behavior Failures

- Resources are created in an **insecure** state, requiring manual patching.
- Changes are **not idempotent**—running `pulumi up` twice yields unexpected diffs.
- Stack produces **errors or warnings** related to permissions, encryption, or security posture.

---

## ❌ Documentation / Configuration Failures

- No explanation for critical design choices (e.g., IAM policy boundaries, key rotation settings).
- Missing or incorrect Pulumi configuration values (`Pulumi.<stack>.yaml` misconfigured).
- No clear way to run or validate the unit tests.

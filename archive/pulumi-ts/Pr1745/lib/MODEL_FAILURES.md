# MODEL_FAILURES.md

This file documents where the model’s response in `MODEL_RESPONSE.md` failed to satisfy `PROMPT.md`.

---

## 1. Wrong Region Coverage
- **Expected:** Only `us-east-1` and `us-west-2`.
- **Model Output:** Added **`eu-central-1`** (not in prompt).

---

## 2. Database Credentials
- **Expected:** DB password stored in Pulumi config or Secrets Manager.
- **Model Output:** Hardcoded password `TempPassword123!`.

---

## 3. Central Log Bucket
- **Expected:**
  - Must use pre-defined name `nova-central-logs-prod`.
  - Must be encrypted with `alias/nova-web-kms`.
  - Bucket policy must block public access, only allow VPC endpoints.
- **Model Output:**
  - Created a new **KMS key** instead of using alias `alias/nova-web-kms`.
  - Used bucket name constant, but enforced a **new alias binding**, not the provided alias.
  - Policy used `"aws:sourceVpce": "vpce-*"` (wildcard, unrealistic placeholder).

---

## 4. IAM & Least Privilege
- **Expected:** IAM roles with **minimal privileges** (EC2: S3 read, CloudWatch; Lambda: S3 write + CloudWatch).
- **Model Output:** 
  - Lambda role had broad S3 `Get/Put/DeleteObject` permissions without scoping to log bucket.
  - EC2 role did not demonstrate S3 artifact access logic (if needed).

---

## 5. WAF Configuration
- **Expected:** Attach **AWSManagedRulesOWASPTop10RuleSet**.
- **Model Output:** Implemented correctly, but metrics naming inconsistent with requirement.

---

## 6. Encryption
- **Expected:** Use provided alias `alias/nova-web-kms` for RDS & S3 encryption.
- **Model Output:** Created fresh KMS keys per service, rather than referencing alias.

---

## 7. Tests
- **Expected:** 
  - Unit tests check ASG min/max, RDS encryption, log bucket lifecycle, Lambda runtime.
  - Integration tests check connectivity, RDS non-public, WAF, central logging bucket, Lambda wiring, region coverage.
- **Model Output:** 
  - Unit test file truncated (incomplete).
  - No integration test file delivered at all.

---

## 8. Other Issues
- **Hardcoding:** RDS final snapshot includes `Date.now()` → nondeterministic, unsuitable for IaC.
- **TLS:** ALB only had HTTP listener, missing TLS (HTTPS) requirement.
- **Tags:** Tags mostly correct, but missing explicit `Name` tags in some resources.

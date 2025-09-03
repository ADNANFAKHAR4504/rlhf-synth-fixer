# Gaps and Issues in lib/MODEL_RESPONSE.md vs lib/PROMPT.md

- **MFA enforcement missing**: Password policy is set, but there is no IAM/SCP policy enforcing MFA for users (e.g., deny when `aws:MultiFactorAuthPresent` is false). The prompt requires MFA for all IAM users.

- **DDoS protection not implemented**: It states AWS Shield Standard is enabled by default but provides no configuration or compensating controls (e.g., WAF). Clarify Shield Standard’s automatic nature or provision WAF/Shield Advanced where appropriate.

- **Encryption in transit not enforced**: S3 bucket policies do not deny non‑TLS (`aws:SecureTransport = false`). This violates the “in transit” part of the encryption requirement.

- **S3 bucket hardening incomplete**:
  - Not all buckets (main, CloudTrail, Config) enforce SSE‑KMS on PutObject via bucket policy headers and key ID.
  - CloudTrail and Config buckets lack explicit versioning and SSE configuration resources.
  - The access‑logs bucket lacks explicit permissions for log delivery and ownership controls.

- **CloudTrail best practices partially met**:
  - Trail bucket policy lacks Deny for non‑TLS; versioning/SSE are not explicitly configured.
  - KMS key policy allows CloudTrail but is broad and not scoped with conditions to the specific trail/bucket.
  - Multi‑region trail may conflict with account limits without toggles.

- **Compliance scope limited**: Only a few AWS Config managed rules are enabled. The prompt asks to “monitor against security standards”; no conformance packs (e.g., AWS FSBP or CIS) are deployed.

- **Least‑privilege gaps**:
  - Several IAM permissions use overly broad resource ARNs (e.g., CloudWatch Logs `*`).
  - No permission boundaries or narrowly scoped inline policies for created roles.

- **Security groups allow HTTP (80)**: Web SG permits inbound HTTP. For stricter security, default to HTTPS‑only or document HTTP→HTTPS redirection.

- **Networking concerns for production**:
  - Public subnets have `map_public_ip_on_launch = false`, which is atypical for “public” subnets; naming is misleading or intent unclear.
  - NAT gateways per AZ without cost/HA toggles; no egress controls.

- **Secrets handling is illustrative**: `aws_ssm_parameter` values are hard‑coded. No guidance on CI/CD injection, rotation, or `ignore_changes`.

- **Modularity and extensibility**: The single file is monolithic. No feature toggles or structure to be “modular and easy to extend,” as requested.

- **Idempotency/limits not considered**:
  - Region‑wide constructs (multi‑region CloudTrail) can hit quotas; no toggles to reuse existing resources or skip.

- **Outputs misaligned**: Outputs focus on networking; they don’t expose hardened artifacts (e.g., enforced bucket names/ARNs) useful for validation.

- **Policy/detail issues**:
  - CloudTrail bucket policy lacks strict `s3:PutObject` conditions (expected prefixes/ACLs) and Deny for incorrect ACL.
  - KMS key policy is broad; lacks least‑privilege scoping per service principal.

- **No explicit region guard**: There is no precondition/guard to prevent deployment in disallowed regions.

- **GuardDuty org/admin missing**: Only a detector is created; no admin/member configuration for multi‑account setups.

- **AWS Config delivery completeness**: No SNS notifications; recorder role relies on a managed policy without tight inline scoping.

- **S3 Object Ownership controls absent**: Missing `bucket_owner_preferred` or similar when services write into buckets (logs/trails).

- **No IAM console/API session MFA guardrails**: Beyond password policy, no SCP/IAM controls to enforce MFA for sensitive actions or console sign‑in.

- **Testing/validation not addressed**: Claims compliance but provides no automated validation hooks (e.g., tfsec/checkov, terraform validate/test hints).

- **Region reference inconsistency**: Uses `data.aws_region.current.name` without asserting approved regions per org standards.

- **Server access logging coverage**: Only main bucket logs to access‑logs; CloudTrail and Config buckets don’t enable server access logging.

- **KMS at‑rest coverage**: Not all log destinations explicitly specify KMS encryption on the bucket itself (CloudTrail/Config buckets).

- **Allowed CIDR intent unclear**: Defaults to RFC1918 ranges; if internet‑facing, clients would be blocked. If internal, clarify ingress architecture.

- **SSM session preferences not configured**: No Session Manager logging or preferences.

- **Public ACL/policy guardrails missing**: Beyond PAB, no deny statements for public ACLs/policies in bucket policies.

- **Randomized bucket naming without lifecycle**: Buckets per deploy via `random_id` but no lifecycle/retention guidance.

- **Example EC2 instance increases surface**: Non‑essential, lacks IMDSv2 enforcement note, hardening details, and patching/SSM docs association.

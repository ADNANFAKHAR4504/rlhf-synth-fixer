# model_failure

# Summary of failure modes

This document captures common mistakes that cause linter errors, deployment failures, or policy violations for the described e-commerce stack. It serves as a checklist to avoid regressions.

# Frequent errors and their impacts

* **Missing `Resources:` block or mis-indentation**
  Leads to `E1001` (“Additional properties unexpected”) and stops template processing.

* **Interpolations outside `Fn::Sub`**
  Using `${EnvironmentSuffix}` in plain strings triggers `E1029`. Always wrap in `!Sub` or avoid literal `${...}` in descriptions.

* **Legacy S3 `AccessControl` usage**
  Triggers `W3045`. Prefer BucketPolicy + PublicAccessBlock + OwnershipControls.

* **Plaintext DB passwords via Parameters**
  Triggers `W1011` and violates security posture. Use `ManageMasterUserPassword: true` for Aurora.

* **S3 global name collisions**
  Buckets without a unique suffix fail with `AlreadyExists`. Append a deterministic 8-char suffix derived from `AWS::StackId`.

* **Incorrect RDS Enhanced Monitoring role**
  Using `rds.amazonaws.com` instead of `monitoring.rds.amazonaws.com` or missing the `AmazonRDSEnhancedMonitoringRole` policy causes `InvalidRequest` and instance creation failure.

* **IAM wildcards**
  Violates the least-privilege constraint. Scope actions to specific ARNs (e.g., queue/topic/log-group ARNs).

* **Hardcoded networks/AZs**
  Reduces portability and causes quota conflicts. Use parameters and intrinsics (`!GetAZs`, `!Select`) for CIDRs and AZs.

* **Excessive outputs**
  Slows updates and bloats stack dependencies. Limit outputs to values consumed by other stacks/apps.

# Anti-patterns in consolidation

* **Per-service security groups** duplicated across many resources instead of shared SGs tied by reference.
* **One IAM role per Lambda** when a single consolidated role (with least-privilege policies) is sufficient.
* **Multiple near-identical ASGs** for the same tier; prefer a shared Launch Template and Mappings to express size variations.

# Recovery recommendations

* Validate schema with `cfn-lint` during authoring and fix all `E*` errors before deploys.
* Confirm S3 names are unique across regions/accounts by ensuring the suffix calculation is in place.
* Verify the RDS monitoring IAM role’s **trust principal** and **managed policy** before creating instances.
* Keep stateful resources protected with `DeletionPolicy`/`UpdateReplacePolicy` and use Secrets Manager for credentials.

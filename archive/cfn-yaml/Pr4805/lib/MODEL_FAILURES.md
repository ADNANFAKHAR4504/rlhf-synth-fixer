# model_failure

## What went wrong

1. **Missing or wrong ACM certificate ARN**

   * The stack attempted to create an HTTPS listener but the certificate did not exist in the deployment region.
   * Result: Listener creation failed with a “certificate not found” error.

2. **Misaligned S3 bucket policy for ALB access logs**

   * The bucket policy resource path did not match the configured ALB log prefix.
   * The principal for ALB log delivery was incomplete.
   * Result: ALB could not write logs and failed with “Access Denied for bucket”.

3. **S3 bucket ownership and ACL controls**

   * The logs bucket used access control without declaring ownership controls or the required ACL condition.
   * Result: Log delivery service could not apply the correct ACL; writes were rejected.

4. **Overly long or invalid bucket names**

   * Dynamically built names exceeded 63 characters or ended with a hyphen/dot, violating DNS naming rules.
   * Result: Linter warnings or runtime failures.

5. **Unreferenced or invalid parameters**

   * Parameters were defined but not used, had defaults built with intrinsics that didn’t validate against patterns, or failed allowed-pattern checks.
   * Result: Template validation and linter errors.

6. **Incorrect use of Conditions**

   * Intrinsic functions were used directly in `Condition` fields rather than referencing declared conditions.
   * Result: Linter error on the condition schema.

7. **Security group drift from requirements**

   * HTTP 80 exposed alongside HTTPS 443 or extra open ports added for “testing”.
   * Result: Requirement violation and security findings.

8. **IAM policy bloat or scope creep**

   * The inline policy exceeded the six-statement cap or granted wildcard S3 actions beyond `ListBucket`, `GetObject`, and `PutObject`.
   * Result: Requirement violation and over-privilege risk.

9. **CloudTrail or log delivery KMS complications**

   * Trails or buckets switched to KMS without the necessary key policies or service grants.
   * Result: Delivery failures and hard-to-debug errors.

## How to fix it next time

* Require a non-empty ACM ARN parameter for production HTTPS-only stacks and validate the region before deployment.
* Align ALB log prefix and the bucket policy resource path; include both recognized log-delivery principals and enforce `bucket-owner-full-control`.
* Add S3 ownership controls and encryption; keep names within DNS limits.
* Keep parameter defaults simple and pattern-compliant; remove unused parameters.
* Declare conditions centrally and reference them by name.
* Enforce the single-port policy at the SG level; no HTTP unless explicitly required for bootstrapping.
* Keep IAM statements minimal and resource-scoped to the exact bucket and its objects.
* Prefer SSE-S3 for logs unless KMS is truly needed and fully configured.

## What “good” would have looked like

* A clean, single JSON file that deploys a new VPC, subnets, NAT, ALB with HTTPS on 443 (valid ACM), application and logs buckets with versioning and encryption, least-privilege IAM for S3, and fully aligned log-delivery policies. All resources named and tagged per convention, with concise outputs for automation.

# model_failure

## Typical reasons this setup still fails

* **BucketOwnerEnforced with ACL conditions**
  Requiring `s3:x-amz-acl = bucket-owner-full-control` while Object Ownership is BucketOwnerEnforced causes S3 to reject writes.

* **Missing S3 permissions in the KMS key policy**
  Omitting `kms:Encrypt`, `kms:ReEncrypt*`, or using only `kms:GenerateDataKey` (without `*`) for `s3.amazonaws.com` prevents S3 from performing SSE-KMS on CloudTrail objects.

* **Over-tight bucket policy conditions during create**
  Using `aws:SourceArn` or strict SSE header checks can fail the create-time probe even though steady-state logging would work.

* **No `s3:GetBucketLocation` allow for CloudTrail**
  Some regions still perform this check during trail creation; missing it can trigger the same generic error.

* **Mismatched account or region**
  Bucket name embeds a different account ID than the one deploying, or the template is deployed outside `us-east-1` while the stack enforces that region.

* **Conflicting bucket-policy Deny statements**
  Broad denies that inadvertently capture CloudTrail’s write path or the service principal will block the probe.

* **Endpoint or SCP interference**
  VPC endpoint policies, service control policies, or organization SCPs that restrict S3/KMS can generate the same generic failure.

## How to recognize each failure from symptoms

* Immediate failure at trail creation with the generic “S3 or KMS” message usually points to either:

  * KMS policy missing S3 `Encrypt/ReEncrypt*/GenerateDataKey*`, or
  * Bucket policy expecting ACLs under BucketOwnerEnforced, or
  * Over-tight create-time conditions (`SourceArn`, strict SSE headers).

* If log files start but digest files fail later, that often indicates an encryption-context mismatch or partial KMS permissions.

## Remediation guidance

* Ensure the S3 `PutObject` allow for `cloudtrail.amazonaws.com` targets both valid prefixes, without ACL or fragile header conditions when BucketOwnerEnforced is on.
* Ensure the KMS key policy includes a full S3 service stanza with `Encrypt`, `ReEncrypt*`, `GenerateDataKey*`, `DescribeKey`, and `CreateGrant`, scoped with `kms:ViaService = s3.<region>.amazonaws.com` and `kms:GrantIsForAWSResource = true`.
* Keep the CloudTrail KMS stanza limited to the service via `kms:ViaService = cloudtrail.<region>.amazonaws.com` and `kms:GrantIsForAWSResource = true`, avoiding strict encryption-context predicates.
* Add an allow for `s3:GetBucketLocation` for `cloudtrail.amazonaws.com` on the log bucket.
* Confirm region and account assumptions match your naming and template restrictions.

## Non-goals

* No broad principal grants (e.g., `*`) beyond controlled service principals.
* No relaxation of TLS-only access or public access blocks.
* No structural changes to unrelated resources or naming.

# Model Failures

- **Region enforcement missing**  
  `aws.Provider("aws", region="us-east-1")` is created but **not passed** to resources — deployment could target the default provider/region.

- **S3 public-access block args invalid**  
  `block_public_acls`, `block_public_policy`, `ignore_public_acls`, `restrict_public_buckets` are set as `aws.s3.Bucket` args — those are separate `BucketPublicAccessBlock` resources, so this will fail.

- **Bucket policy contains Pulumi `Output` values (invalid JSON serialization)**  
  Policy JSON embeds `pulumi.Output.concat(...)`/Outputs and is then `json.dumps`d via `.apply` incorrectly; the produced policy will not be valid JSON or will error at runtime.

- **IP-restriction policy semantics risky**  
  The policy uses a blanket `Deny` with `NotIpAddress` but defaults in some places to broad CIDRs (and earlier drafts used `0.0.0.0/0`), making the configuration insecure or confusing.

- **S3 event notification filter fields incorrect**  
  Notification code sets `filter_prefix` / `filter_suffix` and sometimes `filter`/`filter_rules` inconsistently — `aws.s3.BucketNotification` expects filter structure under `lambda_functions` differently; this will likely misconfigure notifications.

- **Lambda permission `source_arn` may be wrong type**  
  `aws.lambda_.Permission` uses `source_arn=pulumi.Output.concat("arn:aws:s3:::", bucket_name)` — if `bucket_name` is a resource rather than literal string, the ARN composition and timing could be wrong; also `source_account` combined usage is redundant and may be unnecessary.

- **CloudFormation validation claim unsupported**  
  The prompt required the solution to pass AWS CloudFormation validation tools; the response claims this but includes **no validation steps or artifacts** (Pulumi does not automatically produce CF templates for validation), so the claim is unsubstantiated.

- **Pulumi `AssetArchive` / packaging is OK but missing deployment best-practice details**  
  Uses `FileArchive`/`AssetArchive` (good) but no handling for large dependencies, build hooks, or CI packaging steps that would be required in production.

- **Inconsistent / duplicated implementations across versions**  
  Multiple modules show different approaches to policy/notification generation (some earlier code had different logic). The final bundle contains inconsistent patterns that may cause runtime errors.

- **Lambda handler earlier version returned inside loop (partial processing)**  
  Some handler variants return after processing the first record — that would skip remaining records (logic bug).

- **No automated test or validation code provided**  
  The prompt requires the solution be "fully validated and ready for deployment" — there are **no unit/integration tests, Pulumi policy checks, or validation steps** included.

- **Minor IAM concerns not proven least-privilege**  
  Policies are broad in places (e.g., `s3:ListBucket` on whole bucket ARN without explicit condition on prefixes) and there is **no IAM policy review/validation** to prove strict least-privilege.

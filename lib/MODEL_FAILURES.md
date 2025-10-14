# Failures

- **Region enforcement missing**  
  An `aws.Provider` is created (`aws_provider = aws.Provider("aws", region=AWS_REGION)`) but **not passed** to resources—resources may be deployed to the default provider/region instead of guaranteed `us-west-2`.

- **S3 public-access block used incorrectly**  
  `block_public_acls`, `block_public_policy`, `ignore_public_acls`, `restrict_public_buckets` are passed directly as `aws.s3.Bucket` args. These belong in an `aws.s3.BucketPublicAccessBlock` resource (or properly supported attr) — the current usage is invalid/ignored.

- **S3 bucket name uniqueness risk**  
  Bucket name `f"{APP_NAME}-logs"` is static and not made unique (no stack/account suffix), risking naming collisions across accounts/regions.

- **IAM least-privilege claim is weak / incomplete**  
  The EC2 role only gets a custom S3 policy and a role created, but there is no demonstration of a narrow, audit-ready least-privilege model (e.g., no scoped permissions for other operational needs, no explicit denial paths, and no proof the role avoids extra broad managed policies).

- **Provider not applied to modules/resources**  
  Modules/functions create resources without accepting or using the `aws_provider` object; this makes region/credential scoping unreliable.

- **LaunchTemplate user_data handling ambiguous**  
  User-data is base64-encoded manually and passed as `user_data` on the launch template — Pulumi/AWS typically accept a plaintext user_data string and handle encoding; manual encoding may be unnecessary or lead to double-encoding issues.

- **ASG tag propagation duplication/ambiguity**  
  Tags are added both via a separate `Name` GroupTag and by iterating `common_tags`, which can duplicate keys or create inconsistent propagated tag values.

- **No explicit CloudWatch LogGroup/retention for instances**  
  The solution does not create or configure LogGroups/retention for instance/system logs (useful for auditing and meeting operational log retention policies).

- **Resource naming/ID usage inconsistencies**  
  Several places use `.id` vs `.arn` vs `.name` inconsistently (e.g., exports use `logs_bucket.id` instead of the canonical bucket name in places), which could confuse downstream automation.

- **Modularity mismatch**  
  While code is split into modules, many modules rely on implicit global config/constants rather than accepting explicit parameters (e.g., provider, tags, naming), reducing reusability in multi-stack/multi-account contexts.

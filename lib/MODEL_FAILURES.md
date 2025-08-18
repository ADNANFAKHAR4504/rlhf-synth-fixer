Known deployment failures and resolutions (reflecting current `tap_stack.tf`):

1) S3 Replication InvalidRequest: DeleteMarkerReplication must be specified
- Error: PutBucketReplication 400 InvalidRequest
- Resolution: Added `delete_marker_replication { status = "Enabled" }` inside `aws_s3_bucket_replication_configuration.primary.rule`.

2) DynamoDB Global Table CMK unsupported (v2017.11.29)
- Error: ValidationException: Customer Managed CMKs on Global Table v2017.11.29 replicas are not supported
- Resolution: Removed `aws_dynamodb_global_table` and provisioned regional tables only with AWS-managed SSE (no CMK). Note: this removes cross‑region replication for now.

3) RDS DBInstanceAlreadyExists
- Error: DBInstanceAlreadyExists for `primary-database`
- Resolution: Appended the random suffix to RDS `identifier` values to avoid name collisions.

4) CloudTrail InsufficientEncryptionPolicyException
- Error: Insufficient permissions to access logging S3 bucket or KMS key when creating trails
- Resolution:
  - KMS: Updated KMS key policies (both regions) to allow CloudTrail service principal actions (GenerateDataKey*/Encrypt/Decrypt/ReEncrypt*/CreateGrant/DescribeKey) with `StringLike` on `kms:EncryptionContext:aws:cloudtrail:arn` for this account’s trail ARNs.
  - S3: Tightened logging bucket policy to the CloudTrail-required resources and context:
    - `s3:GetBucketAcl` and `s3:GetBucketLocation` with `Condition.StringEquals.AWS:SourceArn` for primary/secondary trail ARNs
    - `s3:PutObject` to `${bucket_arn}/AWSLogs/${account_id}/*` with `Condition.StringEquals` including `s3:x-amz-acl = bucket-owner-full-control` and `AWS:SourceArn` for the same ARNs
  - Cross-region: Forced `aws_cloudtrail.secondary.kms_key_id` to use the primary-region KMS key because logs land in the primary-region logging bucket.

Operational toggles used to unblock account limits:
- `create_vpcs` and `create_cloudtrail` variables can be set to `false` in constrained accounts.
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
- Resolution: Added a KMS key policy on KMS keys to allow the `cloudtrail.amazonaws.com` service principal to use the key (Encrypt/Decrypt/GenerateDataKey*/DescribeKey/ReEncrypt*/CreateGrant) with appropriate conditions. Recommendation: keep both trails using the primary‑region KMS key when the logging bucket is in `us-east-1` to avoid cross‑region KMS/S3 mismatches.

Operational toggles used to unblock account limits:
- `create_vpcs` and `create_cloudtrail` variables can be set to `false` in constrained accounts.
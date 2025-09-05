can you provide the code snippet to fix this issue -

```

│ Error: creating S3 Bucket (tap-stack-primary-c01jpolc) Replication Configuration: operation error S3: PutBucketReplication, https response error StatusCode: 400, RequestID: 8JHBV0ZD6E9JASMA, HostID: MO881RK9c6z7TSw+f7U4RYkZRAONN+ofOzh5MtHJoXYWSq8sIc/Yki4MSa1xK+KL4IO3FSaiE+Q=, api error InvalidRequest: SseKmsEncryptedObjects must be specified if EncryptionConfiguration is present.
│ 
│   with aws_s3_bucket_replication_configuration.primary_to_secondary,
│   on tap_stack.tf line 1059, in resource "aws_s3_bucket_replication_configuration" "primary_to_secondary":
│ 1059: resource "aws_s3_bucket_replication_configuration" "primary_to_secondary" {
│ 
╵
Error: Terraform exited with code 1.
❌ All deployment attempts failed. Check for state lock issues.

```

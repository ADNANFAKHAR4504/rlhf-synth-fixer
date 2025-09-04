```hcl
Warning: Argument is deprecated
│ 
│   with aws_s3_bucket.logs,
│   on tap_stack.tf line 175, in resource "aws_s3_bucket" "logs":
│  175: resource "aws_s3_bucket" "logs" {
│ 
│ versioning is deprecated. Use the aws_s3_bucket_versioning resource instead.
╵
╷
│ Error: creating EC2 Network ACL: to_port (65535) and from_port (0) must both be 0 to use the 'all' "-1" protocol!
│ 
│   with aws_network_acl.main,
│   on tap_stack.tf line 105, in resource "aws_network_acl" "main":
│  105: resource "aws_network_acl" "main" {
│ 
╵
╷
│ Error: creating S3 Bucket (my-log-bucket-us-west-2) ACL: operation error S3: PutBucketAcl, https response error StatusCode: 400, RequestID: Q7F3RTHX8B8VB6BT, HostID: 8Hoc85pdKo4EvT2Q+KvfbI7G+XZxHgQFDp8MgzIFTZis2vBb1pcefZh4P9KlhBLEqo8qLD1GedNB1yjchlmmjA==, api error AccessControlListNotSupported: The bucket does not allow ACLs
│ 
│   with aws_s3_bucket_acl.logs_acl,
│   on tap_stack.tf line 190, in resource "aws_s3_bucket_acl" "logs_acl":
│  190: resource "aws_s3_bucket_acl" "logs_acl" {
```
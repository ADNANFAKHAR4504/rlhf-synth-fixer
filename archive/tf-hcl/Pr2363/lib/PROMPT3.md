Can you fix below new errors now for the s3 bucket versioning in the above provideed code -
```
aws_s3_bucket_versioning.ap_southeast_1: Creating...
aws_s3_bucket_replication_configuration.us_to_ap: Creating...
aws_iam_role_policy.replication: Creation complete after 0s [id=tap-Production-s3-replication-role:tap-Production-s3-replication-policy]
aws_iam_role_policy.lambda_s3_access: Creation complete after 0s [id=tap-Production-lambda-s3-access-role:tap-Production-lambda-s3-access-policy]
aws_s3_bucket_server_side_encryption_configuration.ap_southeast_1: Creation complete after 1s [id=tap-production-bucket-ap-southeast-1]
aws_s3_bucket_public_access_block.ap_southeast_1: Creation complete after 1s [id=tap-production-bucket-ap-southeast-1]
aws_s3_bucket_versioning.ap_southeast_1: Creation complete after 3s [id=tap-production-bucket-ap-southeast-1]
╷
│ Error: creating S3 Bucket (tap-production-bucket-us-east-1) Replication Configuration: operation error S3: PutBucketReplication, https response error StatusCode: 400, RequestID: SAXTXWQGD2DPWBG4, HostID: mVn6Xr5OSG+Fatte5Rpi6qCtQ05JpdFDveCWNXDU6nS3Ab8MGLpcmUCftc4BteEt1YJx7MPlKjc=, api error InvalidRequest: Destination bucket must have versioning enabled.
│ 
│   with aws_s3_bucket_replication_configuration.us_to_eu,
│   on tap_stack.tf line 263, in resource "aws_s3_bucket_replication_configuration" "us_to_eu":
│  263: resource "aws_s3_bucket_replication_configuration" "us_to_eu" {
│ 
╵
╷
│ Error: creating S3 Bucket (tap-production-bucket-us-east-1) Replication Configuration: operation error S3: PutBucketReplication, https response error StatusCode: 400, RequestID: 9386HR500AYGCFA2, HostID: 2IWR8OQdDQzmwewtf82m9MiSZvOG5Bplmt2OOQvY4Btj6K+qvkCMAFRICPd7UCGTTuuSWvMvya8=, api error InvalidRequest: Destination bucket must have versioning enabled.
│ 
│   with aws_s3_bucket_replication_configuration.us_to_ap,
│   on tap_stack.tf line 282, in resource "aws_s3_bucket_replication_configuration" "us_to_ap":
│  282: resource "aws_s3_bucket_replication_configuration" "us_to_ap" {
│ 
╵
Error: Terraform exited with code 1.
Error: Process completed with exit code 1.
```

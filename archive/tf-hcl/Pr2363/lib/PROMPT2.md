Getting these errors, can you help resolving these errros and provide the updated code
```
aws_s3_bucket.ap_southeast_1: Creating...
╷
│ Error: creating S3 Bucket (tap-Production-bucket-us-east-1): operation error S3: CreateBucket, https response error StatusCode: 400, RequestID: 3ATD4JKYER2290Z7, HostID: AzWI54FyQyLdxzPtYrD009zoU3wpdpU9iJ2u4tPNBdvNWBhJGgkhtF2/O9063DSgKiEARxe8+Xc=, api error InvalidBucketName: The specified bucket is not valid.
│ 
│   with aws_s3_bucket.us_east_1,
│   on tap_stack.tf line 56, in resource "aws_s3_bucket" "us_east_1":
│   56: resource "aws_s3_bucket" "us_east_1" {
│ 
╵
╷
│ Error: validating S3 Bucket (tap-Production-bucket-eu-west-1) name: only lowercase alphanumeric characters and hyphens allowed in "tap-Production-bucket-eu-west-1"
│ 
│   with aws_s3_bucket.eu_west_1,
│   on tap_stack.tf line 102, in resource "aws_s3_bucket" "eu_west_1":
│  102: resource "aws_s3_bucket" "eu_west_1" {
│ 
╵
╷
│ Error: validating S3 Bucket (tap-Production-bucket-ap-southeast-1) name: only lowercase alphanumeric characters and hyphens allowed in "tap-Production-bucket-ap-southeast-1"
│ 
│   with aws_s3_bucket.ap_southeast_1,
│   on tap_stack.tf line 148, in resource "aws_s3_bucket" "ap_southeast_1":
│  148: resource "aws_s3_bucket" "ap_southeast_1" {
│ 
╵
Error: Terraform exited with code 1.
Error: Process completed with exit code 1.
```

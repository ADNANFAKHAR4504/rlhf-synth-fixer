The previous response has issues in the resources, It has following errors

Error: Invalid resource type
│ 
│   on tap_stack.tf line 305, in resource "aws_s3_bucket_encryption_configuration" "secure_bucket_encryption":
│  305: resource "aws_s3_bucket_encryption_configuration" "secure_bucket_encryption" {
│ 
│ The provider hashicorp/aws does not support resource type
│ "aws_s3_bucket_encryption_configuration".
╵
╷
│ Error: Invalid resource type
│ 
│   on tap_stack.tf line 349, in resource "aws_s3_bucket_encryption_configuration" "cloudtrail_bucket_encryption":
│  349: resource "aws_s3_bucket_encryption_configuration" "cloudtrail_bucket_encryption" {
│ 
│ The provider hashicorp/aws does not support resource type
│ "aws_s3_bucket_encryption_configuration".
╵
╷
│ Error: Invalid resource type
│ 
│   on tap_stack.tf line 539, in resource "aws_s3_bucket_encryption_configuration" "config_bucket_encryption":
│  539: resource "aws_s3_bucket_encryption_configuration" "config_bucket_encryption" {
│ 
│ The provider hashicorp/aws does not support resource type
│ "aws_s3_bucket_encryption_configuration".
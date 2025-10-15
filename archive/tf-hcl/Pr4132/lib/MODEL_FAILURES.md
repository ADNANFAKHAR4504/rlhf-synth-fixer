1. Model used wrong s3 resource which is not as per AWS and deployment failed.

2. Model used wrong encryption which failed the deployment.
```
│ Error: Invalid resource type
│ 
│   on tap_stack.tf line 374, in resource "aws_s3_bucket_encryption" "primary":
│  374: resource "aws_s3_bucket_encryption" "primary" {
│ 
│ The provider hashicorp/aws does not support resource type
│ "aws_s3_bucket_encryption".
╵
╷
│ Error: Invalid resource type
│ 
│   on tap_stack.tf line 680, in resource "aws_s3_bucket_encryption" "secondary":
│  680: resource "aws_s3_bucket_encryption" "secondary" {
│ 
│ The provider hashicorp/aws does not support resource type
│ "aws_s3_bucket_encryption".

```

╷
│ Error: Terraform encountered problems during initialisation, including problems
│ with the configuration, described below.
│ 
│ The Terraform configuration must be valid before initialization so that
│ Terraform can determine which modules and providers need to be installed.
│ 
│ 
╵
╷
│ Error: Missing name for resource
│ 
│   on main.tf line 247, in resource "aws_s3_bucket_encryption":
│  247: resource "aws_s3_bucket_encryption" {
│ 
│ All resource blocks must have 2 labels (type, name).

it got failed on deploy. can you fix this issue?
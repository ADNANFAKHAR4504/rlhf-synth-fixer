```

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
│ Error: Duplicate resource "aws_s3_bucket_public_access_block" configuration
│ 
│   on tap_stack.tf line 702:
│  702: resource "aws_s3_bucket_public_access_block" "app_data" {
│ 
│ A aws_s3_bucket_public_access_block resource named "app_data" was already
│ declared at tap_stack.tf:533,1-56. Resource names must be unique per type
│ in each module.
╵
Error: Terraform exited with code 1.
Error: Process completed with exit code 1.

```

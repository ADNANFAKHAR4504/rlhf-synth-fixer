*** Flaw 1 ***
│ Warning: Reference to undefined provider
│ 
│   on tap_stack.tf line 124, in module "vpc_us_east_1":
│  124:     aws = aws.us_east_1
│ 
│ There is no explicit declaration for local provider name "aws" in module.vpc_us_east_1, so Terraform is assuming you mean to pass a
│ configuration for "hashicorp/aws".
│ 
│ If you also control the child module, add a required_providers entry named "aws" with the source address "hashicorp/aws".
│ 
│ (and 7 more similar warnings elsewhere)

*** Flaw 2 ***
 Warning: Reference to undefined provider
│ 
│   on tap_stack.tf line 213, in module "s3":
│  213:     aws.us_east_1 = aws.us_east_1
│ 
│ There is no explicit declaration for local provider name "aws.us_east_1" in module.s3, so
│ Terraform is assuming you mean to pass a configuration for "hashicorp/aws".
│ 
│ If you also control the child module, add a required_providers entry named "aws.us_east_1"
│ with the source address "hashicorp/aws".
│ 
│ (and one more similar warning elsewhere)

*** Flaw 3 ***
 Error: expected enabled_cloudwatch_logs_exports.2 to be one of ["agent" "alert" "audit" "diag.log" "error" "general" "iam-db-auth-error" "listener" "notify.log" "oemagent" "postgresql" "slowquery" "trace" "upgrade"], got slow_query
│ 
│   with module.rds_us_west_2.aws_db_instance.main,
│   on modules/rds/main.tf line 108, in resource "aws_db_instance" "main":
│  108:   enabled_cloudwatch_logs_exports = ["error", "general", "slow_query"]
│ 
╵
╷
│ Error: expected enabled_cloudwatch_logs_exports.2 to be one of ["agent" "alert" "audit" "diag.log" "error" "general" "iam-db-auth-error" "listener" "notify.log" "oemagent" "postgresql" "slowquery" "trace" "upgrade"], got slow_query
│ 
│   with module.rds_us_east_1.aws_db_instance.main,
│   on modules/rds/main.tf line 108, in resource "aws_db_instance" "main":
│  108:   enabled_cloudwatch_logs_exports = ["error", "general", "slow_query"]
│ 
╵
╷
│ Error: Reference to undeclared resource
│ 
│   on modules/s3/outputs.tf line 3, in output "app_data_bucket_us_east_1":
│    3:   value       = aws_s3_bucket.app_data_us_east_1.bucket
│ 
│ A managed resource "aws_s3_bucket" "app_data_us_east_1" has not been declared in module.s3.
╵
╷
│ Error: Reference to undeclared resource
│ 
│   on modules/s3/outputs.tf line 8, in output "app_data_bucket_us_west_2":
│    8:   value       = aws_s3_bucket.app_data_us_west_2.bucket
│ 
│ A managed resource "aws_s3_bucket" "app_data_us_west_2" has not been declared in module.s3.
╵
╷
│ Error: Reference to undeclared resource
│ 
│   on modules/s3/outputs.tf line 13, in output "cloudtrail_bucket_name":
│   13:   value       = aws_s3_bucket.cloudtrail.bucket
│ 
│ A managed resource "aws_s3_bucket" "cloudtrail" has not been declared in module.s3.

*** Flaw 4 ***
 on tap_stack.tf line 166, in module "vpc_us_east_1":
│  166:     aws = aws.us_east_1
│ 
│ There is no explicit declaration for local provider name "aws" in module.vpc_us_east_1, so Terraform is assuming you mean to pass a
│ configuration for "hashicorp/aws".
│ 
│ If you also control the child module, add a required_providers entry named "aws" with the source address "hashicorp/aws".
│ 
│ (and 7 more similar warnings elsewhere)
╵
╷
│ Error: Output refers to sensitive values
│ 
│   on tap_stack.tf line 504:
│  504: output "db_password_generated" {
│ 
│ To reduce the risk of accidentally exporting sensitive data that was intended to be only internal, Terraform requires that any root module
│ output containing sensitive data be explicitly marked as sensitive, to confirm your intent.
│ 
│ If you do intend to export this data, annotate the output value as sensitive by adding the following argument:
│     sensitive = true